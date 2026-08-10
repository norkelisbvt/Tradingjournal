import { useState } from "react";
import { DEFAULT_REASONS, DEFAULT_ERRORS, DEFAULT_INSTRUMENT_SPECS, DEMO_TRADES } from "../constants";

// Listas que el usuario puede personalizar con el tiempo: razones de entrada
// (checklist del plan), setups guardados, tags de errores de ejecución, y
// las specs por instrumento (tick value, etc. para el cálculo de position
// size). Cuarto paso del refactor del "componente gigante".
//
// Igual que en useTradeFilters.js: se verificó línea por línea que ningún
// valor local quedara fuera del hook antes de extraer (después del susto
// con "today" en la segunda extracción).
export function useConfigurableLists() {
  const [reasonsList, setReasonsList] = useState(DEFAULT_REASONS);

  const [setupsList, setSetupsList] = useState(() => {
    const seeds = new Set();
    Object.values(DEMO_TRADES).forEach(arr => arr.forEach(t => { if (t.setup) seeds.add(t.setup); }));
    return [...seeds].sort();
  });

  const [errorsList, setErrorsList] = useState(DEFAULT_ERRORS);
  const [instrumentSpecs, setInstrumentSpecs] = useState(DEFAULT_INSTRUMENT_SPECS);

  return {
    reasonsList, setReasonsList,
    setupsList, setSetupsList,
    errorsList, setErrorsList,
    instrumentSpecs, setInstrumentSpecs,
  };
}
