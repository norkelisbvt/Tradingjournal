// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Pencil, Trash2, Check } from "lucide-react";
import { T, FS, S } from "../../theme";
import { MONTHS_FULL, LESSON_CATEGORIES } from "../../constants";
import { toISODate } from "../../utils";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { UndoToast } from "../common/UndoToast";
import { useUndoToast } from "../../hooks/useUndoToast";

const LessonOfDayPanel = memo(function LessonOfDayPanel({ lessons, setLessons, accentColor }) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [category, setCategory] = useState("trading");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | trading | personal
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [expandedIds, setExpandedIds] = useState({});
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const { toast: undoToast, pushUndo, undo: undoLastAction, dismiss: dismissUndo } = useUndoToast();

  function save() {
    if (!title.trim() || !text.trim()) return;
    if (editingId) {
      setLessons(prev => prev.map(l => l.id === editingId ? { ...l, date, category, title: title.trim(), text: text.trim() } : l));
    } else {
      setLessons(prev => [{ id: Date.now(), date, category, title: title.trim(), text: text.trim() }, ...prev]);
    }
    setTitle(""); setText(""); setEditingId(null); setCategory("trading"); setDate(toISODate(new Date()));
  }
  function edit(l) { setEditingId(l.id); setDate(l.date); setCategory(l.category); setTitle(l.title || ""); setText(l.text); }
  function cancelEdit() { setEditingId(null); setTitle(""); setText(""); setCategory("trading"); setDate(toISODate(new Date())); }
  function remove(id) { setConfirmRemoveId(id); }
  function confirmRemove() {
    const removed = lessons.find(l => l.id === confirmRemoveId);
    setLessons(prev => prev.filter(l => l.id !== confirmRemoveId));
    if (editingId === confirmRemoveId) cancelEdit();
    setConfirmRemoveId(null);
    if (removed) pushUndo("Nota borrada", () => setLessons(prev => [removed, ...prev]));
  }
  function toggleExpand(id) { setExpandedIds(prev => ({ ...prev, [id]: !prev[id] })); }

  const filtered = useMemo(() => (filter === "all" ? lessons : lessons.filter(l => l.category === filter)), [lessons, filter]);

  const groups = useMemo(() => {
    const g = {};
    [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).forEach(l => {
      const mk = l.date.slice(0, 7);
      if (!g[mk]) g[mk] = [];
      g[mk].push(l);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const countTrading = lessons.filter(l => l.category === "trading").length;
  const countPersonal = lessons.filter(l => l.category === "personal").length;

  return (
    <div style={{ ...S.card, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: FS.lg }}>💡</span>
        <span style={{ fontWeight: 700, fontSize: FS.base, color: T.text }}>Lección del día</span>
      </div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>
        Notas rápidas, planes o cosas random de tu día — se van documentando y quedan agrupadas por mes, como en Trades.
      </div>

      {/* Formulario de captura */}
      <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, width: "auto", padding: "6px 8px", fontSize: FS.base }} />
          {/* Check-in: Personal vs Trading */}
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
            {Object.entries(LESSON_CATEGORIES).map(([key, meta]) => {
              const active = category === key;
              return (
                <button key={key} onClick={() => setCategory(key)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "none", cursor: "pointer", fontSize: FS.base, fontWeight: 700, background: active ? meta.color + "1c" : T.surface, color: active ? meta.color : T.textMuted }}>
                  <span style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px solid ${active ? meta.color : T.border}`, background: active ? meta.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.xs, color: "#fff" }}>
                    {active ? "✓" : ""}
                  </span>
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la nota (ej. Día complicado por lluvias)"
          style={{ ...S.input, width: "100%", padding: "8px 11px", fontSize: FS.base, fontWeight: 700, marginBottom: 8 }} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="¿Qué aprendiste hoy? ¿Algún plan, idea o reflexión random?"
          style={{ ...S.input, width: "100%", minHeight: 64, padding: "9px 11px", fontSize: FS.base, resize: "vertical", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: accentColor, color: "#fff", cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
            {editingId ? "Guardar cambios" : "Agregar lección"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>Cancelar</button>
          )}
        </div>
      </div>

      {/* Filtro por tipo */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")}
          style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === "all" ? accentColor + "88" : T.border}`, background: filter === "all" ? accentColor + "12" : T.surface, color: filter === "all" ? accentColor : T.textMuted, cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }}>
          Todas ({lessons.length})
        </button>
        {Object.entries(LESSON_CATEGORIES).map(([key, meta]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === key ? meta.color + "88" : T.border}`, background: filter === key ? meta.color + "14" : T.surface, color: filter === key ? meta.color : T.textMuted, cursor: "pointer", fontSize: FS.sm, fontWeight: 700 }}>
            {meta.emoji} {meta.label} ({key === "trading" ? countTrading : countPersonal})
          </button>
        ))}
      </div>

      {/* Lista agrupada por mes, estilo Trades */}
      {groups.length === 0 ? (
        <div style={{ padding: "36px 0", textAlign: "center", color: T.textFaint, fontSize: FS.base, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
          Aún no hay lecciones anotadas.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(([mk, items]) => {
            const [y, m] = mk.split("-");
            const label = `${MONTHS_FULL[parseInt(m, 10) - 1]} ${y}`;
            const collapsed = !!collapsedMonths[mk];
            const mTrading = items.filter(l => l.category === "trading").length;
            const mPersonal = items.filter(l => l.category === "personal").length;
            return (
              <div key={mk} style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div onClick={() => setCollapsedMonths(g => ({ ...g, [mk]: !g[mk] }))}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.surfaceAlt, cursor: "pointer", userSelect: "none", borderBottom: collapsed ? "none" : `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: FS.xs, color: T.textFaint, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>▼</span>
                    <span style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>{label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {mTrading > 0 && <span style={S.tag(LESSON_CATEGORIES.trading.color)}>{mTrading} trading</span>}
                    {mPersonal > 0 && <span style={S.tag(LESSON_CATEGORIES.personal.color)}>{mPersonal} personal</span>}
                  </div>
                </div>
                {!collapsed && (
                  <div>
                    {items.map((l, idx) => {
                      const meta = LESSON_CATEGORIES[l.category] || LESSON_CATEGORIES.trading;
                      const expanded = !!expandedIds[l.id];
                      return (
                        <div key={l.id} style={{ borderBottom: idx < items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <div onClick={() => toggleExpand(l.id)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 14px", cursor: "pointer" }}>
                            <div style={{ flexShrink: 0, width: 84, fontSize: FS.sm, color: T.textFaint, fontWeight: 600 }}>{l.date}</div>
                            <div style={{ flexShrink: 0 }}>
                              <span style={S.tag(meta.color)}>{meta.emoji} {meta.label}</span>
                            </div>
                            <div style={{ flex: 1, fontSize: FS.base, color: T.text, fontWeight: 600 }}>{l.title || "(sin título)"}</div>
                            <span style={{ flexShrink: 0, fontSize: FS.xs, color: T.textFaint, transform: expanded ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                            <div style={{ flexShrink: 0, display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => edit(l)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.textMuted }} title="Editar" aria-label="Editar"><Pencil size={12.5} /></button>
                              <button onClick={() => remove(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e5484d", display: "flex" }} title="Borrar" aria-label="Borrar"><Trash2 size={12.5} /></button>
                            </div>
                          </div>
                          {expanded && (
                            <div style={{ padding: "0 14px 12px 110px", fontSize: FS.base, color: T.textMuted, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                              {l.text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmRemoveId}
        title="¿Borrar esta nota?"
        message="Vas a poder deshacerlo justo después de borrarla."
        confirmLabel="Borrar nota"
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
      <UndoToast toast={undoToast} onUndo={undoLastAction} onDismiss={dismissUndo} />
    </div>
  );
});


export { LessonOfDayPanel };
