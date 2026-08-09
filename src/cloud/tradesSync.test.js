// ─── Tests de tradesSync.js ─────────────────────────────────────────────────
// Este archivo es el que traduce entre la forma que usa el formulario local
// (camelCase, todo lo numérico como string porque viene de <input>) y la
// forma que espera la tabla de Supabase (snake_case, columnas numeric reales).
// Un bug acá es silencioso: no rompe la UI, sube o baja datos mal mapeados y
// nadie se entera hasta que ya es tarde. Por eso el foco de estos tests es el
// mapeo campo por campo, no la integración real con Supabase (se mockea).
//
// Correr con: npx vitest run

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
// supabase se mockea con un "query builder" mínimo que imita el patrón real
// de supabase-js: cada método de la cadena (select/order/upsert/eq/single)
// devuelve el mismo objeto, y el objeto en sí es "thenable" — al hacer
// `await supabase.from(x)...` se resuelve directo, sin necesitar un .then()
// final explícito en el código real (así es como funciona supabase-js).
function makeChain(result) {
  const chain = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: { getUser: (...args) => mockGetUser(...args) },
    from: (...args) => mockFrom(...args),
  },
}));

const mockUploadTradeImage = vi.fn();
const mockGetTradeImageUrlCached = vi.fn();
vi.mock("./r2", () => ({
  uploadTradeImage: (...args) => mockUploadTradeImage(...args),
  getTradeImageUrlCached: (...args) => mockGetTradeImageUrlCached(...args),
}));

import {
  numOrNull, rowToAccount, rowToTrade,
  upsertAccount, deleteAccount, upsertTrade, deleteTrade,
  fetchAllTradingData, attachTradeImage, getTradeImageUrl,
} from "./tradesSync.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
});

// ─── numOrNull ───────────────────────────────────────────────────────────
describe("numOrNull", () => {
  it("convierte string vacío a null (campo vacío = sin dato, no cero)", () => {
    expect(numOrNull("")).toBeNull();
  });
  it("convierte null y undefined a null", () => {
    expect(numOrNull(null)).toBeNull();
    expect(numOrNull(undefined)).toBeNull();
  });
  it("convierte un string numérico válido a Number", () => {
    expect(numOrNull("42.5")).toBe(42.5);
    expect(numOrNull("0")).toBe(0);
  });
  it("un string no-numérico da null, no NaN (NaN rompería la columna numeric)", () => {
    expect(numOrNull("abc")).toBeNull();
  });
});

// ─── rowToTrade ──────────────────────────────────────────────────────────
describe("rowToTrade", () => {
  it("mapea snake_case de la fila a camelCase de la app", () => {
    const row = {
      id: "t1", account_id: "a1", fecha: "2026-08-01", hora: "09:30",
      fecha_salida: "2026-08-01", hora_salida: "10:15", instrumento: "NAS100", direccion: "long",
      sesion: "ny", entrada: 20000, salida: 20050, stop_loss: 19950,
      lotaje: 1, risk_pct: 1, rr: 2, pnl: 500,
      setups: ["breakout"], razones: { plan: true }, errores: [], emociones: ["confiado"],
      tags: ["A+"], notas: "buen trade", imagen_antes_key: "k1", imagen_despues_key: "k2",
    };
    const trade = rowToTrade(row);
    expect(trade).toMatchObject({
      id: "t1", accountId: "a1", date: "2026-08-01", time: "09:30",
      exitDate: "2026-08-01", exitTime: "10:15", instrument: "NAS100", direction: "long", session: "ny",
      pnl: 500, setups: ["breakout"], emotions: ["confiado"], tags: ["A+"], notes: "buen trade",
    });
    // Los campos numéricos vuelven como STRING (así los espera el form) —
    // no como number, aunque en la fila de Supabase sean numeric.
    expect(trade.entry).toBe("20000");
    expect(trade.exit).toBe("20050");
    expect(trade.stopLoss).toBe("19950");
  });

  it("mapea hora_salida (columna) a exitTime (app) — clave para el cálculo de hold time", () => {
    const row = { id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100", hora: "09:30", hora_salida: "10:15" };
    const trade = rowToTrade(row);
    expect(trade.time).toBe("09:30");
    expect(trade.exitTime).toBe("10:15");
  });

  it("mapea emociones_intensidad, revision_bien y revision_mejorar", () => {
    const row = {
      id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100",
      emociones_intensidad: { fomo: 4 }, revision_bien: "Esperé la confirmación", revision_mejorar: "Salir antes",
    };
    const trade = rowToTrade(row);
    expect(trade.emotionIntensity).toEqual({ fomo: 4 });
    expect(trade.reviewWhatWorked).toBe("Esperé la confirmación");
    expect(trade.reviewWhatToImprove).toBe("Salir antes");
  });

  it("emociones_intensidad ausente cae a objeto vacío, no a undefined", () => {
    const row = { id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100" };
    expect(rowToTrade(row).emotionIntensity).toEqual({});
  });

  it("campos numéricos en null se mapean a undefined, no a '0' ni 'null'", () => {
    const row = {
      id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100",
      entrada: null, salida: null, stop_loss: null, lotaje: null, risk_pct: null, rr: null, pnl: null,
    };
    const trade = rowToTrade(row);
    expect(trade.entry).toBeUndefined();
    expect(trade.exit).toBeUndefined();
    expect(trade.stopLoss).toBeUndefined();
    expect(trade.pnl).toBeUndefined();
  });

  it("arrays/objetos ausentes en la fila (null) caen a sus valores por defecto vacíos", () => {
    const row = { id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100" };
    const trade = rowToTrade(row);
    expect(trade.setups).toEqual([]);
    expect(trade.reasons).toEqual({});
    expect(trade.errors).toEqual([]);
    expect(trade.emotions).toEqual([]);
    expect(trade.tags).toEqual([]);
  });
});

// ─── rowToAccount ────────────────────────────────────────────────────────
describe("rowToAccount", () => {
  it("mapea snake_case a camelCase y castea saldo/riesgo a Number", () => {
    const row = {
      id: "a1", local_key: "personal-1", grupo: "personal", nombre: "Cuenta principal",
      broker: "Broker X", moneda: "USD", saldo_inicial: "10000", orden: 0, archivado: false,
      fase: null, riesgo_pct: "1.5",
    };
    const acc = rowToAccount(row);
    expect(acc).toMatchObject({ id: "a1", localKey: "personal-1", grupo: "personal", nombre: "Cuenta principal" });
    expect(acc.saldoInicial).toBe(10000);
    expect(acc.riesgoPct).toBe(1.5);
  });

  it("riesgoPct en null queda en null, no en 0 (0% de riesgo sería un dato real distinto)", () => {
    const row = { id: "a1", local_key: "k", grupo: "personal", nombre: "N", saldo_inicial: 0, riesgo_pct: null };
    expect(rowToAccount(row).riesgoPct).toBeNull();
  });
});

// ─── upsertAccount ───────────────────────────────────────────────────────
describe("upsertAccount", () => {
  it("usa onConflict 'user_id,local_key' cuando la cuenta todavía no tiene id remoto", async () => {
    const chain = makeChain({ data: { id: "new-id", local_key: "k1", grupo: "personal", nombre: "N", saldo_inicial: 0 }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertAccount({ localKey: "k1", nombre: "N", grupo: "personal" });

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ local_key: "k1", user_id: "user-123" }),
      { onConflict: "user_id,local_key" }
    );
  });

  it("usa onConflict 'id' cuando la cuenta ya tiene id remoto (segunda sync en adelante)", async () => {
    const chain = makeChain({ data: { id: "existing-id", local_key: "k1", grupo: "personal", nombre: "N", saldo_inicial: 0 }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertAccount({ id: "existing-id", localKey: "k1", nombre: "N", grupo: "personal" });

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing-id" }),
      { onConflict: "id" }
    );
  });

  it("riesgoPct '' (string vacío del form) se manda como null, no como NaN", async () => {
    const chain = makeChain({ data: { id: "a1", local_key: "k1", grupo: "personal", nombre: "N", saldo_inicial: 0 }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertAccount({ localKey: "k1", nombre: "N", grupo: "personal", riesgoPct: "" });

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ riesgo_pct: null }),
      expect.anything()
    );
  });

  it("propaga el error de Supabase en vez de tragárselo en silencio", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error("RLS violation") }));
    await expect(upsertAccount({ localKey: "k1", nombre: "N" })).rejects.toThrow("RLS violation");
  });

  // ─── Detección de conflictos (optimistic concurrency) ───
  it("lanza SyncConflictError si el updated_at remoto de la cuenta no coincide con el conocido", async () => {
    const checkChain = makeChain({ data: { id: "a1", updated_at: "2026-08-06T12:00:00Z" }, error: null });
    mockFrom.mockReturnValueOnce(checkChain);

    await expect(upsertAccount({ id: "a1", localKey: "k1", nombre: "N", updatedAt: "2026-08-06T10:00:00Z" }))
      .rejects.toMatchObject({ name: "SyncConflictError", entity: "account" });
    expect(checkChain.upsert).not.toHaveBeenCalled();
  });

  it("con force:true salta el chequeo de conflicto en cuentas", async () => {
    const writeChain = makeChain({ data: { id: "a1", local_key: "k1", grupo: "personal", nombre: "N", saldo_inicial: 0 }, error: null });
    mockFrom.mockReturnValue(writeChain);

    await upsertAccount({ id: "a1", localKey: "k1", nombre: "N", updatedAt: "viejo" }, { force: true });
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

// ─── deleteAccount ───────────────────────────────────────────────────────
describe("deleteAccount", () => {
  it("llama .eq('id', ...) con el id correcto", async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await deleteAccount("a1");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("id", "a1");
  });

  it("propaga el error si falla el borrado", async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error("not found") }));
    await expect(deleteAccount("a1")).rejects.toThrow("not found");
  });
});

// ─── upsertTrade ─────────────────────────────────────────────────────────
describe("upsertTrade", () => {
  it("parsea todos los campos string-numéricos del form antes de mandarlos a la columna numeric", async () => {
    const chain = makeChain({
      data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    await upsertTrade({
      id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100",
      entry: "20000", exit: "20050", stopLoss: "19950", size: "1", riskPct: "1", rr: "2", pnl: "500",
    });

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      entrada: 20000, salida: 20050, stop_loss: 19950, lotaje: 1, risk_pct: 1, rr: 2, pnl: 500,
    }));
  });

  it("campos opcionales ausentes (setups/reasons/errors/emotions/tags) caen a su default vacío, no a undefined", async () => {
    const chain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100" });

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      setups: [], razones: {}, errores: [], emociones: [], tags: [],
    }));
  });

  it("manda hora_salida al upsert cuando el trade tiene exitTime cargado", async () => {
    const chain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100", time: "09:30", exitTime: "10:15" });

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({ hora: "09:30", hora_salida: "10:15" }));
  });

  it("manda emociones_intensidad, revision_bien y revision_mejorar al upsert", async () => {
    const chain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertTrade({
      id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100",
      emotionIntensity: { fomo: 4 }, reviewWhatWorked: "bien", reviewWhatToImprove: "mejor",
    });

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      emociones_intensidad: { fomo: 4 }, revision_bien: "bien", revision_mejorar: "mejor",
    }));
  });

  it("emotionIntensity/review ausentes caen a default vacío/null, no a undefined", async () => {
    const chain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(chain);

    await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100" });

    expect(chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      emociones_intensidad: {}, revision_bien: null, revision_mejorar: null,
    }));
  });

  it("propaga el error de Supabase", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error("constraint violation") }));
    await expect(upsertTrade({ id: "t1", date: "2026-08-01", instrument: "X" })).rejects.toThrow("constraint violation");
  });

  // ─── Detección de conflictos (optimistic concurrency) ───
  it("lanza SyncConflictError si el updated_at remoto no coincide con el conocido, y NO llega a escribir", async () => {
    const checkChain = makeChain({ data: { id: "t1", updated_at: "2026-08-06T12:00:00Z" }, error: null });
    mockFrom.mockReturnValueOnce(checkChain);

    await expect(upsertTrade({ id: "t1", date: "2026-08-01", instrument: "NAS100", updatedAt: "2026-08-06T10:00:00Z" }))
      .rejects.toMatchObject({ name: "SyncConflictError", entity: "trade" });
    expect(checkChain.upsert).not.toHaveBeenCalled();
  });

  it("si el updated_at remoto coincide con el conocido, no hay conflicto y procede al upsert normal", async () => {
    const ts = "2026-08-06T10:00:00Z";
    const checkChain = makeChain({ data: { id: "t1", updated_at: ts }, error: null });
    const writeChain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValueOnce(checkChain).mockReturnValueOnce(writeChain);

    const result = await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100", updatedAt: ts });
    expect(writeChain.upsert).toHaveBeenCalled();
    expect(result.id).toBe("t1");
  });

  it("con force:true salta el chequeo y escribe directo (usado al resolver un conflicto)", async () => {
    const writeChain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(writeChain);

    await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100", updatedAt: "cualquier-valor-viejo" }, { force: true });
    expect(mockFrom).toHaveBeenCalledTimes(1); // sin la llamada extra de chequeo
  });

  it("si el trade no tiene updatedAt conocido (creación nueva), no hace chequeo previo", async () => {
    const writeChain = makeChain({ data: { id: "t1", account_id: "acc1", fecha: "2026-08-01", instrumento: "NAS100" }, error: null });
    mockFrom.mockReturnValue(writeChain);

    await upsertTrade({ id: "t1", accountId: "acc1", date: "2026-08-01", instrument: "NAS100" });
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

// ─── deleteTrade ─────────────────────────────────────────────────────────
describe("deleteTrade", () => {
  it("llama .eq('id', ...) con el id correcto", async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await deleteTrade("t1");
    expect(chain.eq).toHaveBeenCalledWith("id", "t1");
  });
});

// ─── fetchAllTradingData ─────────────────────────────────────────────────
describe("fetchAllTradingData", () => {
  it("combina accounts + trades y los mapea con rowToAccount/rowToTrade", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "accounts") {
        return makeChain({ data: [{ id: "a1", local_key: "k1", grupo: "personal", nombre: "N", saldo_inicial: 100 }], error: null });
      }
      return makeChain({ data: [{ id: "t1", account_id: "a1", fecha: "2026-08-01", instrumento: "NAS100" }], error: null });
    });

    const result = await fetchAllTradingData();
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].localKey).toBe("k1");
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].instrument).toBe("NAS100");
  });

  it("si falla la consulta de trades, se corta ahí aunque accounts haya andado bien", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "accounts") return makeChain({ data: [], error: null });
      return makeChain({ data: null, error: new Error("network error") });
    });
    await expect(fetchAllTradingData()).rejects.toThrow("network error");
  });
});

// ─── attachTradeImage ────────────────────────────────────────────────────
describe("attachTradeImage", () => {
  it("actualiza imagen_antes_key cuando cual='antes'", async () => {
    mockUploadTradeImage.mockResolvedValue("user-123/t1/antes.webp");
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const key = await attachTradeImage("t1", "antes", new Blob());

    expect(key).toBe("user-123/t1/antes.webp");
    expect(chain.update).toHaveBeenCalledWith({ imagen_antes_key: "user-123/t1/antes.webp" });
  });

  it("actualiza imagen_despues_key cuando cual='despues'", async () => {
    mockUploadTradeImage.mockResolvedValue("user-123/t1/despues.webp");
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await attachTradeImage("t1", "despues", new Blob());

    expect(chain.update).toHaveBeenCalledWith({ imagen_despues_key: "user-123/t1/despues.webp" });
  });
});

// ─── getTradeImageUrl ────────────────────────────────────────────────────
describe("getTradeImageUrl", () => {
  it("delega en getTradeImageUrlCached", async () => {
    mockGetTradeImageUrlCached.mockResolvedValue("https://signed-url.example");
    const url = await getTradeImageUrl("some-key");
    expect(url).toBe("https://signed-url.example");
    expect(mockGetTradeImageUrlCached).toHaveBeenCalledWith("some-key");
  });
});
