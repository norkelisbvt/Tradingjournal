import { useState, useRef, useEffect } from "react";

// Anima un número hacia su valor objetivo con easing cúbico (usado en las
// tarjetas de KPI: P&L, winrate, etc. — el numerito "cuenta" en vez de
// saltar directo al valor nuevo). Respeta prefers-reduced-motion.
//
// Antes vivía copiado y pegado, línea por línea idéntico, en
// TradingJournalInner.jsx y en StatisticsView.jsx.
export function useAnimatedNumber(target, duration = 450) {
  const [display, setDisplay] = useState(target);
  const valueRef = useRef(target);
  const rafRef = useRef(null);
  useEffect(() => {
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      valueRef.current = target;
      setDisplay(target);
      return;
    }
    const from = valueRef.current;
    if (from === target) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * eased;
      valueRef.current = val;
      setDisplay(val);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
}
