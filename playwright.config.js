import { defineConfig, devices } from "@playwright/test";

// Corre las pruebas de regresión visual contra el build ESTÁTICO de
// Storybook (no el servidor de desarrollo) — así las capturas son
// reproducibles: siempre el mismo bundle, sin hot-reload de por medio
// cambiando algo entre corridas.
//
// Flujo:
//   1. npm run build-storybook   (genera storybook-static/)
//   2. npx playwright test       (sirve storybook-static/ y compara contra las
//                                  capturas guardadas en tests/visual/*.spec.js-snapshots/)
//
// Primera vez / después de un cambio visual intencional:
//   npx playwright test --update-snapshots
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  retries: 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://localhost:6007",
    trace: "retain-on-failure",
  },
  // Umbral de diferencia de píxeles: pequeño pero no cero, para tolerar
  // variaciones mínimas de antialiasing entre corridas sin dejar pasar
  // cambios reales.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npx http-server storybook-static -p 6007 -s",
    url: "http://localhost:6007",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
