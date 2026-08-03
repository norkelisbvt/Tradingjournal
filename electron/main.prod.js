const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

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

// ── Barra de título nativa "personalizada" (ver nota larga en main.dev.js) ──
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

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // DevTools solo en desarrollo. En la build empaquetada final, F12 y
  // Ctrl/Cmd+Shift+I quedan bloqueados para que se sienta como una app
  // terminada y no como una página a medio armar.
  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  } else {
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
