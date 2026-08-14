import { useState } from "react";
import { DEMO_TRADES, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_ORDER } from "../constants";

// Los datos REALES de la app — no hay ningún otro grupo después de este. La
// cuenta activa, todos los trades (agrupados por cuenta), la info de cada
// cuenta (balance, broker, riesgo, etc.) y el orden en que se muestran.
//
// Último paso del refactor del "componente gigante" (ver useUIModals,
// useNavigationView, useTradeFilters, useConfigurableLists,
// usePersistenceStatus, useTradeEditSession para los 6 anteriores).
//
// Mismo criterio que todos los anteriores: SOLO se extraen las 4
// declaraciones de useState. Toda la lógica de negocio real — guardar un
// trade, borrar una cuenta, sincronizar con la nube, los useMemo derivados
// (currentTrades, monthTrades, etc.) — se queda intacta en
// TradingJournalInner.jsx, sin mover ni una línea. Es, con diferencia, el
// grupo con más referencias en todo el archivo (trades sola aparece en más
// de 50 lugares), así que el riesgo real está en la revisión cuidadosa, no
// en la técnica en sí, que es idéntica a los 6 pasos anteriores.
//
// Importante para quien llame a este hook: `account` tiene que quedar
// declarado ANTES de llamar a useNavigationView(account) en
// TradingJournalInner.jsx — ese hook lo necesita como argumento.
export function useCoreData() {
  const [account, setAccount] = useState("personal-1");
  const [trades, setTrades] = useState(DEMO_TRADES);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [accountOrder, setAccountOrder] = useState(DEFAULT_ACCOUNT_ORDER);

  return {
    account, setAccount,
    trades, setTrades,
    accounts, setAccounts,
    accountOrder, setAccountOrder,
  };
}
