// ════════════════════════════════════════════════════════════════════
// CloudLoginScreen — segunda puerta, después del PIN.
//
// El PIN (PinLockScreen) sigue siendo el candado rápido del dispositivo,
// sin red. Esta pantalla es la que identifica QUIÉN de las 5 personas
// está usando la app, para que sus datos se sincronicen a su propia
// cuenta de Supabase (protegido además por RLS del lado del servidor,
// esto es solo la puerta de entrada del lado del cliente).
// ════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { signIn, signUp } from "../../cloud/supabaseClient";
import { T, FS, RADIUS, S } from "../../theme";

// Traduce los mensajes de error de Supabase (vienen en inglés) a algo
// entendible. Si no reconoce el mensaje, muestra el original tal cual
// en vez de ocultar información útil para diagnosticar.
function friendlyError(message) {
  const map = {
    "Invalid login credentials": "Email o contraseña incorrectos.",
    "Email not confirmed": "Todavía no confirmaste el email. Revisá tu bandeja de entrada.",
    "User already registered": "Ese email ya tiene una cuenta — probá iniciar sesión en vez de crear una nueva.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  };
  return map[message] || message || "Ocurrió un error. Probá de nuevo.";
}

export function CloudLoginScreen({ onLoggedIn }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const user = mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (mode === "signup" && !user) {
        // Si el proyecto tiene "Confirm email" activado, signUp no
        // devuelve una sesión activa hasta que se confirme el correo.
        setNotice("Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión.");
        setMode("signin");
      } else if (user) {
        onLoggedIn(user);
      }
    } catch (err) {
      setError(friendlyError(err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: T.bg, padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 360, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: RADIUS.md, padding: 28, boxShadow: T.shadowLg,
      }}>
        <div style={{ fontSize: FS.title, fontWeight: 800, color: T.brand, marginBottom: 4, textAlign: "center" }}>
          {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </div>
        <div style={{ fontSize: FS.sm, color: T.textFaint, marginBottom: 22, textAlign: "center" }}>
          Tus datos se sincronizan solo con tu cuenta.
        </div>

        <label style={{ display: "block", fontSize: FS.sm, color: T.textMuted, fontWeight: 600, marginBottom: 14 }}>
          Email
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.base, boxSizing: "border-box" }} />
        </label>

        <label style={{ display: "block", fontSize: FS.sm, color: T.textMuted, fontWeight: 600, marginBottom: 8 }}>
          Contraseña
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", marginTop: 4, padding: "9px 12px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.base, boxSizing: "border-box" }} />
        </label>

        {error && (
          <div role="alert" style={{ fontSize: FS.xs, color: T.loss, background: `${T.loss}14`, border: `1px solid ${T.loss}55`, borderRadius: RADIUS.sm, padding: "8px 10px", marginTop: 10 }}>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" style={{ fontSize: FS.xs, color: T.info, background: `${T.info}14`, border: `1px solid ${T.info}55`, borderRadius: RADIUS.sm, padding: "8px 10px", marginTop: 10 }}>
            {notice}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ ...S.button("primary"), width: "100%", padding: "10px 0", marginTop: 18, opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer" }}>
          {loading ? "Un momento…" : mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>

        <button type="button" onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}
          style={{ width: "100%", background: "none", border: "none", color: T.textFaint, fontSize: FS.xs, marginTop: 14, cursor: "pointer", textAlign: "center" }}>
          {mode === "signin" ? "¿No tenés cuenta? Crear una" : "¿Ya tenés cuenta? Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
