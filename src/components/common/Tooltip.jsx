// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { IS_DARK, FS } from "../../theme";

const Tooltip = memo(function Tooltip({ label, side = "top", children }) {
  const [show, setShow] = useState(false);
  if (!label) return children;
  const posStyle = side === "right"
    ? { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
    : { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" };
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
      {children}
      {show && (
        <span className="hz-tooltip" style={{
          position: "absolute", ...posStyle, zIndex: 200, pointerEvents: "none",
          background: IS_DARK ? "#0a0812" : "#1e1b2e", color: "#fff",
          padding: "5px 9px", borderRadius: 6, fontSize: FS.xs, fontWeight: 600,
          whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
        }}>
          {label}
        </span>
      )}
    </span>
  );
});


export { Tooltip };
