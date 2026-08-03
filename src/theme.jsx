// ─── Theme: colores, tipografía, sombras, radios, estilos compartidos (S) ───
// Extraído de TradingJournal.jsx (fase 1 de modularización). T es un objeto
// MUTABLE: sus propiedades se reescriben en cada cambio de tema (applyTheme),
// y como todo el resto de la app lo importa por referencia y lo lee en tiempo
// de render, la UI entera se actualiza sin pasar el tema por props.
// IS_DARK se exporta como "let": con ES modules esto es un binding vivo, así
// que los módulos que lo importan ven el valor actualizado apenas applyTheme()
// lo reasigna acá adentro — no hace falta pasarlo por props tampoco.

// Curva de easing única para TODO movimiento (transform, box-shadow, entradas
// de modal/tooltip/tab): antes cada transición usaba "ease" genérico del
// navegador, lo cual es sutilmente distinto según el elemento y hace que la
// app se sienta como una colección de piezas sueltas. Con una sola curva
// "decelerada" (arranca rápido, frena suave) en todos los movimientos, cada
// interacción se siente como parte del mismo sistema. Se deja "ease" plano
// solo para cambios de color/opacidad puros, donde la diferencia no se nota.
export const EASE = "cubic-bezier(0.16,1,0.3,1)";

export const LIGHT_THEME = {
  bg: "#ffffff",
  sidebar: "#fdfcff",
  surface: "#ffffff",
  surfaceAlt: "#f6f4fc",
  border: "#ece8f8",
  borderStrong: "#ddd5f2",
  text: "#1e1b2e",
  textMuted: "#6e6884",
  textFaint: "#7d739b", // antes #a099b8 (2.7:1 sobre blanco) — ahora ~4.4:1
  inputBg: "#faf9fd",
  winBg: "#f0fdf6",
  lossBg: "#fef3f4",
  shadow: "0 1px 2px rgba(30,27,46,0.04), 0 8px 24px rgba(76,29,149,0.07)",
  shadowLg: "0 2px 4px rgba(30,27,46,0.05), 0 16px 40px rgba(76,29,149,0.10)",
  shadowXl: "0 8px 16px rgba(30,27,46,0.08), 0 32px 64px rgba(76,29,149,0.16)",
  brand: "#7c3aed",
  brandSoft: "#f3edfe",
  // Tokens semánticos de ganancia/pérdida — mismo valor que se venía repitiendo
  // como literal (#16a34a / #dc2626) en decenas de puntos del archivo, ahora
  // centralizado acá para que cambiar el tono de verde/rojo de la marca (o
  // ajustarlo por accesibilidad) sea un cambio en un solo lugar.
  gain: "#16a34a",
  gainSoft: "#16a34a14",
  loss: "#dc2626",
  lossSoft: "#dc262614",
  // Tercer estado semántico (ni ganancia ni pérdida neta): gris oscuro neutro,
  // con el mismo undertone violeta que el resto de la paleta de neutros para
  // que no desentone al lado de gain/loss.
  breakeven: "#57536b",
  breakevenSoft: "#57536b14",
  // Cuarto estado semántico, separado de "brand": para banners/avisos neutros
  // (actualización disponible, información general) que no son ganancia,
  // pérdida ni la acción principal de la marca. Antes estos avisos reusaban
  // T.brand, lo que mezclaba "esto es la identidad de la app" con "esto es
  // un aviso informativo" — dos significados distintos con un solo color.
  info: "#2563eb",
  infoSoft: "#2563eb14",
  // T.warning: usado en 7 lugares de TradingJournalInner.jsx (banner de backup
  // pendiente, tag de "modo backtesting", indicador de racha máxima, estado
  // de guardado, selector de tipo de cuenta) pero nunca se había definido acá
  // — evaluaba a `undefined` en tiempo de ejecución en los siete. amber-700
  // en vez del amber-600 más habitual: amber-600 sobre blanco da ~2.9:1de
  // contraste (falla AA para texto normal), amber-700 da ~4.6:1 — mismo
  // criterio de accesibilidad que ya se usó para recalibrar textFaint arriba.
  warning: "#b45309",
  warningSoft: "#b4530914",
  // T.funded: color distintivo para cuentas de tipo "Fondeo" en el selector de
  // cuentas — antes era "#db2777" hardcodeado ahí mismo (funcionaba en claro,
  // pero no tenía equivalente para oscuro). pink-600, no choca con brand
  // (violeta), gain/loss (verde/rojo) ni info (azul).
  funded: "#db2777",
  fundedSoft: "#db277714",
  // ── Doble contraste tipo "bisel" ──────────────────────────────────────────
  // innerGlow: filo superior sutil dentro de cualquier superficie elevada
  // (tarjetas, sidebar, inputs, modales) — sumado al borde normal, da la
  // sensación de un borde con dos tonos de contraste (uno exterior, uno
  // interior) en vez de una sola línea plana. En claro, el "brillo" es un
  // blanco casi puro sobre superficies ya blancas: solo se nota como un
  // realce muy leve en el borde superior, no un cambio de color visible.
  innerGlow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  // edgeGlow: misma idea pero alineada al borde derecho del sidebar (que es
  // vertical, no horizontal) — el filo va del lado en el que el sidebar
  // realmente tiene su borde.
  edgeGlow: "inset -1px 0 0 rgba(255,255,255,0.6)",
};
// Paleta oscura con la MISMA identidad violeta que el modo claro (antes era
// un gris-azulado tipo "slate" que no combinaba con la marca #7c3aed/#a78bfa
// del resto de la app). Los neutros ahora tienen un leve undertone violeta
// (mismo matiz que LIGHT_THEME, solo invertido en luminosidad), para que
// cambiar de tema se sienta como la misma app y no como una skin distinta.
export const DARK_THEME = {
  bg: "#0d0b16",
  sidebar: "#110d1e",
  surface: "#171325",
  surfaceAlt: "#201a33",
  border: "#2f2748",
  borderStrong: "#443a66",
  text: "#ede9fe",
  textMuted: "#a79cc4",
  textFaint: "#8880ab", // antes #71678f (~3.5:1) — ahora ~5:1 sobre superficie
  inputBg: "#130f20",
  winBg: "#132a1e",
  lossBg: "#2c1620",
  shadow: "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.35)",
  shadowLg: "0 2px 4px rgba(0,0,0,0.40), 0 20px 44px rgba(0,0,0,0.45)",
  shadowXl: "0 10px 20px rgba(0,0,0,0.45), 0 40px 80px rgba(0,0,0,0.55)",
  brand: "#a78bfa",
  brandSoft: "#28204a",
  // Mismos tokens semánticos que LIGHT_THEME, un punto más luminosos para
  // mantener buen contraste sobre los fondos oscuros (#0d0b16 / #171325).
  gain: "#22c55e",
  gainSoft: "#22c55e1c",
  loss: "#f87171",
  lossSoft: "#f871711c",
  breakeven: "#9089ac",
  breakevenSoft: "#9089ac1c",
  // Mismo token "info" que LIGHT_THEME, un tono más luminoso para mantener
  // contraste sobre fondos oscuros — igual criterio que gain/loss.
  info: "#60a5fa",
  infoSoft: "#60a5fa1c",
  // Mismo criterio que gain/loss/info: un tono más luminoso que en claro para
  // mantener contraste sobre fondos oscuros. amber-400, holgado sobre #0d0b16.
  warning: "#fbbf24",
  warningSoft: "#fbbf241c",
  // pink-400 — mismo escalón (600 claro → 400 oscuro) que brand/loss/info.
  funded: "#f472b6",
  fundedSoft: "#f472b61c",
  // Mismo par de tokens que LIGHT_THEME, pero calibrados para superficies
  // oscuras: acá el "brillo" sí necesita ser sutil-pero-visible (rgba baja)
  // para leerse como un filo de luz y no como una franja gris.
  innerGlow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  edgeGlow: "inset -1px 0 0 rgba(255,255,255,0.035)",
};
// T es un objeto mutable: sus propiedades se reescriben al cambiar de tema
// (ver applyTheme) y como todos los estilos lo leen en tiempo de render, la
// UI entera se actualiza sin necesidad de pasar el tema por props.
export const T = { ...LIGHT_THEME };
// Bandera simple de "¿estamos en modo oscuro?", actualizada junto con T en
// cada cambio de tema. Se usa para un puñado de detalles que solo suman en
// oscuro (ej. el filo superior tipo "glass" de las tarjetas) y que en claro
// no aportarían nada o directamente no se verían.
export let IS_DARK = false;
export function applyTheme(mode) {
  const theme = mode === "dark" ? DARK_THEME : LIGHT_THEME;
  Object.assign(T, theme);
  IS_DARK = mode === "dark";
  // ── Reglas de CSS global que dependen del tema, actualizadas por DOM directo ──
  // Antes estas reglas vivían embebidas como template string dentro del <style>
  // que devuelve GoogleFontImport (evaluado en tiempo de render de React). El
  // problema: GoogleFontImport podía re-renderizar con el valor de T todavía
  // viejo — este useLayoutEffect que llama a applyTheme corre DESPUÉS del
  // render, así que había una carrera entre "React vuelve a renderizar el
  // <style>" y "el efecto termina de mutar T" — y el usuario tenía que forzar
  // otro render (cambiando de pestaña) para que el bloque se regenerara con
  // los colores correctos. En el medio, se sentía como si el tema "revirtiera"
  // solo. Escribir el <style> acá, de forma imperativa y en el mismo instante
  // en que cambian T/IS_DARK, elimina esa dependencia frágil del orden de
  // renders: no hace falta esperar a que ningún componente vuelva a dibujarse.
  if (typeof document !== "undefined") {
    let styleEl = document.getElementById("hz-theme-vars");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "hz-theme-vars";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      html, body { background: ${theme.bg}; margin: 0; }
      ::selection { background: ${theme.brand}33; color: ${theme.text}; }
      .hz-card:hover { box-shadow: ${theme.shadowLg}; }

      /* Borde con gradiente diagonal (doble contraste + degradé, en vez de
         un solo color plano): se dibuja con un pseudo-elemento superpuesto
         en vez de tocar la propiedad "border" real, así conviven sin
         conflicto con el borde de 1px que cada tarjeta ya trae puesto (el
         gradiente simplemente lo tapa visualmente). El truco: fondo con
         gradiente + "padding" del ancho del borde + mask que recorta todo
         menos ese anillo de 1px (mask-composite: exclude). Aplica a
         cualquier elemento con className "hz-card", "hz-sheet" o "hz-modal".
         El "position: relative" es necesario para que el pseudo-elemento
         (position: absolute) se ubique respecto a la tarjeta y no a un
         ancestro lejano. */
      .hz-card, .hz-sheet, .hz-modal { position: relative; }
      .hz-card::before, .hz-sheet::before, .hz-modal::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, ${theme.border}, ${theme.borderStrong});
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        box-shadow: 0 0 0 1px ${theme.brand}, 0 0 0 4px ${theme.brand}2a !important;
      }
      .hz-skel { background: linear-gradient(90deg, ${theme.surfaceAlt} 25%, ${theme.border} 50%, ${theme.surfaceAlt} 75%); }
      * { scrollbar-color: ${theme.borderStrong} transparent; }
      ::-webkit-scrollbar-thumb { background-color: ${theme.borderStrong}; }
      ::-webkit-scrollbar-thumb:hover { background-color: ${theme.brand}; }
      .hz-sidebar-wrap:hover .hz-sidebar { box-shadow: ${theme.shadowLg}; }
      .hz-tip {
        background: ${theme.sidebar}; color: ${theme.text};
        border: 1px solid ${theme.border};
        box-shadow: ${theme.shadowLg};
      }
    `;
  }
}
// xs = micro-labels/eyebrows · sm = texto secundario y celdas de tabla ·
// base = texto por defecto · lg = subtítulos/títulos de tarjeta · subtitle =
// encabezados de subsección (ej. "Gastos"/"Ingresos") · title = encabezados de
// sección de página completa (ej. "Panel financiero") · xl = cifras destacadas ·
// hero = título principal de pantalla (ej. "Trading Dashboard").
// subtitle/title/hero fueron agregados acá: TradingJournalInner.jsx ya los
// referencia (venían de FS_HERO/FS_SECTION y un par de tamaños sueltos de la
// versión pre-modularización) pero nunca se habían sumado a este objeto, así
// que hasta ahora esos fontSize resolvían a `undefined`.
export const FS = { xs: 10, sm: 11.5, base: 13, lg: 15, subtitle: 18, title: 20, xl: 24, hero: 30 };
// Fuente principal de la interfaz: Inter (vía Google Fonts, con fallback al
// stack del sistema si no llega a cargar). Reemplaza el -apple-system plano
// por una tipografía con más carácter y mejor tabular figures para un
// acabado más "premium". Se inyecta una sola vez desde el contenedor raíz.
export const UI_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
// Se llama desde 3 pantallas distintas (splash, PIN, app principal) que se
// montan una después de la otra, nunca a la vez. Antes cada montaje repetía
// un @import dentro de un <style>, que es render-blocking (el navegador no
// pinta esa hoja de estilos hasta resolver la fuente) y podía repetir el
// parpadeo de fuente de sistema → Inter en cada transición de pantalla.
// Ahora los <link> de Google Fonts se insertan UNA sola vez en <head> (se
// controla con un flag en window), y se cargan con preconnect + rel=stylesheet
// (no bloqueante, se resuelve en paralelo con el resto de la carga).
function useGoogleFontLinks() {
  if (typeof document === "undefined") return;
  if (document.getElementById("hz-font-links")) return;
  const marker = document.createElement("div");
  marker.id = "hz-font-links";
  marker.style.display = "none";
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "anonymous";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
  document.head.append(preconnect1, preconnect2, stylesheet);
  document.head.appendChild(marker);
}
export function GoogleFontImport() {
  useGoogleFontLinks();
  return (
    <style>{`
      /* Pulido tipográfico: antialiasing consistente entre navegadores y
         renderizado optimizado para texto, para que Inter se vea tan nítida
         como en apps nativas en vez de con el aliasing más tosco que aplica
         Chrome/Firefox por defecto. */
      /* Fondo de página forzado a blanco: sin esto, el "gutter" del scrollbar
         (y cualquier margen del documento) puede mostrar el negro por
         defecto del shell de la app (Electron/webview) en vez del blanco
         de la interfaz.
         NOTA: la regla real "html, body { background }" ahora vive en el
         <style id="hz-theme-vars"> que escribe applyTheme() directo por DOM
         (ver theme.jsx) — así se actualiza en el instante exacto del cambio
         de tema, sin depender de que este componente vuelva a renderizar. */

      html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }

      /* Color de selección de texto de marca (ver hz-theme-vars para el valor
         real, que depende del tema activo). */

      .hz-card { transition: transform 0.28s ${EASE}, box-shadow 0.28s ${EASE}, border-color 0.18s ease; }
      .hz-card:hover { transform: translateY(-4px) scale(1.006); }

      /* Los controles nativos (button/input/select/textarea) no heredan la
         tipografía del body por defecto en la mayoría de los navegadores —
         sin esto, la mitad de los botones y campos de la app quedaban con
         la fuente del sistema en vez de Inter. */
      button, input, select, textarea { font-family: inherit; }

      /* Feedback de hover/press unificado para TODOS los botones de la app
         de una sola vez (son 45+ botones estilados individualmente; esto da
         consistencia sin tener que tocar cada uno). Usa filter/transform,
         que no pisa los estilos inline (background, color, etc.) que ya
         tiene cada botón. */
      button:not(:disabled) { cursor: pointer; transition: filter 0.12s ease, transform 0.18s ${EASE}, box-shadow 0.15s ease; }
      button:hover:not(:disabled) { filter: brightness(0.96); transform: translateY(-1px); }
      button:active:not(:disabled) { transform: scale(0.97) translateY(0); transition-duration: 0.08s; }
      button:disabled { cursor: not-allowed; opacity: 0.55; }

      /* Anillo de foco visible (accesibilidad + pulido): antes los inputs
         tenían outline: none sin ningún reemplazo, así que navegar con
         teclado no mostraba dónde estabas parado. El box-shadow real (que
         depende del color de marca del tema) vive en hz-theme-vars. */
      button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        outline: none;
      }

      /* Transición de contenido al cambiar de pestaña/cuenta/mes, en vez del
         salto seco de antes. */
      @keyframes hzFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
      .hz-tab-fade { animation: hzFadeIn 0.22s ${EASE}; }
      /* Entrada escalonada: cada tarjeta de nivel superior de la pestaña activa
         aparece con un pequeño delay respecto a la anterior (40ms), en vez de
         todas juntas de golpe — da la sensación de un dashboard "vivo". Se
         limita a los primeros 10 hijos para no demorar contenido largo (tablas
         con muchas filas, por ejemplo). */
      .hz-tab-fade > * { animation: hzFadeIn 0.35s ${EASE} both; }
      .hz-tab-fade > *:nth-child(1) { animation-delay: 0ms; }
      .hz-tab-fade > *:nth-child(2) { animation-delay: 40ms; }
      .hz-tab-fade > *:nth-child(3) { animation-delay: 80ms; }
      .hz-tab-fade > *:nth-child(4) { animation-delay: 120ms; }
      .hz-tab-fade > *:nth-child(5) { animation-delay: 160ms; }
      .hz-tab-fade > *:nth-child(6) { animation-delay: 200ms; }
      .hz-tab-fade > *:nth-child(7) { animation-delay: 240ms; }
      .hz-tab-fade > *:nth-child(n+8) { animation-delay: 280ms; }

      /* Brillo/shimmer diagonal para botones "primarios" (fondo sólido: CTAs
         como "Guardar", "+ Registrar trade", etc.). No toca el background
         real del botón (accentColor, T.brand, colores de danger/warning...):
         es una franja semi-transparente que recorre el botón en diagonal al
         pasar el mouse, superpuesta con un pseudo-elemento y recortada con
         overflow:hidden. Se activa agregando className="hz-shimmer" a
         cualquier botón de fondo sólido. */
      .hz-shimmer { position: relative; overflow: hidden; }
      .hz-shimmer::after {
        content: "";
        position: absolute;
        top: 0; left: -75%;
        width: 45%; height: 100%;
        background: linear-gradient(115deg, transparent, rgba(255,255,255,0.38), transparent);
        transform: skewX(-20deg);
        transition: left 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .hz-shimmer:hover::after { left: 130%; }

      /* Shimmer para los placeholders de carga (ver componente Skeleton). El
         gradiente de fondo (que depende del tema) vive en hz-theme-vars. */
      @keyframes hzShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .hz-skel {
        background-size: 200% 100%;
        animation: hzShimmer 1.3s ease-in-out infinite;
        border-radius: ${RADIUS.sm}px;
      }

      /* Dibujado progresivo de los gráficos de curva (equity, tendencia
         mensual, etc. — todos comparten InteractiveCurveChart). La línea se
         traza de punta a punta, el área hace fade-in detrás, y el punto
         final "aparece" al terminar — el efecto típico de dashboards de
         trading premium en vez de un gráfico estático. */
      @keyframes hzDrawLine { to { stroke-dashoffset: 0; } }
      .hz-draw-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: hzDrawLine 1.1s cubic-bezier(0.4,0,0.2,1) forwards; }
      @keyframes hzFadeArea { to { opacity: 1; } }
      .hz-draw-area { opacity: 0; animation: hzFadeArea 0.9s ease 0.35s forwards; }
      @keyframes hzDotPop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
      .hz-draw-dot { opacity: 0; transform-origin: center; transform-box: fill-box; animation: hzDotPop 0.35s ease 1.05s forwards; }

      /* Toast de éxito/deshacer: entra deslizando, y el ícono de check hace
         un pequeño "pop" al aparecer. */
      @keyframes hzToastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      @keyframes hzCheckPop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }

      /* ── Responsive básico ──────────────────────────────────────────────
         La app fue construida como layout fijo de escritorio (sidebar 116px +
         grids con columnas en px). Estas reglas la hacen usable en pantallas
         de tablet/notebook chica sin tocar cada componente uno por uno. */
      @media (max-width: 1180px) {
        .hz-dash-grid { grid-template-columns: 1fr 1fr !important; }
        .hz-dash-grid > *:last-child { grid-column: 1 / -1; }
      }
      @media (max-width: 860px) {
        .hz-app-shell { flex-direction: column; }
        .hz-sidebar-wrap { width: 100% !important; height: auto !important; position: relative !important; }
        .hz-sidebar { width: 100% !important; height: auto !important; inset: auto !important; top: auto !important; left: auto !important; flex-direction: row !important; position: relative !important; padding: 8px 10px !important; overflow-x: auto; justify-content: flex-start; }
        .hz-sidebar > div:first-child { margin-bottom: 0 !important; margin-right: 10px; }
        .hz-sidebar > div:last-child { margin-top: 0 !important; margin-left: auto; flex-direction: row !important; }
        .hz-main-content { padding: 16px !important; }
        .hz-dash-grid { grid-template-columns: 1fr !important; }
        .hz-dash-grid > *:last-child { grid-column: auto !important; }
        /* En mobile la fila de tabs pasa a horizontal; el tooltip lateral
           está pensado para el riel vertical (aparece a la derecha del
           ícono), así que se oculta acá en vez de reescribir su posición
           para el eje horizontal — en touch tampoco hay hover que lo abra. */
        .hz-tip { display: none !important; }
      }

      /* Scrollbar propio: delgado, gris, siempre visible (no aparece/desaparece
         al pasar el mouse) — track transparente para que se vea el fondo de
         la página, no una franja oscura. Los colores (que dependen del tema)
         viven en hz-theme-vars. */
      * { scrollbar-width: thin; }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; transition: background-color 0.15s ease; }
      ::-webkit-scrollbar-corner { background: transparent; }

      /* Sidebar de ancho fijo: el riel no se expande al pasar el mouse, así
         que cada botón muestra su nombre en un tooltip lateral (.hz-tip) en
         vez de una etiqueta de texto permanente. El tooltip nace pegado al
         botón (para no correrse verticalmente al agrandarse) y se desliza
         un poco al aparecer. */
      .hz-sidebar-wrap { position: relative; flex-shrink: 0; }
      .hz-sidebar { transition: box-shadow 0.22s ${EASE}; }
      .hz-nav-btn { position: relative; }
      .hz-tip {
        position: absolute; left: calc(100% + 10px); top: 50%;
        transform: translateY(-50%) translateX(-4px);
        padding: 5px 10px; border-radius: 7px; font-size: ${FS.sm}px; font-weight: 600;
        white-space: nowrap; opacity: 0; pointer-events: none; z-index: 30;
        transition: opacity 0.14s ease, transform 0.14s ${EASE};
      }
      .hz-nav-btn:hover .hz-tip { opacity: 1; transform: translateY(-50%) translateX(0); }

      /* Tooltips propios (reemplazan el title nativo del navegador) para
         botones de solo-ícono fuera del riel de navegación. */
      @keyframes hzTooltipIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
      .hz-tooltip { animation: hzTooltipIn 0.12s ${EASE}; }

      /* Glow/pulso muy sutil sobre una cifra cuando cambia de signo (ej.
         P&L pasa de positivo a negativo o viceversa) — llama la atención
         un instante sin ser un efecto ruidoso ni permanente. */
      @keyframes hzValuePulse {
        0% { filter: drop-shadow(0 0 0 currentColor); opacity: 0.35; }
        40% { filter: drop-shadow(0 0 7px currentColor); opacity: 1; }
        100% { filter: drop-shadow(0 0 0 currentColor); opacity: 1; }
      }
      .hz-value-pulse { animation: hzValuePulse 0.7s ease; }

      /* Pulso suave del logo en la pantalla de carga inicial (splash),
         para que no se sienta congelada mientras se lee el respaldo local. */
      @keyframes hzSplashPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.85; }
      }
      .hz-splash-pulse { animation: hzSplashPulse 1.4s ease-in-out infinite; }

      /* Caída del confetti: baja con una leve rotación y se desvanece cerca
         del final, para que no corte de golpe. */
      @keyframes hzConfettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(160px) rotate(340deg); opacity: 0; }
      }

      /* Sacudida horizontal breve al ingresar un PIN incorrecto — refuerza el
         error además del texto y el color rojo de los puntos. */
      @keyframes hzShake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-4px); }
        40%, 60% { transform: translateX(4px); }
      }
      .hz-pin-shake { animation: hzShake 0.5s cubic-bezier(0.36,0.07,0.19,0.97); }

      /* Entrada compartida por TODOS los modales/diálogos de la app (confirmar
         borrado, detalle de trade, formulario, onboarding de cuenta, atajos...).
         Antes cada uno aparecía de golpe sin transición — solo la command
         palette y el toast tenían animación propia. Ahora el overlay funde a
         negro translúcido + blur y el panel entra con un leve scale-up, así
         se siente como una sola familia de componentes en toda la app. */
      @keyframes hzOverlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes hzModalIn { from { opacity: 0; transform: translateY(6px) scale(0.97); } to { opacity: 1; transform: none; } }
      .hz-modal-overlay { animation: hzOverlayIn 0.18s ease; backdrop-filter: blur(6px) saturate(130%); -webkit-backdrop-filter: blur(6px) saturate(130%); }
      .hz-modal-in { animation: hzModalIn 0.2s ${EASE}; }
      @media (prefers-reduced-motion: reduce) {
        .hz-modal-overlay, .hz-modal-in, .hz-tab-fade, .hz-tab-fade > * { animation: none !important; }
      }

      /* Contador animado (count-up): sin animación de entrada propia, solo
         se beneficia de la fuente tabular ya usada en toda la app para que
         los dígitos no salten de ancho mientras cuentan. */
      .hz-countup { font-variant-numeric: tabular-nums; }

      /* Paleta de comandos (Cmd/Ctrl+K). */
      @keyframes hzPaletteIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
      .hz-palette { animation: hzPaletteIn 0.16s ${EASE}; }
    `}</style>
  );
}
// Fuente monoespaciada/tabular reservada SOLO para cifras (precios, P&L, R:R,
// %, conteos): los dígitos alinean en columna y son fáciles de comparar.
// ─── Escala de z-index ──────────────────────────────────────────────────────
// Antes vivía local dentro de TradingJournalInner.jsx, así que ningún otro
// componente (ej. ConfirmDialog) podía usarla y terminaba inventando números
// mágicos propios. Ahora es un token compartido como RADIUS/FS/S.
// modalTop: para un modal que se abre POR ENCIMA de otro modal ya visible
// (ej. confirmar borrado de un trade mientras el detalle del trade está
// abierto) — necesita superar Z.modal, no igualarlo.
export const Z = {
  stickyHeader: 2,
  sidebarRailInner: 25,
  sidebarWrap: 40,
  menuOverlay: 40,
  dropdown: 50,
  modal: 100,
  modalTop: 200,
  grainTexture: 9999,
};
export const MONO_FONT = '"JetBrains Mono", "SF Mono", "Roboto Mono", ui-monospace, monospace';
export const numMonoStyle = { fontFamily: MONO_FONT, fontVariantNumeric: "tabular-nums" };
// ─── Escala de border-radius ───────────────────────────────────────────────
// 4 pasos únicos para todo el redondeo de la app (antes había ~10 valores
// sueltos entre 5 y 16px repartidos sin criterio, lo que hacía que cada
// componente se sintiera redondeado "a su manera"). sm = controles pequeños
// (inputs, botones, chips) · md = superficies intermedias (sheet, dropdowns)
// · lg = tarjetas y contenedores principales · pill = totalmente redondeado
// (tags/badges).
export const RADIUS = { sm: 8, md: 12, lg: 18, pill: 999 };
export const S = {
  get card() { return { background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS.lg, boxShadow: `${T.shadow}, ${T.innerGlow}`, transition: `box-shadow 0.22s ${EASE}, border-color 0.18s ease, transform 0.22s ${EASE}` }; },
  // Misma base visual que .card, pero con la sombra profunda (shadowXl): los
  // modales deben leerse claramente "por encima" de las tarjetas del fondo,
  // no con la misma elevación que una tarjeta en reposo.
  get modal() { return { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: `${T.shadowXl}, ${T.innerGlow}` }; },
  // Superficie de "hoja de cálculo" para la tabla principal de trades: menos
  // redondeada y sin sombra, para que se lea como grilla de datos densa y no
  // como otra tarjeta más entre las tarjetas de resumen.
  get sheet() { return { background: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: RADIUS.md, boxShadow: `${T.shadow}, ${T.innerGlow}` }; },
  get sheetHead() { return { background: T.surfaceAlt, borderBottom: `2px solid ${T.borderStrong}` }; },
  get input() { return { width: "100%", padding: "8px 10px", borderRadius: RADIUS.sm, border: `1px solid ${T.border}`, background: T.inputBg, color: T.text, fontSize: FS.base, outline: "none", boxSizing: "border-box", boxShadow: T.innerGlow, transition: `border-color 0.15s ease, box-shadow 0.15s ${EASE}` }; },
  get label() { return { display: "block", fontSize: FS.xs, fontWeight: 600, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }; },
  tag: (color) => ({ display: "inline-block", padding: "2px 9px", borderRadius: RADIUS.pill, fontSize: FS.xs, fontWeight: 700, background: color + "18", color, border: `1px solid ${color}33`, transition: "background 0.15s ease" }),
  // Helper centralizado de botones. Antes cada botón de la app definía su
  // propio padding/radio/color a mano (45+ variantes ligeramente distintas);
  // esto da un punto único de verdad para los 4 estilos que realmente se
  // repiten. variant: "primary" (acción principal, fondo sólido) ·
  // "secondary" (borde, fondo transparente) · "danger" (acciones destructivas)
  // · "ghost" (sin borde, para acciones terciarias/íconos).
  button: (variant = "primary", color = T.brand) => {
    const base = { padding: "8px 16px", borderRadius: RADIUS.sm, fontSize: FS.base, fontWeight: 700, border: "none", boxSizing: "border-box" };
    if (variant === "primary") return { ...base, background: color, color: "#fff", boxShadow: `0 2px 8px ${color}33` };
    if (variant === "secondary") return { ...base, background: T.surface, color: T.textMuted, border: `1px solid ${T.border}`, fontWeight: 600 };
    if (variant === "danger") return { ...base, background: T.loss, color: "#fff", boxShadow: `0 2px 8px ${T.loss}33` };
    if (variant === "ghost") return { ...base, background: "transparent", color: T.textMuted, fontWeight: 600, boxShadow: "none" };
    return base;
  },
};