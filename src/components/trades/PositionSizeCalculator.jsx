// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useMemo, memo } from "react";
import { T, FS, S, RADIUS } from "../../theme";
import { FALLBACK_INSTRUMENT_SPEC } from "../../constants";

const PositionSizeCalculator = memo(function PositionSizeCalculator({ instrument, entry, stopLoss, riskDollars, instrumentSpecs, setInstrumentSpecs, onApplySize, accentColor }) {
  const [open, setOpen] = useState(false);
  const spec = instrumentSpecs[instrument] || FALLBACK_INSTRUMENT_SPEC;
  const [pipSize, setPipSize] = useState(spec.pipSize);
  const [valuePerPipPerLot, setValuePerPipPerLot] = useState(spec.valuePerPipPerLot);
  const [manualDistance, setManualDistance] = useState("");
  const [manualRisk, setManualRisk] = useState("");

  useEffect(() => {
    const s = instrumentSpecs[instrument] || FALLBACK_INSTRUMENT_SPEC;
    setPipSize(s.pipSize);
    setValuePerPipPerLot(s.valuePerPipPerLot);
  }, [instrument]);

  const autoDistancePrice = useMemo(() => {
    const e = parseFloat(entry), sl = parseFloat(stopLoss);
    if (isNaN(e) || isNaN(sl)) return null;
    return Math.abs(e - sl);
  }, [entry, stopLoss]);

  const distancePrice = manualDistance !== "" ? parseFloat(manualDistance) : autoDistancePrice;
  const distanceUnits = distancePrice && pipSize ? distancePrice / pipSize : null;
  const effectiveRisk = manualRisk !== "" ? parseFloat(manualRisk) : riskDollars;

  const suggestedLots = useMemo(() => {
    if (!effectiveRisk || !distanceUnits || !valuePerPipPerLot) return null;
    const lots = effectiveRisk / (distanceUnits * valuePerPipPerLot);
    return lots > 0 ? lots : null;
  }, [effectiveRisk, distanceUnits, valuePerPipPerLot]);

  function saveSpec() {
    setInstrumentSpecs(prev => ({ ...prev, [instrument]: { ...(prev[instrument] || FALLBACK_INSTRUMENT_SPEC), pipSize: parseFloat(pipSize) || 1, valuePerPipPerLot: parseFloat(valuePerPipPerLot) || 1 } }));
  }

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      {/* Es un panel colapsable inline (empuja el contenido de abajo), no un
          overlay — no necesita focus trap propio. aria-expanded/aria-controls
          sí hacían falta: sin eso un lector de pantalla no anuncia que este
          botón abre/cierra algo, ni qué contenido controla. */}
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="possize-calc-panel"
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>
        🧮 Calculadora de tamaño de posición {open ? "▲" : "▼"}
      </button>
      {open && (
        <div id="possize-calc-panel" style={{ marginTop: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, padding: 14 }}>
          <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 10 }}>
            Calcula cuántos lotes te corresponden según tu riesgo y la distancia al Stop Loss para <b>{instrument}</b>.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label htmlFor="psc-risk" style={S.label}>Riesgo en $ (auto o manual)</label>
              <input id="psc-risk" type="number" value={manualRisk !== "" ? manualRisk : (riskDollars != null ? riskDollars.toFixed(2) : "")} onChange={e => setManualRisk(e.target.value)} style={S.input} placeholder="ej. 50" />
            </div>
            <div>
              <label htmlFor="psc-distance" style={S.label}>Distancia al SL ({spec.unitLabel}s o precio)</label>
              <input id="psc-distance" type="number" value={manualDistance !== "" ? manualDistance : (autoDistancePrice != null ? autoDistancePrice : "")} onChange={e => setManualDistance(e.target.value)} style={S.input} placeholder="ej. 15 (en precio)" />
              <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 2 }}>Se calcula solo desde Entrada/SL si los completaste arriba.</div>
            </div>
            <div>
              <label htmlFor="psc-pipsize" style={S.label}>Tamaño de 1 {spec.unitLabel} (precio)</label>
              <input id="psc-pipsize" type="number" value={pipSize} onChange={e => setPipSize(e.target.value)} onBlur={saveSpec} style={S.input} />
            </div>
            <div>
              <label htmlFor="psc-valueperpip" style={S.label}>Valor por {spec.unitLabel}, por lote ($)</label>
              <input id="psc-valueperpip" type="number" value={valuePerPipPerLot} onChange={e => setValuePerPipPerLot(e.target.value)} onBlur={saveSpec} style={S.input} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface, borderRadius: RADIUS.sm, padding: "10px 14px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: FS.sm, color: T.textMuted }}>
              {distanceUnits != null ? <>Distancia: <b style={{ color: T.text }}>{distanceUnits.toFixed(1)} {spec.unitLabel}s</b></> : "Completá entrada y SL, o la distancia manual"}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Lotes sugeridos</div>
              <div style={{ fontSize: FS.xl, fontWeight: 800, color: suggestedLots ? accentColor : T.textFaint }}>
                {suggestedLots ? suggestedLots.toFixed(2) : "—"}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => suggestedLots && onApplySize(suggestedLots.toFixed(2))} disabled={!suggestedLots}
            style={{ marginTop: 10, width: "100%", padding: "8px 0", borderRadius: RADIUS.sm, border: "none", cursor: suggestedLots ? "pointer" : "not-allowed", fontSize: FS.base, fontWeight: 700, background: suggestedLots ? accentColor : T.border, color: suggestedLots ? "#fff" : T.textFaint }}>
            Usar este tamaño en el trade
          </button>
        </div>
      )}
    </div>
  );
});


export { PositionSizeCalculator };
