// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { X } from "lucide-react";
import { T, FS, S } from "../../theme";

const RoutineChecklistCard = memo(function RoutineChecklistCard({ title, emoji, items, setItems, dayState, onToggle }) {
  const [newItem, setNewItem] = useState("");
  const doneCount = items.filter(i => dayState?.[i]).length;
  function addItem() {
    const v = newItem.trim();
    if (!v || items.includes(v)) return;
    setItems(prev => [...prev, v]);
    setNewItem("");
  }
  return (
    <div style={{ ...S.card, padding: 16, flex: 1, minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text }}>{emoji} {title}</div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>{doneCount}/{items.length}</div>
      </div>
      <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${items.length ? (doneCount / items.length) * 100 : 0}%`, background: T.gain, borderRadius: 3, transition: "width 0.2s" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {items.map(item => {
          const checked = !!dayState?.[item];
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: FS.base, color: checked ? T.text : T.textMuted }}>
              <span onClick={() => onToggle(item)} style={{ cursor: "pointer", width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${checked ? T.gain : T.border}`, background: checked ? T.gain : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.sm, color: "#fff", flexShrink: 0 }}>
                {checked ? "✓" : ""}
              </span>
              <span onClick={() => onToggle(item)} style={{ flex: 1, cursor: "pointer", textDecoration: checked ? "line-through" : "none" }}>{item}</span>
              <button onClick={() => setItems(prev => prev.filter(i => i !== item))} title="Quitar ítem" style={{ background: "none", border: "none", cursor: "pointer", color: T.textFaint, display: "flex" }} aria-label="Quitar ítem"><X size={12} /></button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Agregar ítem…" style={{ ...S.input, flex: 1, padding: "6px 9px", fontSize: FS.base }} />
        <button onClick={addItem} title="Agregar ítem" aria-label="Agregar ítem" style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
});


export { RoutineChecklistCard };
