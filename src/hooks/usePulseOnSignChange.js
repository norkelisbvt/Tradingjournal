// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useRef } from "react";

function usePulseOnSignChange(value) {
  const [pulseKey, setPulseKey] = useState(0);
  const prevSign = useRef(null);
  useEffect(() => {
    if (typeof value !== "number" || !isFinite(value)) return;
    const sign = value >= 0 ? 1 : -1;
    if (prevSign.current !== null && prevSign.current !== sign) {
      setPulseKey(k => k + 1);
    }
    prevSign.current = sign;
  }, [value]);
  return pulseKey;
}


export { usePulseOnSignChange };
