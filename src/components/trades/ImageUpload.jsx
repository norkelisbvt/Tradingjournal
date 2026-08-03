// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useRef, memo } from "react";
import { T, FS, S, RADIUS } from "../../theme";
import { fileToBase64, compressImage } from "../../utils";
import { idbDeleteImage, idbPutImage, isImageRef, newImageId, useResolvedImage } from "../../lib/imageStore";

const ImageUpload = memo(function ImageUpload({ label, icon: Icon, value, remoteKey, onChange, accentColor }) {
  const ref = useRef();
  const [compressing, setCompressing] = useState(false);
  const [savedInfo, setSavedInfo] = useState(null); // { beforeKB, afterKB }
  // `remoteKey` (imagenAntesKey/imagenDespuesKey) es el respaldo para trades
  // sincronizados desde otro dispositivo que todavía no tienen la imagen en
  // la IndexedDB de este navegador — sin esto, editar ese trade acá mostraría
  // el botón de "Subir imagen" como si no hubiera ninguna todavía.
  const displaySrc = useResolvedImage(value, remoteKey);
  const hasImage = !!(value || remoteKey);
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    setSavedInfo(null);
    const previousValue = value; // se limpia de IndexedDB recién cuando la nueva imagen quedó guardada
    try {
      const originalKB = Math.round(file.size / 1024);
      let compressed;
      try {
        compressed = await compressImage(file);
      } catch (err) {
        console.error("Error comprimiendo imagen, se usará el archivo original:", err);
        compressed = await fileToBase64(file);
      }
      const compressedKB = Math.round((compressed.length * 0.75) / 1024); // estimado de bytes reales del base64
      const id = newImageId();
      await idbPutImage(id, compressed);
      onChange(id);
      if (isImageRef(previousValue)) idbDeleteImage(previousValue);
      setSavedInfo({ beforeKB: originalKB, afterKB: compressedKB });
    } catch (err) {
      console.error("Error guardando la imagen:", err);
    } finally {
      setCompressing(false);
      e.target.value = ""; // permite volver a seleccionar el mismo archivo si hace falta
    }
  }
  function handleRemove() {
    if (isImageRef(value)) idbDeleteImage(value);
    onChange(null); // TradeForm limpia también imagenAntesKey/imagenDespuesKey al recibir null
    setSavedInfo(null);
  }
  return (
    <div>
      <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 4 }}>{Icon && <Icon size={11} />}{label}</label>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {compressing && (
        <div style={{ padding: "18px 0", textAlign: "center", fontSize: FS.sm, color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: RADIUS.sm }}>
          🗜️ Comprimiendo imagen…
        </div>
      )}
      {!compressing && savedInfo && (
        <div style={{ fontSize: FS.xs, color: T.gain, marginBottom: 4 }}>
          ✓ Optimizada: {savedInfo.beforeKB} KB → {savedInfo.afterKB} KB
          {savedInfo.beforeKB > 0 && ` (-${Math.max(0, Math.round(100 - (savedInfo.afterKB / savedInfo.beforeKB) * 100))}%)`}
        </div>
      )}
      {!compressing && hasImage ? (
        <div style={{ position: "relative", borderRadius: RADIUS.sm, overflow: "hidden", border: `1px solid ${T.border}` }}>
          {displaySrc
            ? <img src={displaySrc} alt={label} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
            : <div style={{ padding: "28px 0", textAlign: "center", fontSize: FS.sm, color: T.textFaint }}>Cargando imagen…</div>}
          {/* aria-label incluye `label` (ej. "Después — Resultado") porque hay dos
              instancias de ImageUpload lado a lado en TradeForm con el mismo texto
              visible "✕" — sin esto, un lector de pantalla anuncia dos botones
              idénticos "Quitar imagen" sin forma de distinguir cuál es cuál. */}
          <button onClick={handleRemove} style={{ position: "absolute", top: 6, right: 6, background: "#ffffffcc", border: "none", borderRadius: RADIUS.sm, color: T.loss, cursor: "pointer", padding: "3px 8px", fontSize: FS.sm, fontWeight: 700 }} title="Quitar imagen" aria-label={`Quitar imagen — ${label}`}>✕</button>
        </div>

      ) : !compressing ? (
        <button onClick={() => ref.current.click()} aria-label={`Subir imagen — ${label}`}
          style={{ width: "100%", padding: "28px 0", borderRadius: RADIUS.sm, border: `2px dashed ${T.border}`, background: T.surfaceAlt, color: T.textFaint, cursor: "pointer", fontSize: FS.base, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
          <span style={{ fontSize: FS.xl }}>📷</span><span>Subir imagen</span>
        </button>
      ) : null}
    </div>
  );
});


export { ImageUpload };
