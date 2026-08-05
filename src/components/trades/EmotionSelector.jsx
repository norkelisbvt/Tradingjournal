// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, S } from "../../theme";
import { EMOTIONS, NEG_EMOTIONS } from "../../constants";

const EmotionSelector = memo(function EmotionSelector({ selected, onChange }) {
  function toggle(id) { onChange(selected.includes(id) ? selected.filter(e => e !== id) : [...selected, id]); }
  return (
    <div>
      <label id="emotion-selector-label" style={{ ...S.label, marginBottom: 8 }}>Estado emocional</label>
      {/* role="group" + aria-labelledby + aria-pressed: antes eran <button>
          reales (bien, ya eran enfocables con Tab) pero sin aria-pressed no
          anunciaban a un lector de pantalla cuáles estaban seleccionados —
          mismo criterio ya aplicado en SetupSelector. */}
      <div role="group" aria-labelledby="emotion-selector-label" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {EMOTIONS.map(e => {
          const active = selected.includes(e.id);
          const isNeg = NEG_EMOTIONS.includes(e.id);
          const color = active ? (isNeg ? T.loss : T.gain) : T.textMuted;
          return (
            <button key={e.id} type="button" onClick={() => toggle(e.id)} aria-pressed={active}
              style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? color + "66" : T.border}`, background: active ? color + "12" : T.surfaceAlt, color, cursor: "pointer", fontSize: FS.sm, fontWeight: active ? 700 : 400 }}>
              {e.emoji} {e.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});


export { EmotionSelector };
