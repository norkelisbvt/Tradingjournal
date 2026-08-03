// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { T, FS, numMonoStyle, S } from "../../theme";
import { money, pctFmt, moneyCompact, computeAdvancedMetrics } from "../../utils";
import { InteractiveCurveChart, Sparkline } from "../../charts";
import { CountUp } from "../common/CountUp";
import { usePulseOnSignChange } from "../../hooks/usePulseOnSignChange";

const EquityHeroCard = memo(function EquityHeroCard({ trades, accountSize, accentColor }) {
  const m = useMemo(() => computeAdvancedMetrics(trades, accountSize), [trades, accountSize]);
  const sorted = useMemo(() => [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0)), [trades]);

  const points = useMemo(() => {
    const base = { y: accountSize || 0, label: "Inicio" };
    const rest = m.curve.map(c => ({ y: c.equity, label: new Date(c.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) }));
    return [base, ...rest];
  }, [m.curve, accountSize]);

  const currentEquity = points.length ? points[points.length - 1].y : (accountSize || 0);
  // Serie "bajo el agua" (equity - pico acumulado hasta ese punto): alimenta
  // el sparkline de Drawdown máx., mostrando la forma de las caídas en vez de
  // solo el número puntual del peor drawdown.
  const underwaterSeries = useMemo(() => {
    let peak = -Infinity;
    return points.map(p => { peak = Math.max(peak, p.y); return p.y - peak; });
  }, [points]);
  const totalReturn = m.totalReturnPct;
  const positive = (totalReturn ?? 0) >= 0;
  const heroColor = positive ? T.gain : T.loss;
  const returnPulseKey = usePulseOnSignChange(totalReturn ?? 0);

  if (!sorted.length) {
    return (
      <div style={{ ...S.card, padding: 26, marginBottom: 14, textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
        Todavía no hay trades registrados en esta cuenta. La curva de capital aparecerá acá apenas cargues el primero.
      </div>
    );
  }

  return (
    <div style={{ ...S.card, padding: "24px 26px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${heroColor}0d, transparent 55%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Curva de capital</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 38, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", ...numMonoStyle }}>
              <CountUp value={currentEquity} format={v => money(v, 0)} />
            </span>
            {totalReturn != null && (
              <span key={returnPulseKey} className={returnPulseKey ? "hz-value-pulse" : ""} style={{ fontSize: FS.lg, fontWeight: 800, color: heroColor, letterSpacing: "-0.01em", ...numMonoStyle }}>
                {positive ? "▲" : "▼"} <CountUp value={Math.abs(totalReturn)} format={v => pctFmt(v, 1)} />
              </span>
            )}
          </div>
          <div style={{ fontSize: FS.sm, color: T.textMuted, marginTop: 4 }}>{sorted.length} trade{sorted.length !== 1 ? "s" : ""} en el historial de esta cuenta</div>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Drawdown máx.</div>
            <div style={{ fontSize: FS.lg, fontWeight: 800, color: T.loss, letterSpacing: "-0.01em", ...numMonoStyle }}>{accountSize ? `-${pctFmt(m.maxDDPct, 1)}` : "—"}</div>
            <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end" }}><Sparkline values={underwaterSeries} color={T.loss} /></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Profit Factor</div>
            <div style={{ fontSize: FS.lg, fontWeight: 800, color: accentColor, letterSpacing: "-0.01em", ...numMonoStyle }}>{m.profitFactor === Infinity ? "∞" : m.profitFactor.toFixed(2)}</div>
            <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end" }}><Sparkline values={points.map(p => p.y)} color={accentColor} /></div>
          </div>
        </div>
      </div>
      <InteractiveCurveChart
        points={points}
        color={heroColor}
        height={260}
        referenceValue={accountSize || null}
        referenceLabel="Balance inicial"
        formatValue={v => moneyCompact(v)}
        formatSub={p => p.label === "Inicio" ? "Balance inicial" : "Equity acumulado a esa fecha"}
        exportFilename="curva-de-capital.png"
      />
    </div>
  );
});


export { EquityHeroCard };
