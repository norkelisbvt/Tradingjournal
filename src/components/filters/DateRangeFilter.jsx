// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Check } from "lucide-react";
import { T, FS, S } from "../../theme";
import { STYLE_DATE_RANGE_INPUTS_COL, STYLE_FILTER_BACKDROP, STYLE_FILTER_OPTION_BASE_MB, STYLE_FILTER_WRAP } from "../../styles/sharedStyles";

const DateRangeFilter = memo(function DateRangeFilter({ range, setRange, accentColor }) {
  const [open, setOpen] = useState(false);
  const PRESETS = [["week", "Semana"], ["month", "Mes"], ["year", "Año"], ["all", "Todo"], ["custom", "Personalizado"]];
  const current = PRESETS.find(([key]) => key === range.preset);
  const label = current ? current[1] : "Rango";
  const triggerStyle = useMemo(() => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${open ? accentColor + "88" : T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }), [open, accentColor]);
  const panelStyle = useMemo(() => ({ position: "absolute", top: "calc(100% + 6px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: T.shadowLg, padding: 5, minWidth: 160, zIndex: 50 }), []);
  const customInputsWrapStyle = useMemo(() => ({ ...STYLE_DATE_RANGE_INPUTS_COL, borderTop: `1px solid ${T.border}` }), []);
  const dateInputStyle = useMemo(() => ({ ...S.input, padding: "6px 8px", fontSize: FS.base }), []);
  return (
    <div style={STYLE_FILTER_WRAP}>
      <button onClick={() => setOpen(o => !o)} style={triggerStyle}>
        <span style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Rango</span>
        <span style={{ color: T.text }}>{label}</span>
        <span style={{ fontSize: FS.xs, color: T.textFaint, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={STYLE_FILTER_BACKDROP} />
          <div style={panelStyle}>
            {PRESETS.map(([key, lbl]) => {
              const active = range.preset === key;
              return (
                <button key={key} onClick={() => { setRange(r => ({ ...r, preset: key })); if (key !== "custom") setOpen(false); }}
                  style={{ ...STYLE_FILTER_OPTION_BASE_MB, background: active ? accentColor + "12" : "transparent", color: active ? accentColor : T.text }}>
                  {lbl} {active && <Check size={12} />}
                </button>
              );
            })}
            {range.preset === "custom" && (
              <div style={customInputsWrapStyle}>
                <input type="date" value={range.customFrom} onChange={e => setRange(r => ({ ...r, customFrom: e.target.value }))} style={dateInputStyle} />
                <input type="date" value={range.customTo} onChange={e => setRange(r => ({ ...r, customTo: e.target.value }))} style={dateInputStyle} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});


export { DateRangeFilter };
