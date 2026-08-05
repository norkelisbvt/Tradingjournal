// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useMemo, memo } from "react";
import { Pencil, Trash2, Brain } from "lucide-react";
import { T, FS, S } from "../../theme";
import { EMOTIONS } from "../../constants";
import { toISODate } from "../../utils";
import { HabitMiniChart } from "../../charts";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { UndoToast } from "../common/UndoToast";
import { LessonOfDayPanel } from "./LessonOfDayPanel";
import { RoutineChecklistCard } from "./RoutineChecklistCard";
import { TradingRoutineTable } from "./TradingRoutineTable";
import { useUndoToast } from "../../hooks/useUndoToast";

const MindsetView = memo(function MindsetView({ trades, accentColor, entries, setEntries, checklistItems, setChecklistItems, routineChecklist, setRoutineChecklist, routineData, setRoutineData, lessons, setLessons }) {
  const [routineDate, setRoutineDate] = useState(toISODate(new Date()));
  const dayRoutine = routineChecklist[routineDate] || { pre: {}, post: {} };

  function toggleRoutineItem(phase, item) {
    setRoutineChecklist(prev => {
      const day = prev[routineDate] || { pre: {}, post: {} };
      return { ...prev, [routineDate]: { ...day, [phase]: { ...day[phase], [item]: !day[phase]?.[item] } } };
    });
  }
  function setPreItems(updater) { setChecklistItems(prev => ({ ...prev, pre: typeof updater === "function" ? updater(prev.pre) : updater })); }
  function setPostItems(updater) { setChecklistItems(prev => ({ ...prev, post: typeof updater === "function" ? updater(prev.post) : updater })); }

  // ── Diario de reflexiones ──
  const [entryDate, setEntryDate] = useState(toISODate(new Date()));
  const [entryMood, setEntryMood] = useState("calm");
  const [entryNote, setEntryNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { toast: undoToast, pushUndo, undo: undoLastAction, dismiss: dismissUndo } = useUndoToast();

  function saveEntry() {
    if (!entryNote.trim()) return;
    if (editingId) {
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, date: entryDate, mood: entryMood, note: entryNote.trim() } : e));
    } else {
      setEntries(prev => [{ id: Date.now(), date: entryDate, mood: entryMood, note: entryNote.trim() }, ...prev]);
    }
    setEntryNote(""); setEditingId(null); setEntryMood("calm"); setEntryDate(toISODate(new Date()));
  }
  function editEntry(e) { setEditingId(e.id); setEntryDate(e.date); setEntryMood(e.mood); setEntryNote(e.note); }
  function deleteEntry(id) { setConfirmDeleteId(id); }
  function confirmDeleteEntry() {
    const removed = entries.find(e => e.id === confirmDeleteId);
    setEntries(prev => prev.filter(e => e.id !== confirmDeleteId));
    if (editingId === confirmDeleteId) { setEditingId(null); setEntryNote(""); }
    setConfirmDeleteId(null);
    if (removed) pushUndo("Nota del diario borrada", () => setEntries(prev => [removed, ...prev]));
  }
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [entries]);

  return (
    <div>
      {/* La correlación emociones × rendimiento ahora vive en el tab de
          Trades (usa R-múltiplo normalizado por riesgo, más comparable
          entre trades de distinto tamaño que el P&L promedio en $ que
          mostraba esta vista antes) — ver EmotionCorrelationPanel. */}

      {/* Trading Routine: rutina diaria de hábitos + mini-gráfica acumulada */}
      <TradingRoutineTable data={routineData} setData={setRoutineData} accentColor={accentColor} />
      <div style={{ marginBottom: 20 }}>
        <HabitMiniChart data={routineData} accentColor={accentColor} />
      </div>

      {/* Lección del día: notas rápidas/planes, tagueadas como Personal o Trading */}
      <LessonOfDayPanel lessons={lessons} setLessons={setLessons} accentColor={accentColor} />

      {/* Rutina mental pre/post sesión */}
      <div className="hz-card" style={{ ...S.card, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>🧭 Rutina del día</span>
        <input type="date" value={routineDate} onChange={e => setRoutineDate(e.target.value)} style={{ ...S.input, width: "auto", padding: "6px 8px", fontSize: FS.base, marginLeft: "auto" }} />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <RoutineChecklistCard title="Pre-sesión" emoji="🌅" items={checklistItems.pre} setItems={setPreItems} dayState={dayRoutine.pre} onToggle={item => toggleRoutineItem("pre", item)} />
        <RoutineChecklistCard title="Post-sesión" emoji="🌙" items={checklistItems.post} setItems={setPostItems} dayState={dayRoutine.post} onToggle={item => toggleRoutineItem("post", item)} />
      </div>

      {/* Diario de mindset */}
      <div className="hz-card" style={{ ...S.card, padding: 18, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>📓 Diario de mindset</div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>Reflexiones y notas mentales, independientes de los trades</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ ...S.input, width: "auto", padding: "6px 8px", fontSize: FS.base }} />
          <select value={entryMood} onChange={e => setEntryMood(e.target.value)} style={{ ...S.input, width: "auto", padding: "6px 8px", fontSize: FS.base }}>
            {EMOTIONS.map(e => <option key={e.id} value={e.id}>{e.emoji} {e.label}</option>)}
          </select>
        </div>
        <textarea value={entryNote} onChange={e => setEntryNote(e.target.value)} placeholder="¿Cómo llegaste hoy? ¿Qué aprendiste, qué te distrajo, qué harías distinto?"
          style={{ ...S.input, width: "100%", minHeight: 70, padding: "9px 11px", fontSize: FS.base, resize: "vertical", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveEntry} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: accentColor, color: "#fff", cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
            {editingId ? "Guardar cambios" : "Agregar entrada"}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setEntryNote(""); setEntryMood("calm"); setEntryDate(toISODate(new Date())); }}
              style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>Cancelar</button>
          )}
        </div>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="hz-card" style={S.card}>
          <EmptyState icon={Brain} title="Aún no hay entradas en tu diario" subtitle="Anotá cómo llegaste hoy, qué aprendiste o qué te distrajo — con el tiempo vas a ver patrones en tu mentalidad." accentColor={accentColor} compact />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(() => {
            const cardStyle = { ...S.card, padding: 14 };
            const headerRowStyle = { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 };
            const moodEmojiStyle = { fontSize: FS.lg };
            const dateStyle = { fontSize: FS.sm, fontWeight: 700, color: T.text };
            const moodLabelStyle = { fontSize: FS.sm, color: T.textFaint };
            const actionsWrapStyle = { marginLeft: "auto", display: "flex", gap: 4 };
            const editBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", color: T.textMuted };
            const deleteBtnStyle = { background: "none", border: "none", cursor: "pointer", color: "#e5484d", display: "flex" };
            const noteStyle = { fontSize: FS.base, color: T.textMuted, lineHeight: 1.5, whiteSpace: "pre-wrap" };
            return sortedEntries.map(e => {
              const mood = EMOTIONS.find(m => m.id === e.mood);
              return (
                <div key={e.id} className="hz-card" style={cardStyle}>
                  <div style={headerRowStyle}>
                    <span style={moodEmojiStyle}>{mood?.emoji || "📝"}</span>
                    <span style={dateStyle}>{e.date}</span>
                    <span style={moodLabelStyle}>{mood?.label}</span>
                    <div style={actionsWrapStyle}>
                      <button onClick={() => editEntry(e)} style={editBtnStyle} title="Editar entrada" aria-label="Editar entrada"><Pencil size={12.5} /></button>
                      <button onClick={() => deleteEntry(e.id)} style={deleteBtnStyle} title="Borrar entrada" aria-label="Borrar entrada"><Trash2 size={12.5} /></button>
                    </div>
                  </div>
                  <div style={noteStyle}>{e.note}</div>
                </div>
              );
            });
          })()}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="¿Borrar esta entrada del diario?"
        message="Vas a poder deshacerlo justo después de borrarla."
        confirmLabel="Borrar entrada"
        onConfirm={confirmDeleteEntry}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <UndoToast toast={undoToast} onUndo={undoLastAction} onDismiss={dismissUndo} />
    </div>
  );
});


export { MindsetView };
