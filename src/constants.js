// ─── Constantes y datos por defecto ─────────────────────────────────────────
// Extraído de TradingJournal.jsx (fase 1 de modularización). Casi todo es dato
// puro (arrays/objetos estáticos) — la única dependencia real es lucide-react,
// porque ONBOARDING_STEPS guarda el ícono de cada paso como referencia directa
// al componente (icon: Crown), no como JSX.
import { Crown, CalendarDays, Plus, Brain } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
export const INSTRUMENTS = ["NAS100", "GOLD", "EURUSD", "AUDUSD", "SPX500"];
export const INST_COLOR = { NAS100: "#d97706", GOLD: "#6d28d9", EURUSD: "#2563eb", AUDUSD: "#059669", SPX500: "#dc2626" };
// Etiqueta corta + emoji por instrumento, para mostrar tags compactos y con
// menos ruido visual en toda la app (filtros, tablas, tarjetas de galería, etc.).
// La clave interna del instrumento (NAS100, SPX500...) no cambia — solo cómo se
// muestra — para no romper trades ya guardados.
export const INST_META = {
  NAS100: { label: "US100", emoji: "🇺🇸" },
  SPX500: { label: "US500", emoji: "🇺🇸" },
  GOLD: { label: "GOLD", emoji: "🪙" },
  EURUSD: { label: "EURUSD", emoji: "🇪🇺" },
  AUDUSD: { label: "AUDUSD", emoji: "🇦🇺" },
};
// Valores aproximados por instrumento para la calculadora de tamaño de posición:
// - pipSize: cuánto vale "1 pip/punto" en precio (ej. 0.0001 para forex, 1 para índices/oro).
// - valuePerPipPerLot: cuántos dólares vale ese movimiento por cada 1.0 lote estándar.
// Son valores de referencia genéricos — varían según el bróker, así que son editables
// directamente desde la calculadora.
export const DEFAULT_INSTRUMENT_SPECS = {
  NAS100: { pipSize: 1, valuePerPipPerLot: 1, unitLabel: "punto" },
  SPX500: { pipSize: 1, valuePerPipPerLot: 1, unitLabel: "punto" },
  GOLD: { pipSize: 1, valuePerPipPerLot: 100, unitLabel: "punto" },
  EURUSD: { pipSize: 0.0001, valuePerPipPerLot: 10, unitLabel: "pip" },
  AUDUSD: { pipSize: 0.0001, valuePerPipPerLot: 10, unitLabel: "pip" },
};
export const FALLBACK_INSTRUMENT_SPEC = { pipSize: 1, valuePerPipPerLot: 1, unitLabel: "punto" };
export const DIRECTIONS = ["LONG", "SHORT"];
export const SESSIONS = ["London", "New York", "Asian", "Overlap"];
export const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const YEARS = Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => 2024 + i);
// Rango de años para el apartado de Backtesting: desde 2020 hasta el año actual.
export const BACKTEST_YEARS = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i);
// Metadatos de cada GRUPO de cuenta: etiqueta base y color de acento.
// Personal y Fondeo pueden tener varias subcuentas (personal-1, personal-2, ...);
// Backtesting es siempre una sola cuenta.
export const ACCOUNT_META = {
  personal: { label: "Personal", color: "#7c3aed" },
  funded: { label: "Fondeo", color: "#db2777" },
  backtest: { label: "Backtesting", color: "#d97706" },
};
// Orden de pestañas usado tanto por el sidebar como por los atajos de teclado
// numéricos (1-8): mismo orden en el que aparecen los íconos, para que "2"
// siempre lleve al segundo ícono visible sin importar dónde se lea esta lista.
export const TAB_KEY_ORDER = ["dashboard", "calendar", "trades", "chart", "stats", "compare", "gallery", "mindset"];
export const DEFAULT_REASONS = [];
export const EMOTIONS = [
  { id: "calm", label: "Tranquilo", emoji: "😌" },
  { id: "confident", label: "Confiado", emoji: "💪" },
  { id: "fomo", label: "FOMO", emoji: "😰" },
  { id: "revenge", label: "Revenge trading", emoji: "😤" },
  { id: "fear", label: "Miedo", emoji: "😨" },
  { id: "greedy", label: "Codicioso", emoji: "🤑" },
  { id: "impatient", label: "Impaciente", emoji: "⏰" },
  { id: "disciplined", label: "Disciplinado", emoji: "🎯" },
  { id: "tired", label: "Cansado", emoji: "😴" },
  { id: "stressed", label: "Estresado", emoji: "😬" },
];
export const EMPTY_FORM = {
  date: "", time: "", exitDate: "", instrument: "NAS100", direction: "LONG", session: "New York",
  entry: "", exit: "", stopLoss: "", size: "", rr: "", riskPct: "", pnl: "", notes: "", setups: [],
  reasons: {}, emotions: [], errors: [], tags: [], imgBefore: null, imgAfter: null,
};
export const DEMO_TRADES = {
  "personal-1": [
    { id: 1, date: "2025-09-01", instrument: "NAS100", direction: "LONG", session: "New York", entry: "19200", exit: "19380", size: "1", rr: "2.5", pnl: 180, notes: "Breakout tras CPI positivo", setup: "BOS + FVG", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false }, "FVG presente (Fair Value Gap)": { checked: true, ignored: false }, "Sesión de alta liquidez": { checked: true, ignored: false }, "DXY correlación favorable": { checked: false, ignored: true } }, emotions: ["confident", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 2, date: "2025-09-03", instrument: "GOLD", direction: "SHORT", session: "London", entry: "2520", exit: "2508", size: "0.5", rr: "1.8", pnl: -60, notes: "Stop hit en HH — entré sin confirmación", setup: "Liquidity sweep", reasons: { "Liquidity sweep previo": { checked: true, ignored: false }, "CHoCH confirmado": { checked: false, ignored: true } }, emotions: ["fomo", "impatient"], imgBefore: null, imgAfter: null },
    { id: 3, date: "2025-09-08", instrument: "NAS100", direction: "LONG", session: "New York", entry: "19450", exit: "19620", size: "2", rr: "2.2", pnl: 340, notes: "Pre-FOMC momentum fuerte", setup: "Range breakout", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false }, "Sesión de alta liquidez": { checked: true, ignored: false } }, emotions: ["calm", "confident"], imgBefore: null, imgAfter: null },
    { id: 4, date: "2025-09-12", instrument: "GOLD", direction: "LONG", session: "New York", entry: "2545", exit: "2578", size: "1", rr: "2.8", pnl: 330, notes: "DXY bajando en datos empleo", setup: "OB retest", reasons: { "OB válido (Order Block)": { checked: true, ignored: false }, "DXY correlación favorable": { checked: true, ignored: false } }, emotions: ["calm", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 5, date: "2025-09-15", instrument: "NAS100", direction: "SHORT", session: "London", entry: "19800", exit: "19720", size: "1", rr: "1.5", pnl: -120, notes: "Operar con noticias — mal timing", setup: "CHoCH", reasons: { "CHoCH confirmado": { checked: false, ignored: true } }, emotions: ["stressed", "revenge"], imgBefore: null, imgAfter: null },
    { id: 6, date: "2025-09-22", instrument: "GOLD", direction: "LONG", session: "Overlap", entry: "2590", exit: "2625", size: "0.8", rr: "3.0", pnl: 280, notes: "Setup limpio, paciencia premiada", setup: "FVG fill", reasons: { "FVG presente (Fair Value Gap)": { checked: true, ignored: false }, "Confluencia con nivel HTF": { checked: true, ignored: false } }, emotions: ["calm", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 7, date: "2025-08-05", instrument: "NAS100", direction: "LONG", session: "New York", entry: "18900", exit: "19100", size: "1.5", rr: "2.0", pnl: 300, notes: "Rebote en soporte fuerte", setup: "OB + BOS", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false } }, emotions: ["confident", "calm"], imgBefore: null, imgAfter: null },
    { id: 8, date: "2025-08-10", instrument: "GOLD", direction: "SHORT", session: "London", entry: "2490", exit: "2478", size: "0.5", rr: "1.2", pnl: -90, notes: "Ignoré FVG, entré por FOMO", setup: "Ninguno claro", reasons: { "FVG presente (Fair Value Gap)": { checked: false, ignored: true } }, emotions: ["fomo", "greedy"], imgBefore: null, imgAfter: null },
    { id: 9, date: "2025-08-14", instrument: "NAS100", direction: "LONG", session: "New York", entry: "19050", exit: "19200", size: "1", rr: "2.3", pnl: 150, notes: "FVG en H4 con confluencia", setup: "FVG H4", reasons: { "FVG presente (Fair Value Gap)": { checked: true, ignored: false } }, emotions: ["calm"], imgBefore: null, imgAfter: null },
    { id: 11, date: "2025-08-19", instrument: "GOLD", direction: "LONG", session: "New York", entry: "2470", exit: "2505", size: "1", rr: "2.5", pnl: 350, notes: "Nivel HTF clave sostuvo", setup: "OB diario", reasons: { "OB válido (Order Block)": { checked: true, ignored: false } }, emotions: ["disciplined", "confident"], imgBefore: null, imgAfter: null },
    { id: 13, date: "2025-07-03", instrument: "NAS100", direction: "LONG", session: "New York", entry: "18500", exit: "18750", size: "2", rr: "3.0", pnl: 500, notes: "Gran setup post-datos empleo", setup: "BOS + FVG semanal", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false } }, emotions: ["calm", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 14, date: "2025-07-09", instrument: "GOLD", direction: "SHORT", session: "London", entry: "2430", exit: "2418", size: "1", rr: "1.8", pnl: 120, notes: "Sweep de liquidez en máximo", setup: "Liquidity sweep", reasons: { "Liquidity sweep previo": { checked: true, ignored: false } }, emotions: ["confident"], imgBefore: null, imgAfter: null },
    { id: 15, date: "2025-07-15", instrument: "NAS100", direction: "LONG", session: "New York", entry: "18650", exit: "18620", size: "1", rr: "0.5", pnl: -75, notes: "Revenge trade después de pérdida", setup: "Ninguno", reasons: {}, emotions: ["revenge", "stressed", "fomo"], imgBefore: null, imgAfter: null },
    { id: 17, date: "2025-06-04", instrument: "NAS100", direction: "LONG", session: "New York", entry: "18200", exit: "18380", size: "1", rr: "2.1", pnl: 180, notes: "NFP lunes siguiente", setup: "FVG semanal", reasons: { "FVG presente (Fair Value Gap)": { checked: true, ignored: false } }, emotions: ["confident"], imgBefore: null, imgAfter: null },
    { id: 20, date: "2025-05-06", instrument: "GOLD", direction: "LONG", session: "New York", entry: "2310", exit: "2342", size: "1", rr: "2.5", pnl: 320, notes: "FOMC dovish, DXY cae fuerte", setup: "OB diario + FVG", reasons: { "OB válido (Order Block)": { checked: true, ignored: false } }, emotions: ["confident", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 26, date: "2025-03-05", instrument: "GOLD", direction: "LONG", session: "New York", entry: "2910", exit: "2945", size: "1", rr: "2.8", pnl: 350, notes: "Setup textbook, muy limpio", setup: "OB + BOS semanal", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false } }, emotions: ["confident", "disciplined", "calm"], imgBefore: null, imgAfter: null },
  ],
  "funded-1": [
    { id: 10, date: "2025-09-02", instrument: "NAS100", direction: "LONG", session: "New York", entry: "19250", exit: "19400", size: "0.5", rr: "2.0", pnl: 75, notes: "Sizing conservador en fase 1", setup: "BOS + FVG", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false } }, emotions: ["calm", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 30, date: "2025-09-10", instrument: "GOLD", direction: "LONG", session: "London", entry: "2560", exit: "2592", size: "0.3", rr: "2.5", pnl: 96, notes: "OB H4 respetado", setup: "OB retest", reasons: { "OB válido (Order Block)": { checked: true, ignored: false } }, emotions: ["disciplined"], imgBefore: null, imgAfter: null },
    { id: 31, date: "2025-08-15", instrument: "NAS100", direction: "LONG", session: "New York", entry: "19000", exit: "19150", size: "0.5", rr: "2.2", pnl: 75, notes: "Respetando reglas de fondeo", setup: "BOS H4", reasons: { "BOS confirmado (Break of Structure)": { checked: true, ignored: false } }, emotions: ["calm", "disciplined"], imgBefore: null, imgAfter: null },
    { id: 32, date: "2025-08-22", instrument: "GOLD", direction: "SHORT", session: "London", entry: "2480", exit: "2474", size: "0.3", rr: "1.5", pnl: -18, notes: "Stop pequeño, gestionando riesgo", setup: "Resistencia", reasons: { "Soporte/Resistencia clave": { checked: true, ignored: false } }, emotions: ["calm"], imgBefore: null, imgAfter: null },
  ],
  // Historial independiente para pruebas de backtesting (2020 en adelante). No se mezcla
  // con el historial real de Personal ni de Fondeo.
  backtest: [],
};
// Ícono tipo "bandera" por instrumento, para que la columna Par se vea como en Notion.
export const INST_FLAG = { NAS100: "🇺🇸", SPX500: "🇺🇸", GOLD: "🥇", EURUSD: "🇪🇺", AUDUSD: "🇦🇺" };
// ─── Recordatorios (mientras la app está abierta) ──────────────────────────────
// Sistema simple de recordatorios en el dispositivo: no hay push real ni backend,
// así que solo funcionan mientras la pestaña/app está abierta. Se guardan en
// localStorage y se revisan con un intervalo cada 20s comparando hora actual.
// Si el navegador dio permiso de Notification, se usa una notificación nativa;
// si no, se hace fallback a un evento que la app escucha para mostrar un toast.
export const REMINDERS_KEY = "trading-journal-reminders";
export const REMINDER_DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DEFAULT_REMINDERS = [
  { id: "no-trade-today", type: "no_trade_today", label: "Avisarme si no registré ningún trade hoy", time: "20:00", days: [1, 2, 3, 4, 5], enabled: false },
];
// Carrusel corto de 4 pasos que se muestra una sola vez, la primera vez que
// alguien desbloquea la app, para orientar sobre las piezas clave (registrar
// trades, calendario/dashboard, estadísticas y mentalidad, atajos). Después
// de la primera vez queda guardado en localStorage y no se vuelve a mostrar
// solo, pero sigue disponible desde el menú "···" → "Ver introducción".
export const ONBOARDING_KEY = "trading-journal-onboarded";
export const ONBOARDING_STEPS = [
  {
    icon: Crown,
    title: "Bienvenido a Nvt",
    body: "Tu diario de trading personal: registrá cada operación, seguí tu curva de capital y detectá patrones en tu forma de operar — todo guardado localmente, en tu dispositivo.",
  },
  {
    icon: Plus,
    title: "Registrá tus trades",
    body: "El botón \"+ Nuevo trade\" (o la tecla N) abre el formulario. Cargá entrada, salida, tamaño y motivo — la calculadora de riesgo y el R:R se completan solos a partir de esos datos.",
  },
  {
    icon: CalendarDays,
    title: "Calendario, dashboard y estadísticas",
    body: "El calendario muestra el resultado de cada día de un vistazo. El dashboard trae tu curva de capital y métricas clave; Estadísticas y Comparativa profundizan por setup, instrumento o cuenta.",
  },
  {
    icon: Brain,
    title: "Mindset y atajos",
    body: "La sección Mindset lleva tu diario emocional y checklist de rutina. Y si preferís el teclado: Cmd/Ctrl+K abre la paleta de comandos, \"?\" muestra todos los atajos.",
  },
];
// ─── Confetti ───────────────────────────────────────────────────────────────
// Ráfaga breve de confetti en CSS puro (sin librerías): se monta, corre su
// animación de caída ~1.3s y se desmonta sola. Pensada para momentos de
// "logro" puntuales (racha de wins alcanza un hito, meta mensual cumplida),
// no como decoración permanente.
export const CONFETTI_COLORS = ["#7c3aed", "#a78bfa", "#16a34a", "#d97706", "#db2777", "#38bdf8"];
// ─── Paleta de acento por cuenta (variaciones del color de su grupo) ─────────
// Genera un color distinto para cada subcuenta dentro de un mismo grupo, de forma
// determinista según su posición, para que el donut y las tarjetas de "Accounts"
// se puedan distinguir entre sí sin salirse de la paleta morado/rosa/ámbar de la app.
export const GROUP_SHADES = {
  personal: ["#7c3aed", "#a78bfa", "#c4b5fd", "#5b21b6"],
  funded: ["#db2777", "#f472b6", "#fbcfe8", "#9d174d"],
  backtest: ["#d97706"],
};
// ─── Error Tag Selector (taxonomía de errores de ejecución, más allá de emociones) ──
export const DEFAULT_ERRORS = ["SL movido", "Sobre-apalancado", "Entré sin setup", "Cerré antes de tiempo", "No coloqué SL", "Operé fuera de horario", "Operé por aburrimiento", "Tamaño mal calculado"];
// ─── Statistics View ──────────────────────────────────────────────────────────
export const NEG_EMOTIONS = ["fomo","revenge","fear","greedy","impatient","tired","stressed"];
// ─── Mindset ────────────────────────────────────────────────────────────────
// Ítems por defecto de la rutina mental pre/post sesión. El usuario puede
// agregar o quitar los suyos propios; la lista se guarda junto al resto de los datos.
export const DEFAULT_ROUTINE_ITEMS = {
  pre: ["Dormí bien y estoy descansado", "Revisé mi plan y sesgo del día", "Sin distracciones externas", "Estado emocional neutral/tranquilo", "Definí mi riesgo máximo del día"],
  post: ["Seguí mi plan de trading", "No hice revenge trading", "Registré el/los trade(s) en el journal", "Identifiqué qué puedo mejorar"],
};
// ─── Trading Routine (hábitos diarios estilo "Notion tracker") ────────────────
// Actividades fijas de la rutina diaria del trader. Cada una se tilda por día
// y el histórico se acumula con el tiempo (queda guardado por fecha) para poder
// verlo luego en la mini-gráfica de hábitos.
export const ROUTINE_ACTIVITIES = [
  { key: "manifestacion", label: "Manifestación", emoji: "🙏" },
  { key: "cafe", label: "Café", emoji: "☕" },
  { key: "analisis", label: "Análisis", emoji: "📊" },
  { key: "lunch", label: "Lunch", emoji: "🍽️" },
  { key: "lectura", label: "Lectura", emoji: "📖" },
  { key: "backtest", label: "Backtest", emoji: "⏮️" },
];
export const WEEKDAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// Vista Mindset: combina estadísticas de emociones (movidas desde Estadísticas),
// la rutina mental pre/post sesión, y un diario de reflexiones independiente de los trades.
// ─── Lección del día ────────────────────────────────────────────────────────
// Diario libre de notas rápidas del día (planes, ideas, cosas random) — separado
// del "Diario de mindset" (que es por estado de ánimo). Cada nota se etiqueta
// como Personal o Trading, y la lista se organiza agrupada por mes, igual que
// las ejecuciones en la pestaña Trades (tarjetas colapsables + tabla).
export const LESSON_CATEGORIES = {
  trading: { label: "Trading", emoji: "📈", color: "#2563eb" },
  personal: { label: "Personal", emoji: "🌱", color: "#db2777" },
};
// Valores por defecto de cada cuenta — se usan para inicializar el estado y también
// para "rellenar" cuentas que falten en un respaldo/guardado antiguo (p.ej. si el
// respaldo es de antes de que existiera la cuenta Backtesting, o de antes de que
// Personal/Fondeo admitieran varias subcuentas).
export const DEFAULT_ACCOUNTS = {
  "personal-1": { name: "Personal 1", size: 5000, broker: "IC Markets", phase: "Live Account", riskPct: "1", dailyLossLimitPct: "", maxDrawdownPct: "", maxTradesPerDay: "" },
  "funded-1": { name: "Fondeo 1", size: 100000, broker: "FTMO", phase: "Fase 1 Challenge", riskPct: "0.5", dailyLossLimitPct: "5", maxDrawdownPct: "10", maxTradesPerDay: "" },
  backtest: { name: "Backtesting", size: 10000, broker: "Backtesting", phase: "Datos históricos 2020+", riskPct: "1", dailyLossLimitPct: "", maxDrawdownPct: "", maxTradesPerDay: "" },
};
// Orden en el que se muestran las subcuentas de cada grupo (Personal / Fondeo).
export const DEFAULT_ACCOUNT_ORDER = { personal: ["personal-1"], funded: ["funded-1"] };
export const PIN_KEY = "trading-journal-pin";
// Inyecta el branding de la app (título de pestaña, favicon, meta tags y
// manifest de PWA) una sola vez al montar. Como este archivo es un componente
// suelto (sin acceso al index.html/public/ del proyecto que lo hospeda), todo
// se genera acá mismo en tiempo de ejecución:
//  - El favicon usa el SVG en data-URI de siempre (corona sobre fondo violeta).
//  - Para el ícono de "Agregar a pantalla de inicio" (apple-touch-icon y los
//    íconos del manifest) se rasteriza ESE MISMO SVG a PNG con <canvas>, porque
//    iOS no acepta SVG ahí y Android lo soporta de forma poco confiable.
//  - El manifest se arma como JSON y se sirve vía blob: URL (no se puede
//    escribir un manifest.json real sin acceso al servidor/host).
// LIMITACIÓN IMPORTANTE: esto cubre metadatos e ícono, pero la instalabilidad
// "real" (aparición automática del prompt de instalar, funcionamiento offline)
// depende también de un manifest.json servido desde la raíz del sitio y de un
// Service Worker registrado — ninguno de los dos se puede crear desde un
// componente suelto. Si se necesita una PWA 100% instalable, esos dos archivos
// deben vivir en el proyecto que hospeda este componente (fuera de este archivo).
export const APP_ICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <rect width='64' height='64' rx='14' fill='#7c3aed'/>
      <path d='M16 24 L24 34 L32 20 L40 34 L48 24 L46 42 L18 42 Z' fill='#fff'/>
    </svg>`;