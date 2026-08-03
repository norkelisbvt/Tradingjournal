// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { Pencil, Trash2, Check, Wallet, ShieldCheck, TrendingUp } from "lucide-react";
import { T, FS, numMonoStyle, S } from "../../theme";
import { ACCOUNT_META } from "../../constants";
import { money } from "../../utils";
import { TradingDaysWheel } from "../../charts";

const AccountBalanceCard = memo(function AccountBalanceCard({ account, group, accounts, allTrades, setAccounts, accentColor, viewYear, viewMonth, onAddAccount, onDeleteAccount, canDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  function startEdit() {
    setDraft({ ...accounts[account] });
    setEditing(true);
  }
  function save() {
    setAccounts(prev => ({ ...prev, [account]: { ...prev[account], ...draft, size: parseFloat(draft.size) || 0 } }));
    setEditing(false);
  }

  const label = accounts[account]?.name || ACCOUNT_META[group].label;
  const color = accentColor;
  const acc = accounts[account];
  const pnlTotal = (allTrades[account] || []).reduce((s, t) => s + t.pnl, 0);
  const balanceWithPnL = acc.size + pnlTotal;
  const pct = acc.size > 0 ? ((pnlTotal / acc.size) * 100).toFixed(2) : "0.00";

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="hz-card" style={{ ...S.card, padding: 16, position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "15", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.lg, flexShrink: 0 }}>
              {group === "personal" ? <Wallet size={16} /> : group === "funded" ? <ShieldCheck size={16} /> : <TrendingUp size={16} />}
            </div>
            <div>
              <div style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>{label}</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted }}>{acc.broker || "—"}</div>
            </div>
          </div>
          <button onClick={() => editing ? save() : startEdit()}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${color}44`, background: editing ? color : color + "18", color: editing ? "#fff" : color, cursor: "pointer", fontSize: FS.xs, fontWeight: 700 }}>
            {editing ? <><Check size={11} />Guardar</> : <><Pencil size={11} />Editar</>}
          </button>
        </div>
        {!editing && acc.phase && (
          <span style={{ ...S.tag(color), marginBottom: 10, display: "inline-block" }}>{acc.phase}</span>
        )}

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
            {group !== "backtest" && (
              <div>
                <label style={S.label}>Nombre de la cuenta</label>
                <input value={draft.name || ""} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={S.input} placeholder="ej. Personal 1, Personal Swing..." />
              </div>
            )}
            <div>
              <label style={S.label}>Broker / Empresa</label>
              <input value={draft.broker || ""} onChange={e => setDraft(d => ({ ...d, broker: e.target.value }))} style={S.input} placeholder="ej. FTMO, MyFundedFX..." />
            </div>
            <div>
              <label style={S.label}>Monto de cuenta ($)</label>
              <input type="number" value={draft.size || ""} onChange={e => setDraft(d => ({ ...d, size: e.target.value }))} style={{ ...S.input, fontWeight: 700, fontSize: FS.lg }} placeholder="ej. 10000" />
            </div>
            <div>
              <label style={S.label}>Fase / Descripción</label>
              <input value={draft.phase || ""} onChange={e => setDraft(d => ({ ...d, phase: e.target.value }))} style={S.input} placeholder="ej. Fase 1, Live, Paper..." />
            </div>
            <div>
              <label style={S.label}>Riesgo máx. por trade (%)</label>
              <input type="number" value={draft.riskPct || ""} onChange={e => setDraft(d => ({ ...d, riskPct: e.target.value }))} style={S.input} placeholder="ej. 1" />
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 2 }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Reglas de prop firm (opcional)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label style={S.label}>Límite de pérdida diaria (%)</label>
                  <input type="number" value={draft.dailyLossLimitPct || ""} onChange={e => setDraft(d => ({ ...d, dailyLossLimitPct: e.target.value }))} style={S.input} placeholder="ej. 5 (déjalo vacío si no aplica)" />
                </div>
                <div>
                  <label style={S.label}>Drawdown máximo total (%)</label>
                  <input type="number" value={draft.maxDrawdownPct || ""} onChange={e => setDraft(d => ({ ...d, maxDrawdownPct: e.target.value }))} style={S.input} placeholder="ej. 10 (déjalo vacío si no aplica)" />
                </div>
                <div>
                  <label style={S.label}>Máx. trades por día</label>
                  <input type="number" value={draft.maxTradesPerDay || ""} onChange={e => setDraft(d => ({ ...d, maxTradesPerDay: e.target.value }))} style={S.input} placeholder="ej. 3 (déjalo vacío si no aplica)" />
                </div>
                <div>
                  <label style={S.label}>Límite de riesgo semanal (%)</label>
                  <input type="number" value={draft.weeklyRiskLimitPct || ""} onChange={e => setDraft(d => ({ ...d, weeklyRiskLimitPct: e.target.value }))} style={S.input} placeholder="ej. 5 (suma del % de riesgo de todos los trades de la semana)" />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "5px 0", border: `1px solid ${T.border}`, borderRadius: 6, background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: FS.sm }}>Cancelar</button>
              {group !== "backtest" && (
                <button onClick={() => { onAddAccount(group); setEditing(false); }}
                  title={`Crear otra cuenta ${ACCOUNT_META[group].label}, independiente de esta`}
                  style={{ flex: 1, padding: "5px 0", border: `1px dashed ${color}66`, borderRadius: 6, background: color + "10", color, cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }}>
                  ＋ Abrir otra cuenta
                </button>
              )}
              {group !== "backtest" && canDelete && (
                <button onClick={() => { onDeleteAccount(group, account); setEditing(false); }}
                  title="Borrar esta cuenta y todos sus trades"
                  style={{ flex: 1, padding: "5px 0", border: "1px dashed #dc262666", borderRadius: 6, background: "#dc262610", color: T.loss, cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }} aria-label="Borrar esta cuenta y todos sus trades">
                  <Trash2 size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Borrar cuenta
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: acc.riskPct ? 8 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Balance</span>
                <span style={{ ...numMonoStyle, fontSize: FS.xl, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{money(balanceWithPnL)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Profit $</span>
                <span style={{ ...numMonoStyle, fontSize: FS.base, fontWeight: 700, color: pnlTotal >= 0 ? T.gain : T.loss }}>{money(pnlTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Profit %</span>
                <span style={{ ...numMonoStyle, fontSize: FS.base, fontWeight: 700, color: pnlTotal >= 0 ? T.gain : T.loss }}>{pnlTotal >= 0 ? "+" : ""}{pct}%</span>
              </div>
            </div>
            {acc.riskPct && (
              <div style={{ fontSize: FS.xs, color: T.textMuted }}>
                Riesgo máx. <span style={{ fontWeight: 700, color }}>{acc.riskPct}%</span> · {money((acc.size * parseFloat(acc.riskPct)) / 100)} por trade
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gain, display: "inline-block" }} />
              <span style={{ fontSize: FS.sm, color: T.gain, fontWeight: 700 }}>Live</span>
            </div>
          </>
        )}
        </div>
        {!editing && (
          <TradingDaysWheel trades={allTrades[account] || []} year={viewYear} month={viewMonth} color={color} />
        )}
      </div>
    </div>
  );
});


export { AccountBalanceCard };
