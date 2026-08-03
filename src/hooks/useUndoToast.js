// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useCallback } from "react";

function useUndoToast() {
  const [toast, setToast] = useState(null); // { message, restore?, type? }
  const pushUndo = useCallback((message, restore) => setToast({ message, restore, type: "undo" }), []);
  const pushSuccess = useCallback((message) => setToast({ message, type: "success" }), []);
  const dismiss = useCallback(() => setToast(null), []);
  const undo = useCallback(() => {
    setToast(t => {
      if (t?.restore) t.restore();
      return null;
    });
  }, []);
  return { toast, pushUndo, pushSuccess, undo, dismiss };
}


export { useUndoToast };
