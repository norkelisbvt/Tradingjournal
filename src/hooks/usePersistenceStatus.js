import { useState } from "react";

// Estado relacionado a guardar/cargar datos — el grupo de mayor riesgo de
// todo el refactor, porque `loaded` es el "portón" que controla cuándo se
// puede empezar a guardar (evita pisar datos reales con el estado inicial
// vacío antes de que termine de cargar desde disco/nube), cuándo se hace el
// pull inicial de la nube, y cuándo se muestra el splash screen.
//
// Importante: este hook SOLO extrae las declaraciones de estado — todos los
// useEffect que leen/escriben estos valores (el guardado automático, el pull
// de Supabase, el chequeo de recordatorio de backup) se quedan tal cual en
// TradingJournalInner.jsx, sin tocar ni una línea de su lógica. Es la misma
// técnica que los 4 hooks anteriores (useUIModals, useNavigationView,
// useTradeFilters, useConfigurableLists) — lo único que cambia acá es que el
// GRUPO en sí es más sensible, no la forma de extraerlo.
export function usePersistenceStatus() {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved"

  // Guarda el último fallo de autoguardado (si lo hay) para mostrarlo como
  // banner persistente en vez de solo un console.error silencioso. "quota"
  // distingue el caso de que localStorage se haya quedado sin espacio (el
  // riesgo real a largo plazo con historiales grandes + imágenes), porque
  // ahí sí hay una acción de rescate útil (descargar respaldo en archivo).
  const [saveError, setSaveError] = useState(null); // { type: "quota" | "other", message }
  const [saveErrorDismissed, setSaveErrorDismissed] = useState(false);

  // Recordatorio periódico de respaldo: guarda cuándo fue el último respaldo real,
  // para poder avisar cada 7 días si no se ha vuelto a respaldar.
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [backupBannerDismissed, setBackupBannerDismissed] = useState(false);

  // Estado de auto-actualización (viene de main.js vía IPC): null mientras no
  // hay nada relevante que mostrar; "available"/"downloading"/"downloaded"/
  // "error" cuando sí. No existe en el navegador (solo Electron empaquetado).
  // El useEffect que lo suscribe a window.api.onUpdateStatus se queda en
  // TradingJournalInner.jsx — acá solo vive el useState.
  const [updateStatus, setUpdateStatus] = useState(null);

  return {
    loaded, setLoaded,
    saveStatus, setSaveStatus,
    saveError, setSaveError,
    saveErrorDismissed, setSaveErrorDismissed,
    lastBackupAt, setLastBackupAt,
    backupBannerDismissed, setBackupBannerDismissed,
    updateStatus, setUpdateStatus,
  };
}
