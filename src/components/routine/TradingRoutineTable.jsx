// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { CheckSquare } from "lucide-react";
import { T, FS, S } from "../../theme";
import { ROUTINE_ACTIVITIES, WEEKDAY_LABELS } from "../../constants";
import { toISODate, startOfWeekDate } from "../../utils";

const TradingRoutineTable = memo(function TradingRoutineTable({ data, setData, accentColor }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => {
    const base = startOfWeekDate(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  }), [weekStart]);

  function toggle(date, actKey) {
    setData(prev => {
      const day = prev[date] || {};
      return { ...prev, [date]: { ...day, [actKey]: !day[actKey] } };
    });
  }

  const todayISO = toISODate(new Date());
  const totalCells = weekDates.length * ROUTINE_ACTIVITIES.length;
  const totalChecked = weekDates.reduce((s, date) => s + ROUTINE_ACTIVITIES.filter(a => data[date]?.[a.key]).length, 0);

  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text }}><CheckSquare size={15} />Trading Routine</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: FS.base }} title="Semana anterior" aria-label="Semana anterior">◀</button>
          <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600, minWidth: 108, textAlign: "center" }}>
            {weekDates[0]} → {weekDates[6].slice(5)}
          </span>
          <button onClick={() => setWeekOffset(o => o + 1)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: FS.base }} title="Semana siguiente" aria-label="Semana siguiente">▶</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.sm, fontWeight: 600 }}>Hoy</button>
          )}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 12px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${T.border}` }}>Día</th>
              {ROUTINE_ACTIVITIES.map(a => (
                <th key={a.key} style={{ padding: "8px 10px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                  {a.emoji} {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDates.map((date, i) => {
              const isToday = date === todayISO;
              return (
                <tr key={date} style={{ borderBottom: `1px solid ${T.border}`, background: isToday ? accentColor + "0a" : "transparent" }}>
                  <td style={{ padding: "8px 12px", fontSize: FS.base, color: isToday ? accentColor : T.text, fontWeight: isToday ? 700 : 500, whiteSpace: "nowrap" }}>
                    {WEEKDAY_LABELS[i]} {isToday && "· hoy"}
                    <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 400 }}>{date}</div>
                  </td>
                  {ROUTINE_ACTIVITIES.map(a => {
                    const checked = !!data[date]?.[a.key];
                    return (
                      <td key={a.key} style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span onClick={() => toggle(date, a.key)}
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? T.gain : T.border}`, background: checked ? T.gain : "transparent", cursor: "pointer", fontSize: FS.sm, color: "#fff" }}>
                          {checked ? "✓" : ""}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ padding: "7px 12px", fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Checked</td>
              {ROUTINE_ACTIVITIES.map(a => {
                const count = weekDates.filter(date => data[date]?.[a.key]).length;
                return <td key={a.key} style={{ padding: "7px 10px", textAlign: "center", fontSize: FS.sm, color: T.textMuted, fontWeight: 700 }}>{count}</td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt, fontSize: FS.sm, color: T.textMuted, display: "flex", justifyContent: "space-between" }}>
        <span>Progreso de la semana</span>
        <span style={{ fontWeight: 700, color: accentColor }}>{totalChecked}/{totalCells} ({totalCells ? Math.round((totalChecked / totalCells) * 100) : 0}%)</span>
      </div>
    </div>
  );
});


export { TradingRoutineTable };
