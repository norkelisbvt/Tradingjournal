// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { Component } from "react";
import { AlertOctagon } from "lucide-react";
import { FS, UI_FONT } from "./theme";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Error no controlado en la app:", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 14, padding: 24, textAlign: "center",
          background: "#0d0b16", color: "#ede9fe", fontFamily: UI_FONT, zIndex: 2000,
        }}>
          <AlertOctagon size={40} color="#f87171" />
          <div style={{ fontSize: 20, fontWeight: 800 }}>Algo salió mal al mostrar esta pantalla</div>
          <div style={{ fontSize: FS.base, color: "#a79cc4", maxWidth: 440 }}>
            Tus trades y datos guardados están a salvo — el autoguardado corre en cada cambio, antes de que un error de la interfaz pueda afectarlo. Recargá la app para continuar.
          </div>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 6, padding: "10px 22px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: FS.base, cursor: "pointer" }}>
            Recargar la app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


export { AppErrorBoundary };
