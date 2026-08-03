// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, S } from "../../theme";

const ConfirmDialog = memo(function ConfirmDialog({ open, title, message, confirmLabel = "Borrar", cancelLabel = "Cancelar", danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onCancel}>
      <div className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 380, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: FS.lg, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: FS.base, color: T.textMuted, lineHeight: 1.55, marginBottom: 18 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={S.button("secondary")}>{cancelLabel}</button>
          <button onClick={onConfirm} style={S.button(danger ? "danger" : "primary")}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
});


export { ConfirmDialog };
