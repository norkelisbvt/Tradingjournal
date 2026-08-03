// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useCallback, useRef } from "react";
import { REMINDERS_KEY } from "../constants";
import { toISODate, loadReminders } from "../utils";

function useReminders(trades) {
  const [reminders, setReminders] = useState(loadReminders);
  const [permission, setPermission] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "unsupported"));
  const lastFiredRef = useRef({});
  const tradesRef = useRef(trades);
  tradesRef.current = trades;

  useEffect(() => {
    try { localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders)); } catch {}
  }, [reminders]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch { return "denied"; }
  }, []);

  const fire = useCallback((message) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification("Trading Journal", { body: message }); return; } catch {}
    }
    window.dispatchEvent(new CustomEvent("tj-reminder-fallback", { detail: { message } }));
  }, []);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayISO = toISODate(now);
      const dow = now.getDay();
      reminders.forEach(r => {
        if (!r.enabled || !r.time) return;
        if (Array.isArray(r.days) && r.days.length && !r.days.includes(dow)) return;
        if (r.time !== hhmm) return;
        if (lastFiredRef.current[r.id] === todayISO) return;
        lastFiredRef.current[r.id] = todayISO;

        if (r.type === "no_trade_today") {
          const flat = Object.entries(tradesRef.current || {})
            .filter(([key]) => key !== "backtest")
            .flatMap(([, list]) => list || []);
          const already = flat.some(t => t.date === todayISO);
          if (already) return; // ya cargaste algo hoy, no hace falta molestar
          fire("Todavía no registraste ningún trade hoy. Tomate 2 minutos para cargarlo.");
        } else {
          fire(r.label);
        }
      });
    };
    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, [reminders, fire]);

  return { reminders, setReminders, permission, requestPermission };
}


export { useReminders };
