// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useMemo, memo } from "react";
import { T, FS, numMonoStyle, S } from "../../theme";
import { computeCurrentStreak, streakTier } from "../../utils";
import { Confetti, useCelebration } from "../../charts";

const StreakMedalCard = memo(function StreakMedalCard({ trades }) {
  const { streak, type } = useMemo(() => computeCurrentStreak(trades), [trades]);
  const tier = streakTier(streak, type);
  const celebrating = useCelebration(type === "win" && streak >= 5);
  return (
    <div style={{ ...S.card, padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${tier.color}10, transparent 60%)`, pointerEvents: "none" }} />
      {celebrating && <Confetti />}
      <div style={{ fontSize: FS.xs, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Racha actual</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 42, fontWeight: 800, color: tier.color, lineHeight: 1, letterSpacing: "-0.02em", ...numMonoStyle }}>{streak || "—"}</span>
        <span style={{ fontSize: FS.lg, fontWeight: 800, color: tier.color, textTransform: "uppercase", letterSpacing: "0.12em" }}>{tier.name}</span>
      </div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, maxWidth: 520 }}>{tier.sub}</div>
    </div>
  );
});


export { StreakMedalCard };
