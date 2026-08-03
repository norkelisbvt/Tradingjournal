// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { RADIUS, S } from "../../theme";
import { STYLE_SKELETON_FLAT, STYLE_SKELETON_LG, STYLE_SKELETON_ROW } from "../../styles/sharedStyles";

const Skeleton = memo(function Skeleton({ w = "100%", h = 14, style }) {
  return <div className="hz-skel" style={{ width: w, height: h, ...style }} />;
});
const GenericTabSkeleton = memo(function GenericTabSkeleton() {
  return (
    <div>
      <Skeleton w={180} h={20} style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} h={64} />)}
      </div>
      <Skeleton h={220} />
    </div>
  );
});
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div>
      <Skeleton h={230} style={{ marginBottom: 14, borderRadius: RADIUS.lg }} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", gap: 14, marginBottom: 14 }}>
        <Skeleton h={140} style={{ borderRadius: RADIUS.lg }} />
        <Skeleton h={140} style={{ borderRadius: RADIUS.lg }} />
        <Skeleton h={140} style={{ borderRadius: RADIUS.lg }} />
      </div>
      <Skeleton h={100} style={{ marginBottom: 14, borderRadius: RADIUS.lg }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} h={72} style={STYLE_SKELETON_LG} />)}
      </div>
    </div>
  );
});
const CalendarSkeleton = memo(function CalendarSkeleton() {
  return (
    <div>
      <Skeleton h={130} style={{ marginBottom: 14, borderRadius: RADIUS.lg }} />
      <Skeleton h={150} style={{ marginBottom: 14, borderRadius: RADIUS.lg }} />
      <div style={{ ...S.card, overflow: "hidden", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, padding: 1 }}>
          {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} h={82} style={STYLE_SKELETON_FLAT} />)}
        </div>
      </div>
    </div>
  );
});
const TableTabSkeleton = memo(function TableTabSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Skeleton w={220} h={34} style={{ borderRadius: RADIUS.sm }} />
        <Skeleton w={140} h={34} style={{ borderRadius: RADIUS.sm }} />
        <Skeleton w={100} h={34} style={{ borderRadius: RADIUS.sm }} />
      </div>
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <Skeleton h={38} style={{ borderRadius: 0, marginBottom: 1 }} />
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={40} style={STYLE_SKELETON_ROW} />)}
      </div>
    </div>
  );
});
const GallerySkeleton = memo(function GallerySkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={160} style={STYLE_SKELETON_LG} />)}
    </div>
  );
});
const TabSkeleton = memo(function TabSkeleton({ tab }) {
  if (tab === "dashboard") return <DashboardSkeleton />;
  if (tab === "calendar") return <CalendarSkeleton />;
  if (tab === "trades") return <TableTabSkeleton />;
  if (tab === "gallery") return <GallerySkeleton />;
  return <GenericTabSkeleton />;
});


export { Skeleton, GenericTabSkeleton, DashboardSkeleton, CalendarSkeleton, TableTabSkeleton, GallerySkeleton, TabSkeleton };
