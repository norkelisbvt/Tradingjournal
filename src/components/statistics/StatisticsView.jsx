// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { FileText, Check, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { T, FS, S } from "../../theme";
import { INSTRUMENTS, INST_COLOR, SESSIONS, MONTHS_SHORT, MONTHS_FULL } from "../../constants";
import { instLabel, instEmoji, resolveDateRange, money, moneyCompact, toISODate, getTradeSetups, exportTradesToCSV } from "../../utils";
import { DayHourHeatmap } from "../../charts";
import { DateRangeFilter } from "../filters/DateRangeFilter";
import { InstrumentFilter } from "../filters/InstrumentFilter";
import { AdvancedMetricsPanel } from "./AdvancedMetricsPanel";
import { PlaybookAdherencePanel } from "./PlaybookAdherencePanel";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

// themeMode se recibe como prop únicamente para que React.memo detecte el
// cambio de tema y vuelva a renderizar este componente: T/S se leen del
// módulo de tema como objeto mutable (no como prop ni contexto), así que
// sin esta prop memo() compara solo (allTrades, accentColor, setupsList,
// accountSize) — que no cambian al alternar claro/oscuro — y se salta el
// re-render, dejando esta vista "congelada" con los colores viejos.
const StatisticsView = memo(function StatisticsView({ allTrades, accentColor, setupsList, accountSize, themeMode }) {
  const [filterInst, setFilterInst] = useState([...INSTRUMENTS]);
  const [filterSetup, setFilterSetup] = useState("All");
  const [dateRange, setDateRange] = useState({ preset: "all", customFrom: toISODate(new Date()), customTo: toISODate(new Date()) });
  const resolvedRange = useMemo(() => resolveDateRange(dateRange), [dateRange]);
  const baseTrades = useMemo(
    () => allTrades
      .filter(t => filterInst.includes(t.instrument))
      .filter(t => filterSetup === "All" || getTradeSetups(t).includes(filterSetup))
      .filter(t => t.date >= resolvedRange.from && t.date <= resolvedRange.to),
    [allTrades, filterInst, filterSetup, resolvedRange]
  );

  const monthsWithTrades = useMemo(() => {
    const set = new Set(baseTrades.map(t => t.date.slice(0, 7)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [baseTrades]);
  const [selectedMonth, setSelectedMonth] = useState(monthsWithTrades[0] || "");
  useEffect(() => {
    if (!monthsWithTrades.includes(selectedMonth)) setSelectedMonth(monthsWithTrades[0] || "");
  }, [monthsWithTrades]);
  const monthTrades = useMemo(() => baseTrades.filter(t => t.date.startsWith(selectedMonth)), [baseTrades, selectedMonth]);

  const barData = useMemo(() => monthsWithTrades.slice(0, 12).reverse().map(m => {
    const mt = baseTrades.filter(t => t.date.startsWith(m));
    const [y, mo] = m.split("-");
    return { month: m, label: `${MONTHS_SHORT[parseInt(mo) - 1]} ${y.slice(2)}`, pnl: mt.reduce((s, t) => s + t.pnl, 0), count: mt.length };
  }), [baseTrades, monthsWithTrades]);

  // Rendimiento por día de la semana (todo el historial filtrado, no solo el mes)
  const weekdayStats = useMemo(() => {
    const WD = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const buckets = WD.map(label => ({ label, pnl: 0, wins: 0, count: 0 }));
    baseTrades.forEach(t => {
      const d = new Date(t.date + "T00:00:00");
      const idx = d.getDay();
      buckets[idx].pnl += t.pnl;
      buckets[idx].count += 1;
      if (t.pnl > 0) buckets[idx].wins += 1;
    });
    // Reordenar Lun→Dom para lectura más natural
    return [1, 2, 3, 4, 5, 6, 0].map(i => buckets[i]);
  }, [baseTrades]);

  // Streaks (rachas) de trades ganadores/perdedores consecutivos, en orden cronológico
  const streakStats = useMemo(() => {
    const sorted = [...baseTrades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
    let current = 0, currentType = null;
    let bestWin = 0, bestLoss = 0, run = 0, runType = null;
    sorted.forEach(t => {
      const isWin = t.pnl > 0;
      if (runType === (isWin ? "win" : "loss")) run += 1;
      else { run = 1; runType = isWin ? "win" : "loss"; }
      if (runType === "win") bestWin = Math.max(bestWin, run);
      else bestLoss = Math.max(bestLoss, run);
    });
    if (sorted.length) {
      const lastIsWin = sorted[sorted.length - 1].pnl > 0;
      currentType = lastIsWin ? "win" : "loss";
      current = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const isWin = sorted[i].pnl > 0;
        if ((isWin ? "win" : "loss") === currentType) current += 1;
        else break;
      }
    }
    return { current, currentType, bestWin, bestLoss };
  }, [baseTrades]);

  // Un trade "siguió el plan" si se evaluaron razones (checklist), ninguna quedó
  // marcada como "ignorada", y no se etiquetó ningún error de ejecución.
  function tradeFollowedPlan(t) {
    const reasons = Object.values(t.reasons || {});
    const evaluated = reasons.filter(r => r.checked || r.ignored);
    if (!evaluated.length) return null; // sin datos suficientes, no cuenta ni a favor ni en contra
    const hasIgnored = evaluated.some(r => r.ignored);
    const hasErrors = (t.errors || []).length > 0;
    return !hasIgnored && !hasErrors;
  }

  // Racha de cumplimiento del plan: trades consecutivos evaluados donde se siguió
  // el plan al pie de la letra (complementa al Playbook Score, que es un promedio).
  const planStreakStats = useMemo(() => {
    const sorted = [...baseTrades]
      .filter(t => tradeFollowedPlan(t) !== null)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
    let current = 0, best = 0, run = 0;
    sorted.forEach(t => {
      if (tradeFollowedPlan(t)) { run += 1; best = Math.max(best, run); }
      else run = 0;
    });
    // racha actual = trades consecutivos cumplidos contando desde el final
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (tradeFollowedPlan(sorted[i])) current += 1;
      else break;
    }
    return { current, best, evaluated: sorted.length };
  }, [baseTrades]);

  // Frecuencia e impacto en P&L de cada error de ejecución etiquetado.
  const errorStats = useMemo(() => {
    const map = {};
    baseTrades.forEach(t => {
      (t.errors || []).forEach(err => {
        if (!map[err]) map[err] = { count: 0, pnl: 0 };
        map[err].count += 1;
        map[err].pnl += t.pnl;
      });
    });
    return Object.entries(map)
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [baseTrades]);

  const BAR_W = 560, BAR_H = 130;
  const maxAbsBar = useMemo(() => Math.max(...barData.map(d => Math.abs(d.pnl)), 1), [barData]);
  const barSpacing = BAR_W / (barData.length || 1);
  const barWidth = Math.min(36, barSpacing - 6);

  const mStats = useMemo(() => {
    const wins = monthTrades.filter(t => t.pnl > 0);
    const losses = monthTrades.filter(t => t.pnl <= 0);
    const pnl = monthTrades.reduce((s, t) => s + t.pnl, 0);
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    return {
      wins: wins.length, losses: losses.length, pnl, grossWin, grossLoss,
      profitFactor: grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : "∞",
      avgWin: wins.length ? (grossWin / wins.length).toFixed(2) : "0",
      avgLoss: losses.length ? (grossLoss / losses.length).toFixed(2) : "0",
      wr: monthTrades.length ? ((wins.length / monthTrades.length) * 100).toFixed(1) : "0",
      avgRR: monthTrades.length ? (monthTrades.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / monthTrades.length).toFixed(2) : "0",
      total: monthTrades.length,
      byInst: Object.fromEntries(INSTRUMENTS.map(inst => {
        const it = monthTrades.filter(t => t.instrument === inst);
        const iw = it.filter(t => t.pnl > 0).length;
        return [inst, { count: it.length, pnl: it.reduce((s, t) => s + t.pnl, 0), wins: iw, losses: it.length - iw, wr: it.length ? ((iw / it.length) * 100).toFixed(0) : "0" }];
      })),
      bySess: Object.fromEntries(SESSIONS.map(s => {
        const st = monthTrades.filter(t => t.session === s);
        if (!st.length) return [s, null];
        const sp = st.reduce((sum, t) => sum + t.pnl, 0);
        return [s, { count: st.length, pnl: sp, wr: ((st.filter(t => t.pnl > 0).length / st.length) * 100).toFixed(0) }];
      }).filter(([, v]) => v)),
    };
  }, [monthTrades]);

  // Tween del P&L grande del header al cambiar el mes seleccionado (pill
  // "Ene", "Feb"...), en vez de que salte de golpe.
  const animMonthPnl = useAnimatedNumber(mStats.pnl);

  // Mes anterior CON trades (no necesariamente el mes calendario inmediato
  // anterior — se salta meses vacíos, igual que hace barData) al que está
  // seleccionado, para mostrar el delta junto al P&L del header. Reutiliza
  // monthsWithTrades, que ya viene ordenado de más reciente a más antiguo.
  const prevMStats = useMemo(() => {
    const idx = monthsWithTrades.indexOf(selectedMonth);
    const prevMonth = idx >= 0 ? monthsWithTrades[idx + 1] : undefined;
    if (!prevMonth) return null;
    const pt = baseTrades.filter(t => t.date.startsWith(prevMonth));
    const wins = pt.filter(t => t.pnl > 0).length;
    return {
      pnl: pt.reduce((s, t) => s + t.pnl, 0),
      wr: pt.length ? (wins / pt.length) * 100 : 0,
      avgRR: pt.length ? pt.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / pt.length : 0,
    };
  }, [monthsWithTrades, selectedMonth, baseTrades]);

  // Mismo chip visual que usa el dashboard principal (TradingJournalInner),
  // reimplementado acá porque este componente vive en su propio archivo.
  function DeltaChip({ diff, suffix }) {
    if (!prevMStats || Math.abs(diff) < 0.005) return null;
    const up = diff > 0;
    const color = up ? T.gain : T.loss;
    const Icon = up ? TrendingUp : TrendingDown;
    const text = suffix === "money" ? `${up ? "+" : ""}${money(diff)}`
      : suffix === "pp" ? `${up ? "+" : ""}${diff.toFixed(1)}pp`
      : `${up ? "+" : ""}${diff.toFixed(2)}R`;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 6,
        padding: "1px 6px", borderRadius: 999, fontSize: FS.xs, fontWeight: 700,
        color, background: `${color}16`,
      }}>
        <Icon size={10} strokeWidth={2.5} />{text}
      </span>
    );
  }

  // P&L acumulado día a día del mes seleccionado, para el sparkline junto
  // al header. Mismo criterio que el dashboard principal: sin ejes, sin
  // etiquetas, solo la forma de la curva.
  const monthPnlSpark = useMemo(() => {
    const sorted = [...monthTrades].sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0;
    return sorted.map(t => (cum += t.pnl));
  }, [monthTrades]);

  // Mismo componente Sparkline que usa el dashboard principal.
  function Sparkline({ data, color, width = 90 }) {
    if (!data || data.length < 2) return null;
    const w = 100, h = 26;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const line = data.map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`).join(" ");
    const area = `0,${h} ${line} ${w},${h}`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width, height: h, display: "block" }}>
        <polygon points={area} fill={`${color}16`} stroke="none" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <DateRangeFilter range={dateRange} setRange={setDateRange} accentColor={accentColor} />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <InstrumentFilter filterInst={filterInst} setFilterInst={setFilterInst} accentColor={accentColor} />
        {setupsList.length > 0 && (
          <>
            <span style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", alignSelf: "center", marginLeft: 10 }}>Setup:</span>
            <select value={filterSetup} onChange={e => setFilterSetup(e.target.value)}
              style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: FS.base }}>
              <option value="All">Todos</option>
              {setupsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}
        <button onClick={() => exportTradesToCSV(baseTrades, `estadisticas-trades-${new Date().toISOString().slice(0,10)}.csv`)}
          title="Exportar los trades filtrados a un archivo CSV (compatible con Excel)"
          style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }} aria-label="Exportar los trades filtrados a un archivo CSV (compatible con Excel)">
          <FileText size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Exportar CSV
        </button>
      </div>
      <AdvancedMetricsPanel trades={baseTrades} accentColor={accentColor} accountSize={accountSize} themeMode={themeMode} />

      {/* Bar chart */}
      <div className="hz-card" style={{ ...S.card, padding: 20, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>Beneficio mensual</div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 16 }}>Haz clic para ver el detalle del mes</div>
        <svg viewBox={`0 0 ${BAR_W} ${BAR_H + 28}`} style={{ width: "100%", height: 150 }}>
          <line x1={0} y1={BAR_H / 2} x2={BAR_W} y2={BAR_H / 2} stroke={T.border} strokeWidth="1.5" strokeDasharray="4,3" />
          {barData.map((d, i) => {
            const cx = barSpacing * i + barSpacing / 2;
            const pct = d.pnl / maxAbsBar;
            const barH = Math.abs(pct) * (BAR_H / 2 - 6);
            const y = d.pnl >= 0 ? BAR_H / 2 - barH : BAR_H / 2;
            const isSelected = d.month === selectedMonth;
            const color = d.pnl >= 0 ? T.gain : T.loss;
            return (
              <g key={d.month} onClick={() => setSelectedMonth(d.month)} style={{ cursor: "pointer" }}>
                <rect x={cx - barWidth / 2} y={y} width={barWidth} height={Math.max(barH, 2)} rx={3}
                  fill={isSelected ? color : color + "55"} stroke={isSelected ? color : "none"} strokeWidth={1.5} />
                <text x={cx} y={BAR_H + 18} textAnchor="middle" fontSize="8.5" fill={isSelected ? T.text : T.textFaint} fontWeight={isSelected ? 700 : 400}>{d.label}</text>
                {Math.abs(d.pnl) > 0 && (
                  <text x={cx} y={d.pnl >= 0 ? y - 3 : y + barH + 10} textAnchor="middle" fontSize="7.5" fill={color} fontWeight="700">
                    {moneyCompact(d.pnl)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Month pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {monthsWithTrades.map(m => {
          const [y, mo] = m.split("-");
          const mt = baseTrades.filter(t => t.date.startsWith(m));
          const mp = mt.reduce((s, t) => s + t.pnl, 0);
          return (
            <button key={m} onClick={() => setSelectedMonth(m)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${selectedMonth === m ? accentColor + "88" : T.border}`, background: selectedMonth === m ? accentColor + "12" : T.surface, color: selectedMonth === m ? accentColor : T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: selectedMonth === m ? 700 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span>{MONTHS_SHORT[parseInt(mo) - 1]} {y}</span>
              <span style={{ fontSize: FS.xs, fontWeight: 700, color: mp >= 0 ? T.gain : T.loss }}>{money(mp, 0)}</span>
            </button>
          );
        })}
      </div>

      {/* Streak Tracker */}
      {baseTrades.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
          <div className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
            <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Racha actual</div>
            <div style={{ fontSize: FS.xl, fontWeight: 700, color: streakStats.currentType === "win" ? T.gain : T.loss }}>
              {streakStats.currentType === "win" ? "🔥 " : "🥶 "}{streakStats.current} {streakStats.currentType === "win" ? "ganadores" : "perdedores"}
            </div>
          </div>
          <div className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
            <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Mejor racha ganadora</div>
            <div style={{ fontSize: FS.xl, fontWeight: 700, color: T.gain }}>{streakStats.bestWin} trades</div>
          </div>
          <div className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
            <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Peor racha perdedora</div>
            <div style={{ fontSize: FS.xl, fontWeight: 700, color: T.loss }}>{streakStats.bestLoss} trades</div>
          </div>
        </div>
      )}

      {/* Racha de cumplimiento del plan (distinta del Playbook Score, que es un promedio) */}
      {planStreakStats.evaluated > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
          <div className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
            <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Racha actual — cumplimiento del plan</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.xl, fontWeight: 700, color: planStreakStats.current > 0 ? T.gain : T.textFaint }}>
              {planStreakStats.current > 0 ? <Check size={18} strokeWidth={3} /> : "—"}{planStreakStats.current} trade{planStreakStats.current !== 1 ? "s" : ""} siguiendo el plan
            </div>
          </div>
          <div className="hz-card" style={{ ...S.card, padding: "12px 14px" }}>
            <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Mejor racha de cumplimiento</div>
            <div style={{ fontSize: FS.xl, fontWeight: 700, color: "#6366f1" }}>{planStreakStats.best} trades</div>
          </div>
        </div>
      )}

      {/* Errores de ejecución más frecuentes */}
      {errorStats.length > 0 && (
        <div className="hz-card" style={{ ...S.card, padding: 20, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}><AlertTriangle size={14} />Errores de ejecución más frecuentes</div>
          <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>Cuántas veces se repitió cada error, y cuánto P&L costó en total</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {errorStats.map(e => (
              <div key={e.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: FS.base, fontWeight: 600, color: T.text }}>{e.label}</span>
                  <span style={{ fontSize: FS.xs, color: T.textFaint }}>× {e.count}</span>
                </div>
                <span style={{ fontSize: FS.base, fontWeight: 700, color: e.pnl >= 0 ? T.gain : T.loss }}>{money(e.pnl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Playbook Score y Rendimiento por día van lado a lado — ninguno de
          los dos necesita el ancho completo (uno es básicamente un número +
          una franja de barras chica, el otro son 7 columnas angostas), así
          que juntos ocupan una sola fila en vez de dos, igual que en Trades. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 14 }}>
        <PlaybookAdherencePanel trades={baseTrades} accentColor={accentColor} themeMode={themeMode} />

        {baseTrades.length > 0 && (
          <div className="hz-card" style={{ ...S.card, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>Rendimiento por día de la semana</div>
            <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 16 }}>Todo el historial filtrado · {baseTrades.length} trades</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {weekdayStats.map(d => {
                const wr = d.count ? ((d.wins / d.count) * 100).toFixed(0) : "0";
                const color = d.pnl >= 0 ? T.gain : T.loss;
                return (
                  <div key={d.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>{d.label}</div>
                    <div style={{ height: 70, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 6 }}>
                      <div style={{
                        width: "70%",
                        height: d.count ? `${Math.max(8, Math.min(100, (Math.abs(d.pnl) / (Math.max(...weekdayStats.map(x => Math.abs(x.pnl)), 1))) * 100))}%` : 4,
                        background: d.count ? color : T.border,
                        borderRadius: 4,
                      }} />
                    </div>
                    <div style={{ fontSize: FS.xs, fontWeight: 700, color: d.count ? color : T.textFaint }}>
                      {d.count ? money(d.pnl, 0) : "—"}
                    </div>
                    <div style={{ fontSize: FS.xs, color: T.textFaint }}>{d.count} trades{d.count ? ` · ${wr}%` : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {baseTrades.length > 0 && <DayHourHeatmap trades={baseTrades} />}


      {selectedMonth && monthTrades.length > 0 && (() => {
        const [y, mo] = selectedMonth.split("-");
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 28, background: accentColor, borderRadius: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: FS.lg, color: T.text }}>{MONTHS_FULL[parseInt(mo) - 1]} {y}</div>
                <div style={{ fontSize: FS.sm, color: T.textMuted }}>{mStats.total} trades</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                <Sparkline data={monthPnlSpark} color={mStats.pnl >= 0 ? T.gain : T.loss} />
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <span style={{ fontSize: FS.xl, fontWeight: 700, color: mStats.pnl >= 0 ? T.gain : T.loss }} className="hz-countup">{money(animMonthPnl)}</span>
                  {prevMStats && <DeltaChip diff={mStats.pnl - prevMStats.pnl} suffix="money" />}
                </div>
              </div>
            </div>

            {/* P&L table */}
            <div className="hz-card" style={{ ...S.card, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", background: T.surfaceAlt }}>Tabla P&L</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.surfaceAlt }}>
                    {["Métrica","Ganadores","Perdedores","Total"].map(h => (
                      <th key={h} style={{ padding: "8px 14px", fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textAlign: h === "Métrica" ? "left" : "center", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Nº de trades", mStats.wins, mStats.losses, mStats.total],
                    ["% del total", `${mStats.wr}%`, `${(100 - parseFloat(mStats.wr)).toFixed(1)}%`, "100%"],
                    ["Suma P&L ($)", money(mStats.grossWin), `-${money(mStats.grossLoss).slice(1)}`, money(mStats.pnl)],
                    ["Promedio ($)", `$${mStats.avgWin}`, `-$${mStats.avgLoss}`, money(mStats.pnl / (mStats.total || 1))],
                    ["R:R promedio", mStats.avgRR, "—", mStats.avgRR],
                    ["Profit Factor", mStats.profitFactor, "—", mStats.profitFactor],
                  ].map(([label, win, loss, total], i) => (
                    <tr key={label} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceAlt }}>
                      <td style={{ padding: "9px 14px", fontSize: FS.base, color: T.textMuted, fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "9px 14px", fontSize: FS.base, fontWeight: 700, color: T.gain, textAlign: "center" }}>{win}</td>
                      <td style={{ padding: "9px 14px", fontSize: FS.base, fontWeight: 700, color: T.loss, textAlign: "center" }}>{loss}</td>
                      <td style={{ padding: "9px 14px", fontSize: FS.base, fontWeight: 700, color: T.text, textAlign: "center" }}>{total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* By instrument & session */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { title: "Por instrumento", items: INSTRUMENTS.map(inst => ({ label: `${instEmoji(inst)} ${instLabel(inst)}`, color: INST_COLOR[inst], ...mStats.byInst[inst] })).filter(d => d.count) },
                { title: "Por sesión", items: Object.entries(mStats.bySess).map(([s, d]) => ({ label: s, color: accentColor, ...d })).sort((a, b) => b.pnl - a.pnl) },
              ].map(({ title, items }) => (
                <div key={title} className="hz-card" style={{ ...S.card, padding: 14 }}>
                  <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{title}</div>
                  {items.length === 0 ? <div style={{ fontSize: FS.sm, color: T.textFaint }}>Sin datos</div> : items.map(d => (
                    <div key={d.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: FS.sm, fontWeight: 700, color: d.color }}>{d.label}</span>
                        <span style={{ fontSize: FS.sm, fontWeight: 700, color: d.pnl >= 0 ? T.gain : T.loss }}>{money(d.pnl)}</span>
                      </div>
                      <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${d.wr}%`, background: d.pnl >= 0 ? d.color : T.loss, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 2 }}>{d.count} trades · {d.wr}% WR</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
});


export { StatisticsView };
