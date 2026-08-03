// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { AlertTriangle, AlertOctagon, AlertCircle } from "lucide-react";
import { T, FS } from "../../theme";
import { computeRiskAlerts } from "../../utils";

const RiskAlertBanner = memo(function RiskAlertBanner({ acc, trades }) {
  const alerts = useMemo(() => computeRiskAlerts(acc, trades), [acc, trades]);
  if (alerts.length === 0) return null;
  const styleFor = level => level === "breach"
    ? { bg: "#fee2e2", border: "#fecaca", color: "#991b1b", Icon: AlertOctagon }
    : level === "danger"
    ? { bg: "#fef2f2", border: "#fecaca", color: T.loss, Icon: AlertTriangle }
    : { bg: "#fffbeb", border: "#fde68a", color: "#b45309", Icon: AlertCircle };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      {alerts.map((a, i) => {
        const st = styleFor(a.level);
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, padding: "10px 14px", fontSize: FS.base, fontWeight: 600, color: st.color }}>
            <st.Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{a.text}</span>
          </div>
        );
      })}
    </div>
  );
});


export { RiskAlertBanner };
