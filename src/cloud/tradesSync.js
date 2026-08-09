// ════════════════════════════════════════════════════════════════════
// Sincronización de cuentas de trading y trades (incluye imágenes
// antes/después) con Supabase + R2. Mismo criterio "local-first" que
// financeSync.js — ver ese archivo para el detalle del enfoque.
//
// Detección de conflictos (optimistic concurrency): tanto trades como
// accounts tienen `updated_at` en la base, actualizado automáticamente
// por trigger en cada UPDATE. Cada objeto local guarda ese valor como
// `updatedAt` desde la última vez que se leyó del servidor. Antes de
// sobreescribir una fila ya existente, upsertTrade/upsertAccount
// comparan el `updated_at` remoto ACTUAL contra ese valor conocido —
// si no coinciden, alguien más lo cambió en el medio, y se lanza
// SyncConflictError en vez de pisarlo en silencio. Ver cloudSync.js
// para cómo se atrapa y se resuelve desde la UI.
//   - Los ids de trade/cuenta son UUID generados por la app
//     (ver newId() en cloudSync.js), no Date.now().
//   - Las cuentas locales se identifican por localKey (ej. "personal-1"),
//     no por uuid — por eso upsertAccount hace ON CONFLICT sobre
//     (user_id, local_key) cuando todavía no se conoce el id remoto, y
//     sobre id una vez que ya se sincronizó al menos una vez.
// ════════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient";
import { uploadTradeImage, getTradeImageUrlCached } from "./r2";

// Se lanza cuando upsertTrade/upsertAccount detectan que la fila remota
// cambió desde la última vez que la app la vio. Carga ambas versiones
// para que la UI le muestre al usuario "tu versión" vs "la de la nube"
// y decida, en vez de perder cambios en silencio.
export class SyncConflictError extends Error {
  constructor(entity, localData, remoteData) {
    super(`Conflicto de sincronización: ${entity} ${localData.id} fue modificado en otro dispositivo`);
    this.name = "SyncConflictError";
    this.entity = entity; // "trade" | "account"
    this.localData = localData;
    this.remoteData = remoteData;
  }
}

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa");
  return user.id;
}

// ── Carga inicial ──
export async function fetchAllTradingData() {
  const [accounts, trades] = await Promise.all([
    supabase.from("accounts").select("*").order("orden"),
    supabase.from("trades").select("*").order("fecha", { ascending: false }),
  ]);
  if (accounts.error) throw accounts.error;
  if (trades.error) throw trades.error;
  return {
    accounts: accounts.data.map(rowToAccount),
    trades: trades.data.map(rowToTrade),
  };
}

export function rowToAccount(row) {
  return {
    id: row.id,
    localKey: row.local_key,
    grupo: row.grupo, // 'personal' | 'funded' | 'backtest'
    nombre: row.nombre,
    broker: row.broker,
    moneda: row.moneda,
    saldoInicial: Number(row.saldo_inicial),
    orden: row.orden,
    archivado: row.archivado,
    fase: row.fase,
    riesgoPct: row.riesgo_pct != null ? Number(row.riesgo_pct) : null,
    updatedAt: row.updated_at,
  };
}

export function rowToTrade(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.fecha,
    time: row.hora ?? undefined,
    exitTime: row.hora_salida ?? undefined,
    exitDate: row.fecha_salida ?? undefined,
    instrument: row.instrumento,
    direction: row.direccion ?? undefined,
    session: row.sesion ?? undefined,
    entry: row.entrada != null ? String(row.entrada) : undefined,
    exit: row.salida != null ? String(row.salida) : undefined,
    stopLoss: row.stop_loss != null ? String(row.stop_loss) : undefined,
    size: row.lotaje != null ? String(row.lotaje) : undefined,
    riskPct: row.risk_pct != null ? String(row.risk_pct) : undefined,
    rr: row.rr != null ? String(row.rr) : undefined,
    pnl: row.pnl != null ? Number(row.pnl) : undefined,
    setups: row.setups || [],
    reasons: row.razones || {},
    errors: row.errores || [],
    emotions: row.emociones || [],
    emotionIntensity: row.emociones_intensidad || {},
    tags: row.tags || [],
    notes: row.notas ?? undefined,
    reviewWhatWorked: row.revision_bien ?? undefined,
    reviewWhatToImprove: row.revision_mejorar ?? undefined,
    imagenAntesKey: row.imagen_antes_key,
    imagenDespuesKey: row.imagen_despues_key,
    updatedAt: row.updated_at,
  };
}

// ── Cuentas ──
// `acc.id` viene indefinido la primera vez que se sincroniza una cuenta
// que ya existía localmente (todavía no tiene id remoto) — en ese caso el
// upsert hace match por (user_id, local_key) en vez de por id. Una vez
// que la respuesta trae el id real, quien llama debe guardarlo (ver
// cloudSync.js: keyToRemoteId) para mandarlo en las próximas llamadas.
export async function upsertAccount(acc, { force = false } = {}) {
  const userId = await currentUserId();

  // Chequeo de conflicto: solo aplica a cuentas que YA tienen id remoto
  // (o sea, no es la primera vez que se sincronizan) y que traen un
  // `updatedAt` conocido para comparar. `force` lo salta a propósito —
  // lo usa resolveConflict() en cloudSync.js cuando el usuario elige
  // "usar mi versión" después de ver el conflicto.
  if (!force && acc.id && acc.updatedAt) {
    const { data: current, error: checkErr } = await supabase.from("accounts").select("*").eq("id", acc.id).maybeSingle();
    if (checkErr) throw checkErr;
    if (current && current.updated_at !== acc.updatedAt) {
      throw new SyncConflictError("account", acc, rowToAccount(current));
    }
  }

  const row = {
    ...(acc.id ? { id: acc.id } : {}),
    user_id: userId,
    local_key: acc.localKey,
    grupo: acc.grupo ?? null,
    nombre: acc.nombre,
    broker: acc.broker ?? null,
    moneda: acc.moneda || "USD",
    saldo_inicial: acc.saldoInicial ?? 0,
    orden: acc.orden ?? 0,
    archivado: !!acc.archivado,
    fase: acc.fase ?? null,
    riesgo_pct: acc.riesgoPct != null && acc.riesgoPct !== "" ? Number(acc.riesgoPct) : null,
  };
  const onConflict = acc.id ? "id" : "user_id,local_key";
  const { data, error } = await supabase.from("accounts").upsert(row, { onConflict }).select().single();
  if (error) throw error;
  return rowToAccount(data);
}
export async function deleteAccount(id) {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

// ── Trades ──
// Los campos numéricos locales (entry, exit, stopLoss, size, riskPct, rr)
// viajan como STRING en el form (vienen de <input type="number"> leídos
// como e.target.value) — por eso se parsean acá antes de mandarlos a una
// columna numeric. Number("") da NaN, no 0, así que se cae a null en ese
// caso (campo vacío = sin dato, no cero).
export function numOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export async function upsertTrade(trade, { force = false } = {}) {
  const userId = await currentUserId();

  // Mismo chequeo de conflicto que upsertAccount — ver el comentario ahí.
  // Acá SÍ puede haber `trade.id` sin haberse sincronizado nunca (el id es
  // un UUID generado localmente al crear el trade, no algo que asigna el
  // servidor) — por eso el chequeo depende de `trade.updatedAt`, no solo
  // de si `trade.id` existe: sin `updatedAt` conocido, no hay nada contra
  // qué comparar, así que se deja pasar como creación normal.
  if (!force && trade.id && trade.updatedAt) {
    const { data: current, error: checkErr } = await supabase.from("trades").select("*").eq("id", trade.id).maybeSingle();
    if (checkErr) throw checkErr;
    if (current && current.updated_at !== trade.updatedAt) {
      throw new SyncConflictError("trade", trade, rowToTrade(current));
    }
  }

  const row = {
    id: trade.id, // uuid generado por la app — ver newId() en cloudSync.js
    user_id: userId,
    account_id: trade.accountId ?? null,
    fecha: trade.date,
    hora: trade.time || null,
    hora_salida: trade.exitTime || null,
    fecha_salida: trade.exitDate || null,
    instrumento: trade.instrument,
    direccion: trade.direction ?? null,
    sesion: trade.session ?? null,
    entrada: numOrNull(trade.entry),
    salida: numOrNull(trade.exit),
    stop_loss: numOrNull(trade.stopLoss),
    lotaje: numOrNull(trade.size),
    risk_pct: numOrNull(trade.riskPct),
    rr: numOrNull(trade.rr),
    pnl: numOrNull(trade.pnl),
    setups: trade.setups ?? [],
    razones: trade.reasons ?? {},
    errores: trade.errors ?? [],
    emociones: trade.emotions ?? [],
    emociones_intensidad: trade.emotionIntensity ?? {},
    tags: trade.tags ?? [],
    notas: trade.notes ?? null,
    revision_bien: trade.reviewWhatWorked ?? null,
    revision_mejorar: trade.reviewWhatToImprove ?? null,
    imagen_antes_key: trade.imagenAntesKey ?? null,
    imagen_despues_key: trade.imagenDespuesKey ?? null,
  };
  const { data, error } = await supabase.from("trades").upsert(row).select().single();
  if (error) throw error;
  return rowToTrade(data);
}
export async function deleteTrade(id) {
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
  // Nota: esto borra la fila, pero NO borra los objetos en R2 (R2 no
  // tiene cascade). Si querés limpieza automática, se puede agregar acá
  // una llamada a otra Edge Function que borre las keys asociadas — no
  // es urgente mientras el volumen de imágenes sea bajo.
}

/**
 * Sube la imagen "antes" o "después" de un trade y actualiza la fila en
 * Supabase con la key resultante. Se usa así:
 *   await attachTradeImage(trade.id, "antes", file);
 */
export async function attachTradeImage(tradeId, cual /* "antes" | "despues" */, file) {
  const userId = await currentUserId();
  const key = await uploadTradeImage(userId, tradeId, cual, file);
  const column = cual === "antes" ? "imagen_antes_key" : "imagen_despues_key";
  const { error } = await supabase.from("trades").update({ [column]: key }).eq("id", tradeId);
  if (error) throw error;
  return key;
}

/** Devuelve una URL temporal lista para poner en un <img src=...> */
export async function getTradeImageUrl(key) {
  return getTradeImageUrlCached(key);
}
