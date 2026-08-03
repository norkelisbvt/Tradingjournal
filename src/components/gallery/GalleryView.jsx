// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect, useMemo, memo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { T, FS, S } from "../../theme";
import { EmptyState } from "../common/EmptyState";
import { HistoricalAnalysisPanel } from "../dashboard/HistoricalAnalysisPanel";
import { GalleryCard } from "./GalleryCard";
import { GALLERY_PAGE_SIZE } from "../../styles/sharedStyles";

const GalleryView = memo(function GalleryView({ trades, accentColor, onTradeClick, accountSize }) {
  const [filter, setFilter] = useState("all");
  const [galleryPage, setGalleryPage] = useState(0);

  // Antes esto corría sin useMemo en cada render (incluido cada toggle de
  // `filter`, que no cambia `trades`) y, peor, se renderizaban TODAS las
  // imágenes (base64) de una sola vez sin paginar. Con meses/años de trades
  // con capturas "antes/después" eso vuelve la pestaña cada vez más pesada
  // de abrir y scrollear. Ahora se memoiza el filtrado+orden, y se pagina
  // igual que HistoricalAnalysisPanel para no montar cientos de <img> juntas.
  const filtered = useMemo(() => {
    const withImages = trades.filter(t => t.imgBefore || t.imgAfter);
    const byResult = filter === "all" ? withImages : filter === "wins" ? withImages.filter(t => t.pnl > 0) : withImages.filter(t => t.pnl <= 0);
    return [...byResult].sort((a, b) => b.date.localeCompare(a.date));
  }, [trades, filter]);

  // Si cambia el filtro (o se agregan/borran trades) y la página actual
  // queda fuera de rango, se vuelve a la primera en vez de mostrar vacío.
  useEffect(() => { setGalleryPage(0); }, [filter]);
  const galleryTotalPages = Math.max(1, Math.ceil(filtered.length / GALLERY_PAGE_SIZE));
  const galleryCurrentPage = Math.min(galleryPage, galleryTotalPages - 1);
  const paged = useMemo(
    () => filtered.slice(galleryCurrentPage * GALLERY_PAGE_SIZE, (galleryCurrentPage + 1) * GALLERY_PAGE_SIZE),
    [filtered, galleryCurrentPage]
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["all","Todos"],["wins","Ganadores ✓"],["losses","Perdedores ✗"]].map(([key,label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${filter === key ? accentColor + "88" : T.border}`, background: filter === key ? accentColor + "12" : T.surface, color: filter === key ? accentColor : T.textMuted, cursor: "pointer", fontSize: FS.base, fontWeight: 600 }}>{label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: FS.sm, color: T.textFaint, alignSelf: "center" }}>{filtered.length} con imágenes</span>
      </div>
      {filtered.length === 0 ? (
        <div className="hz-card" style={S.card}>
          <EmptyState icon={ImageIcon} title="No hay imágenes aún" subtitle="Subí capturas de 'antes' y 'después' al registrar un trade para construir tu galería visual." accentColor={accentColor} />
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
            {paged.map(trade => (
              <GalleryCard key={trade.id} trade={trade} accentColor={accentColor} accountSize={accountSize} onTradeClick={onTradeClick} />
            ))}
          </div>
          {galleryTotalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px 0 4px" }}>
              <button onClick={() => setGalleryPage(p => Math.max(0, p - 1))} disabled={galleryCurrentPage === 0}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: galleryCurrentPage === 0 ? T.textFaint : T.textMuted, cursor: galleryCurrentPage === 0 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                ← Anterior
              </button>
              <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Página {galleryCurrentPage + 1} de {galleryTotalPages}</span>
              <button onClick={() => setGalleryPage(p => Math.min(galleryTotalPages - 1, p + 1))} disabled={galleryCurrentPage >= galleryTotalPages - 1}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: galleryCurrentPage >= galleryTotalPages - 1 ? T.textFaint : T.textMuted, cursor: galleryCurrentPage >= galleryTotalPages - 1 ? "default" : "pointer", fontSize: FS.sm, fontWeight: 600 }}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});


export { GalleryView };
