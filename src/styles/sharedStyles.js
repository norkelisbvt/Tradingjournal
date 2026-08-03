// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { T, FS, RADIUS, S } from "../theme";

const STYLE_SKELETON_LG = { borderRadius: RADIUS.lg };
const STYLE_SKELETON_FLAT = { borderRadius: 0 };
const STYLE_SKELETON_ROW = { borderRadius: 0, marginBottom: 1 };
const STYLE_FILTER_WRAP = { position: "relative", display: "inline-flex" };
const STYLE_FILTER_BACKDROP = { position: "fixed", inset: 0, zIndex: 40 };
const STYLE_DATE_RANGE_INPUTS_COL = { display: "flex", flexDirection: "column", gap: 6, padding: "8px 6px 3px", marginTop: 3 };
const STYLE_FILTER_OPTION_BASE = { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: FS.base, fontWeight: 600 };
const STYLE_FILTER_OPTION_BASE_MB = { ...STYLE_FILTER_OPTION_BASE, marginBottom: 2 };
const STYLE_INST_TAG_ICON_ROW = { display: "inline-flex", alignItems: "center", gap: 6 };
const WEEKDAY_HEADER_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const GALLERY_CARD_STYLE = { ...S.card, overflow: "hidden", cursor: "pointer" };
const GALLERY_COVER_IMG_STYLE = { width: "100%", height: 130, objectFit: "cover", display: "block" };
const GALLERY_BODY_STYLE = { padding: "10px 12px 12px" };
const GALLERY_TOP_ROW_STYLE = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 };
const GALLERY_DATE_STYLE = { fontSize: FS.sm, color: T.textFaint };
const GALLERY_TAGS_ROW_STYLE = { display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" };
const GALLERY_RESULT_ROW_STYLE = { display: "flex", alignItems: "center", gap: 6 };
const GALLERY_DOT_BASE_STYLE = { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 };
const GALLERY_PNL_WRAP_STYLE = { marginLeft: "auto", textAlign: "right" };
const GALLERY_PCT_STYLE = { fontSize: FS.xs, color: T.textFaint };
const GALLERY_PAGE_SIZE = 12;


export { STYLE_SKELETON_LG, STYLE_SKELETON_FLAT, STYLE_SKELETON_ROW, STYLE_FILTER_WRAP, STYLE_FILTER_BACKDROP, STYLE_DATE_RANGE_INPUTS_COL, STYLE_FILTER_OPTION_BASE, STYLE_FILTER_OPTION_BASE_MB, STYLE_INST_TAG_ICON_ROW, WEEKDAY_HEADER_LABELS, GALLERY_CARD_STYLE, GALLERY_COVER_IMG_STYLE, GALLERY_BODY_STYLE, GALLERY_TOP_ROW_STYLE, GALLERY_DATE_STYLE, GALLERY_TAGS_ROW_STYLE, GALLERY_RESULT_ROW_STYLE, GALLERY_DOT_BASE_STYLE, GALLERY_PNL_WRAP_STYLE, GALLERY_PCT_STYLE, GALLERY_PAGE_SIZE };
