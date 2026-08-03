// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, memo } from "react";
import { T, FS, S } from "../../theme";

const DailyMarketNoteEditor = memo(function DailyMarketNoteEditor({ date, note, onSave, accentColor }) {
  const [plan, setPlan] = useState(note?.plan || "");
  const [result, setResult] = useState(note?.result || "");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setPlan(note?.plan || "");
    setResult(note?.result || "");
  }, [date]);

  // Autoguardado con debounce: no depende de ningún botón ni estado "dirty"
  // intermedio, así se elimina cualquier posibilidad de que la edición quede
  // bloqueada por un flujo de guardado manual.
  useEffect(() => {
    const t = setTimeout(() => {
      if (plan !== (note?.plan || "") || result !== (note?.result || "")) {
        onSave(date, { plan, result });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [plan, result]);

  return (
    <div style={{ ...S.card, padding: 14, marginBottom: 16, background: T.surfaceAlt }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>📝 Notas de mercado del día</div>
        {justSaved && <span style={{ fontSize: FS.xs, color: T.gain, fontWeight: 700 }}>✓ Guardado</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={S.label}>Plan pre-mercado</label>
          <textarea value={plan} onChange={e => setPlan(e.target.value)}
            placeholder="Qué esperabas del mercado hoy, niveles clave, sesgo..."
            style={{ ...S.input, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div>
          <label style={S.label}>Resultado real</label>
          <textarea value={result} onChange={e => setResult(e.target.value)}
            placeholder="Qué pasó realmente, dónde acertaste o fallaste el análisis..."
            style={{ ...S.input, minHeight: 70, resize: "vertical", fontFamily: "inherit" }} />
        </div>
      </div>
    </div>
  );
});


export { DailyMarketNoteEditor };
