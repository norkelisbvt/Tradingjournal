// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, memo } from "react";
import { Tag } from "lucide-react";
import { T, FS, S } from "../../theme";

const FreeTagsInput = memo(function FreeTagsInput({ tags, onChange, accentColor }) {
  const [draft, setDraft] = useState("");
  function addTag() {
    const val = draft.trim().replace(/^#/, "");
    if (!val) return;
    if (!tags.some(t => t.toLowerCase() === val.toLowerCase())) onChange([...tags, val]);
    setDraft("");
  }
  function removeTag(t) { onChange(tags.filter(x => x !== t)); }
  return (
    <div>
      <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 4 }}><Tag size={11} />Tags libres {tags.length > 0 && <span style={{ color: accentColor, fontWeight: 700 }}>({tags.length})</span>}</label>
      <div style={{ background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, padding: 10 }}>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(() => {
              const chipStyle = { display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 20, border: `1px solid ${accentColor}55`, background: accentColor + "14", color: accentColor, fontSize: FS.sm, fontWeight: 600 };
              const removeStyle = { cursor: "pointer", fontSize: FS.sm, opacity: 0.7 };
              return tags.map(t => (
                <div key={t} style={chipStyle}>
                  <span>#{t}</span>
                  <span onClick={() => removeTag(t)} style={removeStyle}>✕</span>
                </div>
              ));
            })()}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="ej. A+, noticia, sin plan... (Enter para agregar)" style={{ ...S.input, fontSize: FS.base, padding: "6px 9px" }} />
          <button onClick={addTag} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>
    </div>
  );
});


export { FreeTagsInput };
