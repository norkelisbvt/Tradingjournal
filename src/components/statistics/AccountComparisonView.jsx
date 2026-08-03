// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { T, FS, S } from "../../theme";
import { INSTRUMENTS, INST_COLOR, SESSIONS, ACCOUNT_META } from "../../constants";
import { instLabel, instEmoji, money } from "../../utils";
import { MetricsSubTable } from "./MetricsSubTable";

const AccountComparisonView = memo(function AccountComparisonView({ trades, accountOrder, accentColor }) {
  const GROUPS = [
    { key: "personal", label: ACCOUNT_META.personal.label, color: ACCOUNT_META.personal.color },
    { key: "funded", label: ACCOUNT_META.funded.label, color: ACCOUNT_META.funded.color },
    { key: "backtest", label: ACCOUNT_META.backtest.label, color: ACCOUNT_META.backtest.color },
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
  const maxPnlAbs = Math.max(...GROUPS.map(g => Math.abs(groupStats[g.key].pnl)), 1);

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
              </div>
              <div style={{ fontSize: FS.xl, fontWeight: 800, color: st.pnl >= 0 ? T.gain : T.loss, marginBottom: 4 }}>{money(st.pnl)}</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted }}>{st.count} trades · {st.wr}% WR · R:R {st.avgRR}</div>
            </div>
          );
        })}
      </div>

      {/* P&L comparativo */}
      <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 18 }}>P&L total por cuenta</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 28, height: 140, padding: "0 10px" }}>
          {GROUPS.map(g => {
            const st = groupStats[g.key];
            const h = Math.max(4, (Math.abs(st.pnl) / maxPnlAbs) * 118);
            return (
              <div key={g.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: FS.sm, fontWeight: 700, color: st.pnl >= 0 ? T.gain : T.loss }}>{money(st.pnl)}</div>
                <div style={{ width: "56%", height: h, background: g.color, borderRadius: "6px 6px 0 0", opacity: st.pnl >= 0 ? 1 : 0.5, transition: "height 0.2s" }} />
                <div style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>{g.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winrate comparativo */}
      <div style={{ ...S.card, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 16 }}>Winrate por cuenta</div>
        {GROUPS.map(g => {
          const st = groupStats[g.key];
          return (
            <div key={g.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: FS.base, fontWeight: 700, color: g.color }}>{g.label}</span>
                <span style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>{st.wr}% <span style={{ color: T.textFaint, fontWeight: 600 }}>({st.count} trades)</span></span>
              </div>
              <div style={{ height: 7, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${st.wr}%`, background: g.color, borderRadius: 4, transition: "width 0.2s" }} />
              </div>
            </div>
          );
        })}
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
