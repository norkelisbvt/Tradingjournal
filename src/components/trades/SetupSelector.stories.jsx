import { useState } from "react";
import { SetupSelector } from "./SetupSelector";

// Wrapper con estado propio: SetupSelector es un componente controlado
// (recibe `selected` + `onChange`), así que la historia necesita sostener
// ese estado ella misma para que los clicks en el panel de Storybook
// realmente marquen/desmarquen chips.
function SetupSelectorHarness({ initialSelected = [], initialList }) {
  const [selected, setSelected] = useState(initialSelected);
  const [list, setList] = useState(initialList);
  return <SetupSelector selected={selected} onChange={setSelected} setupsList={list} setSetupsList={setList} />;
}

export default {
  title: "Trades/SetupSelector",
  component: SetupSelectorHarness,
};

const SAMPLE_SETUPS = ["Breakout", "Pullback", "Reversal", "Rango", "Continuación de tendencia"];

// Estado por defecto: 2 de 5 setups marcados — el más representativo para
// capturar en el screenshot de referencia (ni vacío ni "todo marcado").
export const Default = {
  render: () => <SetupSelectorHarness initialSelected={["Breakout", "Pullback"]} initialList={SAMPLE_SETUPS} />,
};

export const SinSeleccion = {
  render: () => <SetupSelectorHarness initialSelected={[]} initialList={SAMPLE_SETUPS} />,
};
