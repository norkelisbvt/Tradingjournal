// ─── Export por defecto con bloqueo por PIN + sesión de nube ──────────────
// Envuelve la app real: mientras no se ingrese (o cree) el PIN correcto, no se
// monta TradingJournalInner en absoluto, así que ningún dato se renderiza.
//
// Se agregó una segunda puerta DESPUÉS del PIN: la sesión de Supabase.
// El PIN sigue siendo el candado rápido del dispositivo (sin red, igual
// que siempre); la sesión de Supabase es la que identifica CUÁL de las
// personas está usando la app en este momento, para sincronizar sus
// datos a su propia cuenta (la separación real entre usuarios la
// garantiza el RLS del lado del servidor — esto es solo la puerta de
// entrada del cliente).
import { useState, useCallback, useEffect } from "react";
import { PIN_KEY } from "./constants";
import { PinLockScreen } from "./components/auth/PinLockScreen";
import { CloudLoginScreen } from "./components/auth/CloudLoginScreen";
import { SplashScreen } from "./components/auth/SplashScreen";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { TradingJournalInner } from "./TradingJournalInner";
import { useAppBranding } from "./hooks/useAppBranding";
import { supabase, signOut as cloudSignOut } from "./cloud/supabaseClient";

export default function TradingJournal() {
  useAppBranding();
  const [savedPin, setSavedPin] = useState(() => {
    try { return localStorage.getItem(PIN_KEY) || null; } catch { return null; }
  });
  const [unlocked, setUnlocked] = useState(false);

  // ── Sesión de la nube ──
  // "cloudChecking" evita un parpadeo mostrando el login de nube antes
  // de confirmar si ya había una sesión guardada de una vez anterior
  // (supabase-js la persiste sola en localStorage). Se usa getSession()
  // en vez de getUser() a propósito: getSession() lee lo que ya está
  // guardado localmente sin depender de la red, así que si abrís la app
  // sin conexión pero ya habías iniciado sesión antes, no te bloquea.
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudChecking, setCloudChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setCloudUser(data?.session?.user ?? null);
      setCloudChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Callbacks estabilizados con useCallback para que el React.memo de
  // TradingJournalInner sea efectivo (si no, se recrean en cada render de
  // este componente padre y el memo nunca evita el re-render de los hijos).
  const handleLockNow = useCallback(() => setUnlocked(false), []);
  const handleChangePin = useCallback(() => {
    try { localStorage.removeItem(PIN_KEY); } catch {}
    setSavedPin(null);
    setUnlocked(false);
  }, []);
  // Cierra sesión de Supabase (distinto de "lock now": esto además hace
  // que la próxima persona que use el dispositivo tenga que loguearse
  // con su propia cuenta, no heredar la de quien usó la app antes). Se
  // pasa a TradingJournalInner para conectarlo a un botón de "cerrar
  // sesión" cuando definamos dónde va en el menú — todavía no se agregó
  // ese botón a la UI, esto solo deja la función lista para usar.
  const handleSignOutCloud = useCallback(async () => {
    await cloudSignOut();
    setUnlocked(false);
  }, []);

  if (!unlocked) {
    return (
      <PinLockScreen
        savedPin={savedPin}
        onUnlock={() => setUnlocked(true)}
        onSetPin={(pin) => {
          try { localStorage.setItem(PIN_KEY, pin); } catch {}
          setSavedPin(pin);
          setUnlocked(true);
        }}
      />
    );
  }

  if (cloudChecking) {
    return <SplashScreen />;
  }

  if (!cloudUser) {
    return <CloudLoginScreen onLoggedIn={setCloudUser} />;
  }

  return (
    <AppErrorBoundary>
      <TradingJournalInner
        onLockNow={handleLockNow}
        onChangePin={handleChangePin}
        cloudUser={cloudUser}
        onSignOutCloud={handleSignOutCloud}
      />
    </AppErrorBoundary>
  );
}

