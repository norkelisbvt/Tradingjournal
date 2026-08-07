// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, S } from "../../theme";
import { EMOTIONS, NEG_EMOTIONS } from "../../constants";

const INTENSITY_LEVELS = [1, 2, 3, 4, 5];
const DEFAULT_INTENSITY = 3;

// Selector de intensidad (5 puntitos) para UNA emoción ya activa. Se muestra
// como una fila chica debajo del chip correspondiente — no se mezcla con los
// chips de emociones no seleccionadas, para no meter ruido visual ahí donde
// no aplica todavía.
function IntensityDots({ emotionId, value, onChange, color }) {
  return (
    <div role="radiogroup" aria-label={`Intensidad de ${emotionId}`} style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 2 }}>
      {INTENSITY_LEVELS.map(lvl => {
        const filled = lvl <= value;
        return (
          <button key={lvl} type="button" role="radio" aria-checked={lvl === value}
            aria-label={`Intensidad ${lvl} de 5`} title={`Intensidad ${lvl}/5`}
            onClick={(e) => { e.stopPropagation(); onChange(lvl); }}
            style={{
              width: 12, height: 12, borderRadius: "50%", padding: 0, cursor: "pointer",
              border: `1px solid ${filled ? color : T.border}`,
              background: filled ? color : "transparent",
            }} />
        );
      })}
    </div>
  );
}

const EmotionSelector = memo(function EmotionSelector({ selected, onChange, intensity, onIntensityChange }) {
  const intensityMap = intensity || {};

  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter(e => e !== id));
      // Al destildar la emoción, se limpia también su intensidad guardada —
      // si el usuario la vuelve a tildar más adelante, arranca de nuevo en
      // el valor por defecto en vez de arrastrar un número viejo sin sentido.
      if (onIntensityChange && intensityMap[id] != null) {
        const next = { ...intensityMap };
        delete next[id];
        onIntensityChange(next);
      }
    } else {
      onChange([...selected, id]);
      if (onIntensityChange) onIntensityChange({ ...intensityMap, [id]: intensityMap[id] ?? DEFAULT_INTENSITY });
    }
  }

  function setIntensity(id, lvl) {
    if (onIntensityChange) onIntensityChange({ ...intensityMap, [id]: lvl });
  }

  return (
    <div>
      <label id="emotion-selector-label" style={{ ...S.label, marginBottom: 8 }}>Estado emocional</label>
      {/* role="group" + aria-labelledby + aria-pressed: antes eran <button>
          reales (bien, ya eran enfocables con Tab) pero sin aria-pressed no
          anunciaban a un lector de pantalla cuáles estaban seleccionados —
          mismo criterio ya aplicado en SetupSelector. */}
      <div role="group" aria-labelledby="emotion-selector-label" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {EMOTIONS.map(e => {
          const active = selected.includes(e.id);
          const isNeg = NEG_EMOTIONS.includes(e.id);
          const color = active ? (isNeg ? T.loss : T.gain) : T.textMuted;
          return (
            <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <button type="button" onClick={() => toggle(e.id)} aria-pressed={active}
                style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? color + "66" : T.border}`, background: active ? color + "12" : T.surfaceAlt, color, cursor: "pointer", fontSize: FS.sm, fontWeight: active ? 700 : 400 }}>
                {e.emoji} {e.label}
              </button>
              {active && (
                <IntensityDots emotionId={e.id} value={intensityMap[e.id] ?? DEFAULT_INTENSITY} onChange={lvl => setIntensity(e.id, lvl)} color={color} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});


export { EmotionSelector };
