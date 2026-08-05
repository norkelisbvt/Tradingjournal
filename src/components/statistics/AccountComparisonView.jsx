// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { T, FS, S, numMonoStyle } from "../../theme";
import { INSTRUMENTS, INST_COLOR, SESSIONS, ACCOUNT_META } from "../../constants";
import { instLabel, instEmoji, money } from "../../utils";
import { MetricsSubTable } from "./MetricsSubTable";

const AccountComparisonView = memo(function AccountComparisonView({ trades, accountOrder, accentColor }) {
  const GROUPS = [
    { key: "personal", label: ACCOUNT_META.personal.label, color: ACCOUNT_META.personal.color, isSim: false },
    { key: "funded", label: ACCOUNT_META.funded.label, color: ACCOUNT_META.funded.color, isSim: false },
    { key: "backtest", label: ACCOUNT_META.backtest.label, color: ACCOUNT_META.backtest.color, isSim: true },
  ];

  const groupTrades = useMemo(() => {
    const m = {};
    GROUPS.forEach(g => {
      m[g.key] = g.key === "backtest"
        ? (trades.backtest || [])
        : (accountOrder[g.key] || []).flatMap(k => trades[k] || []);
    });
    return m;
  }, [trades, accountOrder]);

  function computeStats(list) {
    const wins = list.filter(t => t.pnl > 0);
    const pnl = list.reduce((s, t) => s + t.pnl, 0);
    return {
      count: list.length,
      pnl,
      wr: list.length ? ((wins.length / list.length) * 100).toFixed(1) : "0",
      avgRR: list.length ? (list.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0) / list.length).toFixed(2) : "0.00",
    };
  }

  function breakdown(list, keys, keyFn, colorOf) {
    return keys
      .map(k => {
        const kt = list.filter(t => keyFn(t) === k);
        return {
          label: k, color: colorOf(k), count: kt.length,
          pnl: kt.reduce((s, t) => s + t.pnl, 0),
          avgRR: kt.length ? (kt.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0) / kt.length).toFixed(2) : "0.00",
        };
      })
      .filter(d => d.count > 0);
  }

  const groupStats = useMemo(
    () => Object.fromEntries(GROUPS.map(g => [g.key, computeStats(groupTrades[g.key] || [])])),
    [groupTrades]
  );
  const realGroups = GROUPS.filter(g => !g.isSim);
  const backtestGroup = GROUPS.find(g => g.isSim);
  // La escala del gráfico de barras ahora se calcula SOLO sobre las cuentas
  // reales — antes incluía a Backtest, y un backtest suele acumular mucho más
  // historial (y por lo tanto más P&L simulado) que unos meses de trading
  // real, lo que podía achicar las barras reales a un hilito por comparación.
  const maxPnlAbs = Math.max(...realGroups.map(g => Math.abs(groupStats[g.key].pnl)), 1);

  return (
    <div>
      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
        {GROUPS.map(g => {
          const st = groupStats[g.key];
          return (
            <div key={g.key} style={{ ...S.card, padding: 16, borderTop: `3px solid ${g.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
                <div style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>{g.label}</div>
                {g.isSim && (
                  <span style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, background: T.surfaceAlt, border: `1px dashed ${T.border}`, borderRadius: 5, padding: "1px 6px" }}>simulado</span>
                )}
              </div>
              <div style={{ fontSize: FS.xl, fontWeight: 800, color: st.pnl >= 0 ? T.gain : T.loss, marginBottom: 4 }}>{money(st.pnl)}</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted }}>{st.count} trades · {st.wr}% WR · R:R {st.avgRR}</div>
            </div>
          );
        })}
      </div>

      {/* P&L, Backtest y Winrate: 3 cards en la misma grilla responsive.
          Backtest se separó del gráfico de barras de plata real — comparten
          poco sentido en la misma escala — y pasa a ser una card propia,
          chica y minimalista (sin ejes ni barras que comparar, ya que está
          solo). Usa el mismo lenguaje "simulado" (borde punteado + textura
          rayada) que ya se ve en el resto de la vista. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 14 }}>P&L por cuenta (real)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 100, padding: "0 6px" }}>
            {realGroups.map(g => {
              const st = groupStats[g.key];
              const h = Math.max(4, (Math.abs(st.pnl) / maxPnlAbs) * 78);
              return (
                <div key={g.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ fontSize: FS.xs, fontWeight: 700, color: st.pnl >= 0 ? T.gain : T.loss }}>{money(st.pnl)}</div>
                  <div style={{ width: "56%", height: h, background: g.color, borderRadius: "5px 5px 0 0", opacity: st.pnl >= 0 ? 1 : 0.5, transition: "height 0.2s" }} />
                  <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 600 }}>{g.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {backtestGroup && (() => {
          const st = groupStats[backtestGroup.key];
          const bColor = backtestGroup.color;
          return (
            <div style={{ ...S.card, padding: 16, border: `1px dashed ${bColor}55`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: bColor }} />
                <span style={{ fontWeight: 700, fontSize: FS.base, color: T.text }}>{backtestGroup.label}</span>
                <span style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, background: T.surfaceAlt, border: `1px dashed ${T.border}`, borderRadius: 5, padding: "1px 6px" }}>simulado</span>
              </div>
              <div style={{ ...numMonoStyle, fontSize: FS.xl, fontWeight: 800, color: st.pnl >= 0 ? T.gain : T.loss, letterSpacing: "-0.02em" }}>{money(st.pnl)}</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted }}>{st.count} trades · {st.wr}% WR · R:R {st.avgRR}</div>
              {/* Franja rayada como acento decorativo — hace eco de la
                  textura "simulado" sin pretender comparar magnitudes contra
                  las cuentas reales (por eso no tiene eje ni escala). */}
              <div style={{
                height: 5, borderRadius: 3, marginTop: 2,
                background: `repeating-linear-gradient(135deg, ${bColor}, ${bColor} 3px, ${bColor}30 3px, ${bColor}30 7px)`,
              }} />
            </div>
          );
        })()}

        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 12 }}>Winrate por cuenta</div>
          {GROUPS.map(g => {
            const st = groupStats[g.key];
            return (
              <div key={g.key} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: FS.sm, fontWeight: 700, color: g.color, display: "flex", alignItems: "center", gap: 5 }}>
                    {g.label}
                    {g.isSim && <span style={{ fontSize: FS.xs, fontWeight: 400, color: T.textFaint }}>(sim)</span>}
                  </span>
                  <span style={{ fontSize: FS.sm, fontWeight: 700, color: T.text }}>{st.wr}% <span style={{ color: T.textFaint, fontWeight: 600 }}>({st.count})</span></span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${st.wr}%`, background: g.color, borderRadius: 4, transition: "width 0.2s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla de métricas por instrumento y por sesión, una columna por cuenta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {GROUPS.map(g => {
          const list = groupTrades[g.key] || [];
          const byInst = breakdown(list, INSTRUMENTS, t => t.instrument, inst => INST_COLOR[inst])
            .map(d => ({ ...d, label: `${instEmoji(d.label)} ${instLabel(d.label)}` }));
          const bySess = breakdown(list, SESSIONS, t => t.session, () => g.color);
          return (
            <div key={g.key} style={{ ...S.card, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
                <span style={{ fontSize: FS.sm, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.label}</span>
                {g.isSim && <span style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, background: T.surfaceAlt, border: `1px dashed ${T.border}`, borderRadius: 5, padding: "1px 6px" }}>simulado</span>}
                <span style={{ marginLeft: "auto", fontSize: FS.sm, color: T.textFaint }}>{list.length} trades</span>
              </div>
              <MetricsSubTable title="Por instrumento" rows={byInst} total={list.length} />
              <div style={{ height: 1, background: T.border, margin: "0 14px" }} />
              <MetricsSubTable title="Por sesión" rows={bySess} total={list.length} />
            </div>
          );
        })}
      </div>
    </div>
  );
});


export { AccountComparisonView };
