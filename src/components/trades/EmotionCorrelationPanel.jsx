// Panel de correlación entre las emociones etiquetadas por trade (EmotionSelector)
// y el rendimiento REAL de esos trades. Vive en el tab de Trades porque es ahí
// donde el trader está mirando su ejecución día a día — no en Estadísticas
// (donde vive el resto de las métricas cuantitativas) ni en Mindset (que lleva
// un diario de mood independiente, sin cruzar con resultados).
//
// Ojo con un supuesto fácil de caer: el color de cada fila NO sale de si la
// emoción está en la lista de "negativas" de constants.js — sale del resultado
// medido. Una emoción etiquetada como "mala señal" puede estar dando buen R
// en la práctica, y ESE es justamente el tipo de hallazgo que este panel
// existe para mostrar, no para confirmar la intuición de antemano.
import { useMemo, useState, memo } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { T, FS, S, RADIUS, EASE } from "../../theme";
import { EMOTIONS } from "../../constants";
import { computeEmotionStats, money, pctFmt } from "../../utils";

const EMOTION_META = Object.fromEntries(EMOTIONS.map(e => [e.id, e]));

const EmotionCorrelationPanel = memo(function EmotionCorrelationPanel({ trades, accountSize }) {
  const [open, setOpen] = useState(true);
  const stats = useMemo(() => computeEmotionStats(trades, accountSize), [trades, accountSize]);

  if (stats.length === 0) {
    return (
      <div className="hz-card" style={{ ...S.card, padding: 18, marginBottom: 14, textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
        Etiquetá el estado emocional en tus trades para ver acá cómo se relaciona con tu resultado real.
      </div>
    );
  }

  const best = stats[0];
  const worst = stats[stats.length - 1];

  return (
    <div className="hz-card" style={{ ...S.card, marginBottom: 14, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-expanded={open}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={15} color={T.brand} />
          <div>
            <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text }}>Emociones × Rendimiento</div>
            <div style={{ fontSize: FS.sm, color: T.textMuted }}>
              Mejor resultado con <b style={{ color: T.text }}>{EMOTION_META[best.id]?.emoji} {EMOTION_META[best.id]?.label || best.id}</b>
              {stats.length > 1 && <> · peor con <b style={{ color: T.text }}>{EMOTION_META[worst.id]?.emoji} {EMOTION_META[worst.id]?.label || worst.id}</b></>}
            </div>
          </div>
        </div>
        <ChevronDown size={16} color={T.textFaint} style={{ transform: open ? "rotate(180deg)" : "none", transition: `transform 0.18s ${EASE}` }} />
      </div>

      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <thead>
              <tr>
                {["Emoción", "Trades", "Intensidad", "Winrate", "R promedio", "P&L total"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 6px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textAlign: i === 0 ? "left" : "right", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(s => {
                const meta = EMOTION_META[s.id] || { emoji: "🏳️", label: s.id };
                const resultColor = s.avgR > 0.05 ? T.gain : s.avgR < -0.05 ? T.loss : T.breakeven;
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "8px 6px", fontSize: FS.sm, fontWeight: 600, color: T.text, whiteSpace: "nowrap" }}>
                      <span style={{ ...S.tag(resultColor), fontWeight: 700 }}>{meta.emoji} {meta.label}</span>
                    </td>
                    <td style={{ padding: "8px 6px", fontSize: FS.sm, color: T.textMuted, textAlign: "right" }}>{s.count}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>
                      {s.avgIntensity == null ? (
                        <span style={{ fontSize: FS.xs, color: T.textFaint }}>—</span>
                      ) : (
                        <span style={{ display: "inline-flex", gap: 2 }} title={`${s.avgIntensity.toFixed(1)}/5`}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= Math.round(s.avgIntensity) ? resultColor : "transparent", border: `1px solid ${i <= Math.round(s.avgIntensity) ? resultColor : T.border}` }} />
                          ))}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px 6px", fontSize: FS.sm, color: T.textMuted, textAlign: "right" }}>{pctFmt(s.winRate * 100, 0)}</td>
                    <td style={{ padding: "8px 6px", fontSize: FS.sm, fontWeight: 700, color: resultColor, textAlign: "right" }}>{s.avgR >= 0 ? "+" : ""}{s.avgR.toFixed(2)}R</td>
                    <td style={{ padding: "8px 6px", fontSize: FS.sm, fontWeight: 700, color: s.pnlTotal >= 0 ? T.gain : T.loss, textAlign: "right" }}>{money(s.pnlTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 10, lineHeight: 1.5 }}>
            Un trade con varias emociones marcadas suma a las estadísticas de cada una — no se reparte entre ellas.
            "R promedio" usa el mismo cálculo que el resto de la app (riesgo real si está cargado, o el R:R como aproximación).
          </div>
        </div>
      )}
    </div>
  );
});

export { EmotionCorrelationPanel };
