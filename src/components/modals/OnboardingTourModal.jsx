// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, memo } from "react";
import { X } from "lucide-react";
import { T, FS, RADIUS, S } from "../../theme";
import { ONBOARDING_STEPS } from "../../constants";

const OnboardingTourModal = memo(function OnboardingTourModal({ open, onClose, accentColor }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);
  if (!open) return null;

  const last = step === ONBOARDING_STEPS.length - 1;
  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={onClose}>
      <div className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 440, padding: 26, position: "relative", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 0%, ${accentColor}12, transparent 55%)`, pointerEvents: "none" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", display: "flex", padding: 4 }} aria-label="Cerrar introducción"><X size={16} /></button>

        <div key={step} className="hz-tab-fade" style={{ position: "relative" }}>
          <div style={{
            width: 46, height: 46, borderRadius: RADIUS.lg, marginBottom: 16,
            background: `radial-gradient(circle at 30% 25%, ${accentColor}2a, ${accentColor}10)`,
            border: `1px solid ${accentColor}3a`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor,
          }}>
            <Icon size={21} strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: FS.xl * 0.7, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>{current.title}</div>
          <div style={{ fontSize: FS.base, color: T.textMuted, lineHeight: 1.6, marginBottom: 22 }}>{current.body}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {ONBOARDING_STEPS.map((_, i) => (
              <span key={i} style={{ width: i === step ? 16 : 6, height: 6, borderRadius: 3, background: i === step ? accentColor : T.border, transition: "all 0.2s ease" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={S.button("secondary")}>Atrás</button>
            )}
            <button
              onClick={() => { if (last) { onClose(); } else { setStep(s => s + 1); } }}
              style={S.button("primary", accentColor)}>
              {last ? "Empezar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});


export { OnboardingTourModal };
