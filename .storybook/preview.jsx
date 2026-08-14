import React from "react";
import { applyTheme, GoogleFontImport, T } from "../src/theme";

// Aplica el mismo tema (colores + variables CSS) que usa la app real al
// arrancar — sin esto, los componentes se ven "genéricos" en vez de con la
// paleta real del journal, porque T arranca en LIGHT_THEME por defecto pero
// las reglas de CSS globales (fondo, selección de texto, etc.) recién se
// inyectan cuando applyTheme() corre.
applyTheme("light");

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // 'error': una violación de accesibilidad hace fallar el test — no solo
    // "todo" (que únicamente lo muestra en el panel sin romper nada). Con
    // esto, si algún día alguien vuelve a meter un <div onClick> sin
    // aria-pressed como el que arreglamos en ErrorTagSelector, el test lo
    // detecta solo en vez de depender de que alguien lo note a simple vista.
    a11y: {
      test: "error"
    },
    backgrounds: {
      default: "app",
      values: [{ name: "app", value: T.bg }],
    },
  },
  decorators: [
    (Story) => (
      <>
        <GoogleFontImport />
        <div style={{ padding: 24, background: T.bg, minHeight: "100vh", fontFamily: "inherit" }}>
          <Story />
        </div>
      </>
    ),
  ],
};

export default preview;
