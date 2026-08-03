// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useEffect, memo } from "react";
import { Check, X } from "lucide-react";
import { T, FS, RADIUS } from "../../theme";

const UndoToast = memo(function UndoToast({ toast, onUndo, onDismiss }) {
  const isSuccess = toast?.type === "success";
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, isSuccess ? 2600 : 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss, isSuccess]);
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: 22, transform: "translateX(-50%)", zIndex: 320,
      display: "flex", alignItems: "center", gap: 14,
      background: isSuccess ? "#14532d" : "#211c33", color: "#fff",
      padding: isSuccess ? "10px 16px" : "10px 8px 10px 16px", borderRadius: RADIUS.sm,
      boxShadow: "0 12px 30px rgba(20,16,32,0.35)", fontSize: FS.base, fontWeight: 600, maxWidth: "90vw",
      animation: "hzToastIn 0.22s ease",
    }}>
      {isSuccess && (
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: T.gain, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "hzCheckPop 0.3s ease" }}>
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{toast.message}</span>
      {!isSuccess && <button onClick={onUndo} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: FS.base, fontWeight: 700, padding: "4px 6px", whiteSpace: "nowrap" }}>↺ Deshacer</button>}
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: isSuccess ? "#86efac" : "#8b8698", cursor: "pointer", display: "flex", padding: 4 }} title="Cerrar notificación" aria-label="Cerrar notificación"><X size={13} /></button>
    </div>
  );
});


export { UndoToast };
