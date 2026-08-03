// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { memo } from "react";
import { T, FS, S } from "../../theme";
import { money } from "../../utils";
import { InstTag } from "../common/InstTag";
import { useResolvedImage } from "../../lib/imageStore";
import { GALLERY_BODY_STYLE, GALLERY_CARD_STYLE, GALLERY_COVER_IMG_STYLE, GALLERY_DATE_STYLE, GALLERY_DOT_BASE_STYLE, GALLERY_PCT_STYLE, GALLERY_PNL_WRAP_STYLE, GALLERY_RESULT_ROW_STYLE, GALLERY_TAGS_ROW_STYLE, GALLERY_TOP_ROW_STYLE } from "../../styles/sharedStyles";

const GalleryCard = memo(function GalleryCard({ trade, accentColor, accountSize, onTradeClick }) {
  const coverSrc = useResolvedImage(trade.imgAfter || trade.imgBefore);
  const win = trade.pnl >= 0;
  const resultColor = win ? T.gain : T.loss;
  const isLong = trade.direction === "LONG";
  const pct = accountSize ? (trade.pnl / accountSize) * 100 : null;
  const sessionTagStyle = { ...S.tag(T.textMuted), background: T.surfaceAlt };
  return (
    <div className="hz-card" style={GALLERY_CARD_STYLE}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"}
      onClick={() => onTradeClick(trade)}>
      {coverSrc
        ? <img src={coverSrc} alt="chart" loading="lazy" style={GALLERY_COVER_IMG_STYLE} />
        : <div style={{ ...GALLERY_COVER_IMG_STYLE, display: "flex", alignItems: "center", justifyContent: "center", background: T.surfaceAlt, color: T.textFaint, fontSize: FS.sm }}>Cargando…</div>}
      <div style={GALLERY_BODY_STYLE}>
        <div style={GALLERY_TOP_ROW_STYLE}>
          <InstTag inst={trade.instrument} size={12} />
          <span style={GALLERY_DATE_STYLE}>{trade.date}</span>
        </div>
        <div style={GALLERY_TAGS_ROW_STYLE}>
          {trade.session && <span style={sessionTagStyle}>{trade.session}</span>}
          <span style={S.tag(isLong ? T.gain : T.loss)}>{isLong ? "Compra" : "Venta"}</span>
        </div>
        <div style={GALLERY_RESULT_ROW_STYLE}>
          <span style={{ ...GALLERY_DOT_BASE_STYLE, background: resultColor }} />
          <span style={{ fontSize: FS.sm, fontWeight: 700, color: resultColor }}>{win ? "Profit" : "Loss"}</span>
          <span style={GALLERY_PNL_WRAP_STYLE}>
            <div style={{ fontSize: FS.base, fontWeight: 700, color: resultColor }}>{money(trade.pnl)}</div>
            {pct !== null && <div style={GALLERY_PCT_STYLE}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>}
          </span>
        </div>
      </div>
    </div>
  );
});


export { GalleryCard };
