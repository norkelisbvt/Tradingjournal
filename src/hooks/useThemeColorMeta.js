// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useEffect } from "react";
import { LIGHT_THEME, DARK_THEME } from "../theme";
import { setMetaTag } from "../utils";

function useThemeColorMeta(themeMode) {
  useEffect(() => {
    const color = themeMode === "dark" ? DARK_THEME.bg : LIGHT_THEME.bg;
    setMetaTag("theme-color", color);
  }, [themeMode]);
}


export { useThemeColorMeta };
