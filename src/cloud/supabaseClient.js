// ════════════════════════════════════════════════════════════════════
// Cliente de Supabase — un único punto de entrada reutilizado por toda
// la app (auth, tablas, Edge Functions).
//
// En Electron, `import.meta.env` (típico de Vite) no siempre está
// disponible según cómo esté armado tu proceso de build, y depender de
// eso atarías este archivo a un bundler específico. En cambio, la
// configuración sale de "./cloudConfig.js" — un módulo común y
// corriente, sin nada especial de Electron ni de ningún bundler, así
// que funciona igual sin importar qué corre exactamente `npm run
// electron:dev` por debajo.
//
// La URL y la "anon key" de Supabase NO son secretas: están pensadas
// para viajar dentro del bundle de la app (la seguridad real la da el
// RLS de schema.sql, no el secreto de esta key). Lo único que nunca
// debe entrar acá son las credenciales de R2 — esas viven solo del
// lado del servidor, en los secrets de la Edge Function r2-sign.
// ════════════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./cloudConfig";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // No tiramos un throw duro para no romper el build antes de configurar
  // cloudConfig.js; simplemente avisamos fuerte en consola.
  console.error(
    "[cloud] Faltan SUPABASE_URL / SUPABASE_ANON_KEY. " +
    "Copiá src/cloud/cloudConfig.example.js a src/cloud/cloudConfig.js y completá los valores de tu proyecto de Supabase."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,   // Electron corre sobre Chromium, así que localStorage funciona igual que en un navegador normal
    autoRefreshToken: true, // renueva el token solo, sin pedir login de nuevo
  },
});

// ── Auth: helpers mínimos para las 5 cuentas de usuario ──
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getCurrentUser() {
  return supabase.auth.getUser().then(({ data }) => data?.user ?? null);
}

// Notifica cuando cambia el estado de sesión (login/logout/refresh),
// útil para disparar la primera sincronización apenas alguien entra.
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
