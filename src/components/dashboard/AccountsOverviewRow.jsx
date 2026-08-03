// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { Wallet, ShieldCheck, TrendingUp } from "lucide-react";
import { T, FS, numMonoStyle, S } from "../../theme";
import { money } from "../../utils";

const AccountsOverviewRow = memo(function AccountsOverviewRow({ accountList, allTrades, accounts, activeAccount, setAccount, viewYear, viewMonth, onAddAccount, activeGroup }) {
  return (
    <div style={{ ...S.card, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: FS.base, color: T.textFaint }}>→</span>
          <span style={{ fontSize: FS.lg, fontWeight: 800, color: T.text }}>Accounts</span>
        </div>
        {activeGroup !== "backtest" && (
          <button onClick={() => onAddAccount(activeGroup)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }}>
            ＋ Agregar cuenta
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(accountList.length, 4)}, minmax(150px, 1fr))`, gap: 12, overflowX: "auto" }}>
        {(() => {
          const infoWrapStyle = { minWidth: 0 };
          const labelStyle = { fontSize: FS.base, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
          const brokerStyle = { fontSize: FS.xs, color: T.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
          const iconRowStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
          const statsColStyle = { display: "flex", flexDirection: "column", gap: 4, marginTop: 6 };
          const statRowStyle = { display: "flex", justifyContent: "space-between" };
          const statLabelStyle = { fontSize: FS.xs, color: T.textMuted };
          const balanceValStyle = { ...numMonoStyle, fontSize: FS.sm, fontWeight: 800, color: T.text };
          const pnlValBaseStyle = { ...numMonoStyle, fontSize: FS.sm, fontWeight: 700 };
          const liveRowStyle = { display: "flex", alignItems: "center", gap: 5, marginTop: 9 };
          const liveDotBaseStyle = { width: 6, height: 6, borderRadius: "50%", display: "inline-block" };
          const streakStyle = { marginLeft: "auto", fontSize: FS.xs, color: T.textFaint };
          return accountList.map(({ key, label, color, group: g }) => {
          const acc = accounts[key];
          if (!acc) return null;
          const pnlTotal = (allTrades[key] || []).reduce((s, t) => s + t.pnl, 0);
          const pct = acc.size > 0 ? ((pnlTotal / acc.size) * 100).toFixed(2) : "0.00";
          const active = key === activeAccount;
          const streak = (allTrades[key] || [])
            .filter(t => { const d = new Date(t.date + "T00:00:00"); return d.getFullYear() === viewYear && d.getMonth() === viewMonth; }).length;
          return (
            <div key={key} onClick={() => setAccount(key)}
              style={{ borderRadius: 12, border: `1.5px solid ${active ? color : T.border}`, background: active ? color + "0a" : T.surfaceAlt, padding: 13, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={iconRowStyle}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.base, flexShrink: 0 }}>
                  {g === "personal" ? <Wallet size={13} /> : g === "funded" ? <ShieldCheck size={13} /> : <TrendingUp size={13} />}
                </div>
                <div style={infoWrapStyle}>
                  <div style={labelStyle}>{label}</div>
                  <div style={brokerStyle}>{acc.broker || "—"}</div>
                </div>
              </div>
              {acc.phase && <span style={{ ...S.tag(color), marginBottom: 8, display: "inline-block" }}>{acc.phase}</span>}
              <div style={statsColStyle}>
                <div style={statRowStyle}>
                  <span style={statLabelStyle}>Balance</span>
                  <span style={balanceValStyle}>{money(acc.size + pnlTotal, 0)}</span>
                </div>
                <div style={statRowStyle}>
                  <span style={statLabelStyle}>Profit $</span>
                  <span style={{ ...pnlValBaseStyle, color: pnlTotal >= 0 ? T.gain : T.loss }}>{money(pnlTotal, 0)}</span>
                </div>
                <div style={statRowStyle}>
                  <span style={statLabelStyle}>Profit %</span>
                  <span style={{ ...pnlValBaseStyle, color: pnlTotal >= 0 ? T.gain : T.loss }}>{pnlTotal >= 0 ? "+" : ""}{pct}%</span>
                </div>
              </div>
              <div style={liveRowStyle}>
                <span style={{ ...liveDotBaseStyle, background: g === "backtest" ? T.textFaint : T.gain }} />
                <span style={{ fontSize: FS.xs, color: g === "backtest" ? T.textFaint : T.gain, fontWeight: 700 }}>{g === "backtest" ? "Simulación" : "Live"}</span>
                {streak > 0 && <span style={streakStyle}>🔥 {streak} trades</span>}
              </div>
            </div>
          );
          });
        })()}
      </div>
    </div>
  );
});


export { AccountsOverviewRow };
