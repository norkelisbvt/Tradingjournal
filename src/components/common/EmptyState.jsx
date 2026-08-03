// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { FileText } from "lucide-react";
import { T, FS, RADIUS } from "../../theme";

const EmptyState = memo(function EmptyState({ icon: Icon = FileText, title, subtitle, actionLabel, onAction, accentColor, compact = false }) {
  const color = accentColor || T.brand;
  const size = compact ? 40 : 64;
  return (
    <div style={{ textAlign: "center", padding: compact ? "28px 16px" : "48px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {/* Ilustración: dos anillos concéntricos con degradé de marca + un par de
         "motas" flotantes decorativas, en vez de un ícono suelto en un círculo
         plano — da más carácter sin necesitar un SVG a medida por caso. */}
      <div style={{ position: "relative", width: size + 26, height: size + 26, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 50% 50%, ${color}14, transparent 70%)`, border: `1px solid ${color}1c` }} />
        <div style={{
          width: size, height: size, borderRadius: RADIUS.lg,
          background: `linear-gradient(150deg, ${color}2a, ${color}0a)`,
          border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center",
          color, boxShadow: `0 8px 20px ${color}1a`,
        }}>
          <Icon size={compact ? 18 : 24} strokeWidth={1.7} />
        </div>
        <span style={{ position: "absolute", top: 2, right: 2, width: 9, height: 9, borderRadius: "50%", background: color, opacity: 0.5 }} />
        <span style={{ position: "absolute", bottom: 4, left: 0, width: 6, height: 6, borderRadius: "50%", background: color, opacity: 0.3 }} />
      </div>
      <div style={{ fontSize: compact ? FS.base : FS.lg, fontWeight: 700, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: FS.sm, color: T.textFaint, maxWidth: 320, lineHeight: 1.5, marginTop: 2 }}>{subtitle}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="hz-shimmer" style={{
          marginTop: 14, padding: "8px 16px", borderRadius: RADIUS.pill, border: "none",
          background: color, color: "#fff", cursor: "pointer", fontSize: FS.sm, fontWeight: 700,
          boxShadow: `0 4px 12px ${color}44`, transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
});


export { EmptyState };
