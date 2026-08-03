// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, memo } from "react";
import { Lock } from "lucide-react";
import { FS, UI_FONT, GoogleFontImport } from "../../theme";
import { PinDots } from "./PinDots";

const PinLockScreen = memo(function PinLockScreen({ savedPin, onUnlock, onSetPin }) {
  const mode = savedPin ? "enter" : "create";
  const [stage, setStage] = useState("first"); // "first" | "confirm" (solo para crear)
  const [value, setValue] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  // Se incrementa cada vez que hay un error de PIN: al usarse como `key` del
  // contenedor de los puntos, fuerza un remount que reinicia la animación de
  // "shake" — sin necesidad de manejar timers para resetear una clase CSS.
  const [shakeKey, setShakeKey] = useState(0);
  const accentColor = "#6366f1";
  const MIN = 4, MAX = 6;

  function pressDigit(d) {
    if (value.length >= MAX) return;
    setError("");
    const next = value + d;
    setValue(next);
    if (mode === "enter") {
      if (next.length >= MIN) tryEnter(next);
    } else {
      if (next.length >= MIN) {
        // Espera hasta soltar el dígito o llegar al máximo antes de avanzar,
        // pero permite continuar tecleando hasta 6 dígitos.
        if (next.length === MAX) advanceCreate(next);
      }
    }
  }

  function tryEnter(pin) {
    // Da un respiro de un instante para mostrar el último punto marcado.
    setTimeout(() => {
      if (pin === savedPin) {
        onUnlock();
      } else {
        setError("PIN incorrecto");
        setShakeKey(k => k + 1);
        setValue("");
      }
    }, 80);
  }

  function advanceCreate(pin) {
    if (stage === "first") {
      setFirstPin(pin);
      setValue("");
      setStage("confirm");
    } else {
      if (pin === firstPin) {
        onSetPin(pin);
      } else {
        setError("Los PIN no coinciden. Probá de nuevo.");
        setShakeKey(k => k + 1);
        setFirstPin(""); setValue(""); setStage("first");
      }
    }
  }

  function confirmShorterPin() {
    // Permite confirmar con menos de 6 dígitos (mínimo 4) al presionar "Listo".
    if (value.length < MIN) return;
    if (mode === "enter") tryEnter(value);
    else advanceCreate(value);
  }

  function backspace() { setError(""); setValue(v => v.slice(0, -1)); }

  // Permite escribir el PIN con el teclado físico (números, Backspace y Enter),
  // además de poder tocar los botones en pantalla.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        pressDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (e.key === "Enter") {
        e.preventDefault();
        confirmShorterPin();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const title = mode === "create"
    ? (stage === "first" ? "Creá un PIN" : "Confirmá tu PIN")
    : "Ingresá tu PIN";
  const subtitle = mode === "create"
    ? "4 a 6 dígitos, para proteger el acceso a tu diario de trading en este dispositivo"
    : "Protegiendo tu diario de trading";

  return (
    <div style={{ position: "fixed", inset: 0, background: `radial-gradient(900px 560px at 50% 30%, ${accentColor}22, transparent 60%), #0f1115`, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: UI_FONT }}>
      <GoogleFontImport />
      <div style={{ textAlign: "center", width: "100%", maxWidth: 320, padding: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${accentColor}1f`, border: `1px solid ${accentColor}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: accentColor }}>
          <Lock size={19} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: FS.xl, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: FS.base, color: "#ffffff88", marginBottom: 24 }}>{subtitle}</div>
        <div key={shakeKey} className={shakeKey > 0 && error ? "hz-pin-shake" : ""}>
          <PinDots length={Math.max(value.length, MIN)} filled={value.length} color={accentColor} error={!!error} />
        </div>
        {error && <div style={{ color: "#f87171", fontSize: FS.base, fontWeight: 600, marginBottom: 14, marginTop: -10 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          {["1","2","3","4","5","6","7","8","9"].map(d => (
            <button key={d} onClick={() => pressDigit(d)}
              style={{ padding: "16px 0", borderRadius: 12, border: "1px solid #ffffff22", background: "#ffffff0d", color: "#fff", fontSize: FS.xl, fontWeight: 700, cursor: "pointer" }}>
              {d}
            </button>
          ))}
          <button onClick={confirmShorterPin} disabled={value.length < MIN}
            style={{ padding: "16px 0", borderRadius: 12, border: "1px solid #ffffff22", background: "transparent", color: value.length >= MIN ? accentColor : "#ffffff33", fontSize: FS.base, fontWeight: 700, cursor: value.length >= MIN ? "pointer" : "default" }}>
            Listo
          </button>
          <button onClick={() => pressDigit("0")}
            style={{ padding: "16px 0", borderRadius: 12, border: "1px solid #ffffff22", background: "#ffffff0d", color: "#fff", fontSize: FS.xl, fontWeight: 700, cursor: "pointer" }}>
            0
          </button>
          <button onClick={backspace} title="Borrar último dígito" aria-label="Borrar último dígito"
            style={{ padding: "16px 0", borderRadius: 12, border: "1px solid #ffffff22", background: "transparent", color: "#ffffff88", fontSize: FS.lg, fontWeight: 700, cursor: "pointer" }}>
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
});


export { PinLockScreen };
