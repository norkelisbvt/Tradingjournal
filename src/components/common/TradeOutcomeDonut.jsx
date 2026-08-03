// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T } from "../../theme";

const TradeOutcomeDonut = memo(function TradeOutcomeDonut({ win, loss, be, size = 90, stroke = 14 }) {
  const total = win + loss + be || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const winLen = (win / total) * c;
  const lossLen = (loss / total) * c;
  const beLen = (be / total) * c;
  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.gain} strokeWidth={stroke} strokeDasharray={`${winLen} ${c - winLen}`} strokeDashoffset={0} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.loss} strokeWidth={stroke} strokeDasharray={`${lossLen} ${c - lossLen}`} strokeDashoffset={-winLen} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.textFaint} strokeWidth={stroke} strokeDasharray={`${beLen} ${c - beLen}`} strokeDashoffset={-(winLen + lossLen)} />
      </g>
    </svg>
  );
});


export { TradeOutcomeDonut };
