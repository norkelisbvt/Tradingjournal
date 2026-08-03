// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useMemo, memo } from "react";
import { BarChart3, FileText, Check, X, TrendingDown, AlertTriangle, AlertCircle, Trophy } from "lucide-react";
import { T, FS, S } from "../../theme";
import { instLabel, instEmoji, money, pctFmt, moneyCompact, toISODate, startOfWeekDate } from "../../utils";
import { InteractiveCurveChart } from "../../charts";
import { InstTag } from "../common/InstTag";

const HistoricalAnalysisPanel = memo(function HistoricalAnalysisPanel({ trades, accentColor }) {
  const todayISO = toISODate(new Date());
  const [preset, setPreset] = useState("month"); // week | month | year | all | custom
  const [customFrom, setCustomFrom] = useState(todayISO);
  const [customTo, setCustomTo] = useState(todayISO);
  const [histPage, setHistPage] = useState(0);
  const HIST_PAGE_SIZE = 15;

  const range = useMemo(() => {
    const now = new Date();
    if (preset === "week") {
      const start = startOfWeekDate(new Date(now));
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return { from: toISODate(start), to: toISODate(end) };
    }
    if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: toISODate(start), to: toISODate(end) };
    }
    if (preset === "year") {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    if (preset === "all") {
      return { from: "2000-01-01", to: "2100-01-01" };
    }
    return { from: customFrom, to: customTo }; // custom
  }, [preset, customFrom, customTo]);

  const filtered = useMemo(
    () => trades.filter(t => t.date >= range.from && t.date <= range.to).sort((a, b) => a.date.localeCompare(b.date)),
    [trades, range]
  );

  useEffect(() => { setHistPage(0); }, [range.from, range.to]);
  const histTotalPages = Math.max(1, Math.ceil(filtered.length / HIST_PAGE_SIZE));
  const histCurrentPage = Math.min(histPage, histTotalPages - 1);
  // La tabla se muestra del trade más reciente al más antiguo, paginada.
  // Antes esto reordenaba TODO `filtered` de nuevo (descendente) en cada
  // cambio de página, solo para cortar 15 filas — un sort O(n log n) sobre
  // el historial completo, redundante con el sort ascendente que ya se hizo
  // arriba. Como `filtered` ya está ordenado, alcanza con cortar el tramo
  // de la página directamente desde el final y invertir solo esos ≤15 items.
  const histPaged = useMemo(() => {
    const end = filtered.length - histCurrentPage * HIST_PAGE_SIZE;
    const start = Math.max(0, end - HIST_PAGE_SIZE);
    return filtered.slice(start, end).reverse();
  }, [filtered, histCurrentPage]);

  const stats = useMemo(() => {
    const wins = filtered.filter(t => t.pnl > 0);
    const losses = filtered.filter(t => t.pnl <= 0);
    const pnl = filtered.reduce((s, t) => s + t.pnl, 0);
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const best = filtered.reduce((m, t) => (t.pnl > (m?.pnl ?? -Infinity) ? t : m), null);
    const worst = filtered.reduce((m, t) => (t.pnl < (m?.pnl ?? Infinity) ? t : m), null);
    return {
      total: filtered.length,
      wins: wins.length, losses: losses.length,
      wr: filtered.length ? ((wins.length / filtered.length) * 100).toFixed(1) : "0",
      pnl, grossWin, grossLoss,
      profitFactor: grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? "∞" : "0"),
      avgWin: wins.length ? (grossWin / wins.length).toFixed(2) : "0",
      avgLoss: losses.length ? (grossLoss / losses.length).toFixed(2) : "0",
      avgRR: filtered.length ? (filtered.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / filtered.length).toFixed(2) : "0",
      best, worst,
    };
  }, [filtered]);

  // Curva de capital acumulada real (a partir de $0, mostrando P&L acumulado trade a trade)
  const curvePoints = useMemo(() => {
    if (filtered.length < 1) return null;
    let running = 0;
    const rest = filtered.map(t => ({ y: (running += t.pnl), label: new Date(t.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) }));
    return [{ y: 0, label: "Inicio" }, ...rest];
  }, [filtered]);
  const curveColor = stats.pnl >= 0 ? T.gain : T.loss;

  const PRESETS = [
    ["week", "Esta semana"], ["month", "Este mes"], ["year", "Este año"], ["all", "Todo el historial"], ["custom", "Personalizado"],
  ];

  return (
    <div>
      {/* Selector de periodo */}
      <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.lg, color: T.text, marginBottom: 2 }}><BarChart3 size={15} />Análisis Histórico</div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 16 }}>Estadísticas reales calculadas con tus trades ya guardados</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: customFrom || preset === "custom" ? 12 : 0 }}>
          {PRESETS.map(([key, label]) => (
            <button key={key} onClick={() => setPreset(key)}
              style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${preset === key ? accentColor + "88" : T.border}`, cursor: "pointer", fontSize: FS.base, fontWeight: 600, background: preset === key ? accentColor + "12" : T.surfaceAlt, color: preset === key ? accentColor : T.textMuted }}>
              {label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={S.label}>Desde</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Hasta</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={S.input} />
            </div>
          </div>
        )}
      </div>

      {stats.total === 0 ? (
        <div style={{ ...S.card, padding: 30, textAlign: "center", color: T.textMuted, fontSize: FS.base }}>
          No hay trades guardados en el periodo seleccionado ({range.from} → {range.to}).
        </div>
      ) : (
        <>
          {/* Cards principales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
            {[
              { label: "P&L total", value: money(stats.pnl), color: stats.pnl >= 0 ? T.gain : T.loss },
              { label: "Win Rate", value: `${stats.wr}%`, color: parseFloat(stats.wr) >= 50 ? T.gain : T.loss },
              { label: "Profit Factor", value: stats.profitFactor, color: parseFloat(stats.profitFactor) >= 1.5 ? T.gain : T.loss },
              { label: "Total trades", value: stats.total, color: T.text },
            ].map(s => (
              <div key={s.label} className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
                <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: FS.xl, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Trades ganadores", value: stats.wins, color: T.gain },
              { label: "Trades perdedores", value: stats.losses, color: T.loss },
              { label: "R:R promedio", value: stats.avgRR, color: T.text },
              { label: "Prom. ganancia / pérdida", value: `+$${stats.avgWin} / -$${stats.avgLoss}`, color: T.text, mono: true },
            ].map(s => (
              <div key={s.label} className="hz-card" style={{ ...S.card, padding: "10px 14px" }}>
                <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: FS.base, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Mejor / peor trade */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Mejor trade", Icon: Trophy, t: stats.best, color: T.gain },
              { label: "Peor trade", Icon: TrendingDown, t: stats.worst, color: T.loss },
            ].map(({ label, Icon, t, color }) => (
              <div key={label} className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.xs, color: T.textMuted, fontWeight: 700, marginBottom: 4 }}><Icon size={12} color={color} />{label}</div>
                {t ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: FS.base, color: T.textMuted }}>{t.date} · {instEmoji(t.instrument)} {instLabel(t.instrument)}</span>
                    <span style={{ fontSize: FS.lg, fontWeight: 700, color }}>{money(t.pnl)}</span>
                  </div>
                ) : <span style={{ fontSize: FS.base, color: T.textFaint }}>—</span>}
              </div>
            ))}
          </div>

          {/* Curva de capital real */}
          {curvePoints && (
            <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 4 }}>Curva de capital acumulado (real)</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>{filtered.length} trades reales en el periodo · {range.from} → {range.to}</div>
              <InteractiveCurveChart
                points={curvePoints}
                color={curveColor}
                height={180}
                referenceValue={0}
                referenceLabel="$0"
                formatValue={v => moneyCompact(v)}
                exportFilename="curva-capital-periodo.png"
              />
            </div>
          )}

          {/* Tabla de trades del período, paginada */}
          <div style={{ ...S.card, padding: 0, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text }}>Trades del período</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted }}>{filtered.length} trade{filtered.length !== 1 ? "s" : ""} · {range.from} → {range.to}</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              {(() => {
                // Estilos de la tabla: iguales para todas las filas/columnas del
                // mismo tipo, así que se calculan una sola vez por render acá
                // arriba en vez de reconstruirse en cada iteración de .map().
                const thBaseStyle = { padding: "8px 10px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, whiteSpace: "nowrap" };
                const thLeftStyle = { ...thBaseStyle, textAlign: "left" };
                const thRightStyle = { ...thBaseStyle, textAlign: "right" };
                const rowStyle = { borderBottom: `1px solid ${T.border}` };
                const cellDateStyle = { padding: "8px 10px", fontSize: FS.sm, color: T.textMuted };
                const cellInstStyle = { padding: "8px 10px", fontSize: FS.sm, color: T.text };
                const cellRRStyle = { padding: "8px 10px", fontSize: FS.sm, color: T.text, textAlign: "right" };
                const cellRiskStyle = { padding: "8px 10px", fontSize: FS.sm, color: T.textMuted, textAlign: "right" };
                const cellPnlBaseStyle = { padding: "8px 10px", fontSize: FS.sm, fontWeight: 700, textAlign: "right" };
                return (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Fecha", "Par", "R:R", "% Riesgo", "P&L"].map((h, i) => (
                          <th key={h} style={i >= 2 ? thRightStyle : thLeftStyle}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {histPaged.map(t => (
                        <tr key={t.id} style={rowStyle}>
                          <td style={cellDateStyle}>{t.date}</td>
                          <td style={cellInstStyle}><InstTag inst={t.instrument} /></td>
                          <td style={cellRRStyle}>{t.rr ? `${parseFloat(t.rr).toFixed(2)}R` : "—"}</td>
                          <td style={cellRiskStyle}>{t.riskPct ? pctFmt(parseFloat(t.riskPct) || 0) : "—"}</td>
                          <td style={{ ...cellPnlBaseStyle, color: t.pnl >= 0 ? T.gain : T.loss }}>{money(t.pnl)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            {histTotalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 16px", borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => setHistPage(p => Math.max(0, p - 1))} disabled={histCurrentPage === 0}
                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: histCurrentPage === 0 ? T.textFaint : T.textMuted, cursor: histCurrentPage === 0 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                  ← Anterior
                </button>
                <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Página {histCurrentPage + 1} de {histTotalPages}</span>
                <button onClick={() => setHistPage(p => Math.min(histTotalPages - 1, p + 1))} disabled={histCurrentPage >= histTotalPages - 1}
                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: histCurrentPage >= histTotalPages - 1 ? T.textFaint : T.textMuted, cursor: histCurrentPage >= histTotalPages - 1 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                  Siguiente →
                </button>
              </div>
            )}
          </div>

          {/* Interpretación */}
          <div style={{ ...S.card, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}><FileText size={13} />Interpretación</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                stats.pnl > 0
                  ? { color: T.gain, bg: "#f0fdf4", border: "#bbf7d0", Icon: Check, text: `P&L positivo en este periodo (+$${stats.pnl.toFixed(2)}).` }
                  : { color: T.loss, bg: "#fef2f2", border: "#fecaca", Icon: X, text: `P&L negativo en este periodo ($${stats.pnl.toFixed(2)}).` },
                parseFloat(stats.profitFactor) >= 1.5
                  ? { color: T.gain, bg: "#f0fdf4", border: "#bbf7d0", Icon: Check, text: `Profit Factor ${stats.profitFactor}: buena relación ganancia/pérdida en tus trades reales.` }
                  : { color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: AlertTriangle, text: `Profit Factor ${stats.profitFactor}: mejorable. Apunta a ≥ 1.5 para mayor robustez.` },
                stats.total < 20
                  ? { color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: AlertCircle, text: `Solo ${stats.total} trade(s) en este periodo — con muestras pequeñas, las estadísticas pueden no ser representativas todavía.` }
                  : { color: T.gain, bg: "#f0fdf4", border: "#bbf7d0", Icon: Check, text: `Muestra de ${stats.total} trades: suficiente para sacar conclusiones más confiables.` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: item.bg, border: `1px solid ${item.border}`, borderRadius: 8, padding: "10px 12px", fontSize: FS.base, color: item.color, lineHeight: 1.5 }}>
                  <item.Icon size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});


export { HistoricalAnalysisPanel };
