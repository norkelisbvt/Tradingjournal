const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loadData: () => ipcRenderer.invoke("load-data"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),

  // Auto-actualización: el renderer se suscribe a los eventos que manda
  // main.js (checking/available/downloading/downloaded/error) para mostrar
  // su propio banner, y puede pedir reiniciar para instalar la actualización
  // ya descargada.
  onUpdateStatus: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("update-status", listener);
    return () => ipcRenderer.removeListener("update-status", listener);
  },
  restartToUpdate: () => ipcRenderer.invoke("restart-app-to-update"),

  // Avisa a main.js qué tema (claro/oscuro) está activo, para que la overlay
  // de la barra de título en Windows (botones minimizar/maximizar/cerrar)
  // cambie de color junto con el resto de la interfaz.
  setThemeMode: (mode) => ipcRenderer.send("set-theme-mode", mode),
});
