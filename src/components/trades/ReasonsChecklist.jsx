// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { T, FS, S } from "../../theme";

const ReasonsChecklist = memo(function ReasonsChecklist({ reasons, onChange, reasonsList, setReasonsList }) {
  const [custom, setCustom] = useState("");
  function toggle(r, field) {
    const cur = reasons[r] || { checked: false, ignored: false };
    onChange({ ...reasons, [r]: field === "checked" ? { ...cur, checked: !cur.checked } : { ...cur, ignored: !cur.ignored } });
  }
  function addCustom() {
    if (!custom.trim()) return;
    const val = custom.trim();
    if (!reasonsList.includes(val)) setReasonsList(p => [...p, val]);
    onChange({ ...reasons, [val]: { checked: true, ignored: false } });
    setCustom("");
  }
  function removeReason(r) {
    setReasonsList(p => p.filter(x => x !== r));
    const rest = { ...reasons };
    delete rest[r];
    onChange(rest);
  }
  return (
    <div>
      <label style={{ ...S.label, marginBottom: 8 }}>Razones de entrada</label>
      <div style={{ background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, padding: 10, maxHeight: 280, overflowY: "auto" }}>
        {reasonsList.length === 0 && (
          <div style={{ fontSize: FS.base, color: T.textFaint, padding: "8px 4px" }}>Aún no tienes razones guardadas. Añade las tuyas abajo 👇</div>
        )}
        {(() => {
          const rowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "5px 4px", borderBottom: `1px solid ${T.border}` };
          const removeBtnStyle = { padding: "2px 6px", borderRadius: 4, border: "none", background: "transparent", color: T.textFaint, cursor: "pointer", fontSize: FS.base };
          return reasonsList.map(r => {
          const state = reasons[r] || { checked: false, ignored: false };
          return (
            <div key={r} style={rowStyle}>
              <button onClick={() => toggle(r, "checked")} aria-label={`Marcar "${r}" como cumplida`} title={`Marcar "${r}" como cumplida`}
                style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${state.checked ? T.gain : T.borderStrong}`, background: state.checked ? "#dcfce7" : T.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {state.checked && <Check size={11} color={T.gain} strokeWidth={3} />}
              </button>
              <span style={{ flex: 1, fontSize: FS.base, color: state.ignored ? T.textFaint : state.checked ? T.text : T.textMuted, textDecoration: state.ignored ? "line-through" : "none" }}>{r}</span>
              <button onClick={() => toggle(r, "ignored")}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 4, border: `1px solid ${state.ignored ? T.loss : T.border}`, background: state.ignored ? "#fee2e2" : T.surface, color: state.ignored ? T.loss : T.textFaint, cursor: "pointer", fontSize: FS.xs, fontWeight: 700 }}>
                {state.ignored && <AlertTriangle size={10} />}ignoré
              </button>
              <button onClick={() => removeReason(r)} title="Eliminar razón de la lista"
                style={removeBtnStyle} aria-label="Eliminar razón de la lista">✕</button>
            </div>
          );
          });
        })()}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} placeholder="Razón personalizada..." style={{ ...S.input, fontSize: FS.base, padding: "6px 9px" }} />
          <button onClick={addCustom} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>
    </div>
  );
});


export { ReasonsChecklist };
