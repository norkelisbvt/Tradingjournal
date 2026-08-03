// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Check } from "lucide-react";
import { T, FS } from "../../theme";
import { INSTRUMENTS, INST_COLOR } from "../../constants";
import { instLabel, instEmoji, toggleInstrument } from "../../utils";
import { STYLE_FILTER_BACKDROP, STYLE_FILTER_OPTION_BASE, STYLE_FILTER_OPTION_BASE_MB, STYLE_FILTER_WRAP, STYLE_INST_TAG_ICON_ROW } from "../../styles/sharedStyles";

const InstrumentFilter = memo(function InstrumentFilter({ filterInst, setFilterInst, accentColor }) {
  const [open, setOpen] = useState(false);
  const allSelected = filterInst.length === INSTRUMENTS.length;
  const label = allSelected
    ? "Todos"
    : filterInst.length === 1
      ? instLabel(filterInst[0])
      : `${filterInst.length} seleccionados`;
  // Depende de accentColor/open, que sí cambian, pero no de la lista ni del
  // loop -> se calcula una sola vez por render en vez de en cada iteración.
  const triggerStyle = useMemo(() => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1px solid ${open ? accentColor + "88" : T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }), [open, accentColor]);
  const panelStyle = useMemo(() => ({ position: "absolute", top: "calc(100% + 6px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: T.shadowLg, padding: 5, minWidth: 168, zIndex: 50 }), []);
  return (
    <div style={STYLE_FILTER_WRAP}>
      <button onClick={() => setOpen(o => !o)} style={triggerStyle}>
        <span style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Instrumento</span>
        <span style={{ color: T.text }}>{label}</span>
        <span style={{ fontSize: FS.xs, color: T.textFaint, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={STYLE_FILTER_BACKDROP} />
          <div style={panelStyle}>
            <button onClick={() => setFilterInst([...INSTRUMENTS])}
              style={{ ...STYLE_FILTER_OPTION_BASE_MB, background: allSelected ? accentColor + "12" : "transparent", color: allSelected ? accentColor : T.text }}>
              Todos {allSelected && <Check size={12} />}
            </button>
            {INSTRUMENTS.map(inst => {
              const active = filterInst.includes(inst);
              return (
                <button key={inst} onClick={() => setFilterInst(prev => toggleInstrument(prev, inst))}
                  style={{ ...STYLE_FILTER_OPTION_BASE, background: active ? INST_COLOR[inst] + "12" : "transparent", color: active ? INST_COLOR[inst] : T.textMuted }}>
                  <span style={STYLE_INST_TAG_ICON_ROW}><span>{instEmoji(inst)}</span><span>{instLabel(inst)}</span></span>
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});


export { InstrumentFilter };
