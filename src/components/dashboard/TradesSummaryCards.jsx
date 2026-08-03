// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { T, FS, numMonoStyle, S } from "../../theme";
import { money } from "../../utils";
import { Sparkline } from "../../charts";
import { GaugeArc } from "../common/GaugeArc";
import { TradeOutcomeDonut } from "../common/TradeOutcomeDonut";

const TradesSummaryCards = memo(function TradesSummaryCards({ trades }) {
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const be = trades.filter(t => t.pnl === 0);
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : 0);
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
    const sortedByDate = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
    let cum = 0;
    const curve = sortedByDate.map(t => (cum += t.pnl));
    return { wins: wins.length, losses: losses.length, be: be.length, total: trades.length, profitFactor, avgWin, avgLoss, totalPnL, curve };
  }, [trades]);

  if (!stats.total) return null;

  const pfDisplay = stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2);
  // Se acota visualmente a [0, 2]: 1.0 (breakeven) cae al centro del arco,
  // por debajo tira hacia el rojo, por encima hacia el verde.
  const pfClamped = Math.max(0, Math.min(isFinite(stats.profitFactor) ? stats.profitFactor : 2, 2));
  const pfFrac = pfClamped / 2;
  const winPct = stats.total ? stats.wins / stats.total : 0;
  const avgSum = stats.avgWin + stats.avgLoss || 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 14 }}>
      <div className="hz-card" style={{ ...S.card, padding: 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ alignSelf: "flex-start", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Profit Factor</div>
        <GaugeArc frac={pfFrac} size={128} />
        <div style={{ fontSize: 26, fontWeight: 800, color: T.text, marginTop: 2, ...numMonoStyle }}>{pfDisplay}</div>
      </div>

      <div className="hz-card" style={{ ...S.card, padding: 18 }}>
        <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ganadores vs Perdedores</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <TradeOutcomeDonut win={stats.wins} loss={stats.losses} be={stats.be} size={90} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: FS.sm, fontWeight: 700 }}>
            <span style={{ color: T.gain }}>● {stats.wins} Ganadores</span>
            <span style={{ color: T.loss }}>● {stats.losses} Perdedores</span>
            <span style={{ color: T.textFaint }}>● {stats.be} Break Even</span>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 10, ...numMonoStyle }}>{Math.round(winPct * 100)}%</div>
      </div>

      <div className="hz-card" style={{ ...S.card, padding: 18 }}>
        <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Promedio Ganador vs Perdedor</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 12, ...numMonoStyle }}>{money(stats.avgWin)} <span style={{ color: T.textFaint, fontWeight: 600, fontSize: FS.base }}>vs</span> {money(-stats.avgLoss)}</div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: T.surfaceAlt }}>
          <div style={{ width: `${(stats.avgWin / avgSum) * 100}%`, background: T.gain }} />
          <div style={{ width: `${(stats.avgLoss / avgSum) * 100}%`, background: T.loss }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: FS.xs, color: T.textFaint, marginTop: 5 }}>
          <span>{money(stats.avgWin)}</span>
          <span>{money(-stats.avgLoss)}</span>
        </div>
      </div>

      <div className="hz-card" style={{ ...S.card, padding: 18 }}>
        <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>P&L</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: stats.totalPnL >= 0 ? T.gain : T.loss, marginBottom: 10, ...numMonoStyle }}>{money(stats.totalPnL)}</div>
        <Sparkline values={stats.curve.length > 1 ? stats.curve : [0, stats.curve[0] || 0]} color={stats.totalPnL >= 0 ? T.gain : T.loss} width={170} height={42} />
      </div>
    </div>
  );
});


export { TradesSummaryCards };
