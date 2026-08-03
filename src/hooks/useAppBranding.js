// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useEffect } from "react";
import { LIGHT_THEME } from "../theme";
import { APP_ICON_SVG } from "../constants";
import { rasterizeAppIcon, setMetaTag } from "../utils";

function useAppBranding() {
  useEffect(() => {
    document.title = "Nvt · Trading Journal";

    // Favicon (SVG, liviano y nítido en cualquier resolución de pestaña).
    const href = `data:image/svg+xml,${encodeURIComponent(APP_ICON_SVG)}`;
    let icon = document.querySelector("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.type = "image/svg+xml";
    icon.href = href;

    // Viewport correcto para mobile: ancho real del dispositivo + soporte de
    // "notch" (viewport-fit=cover) para que el header llegue hasta el borde
    // en iPhones con isla dinámica, en vez de dejar una franja del navegador.
    let viewport = document.querySelector("meta[name='viewport']");
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1, viewport-fit=cover";

    setMetaTag("description", "Diario de trading: registro de operaciones, curva de capital, estadísticas y control de mentalidad, todo en un solo lugar.");

    // Meta tags de "modo app" para cuando se agrega a la pantalla de inicio
    // (iOS y Android): oculta la barra de navegador y usa el nombre corto.
    setMetaTag("apple-mobile-web-app-capable", "yes");
    setMetaTag("mobile-web-app-capable", "yes");
    setMetaTag("apple-mobile-web-app-title", "Nvt");
    setMetaTag("apple-mobile-web-app-status-bar-style", "black-translucent");

    (async () => {
      // apple-touch-icon: PNG de 180×180, el tamaño que pide iOS. Si ya existe
      // uno con href real (por ejemplo puesto en tu index.html apuntando a
      // /apple-touch-icon.png), no lo pisamos — se respeta el del proyecto.
      let touchIcon = document.querySelector("link[rel='apple-touch-icon']");
      if (!touchIcon || !touchIcon.getAttribute("href")) {
        const icon180 = await rasterizeAppIcon(180);
        if (icon180) {
          if (!touchIcon) {
            touchIcon = document.createElement("link");
            touchIcon.rel = "apple-touch-icon";
            document.head.appendChild(touchIcon);
          }
          touchIcon.href = icon180;
        }
      }

      // Manifest de PWA: si tu index.html ya trae <link rel="manifest"
      // href="/manifest.json"> (el archivo real, con los íconos PNG servidos
      // desde /public), lo dejamos intacto. Solo generamos uno de emergencia
      // por blob: URL cuando no hay ninguno — para no perder el ícono al
      // "Agregar a pantalla de inicio" mientras el manifest real no exista.
      const existingManifest = document.querySelector("link[rel='manifest']");
      if (!existingManifest || !existingManifest.getAttribute("href")) {
        const [icon192, icon512] = await Promise.all([rasterizeAppIcon(192), rasterizeAppIcon(512)]);
        const icons = [];
        if (icon192) icons.push({ src: icon192, sizes: "192x192", type: "image/png", purpose: "any" });
        if (icon512) icons.push({ src: icon512, sizes: "512x512", type: "image/png", purpose: "any" });
        const manifest = {
          name: "Nvt · Trading Journal",
          short_name: "Nvt",
          description: "Diario de trading personal: operaciones, estadísticas y mentalidad.",
          start_url: ".",
          display: "standalone",
          background_color: LIGHT_THEME.bg,
          theme_color: LIGHT_THEME.brand,
          icons,
        };
        try {
          const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
          const manifestURL = URL.createObjectURL(blob);
          const manifestLink = existingManifest || document.createElement("link");
          manifestLink.rel = "manifest";
          manifestLink.href = manifestURL;
          if (!existingManifest) document.head.appendChild(manifestLink);
        } catch (err) {
          console.warn("No se pudo generar el manifest de PWA:", err);
        }
      }

      // Registro del Service Worker (sw.js), si el proyecto lo sirve en la
      // raíz — ver /public/sw.js. Si el archivo no existe todavía (404), el
      // registro simplemente falla en silencio y no rompe nada.
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    })();
  }, []);
}


export { useAppBranding };
