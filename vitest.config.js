import { defineConfig } from "vitest/config";

// NOTA: Storybook agrega por defecto un segundo "project" acá (via
// @storybook/addon-vitest) que corre las stories como tests de interacción
// dentro de un navegador real. Se sacó a propósito: agregaba la necesidad de
// gestionar un navegador headless aparte para el comando de todos los días
// (`npx vitest run`), y el testing visual de los componentes ya está cubierto
// por Playwright en tests/visual/ (`npm run test:visual`). Si en el futuro
// se quiere sumar testing de interacción real dentro de Storybook, se puede
// reactivar como un comando aparte (`npm run test:storybook`) sin que
// interfiera con los tests unitarios rápidos de siempre.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // tests/visual/ usa @playwright/test (test() con otra firma), no
    // Vitest — corre aparte con `npx playwright test` / `npm run test:visual`.
    // Sin este exclude, Vitest intenta correrlo también y falla.
    exclude: ["**/node_modules/**", "**/dist/**", "**/storybook-static/**", "tests/visual/**"],
  },
});
