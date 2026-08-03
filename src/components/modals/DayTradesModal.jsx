// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { T, FS, S } from "../../theme";
import { MONTHS_FULL } from "../../constants";
import { money } from "../../utils";
import { InstTag } from "../common/InstTag";
import { DailyMarketNoteEditor } from "../trades/DailyMarketNoteEditor";

const DayTradesModal = memo(function DayTradesModal({ date, trades, onClose, onAddNew, onTradeClick, onEditTrade, onDeleteTrade, accentColor, marketNote, onSaveMarketNote }) {
  if (!date) return null;
  const dayPnL = trades.reduce((s, t) => s + t.pnl, 0);
  const d = new Date(date + "T00:00:00");
  const label = `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="hz-modal-in" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", padding: 22, boxShadow: T.shadowXl }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: FS.lg, color: T.text }}>{label}</div>
            <div style={{ fontSize: FS.sm, color: T.textMuted }}>{trades.length} trade{trades.length !== 1 ? "s" : ""} registrado{trades.length !== 1 ? "s" : ""}</div>
          </div>
          {trades.length > 0 && (
            <div style={{ fontSize: FS.lg, fontWeight: 700, color: dayPnL >= 0 ? T.gain : T.loss }}>{money(dayPnL)}</div>
          )}
        </div>

        <DailyMarketNoteEditor date={date} note={marketNote} onSave={onSaveMarketNote} accentColor={accentColor} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {trades.length === 0 && (
            <div style={{ textAlign: "center", color: T.textMuted, fontSize: FS.base, padding: "20px 0" }}>Aún no hay trades este día.</div>
          )}
          {(() => {
            // Igual para todas las filas de este día: se arma una vez arriba
            // del .map en vez de por cada trade.
            const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surfaceAlt, cursor: "pointer" };
            const leftGroupStyle = { display: "flex", alignItems: "center", gap: 8, minWidth: 0 };
            const sessionStyle = { fontSize: FS.sm, color: T.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
            const rightGroupStyle = { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 };
            const pnlBaseStyle = { fontSize: FS.base, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 };
            const editBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", color: T.textMuted };
            const deleteBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", color: "#e5484d" };
            return trades.map(t => (
              <div key={t.id} style={rowStyle} onClick={() => onTradeClick(t)}>
                <div style={leftGroupStyle}>
                  <InstTag inst={t.instrument} />
                  <span style={S.tag(t.direction === "LONG" ? T.gain : T.loss)}>{t.direction}</span>
                  <span style={sessionStyle}>{t.session}</span>
                </div>
                <div style={rightGroupStyle}>
                  <span style={{ ...pnlBaseStyle, color: t.pnl >= 0 ? T.gain : T.loss }}>
                    {t.pnl >= 0 ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                    {money(t.pnl)}
                  </span>
                  <button onClick={e => { e.stopPropagation(); onEditTrade(t); }} style={editBtnStyle} title="Editar trade" aria-label="Editar trade"><Pencil size={13} /></button>
                  <button onClick={e => { e.stopPropagation(); onDeleteTrade(t.id); }} style={deleteBtnStyle} title="Borrar trade" aria-label="Borrar trade"><Trash2 size={13} /></button>
                </div>
              </div>
            ));
          })()}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onAddNew(date)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: accentColor, color: "#fff", cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
            <Plus size={15} />Añadir otro trade
          </button>
          <button onClick={onClose} style={{ padding: "11px 18px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.surfaceAlt, color: T.textMuted, cursor: "pointer", fontSize: FS.base }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
});


export { DayTradesModal };
