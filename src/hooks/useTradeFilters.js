import { useState } from "react";
import { INSTRUMENTS } from "../constants";
import { toISODate } from "../utils";

// Estado de los filtros de la pestaña Trades (búsqueda libre, instrumentos
// visibles, setup, rango de fechas del gráfico) y el modo Backtesting.
// Tercer paso del refactor del "componente gigante" (ver useUIModals.js y
// useNavigationView.js para el primero y el segundo).
//
// A diferencia del grupo de Navegación, acá NO hay ningún valor local
// "suelto" que se quede fuera del hook — todo lo que vive cerca de estos 5
// useState en el archivo original son solo lecturas de estos mismos
// valores, no declaraciones nuevas. Verificado línea por línea antes de
// extraer, después del susto de la extracción anterior.
export function useTradeFilters() {
  // Búsqueda libre en la pestaña Trades (busca en notas, tags, setup e instrumento).
  const [tradeSearch, setTradeSearch] = useState("");
  const [filterInst, setFilterInst] = useState([...INSTRUMENTS]);
  const [filterSetup, setFilterSetup] = useState("All");
  const [chartDateRange, setChartDateRange] = useState({ preset: "month", customFrom: toISODate(new Date()), customTo: toISODate(new Date()) });
  const [backtestMode, setBacktestMode] = useState(false);

  return {
    tradeSearch, setTradeSearch,
    filterInst, setFilterInst,
    filterSetup, setFilterSetup,
    chartDateRange, setChartDateRange,
    backtestMode, setBacktestMode,
  };
}
