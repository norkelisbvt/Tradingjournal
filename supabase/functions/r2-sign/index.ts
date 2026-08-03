// ════════════════════════════════════════════════════════════════════
// Edge Function: r2-sign
//
// El navegador NUNCA tiene las credenciales de R2 — se las pediría a
// esta función, que corre en el servidor de Supabase, verifica quién
// es el usuario (con su JWT) y firma una URL temporal (PUT para subir,
// GET para bajar) que el navegador usa directamente contra R2.
//
// Seguridad clave: se obliga a que la "key" del objeto empiece con
// "{user.id}/", así un usuario nunca puede pedir (ni por error, ni a
// propósito) una URL firmada para leer o pisar las imágenes de otro.
//
// Deploy:
//   supabase functions deploy r2-sign
//   supabase secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
//     R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=...
// ════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // en producción, reemplazar por el dominio real de la app
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CONTENT_TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);
const URL_EXPIRY_SECONDS = 300; // 5 minutos: tiempo de sobra para que el navegador haga el PUT/GET

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    if (req.method !== "POST") {
      return json({ error: "Método no permitido" }, 405);
    }

    // ── 1) Verificar identidad del usuario a partir del JWT que manda el cliente ──
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return json({ error: "No autenticado" }, 401);
    }
    const userId = userData.user.id;

    // ── 2) Validar el body ──
    const body = await req.json().catch(() => null);
    const { key, contentType, operation } = body ?? {};
    if (!key || typeof key !== "string") return json({ error: "Falta 'key'" }, 400);
    if (operation !== "put" && operation !== "get") return json({ error: "'operation' debe ser 'put' o 'get'" }, 400);
    if (operation === "put" && !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return json({ error: "contentType no permitido (solo webp/png/jpeg)" }, 400);
    }

    // ── 3) La clave del objeto DEBE empezar con el id del usuario ──
    // Esto es lo que impide que alguien pida una URL firmada para leer
    // o sobreescribir imágenes de otro usuario, aunque conozca su key.
    if (!key.startsWith(`${userId}/`)) {
      return json({ error: "Key fuera del espacio del usuario" }, 403);
    }

    // ── 4) Firmar la URL contra R2 (API S3-compatible) ──
    const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
    const bucket = Deno.env.get("R2_BUCKET_NAME")!;
    const client = new AwsClient({
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      service: "s3",
      region: "auto",
    });

    // X-Amz-Expires tiene que estar en la URL ANTES de firmar: en el modo
    // de query-signing de SigV4 ese parámetro forma parte del canonical
    // request. Si se agrega/cambia después de firmar, la query string ya
    // no coincide con la firmada y R2 responde 403 SignatureDoesNotMatch.
    const endpoint = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key)}`);
    endpoint.searchParams.set("X-Amz-Expires", String(URL_EXPIRY_SECONDS));

    const signed = await client.sign(endpoint.toString(), {
      method: operation === "put" ? "PUT" : "GET",
      headers: operation === "put" ? { "Content-Type": contentType } : {},
      aws: { signQuery: true },
    });

    return json({ url: signed.url, key, expiresIn: URL_EXPIRY_SECONDS });
  } catch (err) {
    console.error("r2-sign error:", err);
    return json({ error: "Error interno" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
