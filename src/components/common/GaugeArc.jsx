// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T } from "../../theme";

const GaugeArc = memo(function GaugeArc({ frac, size = 128 }) {
  const stroke = 10;
  const r = size / 2 - stroke;
  const cx = size / 2, cy = size / 2;
  const polar = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };
  const left = polar(180), top = polar(90), right = polar(0);
  const greenPath = `M ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${top.x} ${top.y}`;
  const redPath = `M ${top.x} ${top.y} A ${r} ${r} 0 0 1 ${right.x} ${right.y}`;
  const clamped = Math.max(0, Math.min(1, frac));
  const marker = polar(180 - clamped * 180);
  return (
    <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
      <path d={greenPath} fill="none" stroke={T.gain} strokeWidth={stroke} strokeLinecap="round" />
      <path d={redPath} fill="none" stroke={T.loss} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx={marker.x} cy={marker.y} r={7} fill={T.surface} stroke={T.text} strokeWidth={2} />
    </svg>
  );
});


export { GaugeArc };
