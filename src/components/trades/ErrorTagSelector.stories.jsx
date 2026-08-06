import { useState } from "react";
import { ErrorTagSelector } from "./ErrorTagSelector";

function ErrorTagSelectorHarness({ initialSelected = [], initialList }) {
  const [selected, setSelected] = useState(initialSelected);
  const [list, setList] = useState(initialList);
  return <ErrorTagSelector selected={selected} onChange={setSelected} errorsList={list} setErrorsList={setList} />;
}

export default {
  title: "Trades/ErrorTagSelector",
  component: ErrorTagSelectorHarness,
};

const SAMPLE_ERRORS = ["Moví el SL", "Entré tarde", "Sobre-apalanqué", "No respeté el plan"];

// Este es el componente que hoy no era operable con teclado (usaba
// <div onClick> anidados) — la historia con un error marcado es la más
// importante de capturar, porque valida visualmente que el chip seleccionado
// (con el ✓ y el botón ✕ de borrar) siga viéndose bien tras el fix de
// accesibilidad, no solo que funcione.
export const Default = {
  render: () => <ErrorTagSelectorHarness initialSelected={["Moví el SL"]} initialList={SAMPLE_ERRORS} />,
};

export const SinErroresGuardados = {
  render: () => <ErrorTagSelectorHarness initialSelected={[]} initialList={[]} />,
};
