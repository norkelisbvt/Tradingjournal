// ════════════════════════════════════════════════════════════════════
// Sincronización del panel financiero con Supabase.
//
// Diseño "local-first": estas funciones se llaman DESPUÉS de que el
// estado local (useState) ya se actualizó, igual que hoy hace el
// autosave a localStorage/archivo. Si falla la red, la app sigue
// funcionando con lo local; el próximo guardado exitoso pone todo al
// día. No son la única fuente de verdad todavía — son un espejo.
//
// Fase 2 (próximo paso, sobre TradingJournalInner.jsx) conecta cada una
// de estas funciones a los mismos puntos donde hoy se llama
// setGastos/setIngresos/etc., sin cambiar la lógica local existente.
// ════════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient";

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa");
  return user.id;
}

// ── Carga inicial: trae todo el módulo financiero de una sola vez ──
// Pensado para llamarse una vez al iniciar sesión / abrir la app, y
// usar el resultado para "hidratar" el estado local en vez de (o además
// de) lo que haya en localStorage.
export async function fetchAllFinanceData() {
  const userId = await currentUserId();
  const [gastos, ingresos, categorias, recurrentes, presupuestos, config] = await Promise.all([
    supabase.from("fin_gastos").select("*").order("fecha", { ascending: false }),
    supabase.from("fin_ingresos").select("*").order("fecha", { ascending: false }),
    supabase.from("fin_categorias").select("*").order("orden"),
    supabase.from("fin_recurrentes").select("*"),
    supabase.from("fin_presupuestos_categoria").select("*"),
    supabase.from("fin_config").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  for (const r of [gastos, ingresos, categorias, recurrentes, presupuestos, config]) {
    if (r.error) throw r.error;
  }
  return {
    gastos: gastos.data.map(rowToGastoIngreso),
    ingresos: ingresos.data.map(rowToGastoIngreso),
    gastoCatsList: categorias.data.filter(c => c.tipo === "gasto").map(c => c.nombre),
    ingresoCatsList: categorias.data.filter(c => c.tipo === "ingreso").map(c => c.nombre),
    recurrentes: recurrentes.data.map(rowToRecurrente),
    presupuestosCat: Object.fromEntries(presupuestos.data.map(p => [p.categoria, p.monto])),
    finLimiteMensual: config.data?.limite_mensual ?? null,
    finMetaAhorro: config.data?.meta_ahorro ?? 100,
  };
}

function rowToGastoIngreso(row) {
  return { id: row.id, nombre: row.nombre, fecha: row.fecha, valor: Number(row.valor), categoria: row.categoria, moneda: row.moneda, recurrenteId: row.recurrente_id ?? undefined };
}
function rowToRecurrente(row) {
  return { id: row.id, type: row.tipo, nombre: row.nombre, valor: Number(row.valor), categoria: row.categoria, moneda: row.moneda, diaMes: row.dia_mes, activo: row.activo, ultimoGenerado: row.ultimo_generado };
}

// ── Gastos / Ingresos ──
export async function upsertMovimiento(tipo /* "gasto" | "ingreso" */, mov) {
  const userId = await currentUserId();
  const table = tipo === "gasto" ? "fin_gastos" : "fin_ingresos";
  const row = {
    id: mov.id, user_id: userId, nombre: mov.nombre, fecha: mov.fecha,
    valor: mov.valor, categoria: mov.categoria, moneda: mov.moneda || "USD",
    recurrente_id: mov.recurrenteId ?? null,
  };
  const { error } = await supabase.from(table).upsert(row);
  if (error) throw error;
}
export async function deleteMovimiento(tipo, id) {
  const table = tipo === "gasto" ? "fin_gastos" : "fin_ingresos";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// ── Categorías ──
export async function addCategoria(tipo, nombre, orden = 0) {
  const userId = await currentUserId();
  const { error } = await supabase.from("fin_categorias").insert({ user_id: userId, tipo, nombre, orden });
  if (error) throw error;
}
export async function removeCategoria(tipo, nombre) {
  const { error } = await supabase.from("fin_categorias").delete().match({ tipo, nombre });
  if (error) throw error;
}

// ── Recurrentes ──
export async function upsertRecurrente(rec) {
  const userId = await currentUserId();
  const row = {
    id: rec.id, user_id: userId, tipo: rec.type, nombre: rec.nombre, valor: rec.valor,
    categoria: rec.categoria, moneda: rec.moneda || "USD", dia_mes: rec.diaMes,
    activo: rec.activo !== false, ultimo_generado: rec.ultimoGenerado ?? null,
  };
  const { error } = await supabase.from("fin_recurrentes").upsert(row);
  if (error) throw error;
}
export async function deleteRecurrente(id) {
  const { error } = await supabase.from("fin_recurrentes").delete().eq("id", id);
  if (error) throw error;
}

// ── Presupuesto por categoría ──
export async function setPresupuestoCategoria(categoria, monto, moneda = "USD") {
  const userId = await currentUserId();
  if (monto == null) {
    const { error } = await supabase.from("fin_presupuestos_categoria").delete().match({ user_id: userId, categoria, moneda });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("fin_presupuestos_categoria").upsert({ user_id: userId, categoria, moneda, monto });
  if (error) throw error;
}

// ── Configuración (límite mensual + meta de ahorro) ──
export async function saveFinConfig({ finLimiteMensual, finMetaAhorro, monedaDefault = "USD" }) {
  const userId = await currentUserId();
  const { error } = await supabase.from("fin_config").upsert({
    user_id: userId, limite_mensual: finLimiteMensual, meta_ahorro: finMetaAhorro, moneda_default: monedaDefault,
  });
  if (error) throw error;
}
