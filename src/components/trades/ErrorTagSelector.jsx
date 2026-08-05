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
      <label id="error-tag-selector-label" style={{ ...S.label, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />Errores de ejecución {selected.length > 0 && <span style={{ color: T.loss, fontWeight: 700 }}>({selected.length})</span>}</label>
      <div style={{ background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, padding: 10 }}>
        {errorsList.length === 0 ? (
          <div style={{ fontSize: FS.base, color: T.textFaint, padding: "4px 2px", marginBottom: 8 }}>Sin errores guardados. Añade el tuyo abajo 👇</div>
        ) : (
          // role="group" + aria-labelledby, y cada chip son dos <button> reales
          // en vez de un <div onClick> con un <span onClick> anidado (ese
          // patrón no era enfocable con Tab ni operable con Enter/Espacio;
          // mismo arreglo que ya se hizo en SetupSelector).
          <div role="group" aria-labelledby="error-tag-selector-label" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(() => {
              const checkStyle = { fontSize: FS.xs };
              return errorsList.map(s => {
              const isSel = selected.includes(s);
              const selectedStyle = isSel
                ? { border: `1px solid ${T.loss}`, background: "#dc262618", color: T.loss }
                : { border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted };
              return (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, fontSize: FS.base, fontWeight: 600, ...selectedStyle }}>
                  <button type="button" onClick={() => toggle(s)} aria-pressed={isSel}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, margin: 0, color: "inherit", font: "inherit", cursor: "pointer" }}>
                    {isSel && <span style={checkStyle}>✓</span>}
                    <span>{s}</span>
                  </button>
                  <button type="button" onClick={() => removeErr(s)} aria-label={`Quitar error ${s}`}
                    style={{ background: "none", border: "none", padding: 0, margin: 0, fontSize: FS.sm, opacity: 0.6, color: "inherit", cursor: "pointer" }}>✕</button>
                </span>
              );
              });
            })()}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="ej. Moví el SL... (nuevo error)" aria-label="Agregar nuevo error de ejecución" style={{ ...S.input, fontSize: FS.base, padding: "6px 9px" }} />
          <button type="button" onClick={addCustom} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>
    </div>
  );
});


export { ErrorTagSelector };
