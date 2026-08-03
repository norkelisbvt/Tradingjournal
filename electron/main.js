const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

// !app.isPackaged a veces no alcanza corriendo "electron ." directo en
// Windows — se suma process.defaultApp, que Electron sí pone en true de
// forma confiable en ese escenario (solo es false cuando corre un .exe
// empaquetado de verdad).
const isDev = !app.isPackaged || !!process.defaultApp;
console.log("[main] isDev =", isDev, "| isPackaged =", app.isPackaged, "| defaultApp =", !!process.defaultApp);

const DATA_FILE = path.join(app.getPath("userData"), "trading-journal-data.json");
const WINDOW_STATE_FILE = path.join(app.getPath("userData"), "window-state.json");

// AJUSTAR si tu carpeta build/ (con icon.ico / icon.png) no queda un nivel
// arriba de este archivo.
const ICON_PATH = path.join(
  __dirname,
  "../build",
  process.platform === "win32" ? "icon.ico" : "icon.png"
);

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error leyendo datos:", err);
  }
  return null;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

ipcMain.handle("load-data", () => loadData());
ipcMain.handle("save-data", (_event, data) => {
  saveData(data);
  return true;
});

// ── Auto-actualización ───────────────────────────────────────────────────────
// Usa electron-updater (requiere "publish" configurado en package.json, ver
// nota al final del archivo). En vez de los diálogos nativos genéricos de
// electron-updater, mandamos cada evento al renderer por IPC para que la app
// muestre su propio banner con el mismo diseño del resto de la interfaz.
// No corre en desarrollo: no hay build empaquetada ni feed de releases al
// correr "electron ." contra localhost:5173.
function setupAutoUpdater(win) {
  if (isDev) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (status, extra = {}) => {
    if (!win.isDestroyed()) win.webContents.send("update-status", { status, ...extra });
  };

  autoUpdater.on("checking-for-update", () => send("checking"));
  autoUpdater.on("update-available", (info) => send("available", { version: info?.version }));
  autoUpdater.on("update-not-available", () => send("not-available"));
  autoUpdater.on("download-progress", (p) => send("downloading", { percent: Math.round(p.percent) }));
  autoUpdater.on("update-downloaded", (info) => send("downloaded", { version: info?.version }));
  autoUpdater.on("error", (err) => {
    console.error("[auto-update] error:", err == null ? "unknown" : err.stack || err.message || err);
    send("error");
  });

  // Primer chequeo poco después de abrir (no compite con la carga inicial),
  // y después cada 4 horas — para sesiones largas sin tener que reabrir la app.
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 8000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}

// El botón "Reiniciar y actualizar" del banner en el renderer llama a esto.
ipcMain.handle("restart-app-to-update", () => {
  autoUpdater.quitAndInstall();
});

// El renderer llama a esto cada vez que cambia de tema (claro/oscuro), para
// que los botones de minimizar/maximizar/cerrar (dibujados por Windows sobre
// la overlay, no por nuestro CSS) cambien de color junto con el resto de la
// interfaz. setTitleBarOverlay solo existe en win32 con titleBarStyle:"hidden";
// en mac/Linux no hace nada (los semáforos nativos ya se adaptan solos).
ipcMain.on("set-theme-mode", (event, mode) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    saveWindowState(win, mode);
    if (process.platform === "win32" && typeof win.setTitleBarOverlay === "function") {
      win.setTitleBarOverlay({ ...(TITLEBAR_COLORS[mode] || TITLEBAR_COLORS.dark), height: 40 });
    }
  }
});


function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_FILE)) {
      const s = JSON.parse(fs.readFileSync(WINDOW_STATE_FILE, "utf-8"));
      if (s && typeof s.width === "number" && typeof s.height === "number") return s;
    }
  } catch (err) {
    console.error("Error leyendo el estado de la ventana:", err);
  }
  return { width: 1400, height: 900 };
}

function saveWindowState(win, themeMode) {
  try {
    const prev = loadWindowState();
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    const themeToSave = themeMode || prev.themeMode || "dark";
    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify({ ...bounds, isMaximized, themeMode: themeToSave }), "utf-8");
  } catch (err) {
    console.error("Error guardando el estado de la ventana:", err);
  }
}

// ── Barra de título nativa "personalizada" (ver nota larga en main.dev.js) ──
// Colores de la overlay (Windows) según el tema: en oscuro, fondo oscuro con
// símbolos blancos; en claro, fondo blanco con símbolos negros. Antes esto
// quedaba fijo en los tonos oscuros sin importar el tema de la app, así que
// los botones de minimizar/cerrar se veían iguales en modo claro y oscuro.
const TITLEBAR_COLORS = {
  dark: { color: "#171325", symbolColor: "#ffffff" },
  light: { color: "#ffffff", symbolColor: "#1e1b2e" },
};

function titleBarOptions(themeMode = "dark") {
  if (process.platform === "darwin") {
    // 'hidden' (no 'hiddenInset') + trafficLightPosition para poder mover los
    // semáforos nativos a la derecha del rail lateral de 72px de la app — con
    // 'hiddenInset' quedan pegados a la izquierda y tapan el ícono del rail.
    return { titleBarStyle: "hidden", trafficLightPosition: { x: 84, y: 13 } };
  }
  if (process.platform === "win32") {
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: { ...TITLEBAR_COLORS[themeMode], height: 40 },
    };
  }
  return {}; // Linux: barra de título nativa por defecto
}

function createWindow() {
  const state = loadWindowState();

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 960,
    minHeight: 640,
    title: "Trading Journal",
    icon: ICON_PATH,
    backgroundColor: state.themeMode === "light" ? "#ffffff" : "#0d0b16",
    show: false,
    ...titleBarOptions(state.themeMode || "dark"),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (state.isMaximized) win.maximize();
  win.once("ready-to-show", () => win.show());

  // Atajo global para DevTools, además del F12/Ctrl+Shift+I normal: como esta
  // ventana usa titleBarOverlay (barra de título personalizada), a veces esas
  // teclas no le llegan bien al webContents. Un atajo global del sistema
  // operativo no depende de eso — funciona sí o sí mientras la ventana esté
  // enfocada. Ctrl+Alt+Shift+I para no pisar el F12 normal.
  globalShortcut.register("CommandOrControl+Alt+Shift+I", () => {
    if (win.isDestroyed()) return;
    win.webContents.toggleDevTools();
  });
  win.on("closed", () => globalShortcut.unregister("CommandOrControl+Alt+Shift+I"));
  setupAutoUpdater(win);

  // Espeja la consola del renderer (errores, warnings, console.log de React)
  // acá en la terminal. Sin esto, un error de JS que deja la pantalla en
  // blanco es invisible salvo que abras DevTools — y en producción F12 está
  // bloqueado a propósito (ver más abajo), así que esta es la única forma de
  // diagnosticar un problema en ese caso.
  const CONSOLE_LEVELS = ["log", "warn", "error"]; // índice = nivel que manda Electron (0-3, tratamos 3 como error)
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const tag = CONSOLE_LEVELS[level] || "error";
    const location = sourceId ? ` (${sourceId.split("/").pop()}:${line})` : "";
    console[tag === "warn" ? "warn" : tag === "error" ? "error" : "log"](`[renderer:${tag}]${location} ${message}`);
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[main] La ventana se cerró/crasheó inesperadamente:", details);
  });

  let saveTimeout = null;
  const scheduleSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win), 400);
  };
  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);
  win.on("close", () => saveWindowState(win));

  // Diagnóstico de carga: si Vite todavía no levantó (modo dev) o falta la
  // carpeta dist/ (modo empaquetado), la página nunca llega a cargar — y en
  // ese caso NUNCA va a aparecer un [renderer:error], porque no hay ningún
  // JS de React corriendo todavía para loguear nada. Esto lo detecta aparte.
  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[main] FALLÓ LA CARGA (${errorCode} ${errorDescription}) de: ${validatedURL}`);
    if (isDev) {
      console.error("[main] ¿Está corriendo 'npm run dev' (Vite) en el puerto 5173? Si tarda en levantar, Electron puede intentar conectarse antes de que esté listo.");
    } else {
      console.error("[main] ¿Existe dist/index.html? Corré el build de producción (ej. 'npm run build') antes de empaquetar/abrir así.");
    }
  });
  win.webContents.on("did-finish-load", () => {
    console.log("[main] Página cargada OK.");
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // DevTools: antes se abría solo (mode: "detach") cada vez que corrías en
  // modo desarrollo, y de paso disparaba el banner nativo de Chrome ("DevTools
  // is now available in Spanish..."). Ahora NO se abre automáticamente ni en
  // dev — si la necesitás abrí manualmente con F12/Ctrl+Shift+I (dev), o
  // corré con OPEN_DEVTOOLS=1 delante del comando si querés que se abra sola.
  if (isDev && process.env.OPEN_DEVTOOLS === "1") {
    win.webContents.openDevTools({ mode: "right" }); // acoplado, no ventana aparte — evita que quede oculta/fuera de pantalla
  } else if (!isDev) {
    win.webContents.on("before-input-event", (event, input) => {
      const key = input.key.toLowerCase();
      if (key === "f12" || ((input.control || input.meta) && input.shift && key === "i")) {
        event.preventDefault();
      }
    });
  }

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── IMPORTANTE: configuración pendiente en package.json ─────────────────────
// electron-updater necesita saber DÓNDE están tus releases. Agregá a tu
// package.json (junto a la config de electron-builder que ya tengas):
//
//   "build": {
//     "publish": {
//       "provider": "github",       // o "generic" con una "url" propia, S3, etc.
//       "owner": "TU_USUARIO",
//       "repo": "TU_REPO"
//     }
//   }
//
// Y subí cada release con `electron-builder --publish always` (o desde tu CI)
// para que genere el archivo latest.yml / latest-mac.yml junto a los
// instaladores — sin eso, checkForUpdates() nunca va a encontrar nada nuevo.
// También instalá la dependencia: npm install electron-updater