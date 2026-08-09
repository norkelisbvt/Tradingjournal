// ════════════════════════════════════════════════════════════════════
// Puente entre el estado local de TradingJournalInner.jsx y la nube.
//
// Diseño: local-first, "fire and forget". Cada función acá se llama
// DESPUÉS de que ya corrió el setState local correspondiente — la UI
// nunca espera a la red. Si algo falla (sin conexión, sesión vencida),
// se loguea en consola y la app sigue funcionando 100% local; el
// próximo cambio exitoso vuelve a intentar.
//
// Este archivo NO conoce la forma completa del estado de
// TradingJournalInner — cada función recibe justo lo que necesita, así
// no hay que importar/exportar 30 variables para usarlo.
// ════════════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, onAuthChange } from "./supabaseClient";
import * as tradesApi from "./tradesSync";
import * as financeApi from "./financeSync";

/** UUID v4. Usa crypto.randomUUID() si está disponible (Electron/Chromium
 * modernos), y si no, un fallback manual — por si el contexto no se
 * considera "seguro" y el navegador no expone randomUUID(). */
export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useCloudSync() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | syncing | synced | error
  // Conflictos de sincronización pendientes de que el usuario decida qué
  // versión conservar. Cada uno: { id, entity: "trade"|"account",
  // localKey (solo cuentas), localData, remoteData }. La UI (ver
  // SyncConflictModal.jsx) lee este array y llama resolveConflict().
  const [conflicts, setConflicts] = useState([]);
  const keyToRemoteId = useRef({}); // local_key de cuenta -> uuid remoto

  useEffect(() => {
    let unsub;
    getCurrentUser().then(u => setReady(!!u));
    unsub = onAuthChange(u => {
      setReady(!!u);
      if (!u) keyToRemoteId.current = {};
    });
    return () => unsub && unsub();
  }, []);

  // ── Cuentas ──
  const syncAccountUpsert = useCallback(async (localKey, acc, grupo, orden) => {
    if (!ready) return;
    try {
      const remote = await tradesApi.upsertAccount({
        id: keyToRemoteId.current[localKey],
        localKey, grupo, orden,
        nombre: acc.name, broker: acc.broker, moneda: acc.moneda || "USD",
        saldoInicial: acc.size ?? 0, archivado: !!acc.archivado,
        fase: acc.phase, riesgoPct: acc.riskPct,
        updatedAt: acc.updatedAt,
      });
      keyToRemoteId.current[localKey] = remote.id;
      setStatus("synced");
    } catch (err) {
      if (err instanceof tradesApi.SyncConflictError) {
        setConflicts(c => [...c, { id: newId(), entity: "account", localKey, localData: err.localData, remoteData: err.remoteData }]);
        setStatus("error");
        return;
      }
      console.error("[cloud] Error al subir cuenta:", err);
      setStatus("error");
    }
  }, [ready]);

  const syncAccountDelete = useCallback(async (localKey) => {
    if (!ready) return;
    const remoteId = keyToRemoteId.current[localKey];
    if (!remoteId) return;
    try {
      await tradesApi.deleteAccount(remoteId);
      delete keyToRemoteId.current[localKey];
    } catch (err) {
      console.error("[cloud] Error al borrar cuenta:", err);
    }
  }, [ready]);

  // ── Trades ──
  // Importante: si la cuenta todavía no tiene id remoto (recién se creó y
  // el upsert de la cuenta está en vuelo), el trade se descarta esta vez
  // — el próximo autosave/cambio lo vuelve a intentar y para entonces ya
  // va a existir el id. No hace falta encolar nada a mano.
  const syncTradeUpsert = useCallback(async (localAccountKey, trade) => {
    if (!ready) return;
    const accountId = keyToRemoteId.current[localAccountKey];
    if (!accountId) return;
    try {
      await tradesApi.upsertTrade({ ...trade, accountId });
      setStatus("synced");
    } catch (err) {
      if (err instanceof tradesApi.SyncConflictError) {
        setConflicts(c => [...c, { id: newId(), entity: "trade", localKey: localAccountKey, localData: err.localData, remoteData: err.remoteData }]);
        setStatus("error");
        return;
      }
      console.error("[cloud] Error al subir trade:", err);
      setStatus("error");
    }
  }, [ready]);

  const syncTradeDelete = useCallback(async (tradeId) => {
    if (!ready) return;
    try {
      await tradesApi.deleteTrade(tradeId);
    } catch (err) {
      console.error("[cloud] Error al borrar trade:", err);
    }
  }, [ready]);

  // Sube el archivo/blob de una imagen "antes"/"después" a R2 y actualiza la
  // fila del trade con la key resultante. Devuelve la key (o null si no hay
  // sesión o algo falla) para que quien llama la guarde en el trade local.
  const syncTradeImageUpload = useCallback(async (tradeId, cual, file) => {
    if (!ready || !file) return null;
    try {
      return await tradesApi.attachTradeImage(tradeId, cual, file);
    } catch (err) {
      console.error("[cloud] Error al subir imagen del trade:", err);
      return null;
    }
  }, [ready]);

  // ── Finanzas ──
  const syncMovimientoUpsert = useCallback(async (tipo, mov) => {
    if (!ready) return;
    try { await financeApi.upsertMovimiento(tipo, mov); }
    catch (err) { console.error(`[cloud] Error al subir ${tipo}:`, err); }
  }, [ready]);

  const syncMovimientoDelete = useCallback(async (tipo, id) => {
    if (!ready) return;
    try { await financeApi.deleteMovimiento(tipo, id); }
    catch (err) { console.error(`[cloud] Error al borrar ${tipo}:`, err); }
  }, [ready]);

  const syncCategoriaAdd = useCallback(async (tipo, nombre, orden) => {
    if (!ready) return;
    try { await financeApi.addCategoria(tipo, nombre, orden); }
    catch (err) { console.error("[cloud] Error al agregar categoría:", err); }
  }, [ready]);

  const syncCategoriaRemove = useCallback(async (tipo, nombre) => {
    if (!ready) return;
    try { await financeApi.removeCategoria(tipo, nombre); }
    catch (err) { console.error("[cloud] Error al borrar categoría:", err); }
  }, [ready]);

  const syncRecurrenteUpsert = useCallback(async (rec) => {
    if (!ready) return;
    try { await financeApi.upsertRecurrente(rec); }
    catch (err) { console.error("[cloud] Error al subir recurrente:", err); }
  }, [ready]);

  const syncRecurrenteDelete = useCallback(async (id) => {
    if (!ready) return;
    try { await financeApi.deleteRecurrente(id); }
    catch (err) { console.error("[cloud] Error al borrar recurrente:", err); }
  }, [ready]);

  const syncPresupuesto = useCallback(async (categoria, monto) => {
    if (!ready) return;
    try { await financeApi.setPresupuestoCategoria(categoria, monto, "USD"); }
    catch (err) { console.error("[cloud] Error al subir presupuesto:", err); }
  }, [ready]);

  const syncFinConfig = useCallback(async (cfg) => {
    if (!ready) return;
    try { await financeApi.saveFinConfig(cfg); }
    catch (err) { console.error("[cloud] Error al subir configuración financiera:", err); }
  }, [ready]);

  // ── Pull inicial: se llama una vez al detectar sesión activa. Devuelve
  // todo listo para pisar el estado local con setAccounts/setTrades/etc
  // — este archivo no necesita conocer esos setters, los usa quien llama. ──
  const pullAll = useCallback(async () => {
    if (!ready) return null;
    setStatus("syncing");
    try {
      const [trading, finance] = await Promise.all([
        tradesApi.fetchAllTradingData(),
        financeApi.fetchAllFinanceData(),
      ]);

      const accounts = {};
      const accountOrder = { personal: [], funded: [] };
      let backtestKey = null;

      trading.accounts.forEach(acc => {
        const key = acc.localKey;
        if (!key) return; // fila remota sin local_key (no debería pasar tras el primer push)
        keyToRemoteId.current[key] = acc.id;
        accounts[key] = {
          name: acc.nombre, broker: acc.broker, moneda: acc.moneda,
          size: acc.saldoInicial, archivado: acc.archivado,
          phase: acc.fase ?? undefined,
          riskPct: acc.riesgoPct != null ? String(acc.riesgoPct) : undefined,
          updatedAt: acc.updatedAt,
        };
        if (acc.grupo === "personal" || acc.grupo === "funded") {
          accountOrder[acc.grupo][acc.orden ?? accountOrder[acc.grupo].length] = key;
        } else if (acc.grupo === "backtest") {
          backtestKey = key;
        }
      });
      accountOrder.personal = accountOrder.personal.filter(Boolean);
      accountOrder.funded = accountOrder.funded.filter(Boolean);

      const idToKey = {};
      Object.entries(keyToRemoteId.current).forEach(([k, v]) => { idToKey[v] = k; });

      const trades = {};
      Object.keys(accounts).forEach(k => { trades[k] = []; });
      trading.trades.forEach(t => {
        const key = idToKey[t.accountId];
        if (key) trades[key].push(t);
      });

      setStatus("synced");
      return { accounts, accountOrder, trades, backtestKey, finance };
    } catch (err) {
      console.error("[cloud] Error en el pull inicial:", err);
      setStatus("error");
      return null;
    }
  }, [ready]);

  // ── Resolución de conflictos ──
  // El usuario elige, desde SyncConflictModal, qué versión conservar:
  //   "mine"   → se reescribe la nube con la versión local (force=true,
  //              salta el chequeo que generó el conflicto).
  //   "theirs" → se descarta el cambio local; quien llama debe pisar el
  //              estado local (trades/accounts) con `remoteData`, que
  //              viene incluido en el valor devuelto para eso mismo.
  // No hace falta que este archivo conozca los setters de React del
  // componente que lo usa — por eso devuelve el resultado en vez de
  // aplicarlo él mismo (ver nota al principio del archivo).
  const resolveConflict = useCallback(async (conflictId, choice) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    try {
      if (choice === "mine") {
        if (conflict.entity === "account") {
          const remote = await tradesApi.upsertAccount(conflict.localData, { force: true });
          keyToRemoteId.current[conflict.localKey] = remote.id;
          setConflicts(c => c.filter(x => x.id !== conflictId));
          return { applied: "local", entity: "account", localKey: conflict.localKey, data: remote };
        } else {
          const remote = await tradesApi.upsertTrade(conflict.localData, { force: true });
          setConflicts(c => c.filter(x => x.id !== conflictId));
          return { applied: "local", entity: "trade", localKey: conflict.localKey, data: remote };
        }
      } else {
        // "theirs": no hay nada que escribir en la nube — ya tiene la
        // versión correcta. Solo se limpia el conflicto y se devuelve la
        // data remota para que la UI actualice el estado local.
        setConflicts(c => c.filter(x => x.id !== conflictId));
        return { applied: "remote", entity: conflict.entity, localKey: conflict.localKey, data: conflict.remoteData };
      }
    } catch (err) {
      console.error("[cloud] Error al resolver conflicto:", err);
      setStatus("error");
      return null;
    }
  }, [conflicts]);

  return {
    ready, status, conflicts,
    syncAccountUpsert, syncAccountDelete,
    syncTradeUpsert, syncTradeDelete, syncTradeImageUpload,
    syncMovimientoUpsert, syncMovimientoDelete,
    syncCategoriaAdd, syncCategoriaRemove,
    syncRecurrenteUpsert, syncRecurrenteDelete,
    syncPresupuesto, syncFinConfig,
    pullAll, resolveConflict,
  };
}
