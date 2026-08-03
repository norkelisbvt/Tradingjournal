// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useState, useEffect } from "react";
import { getTradeImageUrl } from "../cloud/tradesSync";

let imgDBPromise = null;
const IMG_DB_NAME = "trading-journal-images";
const IMG_STORE = "images";
function openImageDB() {
  if (imgDBPromise) return imgDBPromise;
  imgDBPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB no disponible")); return; }
    const req = indexedDB.open(IMG_DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(IMG_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return imgDBPromise;
}
async function idbPutImage(id, dataUrl) {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMG_STORE, "readwrite");
    tx.objectStore(IMG_STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetImage(id) {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMG_STORE, "readonly");
    const req = tx.objectStore(IMG_STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}
async function idbDeleteImage(id) {
  try {
    const db = await openImageDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IMG_STORE, "readwrite");
      tx.objectStore(IMG_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* si IndexedDB no está disponible, no hay nada que limpiar */ }
}
function newImageId() {
  return `idb:img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function isImageRef(v) { return typeof v === "string" && v.startsWith("idb:"); }
async function migrateEmbeddedImages(tradesByAccount) {
  let touched = false;
  const out = {};
  for (const [acc, list] of Object.entries(tradesByAccount)) {
    let accTouched = false;
    const newList = await Promise.all((list || []).map(async (t) => {
      const needsBefore = typeof t.imgBefore === "string" && t.imgBefore.startsWith("data:");
      const needsAfter = typeof t.imgAfter === "string" && t.imgAfter.startsWith("data:");
      if (!needsBefore && !needsAfter) return t;
      accTouched = true;
      const next = { ...t };
      if (needsBefore) { const id = newImageId(); await idbPutImage(id, t.imgBefore); next.imgBefore = id; }
      if (needsAfter) { const id = newImageId(); await idbPutImage(id, t.imgAfter); next.imgAfter = id; }
      return next;
    }));
    out[acc] = accTouched ? newList : list;
    if (accTouched) touched = true;
  }
  return { trades: touched ? out : tradesByAccount, touched };
}
const imgCache = new Map();
/**
 * Resuelve una imagen de trade a una src usable en <img>.
 * - `value`: referencia LOCAL (idb:..., data:... o cualquier URL ya lista). Si
 *   está presente, tiene prioridad — es lo más rápido y funciona sin red.
 * - `remoteKey` (opcional): key de R2 (`imagenAntesKey`/`imagenDespuesKey`).
 *   Solo se usa si no hay nada local — típicamente un trade traído de la nube
 *   en un dispositivo que nunca tuvo la imagen en su IndexedDB.
 */
function useResolvedImage(value, remoteKey) {
  const [resolved, setResolved] = useState(() => {
    if (!value) return null;
    if (!isImageRef(value)) return value;
    return imgCache.get(value) || null;
  });
  useEffect(() => {
    let cancelled = false;
    if (value) {
      if (!isImageRef(value)) { setResolved(value); return; }
      if (imgCache.has(value)) { setResolved(imgCache.get(value)); return; }
      idbGetImage(value).then(dataUrl => {
        if (cancelled) return;
        imgCache.set(value, dataUrl);
        setResolved(dataUrl);
      }).catch(() => { if (!cancelled) setResolved(null); });
      return () => { cancelled = true; };
    }
    if (remoteKey) {
      setResolved(null);
      getTradeImageUrl(remoteKey).then(url => {
        if (!cancelled) setResolved(url || null);
      }).catch(() => { if (!cancelled) setResolved(null); });
      return () => { cancelled = true; };
    }
    setResolved(null);
  }, [value, remoteKey]);
  return resolved;
}


export { IMG_DB_NAME, IMG_STORE, openImageDB, idbPutImage, idbGetImage, idbDeleteImage, newImageId, isImageRef, migrateEmbeddedImages, imgCache, useResolvedImage };
