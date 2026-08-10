// ─── useFinanceState ─────────────────────────────────────────────────────
// Todo el estado y la lógica del módulo de Finanzas (tab "Finanzas": gastos,
// ingresos, categorías, recurrentes, presupuestos) — antes vivía mezclado
// dentro de TradingJournalInner.jsx junto con el resto del estado de trading,
// como parte de sus 66 useState. Es el primer bloque que se extrae del
// "componente dios" porque es el más autocontenido: no comparte nada de
// estado con la parte de trading, solo necesita `cloud` (para sincronizar a
// Supabase) y `loaded` (para no auto-generar recurrentes antes de que
// termine de cargar el respaldo/la nube la primera vez).
//
// El resto de TradingJournalInner.jsx sigue funcionando exactamente igual:
// destructura todo lo que este hook devuelve con los MISMOS nombres que
// tenían las variables antes (gastos, setGastos, openFinForm, etc.), así que
// ningún otro lugar del archivo (el payload de backup, el JSX del tab
// Finanzas, etc.) tuvo que cambiar una sola línea.
import { useState, useMemo, useEffect } from "react";
import { T } from "../theme";
import { MONTHS_FULL, MONTHS_SHORT } from "../constants";
import { newId } from "../cloud/cloudSync";
import { toISODate, money } from "../utils";

export function useFinanceState({ cloud, loaded }) {
  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [finForm, setFinForm] = useState(null); // { type: 'gasto'|'ingreso', editId, nombre, fecha, valor, categoria }
  const [finFilterCat, setFinFilterCat] = useState({ gasto: "Todas", ingreso: "Todas" });
  const [finFiltersOpen, setFinFiltersOpen] = useState({ gasto: false, ingreso: false });
  const [finGranularity, setFinGranularity] = useState("mes"); // "mes" | "semana" — afecta las dos gráficas y las tarjetas de resumen
  const [finMoneda, setFinMoneda] = useState("USD"); // "USD" | "CLP" — filtra las gráficas/tarjetas (sumar USD+CLP sin tasa de cambio no tiene sentido); la tabla de registros sí muestra ambas monedas mezcladas, ahí no hay suma de por medio.
  // Categorías de Gastos/Ingresos: antes eran arrays fijos a nivel de módulo.
  // Ahora viven en estado para poder agregar/quitar categorías desde la UI
  // (botón "Categorías" en cada tabla). Los valores por defecto son los mismos
  // que antes, así que un respaldo viejo sin esta lista sigue viendo las
  // mismas categorías de siempre.
  const [gastoCatsList, setGastoCatsList] = useState(["Vivienda", "Comida", "Transporte", "Salud", "Ocio", "Suscripciones", "Otros"]);
  const [ingresoCatsList, setIngresoCatsList] = useState(["Salario", "Freelance", "Inversiones", "Regalo", "Otros"]);
  const [catManagerType, setCatManagerType] = useState(null); // 'gasto' | 'ingreso' | null → abre el modal de gestión de categorías
  const [newCatInput, setNewCatInput] = useState("");
  // Gastos/ingresos recurrentes: plantillas (no movimientos reales) que se
  // "cobran" solas una vez por mes, el día indicado. `ultimoGenerado` guarda
  // el "YYYY-MM" del último mes en que ya se generó el movimiento real, para
  // no duplicarlo si la app se abre varias veces el mismo mes.
  const [recurrentes, setRecurrentes] = useState([]);
  const [recForm, setRecForm] = useState(null); // { id, type, nombre, valor, categoria, moneda, diaMes, activo }
  // Límite de gasto mensual: si se define (>0), se compara contra lo gastado
  // en el mes calendario actual (en la moneda seleccionada arriba) y dispara
  // un aviso al 80% y al 100%.
  const [finLimiteMensual, setFinLimiteMensual] = useState(null);
  // Filtro por rango de fechas del panel financiero: afecta tanto las tablas
  // de registros como las gráficas/tarjetas de resumen. "" en from/to = sin
  // límite en ese extremo (equivalente a "todo el historial").
  const [finDateFrom, setFinDateFrom] = useState("");
  const [finDateTo, setFinDateTo] = useState("");
  // Meta de ahorro mensual: cuánto querés que te sobre (ingresos - gastos)
  // este mes calendario. $100 es el valor base sugerido, pero es editable.
  const [finMetaAhorro, setFinMetaAhorro] = useState(100);
  // Presupuesto por categoría de gasto: { [categoria]: monto }. Solo aplica a
  // categorías de gasto (las de ingreso no tienen "presupuesto"). Una
  // categoría sin entrada acá simplemente no tiene presupuesto asignado
  // todavía (no es lo mismo que presupuesto $0).
  const [presupuestosCat, setPresupuestosCat] = useState({});

  const finMoneyFmt = (value, moneda) => moneda === "CLP"
    ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
    : money(value);
  const mesDeFecha = (iso) => { const d = new Date(iso + "T00:00:00"); return isNaN(d) ? "" : MONTHS_FULL[d.getMonth()]; };

  // Clave de período: mes → "2026-08", semana → fecha ISO del lunes de esa
  // semana (única por semana, ordenable como string). Con esto agrupar por
  // semana no depende de ninguna librería de números de semana ISO.
  function finPeriodKey(fechaISO, granularity) {
    const d = new Date(fechaISO + "T00:00:00");
    if (isNaN(d)) return null;
    if (granularity === "semana") {
      const dow = (d.getDay() + 6) % 7; // 0 = lunes
      const monday = new Date(d); monday.setDate(d.getDate() - dow);
      return toISODate(monday);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  function finPeriodLabel(key, granularity) {
    if (granularity === "semana") {
      const start = new Date(key + "T00:00:00");
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      return sameMonth
        ? `${start.getDate()}-${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`
        : `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
    }
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS_SHORT[m - 1]} '${String(y).slice(2)}`;
  }

  const GASTO_CATS = gastoCatsList;
  const INGRESO_CATS = ingresoCatsList;

  function openFinForm(type, record = null) {
    setFinForm(record
      ? { type, editId: record.id, nombre: record.nombre, fecha: record.fecha, valor: String(record.valor), categoria: record.categoria, moneda: record.moneda || "USD" }
      : { type, editId: null, nombre: "", fecha: toISODate(new Date()), valor: "", categoria: type === "gasto" ? GASTO_CATS[0] : INGRESO_CATS[0], moneda: "USD" });
  }

  function saveFinRecord() {
    if (!finForm) return;
    const { type, editId, nombre, fecha, valor, categoria, moneda } = finForm;
    if (!nombre.trim() || !fecha || !valor) return;
    const setList = type === "gasto" ? setGastos : setIngresos;
    const rec = { id: editId || newId(), nombre: nombre.trim(), fecha, valor: Number(valor) || 0, categoria, moneda: moneda || "USD" };
    setList(list => editId ? list.map(r => r.id === editId ? rec : r) : [rec, ...list]);
    cloud.syncMovimientoUpsert(type, rec);
    setFinForm(null);
  }

  function deleteFinRecord(type, id) {
    (type === "gasto" ? setGastos : setIngresos)(list => list.filter(r => r.id !== id));
    cloud.syncMovimientoDelete(type, id);
  }

  // ── Categorías: agregar / eliminar ──
  // Se evita duplicar (comparación case-insensitive) y se evita dejar la
  // lista vacía (siempre queda al menos 1 categoría, si no el <select> del
  // formulario de gasto/ingreso quedaría sin opciones).
  function addFinCategory(type, name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const setList = type === "gasto" ? setGastoCatsList : setIngresoCatsList;
    setList(list => {
      if (list.some(c => c.toLowerCase() === trimmed.toLowerCase())) return list;
      cloud.syncCategoriaAdd(type, trimmed, list.length);
      return [...list, trimmed];
    });
  }
  function removeFinCategory(type, name) {
    const setList = type === "gasto" ? setGastoCatsList : setIngresoCatsList;
    setList(list => (list.length > 1 ? list.filter(c => c !== name) : list));
    cloud.syncCategoriaRemove(type, name);
    // Los registros ya guardados con esta categoría no se tocan (conservan el
    // texto tal cual quedó); solo deja de estar disponible para elegir en
    // movimientos nuevos.
  }

  // ── Gastos/ingresos recurrentes: CRUD de las plantillas ──
  function openRecForm(type, record = null) {
    setRecForm(record
      ? { ...record, valor: String(record.valor) }
      : { id: null, type, nombre: "", valor: "", categoria: type === "gasto" ? GASTO_CATS[0] : INGRESO_CATS[0], moneda: "USD", diaMes: 1, activo: true });
  }
  function saveRecRecord() {
    if (!recForm) return;
    const { id, type, nombre, valor, categoria, moneda, diaMes, activo, ultimoGenerado } = recForm;
    if (!nombre.trim() || !valor) return;
    const rec = {
      id: id || newId(), type, nombre: nombre.trim(), valor: Number(valor) || 0,
      categoria, moneda: moneda || "USD", diaMes: Math.min(31, Math.max(1, Number(diaMes) || 1)),
      activo: activo !== false, ultimoGenerado: ultimoGenerado || null,
    };
    setRecurrentes(list => id ? list.map(r => r.id === id ? rec : r) : [rec, ...list]);
    cloud.syncRecurrenteUpsert(rec);
    setRecForm(null);
  }
  function deleteRecRecord(id) {
    setRecurrentes(list => list.filter(r => r.id !== id));
    cloud.syncRecurrenteDelete(id);
  }
  function toggleRecActivo(id) {
    setRecurrentes(list => list.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, activo: !r.activo };
      cloud.syncRecurrenteUpsert(next);
      return next;
    }));
  }

  // Auto-generación mensual: por cada recurrente activo cuyo día ya pasó
  // este mes y que todavía no generó su movimiento de este mes, se crea el
  // gasto/ingreso real (con recurrenteId para trazabilidad) y se marca
  // ultimoGenerado. Corre al cargar y cada vez que cambia la lista de
  // recurrentes; como la propia actualización de `ultimoGenerado` hace que
  // en la siguiente pasada ya no haya pendientes, converge sin loop.
  useEffect(() => {
    if (!loaded) return;
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const diaActual = now.getDate();
    const pendientes = recurrentes.filter(r => r.activo !== false && r.ultimoGenerado !== mesActual && diaActual >= r.diaMes);
    if (pendientes.length === 0) return;
    const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const nuevosGastos = [];
    const nuevosIngresos = [];
    pendientes.forEach(r => {
      const dia = Math.min(r.diaMes, diasEnMes);
      const fecha = `${mesActual}-${String(dia).padStart(2, "0")}`;
      const mov = { id: newId(), nombre: r.nombre, fecha, valor: r.valor, categoria: r.categoria, moneda: r.moneda, recurrenteId: r.id };
      (r.type === "gasto" ? nuevosGastos : nuevosIngresos).push(mov);
    });
    if (nuevosGastos.length) {
      setGastos(list => [...nuevosGastos, ...list]);
      nuevosGastos.forEach(m => cloud.syncMovimientoUpsert("gasto", m));
    }
    if (nuevosIngresos.length) {
      setIngresos(list => [...nuevosIngresos, ...list]);
      nuevosIngresos.forEach(m => cloud.syncMovimientoUpsert("ingreso", m));
    }
    setRecurrentes(list => list.map(r => pendientes.some(p => p.id === r.id) ? { ...r, ultimoGenerado: mesActual } : r));
  }, [loaded, recurrentes, cloud]);

  // ── Filtro por rango de fechas del panel financiero ──
  // "" en from/to = sin límite en ese extremo. Se aplica antes que cualquier
  // otro cómputo (tablas, gráficas, tarjetas) para que todo el panel quede
  // consistente con el rango elegido.
  const gastosEnRango = useMemo(
    () => gastos.filter(r => (!finDateFrom || r.fecha >= finDateFrom) && (!finDateTo || r.fecha <= finDateTo)),
    [gastos, finDateFrom, finDateTo]
  );
  const ingresosEnRango = useMemo(
    () => ingresos.filter(r => (!finDateFrom || r.fecha >= finDateFrom) && (!finDateTo || r.fecha <= finDateTo)),
    [ingresos, finDateFrom, finDateTo]
  );
  function setFinRangePreset(preset) {
    const now = new Date();
    if (preset === "mes") {
      setFinDateFrom(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
      setFinDateTo(toISODate(now));
    } else if (preset === "mesAnterior") {
      setFinDateFrom(toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
      setFinDateTo(toISODate(new Date(now.getFullYear(), now.getMonth(), 0)));
    } else if (preset === "30d") {
      const from = new Date(now); from.setDate(now.getDate() - 29);
      setFinDateFrom(toISODate(from));
      setFinDateTo(toISODate(now));
    } else {
      setFinDateFrom(""); setFinDateTo("");
    }
  }
  const finRangeActive = !!(finDateFrom || finDateTo);

  // ── Aviso de límite de gasto mensual ──
  // Se compara SIEMPRE contra el mes calendario actual (no contra el rango de
  // fechas elegido arriba, que es para explorar historial) y contra la
  // moneda seleccionada en el toggle USD/CLP, mismo criterio que el resto de
  // las tarjetas de este panel.
  const mesActualKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const gastoMesActual = useMemo(
    () => gastos.filter(r => (r.moneda || "USD") === finMoneda && finPeriodKey(r.fecha, "mes") === mesActualKey)
      .reduce((s, r) => s + Number(r.valor || 0), 0),
    [gastos, finMoneda, mesActualKey]
  );
  const finLimitePct = finLimiteMensual > 0 ? (gastoMesActual / finLimiteMensual) * 100 : null;
  const finLimiteEstado = finLimitePct === null ? null : finLimitePct >= 100 ? "excedido" : finLimitePct >= 80 ? "cerca" : null;

  // ── Meta de ahorro mensual ──
  // Se mide contra el balance real (ingresos - gastos) del mes calendario
  // actual, en la moneda seleccionada — mismo criterio de "mes actual" que el
  // aviso de límite de arriba, no el rango de fechas elegido para explorar
  // historial.
  const ingresoMesActual = useMemo(
    () => ingresos.filter(r => (r.moneda || "USD") === finMoneda && finPeriodKey(r.fecha, "mes") === mesActualKey)
      .reduce((s, r) => s + Number(r.valor || 0), 0),
    [ingresos, finMoneda, mesActualKey]
  );
  const balanceMesActual = ingresoMesActual - gastoMesActual;
  // Progreso 0-100+: si el balance ya superó la meta, se deja pasar de 100
  // (para poder mostrar "¡meta superada!" en vez de recortarlo a un 100% que
  // se ve igual que "justo la alcanzaste"). Si el balance es negativo, el
  // progreso se ancla en 0 en vez de ir a números negativos raros en la barra.
  const metaAhorroPct = finMetaAhorro > 0 ? Math.max(0, (balanceMesActual / finMetaAhorro) * 100) : null;

  // ── Presupuesto por categoría ──
  // Total gastado este mes calendario (moneda seleccionada), agrupado por
  // categoría — se compara contra presupuestosCat[categoria] en la UI.
  const gastoPorCategoriaMesActual = useMemo(() => {
    const map = {};
    gastos.filter(r => (r.moneda || "USD") === finMoneda && finPeriodKey(r.fecha, "mes") === mesActualKey)
      .forEach(r => { map[r.categoria] = (map[r.categoria] || 0) + Number(r.valor || 0); });
    return map;
  }, [gastos, finMoneda, mesActualKey]);
  function setPresupuestoCategoria(categoria, valor) {
    setPresupuestosCat(prev => {
      const next = { ...prev };
      if (valor === null || valor === "") delete next[categoria];
      else next[categoria] = Number(valor) || 0;
      return next;
    });
    cloud.syncPresupuesto(categoria, valor === null || valor === "" ? null : Number(valor) || 0);
  }

  // Períodos (mes o semana) con AL MENOS un gasto o ingreso registrado — antes
  // esto era MESES_FIN.map(...) fijo, 12 tarjetas todo el año aunque 10
  // estuvieran vacías. Ahora la lista se arma sola a partir de las fechas
  // reales guardadas: si solo hay movimientos en julio y agosto, solo esos dos
  // períodos existen — y en cuanto se guarda un gasto/ingreso de septiembre,
  // ese período aparece solo, sin haber estado "esperando" vacío de antes.
  const finPeriods = useMemo(() => {
    const gastosFiltrados = gastosEnRango.filter(r => (r.moneda || "USD") === finMoneda);
    const ingresosFiltrados = ingresosEnRango.filter(r => (r.moneda || "USD") === finMoneda);
    const keys = new Set();
    for (const r of gastosFiltrados) { const k = finPeriodKey(r.fecha, finGranularity); if (k) keys.add(k); }
    for (const r of ingresosFiltrados) { const k = finPeriodKey(r.fecha, finGranularity); if (k) keys.add(k); }
    const sorted = Array.from(keys).sort(); // las claves (YYYY-MM o YYYY-MM-DD del lunes) ya ordenan cronológicamente como string
    return sorted.map(key => {
      const inPeriod = (r) => finPeriodKey(r.fecha, finGranularity) === key;
      const gastosMes = gastosFiltrados.filter(inPeriod).reduce((s, r) => s + r.valor, 0);
      const ingresosMes = ingresosFiltrados.filter(inPeriod).reduce((s, r) => s + r.valor, 0);
      return { key, label: finPeriodLabel(key, finGranularity), gastosMes, ingresosMes, balance: ingresosMes - gastosMes };
    });
  }, [gastosEnRango, ingresosEnRango, finGranularity, finMoneda]);

  // Serie de saldo acumulado (ingresos - gastos, corrida) para el gráfico de
  // "Historial de balance" — mismo componente (InteractiveCurveChart) que ya
  // usan Dashboard/Estadísticas para el equity curve de trading.
  const finCumulativePoints = useMemo(() => {
    let running = 0;
    return finPeriods.map(p => { running += p.balance; return { label: p.label, y: running }; });
  }, [finPeriods]);

  // Período más reciente con datos (no necesariamente el mes calendario
  // actual — si todavía no cargaste nada de este mes pero sí del anterior,
  // mostrar el anterior es más útil que una dona vacía).
  const latestPeriod = finPeriods.length ? finPeriods[finPeriods.length - 1] : null;
  // Período anterior al más reciente, para poder mostrar "vs período anterior"
  // junto al balance grande — sin esto el balance es un número aislado, con
  // esto se puede ver de un vistazo si se mejoró o empeoró.
  const previousPeriod = finPeriods.length > 1 ? finPeriods[finPeriods.length - 2] : null;
  // Un solo donut Gastos (rojo, T.loss) vs Ingresos (verde, T.gain) del período
  // más reciente — de un vistazo, si el rojo ocupa más de la mitad del anillo,
  // gastaste más de lo que ingresaste ese período.
  // Los tonos se aclaran un poco (mezclados con blanco vía color-mix) solo
  // para este donut — T.gain/T.loss siguen intactos para el resto de la app,
  // acá el pedido puntual fue que el anillo se viera menos saturado.
  const finGastoVsIngreso = useMemo(() => {
    if (!latestPeriod) return [];
    return [
      { label: "Gastos", value: latestPeriod.gastosMes, color: `color-mix(in srgb, ${T.loss} 62%, white)` },
      { label: "Ingresos", value: latestPeriod.ingresosMes, color: `color-mix(in srgb, ${T.gain} 62%, white)` },
    ];
  }, [latestPeriod]);

  return {
    gastos, setGastos, ingresos, setIngresos,
    finForm, setFinForm, finFilterCat, setFinFilterCat, finFiltersOpen, setFinFiltersOpen,
    finGranularity, setFinGranularity, finMoneda, setFinMoneda,
    gastoCatsList, setGastoCatsList, ingresoCatsList, setIngresoCatsList,
    catManagerType, setCatManagerType, newCatInput, setNewCatInput,
    recurrentes, setRecurrentes, recForm, setRecForm,
    finLimiteMensual, setFinLimiteMensual, finDateFrom, setFinDateFrom, finDateTo, setFinDateTo,
    finMetaAhorro, setFinMetaAhorro, presupuestosCat, setPresupuestosCat,
    finMoneyFmt, mesDeFecha,
    openFinForm, saveFinRecord, deleteFinRecord, addFinCategory, removeFinCategory,
    openRecForm, saveRecRecord, deleteRecRecord, toggleRecActivo,
    gastosEnRango, ingresosEnRango, setFinRangePreset, finRangeActive,
    gastoMesActual, finLimitePct, finLimiteEstado,
    ingresoMesActual, balanceMesActual, metaAhorroPct,
    gastoPorCategoriaMesActual, setPresupuestoCategoria,
    finPeriods, finCumulativePoints, latestPeriod, previousPeriod, finGastoVsIngreso,
  };
}
