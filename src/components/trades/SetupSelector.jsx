// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { T, FS, S, RADIUS } from "../../theme";

const SetupSelector = memo(function SetupSelector({ selected, onChange, setupsList, setSetupsList }) {
  const [custom, setCustom] = useState("");
  function toggle(s) {
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  }
  function addCustom() {
    const val = custom.trim();
    if (!val) return;
    if (!setupsList.includes(val)) setSetupsList(p => [...p, val].sort());
    if (!selected.includes(val)) onChange([...selected, val]);
    setCustom("");
  }
  function removeSetup(s) {
    setSetupsList(p => p.filter(x => x !== s));
    if (selected.includes(s)) onChange(selected.filter(x => x !== s));
  }
  return (
    <div>
      <label id="setup-selector-label" style={S.label}>Setup{selected.length > 1 ? "s" : ""} {selected.length > 0 && <span style={{ color: T.brand, fontWeight: 700 }}>({selected.length} seleccionado{selected.length > 1 ? "s" : ""})</span>}</label>
      <div style={{ background: T.surfaceAlt, borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, padding: 10 }}>
        {setupsList.length === 0 ? (
          <div style={{ fontSize: FS.base, color: T.textFaint, padding: "4px 2px", marginBottom: 8 }}>Aún no tienes setups guardados. Añade el tuyo abajo 👇</div>
        ) : (
          // role="group" + aria-labelledby: antes esto era un <div> de chips sin
          // ningún vínculo con la etiqueta "Setups" de arriba más allá de la
          // cercanía visual.
          <div role="group" aria-labelledby="setup-selector-label" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(() => {
              const checkStyle = { fontSize: FS.xs };
              return setupsList.map(s => {
              const isSel = selected.includes(s);
              // Antes cada "chip" era un <div onClick> con un <span onClick> anidado
              // para el borrar (stopPropagation para separar los dos clicks). Eso
              // significaba que ni seleccionar ni quitar un setup eran operables
              // con teclado — Tab no los enfocaba, Enter/Espacio no hacían nada.
              // Ahora son dos <button> reales (no anidados, hermanos dentro de un
              // wrapper) — cada uno enfocable y con su propio aria-label.
              const selectedStyle = isSel
                ? { background: `${T.brand}18`, color: T.brand, border: `1px solid ${T.brand}33` }
                : { background: T.surface, color: T.textMuted, border: `1px solid ${T.border}` };
              return (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: RADIUS.pill, fontSize: FS.base, fontWeight: 600, ...selectedStyle }}>
                  <button type="button" onClick={() => toggle(s)} aria-pressed={isSel}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, margin: 0, color: "inherit", font: "inherit", cursor: "pointer" }}>
                    {isSel && <span style={checkStyle}>✓</span>}
                    <span>{s}</span>
                  </button>
                  <button type="button" onClick={() => removeSetup(s)} aria-label={`Quitar setup ${s}`}
                    style={{ background: "none", border: "none", padding: 0, margin: 0, fontSize: FS.sm, opacity: 0.6, color: "inherit", cursor: "pointer" }}>✕</button>
                </span>
              );
              });
            })()}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="ej. BOS + FVG... (nuevo setup)" aria-label="Agregar nuevo setup"
            style={{ ...S.input, fontSize: FS.base, padding: "6px 9px" }} />
          <button type="button" onClick={addCustom} style={{ padding: "6px 12px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>
    </div>
  );
});


export { SetupSelector };
