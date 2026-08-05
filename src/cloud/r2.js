// ════════════════════════════════════════════════════════════════════
// Subida/descarga de imágenes a Cloudflare R2.
//
// El navegador nunca habla directo con R2 con credenciales propias:
// le pide una URL firmada de corta duración a la Edge Function
// "r2-sign" (que ya sabe quién sos por tu sesión de Supabase) y usa esa
// URL una sola vez para el PUT o el GET. Así las claves de R2 quedan
// siempre del lado del servidor.
// ════════════════════════════════════════════════════════════════════
import { supabase } from "./supabaseClient";
import { resizeImageToCanvas } from "../utils";

const MAX_DIMENSION = 1600; // ancho/alto máximo tras el resize, de sobra para revisar un chart
const WEBP_QUALITY = 0.82;
const ALLOWED_UPLOAD_TYPES = new Set(["image/webp", "image/png", "image/jpeg"]); // debe coincidir con ALLOWED_CONTENT_TYPES de la Edge Function r2-sign

/**
 * Comprime y redimensiona una imagen en el navegador ANTES de subirla,
 * para no gastar de más la cuota gratuita de R2 (10GB). Una captura de
 * pantalla sin tocar puede pesar 2-4MB; convertida a WebP redimensionado
 * normalmente queda en 150-300KB sin pérdida visual relevante para
 * revisar un setup de trading.
 *
 * Devuelve { blob, contentType } — el contentType real del blob resultante,
 * no un valor fijo, porque no siempre es WebP (ver fallback abajo).
 */
async function compressImage(file) {
  const canvas = await resizeImageToCanvas(file, MAX_DIMENSION);

  const toBlob = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

  // 1) WebP: mejor compresión, lo que queremos en el caso normal.
  let blob = await toBlob("image/webp", WEBP_QUALITY);
  if (blob) return { blob, contentType: "image/webp" };

  // 2) Si el navegador no soporta WebP en toBlob, probamos JPEG — sigue
  // siendo el mismo resize + misma calidad, así que igual se gana la
  // compresión de espacio; solo cambia el formato final.
  blob = await toBlob("image/jpeg", WEBP_QUALITY);
  if (blob) return { blob, contentType: "image/jpeg" };

  // 3) Último recurso: ni WebP ni JPEG funcionaron (canvas.toBlob no
  // disponible/roto). Subimos el archivo original SIN comprimir para no
  // perder la imagen, pero queda registrado en consola porque es la
  // situación que queremos evitar (gasta cuota de R2 sin necesidad).
  console.warn("[r2] No se pudo comprimir la imagen (canvas.toBlob no disponible); se sube el archivo original sin comprimir.");
  return { blob: file, contentType: ALLOWED_UPLOAD_TYPES.has(file.type) ? file.type : "application/octet-stream" };
}

function extensionFor(contentType) {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "bin";
}

/** Arma la key del objeto en R2. Formato: "{userId}/trades/{tradeId}/{cual}.{ext}" */
export function buildTradeImageKey(userId, tradeId, cual /* "antes" | "despues" */, ext = "webp") {
  return `${userId}/trades/${tradeId}/${cual}.${ext}`;
}

/** Pide una URL firmada a la Edge Function r2-sign. */
async function getSignedUrl(key, operation, contentType) {
  const { data, error } = await supabase.functions.invoke("r2-sign", {
    body: { key, operation, contentType },
  });
  if (error) throw error;
  return data.url;
}

/**
 * Sube la imagen "antes" o "después" de un trade a R2, ya comprimida.
 * Devuelve la key guardada (para escribirla en trades.imagen_antes_key /
 * imagen_despues_key en Supabase).
 */
export async function uploadTradeImage(userId, tradeId, cual, file) {
  const { blob, contentType } = await compressImage(file);
  // Si terminamos en el último recurso (archivo original, tipo no permitido
  // por la Edge Function), mejor fallar acá con un mensaje claro que dejar
  // que r2-sign lo rechace con un 400 genérico.
  if (!ALLOWED_UPLOAD_TYPES.has(contentType)) {
    throw new Error(`No se pudo subir la imagen: formato "${contentType}" no soportado (solo webp/png/jpeg).`);
  }
  const key = buildTradeImageKey(userId, tradeId, cual, extensionFor(contentType));
  const uploadUrl = await getSignedUrl(key, "put", contentType);

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error(`Falló la subida a R2 (${res.status})`);

  return key;
}

/**
 * Obtiene una URL temporal para mostrar una imagen ya subida.
 * No conviene guardar esta URL (expira a los 5 min) — se pide de
 * nuevo cada vez que hay que mostrar la imagen (ej. al abrir el trade).
 */
export async function getTradeImageUrl(key) {
  if (!key) return null;
  return getSignedUrl(key, "get", undefined);
}

/**
 * Cache simple en memoria (por sesión) para no re-firmar la misma
 * imagen 10 veces si el usuario la mira varias veces seguidas en la
 * misma sesión, ya que la URL firmada sigue viva durante los 5 min.
 */
const urlCache = new Map(); // key -> { url, expiresAt }
export async function getTradeImageUrlCached(key) {
  if (!key) return null;
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  const url = await getTradeImageUrl(key);
  urlCache.set(key, { url, expiresAt: Date.now() + 4 * 60 * 1000 }); // margen bajo los 5 min reales
  return url;
}
