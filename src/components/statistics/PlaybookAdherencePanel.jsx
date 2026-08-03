// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { Target } from "lucide-react";
import { T, FS, S } from "../../theme";
import { MONTHS_SHORT } from "../../constants";
import { computePlaybookAdherence } from "../../utils";

// themeMode solo se recibe para que memo() note el cambio de tema (T se lee
// del módulo de tema como objeto mutable, no como prop) — ver StatisticsView.jsx.
const PlaybookAdherencePanel = memo(function PlaybookAdherencePanel({ trades, accentColor, themeMode }) {
  const a = useMemo(() => computePlaybookAdherence(trades), [trades]);

  if (a.evaluatedCount === 0) {
    return (
      <div style={{ ...S.card, padding: 18, marginBottom: 14, textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
        Marcá razones cumplidas/ignoradas en tus trades para ver aquí tu adherencia al playbook.
      </div>
    );
  }

  return (
    <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}><Target size={14} />Playbook Score — Adherencia a la estrategia</div>
          <div style={{ fontSize: FS.sm, color: T.textMuted }}>Basado en {a.evaluatedCount} de {a.totalCount} trades con razones evaluadas</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>Promedio general</div>
          <div style={{ fontSize: FS.xl, fontWeight: 800, color: a.overall >= 70 ? T.gain : a.overall >= 40 ? "#d97706" : T.loss }}>{a.overall.toFixed(0)}%</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "end", height: 90 }}>
        {a.monthly.map(m => {
          const [y, mo] = m.month.split("-");
          const color = m.avg >= 70 ? T.gain : m.avg >= 40 ? "#d97706" : T.loss;
          return (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, color, marginBottom: 3 }}>{m.avg.toFixed(0)}%</div>
              <div style={{ width: "60%", height: `${Math.max(4, m.avg * 0.6)}px`, background: color, borderRadius: 3 }} />
              <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 4 }}>{MONTHS_SHORT[parseInt(mo) - 1]} {y.slice(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});


export { PlaybookAdherencePanel };
