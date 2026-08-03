// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useEffect, useRef } from "react";

export function useFocusTrap(active, containerRef, { initialFocusRef, onEscape } = {}) {
  const previouslyFocused = useRef(null);
  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement;
    const container = containerRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => container ? Array.from(container.querySelectorAll(focusableSelector)).filter(el => !el.disabled && el.offsetParent !== null) : [];
    const toFocus = initialFocusRef?.current || getFocusable()[0] || container;
    toFocus?.focus();
    function onKeyDown(e) {
      if (onEscape && e.key === "Escape") {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused.current?.focus?.();
    };
  }, [active, containerRef, initialFocusRef, onEscape]);
}