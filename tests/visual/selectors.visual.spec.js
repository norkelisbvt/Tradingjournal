import { test, expect } from "@playwright/test";

// Cada entrada acá corresponde 1 a 1 con una historia real en
// src/components/trades/*.stories.jsx. Si agregás una historia nueva,
// agregala también acá (a propósito no se auto-descubren desde index.json,
// para que la lista de "qué se está vigilando visualmente" sea explícita y
// legible en este archivo, no implícita).
const STORIES = [
  { id: "trades-setupselector--default", name: "setup-selector-default" },
  { id: "trades-setupselector--sin-seleccion", name: "setup-selector-sin-seleccion" },
  { id: "trades-emotionselector--default", name: "emotion-selector-default" },
  { id: "trades-emotionselector--sin-seleccion", name: "emotion-selector-sin-seleccion" },
  { id: "trades-errortagselector--default", name: "error-tag-selector-default" },
  { id: "trades-errortagselector--sin-errores-guardados", name: "error-tag-selector-sin-errores" },
];

for (const story of STORIES) {
  test(`visual: ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    // Espera a que el root de Storybook termine de montar el componente,
    // en vez de un timeout fijo — más rápido y más confiable que sleep().
    await page.waitForSelector("#storybook-root", { state: "visible" });
    await page.waitForTimeout(150); // deja asentar transiciones/animaciones CSS cortas
    await expect(page).toHaveScreenshot(`${story.name}.png`);
  });
}
