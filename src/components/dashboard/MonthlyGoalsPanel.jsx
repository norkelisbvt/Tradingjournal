// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Pencil, Target } from "lucide-react";
import { T, FS, S } from "../../theme";
import { MONTHS_FULL } from "../../constants";
import { money, toISODate } from "../../utils";
import { Confetti, useCelebration } from "../../charts";

const MonthlyGoalsPanel = memo(function MonthlyGoalsPanel({ trades, viewYear, goals, setGoals, accentColor }) {
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState("");

  const actualByMonth = useMemo(() => {
    const m = {};
    trades.forEach(t => {
      if (t.date && t.date.startsWith(`${viewYear}-`)) {
        const mk = t.date.slice(0, 7);
        m[mk] = (m[mk] || 0) + t.pnl;
      }
    });
    return m;
  }, [trades, viewYear]);

  const months = Array.from({ length: 12 }, (_, i) => `${viewYear}-${String(i + 1).padStart(2, "0")}`);
  // Solo mostrar meses con meta puesta, con trades, o el mes actual — para no saturar con 12 filas vacías.
  const todayKey = toISODate(new Date()).slice(0, 7);
  const visibleMonths = months.filter(mk => (goals[mk] != null) || (actualByMonth[mk] != null) || mk === todayKey);

  function startEdit(mk) { setEditingKey(mk); setDraft(goals[mk] != null ? String(goals[mk]) : ""); }
  function saveEdit(mk) {
    const val = parseFloat(draft);
    setGoals(prev => {
      const next = { ...prev };
      if (!isNaN(val) && val > 0) next[mk] = val; else delete next[mk];
      return next;
    });
    setEditingKey(null);
  }

  // Festeja con confetti solo cuando el mes EN CURSO cruza su meta (no metas
  // pasadas ya cumplidas hace tiempo, que no deberían re-festejarse cada vez
  // que se abre esta vista).
  const todayGoal = goals[todayKey];
  const todayActual = actualByMonth[todayKey] || 0;
  const celebratingGoal = useCelebration(todayGoal != null && todayActual >= todayGoal);

  return (
    <div style={{ ...S.card, padding: 16, marginBottom: 16, position: "relative", overflow: "hidden" }}>
      {celebratingGoal && <Confetti />}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text }}><Target size={14} />Metas mensuales {viewYear}</span>
        <span style={{ fontSize: FS.sm, color: T.textFaint }}>meta de P&L por mes vs. lo real</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
        {visibleMonths.map(mk => {
          const monthIdx = parseInt(mk.slice(5, 7), 10) - 1;
          const goal = goals[mk];
          const actual = actualByMonth[mk] || 0;
          const pct = goal ? Math.max(0, Math.min(150, (actual / goal) * 100)) : 0;
          const met = goal != null && actual >= goal;
          return (
            <div key={mk} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, background: T.surfaceAlt }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: FS.sm, fontWeight: 700, color: T.text }}>{MONTHS_FULL[monthIdx]}</span>
                <span style={{ fontSize: FS.base, fontWeight: 700, color: actual >= 0 ? T.gain : T.loss }}>{money(actual)}</span>
              </div>
              {editingKey === mk ? (
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  <input type="number" autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveEdit(mk)} placeholder="ej. 1000"
                    style={{ ...S.input, padding: "4px 7px", fontSize: FS.sm }} />
                  <button onClick={() => saveEdit(mk)} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: accentColor, color: "#fff", cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }}>OK</button>
                </div>
              ) : (
                <div onClick={() => startEdit(mk)} style={{ cursor: "pointer", fontSize: FS.sm, color: T.textMuted, marginBottom: 6 }}>
                  Meta: <span style={{ fontWeight: 700, color: goal != null ? T.text : T.textFaint }}>{goal != null ? money(goal) : "sin definir"}</span>
                  <Pencil size={9} style={{ marginLeft: 5, verticalAlign: -1, opacity: 0.6 }} />
                </div>
              )}
              {goal != null && (
                <>
                  <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: met ? T.gain : accentColor, borderRadius: 3, transition: "width 0.2s" }} />
                  </div>
                  <div style={{ fontSize: FS.xs, color: met ? T.gain : T.textFaint, fontWeight: 600, marginTop: 3 }}>
                    {met ? "✓ Meta cumplida" : `${pct.toFixed(0)}% de la meta`}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});


export { MonthlyGoalsPanel };
