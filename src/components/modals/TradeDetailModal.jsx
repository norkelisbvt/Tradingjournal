// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Camera } from "lucide-react";
import { T, FS, S } from "../../theme";
import { EMOTIONS } from "../../constants";
import { money, getTradeSetups } from "../../utils";
import { InstTag } from "../common/InstTag";
import { useResolvedImage } from "../../lib/imageStore";

const TradeDetailModal = memo(function TradeDetailModal({ trade, onClose, accentColor }) {
  // Los hooks se llaman siempre, antes del return temprano de abajo (regla de
  // los hooks) — por eso van con trade?.imgX en vez de trade.imgX.
  const beforeSrc = useResolvedImage(trade?.imgBefore, trade?.imagenAntesKey);
  const afterSrc = useResolvedImage(trade?.imgAfter, trade?.imagenDespuesKey);
  if (!trade) return null;
  const usedReasons = Object.entries(trade.reasons || {}).filter(([, v]) => v.checked);
  const ignoredReasons = Object.entries(trade.reasons || {}).filter(([, v]) => v.ignored);
  const emotions = (trade.emotions || []).map(id => EMOTIONS.find(e => e.id === id)).filter(Boolean);
  // Idénticos para todos los ítems de su lista respectiva (no dependen del
  // item), así que se calculan una vez acá en vez de en cada .map().
  const STYLE_USED_REASON_CHIP = { padding: "3px 10px", borderRadius: 5, background: "#dcfce7", border: "1px solid #bbf7d0", color: T.gain, fontSize: FS.sm };
  const STYLE_IGNORED_REASON_CHIP = { padding: "3px 10px", borderRadius: 5, background: "#fee2e2", border: "1px solid #fecaca", color: T.loss, fontSize: FS.sm, textDecoration: "line-through" };
  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="hz-modal-in" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: T.shadowXl }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <InstTag inst={trade.instrument} />
              <span style={S.tag(trade.direction === "LONG" ? T.gain : T.loss)}>{trade.direction}</span>
              <span style={{ fontSize: FS.sm, color: T.textMuted }}>{trade.session}</span>
            </div>
            <div style={{ fontSize: FS.base, color: T.textMuted }}>{trade.date}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: FS.xl, fontWeight: 700, color: trade.pnl >= 0 ? T.gain : T.loss, display: "inline-flex", alignItems: "center", gap: 5 }}>
              {trade.pnl >= 0 ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
              {money(trade.pnl)}
            </div>
            <div style={{ fontSize: FS.sm, color: accentColor }}>1:{trade.rr} R:R</div>
          </div>
        </div>
        {(() => {
          // Hay imagen "antes"/"después" si existe una referencia local (idb/data
          // URL) O una key remota en R2 (trade sincronizado desde otro dispositivo
          // que todavía no bajó la imagen a este). Cualquiera de las dos cuenta.
          const hasBefore = !!(trade.imgBefore || trade.imagenAntesKey);
          const hasAfter = !!(trade.imgAfter || trade.imagenDespuesKey);
          if (!hasBefore && !hasAfter) return null;
          return (
            <div style={{ display: "grid", gridTemplateColumns: hasBefore && hasAfter ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 16 }}>
              {hasBefore && <div><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: FS.xs, color: T.textMuted, marginBottom: 4 }}><BarChart3 size={11} />ANTES</div>{beforeSrc ? <img src={beforeSrc} alt="before" style={{ width: "100%", borderRadius: 8, border: `1px solid ${T.border}` }} /> : <div style={{ padding: "28px 0", textAlign: "center", fontSize: FS.sm, color: T.textFaint, border: `1px dashed ${T.border}`, borderRadius: 8 }}>Cargando…</div>}</div>}
              {hasAfter && <div><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: FS.xs, color: T.textMuted, marginBottom: 4 }}><Camera size={11} />DESPUÉS</div>{afterSrc ? <img src={afterSrc} alt="after" style={{ width: "100%", borderRadius: 8, border: `1px solid ${T.border}` }} /> : <div style={{ padding: "28px 0", textAlign: "center", fontSize: FS.sm, color: T.textFaint, border: `1px dashed ${T.border}`, borderRadius: 8 }}>Cargando…</div>}</div>}
            </div>
          );
        })()}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[["Entrada", trade.entry], ["Salida", trade.exit], ["Lotes", trade.size]].map(([l, v]) => (
            <div key={l} style={{ background: T.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: FS.lg, color: T.text, fontWeight: 600 }}>{v || "—"}</div>
            </div>
          ))}
        </div>
        {getTradeSetups(trade).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Setup{getTradeSetups(trade).length > 1 ? "s" : ""}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(() => {
                const setupChipStyle = { padding: "4px 10px", borderRadius: 20, border: "1px solid #6366f144", background: "#6366f112", color: "#6366f1", fontSize: FS.sm, fontWeight: 600 };
                return getTradeSetups(trade).map(s => (
                  <span key={s} style={setupChipStyle}>{s}</span>
                ));
              })()}
            </div>
          </div>
        )}
        {usedReasons.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 7 }}>Razones ✓</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {usedReasons.map(([r]) => <span key={r} style={STYLE_USED_REASON_CHIP}>{r}</span>)}
            </div>
          </div>
        )}
        {ignoredReasons.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: `${T.loss}aa`, textTransform: "uppercase", marginBottom: 7 }}>⚠ Señales ignoradas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ignoredReasons.map(([r]) => <span key={r} style={STYLE_IGNORED_REASON_CHIP}>{r}</span>)}
            </div>
          </div>
        )}
        {emotions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 7 }}>Emociones</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {emotions.map(e => {
                const isNeg = ["fomo","revenge","fear","greedy","impatient","tired","stressed"].includes(e.id);
                return <span key={e.id} style={{ padding: "4px 10px", borderRadius: 16, background: isNeg ? "#fee2e2" : "#dcfce7", border: `1px solid ${isNeg ? "#fecaca" : "#bbf7d0"}`, color: isNeg ? T.loss : T.gain, fontSize: FS.base }}>{e.emoji} {e.label}</span>;
              })}
            </div>
          </div>
        )}
        {trade.notes && (
          <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Notas</div>
            <div style={{ fontSize: FS.base, color: T.textMuted, lineHeight: 1.5 }}>{trade.notes}</div>
          </div>
        )}
        <button onClick={onClose} style={{ width: "100%", padding: "10px 0", border: `1px solid ${T.border}`, borderRadius: 8, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", fontSize: FS.base }}>Cerrar</button>
      </div>
    </div>
  );
});


export { TradeDetailModal };
