// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, memo, lazy, Suspense, Component } from "react";
import jsPDF from "jspdf";
import { Crown, LayoutDashboard, CalendarDays, ListChecks, LineChart as LineChartIcon, BarChart3, Image as ImageIcon, Plus, History, Sun, Moon, Lock, MoreVertical, Save, RotateCcw, KeyRound, Pencil, Trash2, FileText, Check, X, GitCompare, Brain, Globe, ArrowLeftRight, ArrowUpDown, Target, Ruler, DollarSign, Percent, Wallet, TrendingUp, TrendingDown, AlertTriangle, AlertOctagon, Bell, ArrowUpRight, SlidersHorizontal, Type, Hash, Tag, ChevronLeft, ChevronRight, Home, UtensilsCrossed, Car, HeartPulse, Gamepad2, Repeat, MoreHorizontal, Briefcase, Laptop, Gift, Zap } from "lucide-react";
import { T, IS_DARK, applyTheme, FS, RADIUS, UI_FONT, GoogleFontImport, numMonoStyle, S, EASE, Z } from "./theme";
import { useFocusTrap } from "./hooks/useFocusTrap";
import { useAnimatedNumber } from "./hooks/useAnimatedNumber";
import { useFinanceState } from "./hooks/useFinanceState";
import { INSTRUMENTS, INST_COLOR, DEFAULT_INSTRUMENT_SPECS, MONTHS_SHORT, MONTHS_FULL, YEARS, BACKTEST_YEARS, ACCOUNT_META, TAB_KEY_ORDER, DEFAULT_REASONS, EMOTIONS, EMPTY_FORM, DEMO_TRADES, DEFAULT_ERRORS, NEG_EMOTIONS, DEFAULT_ROUTINE_ITEMS, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_ORDER } from "./constants";
import { instLabel, instEmoji, groupOf, resolveDateRange, getDaysInMonth, getFirstDay, money, pctFmt, accountAccent, toISODate, startOfWeekDate, getTradeSetups, svgToPngDataUrl, downloadTextFile, exportTradesToCSV, migrateAccountsData, hasSeenOnboarding, markOnboardingSeen } from "./utils";
import { WinRateDonut, ProfitabilityChart, MonthlyTrendChart, PnLChart, InteractiveCurveChart, CategoryBreakdownDonut } from "./charts";
import { SplashScreen } from "./components/auth/SplashScreen";
import { ConfirmDialog } from "./components/common/ConfirmDialog";
import { EmptyState } from "./components/common/EmptyState";
import { InstTag } from "./components/common/InstTag";
import { TabSkeleton } from "./components/common/Skeletons";
import { Tooltip } from "./components/common/Tooltip";
import { UndoToast } from "./components/common/UndoToast";
import { AccountBalanceCard } from "./components/dashboard/AccountBalanceCard";
import { AccountsOverviewRow } from "./components/dashboard/AccountsOverviewRow";
import { EquityHeroCard } from "./components/dashboard/EquityHeroCard";
import { HistoricalAnalysisPanel } from "./components/dashboard/HistoricalAnalysisPanel";
import { MonthlyGoalsPanel } from "./components/dashboard/MonthlyGoalsPanel";
import { RiskAlertBanner } from "./components/dashboard/RiskAlertBanner";
import { StreakMedalCard } from "./components/dashboard/StreakMedalCard";
import { TradesSummaryCards } from "./components/dashboard/TradesSummaryCards";
import { DateRangeFilter } from "./components/filters/DateRangeFilter";
import { InstrumentFilter } from "./components/filters/InstrumentFilter";
const GalleryView = lazy(() => import("./components/gallery/GalleryView").then(m => ({ default: m.GalleryView })));
import { CommandPalette } from "./components/modals/CommandPalette";
import { DayTradesModal } from "./components/modals/DayTradesModal";
import { NewAccountOnboardingModal } from "./components/modals/NewAccountOnboardingModal";
import { OnboardingTourModal } from "./components/modals/OnboardingTourModal";
import { RemindersModal } from "./components/modals/RemindersModal";
import { ShortcutsHelpModal } from "./components/modals/ShortcutsHelpModal";
import { SyncConflictModal } from "./components/modals/SyncConflictModal";
import { TradeDetailModal } from "./components/modals/TradeDetailModal";
const MindsetView = lazy(() => import("./components/routine/MindsetView").then(m => ({ default: m.MindsetView })));
const AccountComparisonView = lazy(() => import("./components/statistics/AccountComparisonView").then(m => ({ default: m.AccountComparisonView })));
const StatisticsView = lazy(() => import("./components/statistics/StatisticsView").then(m => ({ default: m.StatisticsView })));
import { TradeForm } from "./components/trades/TradeForm";
import { QuickTradeForm } from "./components/trades/QuickTradeForm";
import { EmotionCorrelationPanel } from "./components/trades/EmotionCorrelationPanel";
import { useReminders } from "./hooks/useReminders";
import { useThemeColorMeta } from "./hooks/useThemeColorMeta";
import { useUndoToast } from "./hooks/useUndoToast";
import { useUIModals } from "./hooks/useUIModals";
import { useNavigationView } from "./hooks/useNavigationView";
import { useTradeFilters } from "./hooks/useTradeFilters";
import { useConfigurableLists } from "./hooks/useConfigurableLists";
import { usePersistenceStatus } from "./hooks/usePersistenceStatus";
import { useTradeEditSession } from "./hooks/useTradeEditSession";
import { idbGetImage, isImageRef, migrateEmbeddedImages } from "./lib/imageStore";
import { WEEKDAY_HEADER_LABELS } from "./styles/sharedStyles";
import { useCloudSync, newId } from "./cloud/cloudSync";

// FS_HERO y FS_SECTION se promovieron a theme.jsx como FS.hero y FS.title
// (junto con FS.subtitle, que cubre los dos "19" y el "17" que había acá).
// Las constantes locales de sombra también se sacaron: T.shadow ya cubre
// ese caso y, a diferencia de un rgba(0,0,0,...) fijo, sí cambia con el
// tema (en oscuro una sombra negra plana casi no se ve contra un fondo
// ya oscuro).
// Z (escala de z-index) usada en distintos puntos de esta pantalla. Antes eran 8 números sueltos (2, 25, 40,
// 50, 100, 9999) sin relación explícita entre sí — funcionaba porque nadie
// agregó una capa nueva todavía, pero es el tipo de cosa que se rompe en
// silencio el día que alguien mete un tooltip o un toast sin saber en qué
// nivel va. Nombrados acá, de más bajo a más alto en el stacking real de
// la app: header de tabla sticky < contenido interno del riel lateral <
// riel lateral / overlay de menú < dropdown del menú < modales < textura
// de grano (decorativa, siempre arriba de todo, pointer-events:none).
// Z (escala de z-index) ahora vive en theme.jsx, importada abajo junto al resto de los tokens.

// Focus trap compartido: se movió a ./hooks/useFocusTrap.js para que
// ConfirmDialog (y cualquier otro modal futuro) use exactamente la misma
// implementación en vez de reinventarla — antes había dos versiones
// levemente distintas (esta acá, y otra inline dentro de ConfirmDialog).

// Hook de tween para las cifras grandes del dashboard (P&L, Win Rate, R:R):
// cuando cambian de cuenta o de mes, antes saltaban de golpe al nuevo valor.
// Ahora interpolan desde el valor anterior con easeOutCubic (~450ms), igual
// que el resto de las transiciones "spring" de la app. Respeta
// prefers-reduced-motion (salta directo al valor final sin animar). El
// valor "actual" se guarda en un ref (no solo el target) para que si el
// número vuelve a cambiar a mitad de la animación (cuenta/mes clickeado
// rápido), el próximo tween arranque desde donde el ojo lo dejó, no desde
// el valor final de la animación interrumpida.
// Versión del "esquema" del payload que se guarda/respalda (trades, cuentas,
// listas de setup/error, etc.). No existía un número explícito acá: cada
// migración nueva se resolvía a mano con "if (saved.campoNuevo)" en el efecto
// de carga, lo cual funciona pero se vuelve difícil de razonar con los años.
// Subir este número cuando el payload cambie de forma no trivial (no hace
// falta por agregar un campo opcional más) da un punto de referencia único
// para migraciones futuras y para el aviso de "respaldo más nuevo que la app"
// de abajo.
const CURRENT_SCHEMA_VERSION = 1;

// Estilo compartido para los <input>/<select> de los formularios que viven
// directamente en este archivo (el modal de gasto/ingreso, por ahora). Antes
// era el mismo objeto de 7 propiedades repetido a mano en cada campo — con
// el riesgo de que alguien tocara uno y se desalineara del resto sin darse
// cuenta. `extra` permite overrides puntuales (ej. numMonoStyle en el campo
// "Valor") sin duplicar el resto.
// Estilo compartido de los botones toggle del panel financiero (Mes/Semana
// y USD/CLP): antes cada grupo tenía su propio objeto de estilo escrito a
// mano, en teoría iguales pero sin garantía de mantenerse así si alguien
// tocaba uno y no el otro. `active` es lo único que cambia entre botones.
function finToggleBtnStyle(active) {
  return {
    padding: "2px 7px", borderRadius: RADIUS.sm, border: "none", cursor: "pointer",
    fontSize: 10, lineHeight: "16px", fontWeight: 700,
    background: active ? T.surface : "transparent",
    color: active ? T.brand : T.textMuted,
    boxShadow: active ? T.shadow : "none",
  };
}

function fieldStyle(extra) {
  return {
    width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: RADIUS.sm,
    border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.base,
    ...extra,
  };
}

// Error boundary de la app. Es clase porque React solo soporta
// componentDidCatch/getDerivedStateFromError en clases, no hay equivalente
// en hooks. Sin esto, cualquier excepción en render (un trade con un campo
// corrupto, una división por cero en una métrica, etc.) tira toda la app a
// blanco sin aviso. El fallback usa los mismos tokens de T que el resto de
// la app para no romper la ilusión de "algo se rompió pero seguimos en la
// misma app" — nada de estilos default del navegador. "Reintentar" primero
// resetea el estado local (por si el error fue puntual a lo que se estaba
// renderizando); si vuelve a fallar, "Recargar" fuerza un reload completo.
class JournalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("TradingJournal crashed:", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 14, background: T.bg, color: T.text,
          fontFamily: UI_FONT, padding: 24, textAlign: "center",
        }}>
          <AlertTriangle size={32} color={T.loss} />
          <div style={{ fontSize: FS.lg, fontWeight: 800 }}>Algo se rompió</div>
          <div style={{ fontSize: FS.sm, color: T.textFaint, maxWidth: 380 }}>
            La app encontró un error inesperado. Tus datos guardados no se pierden
            (viven en este dispositivo), pero esta pantalla necesita reiniciarse.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => this.setState({ error: null })}
              style={{ padding: "8px 16px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontSize: FS.sm, fontWeight: 700, cursor: "pointer" }}>
              Reintentar
            </button>
            <button onClick={() => window.location.reload()}
              style={{ padding: "8px 16px", borderRadius: RADIUS.sm, border: "none", background: T.brand, color: "#fff", fontSize: FS.sm, fontWeight: 700, cursor: "pointer" }}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// Estilos de la tabla de Finanzas Personales (Gastos/Ingresos). Viven a nivel de
// módulo porque no dependen de ningún estado del componente — declararlos adentro
// del render solo crea objetos nuevos sin necesidad.
const finTableStyle = { width: "100%", borderCollapse: "collapse" };
const finThStyle = { textAlign: "left", padding: "9px 14px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.surface, zIndex: 1 };
const finTdStyle = { padding: "10px 14px", fontSize: FS.sm, color: T.text, borderBottom: `1px solid ${T.border}` };
// Ícono por categoría: ayuda a escanear la tabla de un vistazo en vez de
// leer cada pill de texto una por una. Las categorías son fijas
// (GASTO_CATS / INGRESO_CATS en el componente principal), así que el mapa
// puede vivir a nivel de módulo. "Otros" comparte ícono entre gasto e
// ingreso porque no tiene un símbolo propio más específico.
const FIN_CAT_ICONS = {
  Vivienda: Home, Comida: UtensilsCrossed, Transporte: Car, Salud: HeartPulse,
  Ocio: Gamepad2, Suscripciones: Repeat,
  Salario: Briefcase, Freelance: Laptop, Inversiones: TrendingUp, Regalo: Gift,
  Otros: MoreHorizontal,
};

// Tabla de Gastos/Ingresos de la pestaña Finanzas. Antes esta función se
// redeclaraba adentro del render (dentro de un IIFE ejecutado en cada
// renderizado de TradingJournalInnerImpl), lo que le daba una identidad nueva
// a cada pasada: React la trataba como un componente distinto y desmontaba/
// remontaba toda la tabla en cada render (se perdían los filtros abiertos,
// el foco, cualquier transición en curso). Ahora vive a nivel de módulo con
// identidad estable, y recibe por props todo lo que antes tomaba por clausura.
function FinTable({ type, records, cats, finFilterCat, setFinFilterCat, finFiltersOpen, setFinFiltersOpen, openFinForm, deleteFinRecord, mesDeFecha, finMoneyFmt, onManageCategories }) {
  const isGasto = type === "gasto";
  const color = isGasto ? T.loss : T.gain;
  const label = isGasto ? "Gasto" : "Ingreso";
  // Fila bajo el mouse (o con foco por teclado): controla la visibilidad de
  // los íconos de editar/borrar de esa fila. No es un patrón CSS :hover
  // porque los estilos acá son inline; con el foco incluido además de mouse,
  // los botones siguen siendo alcanzables navegando con Tab, no solo con el
  // mouse.
  const [hoverRow, setHoverRow] = useState(null);
  const filtered = finFilterCat[type] === "Todas" ? records : records.filter(r => r.categoria === finFilterCat[type]);
  const sorted = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha));
  // Total de lo que se está viendo (respeta el filtro de categoría activo).
  // Se suma por moneda por separado en vez de todo junto: mezclar USD y CLP
  // sin una tasa de cambio real daría un total sin sentido, mismo criterio
  // que ya usa el toggle de moneda de las gráficas de arriba.
  const totalsByCurrency = sorted.reduce((acc, r) => {
    const cur = r.moneda || "USD";
    acc[cur] = (acc[cur] || 0) + Number(r.valor || 0);
    return acc;
  }, {});
  const totalCurrencies = Object.keys(totalsByCurrency);
  // Antes cada tabla llevaba una columna lateral fija de 170px con el título
  // repetido ("Gastos" / "Ingresos") y el subtítulo "Filtrados por este mes"
  // (que además era engañoso: acá solo se filtra por categoría, no por mes).
  // El header interno de la tabla ya muestra el mismo título con ícono, así
  // que la columna lateral solo duplicaba texto y le robaba ancho a la tabla.
  // Ahora la tarjeta ocupa toda su celda en el grid de 2 columnas que arma
  // el caller, sin sidebar ni minWidth que fuerce el apilado vertical.
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.base, fontWeight: 700, color: T.text }}>
          <ArrowUpRight size={15} color={color} /> {isGasto ? "Gastos" : "Ingresos"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.textFaint }}>
          <button onClick={() => onManageCategories(type)}
            title="Gestionar categorías" aria-label={`Gestionar categorías de ${label.toLowerCase()}`}
            style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer", color: "inherit" }}>
            <Tag size={14} />
          </button>
          <button onClick={() => setFinFiltersOpen(f => ({ ...f, [type]: !f[type] }))}
            aria-label={`${finFiltersOpen[type] ? "Cerrar" : "Abrir"} filtros de ${label.toLowerCase()}`}
            aria-expanded={!!finFiltersOpen[type]}
            style={{ background: "none", border: "none", padding: 0, display: "flex", cursor: "pointer", color: "inherit" }}>
            <SlidersHorizontal size={14} />
          </button>
          <button onClick={() => openFinForm(type)} title={`Nuevo ${label}`} style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${T.border}`, background: T.surfaceAlt, color, borderRadius: RADIUS.sm, padding: "4px 9px", fontSize: FS.xs, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={12} /> Nuevo {label}
          </button>
        </div>
      </div>
      {/* Scroll interno en vez de tablas que crecen sin límite o paginación con
          controles extra: con la tarjeta angosta (grid de 2 columnas) agregar
          botones de "página siguiente" hubiera sido más ruido visual. El
          header y el total quedan "pegados" arriba/abajo mientras se
          scrollea el cuerpo, así siempre están a la vista. */}
      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 340 }}>
        <table style={finTableStyle}>
          <thead>
            <tr>
              <th style={finThStyle}><CalendarDays size={11} style={{ marginRight: 4, verticalAlign: -2 }} />Fecha</th>
              <th style={finThStyle}><Tag size={11} style={{ marginRight: 4, verticalAlign: -2 }} />Categoría</th>
              <th style={finThStyle}><Type size={11} style={{ marginRight: 4, verticalAlign: -2 }} />{label}</th>
              <th style={finThStyle}><Hash size={11} style={{ marginRight: 4, verticalAlign: -2 }} />Valor</th>
              <th style={{ ...finThStyle, width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={5} style={{ ...finTdStyle, textAlign: "center", color: T.textFaint, padding: "22px 14px" }}>Sin {isGasto ? "gastos" : "ingresos"} registrados todavía.</td></tr>
            ) : sorted.map((r, i) => {
              const rowActive = hoverRow === r.id;
              return (
              <tr key={r.id}
                onMouseEnter={() => setHoverRow(r.id)} onMouseLeave={() => setHoverRow(h => h === r.id ? null : h)}
                onFocus={() => setHoverRow(r.id)} onBlur={() => setHoverRow(h => h === r.id ? null : h)}>
                <td style={{ ...finTdStyle, ...numMonoStyle }}>{r.fecha}</td>
                <td style={finTdStyle}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: RADIUS.pill, fontSize: FS.xs, fontWeight: 700, background: `${color}18`, color }}>
                    {(() => { const CatIcon = FIN_CAT_ICONS[r.categoria]; return CatIcon ? <CatIcon size={11} /> : null; })()}
                    {r.categoria}
                  </span>
                </td>
                <td style={finTdStyle}>{r.nombre}</td>
                <td style={{ ...finTdStyle, ...numMonoStyle, fontWeight: 700, color }}>
                  {finMoneyFmt(r.valor, r.moneda || "USD")}
                  <span style={{ marginLeft: 6, fontSize: FS.xs, fontWeight: 700, color: T.textFaint }}>{r.moneda || "USD"}</span>
                </td>
                <td style={{ ...finTdStyle, whiteSpace: "nowrap" }}>
                  <button onClick={() => openFinForm(type, r)} title="Editar" aria-label={`Editar ${r.nombre}`}
                    style={{ border: "none", background: "transparent", color: T.textMuted, cursor: "pointer", marginRight: 6, opacity: rowActive ? 1 : 0, transition: "opacity 120ms ease" }}><Pencil size={13} /></button>
                  <button onClick={() => deleteFinRecord(type, r.id)} title="Borrar" aria-label={`Borrar ${r.nombre}`}
                    style={{ border: "none", background: "transparent", color: T.textMuted, cursor: "pointer", opacity: rowActive ? 1 : 0, transition: "opacity 120ms ease" }}><Trash2 size={13} /></button>
                </td>
              </tr>
              );
            })}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr style={{ background: T.surfaceAlt }}>
                <td style={{ ...finTdStyle, fontWeight: 800, borderBottom: "none", borderTop: `1px solid ${T.border}`, position: "sticky", bottom: 0, background: T.surfaceAlt }}>Total</td>
                <td style={{ ...finTdStyle, borderBottom: "none", borderTop: `1px solid ${T.border}`, position: "sticky", bottom: 0, background: T.surfaceAlt }} />
                <td style={{ ...finTdStyle, borderBottom: "none", borderTop: `1px solid ${T.border}`, position: "sticky", bottom: 0, background: T.surfaceAlt }} />
                <td style={{ ...finTdStyle, borderBottom: "none", borderTop: `1px solid ${T.border}`, position: "sticky", bottom: 0, background: T.surfaceAlt, ...numMonoStyle, fontWeight: 800, color }}>
                  {totalCurrencies.map(cur => (
                    <div key={cur}>
                      {finMoneyFmt(totalsByCurrency[cur], cur)}
                      <span style={{ marginLeft: 6, fontSize: FS.xs, fontWeight: 700, color: T.textFaint }}>{cur}</span>
                    </div>
                  ))}
                </td>
                <td style={{ ...finTdStyle, borderBottom: "none", borderTop: `1px solid ${T.border}`, position: "sticky", bottom: 0, background: T.surfaceAlt }} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {finFiltersOpen[type] && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <span style={{ fontSize: FS.sm, color: T.textMuted }}>Categoría:</span>
          <select value={finFilterCat[type]} onChange={e => setFinFilterCat(f => ({ ...f, [type]: e.target.value }))}
            style={{ padding: "4px 8px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: FS.sm }}>
            <option>Todas</option>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// Barra de progreso chica y reutilizable (meta de ahorro, presupuesto por
// categoría, límite mensual). `pct` puede pasar de 100 (ej. meta de ahorro
// superada) — se recorta visualmente el relleno a 100% pero el texto que la
// acompaña sigue mostrando el valor real sin recortar.
function ProgressBar({ pct, color, trackColor }) {
  const clamped = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div style={{ width: "100%", height: 6, borderRadius: RADIUS.pill, background: trackColor || T.surfaceAlt, overflow: "hidden" }}>
      <div style={{ width: `${clamped}%`, height: "100%", borderRadius: RADIUS.pill, background: color, transition: "width 300ms ease" }} />
    </div>
  );
}

// Skeleton de la pestaña Finanzas: se muestra durante la transición breve de
// pestaña (mismo mecanismo de 180ms que TabSkeleton usa para el resto de la
// app — ver tabTransitioning) pero con una silueta que calca la forma real
// del panel financiero (título, botones, tarjetas de meta/presupuesto,
// gráficas y las dos tablas) en vez de un placeholder genérico. Usa la misma
// clase "hz-shimmer" que ya usan otros elementos animados de la app, para no
// introducir una animación nueva/inconsistente.
function FinanceSkeleton() {
  const bar = (w, h = 14, extra = {}) => (
    <div className="hz-shimmer" style={{ width: w, height: h, borderRadius: RADIUS.sm, background: T.surfaceAlt, ...extra }} />
  );
  const card = (h, children) => (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: 16, height: h, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
      {children}
    </div>
  );
  return (
    <div aria-hidden="true">
      {bar(200, 24, { marginBottom: 16 })}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        {bar(140, 36)}{bar(140, 36)}{bar(120, 36)}{bar(160, 36)}
      </div>
      {bar("100%", 54, { marginBottom: 26 })}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 26 }}>
        {card(150, <>{bar(160)}{bar("70%")}{bar("40%")}</>)}
        {card(150, <>{bar(160)}{bar("70%")}{bar("40%")}</>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {card(220, <>{bar(120)}{bar("100%")}{bar("100%")}{bar("100%")}{bar("100%")}</>)}
        {card(220, <>{bar(120)}{bar("100%")}{bar("100%")}{bar("100%")}{bar("100%")}</>)}
      </div>
    </div>
  );
}

const TradingJournalInnerImpl = memo(function TradingJournalInnerImpl({ onLockNow, onChangePin }) {
  const [account, setAccount] = useState("personal-1");
  const [trades, setTrades] = useState(DEMO_TRADES);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [accountOrder, setAccountOrder] = useState(DEFAULT_ACCOUNT_ORDER);
  // Navegación / vista (tab activo, año-mes visualizado, agrupación,
  // paginación) — extraído a un hook aparte, ver hooks/useNavigationView.js.
  const {
    tab, setTab,
    tabTransitioning,
    viewYear, setViewYear,
    viewMonth, setViewMonth,
    collapsedGroups, setCollapsedGroups,
    tradesPage, setTradesPage,
    groupBy, setGroupBy,
  } = useNavigationView(account);
  // "Hoy" real (no confundir con viewYear/viewMonth, que es el mes que se
  // está MIRANDO) — usado para el botón "Hoy" y para resaltar el día actual
  // en la grilla del calendario.
  const today = new Date();
  // Sesión de edición de trade (form, showForm, editId, detailTrade,
  // dayModalDate) — extraída a un hook aparte, ver hooks/useTradeEditSession.js.
  const {
    form, setForm,
    showForm, setShowForm,
    editId, setEditId,
    detailTrade, setDetailTrade,
    dayModalDate, setDayModalDate,
  } = useTradeEditSession();
  // Carga rápida vs. completa: por defecto Rápido para trades NUEVOS (menos
  // fricción justo después de cerrar la operación); al editar uno existente
  // siempre se ve el form completo, sin importar este toggle — no tendría
  // sentido "editar en modo rápido" y esconder campos que ya tienen datos.
  const [quickEntryMode, setQuickEntryMode] = useState(true);
  const showQuickForm = quickEntryMode && !editId;
  // Confirmación de borrado + deshacer: confirmDialog describe la acción pendiente
  // de confirmar (trade o cuenta); el toast de deshacer se comparte para ambas.
  const { toast: undoToast, pushUndo, pushSuccess, undo: undoLastAction, dismiss: dismissUndo } = useUndoToast();
  const { reminders, setReminders, permission: reminderPermission, requestPermission: requestReminderPermission } = useReminders(trades);
  useEffect(() => {
    function onFallback(e) { pushSuccess(e.detail.message); }
    window.addEventListener("tj-reminder-fallback", onFallback);
    return () => window.removeEventListener("tj-reminder-fallback", onFallback);
  }, [pushSuccess]);
  // Modales/paneles simples (menú, cuenta nueva, ayuda de atajos,
  // recordatorios, onboarding, paleta de comandos, confirmación de borrado)
  // — extraídos a un hook aparte, ver hooks/useUIModals.js.
  const {
    menuOpen, setMenuOpen,
    newAccountModal, setNewAccountModal,
    shortcutsHelpOpen, setShortcutsHelpOpen,
    remindersOpen, setRemindersOpen,
    onboardingOpen, setOnboardingOpen,
    commandPaletteOpen, setCommandPaletteOpen,
    confirmDialog, setConfirmDialog,
  } = useUIModals();
  // Refs de los dos modales que viven directamente en este archivo (el de
  // gasto/ingreso y el de nuevo/editar trade) para el focus trap de teclado.
  const finFormModalRef = useRef(null);
  const recFormModalRef = useRef(null);
  const tradeFormModalRef = useRef(null);
  // Notas de mercado diarias, independientes de los trades: plan pre-mercado vs.
  // resultado real observado. Clave por fecha ("YYYY-MM-DD"), no por cuenta —
  // el mercado es el mismo sin importar qué cuenta estés operando.
  const [marketNotes, setMarketNotes] = useState({});
  // Datos de la pestaña Mindset: entradas del diario de reflexiones, ítems de la
  // rutina pre/post sesión (editable) y el estado tildado de esa rutina por día.
  const [mindsetEntries, setMindsetEntries] = useState([]);
  const [mindsetChecklistItems, setMindsetChecklistItems] = useState(DEFAULT_ROUTINE_ITEMS);
  const [routineChecklist, setRoutineChecklist] = useState({});
  // Rutina diaria de "Trading Routine" (manifestación, café, análisis, lunch,
  // lectura, backtest) — clave por fecha ISO, guarda qué actividades se completaron
  // ese día. Se acumula con el tiempo para poder ver una mini-gráfica de hábitos.
  const [tradingRoutine, setTradingRoutine] = useState({});

  // El estado y la lógica de Finanzas Personales (gastos, ingresos,
  // categorías, recurrentes, presupuestos — 18 useState en total) se
  // extrajeron a hooks/useFinanceState.js; ver el "const fin = ..." más abajo,
  // justo después de que `cloud` queda disponible.
  useFocusTrap(showForm, tradeFormModalRef);
  // Lección del día: notas libres del día (planes, reflexiones random) etiquetadas
  // como "trading" o "personal", listadas agrupadas por mes en la pestaña Mindset.
  const [dailyLessons, setDailyLessons] = useState([]);
  // Metas mensuales de P&L por cuenta: { [account]: { "YYYY-MM": monto } }.
  const [monthlyGoals, setMonthlyGoals] = useState({});
  // Estado de persistencia/guardado (loaded, saveStatus, saveError,
  // lastBackupAt, updateStatus, etc.) — extraído a un hook aparte, ver
  // hooks/usePersistenceStatus.js. Los useEffect que usan estos valores se
  // quedan acá abajo tal cual estaban, sin tocar su lógica.
  const {
    loaded, setLoaded,
    saveStatus, setSaveStatus,
    saveError, setSaveError,
    saveErrorDismissed, setSaveErrorDismissed,
    lastBackupAt, setLastBackupAt,
    backupBannerDismissed, setBackupBannerDismissed,
    updateStatus, setUpdateStatus,
  } = usePersistenceStatus();
  useEffect(() => {
    if (!window.api?.onUpdateStatus) return;
    const unsubscribe = window.api.onUpdateStatus(setUpdateStatus);
    return unsubscribe;
  }, []);
  // Listas configurables por el usuario (razones, setups, errores, specs de
  // instrumentos) — extraídas a un hook aparte, ver hooks/useConfigurableLists.js.
  const {
    reasonsList, setReasonsList,
    setupsList, setSetupsList,
    errorsList, setErrorsList,
    instrumentSpecs, setInstrumentSpecs,
  } = useConfigurableLists();
  // Filtros de Trades (búsqueda, instrumentos visibles, setup, rango de
  // fechas del gráfico) y modo Backtesting — extraídos a un hook aparte, ver
  // hooks/useTradeFilters.js.
  const {
    tradeSearch, setTradeSearch,
    filterInst, setFilterInst,
    filterSetup, setFilterSetup,
    chartDateRange, setChartDateRange,
    backtestMode, setBacktestMode,
  } = useTradeFilters();
  const TRADES_PAGE_SIZE = 15;
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem("trading-journal-theme") || "light"; } catch { return "light"; }
  });
  // ── Por qué se llama a applyTheme ACÁ, sincrónicamente en el cuerpo del
  // render (y no solo en el useLayoutEffect de abajo) ──────────────────────
  // Bug real encontrado: si applyTheme() SOLO corre en un efecto (incluso
  // useLayoutEffect, que corre después del commit pero antes de pintar), el
  // render que produce el DOM commit de ESTE cambio de tema todavía lee los
  // valores VIEJOS de T (todo componente que usa `style={{ background: T.x }}`
  // etc.) — el efecto recién actualiza T un instante después, sin disparar un
  // segundo render. Resultado: la pantalla queda siempre "un render atrás":
  // un click mostraba una mezcla de colores viejos/nuevos, un segundo click
  // mostraba el color del click ANTERIOR (no el actual), y solo al cambiar de
  // pestaña (que fuerza otro render) se terminaba de ver el valor real.
  // Mutar T sincrónicamente ACÁ, antes de que el JSX de este mismo render lo
  // lea, elimina ese desfase por completo. Es seguro porque applyTheme() solo
  // reescribe un objeto JS plano (Object.assign) — no llama a setState ni
  // dispara renders adicionales, así que no rompe las reglas de pureza de React.
  applyTheme(themeMode);
  // El useLayoutEffect se mantiene además, por si algo externo (fuera de este
  // componente) llegara a mutar `themeMode` sin pasar por un render de acá.
  useLayoutEffect(() => applyTheme(themeMode), [themeMode]);
  useThemeColorMeta(themeMode);
  const cloud = useCloudSync();

  // Estado y lógica de Finanzas Personales — extraído a hooks/useFinanceState.js
  // (18 useState que antes vivían acá mezclados con el resto). Se destructura
  // con los MISMOS nombres que tenían las variables originales, así que el
  // resto del archivo (payload de backup, JSX del tab Finanzas, etc.) sigue
  // funcionando sin cambios.
  const fin = useFinanceState({ cloud, loaded });
  const {
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
  } = fin;
  const GASTO_CATS = gastoCatsList;
  const INGRESO_CATS = ingresoCatsList;
  const MONEDAS = ["USD", "CLP"];
  useFocusTrap(!!finForm, finFormModalRef);
  useFocusTrap(!!recForm, recFormModalRef);

  // Al resolver un conflicto de sync (ver SyncConflictModal): si el usuario
  // eligió "usar la de la nube", el estado local tiene que pisarse con esa
  // versión — cloudSync.js no conoce setTrades/setAccounts, así que ese
  // último paso se hace acá. Si eligió "usar mi versión", solo hace falta
  // refrescar el `updatedAt` local con el que quedó tras el force-write,
  // para que el próximo guardado no vuelva a marcar un falso conflicto.
  const handleConflictResolve = useCallback(async (conflictId, choice) => {
    const outcome = await cloud.resolveConflict(conflictId, choice);
    if (!outcome) return;
    const { entity, localKey, data } = outcome;
    if (entity === "trade") {
      setTrades(prev => ({
        ...prev,
        [localKey]: (prev[localKey] || []).map(t => t.id === data.id ? { ...(choice === "mine" ? t : {}), ...data } : t),
      }));
    } else if (entity === "account") {
      setAccounts(prev => ({
        ...prev,
        [localKey]: {
          ...prev[localKey],
          name: data.nombre ?? prev[localKey]?.name,
          broker: data.broker ?? prev[localKey]?.broker,
          size: data.saldoInicial ?? prev[localKey]?.size,
          riskPct: data.riesgoPct != null ? String(data.riesgoPct) : prev[localKey]?.riskPct,
          updatedAt: data.updatedAt,
        },
      }));
    }
  }, [cloud]);

  // ── Cargar datos guardados al iniciar (archivo local vía Electron, o localStorage en navegador) ──
  useEffect(() => {
    (async () => {
      try {
        let saved = null;
        if (window.api?.loadData) {
          saved = await window.api.loadData();
        } else {
          const raw = localStorage.getItem("trading-journal-data");
          saved = raw ? JSON.parse(raw) : null;
        }
        if (saved) {
          // Si el respaldo trae un schemaVersion más nuevo que el que esta
          // build conoce, no lo bloqueamos (los campos desconocidos simplemente
          // se ignoran más abajo) pero sí lo dejamos en consola: es la señal
          // típica de "abrí en esta compu un respaldo hecho con una versión
          // más nueva de la app en otra compu".
          if (typeof saved.schemaVersion === "number" && saved.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn(`Este respaldo fue guardado con una versión más nueva de la app (schema ${saved.schemaVersion} > ${CURRENT_SCHEMA_VERSION}). Algunos datos podrían no cargarse.`);
          }
          // Se migran/combinan los datos guardados con los valores por defecto: cubre
          // tanto respaldos de antes de "backtest" como de antes de las subcuentas
          // (Personal 1/2, Fondeo 1/2, etc.) sin perder trades existentes.
          const migrated = migrateAccountsData(saved);
          // Si estos trades vienen de una versión anterior a este cambio (o de un
          // respaldo restaurado, que sí trae la imagen completa a propósito — ver
          // handleBackup), sus imágenes todavía están embebidas como base64. Se
          // migran a IndexedDB acá, una sola vez, antes de guardarlas en el estado.
          const { trades: migratedTrades } = await migrateEmbeddedImages(migrated.trades);
          setTrades(migratedTrades);
          setAccounts(migrated.accounts);
          setAccountOrder(migrated.accountOrder);
          if (saved.reasonsList) setReasonsList(saved.reasonsList);
          if (saved.setupsList) setSetupsList(saved.setupsList);
          if (saved.errorsList) setErrorsList(saved.errorsList);
          if (saved.instrumentSpecs) setInstrumentSpecs(prev => ({ ...prev, ...saved.instrumentSpecs }));
          if (saved.marketNotes) setMarketNotes(saved.marketNotes);
          if (saved.mindsetEntries) setMindsetEntries(saved.mindsetEntries);
          if (saved.mindsetChecklistItems) setMindsetChecklistItems(saved.mindsetChecklistItems);
          if (saved.routineChecklist) setRoutineChecklist(saved.routineChecklist);
          if (saved.tradingRoutine) setTradingRoutine(saved.tradingRoutine);
          if (saved.dailyLessons) setDailyLessons(saved.dailyLessons);
          if (saved.monthlyGoals) setMonthlyGoals(saved.monthlyGoals);
          if (saved.lastBackupAt) setLastBackupAt(saved.lastBackupAt);
          if (saved.gastos) setGastos(saved.gastos);
          if (saved.ingresos) setIngresos(saved.ingresos);
          if (saved.gastoCatsList) setGastoCatsList(saved.gastoCatsList);
          if (saved.ingresoCatsList) setIngresoCatsList(saved.ingresoCatsList);
          if (saved.recurrentes) setRecurrentes(saved.recurrentes);
          if (saved.finLimiteMensual != null) setFinLimiteMensual(saved.finLimiteMensual);
          if (saved.finMetaAhorro != null) setFinMetaAhorro(saved.finMetaAhorro);
          if (saved.presupuestosCat) setPresupuestosCat(saved.presupuestosCat);
        }
      } catch (err) {
        console.error("No se pudo cargar el guardado previo:", err);
      } finally {
        setLoaded(true);
        if (!hasSeenOnboarding()) setOnboardingOpen(true);
      }
    })();
  }, []);

  // ── Guardar automáticamente cada vez que cambian los datos ──
  useEffect(() => {
    if (!loaded) return; // evita sobrescribir con datos por defecto antes de cargar
    setSaveStatus("saving");
    const payload = { schemaVersion: CURRENT_SCHEMA_VERSION, trades, accounts, accountOrder, reasonsList, setupsList, errorsList, instrumentSpecs, marketNotes, mindsetEntries, mindsetChecklistItems, routineChecklist, tradingRoutine, monthlyGoals, lastBackupAt, dailyLessons, gastos, ingresos, gastoCatsList, ingresoCatsList, recurrentes, finLimiteMensual, finMetaAhorro, presupuestosCat };
    const t = setTimeout(async () => {
      try {
        if (window.api?.saveData) {
          await window.api.saveData(payload);
        } else {
          localStorage.setItem("trading-journal-data", JSON.stringify(payload));
        }
        setSaveStatus("saved");
        // Se recuperó de un fallo previo (p. ej. se borraron trades/imágenes
        // viejas y ahora entra en el espacio disponible) — limpiar el aviso.
        setSaveError(null);
      } catch (err) {
        console.error("Error al guardar:", err);
        setSaveStatus("");
        // localStorage no siempre tira "QuotaExceededError" (varía por navegador),
        // así que además del name/code se busca "quota" en el mensaje como red
        // de contención. Esto es lo que puede pasar en la práctica con años de
        // historial + capturas de pantalla: el guardado empieza a fallar en
        // silencio y, sin este aviso, el usuario no se entera hasta que reinicia
        // la app y ve datos desactualizados.
        const isQuota = err?.name === "QuotaExceededError" || err?.code === 22 || err?.code === 1014 || /quota/i.test(err?.message || "");
        setSaveError({
          type: isQuota ? "quota" : "other",
          message: isQuota
            ? "No se pudo guardar: se quedó sin espacio de almacenamiento (probablemente por el historial de imágenes acumulado)."
            : "No se pudo guardar el último cambio.",
        });
        setSaveErrorDismissed(false);
      }
    }, 400); // pequeño debounce
    return () => clearTimeout(t);
  }, [trades, accounts, accountOrder, reasonsList, setupsList, errorsList, instrumentSpecs, marketNotes, mindsetEntries, mindsetChecklistItems, routineChecklist, tradingRoutine, monthlyGoals, lastBackupAt, dailyLessons, gastos, ingresos, gastoCatsList, ingresoCatsList, recurrentes, finLimiteMensual, finMetaAhorro, presupuestosCat, loaded]);

  // â”€â”€ Si hay sesion activa, la nube pisa el estado local una vez que
  // termino la carga local (nube = fuente de verdad al loguearse). â”€â”€
  const cloudPulledRef = useRef(false);
  useEffect(() => {
    if (!loaded || !cloud.ready || cloudPulledRef.current) return;
    cloudPulledRef.current = true;
    (async () => {
      const result = await cloud.pullAll();
      if (!result) return;
      if (Object.keys(result.accounts).length) {
        setAccounts(result.accounts);
        setAccountOrder(prev => ({ ...prev, personal: result.accountOrder.personal, funded: result.accountOrder.funded }));
        setTrades(result.trades);
      }
      const f = result.finance;
      if (f.gastos.length || f.ingresos.length) {
        setGastos(f.gastos);
        setIngresos(f.ingresos);
      }
      if (f.gastoCatsList.length) setGastoCatsList(f.gastoCatsList);
      if (f.ingresoCatsList.length) setIngresoCatsList(f.ingresoCatsList);
      if (f.recurrentes.length) setRecurrentes(f.recurrentes);
      if (f.finLimiteMensual != null) setFinLimiteMensual(f.finLimiteMensual);
      if (f.finMetaAhorro != null) setFinMetaAhorro(f.finMetaAhorro);
      if (Object.keys(f.presupuestosCat).length) setPresupuestosCat(f.presupuestosCat);
    })();
  }, [loaded, cloud.ready]);

  // ── Recordatorio de respaldo cada 7 días ──
  // No es una alarma del sistema: es un aviso dentro de la propia app que aparece
  // si pasaron 7 días o más desde el último "Respaldar datos" (o desde que se usó
  // la app por primera vez, si nunca se respaldó).
  const backupReminderDue = useMemo(() => {
    if (!loaded) return false;
    const last = lastBackupAt ? new Date(lastBackupAt).getTime() : null;
    if (!last) return true; // nunca se respaldó
    return Date.now() - last >= 7 * 24 * 60 * 60 * 1000;
  }, [lastBackupAt, loaded]);

  // ── Persistir preferencia de tema ──
  useEffect(() => {
    try { localStorage.setItem("trading-journal-theme", themeMode); } catch {}
    // Avisa a Electron (main.js) del tema actual para que la overlay de la
    // barra de título en Windows (botones minimizar/maximizar/cerrar, que
    // dibuja el propio SO y no nuestro CSS) cambie de color junto con el
    // resto de la interfaz. No existe en el navegador (solo Electron).
    window.api?.setThemeMode?.(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      cloud.syncFinConfig({ finLimiteMensual, finMetaAhorro, monedaDefault: finMoneda || "USD" });
    }, 800);
    return () => clearTimeout(t);
  }, [finLimiteMensual, finMetaAhorro, loaded, cloud]);

  const currentTrades = trades[account];
  const group = groupOf(account);
  const accentColor = ACCOUNT_META[group].color;
  const accountLabel = accounts[account]?.name || ACCOUNT_META[group].label;

  // Lista plana de TODAS las cuentas (Personal 1/2..., Fondeo 1/2..., Backtesting),
  // cada una con su color distintivo — usada por el donut y las tarjetas "Accounts".
  const fullAccountList = useMemo(() => {
    const out = [];
    ["personal", "funded"].forEach(g => {
      (accountOrder[g] || []).forEach((key, idx) => {
        out.push({ key, group: g, label: accounts[key]?.name || `${ACCOUNT_META[g].label} ${idx + 1}`, color: accountAccent(g, idx) });
      });
    });
    out.push({ key: "backtest", group: "backtest", label: "Backtest", color: accountAccent("backtest", 0) });
    return out;
  }, [accountOrder, accounts]);

  // Abre el onboarding de cuenta nueva: ya no se crea al instante con valores
  // por defecto silenciosos, sino que se le pide al usuario nombrarla y
  // confirmar su capital/broker/riesgo antes de arrancar a operar con ella.
  const addSubAccount = useCallback((groupKey) => {
    setNewAccountModal({ groupKey });
  }, []);

  // Crea de verdad la subcuenta dentro de un grupo (Personal o Fondeo), con su
  // propio historial de trades vacío, y la deja seleccionada. Se llama desde
  // el modal de onboarding una vez que el usuario confirma los datos.
  // Backtesting no usa esto, siempre es una sola cuenta.
  const createSubAccount = useCallback((groupKey, details) => {
    const newKey = `${groupKey}-${Date.now()}`;
    const base = groupKey === "personal"
      ? { size: 5000, broker: "", phase: "Live Account", riskPct: "1" }
      : { size: 100000, broker: "", phase: "Fase 1 Challenge", riskPct: "0.5" };
    setAccountOrder(prev => {
      const list = prev[groupKey] || [];
      const nextNum = list.length + 1;
      const name = (details?.name || "").trim() || `${ACCOUNT_META[groupKey].label} ${nextNum}`;
      const acc = { ...base, ...details, name };
      setAccounts(a => ({ ...a, [newKey]: acc }));
      setTrades(t => ({ ...t, [newKey]: [] }));
      setAccount(newKey);
      cloud.syncAccountUpsert(newKey, acc, groupKey, list.length);
      return { ...prev, [groupKey]: [...list, newKey] };
    });
    setNewAccountModal(null);
    pushSuccess(`Cuenta "${(details?.name || "").trim() || ACCOUNT_META[groupKey].label}" creada`);
  }, [pushSuccess, cloud]);

  // Borra una subcuenta (Personal o Fondeo) junto con todos sus trades. No permite
  // dejar el grupo sin ninguna cuenta: si es la última, se rechaza. Si la cuenta
  // borrada era la seleccionada, se pasa a otra del mismo grupo automáticamente.
  const deleteSubAccount = useCallback((groupKey, key) => {
    const list = accountOrder[groupKey] || [];
    if (list.length <= 1) {
      alert(`No podés borrar la última cuenta de ${ACCOUNT_META[groupKey].label}. Creá otra antes de eliminar esta.`);
      return;
    }
    const acctName = accounts[key]?.name || key;
    const tradeCount = (trades[key] || []).length;
    setConfirmDialog({
      title: `¿Borrar la cuenta "${acctName}"?`,
      message: `Se eliminarán también sus ${tradeCount} trade${tradeCount !== 1 ? "s" : ""} registrados. Vas a poder deshacerlo justo después.`,
      confirmLabel: "Borrar cuenta",
      onConfirm: () => {
        const accountSnapshot = accounts[key];
        const tradesSnapshot = trades[key] || [];
        const orderSnapshot = list;
        const wasSelected = account === key;
        setAccountOrder(prev => ({ ...prev, [groupKey]: (prev[groupKey] || []).filter(k => k !== key) }));
        setAccounts(a => { const na = { ...a }; delete na[key]; return na; });
        setTrades(t => { const nt = { ...t }; delete nt[key]; return nt; });
        if (wasSelected) setAccount(list.find(k => k !== key));
        setConfirmDialog(null);
        tradesSnapshot.forEach(t => cloud.syncTradeDelete(t.id));
        cloud.syncAccountDelete(key);
        pushUndo(`Cuenta "${acctName}" borrada`, () => {
          setAccountOrder(prev => ({ ...prev, [groupKey]: orderSnapshot }));
          setAccounts(a => ({ ...a, [key]: accountSnapshot }));
          setTrades(t => ({ ...t, [key]: tradesSnapshot }));
          if (wasSelected) setAccount(key);
          cloud.syncAccountUpsert(key, accountSnapshot, groupKey, orderSnapshot.indexOf(key)).then(() => {
            tradesSnapshot.forEach(t => cloud.syncTradeUpsert(key, t));
          });
        });
      },
    });
  }, [accounts, trades, accountOrder, account, pushUndo, cloud]);

  const monthTrades = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return currentTrades.filter(t => t.date.startsWith(prefix));
  }, [currentTrades, viewYear, viewMonth]);

  const chartRangeResolved = useMemo(
    () => resolveDateRange(chartDateRange, { viewYear, viewMonth }),
    [chartDateRange, viewYear, viewMonth]
  );
  const chartTrades = useMemo(
    () => currentTrades.filter(t => filterInst.includes(t.instrument) && t.date >= chartRangeResolved.from && t.date <= chartRangeResolved.to),
    [currentTrades, filterInst, chartRangeResolved]
  );

  const stats = useMemo(() => {
    // Una sola copia ordenada por fecha, reutilizada tanto para el streak
    // como para el resto de los agregados — antes se armaba un [...sort()]
    // extra solo para el streak, duplicando el trabajo O(n log n) en cada
    // recálculo (y este useMemo corre por cada mes visto).
    const sorted = [...monthTrades].sort((a, b) => a.date.localeCompare(b.date));
    let wins = 0, losses = 0, pnl = 0, rrSum = 0, best = -Infinity, worst = Infinity;
    let streak = 0, maxStreak = 0;
    for (const t of sorted) {
      if (t.pnl > 0) { wins++; streak++; maxStreak = Math.max(maxStreak, streak); }
      else { losses++; streak = 0; }
      pnl += t.pnl;
      rrSum += parseFloat(t.rr || 0);
      if (t.pnl > best) best = t.pnl;
      if (t.pnl < worst) worst = t.pnl;
    }
    const count = sorted.length;
    const wr = count ? ((wins / count) * 100).toFixed(1) : "0.0";
    const avgRR = count ? (rrSum / count).toFixed(2) : "0.00";
    return { pnl, wins, losses, wr, avgRR, best: count ? best : 0, worst: count ? worst : 0, streak: maxStreak, count };
  }, [monthTrades]);

  // Mes anterior al que se está viendo, para poder mostrar deltas ("+4.2% vs
  // mes anterior") junto a las cifras clave del dashboard. Solo se calculan
  // los 3 agregados que realmente se comparan (pnl/wr/avgRR) — no hace falta
  // duplicar streak/best/worst, que no se muestran con delta.
  const prevMonthTrades = useMemo(() => {
    let py = viewYear, pm = viewMonth - 1;
    if (pm < 0) { pm = 11; py -= 1; }
    const prefix = `${py}-${String(pm + 1).padStart(2, "0")}`;
    return currentTrades.filter(t => t.date.startsWith(prefix));
  }, [currentTrades, viewYear, viewMonth]);
  const prevStats = useMemo(() => {
    let wins = 0, pnl = 0, rrSum = 0;
    for (const t of prevMonthTrades) {
      if (t.pnl > 0) wins++;
      pnl += t.pnl;
      rrSum += parseFloat(t.rr || 0);
    }
    const count = prevMonthTrades.length;
    return { pnl, wr: count ? (wins / count) * 100 : 0, avgRR: count ? rrSum / count : 0, count };
  }, [prevMonthTrades]);

  // Series para los sparklines de las tarjetas KPI: la progresión de cada
  // métrica trade a trade a lo largo del mes en vista (P&L acumulado, win
  // rate corriendo, R:R promedio corriendo). Se recorre monthTrades una
  // sola vez y ordenado por fecha, igual que ya hace `stats` arriba.
  const sparkSeries = useMemo(() => {
    const sorted = [...monthTrades].sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0, wins = 0, rrSum = 0;
    const pnl = [], wr = [], rr = [];
    sorted.forEach((t, i) => {
      cum += t.pnl;
      if (t.pnl > 0) wins++;
      rrSum += parseFloat(t.rr || 0);
      pnl.push(cum);
      wr.push((wins / (i + 1)) * 100);
      rr.push(rrSum / (i + 1));
    });
    return { pnl, wr, rr };
  }, [monthTrades]);

  // Tween de las 3 cifras grandes del dashboard: se recalculan al cambiar
  // de cuenta, de mes, o de mes anterior con el que se compara (delta).
  const animPnl = useAnimatedNumber(stats.pnl);
  const animWr = useAnimatedNumber(parseFloat(stats.wr));
  const animRR = useAnimatedNumber(parseFloat(stats.avgRR));
  // Mismo tween para la segunda fila (mejor/peor trade, racha máx., total
  // de trades del mes) — más chicas, pero cambian con la misma frecuencia.
  const animBest = useAnimatedNumber(stats.best);
  const animWorst = useAnimatedNumber(stats.worst);
  const animStreak = useAnimatedNumber(stats.streak);
  const animCount = useAnimatedNumber(stats.count);

  // Antes indexaba currentTrades (TODO el historial de la cuenta) en cada
  // cambio, aunque solo se lee para fechas del mes visible (celdas del
  // calendario y el modal de día, que solo se abre desde una celda de ese
  // mismo mes). Con años de historial acumulado esto crecía sin límite;
  // ahora se arma a partir de monthTrades, que ya está memoizado y acotado
  // al mes/año en vista.
  const byDate = useMemo(() => {
    const m = {};
    monthTrades.forEach(t => { if (!m[t.date]) m[t.date] = []; m[t.date].push(t); });
    return m;
  }, [monthTrades]);

  const monthlyGroups = useMemo(() => {
    const q = tradeSearch.trim().toLowerCase();
    const arr = currentTrades
      .filter(t => filterInst.includes(t.instrument))
      .filter(t => filterSetup === "All" || getTradeSetups(t).includes(filterSetup))
      .filter(t => t.date.startsWith(`${viewYear}-`))
      .filter(t => {
        if (!q) return true;
        const haystack = [
          t.notes || "", instLabel(t.instrument), t.instrument, t.session || "",
          ...(getTradeSetups(t) || []), ...(t.tags || []), ...(t.emotions || []), ...(t.errors || []),
        ].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    const g = {};
    arr.forEach(t => {
      // La clave de grupo es el mes (YYYY-MM) o el lunes de la semana ISO a la que pertenece el trade.
      const gk = groupBy === "week" ? toISODate(startOfWeekDate(new Date(t.date + "T00:00:00"))) : t.date.slice(0, 7);
      if (!g[gk]) g[gk] = [];
      g[gk].push(t);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [currentTrades, filterInst, filterSetup, viewYear, groupBy, tradeSearch]);

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < getFirstDay(viewYear, viewMonth); i++) arr.push(null);
    for (let d = 1; d <= getDaysInMonth(viewYear, viewMonth); d++) arr.push(d);
    return arr;
  }, [viewYear, viewMonth]);

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }

  // Convierte una referencia LOCAL de imagen (idb:... o data:...) en un Blob
  // listo para subir a R2. Si `ref` ya es solo una key remota (o no hay nada
  // local para esa imagen), devuelve null — no hay nada nuevo que subir.
  async function resolveImageBlob(ref) {
    if (!ref) return null;
    let dataUrl = null;
    if (isImageRef(ref)) dataUrl = await idbGetImage(ref);
    else if (typeof ref === "string" && ref.startsWith("data:")) dataUrl = ref;
    if (!dataUrl) return null;
    const res = await fetch(dataUrl);
    return res.blob();
  }

  const saveTrade = useCallback((overrides = {}) => {
    if (!form.date || !form.pnl) return;
    // overrides (no form directamente) es lo que decide reviewCompleted —
    // así se evita cualquier problema de timing entre un setForm() reciente
    // y este guardado en el mismo ciclo de eventos (setState es asíncrono).
    const trade = { ...form, ...overrides, pnl: parseFloat(overrides.pnl ?? form.pnl), id: editId || newId() };
    const savedAccount = account;
    const previous = editId ? (trades[savedAccount] || []).find(t => t.id === editId) : null;
    if (editId) {
      // Edición: guardamos la versión previa para poder deshacerla.
      setTrades(prev => ({ ...prev, [savedAccount]: prev[savedAccount].map(t => t.id === editId ? trade : t) }));
      if (previous) {
        pushUndo("Trade editado", () => {
          setTrades(prev => ({ ...prev, [savedAccount]: (prev[savedAccount] || []).map(t => t.id === editId ? previous : t) }));
        });
      }
    } else {
      setTrades(prev => ({ ...prev, [savedAccount]: [...prev[savedAccount], trade] }));
      pushSuccess("Trade guardado");
    }
    cloud.syncTradeUpsert(savedAccount, trade);
    // Sube a R2 las imágenes que cambiaron (no bloquea el guardado ni la UI).
    // Solo se sube de nuevo si la referencia local cambió respecto a antes —
    // así no re-sube la misma captura en cada edición del trade.
    const beforeChanged = !previous || previous.imgBefore !== trade.imgBefore;
    const afterChanged = !previous || previous.imgAfter !== trade.imgAfter;
    if ((beforeChanged && trade.imgBefore) || (afterChanged && trade.imgAfter)) {
      (async () => {
        const updates = {};
        if (beforeChanged && trade.imgBefore) {
          const blob = await resolveImageBlob(trade.imgBefore);
          if (blob) {
            const key = await cloud.syncTradeImageUpload(trade.id, "antes", blob);
            if (key) updates.imagenAntesKey = key;
          }
        }
        if (afterChanged && trade.imgAfter) {
          const blob = await resolveImageBlob(trade.imgAfter);
          if (blob) {
            const key = await cloud.syncTradeImageUpload(trade.id, "despues", blob);
            if (key) updates.imagenDespuesKey = key;
          }
        }
        if (Object.keys(updates).length) {
          setTrades(prev => ({ ...prev, [savedAccount]: (prev[savedAccount] || []).map(t => t.id === trade.id ? { ...t, ...updates } : t) }));
          cloud.syncTradeUpsert(savedAccount, { ...trade, ...updates });
        }
      })();
    }
    setForm(EMPTY_FORM); setShowForm(false); setEditId(null); setTab("calendar");
  }, [form, account, editId, trades, pushUndo, pushSuccess, cloud]);

  // Borra un trade: primero pide confirmación en un modal, y tras borrar deja
  // disponible "Deshacer" durante unos segundos para restaurarlo.
  const deleteTrade = useCallback((id) => {
    const targetAccount = account;
    const trade = (trades[targetAccount] || []).find(t => t.id === id);
    if (!trade) return;
    setConfirmDialog({
      title: "¿Borrar este trade?",
      message: `Vas a borrar el trade de ${instLabel(trade.instrument)} del ${trade.date} (${money(trade.pnl)}). Vas a poder deshacerlo justo después.`,
      confirmLabel: "Borrar trade",
      onConfirm: () => {
        setTrades(prev => ({ ...prev, [targetAccount]: prev[targetAccount].filter(t => t.id !== id) }));
        setConfirmDialog(null);
        cloud.syncTradeDelete(id);
        pushUndo("Trade borrado", () => {
          setTrades(prev => ({ ...prev, [targetAccount]: [...prev[targetAccount], trade] }));
          cloud.syncTradeUpsert(targetAccount, trade);
        });
      },
    });
  }, [account, trades, pushUndo, cloud]);
  const openEdit = useCallback((t) => { setForm({ ...EMPTY_FORM, ...t, pnl: String(t.pnl), reasons: t.reasons || {}, emotions: t.emotions || [], errors: t.errors || [], tags: t.tags || [], setups: getTradeSetups(t), imgBefore: t.imgBefore || null, imgAfter: t.imgAfter || null }); setEditId(t.id); setShowForm(true); }, []);
  const openNew = useCallback((date) => { setForm({ ...EMPTY_FORM, date: date || "", riskPct: accounts[account].riskPct || "" }); setEditId(null); setShowForm(true); setQuickEntryMode(true); }, [accounts, account]);

  const restoreInputRef = useRef();
  const chartRef = useRef(null);

  async function handleBackup() {
    const nowISO = new Date().toISOString();
    // El respaldo manual (a diferencia del autoguardado interno) SÍ incluye
    // las imágenes resueltas, para que el .json sea portable a otro
    // dispositivo o perfil de navegador sin perder las capturas — de otro
    // modo solo viajarían referencias "idb:..." que no significan nada fuera
    // de la IndexedDB de este navegador.
    const tradesWithImages = {};
    for (const [acc, list] of Object.entries(trades)) {
      tradesWithImages[acc] = await Promise.all((list || []).map(async (t) => {
        if (!isImageRef(t.imgBefore) && !isImageRef(t.imgAfter)) return t;
        const next = { ...t };
        if (isImageRef(t.imgBefore)) next.imgBefore = (await idbGetImage(t.imgBefore)) || null;
        if (isImageRef(t.imgAfter)) next.imgAfter = (await idbGetImage(t.imgAfter)) || null;
        return next;
      }));
    }
    const payload = { schemaVersion: CURRENT_SCHEMA_VERSION, trades: tradesWithImages, accounts, accountOrder, reasonsList, setupsList, errorsList, instrumentSpecs, marketNotes, mindsetEntries, mindsetChecklistItems, routineChecklist, tradingRoutine, monthlyGoals, dailyLessons, gastos, ingresos, exportedAt: nowISO };
    const stamp = nowISO.slice(0, 10);
    downloadTextFile(JSON.stringify(payload, null, 2), `trading-journal-backup-${stamp}.json`, "application/json");
    setLastBackupAt(nowISO);
    setBackupBannerDismissed(false);
    pushSuccess("Respaldo descargado");
  }

  async function handleExportChartPDF() {
    const svgEl = chartRef.current?.querySelector("svg");
    const wins = chartTrades.filter(t => t.pnl > 0);
    const losses = chartTrades.filter(t => t.pnl <= 0);
    const pnl = chartTrades.reduce((s, t) => s + t.pnl, 0);
    const wr = chartTrades.length ? ((wins.length / chartTrades.length) * 100).toFixed(1) : "0.0";
    const avgRR = chartTrades.length ? (chartTrades.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / chartTrades.length).toFixed(2) : "0.00";

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 40;
    let y = 50;

    doc.setFontSize(18); doc.setFont(undefined, "bold");
    doc.text("Reporte de Trading — P&L", marginX, y);
    y += 22;
    doc.setFontSize(11); doc.setFont(undefined, "normal");
    doc.setTextColor(90);
    doc.text(`Cuenta: ${accountLabel}   ·   Periodo: ${chartRangeResolved.from} a ${chartRangeResolved.to}`, marginX, y);
    y += 14;
    doc.text(`Generado el ${new Date().toLocaleDateString()}`, marginX, y);
    y += 26;
    doc.setDrawColor(220); doc.line(marginX, y, 555, y);
    y += 24;

    doc.setTextColor(20); doc.setFontSize(13); doc.setFont(undefined, "bold");
    doc.text("Resumen", marginX, y);
    y += 18;
    doc.setFontSize(11); doc.setFont(undefined, "normal");
    const summaryRows = [
      ["P&L total", money(pnl)],
      ["Win rate", `${wr}%`],
      ["R:R promedio", `1:${avgRR}`],
      ["Trades", `${chartTrades.length} (${wins.length}W / ${losses.length}L)`],
    ];
    summaryRows.forEach(([label, val]) => {
      doc.setTextColor(120); doc.text(label, marginX, y);
      doc.setTextColor(20); doc.text(String(val), marginX + 150, y);
      y += 16;
    });
    y += 10;

    if (svgEl) {
      try {
        const png = await svgToPngDataUrl(svgEl, 2.5);
        const imgW = 515, imgH = 165;
        doc.setFontSize(13); doc.setFont(undefined, "bold"); doc.setTextColor(20);
        doc.text("Curva de P&L acumulado", marginX, y);
        y += 10;
        doc.addImage(png, "PNG", marginX, y, imgW, imgH);
        y += imgH + 24;
      } catch (err) {
        console.error("No se pudo capturar el gráfico para el PDF:", err);
      }
    }

    doc.setFontSize(13); doc.setFont(undefined, "bold"); doc.setTextColor(20);
    doc.text("Por instrumento", marginX, y);
    y += 18;
    doc.setFontSize(11); doc.setFont(undefined, "normal");
    INSTRUMENTS.filter(inst => filterInst.includes(inst)).forEach(inst => {
      const it = chartTrades.filter(t => t.instrument === inst);
      if (!it.length) return;
      const ip = it.reduce((s, t) => s + t.pnl, 0);
      const iw = it.filter(t => t.pnl > 0).length;
      doc.setTextColor(120); doc.text(inst, marginX, y);
      doc.setTextColor(ip >= 0 ? 22 : 200, ip >= 0 ? 163 : 38, ip >= 0 ? 74 : 38);
      doc.text(money(ip), marginX + 150, y);
      doc.setTextColor(120);
      doc.text(`${it.length} trades · ${iw}W / ${it.length - iw}L`, marginX + 280, y);
      y += 16;
    });

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`reporte-pnl-${accountLabel.toLowerCase()}-${stamp}.pdf`);
    pushSuccess("Reporte PDF descargado");
  }

  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        e.target.value = "";
        if (!data.trades || !data.accounts) {
          alert("El archivo no parece ser un respaldo válido de Trading Journal.");
          return;
        }
        // Se pide confirmación con el mismo ConfirmDialog que usa el resto de
        // la app (borrar cuenta, borrar trade, etc.) en vez de window.confirm:
        // así no aparece de golpe el diálogo nativo del navegador rompiendo
        // la estética del resto de los modales. La restauración real queda en
        // applyRestoredData, disparada recién al confirmar.
        setConfirmDialog({
          title: "¿Restaurar este respaldo?",
          message: "Esto reemplazará tus trades, cuentas y razones actuales con los del archivo de respaldo.",
          confirmLabel: "Restaurar",
          onConfirm: async () => {
            setConfirmDialog(null);
            await applyRestoredData(data);
          },
        });
      } catch (err) {
        console.error(err);
        alert("No se pudo leer el archivo. Asegúrate de que sea un respaldo válido (.json) generado por esta app.");
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  async function applyRestoredData(data) {
    try {
      const migrated = migrateAccountsData(data);
      // El .json de respaldo trae las imágenes embebidas a propósito (ver
      // handleBackup) — acá se vuelven a guardar en IndexedDB y se
      // reemplazan por referencias, igual que en la carga inicial.
      const { trades: migratedTrades } = await migrateEmbeddedImages(migrated.trades);
      setTrades(migratedTrades);
      setAccounts(migrated.accounts);
      setAccountOrder(migrated.accountOrder);
      if (data.reasonsList) setReasonsList(data.reasonsList);
      if (data.setupsList) setSetupsList(data.setupsList);
      if (data.errorsList) setErrorsList(data.errorsList);
      if (data.instrumentSpecs) setInstrumentSpecs(prev => ({ ...prev, ...data.instrumentSpecs }));
      if (data.marketNotes) setMarketNotes(data.marketNotes);
      if (data.mindsetEntries) setMindsetEntries(data.mindsetEntries);
      if (data.mindsetChecklistItems) setMindsetChecklistItems(data.mindsetChecklistItems);
      if (data.routineChecklist) setRoutineChecklist(data.routineChecklist);
      if (data.tradingRoutine) setTradingRoutine(data.tradingRoutine);
      if (data.monthlyGoals) setMonthlyGoals(data.monthlyGoals);
      if (data.dailyLessons) setDailyLessons(data.dailyLessons);
      pushSuccess("Datos restaurados correctamente");
    } catch (err) {
      console.error(err);
      alert("No se pudo restaurar el respaldo. Los datos actuales no se modificaron.");
    }
  }

  // Dimensiones del riel de navegación lateral: ancho fijo (ya no se expande
  // al pasar el mouse), botones más grandes y más espaciados, e ícono un
  // punto más grande que antes (22px) manteniendo la proporción con el
  // botón que lo contiene.
  const NAV_W = 116;
  const NAV_BTN_W = 60;
  const NAV_BTN_H = 46;
  const NAV_BTN_RADIUS = 12;
  const NAV_ICON = 16;

  const TAB_ITEMS = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["calendar", CalendarDays, "Calendario"],
    ["trades", ListChecks, "Trades"],
    ["chart", LineChartIcon, "P&L"],
    ["stats", BarChart3, "Estadísticas"],
    ["compare", GitCompare, "Comparativa"],
    ["gallery", ImageIcon, "Galería"],
    ["mindset", Brain, "Mindset"],
    ["finanzas", DollarSign, "Finanzas"],
  ];
  const tabLabel = tab === "backtest" ? "Análisis Histórico" : tab === "add" ? "Nuevo trade" : (TAB_ITEMS.find(([k]) => k === tab) || [,, ""])[2];
  // Ícono de la sección activa para el header único de arriba (ver más abajo).
  // "backtest" y "add" no viven en TAB_ITEMS (son estados especiales, no
  // pestañas del riel lateral), así que se resuelven aparte igual que tabLabel.
  const CurrentTabIcon = tab === "backtest" ? History : tab === "add" ? Plus : (TAB_ITEMS.find(([k]) => k === tab) || [, LayoutDashboard])[1];
  const menuBtnStyle = { display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: RADIUS.sm, border: "none", background: "transparent", color: T.text, cursor: "pointer", fontSize: FS.base, fontWeight: 600, textAlign: "left", width: "100%" };

  // Botón del riel lateral: agrega, por encima del fondo brandSoft ya
  // existente, dos detalles "premium" cuando el ítem está activo — un rail
  // fino (3px) pegado al borde del ícono en T.brand sólido (el mismo patrón
  // que usan Linear/Stripe/Notion para marcar la sección activa con más
  // precisión que solo un cambio de fondo), y un glow suave detrás del
  // ícono usando el color de marca a baja opacidad. Ambos animan con el
  // mismo easing "spring" que ya usa la app en otras transiciones.
  // Chip de comparación contra el mes anterior ("+4.2% vs mes ant."), para
  // las cifras clave del dashboard. Solo se muestra si hay datos del mes
  // anterior contra qué comparar (hasPrev) y si hubo un cambio real —
  // evita un "+0.0%" ruidoso cuando no hay diferencia. suffix indica cómo
  // se formatea el número ("money" | "pp" | "r").
  function DeltaChip({ diff, hasPrev, suffix }) {
    if (!hasPrev || Math.abs(diff) < 0.005) return null;
    const up = diff > 0;
    const color = up ? T.gain : T.loss;
    const Icon = up ? TrendingUp : TrendingDown;
    const text = suffix === "money" ? `${up ? "+" : ""}${money(diff)}`
      : suffix === "pp" ? `${up ? "+" : ""}${diff.toFixed(1)}pp`
      : `${up ? "+" : ""}${diff.toFixed(2)}R`;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 6,
        padding: "1px 6px", borderRadius: RADIUS.pill, fontSize: FS.xs, fontWeight: 700,
        color, background: `${color}16`,
      }}>
        <Icon size={10} strokeWidth={2.5} />{text}
      </span>
    );
  }

  // Mini-gráfico de tendencia (sin ejes, sin etiquetas) para las tarjetas
  // KPI: dibuja la progresión de la métrica trade a trade dentro del mes
  // en vista. viewBox fijo con preserveAspectRatio="none" para que se
  // estire al 100% del ancho de la tarjeta sin importar su tamaño real.
  // Con menos de 2 puntos no hay tendencia que mostrar, así que no renderiza
  // nada (en vez de una línea plana sin sentido).
  function Sparkline({ data, color }) {
    if (!data || data.length < 2) return null;
    const w = 100, h = 26;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const line = data.map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`).join(" ");
    const area = `0,${h} ${line} ${w},${h}`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block", marginTop: 8 }}>
        <polygon points={area} fill={`${color}16`} stroke="none" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }

  function NavButton({ active, onClick, ariaLabel, label, children }) {
    return (
      <button onClick={onClick} aria-label={ariaLabel} className="hz-nav-btn"
        style={{
          position: "relative", width: NAV_BTN_W, height: NAV_BTN_H, borderRadius: NAV_BTN_RADIUS, border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? T.brandSoft : "transparent", color: active ? T.brand : T.textFaint,
          boxShadow: active ? `0 4px 16px ${T.brand}2e` : "none",
          transition: "background 0.22s cubic-bezier(0.34,1.3,0.64,1), color 0.15s ease, box-shadow 0.22s ease",
          flexShrink: 0,
        }}>
        <span style={{
          position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)",
          width: 3, height: active ? 18 : 0, borderRadius: 3, background: T.brand,
          opacity: active ? 1 : 0, transition: "height 0.22s cubic-bezier(0.34,1.3,0.64,1), opacity 0.15s ease",
        }} />
        {children}
        <span className="hz-tip">{label}</span>
      </button>
    );
  }

  // ── Atajos de teclado globales ──────────────────────────────────────────
  // Se ignoran mientras el foco está en un input/textarea/select o cualquier
  // elemento editable (así "n" o "1" no interrumpen mientras se escribe una
  // nota), y también mientras hay un modal bloqueante abierto (PIN ya está
  // resuelto en su propia pantalla; acá cubre confirmDialog, el formulario de
  // trade y el modal de cuenta nueva) para que Escape cierre de a uno.
  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(o => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (commandPaletteOpen) { setCommandPaletteOpen(false); return; }
        // confirmDialog: NO se maneja acá — ConfirmDialog cierra su propio
        // Escape internamente (useFocusTrap con onEscape), y como usa fase
        // capture + stopPropagation, este bloque nunca llegaría a
        // ejecutarse mientras está abierto. Se removió para no dejar
        // código muerto/engañoso.
        if (newAccountModal) { setNewAccountModal(null); return; }
        if (onboardingOpen) { markOnboardingSeen(); setOnboardingOpen(false); return; }
        if (shortcutsHelpOpen) { setShortcutsHelpOpen(false); return; }
        if (showForm) { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); return; }
        if (detailTrade) { setDetailTrade(null); return; }
        if (dayModalDate) { setDayModalDate(null); return; }
        if (finForm) { setFinForm(null); return; }
        if (menuOpen) { setMenuOpen(false); return; }
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (confirmDialog || newAccountModal || showForm || commandPaletteOpen || onboardingOpen || finForm) return; // no interferir con un modal bloqueante abierto
      if (e.key === "?") { e.preventDefault(); setShortcutsHelpOpen(o => !o); return; }
      if (e.key >= "1" && e.key <= "8") {
        const idx = Number(e.key) - 1;
        if (TAB_KEY_ORDER[idx]) { setTab(TAB_KEY_ORDER[idx]); setBacktestMode(false); }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "n") { setTab("add"); openNew(""); return; }
      if (k === "b") { setBacktestMode(bm => !bm); setTab(backtestMode ? "dashboard" : "backtest"); return; }
      if (k === "t") { setThemeMode(m => m === "dark" ? "light" : "dark"); return; }
      if (k === "l") { onLockNow(); return; }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDialog, newAccountModal, shortcutsHelpOpen, onboardingOpen, commandPaletteOpen, showForm, detailTrade, dayModalDate, finForm, menuOpen, backtestMode, openNew, onLockNow]);

  // Comandos disponibles en la paleta (Cmd/Ctrl+K): navegación por sección,
  // salto directo a cualquier cuenta, y las acciones globales más usadas.
  const paletteCommands = useMemo(() => {
    const cmds = [];
    TAB_ITEMS.forEach(([key, Icon, label]) => {
      cmds.push({ id: `tab-${key}`, group: "Ir a sección", label, icon: Icon, onRun: () => { setTab(key); setBacktestMode(false); } });
    });
    fullAccountList.forEach(a => {
      cmds.push({ id: `acc-${a.key}`, group: "Cambiar de cuenta", label: a.label, sublabel: ACCOUNT_META[a.group]?.label, icon: Wallet, onRun: () => { setAccount(a.key); if (a.group === "backtest") setBacktestMode(true); else setBacktestMode(false); } });
    });
    cmds.push({ id: "new-trade", group: "Acciones", label: "Registrar nuevo trade", icon: Plus, sublabel: "N", onRun: () => { setTab("add"); openNew(""); } });
    cmds.push({ id: "toggle-theme", group: "Acciones", label: themeMode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro", icon: themeMode === "dark" ? Sun : Moon, sublabel: "T", onRun: () => setThemeMode(m => m === "dark" ? "light" : "dark") });
    cmds.push({ id: "toggle-backtest", group: "Acciones", label: backtestMode ? "Salir de Backtesting" : "Entrar a Backtesting", icon: History, sublabel: "B", onRun: () => { setBacktestMode(b => !b); setTab(backtestMode ? "dashboard" : "backtest"); } });
    cmds.push({ id: "new-account-personal", group: "Acciones", label: "Nueva cuenta Personal", icon: Plus, onRun: () => addSubAccount("personal") });
    cmds.push({ id: "new-account-funded", group: "Acciones", label: "Nueva cuenta Fondeo", icon: Plus, onRun: () => addSubAccount("funded") });
    cmds.push({ id: "lock", group: "Acciones", label: "Bloquear la app ahora", icon: Lock, sublabel: "L", onRun: onLockNow });
    cmds.push({ id: "shortcuts", group: "Ayuda", label: "Ver atajos de teclado", icon: ListChecks, sublabel: "?", onRun: () => setShortcutsHelpOpen(true) });
    return cmds;
  }, [fullAccountList, themeMode, backtestMode, openNew, addSubAccount, onLockNow]);

  // Mientras se lee el respaldo guardado (localStorage o archivo local), se
  // muestra el splash de marca en vez de la app con datos por defecto/demo
  // que luego se reemplazarían de golpe por los reales.

  if (!loaded) return <SplashScreen />;

  return (
    <div className="hz-app-shell" style={{
      fontFamily: UI_FONT, minHeight: "100vh", color: T.text, display: "flex", fontVariantNumeric: "tabular-nums",
      background: `radial-gradient(1100px 620px at 14% -8%, ${T.brand}${IS_DARK ? "1c" : "0a"}, transparent 60%), radial-gradient(900px 700px at 100% 100%, ${T.brand}${IS_DARK ? "12" : "07"}, transparent 55%), ${T.bg}`,
    }}>
      <GoogleFontImport />

      {/* El tema global (theme.jsx) ya pone un anillo de :focus-visible en
          button/input/select/textarea/[tabindex] con !important, así que no
          hace falta repetir eso acá — lo que sí vale la pena es que ese
          anillo use el accentColor de la cuenta activa en vez del T.brand
          genérico (accentColor viene de ACCOUNT_META, es distinto por
          cuenta), para que quede consistente con el resto de la pantalla
          que ya tiñe todo con el color de la cuenta. Necesita su propio
          !important para ganarle al del tema. */}
      <style>{`
        .hz-app-shell button:focus-visible,
        .hz-app-shell input:focus-visible,
        .hz-app-shell select:focus-visible,
        .hz-app-shell textarea:focus-visible,
        .hz-app-shell [tabindex]:focus-visible {
          box-shadow: 0 0 0 1px ${accentColor}, 0 0 0 4px ${accentColor}2a !important;
        }
      `}</style>

      {/* Textura de grano sutil sobre toda la app: rompe la planicie del
          color sólido de fondo sin distraer del contenido. Es un overlay
          fijo (no ocupa espacio en el layout), con pointer-events:none para
          que nunca intercepte clics, y con blend-mode + opacidad muy bajos
          para que se lea como una textura, no como un filtro visible. El
          SVG es ruido fractal (feTurbulence) generado inline, sin depender
          de ningún archivo de imagen externo. */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: Z.grainTexture, pointerEvents: "none",
        opacity: IS_DARK ? 0.05 : 0.025,
        mixBlendMode: IS_DARK ? "overlay" : "multiply",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat",
      }} />

      {/* ── Sidebar ──
          Riel de ancho fijo (116px, ya no se expande al pasar el mouse):
          solo íconos, más grandes y más espaciados que antes, con la sección
          activa marcada por un fondo brandSoft fijo detrás del ícono (en vez
          de la píldora que se deslizaba). Cada botón muestra su nombre en un
          tooltip lateral al pasar el mouse, ya que no hay etiqueta de texto
          visible en el riel.

          El zIndex:40 en hz-sidebar-wrap es necesario aunque el riel interno
          ya tenga su propio zIndex: position:sticky crea su propio contexto
          de apilamiento, así que sin un z-index explícito ACÁ (en el wrap)
          el riel entero queda agrupado con el resto de los elementos
          "position + z-index:auto" del layout — como las tarjetas del
          dashboard, que usan position:relative — y ahí gana el que aparece
          más tarde en el DOM (las tarjetas, no el sidebar). Con z-index
          explícito el riel pasa a su propia capa, siempre por encima. */}
      <div className="hz-sidebar-wrap" style={{ width: NAV_W, position: "sticky", top: 0, height: "100vh", zIndex: Z.sidebarWrap }}>
        <div className="hz-sidebar" style={{
          position: "absolute", inset: 0, width: NAV_W, background: `${T.sidebar}ee`, backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)",
          borderRight: `1px solid ${T.border}`, boxShadow: `${T.edgeGlow}, ${T.innerGlow}`,
          display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 0 20px", gap: 10, zIndex: Z.sidebarRailInner,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: T.shadow, flexShrink: 0 }}>
            <img src="./logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", alignItems: "center" }}>
            {TAB_ITEMS.map(([key, Icon, label]) => (
              <NavButton key={key} active={tab === key} onClick={() => setTab(key)} ariaLabel={label} label={label}>
                <Icon size={NAV_ICON} strokeWidth={1.7} />
              </NavButton>
            ))}
          </div>

          <div style={{ width: 34, height: 1, background: T.border, margin: "10px 0", flexShrink: 0 }} />
          <NavButton active={tab === "add"} onClick={() => { setTab("add"); openNew(""); }} ariaLabel="Añadir trade" label="Añadir trade">
            <Plus size={NAV_ICON} strokeWidth={1.7} />
          </NavButton>
          <NavButton active={backtestMode} onClick={() => { setBacktestMode(b => !b); setTab(backtestMode ? "dashboard" : "backtest"); }} ariaLabel="Análisis Histórico / Backtesting" label="Backtesting">
            <History size={NAV_ICON} strokeWidth={1.7} />
          </NavButton>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
            <button onClick={() => setThemeMode(m => m === "dark" ? "light" : "dark")} aria-label="Cambiar entre modo claro y oscuro" className="hz-nav-btn"
              style={{ width: NAV_BTN_W, height: NAV_BTN_H, borderRadius: NAV_BTN_RADIUS, border: "none", background: "transparent", color: T.textFaint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {themeMode === "dark" ? <Sun size={NAV_ICON - 2} strokeWidth={1.7} /> : <Moon size={NAV_ICON - 2} strokeWidth={1.7} />}
              <span className="hz-tip">{themeMode === "dark" ? "Modo claro" : "Modo oscuro"}</span>
            </button>
            <div style={{ position: "relative", marginTop: 4, flexShrink: 0 }}>
              <div title="Nvt" style={{ width: 36, height: 36, borderRadius: "50%", background: T.brandSoft, color: T.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.xs, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Nvt
              </div>
              <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: T.gain, border: `2px solid ${T.sidebar}` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="hz-main-content" style={{ flex: 1, minWidth: 0, padding: "48px 28px 40px" }}>

      {/* Banner de actualización disponible/descargando/lista (solo Electron empaquetado).
          Usa T.info (no T.brand): es un aviso neutro, no la acción principal de la marca.
          El estado "error" sí usa T.loss, ya que es una falla real, no una novedad. */}
      {updateStatus && ["available", "downloading", "downloaded", "error"].includes(updateStatus.status) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: RADIUS.md, border: `1px solid ${updateStatus.status === "error" ? T.loss : T.info}55`, background: `${updateStatus.status === "error" ? T.loss : T.info}14`, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: updateStatus.status === "error" ? T.loss : T.info, display: "flex" }}>
            {updateStatus.status === "error" ? <AlertTriangle size={17} /> : <Save size={17} />}
          </span>
          <span style={{ fontSize: FS.base, color: T.text, fontWeight: 600 }}>
            {updateStatus.status === "available" && `Hay una versión nueva disponible${updateStatus.version ? ` (${updateStatus.version})` : ""} — descargando en segundo plano...`}
            {updateStatus.status === "downloading" && `Descargando actualización... ${updateStatus.percent ?? 0}%`}
            {updateStatus.status === "downloaded" && `Actualización lista para instalar${updateStatus.version ? ` (${updateStatus.version})` : ""}.`}
            {updateStatus.status === "error" && "No se pudo comprobar si hay actualizaciones. Se reintentará más tarde."}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {updateStatus.status === "downloaded" && (
              <button onClick={() => window.api?.restartToUpdate?.()} className="hz-shimmer" style={{ padding: "6px 14px", borderRadius: RADIUS.sm, border: "none", background: T.info, color: "#fff", cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
                Reiniciar y actualizar
              </button>
            )}
            <button onClick={() => setUpdateStatus(null)} style={{ ...S.button("secondary"), padding: "6px 10px" }}>
              {updateStatus.status === "downloaded" ? "Más tarde" : "Cerrar"}
            </button>
          </div>
        </div>
      )}

      {/* Fallo de autoguardado: banner persistente (no solo console.error), con
          acción de rescate — descargar un respaldo en archivo, que no pasa por
          localStorage y por lo tanto no se ve afectado por la cuota agotada. */}
      {saveError && !saveErrorDismissed && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: RADIUS.md, border: `1px solid ${T.loss}55`, background: `${T.loss}14`, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: T.loss, display: "flex" }}><AlertOctagon size={17} /></span>
          <span style={{ fontSize: FS.base, color: T.text, fontWeight: 600 }}>
            {saveError.message} {saveError.type === "quota" && "Tus cambios recientes podrían no estar guardándose."}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handleBackup} className="hz-shimmer" style={{ ...S.button("danger"), padding: "6px 14px" }}>
              Descargar respaldo ahora
            </button>
            <button onClick={() => setSaveErrorDismissed(true)} style={{ ...S.button("secondary"), padding: "6px 10px" }}>
              Cerrar por ahora
            </button>
          </div>
        </div>
      )}

      {/* Recordatorio periódico de respaldo (cada 7 días) */}
      {backupReminderDue && !backupBannerDismissed && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: RADIUS.md, border: `1px solid ${T.warning}55`, background: T.warningSoft, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: T.warning, display: "flex" }}><Save size={17} /></span>
          <span style={{ fontSize: FS.base, color: T.text, fontWeight: 600 }}>
            {lastBackupAt ? "Ya pasó una semana desde tu último respaldo." : "Todavía no has hecho ningún respaldo."} Es buena idea respaldar tus datos periódicamente.
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handleBackup} className="hz-shimmer" style={{ padding: "6px 14px", borderRadius: RADIUS.sm, border: "none", background: T.warning, color: "#fff", cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
              Respaldar ahora
            </button>
            <button onClick={() => setBackupBannerDismissed(true)} style={{ ...S.button("secondary"), padding: "6px 10px" }}>
              Recordar después
            </button>
          </div>
        </div>
      )}

      {/* Header — único a lo largo de toda la app (antes el título se repetía
          acá y de nuevo, más chico, arriba del contenido de cada pestaña que
          no fuera el dashboard). Ahora ese segundo bloque desapareció: el
          ícono de la sección activa vive acá, junto al título, y el badge de
          "backtesting activo" también se movió acá para que quede visible
          sin importar en qué pestaña estés, no solo fuera del dashboard. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS.md, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: T.brandSoft, color: accentColor,
          }}>
            <CurrentTabIcon size={19} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{
                fontSize: FS.hero, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15,
                // Los stops en "ch" (en vez de %) fijan el ancho de la franja de color
                // de acento a una cantidad constante de caracteres, sin importar el
                // largo total de la palabra. Antes, con stops en %, el 45% final de
                // una palabra corta ("P&L", "Trades") caía dentro de 1-2 letras y el
                // degradado casi no se notaba, mientras que en palabras largas
                // ("Trading Dashboard", "Estadísticas") se veía un barrido claro.
                backgroundImage: `linear-gradient(90deg, ${T.text}, ${T.text} calc(100% - 6ch), ${accentColor})`,
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              }}>
                {tab === "dashboard" ? "Trading Dashboard" : tabLabel}
              </div>
              {backtestMode && (
                <span style={{ ...S.tag(T.warning), display: "inline-flex", alignItems: "center", gap: 4 }}><History size={11} />Modo backtesting activo</span>
              )}
            </div>
            <div style={{ fontSize: FS.sm, color: T.textMuted }}>Cuenta activa: <span style={{ color: accentColor, fontWeight: 700 }}>{accountLabel}</span></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", flexWrap: "wrap" }}>
          {tab !== "backtest" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {(backtestMode || account === "backtest") && (
                  <select value={viewYear} onChange={e => setViewYear(parseInt(e.target.value))} style={{ ...S.input, width: 90, padding: "5px 8px" }}>
                    {(account === "backtest" ? BACKTEST_YEARS : YEARS).map(y => <option key={y}>{y}</option>)}
                  </select>
                )}
                <button onClick={prevMonth} title="Mes anterior" aria-label="Mes anterior" style={{ ...S.button("secondary"), padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadow }}><ChevronLeft size={16} strokeWidth={2} /></button>
                <span style={{ fontWeight: 700, fontSize: FS.lg, color: T.text, minWidth: 150, textAlign: "center" }}>{MONTHS_FULL[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} title="Mes siguiente" aria-label="Mes siguiente" style={{ ...S.button("secondary"), padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadow }}><ChevronRight size={16} strokeWidth={2} /></button>
                <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }} style={{ ...S.button("secondary"), padding: "5px 12px", fontSize: FS.sm }}>Hoy</button>
              </div>
              <div aria-hidden="true" style={{ width: 1, height: 24, background: T.border }} />
            </>
          )}
          <span style={{ display: "flex", alignItems: "center", fontSize: FS.xs, color: saveStatus === "saving" ? T.warning : saveStatus === "saved" ? T.gain : T.textFaint, fontWeight: 600 }}>
            {saveStatus === "saving" ? <><Save size={11} style={{ marginRight: 4 }} />Guardando…</> : saveStatus === "saved" ? <><Check size={11} style={{ marginRight: 4 }} />Guardado</> : ""}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: RADIUS.pill, padding: "0 14px", height: 36 }}>
            {[["personal","Personal",T.brand],["funded","Fondeo",T.funded],["backtest","Backtesting",T.warning]].map(([key, label, color]) => {
              const active = group === key;
              return (
                <button key={key} onClick={() => setAccount(key === "backtest" ? "backtest" : (accountOrder[key][0] || `${key}-1`))}
                  title={label} aria-label={label}
                  style={{ width: 14, height: 14, padding: 0, borderRadius: "50%", border: `2px solid ${color}`, background: active ? color : "transparent", cursor: "pointer", boxShadow: active ? `0 0 0 3px ${color}22` : "none", transition: "all 0.15s" }} />
              );
            })}
          </div>
          <Tooltip label="Bloquear la app ahora (L)">
            <button onClick={onLockNow}
              style={{ width: 36, height: 36, borderRadius: RADIUS.md, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Bloquear la app ahora">
              <Lock size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Más opciones">
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Más opciones"
              style={{ width: 36, height: 36, borderRadius: RADIUS.md, border: `1px solid ${menuOpen ? T.textFaint : T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MoreVertical size={16} />
            </button>
          </Tooltip>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: Z.menuOverlay }} />
              <div style={{ position: "absolute", top: 44, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, boxShadow: T.shadowLg, padding: 5, minWidth: 190, zIndex: Z.dropdown }}>
                <input ref={restoreInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleRestoreFile} />
                <button onClick={() => { handleBackup(); setMenuOpen(false); }} style={menuBtnStyle}><Save size={13} style={{ marginRight: 8 }} />Respaldar datos</button>
                <button onClick={() => { restoreInputRef.current.click(); setMenuOpen(false); }} style={menuBtnStyle}><RotateCcw size={13} style={{ marginRight: 8 }} />Restaurar datos</button>
                <div style={{ height: 1, background: T.border, margin: "4px 2px" }} />
                <button onClick={() => { setMenuOpen(false); setOnboardingOpen(true); }} style={menuBtnStyle}>
                  <Crown size={13} style={{ marginRight: 8 }} />Ver introducción
                </button>
                <button onClick={() => { setMenuOpen(false); setShortcutsHelpOpen(true); }} style={menuBtnStyle}>
                  <ListChecks size={13} style={{ marginRight: 8 }} />Atajos de teclado
                  <span style={{ marginLeft: "auto", fontSize: FS.xs, color: T.textFaint, fontWeight: 700 }}>?</span>
                </button>
                <button onClick={() => { setMenuOpen(false); setRemindersOpen(true); }} style={menuBtnStyle}>
                  <Bell size={13} style={{ marginRight: 8 }} />Recordatorios
                  {reminders.some(r => r.enabled) && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: T.brand }} />}
                </button>
                <div style={{ height: 1, background: T.border, margin: "4px 2px" }} />
                <button onClick={() => { setMenuOpen(false); setConfirmDialog({ title: "¿Cambiar el PIN?", message: "Esto borra el PIN actual y te pedirá crear uno nuevo.", confirmLabel: "Continuar", onConfirm: () => { setConfirmDialog(null); onChangePin(); } }); }} style={menuBtnStyle}><KeyRound size={13} style={{ marginRight: 8 }} />Cambiar PIN</button>
              </div>
            </>
          )}
        </div>
      </div>


      {/* Subcuentas del grupo activo (Personal 1, Personal 2... / Fondeo 1, Fondeo 2...) */}
      {(group === "personal" || group === "funded") && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cuentas {ACCOUNT_META[group].label}:</span>
          {accountOrder[group].map(key => (
            <div key={key} style={{ display: "flex", alignItems: "center", borderRadius: RADIUS.sm, border: `1px solid ${account === key ? accentColor + "88" : T.border}`, background: account === key ? accentColor + "12" : T.surface, overflow: "hidden" }}>
              <button onClick={() => setAccount(key)}
                style={{ padding: "5px 6px 5px 12px", border: "none", cursor: "pointer", fontSize: FS.base, fontWeight: 600, background: "transparent", color: account === key ? accentColor : T.textMuted }}>
                {accounts[key]?.name || key}
              </button>
              {accountOrder[group].length > 1 && (
                <button onClick={() => deleteSubAccount(group, key)} title={`Borrar ${accounts[key]?.name || key}`} aria-label={`Borrar ${accounts[key]?.name || key}`}
                  style={{ padding: "5px 10px 5px 4px", border: "none", cursor: "pointer", display: "flex", background: "transparent", color: T.textFaint }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => addSubAccount(group)} title={`Crear otra cuenta ${ACCOUNT_META[group].label}`}
            style={{ padding: "5px 12px", borderRadius: RADIUS.sm, border: `1px dashed ${T.border}`, cursor: "pointer", fontSize: FS.base, fontWeight: 600, background: "transparent", color: T.textMuted }}>
            ＋ Nueva cuenta
          </button>
        </div>
      )}

      {tabTransitioning ? (tab === "finanzas" ? <FinanceSkeleton /> : <TabSkeleton tab={tab} />) : (
      <div key={tab} className="hz-tab-fade">
      {/* ── DASHBOARD: resumen general, balance de cuenta y KPIs ── */}
      {tab === "dashboard" && (
        <>
          <EquityHeroCard trades={currentTrades} accountSize={accounts[account].size} accentColor={accentColor} />

          <div className="hz-dash-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", gap: 14, marginBottom: 14, alignItems: "stretch" }}>
            <div className="hz-card" style={{ ...S.card, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: FS.base, fontWeight: 800, color: T.text, alignSelf: "flex-start", marginBottom: 8 }}>Porcentaje de aciertos</div>
              <WinRateDonut accountList={fullAccountList} allTrades={trades} viewYear={viewYear} viewMonth={viewMonth} />
            </div>
            <AccountsOverviewRow accountList={fullAccountList} allTrades={trades} accounts={accounts} activeAccount={account} setAccount={setAccount} viewYear={viewYear} viewMonth={viewMonth} onAddAccount={addSubAccount} activeGroup={group} />
            <StreakMedalCard trades={currentTrades} />
          </div>

          <AccountBalanceCard account={account} group={group} accounts={accounts} allTrades={trades} setAccounts={setAccounts} accentColor={accentColor} viewYear={viewYear} viewMonth={viewMonth} onAddAccount={addSubAccount} onDeleteAccount={deleteSubAccount} canDelete={group !== "backtest" && (accountOrder[group]?.length || 0) > 1} />
          <RiskAlertBanner acc={accounts[account]} trades={currentTrades} />
          {(() => {
            const pendingCount = currentTrades.filter(t => t.reviewCompleted === false).length;
            if (pendingCount === 0) return null;
            return (
              <button onClick={() => setTab("trades")}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", cursor: "pointer",
                  padding: "10px 14px", marginBottom: 14, borderRadius: 10, border: `1px solid ${accentColor}40`,
                  background: `${accentColor}0d`, color: T.text, fontSize: FS.sm, fontFamily: "inherit",
                }}>
                <Zap size={13} color={accentColor} />
                <span>
                  Tenés <b style={{ color: accentColor }}>{pendingCount}</b> trade{pendingCount === 1 ? "" : "s"} cargado{pendingCount === 1 ? "" : "s"} rápido — falta completar el review (razones, errores, notas).
                </span>
              </button>
            );
          })()}

          {/* Fila primaria: las 4 métricas que de verdad se miran a diario.
              Se diferencian de la fila secundaria con más padding, valor más
              grande/pesado y una franja de color arriba (el mismo color que
              usa la cifra) que funciona como acento premium sin recargar la
              tarjeta con un borde completo. Los colores ahora salen de T.gain
              /T.loss (theme.js) en vez de hex sueltos en el JSX, para que
              light/dark y cualquier futuro cambio de paleta se propaguen solos. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 10 }}>
            {[
              { label: "P&L Mensual", value: money(animPnl), color: stats.pnl >= 0 ? T.gain : T.loss, delta: stats.pnl - prevStats.pnl, suffix: "money", spark: sparkSeries.pnl },
              { label: "Win Rate", value: `${animWr.toFixed(1)}%`, color: T.gain, delta: parseFloat(stats.wr) - prevStats.wr, suffix: "pp", spark: sparkSeries.wr },
              { label: "R:R Promedio", value: `1:${animRR.toFixed(2)}`, color: accentColor, delta: parseFloat(stats.avgRR) - prevStats.avgRR, suffix: "r", spark: sparkSeries.rr },
              { label: "Trades", value: `${stats.wins}W / ${stats.losses}L`, color: T.textMuted },
            ].map(s => (
              <div key={s.label} className="hz-card" style={{ ...S.card, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color, opacity: 0.85 }} />
                <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
                  <span className="hz-countup" style={{ fontSize: FS.xl, fontWeight: 800, letterSpacing: "-0.01em", color: s.color }}>{s.value}</span>
                  {s.suffix && <DeltaChip diff={s.delta} hasPrev={prevStats.count > 0} suffix={s.suffix} />}
                </div>
                {s.spark && <Sparkline data={s.spark} color={s.color} />}
              </div>
            ))}
          </div>

          {/* Fila secundaria: en vez de 4 tarjetas sueltas compitiendo por
              atención con la fila de arriba, ahora es UNA sola tarjeta
              dividida por separadores finos — se lee como "detalle
              adicional" del mismo bloque, no como 4 KPIs de igual peso.
              Valor más chico (FS.base vs FS.xl arriba) refuerza que es
              información secundaria. */}
          <div className="hz-card" style={{ ...S.card, display: "flex", marginBottom: 18, overflow: "hidden" }}>
            {[
              { label: "Mejor trade", value: money(animBest), color: T.gain },
              { label: "Peor trade", value: money(animWorst), color: T.loss },
              { label: "Racha máx.", value: Math.round(animStreak), color: T.warning },
              { label: "Total mes", value: Math.round(animCount), color: T.textMuted },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, padding: "10px 16px", borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{s.label}</div>
                <div className="hz-countup" style={{ fontSize: FS.base, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ANÁLISIS HISTÓRICO ── */}
      {tab === "backtest" && <HistoricalAnalysisPanel trades={currentTrades} accentColor={accentColor} />}

      {/* ── CALENDAR ── */}
      {tab === "calendar" && (
        <div>
          {/* Antes: dos cards apiladas full-width (cada una con su propio
              gráfico), lo que empujaba el calendario muy abajo y obligaba a
              scrollear para verlo. Ahora van lado a lado en una fila, igual
              que las 4 métricas del Dashboard — mismo patrón de grid
              (auto-fit + minmax) que ya se usa en otras partes de la app,
              así en ventanas angostas se acomodan en 1 columna en vez de
              aplastarse en vez de romper el layout. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Rentabilidad de la inversión: evolución mensual de la cuenta activa */}
            <div className="hz-card" style={{ ...S.card, padding: "16px 18px" }}>
              <div style={{ fontSize: FS.base, fontWeight: 800, color: T.text, marginBottom: 2 }}>Rentabilidad de la inversión</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 10 }}>{accountLabel} · histórico completo</div>
              <ProfitabilityChart trades={trades[account] || []} accountSize={accounts[account]?.size || 0} />
            </div>

            {/* Gráfica combinada de tendencia mensual */}
            <div className="hz-card" style={{ ...S.card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ ...S.tag(T.brand), display: "inline-flex", alignItems: "center", gap: 4 }}><TrendingUp size={10} />MoM</span>
                <span style={{ fontSize: FS.base, fontWeight: 700, color: T.text }}>Tendencia por instrumento — {MONTHS_FULL[viewMonth]} {viewYear}</span>
              </div>
              <MonthlyTrendChart trades={currentTrades} year={viewYear} month={viewMonth} accentColor={accentColor} />
            </div>
          </div>

          <div className="hz-card" style={{ ...S.card, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ ...S.tag(T.brand), display: "inline-flex", alignItems: "center", gap: 4 }}><CalendarDays size={10} />Calendario</span>
              <span style={{ fontSize: FS.sm, color: T.textFaint }}>Clic en un día para añadir o borrar trades</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
              {(() => {
                const weekdayHeaderCellStyle = { padding: "8px 0", textAlign: "center", fontSize: FS.xs, fontWeight: 700, color: T.textMuted, letterSpacing: "0.06em" };
                return WEEKDAY_HEADER_LABELS.map(d => (
                  <div key={d} style={weekdayHeaderCellStyle}>{d}</div>
                ));
              })()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
              {(() => {
                // Piezas de estilo idénticas para las ~35-42 celdas del mes: se
                // arman una sola vez por render acá arriba, en vez de una vez
                // por celda dentro del .map(). Solo lo que realmente cambia por
                // día (fondo según ganancia/pérdida, si es hoy, etc.) se sigue
                // calculando por celda, ya que no hay forma de evitarlo sin
                // extraer cada celda a su propio componente memo().
                const emptyCellStyle = { minHeight: 82, borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt };
                const cellBaseStyle = { minHeight: 82, padding: 7, borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: `background 0.18s ${EASE}` };
                const dateRowStyle = { display: "flex", justifyContent: "space-between" };
                const dayNumBaseStyle = { fontSize: FS.sm, fontWeight: 700, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" };
                const notesRowStyle = { display: "flex", gap: 2 };
                const noteEmojiStyle = { fontSize: FS.xs };
                const pnlRowBaseStyle = { marginTop: 5, fontSize: FS.sm, fontWeight: 700 };
                const countLabelStyle = { color: T.textFaint, fontWeight: 600 };
                const instRowStyle = { display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" };
                const instEmojiStyle = { fontSize: FS.xs, lineHeight: 1 };
                return cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} style={emptyCellStyle} />;
                  const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayT = byDate[ds] || [];
                  const dayPnL = dayT.reduce((s, t) => s + t.pnl, 0);
                  const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
                  const hasTrades = dayT.length > 0;
                  // Tono plano por categoría del día (no heatmap por magnitud): verde
                  // suave si ganó, rojo suave si perdió, gris oscuro si fue break-even.
                  const allBE = hasTrades && dayT.every(t => t.pnl === 0);
                  const cellBg = !hasTrades ? T.surface : allBE ? `${T.textMuted}33` : dayPnL > 0 ? `${T.gain}26` : `${T.loss}26`;
                  const dayAriaLabel = `${day} de ${MONTHS_FULL[viewMonth]}${hasTrades ? `, ${dayT.length} trade${dayT.length === 1 ? "" : "s"}, ${dayPnL >= 0 ? "ganancia" : "pérdida"} de ${money(Math.abs(dayPnL))}` : ", sin trades"}`;
                  return (
                    <div key={day} onClick={() => setDayModalDate(ds)}
                      role="button" tabIndex={0} aria-label={dayAriaLabel}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDayModalDate(ds); } }}
                      style={{ ...cellBaseStyle, background: cellBg }}
                      onMouseEnter={e => e.currentTarget.style.background = T.brandSoft}
                      onMouseLeave={e => e.currentTarget.style.background = cellBg}>
                      <div style={dateRowStyle}>
                        <span style={{ ...dayNumBaseStyle, color: isToday ? "#fff" : hasTrades ? T.text : T.textFaint, background: isToday ? T.brand : "transparent" }}>{day}</span>
                        <span style={notesRowStyle}>
                          {marketNotes[ds] && (marketNotes[ds].plan || marketNotes[ds].result) && <span style={noteEmojiStyle}>📝</span>}
                          {dayT.some(t => t.imgBefore || t.imgAfter || t.imagenAntesKey || t.imagenDespuesKey) && <span style={noteEmojiStyle}>📷</span>}
                        </span>
                      </div>
                      <div style={{ ...pnlRowBaseStyle, color: hasTrades ? (dayPnL >= 0 ? T.gain : T.loss) : T.textFaint }}>
                        {hasTrades ? `${dayPnL >= 0 ? "▲" : "▼"}${money(Math.abs(dayPnL))}` : "$0"} <span style={countLabelStyle}>· {dayT.length} Trade{dayT.length === 1 ? "" : "s"}</span>
                      </div>
                      {hasTrades && (
                        <div style={instRowStyle}>
                          {[...new Set(dayT.map(t => t.instrument))].map(inst => (
                            <span key={inst} title={instLabel(inst)} style={instEmojiStyle}>{instEmoji(inst)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── CHART ── */}
      {tab === "chart" && (
        <div className="hz-card" style={{ ...S.card, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 4 }}>P&L Acumulado</div>
              <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>Cuenta {accountLabel} · {chartRangeResolved.from} → {chartRangeResolved.to}</div>
            </div>
            <button onClick={handleExportChartPDF} title="Exportar este reporte a PDF, incluyendo el gráfico"
              style={{ ...S.button("secondary"), padding: "6px 14px" }} aria-label="Exportar este reporte a PDF, incluyendo el gráfico">
              <FileText size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Exportar PDF
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <DateRangeFilter range={chartDateRange} setRange={setChartDateRange} accentColor={accentColor} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <InstrumentFilter filterInst={filterInst} setFilterInst={setFilterInst} accentColor={accentColor} />
          </div>
          <div ref={chartRef}>
            <PnLChart monthTrades={chartTrades} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
            {INSTRUMENTS.filter(inst => filterInst.includes(inst)).map(inst => {
              const it = chartTrades.filter(t => t.instrument === inst);
              const ip = it.reduce((s, t) => s + t.pnl, 0);
              return (
                <div key={inst} style={{ background: T.surfaceAlt, border: `1px solid ${INST_COLOR[inst]}33`, borderRadius: RADIUS.md, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: INST_COLOR[inst] }} />
                    <span style={{ fontWeight: 700, fontSize: FS.base, color: INST_COLOR[inst] }}>{instEmoji(inst)} {instLabel(inst)}</span>
                  </div>
                  <div style={{ fontSize: FS.xl, fontWeight: 700, color: ip >= 0 ? T.gain : T.loss, marginBottom: 4 }}>{money(ip)}</div>
                  <div style={{ fontSize: FS.sm, color: T.textMuted }}>{it.length} trades · {it.filter(t => t.pnl > 0).length}W / {it.filter(t => t.pnl <= 0).length}L</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRADES ── */}
      {tab === "trades" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: 200 }}>
              <input value={tradeSearch} onChange={e => setTradeSearch(e.target.value)}
                placeholder="🔎 Buscar por nota, tag, setup, par..."
                style={{ ...S.input, padding: "6px 10px", fontSize: FS.base, paddingRight: tradeSearch ? 26 : 10 }} />
              {tradeSearch && (
                <button onClick={() => setTradeSearch("")} title="Limpiar búsqueda"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textFaint, display: "flex" }} aria-label="Limpiar búsqueda">
                  <X size={13} />
                </button>
              )}
            </div>
            <InstrumentFilter filterInst={filterInst} setFilterInst={setFilterInst} accentColor={accentColor} />
            {setupsList.length > 0 && (
              <>
                <span style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", alignSelf: "center", marginLeft: 10 }}>Setup:</span>
                <select value={filterSetup} onChange={e => setFilterSetup(e.target.value)}
                  style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: FS.base }}>
                  <option value="All">Todos</option>
                  {setupsList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}
            <span style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", alignSelf: "center", marginLeft: 10 }}>Agrupar por:</span>
            <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, overflow: "hidden" }}>
              {[["week", "Semana"], ["month", "Mes"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setGroupBy(val)}
                  style={{ padding: "6px 14px", border: "none", background: groupBy === val ? accentColor : T.surface, color: groupBy === val ? "#fff" : T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>
                  {lbl}
                </button>
              ))}
            </div>
            <button onClick={() => exportTradesToCSV(monthlyGroups.flatMap(([, mt]) => mt), `trades-${accountLabel}-${viewYear}.csv`)}
              title="Exportar los trades filtrados a un archivo CSV (compatible con Excel)"
              style={{ ...S.button("secondary"), marginLeft: "auto", padding: "6px 14px" }} aria-label="Exportar los trades filtrados a un archivo CSV (compatible con Excel)">
              <FileText size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Exportar CSV
            </button>
          </div>

          <TradesSummaryCards trades={monthlyGroups.flatMap(([, mt]) => mt)} />

          <MonthlyGoalsPanel
            trades={currentTrades}
            viewYear={viewYear}
            goals={monthlyGoals[account] || {}}
            setGoals={updater => setMonthlyGoals(prev => ({ ...prev, [account]: typeof updater === "function" ? updater(prev[account] || {}) : updater }))}
            accentColor={accentColor}
          />

          <EmotionCorrelationPanel trades={monthlyGroups.flatMap(([, mt]) => mt)} accountSize={accounts[account].size} />

          {monthlyGroups.length === 0 ? (
            <div className="hz-card" style={S.card}>
              <EmptyState icon={ListChecks} title={`No hay trades en ${viewYear}`} subtitle="Registrá tu primer trade del año para empezar a ver tu evolución acá." actionLabel="+ Registrar trade" onAction={() => { setTab("add"); openNew(""); }} accentColor={accentColor} />
            </div>
          ) : monthlyGroups.map(([gk, mt]) => {
            const mPnL = mt.reduce((s, t) => s + t.pnl, 0);
            const wins = mt.filter(t => t.pnl >= 0).length;
            const winRate = mt.length ? Math.round((wins / mt.length) * 100) : 0;
            const avgRR = mt.length ? (mt.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0) / mt.length).toFixed(2) : "0.00";
            let groupLabel;
            if (groupBy === "week") {
              // gk es el lunes (YYYY-MM-DD) de esa semana ISO; mostramos el rango lunes → domingo.
              const start = new Date(gk + "T00:00:00");
              const end = new Date(start); end.setDate(start.getDate() + 6);
              const fmt = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
              groupLabel = `Semana del ${fmt(start)} al ${fmt(end)} de ${end.getFullYear()}`;
            } else {
              const [y, m] = gk.split("-");
              groupLabel = `${MONTHS_FULL[parseInt(m, 10) - 1]} ${y}`;
            }
            const collapsed = !!collapsedGroups[gk];
            const totalPages = Math.max(1, Math.ceil(mt.length / TRADES_PAGE_SIZE));
            const currentPage = Math.min(tradesPage[gk] || 0, totalPages - 1);
            const pagedMt = mt.slice(currentPage * TRADES_PAGE_SIZE, (currentPage + 1) * TRADES_PAGE_SIZE);
            return (
              <div key={gk} className="hz-sheet" style={{ ...S.sheet, marginBottom: 14, overflow: "hidden" }}>
                {/* Encabezado del grupo (colapsable) */}
                <div onClick={() => setCollapsedGroups(g => ({ ...g, [gk]: !g[gk] }))}
                  role="button" tabIndex={0} aria-expanded={!collapsed} aria-label={`${collapsed ? "Expandir" : "Colapsar"} grupo ${groupLabel}`}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCollapsedGroups(g => ({ ...g, [gk]: !g[gk] })); } }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: T.surfaceAlt, cursor: "pointer", userSelect: "none", borderBottom: collapsed ? "none" : `1px solid ${T.borderStrong}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: FS.xs, color: T.textFaint, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>▼</span>
                    <span style={{ fontSize: FS.sm, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>{groupLabel}</span>
                  </div>
                  <span style={{ ...numMonoStyle, fontSize: FS.sm, fontWeight: 700, color: mPnL >= 0 ? T.gain : T.loss }}>{money(mPnL)}</span>
                </div>

                {!collapsed && (
                  <>
                    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 520 }}
                      onScroll={e => {
                        // La sombra del header pegajoso solo debe leerse como
                        // señal de "esto quedó flotando sobre contenido" — si
                        // se muestra siempre (incluso con scrollTop 0, antes
                        // de que el header realmente se despegue de su fila),
                        // deja de comunicar nada y se ve como un adorno fijo.
                        // Se alterna vía DOM directo (sin estado de React)
                        // para no forzar un re-render en cada pixel de scroll.
                        const shadow = IS_DARK ? "0 2px 6px rgba(0,0,0,0.35)" : "0 2px 6px rgba(30,27,46,0.07)";
                        const on = e.currentTarget.scrollTop > 0;
                        e.currentTarget.querySelectorAll("thead th").forEach(th => { th.style.boxShadow = on ? shadow : "none"; });
                      }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {[
                            [BarChart3, "N°"], [CalendarDays, "Fecha"], [ArrowLeftRight, "Activo"], [ArrowUpDown, "Buy/Sell"],
                            [ListChecks, "Setup"], [Percent, "%"], [Ruler, "R/R"], [Target, "Resultado"],
                            [DollarSign, "Ingreso"], [Globe, "Sesión"], [AlertTriangle, "Fórmula"], [Brain, "Emoción"], [null, ""],
                          ].map(([Icon, h], i) => (
                            <th key={h || "acc"} style={{ padding: "8px 10px", fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textAlign: (i === 5 || i === 6 || i === 8) ? "right" : i === 10 ? "center" : "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.borderStrong}`, background: T.surfaceAlt, whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: Z.stickyHeader, boxShadow: "none", transition: "box-shadow 0.15s ease" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: (i === 5 || i === 6 || i === 8) ? "flex-end" : i === 10 ? "center" : "flex-start" }}>{Icon && <Icon size={11} />}{h}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // La tabla más pesada del archivo: hasta TRADES_PAGE_SIZE
                          // filas x 13 columnas. La mayoría de los estilos de celda
                          // son idénticos para todas las filas — antes se
                          // reconstruía el objeto completo por cada <td> de cada
                          // fila. Ahora se arma una sola vez por render y solo se
                          // spreadea con lo que realmente varía por trade
                          // (ringColor, zebraBg, etc.).
                          const cellPad = { padding: "9px 10px" };
                          const cellNumStyle = { padding: "9px 10px", fontSize: FS.sm, color: T.textMuted, fontWeight: 600, ...numMonoStyle };
                          const cellDateStyle = { padding: "9px 10px", fontSize: FS.sm, color: T.text, whiteSpace: "nowrap", ...numMonoStyle };
                          const cellSetupStyle = { padding: "9px 10px", fontSize: FS.sm, color: T.text, whiteSpace: "nowrap" };
                          const cellNumRightStyle = { padding: "9px 10px", fontSize: FS.sm, color: T.text, fontWeight: 600, textAlign: "right", ...numMonoStyle };
                          const cellPnlBaseStyle = { padding: "9px 10px", fontSize: FS.sm, fontWeight: 700, textAlign: "right", ...numMonoStyle };
                          const pnlInnerStyle = { display: "inline-flex", alignItems: "center", gap: 3, justifyContent: "flex-end" };
                          const cellSessionStyle = { padding: "9px 10px", fontSize: FS.sm, color: T.text, whiteSpace: "nowrap" };
                          const cellCenterStyle = { padding: "9px 10px", textAlign: "center" };
                          const dotBaseStyle = { width: 11, height: 11, borderRadius: "50%", border: "none", display: "inline-block" };
                          const emotionDashStyle = { fontSize: FS.sm, color: T.textFaint };
                          const dashStyle = { color: T.textFaint };
                          const actionsRowStyle = { display: "flex", gap: 3 };
                          const editBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", color: T.textMuted };
                          const deleteBtnStyle = { background: "none", border: "none", cursor: "pointer", display: "flex", color: T.loss };
                          const rowBaseStyle = { borderBottom: `1px solid ${T.border}`, borderLeft: "3px solid transparent", cursor: "pointer", transition: `background 0.16s ${EASE}, border-color 0.16s ${EASE}, border-left-width 0.16s ${EASE}, box-shadow 0.16s ${EASE}` };
                          return pagedMt.map((t, idx) => {
                            const win = t.pnl >= 0;
                            const ringColor = win ? T.gain : T.loss;
                            const isLong = t.direction === "LONG";
                            const result = t.pnl > 0 ? { label: "Take Profit", color: T.gain } : t.pnl < 0 ? { label: "Stop Loss", color: T.loss } : { label: "Break Even", color: T.textFaint };
                            const primaryEmotion = (t.emotions || []).map(id => EMOTIONS.find(e => e.id === id)).filter(Boolean)[0];
                            const emotionColor = primaryEmotion ? (NEG_EMOTIONS.includes(primaryEmotion.id) ? T.loss : T.gain) : null;
                            const zebraBg = idx % 2 === 1 ? T.surfaceAlt : "transparent";
                            return (
                              <tr key={t.id} style={{ ...rowBaseStyle, background: zebraBg }}
                                tabIndex={0}
                                aria-label={`Ver detalle del trade ${t.instrument} del ${t.date}, resultado ${money(t.pnl)}`}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setDetailTrade(t); } }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = T.borderStrong + "55";
                                  e.currentTarget.style.borderLeftColor = accentColor;
                                  e.currentTarget.style.borderLeftWidth = "5px";
                                  e.currentTarget.style.boxShadow = `inset 0 1px 0 ${accentColor}22, 0 3px 10px ${IS_DARK ? "rgba(0,0,0,0.35)" : "rgba(30,27,46,0.09)"}`;
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = zebraBg;
                                  e.currentTarget.style.borderLeftColor = "transparent";
                                  e.currentTarget.style.borderLeftWidth = "3px";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                onClick={() => setDetailTrade(t)}>
                                <td style={cellNumStyle}>{mt.length - idx}</td>
                                <td style={cellDateStyle}>
                                  {t.date}
                                  {t.reviewCompleted === false && (
                                    <span title="Pendiente de completar review (razones, errores, notas)"
                                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", background: accentColor + "1a", color: accentColor, marginLeft: 5, verticalAlign: 2 }}>
                                      <Zap size={9} />
                                    </span>
                                  )}
                                </td>
                                <td style={cellPad}>
                                  <InstTag inst={t.instrument} />
                                </td>
                                <td style={cellPad}>
                                  <span style={S.tag(isLong ? T.gain : T.loss)}>{isLong ? "Buy" : "Sell"}</span>
                                </td>
                                <td style={cellSetupStyle}>
                                  {getTradeSetups(t).length > 0 ? getTradeSetups(t).join(", ") : <span style={dashStyle}>—</span>}
                                </td>
                                <td style={cellNumRightStyle}>
                                  {t.riskPct ? pctFmt(parseFloat(t.riskPct) || 0) : "—"}
                                </td>
                                <td style={cellNumRightStyle}>
                                  {t.rr ? `${parseFloat(t.rr).toFixed(2)}R` : "—"}
                                </td>
                                <td style={cellPad}>
                                  <span style={S.tag(result.color)}>{result.label}</span>
                                </td>
                                <td style={{ ...cellPnlBaseStyle, color: ringColor }}>
                                  <span style={pnlInnerStyle}>
                                    {win ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
                                    {money(t.pnl)}
                                  </span>
                                </td>
                                <td style={cellSessionStyle}>
                                  {t.session || <span style={dashStyle}>—</span>}
                                </td>
                                <td style={cellCenterStyle}>
                                  <span style={{ ...dotBaseStyle, background: ringColor }} />
                                </td>
                                <td style={cellPad}>
                                  {primaryEmotion ? <span style={S.tag(emotionColor)}>{primaryEmotion.label.toUpperCase()}</span> : <span style={emotionDashStyle}>—</span>}
                                </td>
                                <td style={cellPad} onClick={e => e.stopPropagation()}>
                                  <div style={actionsRowStyle}>
                                    <button onClick={() => openEdit(t)} style={editBtnStyle} title="Editar trade" aria-label="Editar trade"><Pencil size={13} /></button>
                                    <button onClick={() => deleteTrade(t.id)} style={deleteBtnStyle} title="Borrar trade" aria-label="Borrar trade"><Trash2 size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 16px", borderTop: `1px solid ${T.border}` }}>
                        <button onClick={() => setTradesPage(p => ({ ...p, [gk]: Math.max(0, currentPage - 1) }))} disabled={currentPage === 0}
                          style={{ padding: "4px 10px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: currentPage === 0 ? T.textFaint : T.textMuted, cursor: currentPage === 0 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                          ← Anterior
                        </button>
                        <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Página {currentPage + 1} de {totalPages}</span>
                        <button onClick={() => setTradesPage(p => ({ ...p, [gk]: Math.min(totalPages - 1, currentPage + 1) }))} disabled={currentPage >= totalPages - 1}
                          style={{ padding: "4px 10px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: currentPage >= totalPages - 1 ? T.textFaint : T.textMuted, cursor: currentPage >= totalPages - 1 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                          Siguiente →
                        </button>
                      </div>
                    )}

                    {/* Fila de totales del grupo, estilo Notion (COUNT / AVG R:R / SUM) */}
                    <div style={{ display: "flex", gap: 20, padding: "8px 16px", borderTop: `1px solid ${T.borderStrong}`, background: T.surfaceAlt, fontSize: FS.sm, color: T.textMuted, flexWrap: "wrap" }}>
                      <span><span style={{ textTransform: "uppercase", fontWeight: 700, color: T.textFaint }}>Count</span> <span style={numMonoStyle}>{mt.length}</span></span>
                      <span><span style={{ textTransform: "uppercase", fontWeight: 700, color: T.textFaint }}>Avg R:R</span> <span style={numMonoStyle}>{avgRR}R</span></span>
                      <span><span style={{ textTransform: "uppercase", fontWeight: 700, color: T.textFaint }}>Sum</span> <span style={{ ...numMonoStyle, fontWeight: 700, color: mPnL >= 0 ? T.gain : T.loss }}>{money(mPnL)}</span></span>
                      <span style={{ marginLeft: "auto", fontWeight: 700, color: T.brand, ...numMonoStyle }}>{winRate}% acierto</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FINANZAS PERSONALES: pestaña independiente del trading, estilo panel Notion ── */}
      {tab === "finanzas" && (() => {
        return (
          <div>
            <div style={{
              fontSize: FS.title, fontWeight: 800, marginBottom: 16, color: T.brand,
            }}>
              Panel financiero
            </div>

            {/* Aviso de límite de gasto mensual: solo aparece si hay un límite
                (>0) configurado y se llegó al 80% (ámbar) o al 100% (rojo) de lo
                gastado este mes calendario, en la moneda seleccionada abajo. */}
            {finLimiteEstado && (
              <div role="status" style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 16,
                borderRadius: RADIUS.md,
                border: `1px solid ${finLimiteEstado === "excedido" ? T.loss : T.warning}55`,
                background: finLimiteEstado === "excedido" ? `${T.loss}14` : T.warningSoft,
                color: finLimiteEstado === "excedido" ? T.loss : T.warning,
              }}>
                {finLimiteEstado === "excedido" ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
                <div style={{ fontSize: FS.sm, fontWeight: 700 }}>
                  {finLimiteEstado === "excedido"
                    ? `Pasaste tu límite mensual de gasto: ${finMoneyFmt(gastoMesActual, finMoneda)} de ${finMoneyFmt(finLimiteMensual, finMoneda)} (${finLimitePct.toFixed(0)}%).`
                    : `Te estás acercando a tu límite mensual de gasto: ${finMoneyFmt(gastoMesActual, finMoneda)} de ${finMoneyFmt(finLimiteMensual, finMoneda)} (${finLimitePct.toFixed(0)}%).`}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={() => openFinForm("gasto")}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: RADIUS.sm, border: `1px solid color-mix(in srgb, ${T.loss} 35%, ${T.border})`, background: T.surface, color: T.loss, cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
                <RotateCcw size={14} /> Nuevo Gasto
              </button>
              <button onClick={() => openFinForm("ingreso")}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: RADIUS.sm, border: `1px solid color-mix(in srgb, ${T.gain} 35%, ${T.border})`, background: T.surface, color: T.gain, cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
                <ArrowUpRight size={14} /> Nuevo Ingreso
              </button>
              <button onClick={() => openRecForm("gasto")}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 700 }}>
                <Repeat size={14} /> Recurrente
              </button>
              <label style={{ display: "flex", flexDirection: "column", gap: 1, fontSize: 9, color: T.textFaint }}>
                Límite mensual de gasto ({finMoneda})
                <input type="number" min="0" step="1" placeholder="Sin definir"
                  value={finLimiteMensual ?? ""} onChange={e => setFinLimiteMensual(e.target.value === "" ? null : Number(e.target.value))}
                  style={{ width: 130, padding: "5px 8px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.sm, ...numMonoStyle }} />
              </label>
              {/* Toggle USD/CLP: filtra las gráficas/tarjetas de abajo — sumar
                  ambas monedas sin una tasa de cambio real daría un total sin
                  sentido, así que cada moneda se ve por separado, no mezclada.
                  El caption aclara el alcance: la tabla de registros de más
                  abajo sigue mostrando ambas monedas, así que sin esta
                  aclaración parecía un toggle roto o inconsistente.
                  (El toggle Mes/Semana se movió al header de "Historial de
                  saldo": ahí es donde realmente se usa esa granularidad, en
                  vez de vivir acá al lado de un toggle de moneda que no
                  tiene nada que ver — antes competían por el mismo espacio
                  y rompían la armonía visual de la fila.) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, marginLeft: "auto" }}>
                <span style={{ fontSize: 9, color: T.textFaint }}>Moneda de las gráficas</span>
                <div role="group" aria-label="Moneda a mostrar en las gráficas" style={{ display: "flex", gap: 2, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, padding: 1 }}>
                  {MONEDAS.map(m => (
                    <button key={m} type="button" aria-pressed={finMoneda === m} onClick={() => setFinMoneda(m)}
                      style={finToggleBtnStyle(finMoneda === m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtro por rango de fechas: acota tanto las tablas de registros
                como las gráficas/tarjetas de resumen de más abajo (no el aviso
                de límite mensual, que siempre mira el mes calendario actual). */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 26, flexWrap: "wrap", padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surfaceAlt }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: T.textMuted }}>
                <CalendarDays size={14} /> Rango de fechas
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 1, fontSize: 9, color: T.textFaint }}>
                Desde
                <input type="date" value={finDateFrom} onChange={e => setFinDateFrom(e.target.value)}
                  style={{ padding: "5px 8px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: FS.sm }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 1, fontSize: 9, color: T.textFaint }}>
                Hasta
                <input type="date" value={finDateTo} onChange={e => setFinDateTo(e.target.value)}
                  style={{ padding: "5px 8px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: FS.sm }} />
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["mes", "Este mes"], ["mesAnterior", "Mes anterior"], ["30d", "Últimos 30 días"], ["todo", "Todo"]].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setFinRangePreset(key)}
                    style={{ padding: "5px 10px", borderRadius: RADIUS.pill, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer", fontSize: FS.xs, fontWeight: 700 }}>
                    {label}
                  </button>
                ))}
              </div>
              {finRangeActive && (
                <span style={{ fontSize: FS.xs, color: T.textFaint, marginLeft: "auto" }}>
                  Mostrando {finDateFrom || "el inicio"} → {finDateTo || "hoy"}
                </span>
              )}
            </div>

            {/* ── Meta de ahorro mensual: cuánto querés que te sobre (ingresos -
                gastos) este mes calendario. Se muestra siempre, aunque todavía
                no haya movimientos, para que la meta esté visible desde el
                primer momento (a diferencia de las gráficas de abajo, que
                recién aparecen con datos). */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: "16px 18px", boxShadow: T.shadow, marginBottom: 26, position: "relative", overflow: "hidden" }}>
              <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: balanceMesActual >= finMetaAhorro ? T.gain : T.brand, opacity: 0.85 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Target size={14} /> Meta de ahorro mensual
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.xs, color: T.textFaint }}>
                  Meta ({finMoneda})
                  <input type="number" min="0" step="1" value={finMetaAhorro ?? ""} onChange={e => setFinMetaAhorro(e.target.value === "" ? 0 : Number(e.target.value))}
                    style={{ width: 90, padding: "4px 7px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.sm, ...numMonoStyle }} />
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: FS.subtitle, fontWeight: 800, color: balanceMesActual >= 0 ? T.text : T.loss, ...numMonoStyle }}>
                  {finMoneyFmt(balanceMesActual, finMoneda)}
                </span>
                <span style={{ fontSize: FS.xs, color: T.textFaint }}>
                  ahorrado este mes · meta {finMoneyFmt(finMetaAhorro || 0, finMoneda)}
                </span>
                {metaAhorroPct !== null && metaAhorroPct >= 100 && (
                  <span style={{ fontSize: FS.xs, fontWeight: 700, color: T.gain }}>¡Meta alcanzada! 🎉</span>
                )}
              </div>
              <ProgressBar
                pct={metaAhorroPct}
                color={metaAhorroPct === null ? T.textFaint : metaAhorroPct >= 100 ? T.gain : balanceMesActual < 0 ? T.loss : T.brand}
              />
              {metaAhorroPct !== null && (
                <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 6, textAlign: "right" }}>
                  {Math.round(Math.min(999, metaAhorroPct))}% de la meta
                </div>
              )}
            </div>

            {/* ── Presupuesto por categoría: cuánto planeás gastar este mes en cada
                categoría de gasto vs. cuánto llevás gastado. Solo aplica a
                categorías de GASTO (INGRESO_CATS no tiene "presupuesto"). Una
                categoría sin monto asignado se muestra sin barra, invitando a
                definirle un presupuesto en vez de mostrar un 0/0 confuso. */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.subtitle, fontWeight: 800, color: T.text, marginBottom: 14 }}>
                <Wallet size={16} color={T.brand} /> Presupuesto por categoría
                <span style={{ fontSize: FS.sm, fontWeight: 500, color: T.textFaint, marginLeft: 4 }}>este mes · {finMoneda}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {GASTO_CATS.map(cat => {
                  const CatIcon = FIN_CAT_ICONS[cat];
                  const gastado = gastoPorCategoriaMesActual[cat] || 0;
                  const presupuesto = presupuestosCat[cat];
                  const tienePresupuesto = presupuesto != null && presupuesto > 0;
                  const pct = tienePresupuesto ? (gastado / presupuesto) * 100 : null;
                  const color = pct === null ? T.brand : pct >= 100 ? T.loss : pct >= 80 ? T.warning : T.gain;
                  return (
                    <div key={cat} style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: T.text, minWidth: 0 }}>
                          {CatIcon ? <CatIcon size={13} color={T.textMuted} /> : null}
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat}</span>
                        </div>
                        <input type="number" min="0" step="1" placeholder="Sin definir"
                          value={presupuesto ?? ""} onChange={e => setPresupuestoCategoria(cat, e.target.value)}
                          style={{ width: 78, padding: "3px 6px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: FS.xs, ...numMonoStyle }} />
                      </div>
                      {tienePresupuesto ? (
                        <>
                          <ProgressBar pct={pct} color={color} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: FS.xs, ...numMonoStyle }}>
                            <span style={{ color, fontWeight: 700 }}>{finMoneyFmt(gastado, finMoneda)}</span>
                            <span style={{ color: T.textFaint }}>de {finMoneyFmt(presupuesto, finMoneda)}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: FS.xs, color: T.textFaint }}>
                          {gastado > 0 ? `Llevás ${finMoneyFmt(gastado, finMoneda)} gastados, sin presupuesto asignado.` : "Sin presupuesto asignado."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Resumen visual: donas de Gastos/Ingresos por categoría (período más
                reciente con datos) + historial de saldo acumulado. Mismo diseño que
                el resto de la app: CategoryBreakdownDonut e InteractiveCurveChart son
                los mismos componentes de charts.jsx que usan Dashboard/Estadísticas,
                no gráficos nuevos con su propio estilo.
                Antes cada gráfica vivía en su propia tarjeta a todo el ancho, una
                debajo de la otra (~220px de alto cada una) — mismo problema que
                tenían las tablas de Gastos/Ingresos. Y en una cuenta nueva sin
                movimientos todavía, lo primero que se veía al entrar a la pestaña
                eran dos tarjetas grandes con gráficas vacías. Ahora van lado a lado
                en el mismo grid de 2 columnas que las tablas, más chicas (160px de
                alto en vez de 220px), y si no hay ningún gasto/ingreso cargado se
                reemplazan por un único aviso compacto en vez de dos gráficas vacías. ── */}
            {finPeriods.length === 0 ? (
              <div style={{ border: `1px dashed ${T.border}`, borderRadius: RADIUS.md, padding: "22px 16px", textAlign: "center", color: T.textFaint, fontSize: FS.base, marginBottom: 26 }}>
                Registrá tu primer gasto o ingreso para ver acá las gráficas de este panel.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.85fr) minmax(320px, 1.15fr)", gap: 20, marginBottom: 26, alignItems: "stretch" }}>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: "16px 18px", boxShadow: T.shadow, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {/* Franja de acento arriba, dividida rojo/verde según el
                      mismo split del donut de abajo — mismo lenguaje visual
                      que la franja de color de las tarjetas KPI del
                      Dashboard, para que Finanzas se sienta parte de la
                      misma familia visual y no una sección aparte. */}
                  <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, display: "flex", opacity: 0.85 }}>
                    <span style={{ flex: 1, background: T.loss }} />
                    <span style={{ flex: 1, background: T.gain }} />
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <div style={{ fontSize: FS.sm, fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Gastos vs Ingresos</div>
                    <div style={{ fontSize: FS.xs, color: T.textFaint, marginBottom: 8 }}>{latestPeriod ? latestPeriod.label : "Sin datos todavía"}</div>
                    <CategoryBreakdownDonut segments={finGastoVsIngreso} formatValue={v => finMoneyFmt(v, finMoneda)} totalLabel="Movido este período" emptyLabel="Registrá un gasto o ingreso para ver esta gráfica." size={130} />
                  </div>
                  {latestPeriod && (
                    <div style={{ flex: "1 1 160px", minWidth: 160, display: "flex", flexDirection: "column", justifyContent: "center", alignSelf: "stretch" }}>
                      <div style={{ fontSize: FS.xs, color: T.textMuted, fontWeight: 600, marginBottom: 6 }}>
                        {latestPeriod.balance >= 0
                          ? "Ingresaste más de lo que gastaste 🎉"
                          : "Gastaste más de lo que ingresaste"}
                      </div>
                      <div style={{ fontSize: FS.subtitle, fontWeight: 800, color: latestPeriod.balance >= 0 ? T.gain : T.loss, ...numMonoStyle }}>
                        {latestPeriod.balance >= 0 ? "+" : ""}{finMoneyFmt(latestPeriod.balance, finMoneda)}
                      </div>
                      {previousPeriod && (() => {
                        // Comparación contra el período anterior: si el balance anterior
                        // era 0, un % no tiene sentido (división por cero), así que en
                        // ese caso se muestra la diferencia en dinero en vez de %.
                        const delta = latestPeriod.balance - previousPeriod.balance;
                        const improved = delta >= 0;
                        const pct = previousPeriod.balance !== 0 ? (delta / Math.abs(previousPeriod.balance)) * 100 : null;
                        const DeltaIcon = improved ? TrendingUp : TrendingDown;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: FS.xs, fontWeight: 700, color: improved ? T.gain : T.loss }}>
                            <DeltaIcon size={12} />
                            {pct !== null ? `${improved ? "+" : ""}${pct.toFixed(0)}%` : `${improved ? "+" : ""}${finMoneyFmt(delta, finMoneda)}`}
                            <span style={{ color: T.textFaint, fontWeight: 500 }}>vs {previousPeriod.label}</span>
                          </div>
                        );
                      })()}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8, fontSize: FS.xs, ...numMonoStyle }}>
                        <span style={{ color: T.loss, fontWeight: 700 }}>Gastos: {finMoneyFmt(latestPeriod.gastosMes, finMoneda)}</span>
                        <span style={{ color: T.gain, fontWeight: 700 }}>Ingresos: {finMoneyFmt(latestPeriod.ingresosMes, finMoneda)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: "16px 18px 6px", boxShadow: T.shadow, position: "relative", overflow: "hidden" }}>
                  {/* Mismo criterio de color que el borde izquierdo de las
                      tarjetas de "Gastos - Ingresos por período" de más
                      abajo: verde si el balance del período más reciente es
                      positivo, rojo si es negativo. */}
                  <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: latestPeriod && latestPeriod.balance < 0 ? T.loss : T.gain, opacity: 0.85 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: FS.sm, fontWeight: 800, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Historial de saldo
                    </div>
                    {/* Toggle Mes/Semana: vive acá porque es lo único que
                        controla (este gráfico y las tarjetas "Gastos -
                        Ingresos" de más abajo), no al lado del toggle de
                        moneda arriba, que no tiene relación con él.
                        finToggleBtnStyle es el mismo objeto que usa el
                        toggle USD/CLP, así que quedan del mismo tamaño
                        aunque vivan en lugares distintos. */}
                    <div role="group" aria-label="Granularidad del panel financiero" style={{ display: "flex", gap: 2, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, padding: 1, flexShrink: 0 }}>
                      {[["mes", "Mes"], ["semana", "Semana"]].map(([key, label]) => (
                        <button key={key} type="button" aria-pressed={finGranularity === key} onClick={() => setFinGranularity(key)}
                          style={finToggleBtnStyle(finGranularity === key)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InteractiveCurveChart
                    points={finCumulativePoints}
                    color={T.brand}
                    height={280}
                    formatValue={v => finMoneyFmt(v, finMoneda)}
                    referenceValue={0}
                    emptyLabel="A medida que guardes gastos e ingresos, acá se va a ir formando el historial de tu saldo."
                    exportFilename="historial-saldo.png"
                  />
                </div>
              </div>
            )}

            <div style={{ height: 1, background: T.border, margin: "8px 0 26px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 28 }}>
              <FinTable type="gasto" records={gastosEnRango} cats={GASTO_CATS}
                finFilterCat={finFilterCat} setFinFilterCat={setFinFilterCat}
                finFiltersOpen={finFiltersOpen} setFinFiltersOpen={setFinFiltersOpen}
                openFinForm={openFinForm} deleteFinRecord={deleteFinRecord} mesDeFecha={mesDeFecha} finMoneyFmt={finMoneyFmt}
                onManageCategories={setCatManagerType} />
              <FinTable type="ingreso" records={ingresosEnRango} cats={INGRESO_CATS}
                finFilterCat={finFilterCat} setFinFilterCat={setFinFilterCat}
                finFiltersOpen={finFiltersOpen} setFinFiltersOpen={setFinFiltersOpen}
                openFinForm={openFinForm} deleteFinRecord={deleteFinRecord} mesDeFecha={mesDeFecha} finMoneyFmt={finMoneyFmt}
                onManageCategories={setCatManagerType} />
            </div>

            {/* Recurrentes: plantillas de gasto/ingreso que se generan solas cada
                mes (día indicado) mientras estén activas. No son movimientos en
                sí — el movimiento real aparece arriba, en la tabla que
                corresponda, una vez que se genera. */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.subtitle, fontWeight: 800, color: T.text, marginBottom: 14 }}>
                <Repeat size={16} color={T.brand} /> Recurrentes
              </div>
              {recurrentes.length === 0 ? (
                <div style={{ border: `1px dashed ${T.border}`, borderRadius: RADIUS.md, padding: "18px 16px", textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
                  Sin gastos ni ingresos recurrentes configurados. Usá el botón "Recurrente" de arriba para agregar uno (arriendo, suscripción, sueldo fijo, etc.).
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                  {recurrentes.map(r => {
                    const isGasto = r.type === "gasto";
                    const color = isGasto ? T.loss : T.gain;
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, background: T.surface, padding: "10px 12px", opacity: r.activo === false ? 0.55 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: FS.sm, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div>
                          <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 2 }}>{r.categoria} · día {r.diaMes} de cada mes</div>
                        </div>
                        <div style={{ fontSize: FS.sm, fontWeight: 800, color, ...numMonoStyle, whiteSpace: "nowrap" }}>
                          {finMoneyFmt(r.valor, r.moneda)}
                        </div>
                        <button onClick={() => toggleRecActivo(r.id)} title={r.activo === false ? "Reactivar" : "Pausar"} aria-label={r.activo === false ? `Reactivar ${r.nombre}` : `Pausar ${r.nombre}`}
                          style={{ border: "none", background: "transparent", color: T.textMuted, cursor: "pointer" }}>
                          {r.activo === false ? <RotateCcw size={14} /> : <Check size={14} />}
                        </button>
                        <button onClick={() => openRecForm(r.type, r)} title="Editar" aria-label={`Editar ${r.nombre}`}
                          style={{ border: "none", background: "transparent", color: T.textMuted, cursor: "pointer" }}><Pencil size={13} /></button>
                        <button onClick={() => deleteRecRecord(r.id)} title="Borrar" aria-label={`Borrar ${r.nombre}`}
                          style={{ border: "none", background: "transparent", color: T.textMuted, cursor: "pointer" }}><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.subtitle, fontWeight: 800, color: T.text, marginBottom: 14 }}>
                <ArrowUpRight size={16} color={T.brand} /> Gastos - Ingresos <span style={{ fontSize: FS.sm, fontWeight: 500, color: T.textFaint, marginLeft: 4 }}>por {finGranularity === "mes" ? "mes" : "semana"}</span>
              </div>
              {/* finPeriods (no finMonthlyTotals): antes eran 12 tarjetas fijas todo
                  el año, la mayoría en $0. Ahora solo existen las tarjetas de
                  períodos que ya tienen al menos un gasto o ingreso guardado — la
                  lista crece sola a medida que se cargan más registros. */}
              {finPeriods.length === 0 ? (
                <div style={{ border: `1px dashed ${T.border}`, borderRadius: RADIUS.md, padding: "22px 16px", textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
                  Todavía no hay gastos ni ingresos registrados. Las tarjetas por {finGranularity === "mes" ? "mes" : "semana"} van a aparecer acá a medida que guardes movimientos.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {finPeriods.map(m => (
                    <div key={m.key} style={{ border: `1px solid ${T.border}`, borderLeft: `3px solid ${m.balance >= 0 ? T.gain : T.loss}`, borderRadius: RADIUS.md, background: T.surface, padding: "14px 16px" }}>
                      <div style={{ fontSize: FS.base, fontWeight: 800, color: T.text, marginBottom: 8 }}>{m.label}</div>
                      <div style={{ fontSize: FS.sm, fontWeight: 700, color: T.loss, ...numMonoStyle }}>Gastos: {finMoneyFmt(m.gastosMes, finMoneda)}</div>
                      <div style={{ fontSize: FS.sm, fontWeight: 700, color: T.gain, ...numMonoStyle, marginTop: 3 }}>Ingresos: {finMoneyFmt(m.ingresosMes, finMoneda)}</div>
                      <div style={{ fontSize: FS.sm, fontWeight: 800, color: m.balance >= 0 ? T.gain : T.loss, ...numMonoStyle, marginTop: 3, paddingTop: 6, borderTop: `1px solid ${T.border}` }}>Balance: {finMoneyFmt(m.balance, finMoneda)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal simple para crear/editar un gasto o ingreso */}
            {finForm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: Z.modal, padding: "24px 16px", overflowY: "auto" }}
                onClick={() => setFinForm(null)}>
                <div ref={finFormModalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="fin-form-title" style={{ width: "100%", maxWidth: 420, background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, padding: 20, boxShadow: T.shadowLg, outline: "none" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div id="fin-form-title" style={{ fontSize: FS.subtitle, fontWeight: 800, color: T.text }}>
                      {finForm.editId ? "Editar" : "Nuevo"} {finForm.type === "gasto" ? "gasto" : "ingreso"}
                    </div>
                    <button onClick={() => setFinForm(null)} aria-label="Cerrar" style={{ border: "none", background: "transparent", color: T.textFaint, cursor: "pointer" }}><X size={18} /></button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Nombre
                      <input autoFocus value={finForm.nombre} onChange={e => setFinForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder={finForm.type === "gasto" ? "Ej. Supermercado" : "Ej. Sueldo"}
                        style={fieldStyle()} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Fecha
                      <input type="date" value={finForm.fecha} onChange={e => setFinForm(f => ({ ...f, fecha: e.target.value }))}
                        style={fieldStyle()} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Valor
                      <input type="number" step="0.01" value={finForm.valor} onChange={e => setFinForm(f => ({ ...f, valor: e.target.value }))}
                        placeholder="0.00"
                        style={fieldStyle(numMonoStyle)} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Categoría
                      <select value={finForm.categoria} onChange={e => setFinForm(f => ({ ...f, categoria: e.target.value }))}
                        style={fieldStyle()}>
                        {(finForm.type === "gasto" ? GASTO_CATS : INGRESO_CATS).map(c => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Moneda
                      <select value={finForm.moneda} onChange={e => setFinForm(f => ({ ...f, moneda: e.target.value }))}
                        style={fieldStyle()}>
                        {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setFinForm(null)}
                      style={{ flex: 1, padding: "9px 0", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontWeight: 700, fontSize: FS.base }}>
                      Cancelar
                    </button>
                    <button onClick={saveFinRecord}
                      style={{ flex: 1, ...S.button("primary"), padding: "9px 0" }}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de gestión de categorías: agregar/eliminar categorías de
                gasto o ingreso. Se abre desde el ícono de "Tag" en el header de
                cada tabla (FinTable). */}
            {catManagerType && (() => {
              const isGasto = catManagerType === "gasto";
              const cats = isGasto ? GASTO_CATS : INGRESO_CATS;
              const color = isGasto ? T.loss : T.gain;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: Z.modal, padding: "24px 16px", overflowY: "auto" }}
                  onClick={() => { setCatManagerType(null); setNewCatInput(""); }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="cat-manager-title" style={{ width: "100%", maxWidth: 380, background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, padding: 20, boxShadow: T.shadowLg, outline: "none" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div id="cat-manager-title" style={{ fontSize: FS.subtitle, fontWeight: 800, color: T.text }}>
                        Categorías de {isGasto ? "gasto" : "ingreso"}
                      </div>
                      <button onClick={() => { setCatManagerType(null); setNewCatInput(""); }} aria-label="Cerrar" style={{ border: "none", background: "transparent", color: T.textFaint, cursor: "pointer" }}><X size={18} /></button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
                      {cats.map(c => {
                        const CatIcon = FIN_CAT_ICONS[c];
                        return (
                          <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                            {CatIcon ? <CatIcon size={13} color={color} /> : null}
                            <span style={{ flex: 1, fontSize: FS.sm, color: T.text, fontWeight: 600 }}>{c}</span>
                            <button onClick={() => removeFinCategory(catManagerType, c)} disabled={cats.length <= 1}
                              title={cats.length <= 1 ? "Debe quedar al menos una categoría" : "Eliminar"} aria-label={`Eliminar categoría ${c}`}
                              style={{ border: "none", background: "transparent", color: cats.length <= 1 ? T.textFaint : T.textMuted, cursor: cats.length <= 1 ? "default" : "pointer" }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input autoFocus value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { addFinCategory(catManagerType, newCatInput); setNewCatInput(""); } }}
                        placeholder="Nueva categoría" style={{ flex: 1, ...fieldStyle() }} />
                      <button onClick={() => { addFinCategory(catManagerType, newCatInput); setNewCatInput(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 14px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.surfaceAlt, color, cursor: "pointer", fontWeight: 700, fontSize: FS.sm }}>
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal para crear/editar una plantilla de gasto o ingreso recurrente */}
            {recForm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: Z.modal, padding: "24px 16px", overflowY: "auto" }}
                onClick={() => setRecForm(null)}>
                <div ref={recFormModalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="rec-form-title" style={{ width: "100%", maxWidth: 420, background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.md, padding: 20, boxShadow: T.shadowLg, outline: "none" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div id="rec-form-title" style={{ fontSize: FS.subtitle, fontWeight: 800, color: T.text }}>
                      {recForm.id ? "Editar" : "Nuevo"} recurrente
                    </div>
                    <button onClick={() => setRecForm(null)} aria-label="Cerrar" style={{ border: "none", background: "transparent", color: T.textFaint, cursor: "pointer" }}><X size={18} /></button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div role="group" aria-label="Tipo de recurrente" style={{ display: "flex", gap: 2, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, padding: 1, alignSelf: "flex-start" }}>
                      {[["gasto", "Gasto"], ["ingreso", "Ingreso"]].map(([key, label]) => (
                        <button key={key} type="button" aria-pressed={recForm.type === key}
                          onClick={() => setRecForm(f => ({ ...f, type: key, categoria: key === "gasto" ? GASTO_CATS[0] : INGRESO_CATS[0] }))}
                          style={finToggleBtnStyle(recForm.type === key)}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Nombre
                      <input autoFocus value={recForm.nombre} onChange={e => setRecForm(f => ({ ...f, nombre: e.target.value }))}
                        placeholder={recForm.type === "gasto" ? "Ej. Arriendo" : "Ej. Sueldo"}
                        style={fieldStyle()} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Valor
                      <input type="number" step="0.01" value={recForm.valor} onChange={e => setRecForm(f => ({ ...f, valor: e.target.value }))}
                        placeholder="0.00" style={fieldStyle(numMonoStyle)} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Día del mes
                      <input type="number" min="1" max="31" value={recForm.diaMes} onChange={e => setRecForm(f => ({ ...f, diaMes: e.target.value }))}
                        style={fieldStyle(numMonoStyle)} />
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Categoría
                      <select value={recForm.categoria} onChange={e => setRecForm(f => ({ ...f, categoria: e.target.value }))}
                        style={fieldStyle()}>
                        {(recForm.type === "gasto" ? GASTO_CATS : INGRESO_CATS).map(c => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Moneda
                      <select value={recForm.moneda} onChange={e => setRecForm(f => ({ ...f, moneda: e.target.value }))}
                        style={fieldStyle()}>
                        {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setRecForm(null)}
                      style={{ flex: 1, padding: "9px 0", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontWeight: 700, fontSize: FS.base }}>
                      Cancelar
                    </button>
                    <button onClick={saveRecRecord}
                      style={{ flex: 1, ...S.button("primary"), padding: "9px 0" }}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Estas 4 vistas se cargan bajo demanda (React.lazy) para no sumar su
          peso al bundle inicial: el usuario solo descarga el código de
          Statistics/Compare/Mindset/Gallery si realmente abre esa pestaña. */}
      <Suspense fallback={<TabSkeleton tab={tab} />}>
        {tab === "stats" && <StatisticsView allTrades={currentTrades} accentColor={accentColor} setupsList={setupsList} accountSize={accounts[account].size} />}
        {tab === "compare" && <AccountComparisonView trades={trades} accountOrder={accountOrder} accentColor={accentColor} />}
        {tab === "mindset" && (
          <MindsetView trades={currentTrades} accentColor={accentColor} entries={mindsetEntries} setEntries={setMindsetEntries}
            checklistItems={mindsetChecklistItems} setChecklistItems={setMindsetChecklistItems}
            routineChecklist={routineChecklist} setRoutineChecklist={setRoutineChecklist}
            routineData={tradingRoutine} setRoutineData={setTradingRoutine}
            lessons={dailyLessons} setLessons={setDailyLessons} />
        )}
        {tab === "gallery" && <GalleryView trades={currentTrades} accentColor={accentColor} onTradeClick={t => setDetailTrade(t)} accountSize={accounts[account].size} />}
      </Suspense>
      {tab === "add" && !showForm && (
        <div>
          {!editId && (
            <div role="radiogroup" aria-label="Modo de carga" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button type="button" role="radio" aria-checked={quickEntryMode} onClick={() => setQuickEntryMode(true)}
                style={{ ...S.button(quickEntryMode ? "primary" : "secondary", accentColor), padding: "6px 14px", fontSize: FS.sm }}>
                <Zap size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Rápido
              </button>
              <button type="button" role="radio" aria-checked={!quickEntryMode} onClick={() => setQuickEntryMode(false)}
                style={{ ...S.button(!quickEntryMode ? "primary" : "secondary", accentColor), padding: "6px 14px", fontSize: FS.sm }}>
                Completo
              </button>
            </div>
          )}
          {showQuickForm ? (
            <QuickTradeForm form={form} setForm={setForm} onSave={() => saveTrade({ reviewCompleted: false })} onCancel={() => setTab("calendar")} accentColor={accentColor} accountLabel={accountLabel} accountSize={accounts[account].size} defaultRiskPct={accounts[account].riskPct} setupsList={setupsList} setSetupsList={setSetupsList} instrumentSpecs={instrumentSpecs} setInstrumentSpecs={setInstrumentSpecs} />
          ) : (
            <TradeForm form={form} setForm={setForm} onSave={() => saveTrade({ reviewCompleted: true })} onCancel={() => setTab("calendar")} accentColor={accentColor} editId={editId} accountLabel={accountLabel} accountSize={accounts[account].size} defaultRiskPct={accounts[account].riskPct} reasonsList={reasonsList} setReasonsList={setReasonsList} setupsList={setupsList} setSetupsList={setSetupsList} errorsList={errorsList} setErrorsList={setErrorsList} instrumentSpecs={instrumentSpecs} setInstrumentSpecs={setInstrumentSpecs} />
          )}
        </div>
      )}
      </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: Z.modal, padding: "24px 16px", overflowY: "auto" }}
          onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); }}>
          <div ref={tradeFormModalRef} tabIndex={-1} className="hz-modal-in" role="dialog" aria-modal="true" aria-labelledby="tradeform-title" style={{ width: "100%", maxWidth: 580, outline: "none" }} onClick={e => e.stopPropagation()}>
            {!editId && (
              <div role="radiogroup" aria-label="Modo de carga" style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button type="button" role="radio" aria-checked={quickEntryMode} onClick={() => setQuickEntryMode(true)}
                  style={{ ...S.button(quickEntryMode ? "primary" : "secondary", accentColor), padding: "6px 14px", fontSize: FS.sm }}>
                  <Zap size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Rápido
                </button>
                <button type="button" role="radio" aria-checked={!quickEntryMode} onClick={() => setQuickEntryMode(false)}
                  style={{ ...S.button(!quickEntryMode ? "primary" : "secondary", accentColor), padding: "6px 14px", fontSize: FS.sm }}>
                  Completo
                </button>
              </div>
            )}
            {showQuickForm ? (
              <QuickTradeForm form={form} setForm={setForm} onSave={() => saveTrade({ reviewCompleted: false })}
                onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); }}
                accentColor={accentColor} accountLabel={accountLabel} accountSize={accounts[account].size} defaultRiskPct={accounts[account].riskPct} setupsList={setupsList} setSetupsList={setSetupsList} instrumentSpecs={instrumentSpecs} setInstrumentSpecs={setInstrumentSpecs} />
            ) : (
              <TradeForm form={form} setForm={setForm} onSave={() => saveTrade({ reviewCompleted: true })}
                onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); }}
                accentColor={accentColor} editId={editId} accountLabel={accountLabel} accountSize={accounts[account].size} defaultRiskPct={accounts[account].riskPct} reasonsList={reasonsList} setReasonsList={setReasonsList} setupsList={setupsList} setSetupsList={setSetupsList} errorsList={errorsList} setErrorsList={setErrorsList} instrumentSpecs={instrumentSpecs} setInstrumentSpecs={setInstrumentSpecs} />
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        onCancel={() => setConfirmDialog(null)}
      />
      <UndoToast toast={undoToast} onUndo={undoLastAction} onDismiss={dismissUndo} />

      <NewAccountOnboardingModal
        modal={newAccountModal}
        accountOrder={accountOrder}
        onCreate={createSubAccount}
        onCancel={() => setNewAccountModal(null)}
      />
      <ShortcutsHelpModal open={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />
      <RemindersModal open={remindersOpen} onClose={() => setRemindersOpen(false)}
        reminders={reminders} setReminders={setReminders}
        permission={reminderPermission} requestPermission={requestReminderPermission} />
      <OnboardingTourModal open={onboardingOpen} onClose={() => { markOnboardingSeen(); setOnboardingOpen(false); }} accentColor={accentColor} />
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} commands={paletteCommands} />
      <SyncConflictModal conflicts={cloud.conflicts} onResolve={handleConflictResolve} />

      <TradeDetailModal trade={detailTrade} onClose={() => setDetailTrade(null)} accentColor={accentColor} />

      <DayTradesModal
        date={dayModalDate}
        trades={dayModalDate ? (byDate[dayModalDate] || []) : []}
        onClose={() => setDayModalDate(null)}
        onAddNew={(date) => { setDayModalDate(null); openNew(date); }}
        onTradeClick={(t) => setDetailTrade(t)}
        onEditTrade={(t) => { setDayModalDate(null); openEdit(t); }}
        onDeleteTrade={(id) => deleteTrade(id)}
        accentColor={accentColor}
        marketNote={dayModalDate ? marketNotes[dayModalDate] : null}
        onSaveMarketNote={(date, note) => setMarketNotes(prev => ({ ...prev, [date]: note }))}
      />
      </div>
    </div>
  );
});

function TradingJournalInner(props) {
  return (
    <JournalErrorBoundary>
      <TradingJournalInnerImpl {...props} />
    </JournalErrorBoundary>
  );
}

export { TradingJournalInner };
