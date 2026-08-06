import { useState } from "react";
import { EmotionSelector } from "./EmotionSelector";

function EmotionSelectorHarness({ initialSelected = [] }) {
  const [selected, setSelected] = useState(initialSelected);
  return <EmotionSelector selected={selected} onChange={setSelected} />;
}

export default {
  title: "Trades/EmotionSelector",
  component: EmotionSelectorHarness,
};

// Mezcla emociones "positivas" y "negativas" a propósito — es el caso que
// más vale capturar, porque el color de cada chip depende de NEG_EMOTIONS
// (constants.js) y es justo lo que se rompería en silencio si alguien
// desincroniza esa lista de nuevo (ver el fix de hoy en EmotionSelector.jsx).
export const Default = {
  render: () => <EmotionSelectorHarness initialSelected={["confident", "fomo"]} />,
};

export const SinSeleccion = {
  render: () => <EmotionSelectorHarness initialSelected={[]} />,
};
