// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, UI_FONT, GoogleFontImport } from "../../theme";

const SplashScreen = memo(function SplashScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, fontFamily: UI_FONT,
      background: `radial-gradient(900px 600px at 50% 30%, ${T.brand}1c, transparent 60%), ${T.bg}`,
    }}>
      <GoogleFontImport />
      <div className="hz-splash-pulse" style={{
        width: 52, height: 52, borderRadius: 14, overflow: "hidden", padding: 6,
        boxShadow: `0 8px 24px ${T.brand}55`, background: T.brand,
      }}>
        <img src="./logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", borderRadius: 8 }} />
      </div>
      <div style={{ fontSize: FS.base, fontWeight: 700, color: T.textMuted, letterSpacing: "0.02em" }}>Nvt · Trading Journal</div>
    </div>
  );
});


export { SplashScreen };
