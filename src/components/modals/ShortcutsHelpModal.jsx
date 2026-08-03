// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { X } from "lucide-react";
import { T, FS, numMonoStyle, S } from "../../theme";

const ShortcutsHelpModal = memo(function ShortcutsHelpModal({ open, onClose }) {
  if (!open) return null;
  const groups = [
    { title: "Navegación", items: [
      ["1 – 8", "Ir a cada sección (Dashboard, Calendario, Trades, P&L, Estadísticas, Comparativa, Galería, Mindset)"],
      ["⌘/Ctrl K", "Abrir la paleta de comandos"],
      ["Esc", "Cerrar el modal, formulario o panel abierto"],
    ]},
    { title: "Acciones", items: [
      ["N", "Registrar un nuevo trade"],
      ["B", "Alternar modo Backtesting"],
      ["T", "Cambiar entre modo claro y oscuro"],
      ["L", "Bloquear la app ahora"],
    ]},
    { title: "Ayuda", items: [
      ["?", "Mostrar/ocultar este panel"],
    ]},
  ];
  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 420, padding: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: FS.lg, fontWeight: 800, color: T.text }}>Atajos de teclado</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", display: "flex", padding: 4 }} aria-label="Cerrar"><X size={16} /></button>
        </div>
        {groups.map(g => (
          <div key={g.title} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{g.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {g.items.map(([key, desc]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...numMonoStyle, minWidth: 44, textAlign: "center", padding: "3px 7px", borderRadius: 6, border: `1px solid ${T.borderStrong}`, background: T.surfaceAlt, color: T.text, fontSize: FS.sm, fontWeight: 700 }}>{key}</span>
                  <span style={{ fontSize: FS.sm, color: T.textMuted, lineHeight: 1.4 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});


export { ShortcutsHelpModal };
