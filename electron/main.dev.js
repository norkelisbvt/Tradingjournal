const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

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

// ── Recordar tamaño/posición de ventana ─────────────────────────────────────
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

function saveWindowState(win) {
  try {
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify({ ...bounds, isMaximized }), "utf-8");
  } catch (err) {
    console.error("Error guardando el estado de la ventana:", err);
  }
}

// ── Barra de título nativa "personalizada" ──────────────────────────────────
// En vez de construir botones de minimizar/maximizar/cerrar a mano (lo que
// exigiría tocar preload.js y arriesgarse a que se vean/comporten distinto
// al resto del sistema operativo), se usa la barra de título oculta que trae
// Electron: el SO sigue dibujando los controles nativos, pero se les puede
// dar el color de marca. Se resuelve distinto por plataforma:
//  - macOS: 'hiddenInset' — los semáforos nativos quedan flotando sobre el
//    contenido, look nativo típico de apps como Notion/Linear en Mac, cero
//    código extra necesario.
//  - Windows: 'hidden' + titleBarOverlay — Windows dibuja sus propios botones
//    min/max/cerrar, pero con el color de fondo de tu marca en vez del gris
//    por defecto.
//  - Linux: se deja la barra de título nativa tal cual (el soporte de
//    titleBarOverlay en Linux es inconsistente entre entornos de escritorio;
//    forzarlo ahí puede dejar la ventana sin forma de cerrarla).
function titleBarOptions() {
  if (process.platform === "darwin") {
    // 'hidden' (no 'hiddenInset') + trafficLightPosition para poder mover los
    // semáforos nativos a la derecha del rail lateral de 72px de la app — con
    // 'hiddenInset' quedan pegados a la izquierda y tapan el ícono del rail.
    return { titleBarStyle: "hidden", trafficLightPosition: { x: 84, y: 13 } };
  }
  if (process.platform === "win32") {
    return {
      titleBarStyle: "hidden",
      titleBarOverlay: { color: "#171325", symbolColor: "#ffffff", height: 40 },
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
    backgroundColor: "#0d0b16",
    show: false,
    ...titleBarOptions(),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (state.isMaximized) win.maximize();
  win.once("ready-to-show", () => win.show());

  let saveTimeout = null;
  const scheduleSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win), 400);
  };
  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);
  win.on("close", () => saveWindowState(win));

  win.loadURL("http://localhost:5173");
  win.webContents.openDevTools({ mode: "detach" }); // siempre en desarrollo

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
