// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Ruler, ChevronDown } from "lucide-react";
import { T, FS, S, EASE } from "../../theme";
import { money, pctFmt, moneyCompact, computeAdvancedMetrics } from "../../utils";
import { InteractiveCurveChart, RMultipleDistribution } from "../../charts";

// themeMode solo se recibe para que memo() note el cambio de tema (T se lee
// del módulo de tema como objeto mutable, no como prop) — ver StatisticsView.jsx.
const AdvancedMetricsPanel = memo(function AdvancedMetricsPanel({ trades, accentColor, accountSize, themeMode }) {
  const [benchmarkPct, setBenchmarkPct] = useState("");
  // Colapsado por defecto: las 4 métricas "cabecera" de abajo son las que se
  // miran seguido; Sharpe/Sortino/Calmar/Recovery/Kelly, las 2 curvas, la
  // distribución de R y el comparador de benchmark son consulta ocasional —
  // no hace falta que compitan por atención cada vez que se entra al tab.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const m = useMemo(() => computeAdvancedMetrics(trades, accountSize), [trades, accountSize]);
  const riskOfRuin = useMemo(() => m.computeRiskOfRuin(), [m]);

  if (!trades.length) {
    return (
      <div style={{ ...S.card, padding: 18, marginBottom: 14, textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
        No hay trades en este período para calcular métricas avanzadas.
      </div>
    );
  }

  const bench = parseFloat(benchmarkPct);
  const hasBench = benchmarkPct !== "" && !isNaN(bench);

  // Badge de respaldo: cuántos trades y qué rango de fechas exacto sostienen
  // los números de abajo. Antes el subtítulo decía genéricamente "sobre el
  // período filtrado" — una cifra como el Sharpe ratio o el Kelly óptimo se
  // siente mucho más confiable cuando se ve, al lado, sobre cuántas
  // operaciones y qué ventana de tiempo se calculó exactamente.
  const periodInfo = useMemo(() => {
    if (!trades.length) return null;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const fmt = (iso) => { const [y, mo, d] = iso.split("-"); return `${d}/${mo}/${y.slice(2)}`; };
    return { count: trades.length, from: fmt(sorted[0].date), to: fmt(sorted[sorted.length - 1].date) };
  }, [trades]);

  const metricBox = (label, value, sub, color) => (
    <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: FS.lg, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: FS.xs, color: T.textFaint }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text }}><Ruler size={14} />Métricas avanzadas</div>
        {periodInfo && (
          <span style={S.tag(accentColor)}>
            {periodInfo.count} trade{periodInfo.count === 1 ? "" : "s"} · {periodInfo.from} – {periodInfo.to}
          </span>
        )}
      </div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 16 }}>Drawdown, expectancy, R-múltiplos y ratios de riesgo-retorno sobre el período filtrado</div>

      {/* Cabecera: las 4 métricas que de verdad se consultan seguido */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        {metricBox("Drawdown máx.", accountSize ? `-${pctFmt(m.maxDDPct, 1)}` : "—", accountSize ? `-${money(m.maxDD)}` : "sin tamaño de cuenta", T.loss)}
        {metricBox("Expectancy / trade", `${m.expectancyR >= 0 ? "+" : ""}${m.expectancyR.toFixed(2)}R`, `${money(m.expectancyDollar)} promedio`, m.expectancyR >= 0 ? T.gain : T.loss)}
        {metricBox("Profit Factor", m.profitFactor === Infinity ? "∞" : m.profitFactor.toFixed(2), "ganancia bruta / pérdida bruta", m.profitFactor >= 1.5 ? T.gain : m.profitFactor >= 1 ? "#d97706" : T.loss)}
        {metricBox("Riesgo de ruina", riskOfRuin == null ? "—" : `${riskOfRuin.pct.toFixed(1)}%`, riskOfRuin == null ? "faltan trades para simular" : `prob. de caer -${riskOfRuin.ruinThresholdPct}% en ${riskOfRuin.tradesPerSim} trades`, riskOfRuin == null ? T.textFaint : riskOfRuin.pct >= 10 ? T.loss : riskOfRuin.pct >= 2 ? "#d97706" : T.gain)}
      </div>

      <button onClick={() => setShowAdvanced(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "6px 0", fontSize: FS.sm, fontWeight: 700, color: accentColor }}>
        <ChevronDown size={14} style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: `transform 0.18s ${EASE}` }} />
        {showAdvanced ? "Ocultar métricas avanzadas" : "Ver métricas avanzadas"}
        <span style={{ fontWeight: 400, color: T.textFaint }}>— Sharpe, Sortino, Kelly, curvas de capital y drawdown, distribución de R, benchmark</span>
      </button>

      {showAdvanced && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
            {metricBox("Sharpe ratio", m.sharpe != null ? m.sharpe.toFixed(2) : "—", "por trade, sin anualizar", accentColor)}
            {metricBox("Sortino ratio", m.sortino != null ? m.sortino.toFixed(2) : "—", "solo penaliza pérdidas", accentColor)}
            {metricBox("Recovery Factor", m.recoveryFactor == null ? "—" : m.recoveryFactor.toFixed(2), "ganancia neta / peor caída", m.recoveryFactor == null ? T.textFaint : m.recoveryFactor >= 1 ? T.gain : "#d97706")}
            {metricBox("Calmar Ratio", m.calmarRatio == null ? "—" : m.calmarRatio.toFixed(2), "retorno % / drawdown %", m.calmarRatio == null ? T.textFaint : m.calmarRatio >= 1 ? T.gain : "#d97706")}
            {metricBox("Kelly óptimo", m.kellyPct == null ? "—" : `${m.kellyPct.toFixed(1)}%`, m.kellyPct == null ? "sin edge positivo" : `medio-Kelly: ${(m.kellyPct / 2).toFixed(1)}%`, accentColor)}
          </div>
          {riskOfRuin != null && (
            <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: -10, marginBottom: 18 }}>
              Simulación Monte Carlo (1500 corridas) remuestreando tus propios R-múltiplos históricos, asumiendo un riesgo promedio de {riskOfRuin.avgRiskPct.toFixed(2)}% de la cuenta por trade. Es una estimación estadística sobre tu comportamiento pasado, no una garantía a futuro.
            </div>
          )}

          {/* Curva de capital: equity acumulado real, trade a trade */}
          {accountSize > 0 && m.curve.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Curva de capital</div>
              <InteractiveCurveChart
                points={[{ y: accountSize, label: "Inicio" }, ...m.curve.map(c => ({ y: c.equity, label: new Date(c.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) }))]}
                color={m.totalReturnPct >= 0 ? T.gain : T.loss}
                height={170}
                referenceValue={accountSize}
                referenceLabel="Balance inicial"
                formatValue={v => moneyCompact(v)}
                exportFilename="curva-de-capital.png"
              />
              <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 4 }}>Equity acumulado de la cuenta a partir de su balance inicial, trade a trade.</div>
            </div>
          )}

          {/* Curva de drawdown: % bajo el último pico de equity, trade a trade */}
          {accountSize > 0 && m.drawdownCurve.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Curva de drawdown</div>
              <InteractiveCurveChart
                points={m.drawdownCurve.map(p => ({ y: p.ddPct, label: new Date(p.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" }), ddDollars: p.ddDollars }))}
                color={T.loss}
                height={140}
                referenceValue={0}
                referenceLabel="0%"
                formatValue={v => `${v > 0 ? "-" : ""}${pctFmt(Math.abs(v), 1)}`}
                formatSub={p => `${p.ddDollars > 0 ? "-" : ""}${money(Math.abs(p.ddDollars))} bajo el pico`}
                exportFilename="curva-de-drawdown.png"
              />
              <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 4 }}>Distancia bajo el último pico de equity de la cuenta, medida trade a trade.</div>
            </div>
          )}

          {/* Distribución de R-múltiplos */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Distribución de R-múltiplos</div>
            <RMultipleDistribution buckets={m.buckets} expectancyR={m.expectancyR} />
            <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 8 }}>
              El R-múltiplo se estima con el % de riesgo cargado en cada trade contra el tamaño de cuenta actual; si un trade no tiene riesgo cargado, se aproxima con su R:R.
            </div>
          </div>

          {/* Comparación contra benchmark */}
          <div>
            <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Comparar contra un benchmark</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input type="number" placeholder="ej. S&P 500: 4.2" value={benchmarkPct} onChange={e => setBenchmarkPct(e.target.value)}
                style={{ ...S.input, width: 220 }} />
              <span style={{ fontSize: FS.sm, color: T.textMuted }}>% de retorno del benchmark en el mismo período</span>
            </div>
            {hasBench && (
              <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Tu cuenta</div>
                  <div style={{ fontSize: FS.lg, fontWeight: 700, color: (m.totalReturnPct ?? 0) >= 0 ? T.gain : T.loss }}>
                    {m.totalReturnPct != null ? pctFmt(m.totalReturnPct) : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Benchmark</div>
                  <div style={{ fontSize: FS.lg, fontWeight: 700, color: T.textMuted }}>{bench >= 0 ? "+" : ""}{bench.toFixed(2)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Diferencia</div>
                  <div style={{ fontSize: FS.lg, fontWeight: 700, color: (m.totalReturnPct ?? 0) - bench >= 0 ? T.gain : T.loss }}>
                    {m.totalReturnPct != null ? pctFmt(m.totalReturnPct - bench) : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});


export { AdvancedMetricsPanel };
