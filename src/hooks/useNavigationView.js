import { useState, useEffect } from "react";

// Estado de "en qué parte de la app estoy parado" — el tab activo, qué
// año/mes se está mirando en Calendario/Trades, cómo se agrupa la tabla de
// trades, qué grupos están colapsados, la paginación, y la fila bajo el
// mouse (para el highlight del calendario).
//
// Segundo paso del refactor del "componente gigante" (ver hooks/useUIModals.js
// para el primero). `account` se recibe como parámetro porque el efecto de
// transición de pestaña lo necesita como dependencia, aunque la cuenta en sí
// siga viviendo en TradingJournalInner.jsx (grupo de datos core, todavía sin
// extraer) — el hook no es "dueño" de account, solo lo escucha.
export function useNavigationView(account) {
  const [tab, setTab] = useState("dashboard");
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Muestra un skeleton breve (180ms) al cambiar de pestaña, cuenta o mes
  // visualizado, en vez del salto seco de contenido que había antes. Como
  // todos los datos viven en localStorage (sin fetch real), no hay una carga
  // "de verdad" que esperar — esto es puramente para suavizar la transición
  // visual entre vistas.
  const [tabTransitioning, setTabTransitioning] = useState(false);
  useEffect(() => {
    setTabTransitioning(true);
    const timer = setTimeout(() => setTabTransitioning(false), 180);
    return () => clearTimeout(timer);
  }, [tab, account, viewMonth, viewYear]);

  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Paginación de la tabla de trades: página actual por grupo (mes/semana), para
  // no renderizar cientos de filas de una sola vez cuando hay mucho historial.
  const [tradesPage, setTradesPage] = useState({});

  // Agrupación de la vista "Trades": por mes o por semana (ISO, lunes a domingo).
  const [groupBy, setGroupBy] = useState("month");

  return {
    tab, setTab,
    tabTransitioning,
    viewYear, setViewYear,
    viewMonth, setViewMonth,
    collapsedGroups, setCollapsedGroups,
    tradesPage, setTradesPage,
    groupBy, setGroupBy,
  };
}
