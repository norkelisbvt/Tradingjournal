// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { AlertTriangle } from "lucide-react";
import { T, FS, S } from "../../theme";

const ErrorTagSelector = memo(function ErrorTagSelector({ selected, onChange, errorsList, setErrorsList }) {
  const [custom, setCustom] = useState("");
  function toggle(s) {
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  }
  function addCustom() {
    const val = custom.trim();
    if (!val) return;
    if (!errorsList.includes(val)) setErrorsList(p => [...p, val]);
    if (!selected.includes(val)) onChange([...selected, val]);
    setCustom("");
  }
  function removeErr(s) {
    setErrorsList(p => p.filter(x => x !== s));
    if (selected.includes(s)) onChange(selected.filter(x => x !== s));
  }
  return (
    <div>
      <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />Errores de ejecución {selected.length > 0 && <span style={{ color: T.loss, fontWeight: 700 }}>({selected.length})</span>}</label>
      <div style={{ background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, padding: 10 }}>
        {errorsList.length === 0 ? (
          <div style={{ fontSize: FS.base, color: T.textFaint, padding: "4px 2px", marginBottom: 8 }}>Sin errores guardados. Añade el tuyo abajo 👇</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(() => {
              const checkStyle = { fontSize: FS.xs };
              const removeStyle = { fontSize: FS.sm, opacity: 0.6 };
              return errorsList.map(s => {
              const isSel = selected.includes(s);
              return (
                <div key={s} onClick={() => toggle(s)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, border: `1px solid ${isSel ? T.loss : T.border}`, background: isSel ? "#dc262618" : T.surface, color: isSel ? T.loss : T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>
                  {isSel && <span style={checkStyle}>✓</span>}
                  <span>{s}</span>
                  <span onClick={e => { e.stopPropagation(); removeErr(s); }} style={removeStyle}>✕</span>
                </div>
              );
              });
            })()}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="ej. Moví el SL... (nuevo error)" style={{ ...S.input, fontSize: FS.base, padding: "6px 9px" }} />
          <button onClick={addCustom} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>
    </div>
  );
});


export { ErrorTagSelector };
