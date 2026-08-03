// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";

const PinDots = memo(function PinDots({ length, filled, color, error }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 22 }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: error ? "transparent" : (i < filled ? color : "transparent"),
          border: `2px solid ${error ? "#f87171" : (i < filled ? color : "#ffffff55")}`,
          transition: "all 0.1s",
        }} />
      ))}
    </div>
  );
});


export { PinDots };
