// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, S } from "../../theme";
import { EMOTIONS } from "../../constants";

const EmotionSelector = memo(function EmotionSelector({ selected, onChange }) {
  function toggle(id) { onChange(selected.includes(id) ? selected.filter(e => e !== id) : [...selected, id]); }
  return (
    <div>
      <label style={{ ...S.label, marginBottom: 8 }}>Estado emocional</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {EMOTIONS.map(e => {
          const active = selected.includes(e.id);
          const isNeg = ["fomo","revenge","fear","greedy","impatient","tired","stressed"].includes(e.id);
          const color = active ? (isNeg ? T.loss : T.gain) : T.textMuted;
          return (
            <button key={e.id} onClick={() => toggle(e.id)}
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
