import { useState } from "react";
import { EMPTY_FORM } from "../constants";

// Estado de "qué se está editando o viendo" en la pestaña Trades — no son
// los datos en sí (eso sigue siendo trades/accounts, la parte más sensible
// de todas, que se deja para su propio paso aparte), sino la sesión de
// edición: el contenido del formulario mientras se completa, si el modal de
// carga está abierto, qué trade se está editando (si alguno), cuál se está
// viendo en detalle, y qué día del calendario se abrió.
//
// Sexto paso del refactor del "componente gigante". Mismo criterio que los
// anteriores: solo se mueven las declaraciones de useState, ningún useEffect
// ni función de guardado cambia de lugar.
//
// Ojo: existe un `editId` DISTINTO dentro de `finForm` (el estado del
// formulario de Finanzas) — ese es independiente y no se toca acá.
export function useTradeEditSession() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [detailTrade, setDetailTrade] = useState(null);
  const [dayModalDate, setDayModalDate] = useState(null);

  return {
    form, setForm,
    showForm, setShowForm,
    editId, setEditId,
    detailTrade, setDetailTrade,
    dayModalDate, setDayModalDate,
  };
}
