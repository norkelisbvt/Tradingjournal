// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, memo } from "react";
import { Wallet } from "lucide-react";
import { T, FS, RADIUS, S } from "../../theme";
import { ACCOUNT_META } from "../../constants";

const NewAccountOnboardingModal = memo(function NewAccountOnboardingModal({ modal, accountOrder, accountsCount, onCreate, onCancel }) {
  const groupKey = modal?.groupKey;
  const meta = groupKey ? ACCOUNT_META[groupKey] : null;
  const nextNum = groupKey ? (accountOrder[groupKey]?.length || 0) + 1 : 1;
  const defaults = groupKey === "personal"
    ? { size: 5000, phase: "Live Account", riskPct: "1" }
    : { size: 100000, phase: "Fase 1 Challenge", riskPct: "0.5" };

  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [broker, setBroker] = useState("");
  const [phase, setPhase] = useState("");
  const [riskPct, setRiskPct] = useState("");

  // Cada vez que se abre para un grupo nuevo, reinicia el formulario con los
  // valores por defecto de ese grupo (Personal vs. Fondeo).
  useEffect(() => {
    if (!modal) return;
    setName("");
    setSize(String(defaults.size));
    setBroker("");
    setPhase(defaults.phase);
    setRiskPct(String(defaults.riskPct));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal?.groupKey]);

  if (!modal || !meta) return null;

  function submit(e) {
    e?.preventDefault?.();
    onCreate(groupKey, {
      name: name.trim() || `${meta.label} ${nextNum}`,
      size: Number(size) > 0 ? Number(size) : defaults.size,
      broker: broker.trim(),
      phase: phase.trim() || defaults.phase,
      riskPct: riskPct !== "" ? riskPct : defaults.riskPct,
    });
  }

  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onCancel}>
      <form onSubmit={submit} className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 420, padding: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 38, height: 38, borderRadius: RADIUS.md, flexShrink: 0,
            background: `radial-gradient(circle at 30% 25%, ${meta.color}2a, ${meta.color}10)`,
            border: `1px solid ${meta.color}3a`, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color,
          }}>
            <Wallet size={17} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: FS.lg, fontWeight: 800, color: T.text }}>Nueva cuenta {meta.label}</div>
            <div style={{ fontSize: FS.sm, color: T.textFaint }}>Vas a poder editar todo esto después</div>
          </div>
        </div>

        <div style={{ height: 1, background: T.border, margin: "16px 0" }} />

        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Nombre de la cuenta</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={`${meta.label} ${nextNum}`} style={S.input} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Capital inicial (USD)</label>
            <input type="number" min="0" value={size} onChange={e => setSize(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Riesgo por trade (%)</label>
            <input type="number" min="0" step="0.1" value={riskPct} onChange={e => setRiskPct(e.target.value)} style={S.input} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          <div>
            <label style={S.label}>Broker <span style={{ textTransform: "none", fontWeight: 400 }}>(opcional)</span></label>
            <input value={broker} onChange={e => setBroker(e.target.value)} placeholder="Ej: IC Markets" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Fase / etapa</label>
            <input value={phase} onChange={e => setPhase(e.target.value)} placeholder={defaults.phase} style={S.input} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" onClick={onCancel} style={S.button("secondary")}>Cancelar</button>
          <button type="submit" style={S.button("primary", meta.color)}>Crear cuenta</button>
        </div>
      </form>
    </div>
  );
});


export { NewAccountOnboardingModal };
