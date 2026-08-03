// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { Plus, Trash2, X, Bell, BellOff } from "lucide-react";
import { T, FS, S } from "../../theme";
import { REMINDER_DAY_LABELS } from "../../constants";

const ReminderRow = memo(function ReminderRow({ reminder, onChange, onDelete }) {
  const toggleDay = (d) => {
    const days = Array.isArray(reminder.days) ? reminder.days : [];
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    onChange({ ...reminder, days: next });
  };
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button onClick={() => onChange({ ...reminder, enabled: !reminder.enabled })}
          style={{ width: 34, height: 20, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: reminder.enabled ? T.brand : T.border, flexShrink: 0, transition: "background 0.15s" }}
          aria-label={reminder.enabled ? "Desactivar" : "Activar"}>
          <span style={{ position: "absolute", top: 2, left: reminder.enabled ? 16 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
        </button>
        {reminder.type === "custom" ? (
          <input value={reminder.label} onChange={e => onChange({ ...reminder, label: e.target.value })}
            style={{ ...S.input, flex: 1, padding: "5px 8px" }} placeholder="Ej. Revisar mi plan de trading" />
        ) : (
          <span style={{ flex: 1, fontSize: FS.sm, color: T.text, fontWeight: 600 }}>{reminder.label}</span>
        )}
        <input type="time" value={reminder.time} onChange={e => onChange({ ...reminder, time: e.target.value })}
          style={{ ...S.input, width: 92, padding: "5px 6px" }} />
        {reminder.type === "custom" && (
          <button onClick={onDelete} style={{ background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", display: "flex", padding: 4 }} aria-label="Eliminar recordatorio">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {REMINDER_DAY_LABELS.map((lbl, d) => {
          const active = Array.isArray(reminder.days) && reminder.days.includes(d);
          return (
            <button key={d} onClick={() => toggleDay(d)}
              style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: `1px solid ${active ? T.brand + "88" : T.border}`, background: active ? T.brand + "18" : "transparent", color: active ? T.brand : T.textFaint, fontSize: FS.xs, fontWeight: 700, cursor: "pointer" }}>
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
});
const RemindersModal = memo(function RemindersModal({ open, onClose, reminders, setReminders, permission, requestPermission }) {
  if (!open) return null;
  const addCustom = () => {
    setReminders(rs => [...rs, { id: `custom-${Date.now()}`, type: "custom", label: "Nuevo recordatorio", time: "09:00", days: [1, 2, 3, 4, 5], enabled: true }]);
  };
  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto", padding: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: FS.lg, fontWeight: 800, color: T.text }}><Bell size={16} />Recordatorios</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", display: "flex", padding: 4 }} aria-label="Cerrar"><X size={16} /></button>
        </div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>
          Solo se disparan mientras la app está abierta en este dispositivo — no es una notificación push real.
        </div>

        {permission !== "granted" && permission !== "unsupported" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <BellOff size={16} style={{ color: T.textFaint, flexShrink: 0 }} />
            <div style={{ fontSize: FS.xs, color: T.textMuted, flex: 1 }}>
              {permission === "denied"
                ? "Bloqueaste las notificaciones del navegador. Vas a ver un aviso dentro de la app en vez de una notificación nativa."
                : "Activá las notificaciones del navegador para recibir el aviso aunque tengas otra pestaña abierta."}
            </div>
            {permission === "default" && (
              <button onClick={requestPermission} style={{ ...S.button("secondary"), padding: "6px 10px", fontSize: FS.xs, flexShrink: 0 }}>Activar</button>
            )}
          </div>
        )}

        {reminders.map(r => (
          <ReminderRow key={r.id} reminder={r}
            onChange={updated => setReminders(rs => rs.map(x => x.id === updated.id ? updated : x))}
            onDelete={() => setReminders(rs => rs.filter(x => x.id !== r.id))} />
        ))}

        <button onClick={addCustom} style={{ ...S.button("secondary"), width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
          <Plus size={13} />Agregar recordatorio
        </button>
      </div>
    </div>
  );
});


export { ReminderRow, RemindersModal };
