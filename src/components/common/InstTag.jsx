// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T } from "../../theme";
import { instLabel, instEmoji } from "../../utils";

const InstTag = memo(function InstTag({ inst, size = 11.5 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: size, fontWeight: 700, color: T.textMuted, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: size + 1.5, lineHeight: 1 }}>{instEmoji(inst)}</span>
      <span>{instLabel(inst)}</span>
    </span>
  );
});


export { InstTag };
