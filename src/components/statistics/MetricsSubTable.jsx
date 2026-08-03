// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS } from "../../theme";
import { money } from "../../utils";

const MetricsSubTable = memo(function MetricsSubTable({ title, rows, total }) {
  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: FS.sm, color: T.textFaint }}>Sin datos</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["", "Nº", "% total", "Suma P&L", "Prom. ($)", "R/R prom."].map((h, i) => (
                <th key={i} style={{ padding: "3px 4px 6px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textAlign: i === 0 ? "left" : "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const pct = total ? ((r.count / total) * 100).toFixed(0) : "0";
              const avg = r.count ? r.pnl / r.count : 0;
              return (
                <tr key={r.label} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, fontWeight: 700, color: r.color }}>{r.label}</td>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, color: T.text, textAlign: "center" }}>{r.count}</td>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, color: T.textMuted, textAlign: "center" }}>{pct}%</td>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, fontWeight: 700, color: r.pnl >= 0 ? T.gain : T.loss, textAlign: "center" }}>{money(r.pnl)}</td>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, color: T.textMuted, textAlign: "center" }}>{money(avg)}</td>
                  <td style={{ padding: "6px 4px", fontSize: FS.sm, color: T.textMuted, textAlign: "center" }}>{r.avgRR}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
});


export { MetricsSubTable };
