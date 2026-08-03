// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { ArrowUpDown } from "lucide-react";
import { T, FS, numMonoStyle, S } from "../../theme";

const CommandPalette = memo(function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(""); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => (c.label + " " + (c.sublabel || "") + " " + (c.group || "")).toLowerCase().includes(q));
  }, [query, commands]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  function run(cmd) { if (!cmd) return; onClose(); cmd.onRun(); }
  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(filtered[activeIdx]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  // Agrupa manteniendo el orden original, para mostrar encabezados de sección.
  const groups = [];
  filtered.forEach((c, i) => {
    const last = groups[groups.length - 1];
    if (last && last.title === (c.group || "")) last.items.push({ ...c, i });
    else groups.push({ title: c.group || "", items: [{ ...c, i }] });
  });

  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 400, padding: "12vh 16px 16px" }}
      onClick={onClose}>
      <div className="hz-palette" style={{ ...S.card, width: "100%", maxWidth: 480, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ color: T.textFaint, display: "flex" }}><ArrowUpDown size={15} /></span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Buscar una sección, cuenta o acción…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: T.text, fontSize: FS.lg, fontFamily: "inherit" }} />
          <span style={{ ...numMonoStyle, fontSize: FS.xs, fontWeight: 700, color: T.textFaint, border: `1px solid ${T.borderStrong}`, borderRadius: 6, padding: "2px 6px" }}>Esc</span>
        </div>
        <div ref={listRef} style={{ overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "28px 16px", textAlign: "center", color: T.textFaint, fontSize: FS.base }}>Sin resultados para "{query}"</div>
          )}
          {groups.map(g => (
            <div key={g.title || "_"} style={{ marginBottom: 4 }}>
              {g.title && <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 10px 4px" }}>{g.title}</div>}
              {g.items.map(c => {
                const Icon = c.icon || ArrowUpDown;
                const active = c.i === activeIdx;
                return (
                  <button key={c.id} data-idx={c.i} onClick={() => run(c)} onMouseEnter={() => setActiveIdx(c.i)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", background: active ? T.brandSoft : "transparent", color: active ? T.brand : T.text, fontSize: FS.base, fontWeight: 600 }}>
                    <span style={{ display: "flex", flexShrink: 0, color: active ? T.brand : T.textFaint }}><Icon size={15} strokeWidth={1.8} /></span>
                    <span style={{ flex: 1 }}>{c.label}</span>
                    {c.sublabel && <span style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 600 }}>{c.sublabel}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});


export { CommandPalette };
