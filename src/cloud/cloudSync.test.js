// ─── Tests de cloudSync.js ──────────────────────────────────────────────────
// useCloudSync es el "cerebro" que decide CUÁNDO y CÓMO se sincroniza cada
// cambio local con la nube — acá vive la lógica más fácil de romper en
// silencio: si syncTradeUpsert manda un trade sin accountId remoto, o si
// pullAll arma mal el mapa de cuentas, el usuario no ve ningún error en
// pantalla, simplemente sus datos no llegan (o llegan mal) a Supabase.
//
// No se usa @testing-library/react (no está en las dependencias del
// proyecto) — se arma un harness mínimo de render con react-dom directo,
// que es todo lo que hace falta para probar un hook sin JSX.
//
// Correr con: npx vitest run

import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

// Sin esto, React tira un warning benigno ("act environment not configured")
// en cada test — no es un fallo, solo ensucia la salida de la consola.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── Harness de render para hooks, sin JSX ──
function renderHook(useHookFn) {
  const result = { current: null };
  function TestComponent() {
    result.current = useHookFn();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root;
  act(() => {
    root = createRoot(container);
    root.render(React.createElement(TestComponent));
  });
  return {
    result,
    unmount: () => act(() => root.unmount()),
  };
}

// ── Mocks ──
let authChangeCallback = null;
const mockGetCurrentUser = vi.fn();
const mockOnAuthChange = vi.fn((cb) => { authChangeCallback = cb; return () => {}; });

vi.mock("./supabaseClient", () => ({
  getCurrentUser: (...args) => mockGetCurrentUser(...args),
  onAuthChange: (...args) => mockOnAuthChange(...args),
}));

const mockUpsertAccount = vi.fn();
const mockDeleteAccount = vi.fn();
const mockUpsertTrade = vi.fn();
const mockDeleteTrade = vi.fn();
const mockFetchAllTradingData = vi.fn();
const mockAttachTradeImage = vi.fn();

// SyncConflictError es una clase real (no un vi.fn()) para que
// `err instanceof tradesApi.SyncConflictError` funcione tal cual en el
// código real de cloudSync.js — mockear esto como una función rompería
// ese chequeo silenciosamente. Va envuelta en vi.hoisted() porque
// vi.mock() se sube al principio del archivo automáticamente, antes de
// que una `class` declarada más abajo llegue a existir.
const { SyncConflictError } = vi.hoisted(() => {
  class SyncConflictError extends Error {
    constructor(entity, localData, remoteData) {
      super(`Conflicto: ${entity}`);
      this.name = "SyncConflictError";
      this.entity = entity;
      this.localData = localData;
      this.remoteData = remoteData;
    }
  }
  return { SyncConflictError };
});

vi.mock("./tradesSync", () => ({
  upsertAccount: (...a) => mockUpsertAccount(...a),
  deleteAccount: (...a) => mockDeleteAccount(...a),
  upsertTrade: (...a) => mockUpsertTrade(...a),
  deleteTrade: (...a) => mockDeleteTrade(...a),
  fetchAllTradingData: (...a) => mockFetchAllTradingData(...a),
  attachTradeImage: (...a) => mockAttachTradeImage(...a),
  SyncConflictError,
}));

const mockFetchAllFinanceData = vi.fn();
vi.mock("./financeSync", () => ({
  fetchAllFinanceData: (...a) => mockFetchAllFinanceData(...a),
  upsertMovimiento: vi.fn(),
  deleteMovimiento: vi.fn(),
  addCategoria: vi.fn(),
  removeCategoria: vi.fn(),
  upsertRecurrente: vi.fn(),
  deleteRecurrente: vi.fn(),
  setPresupuestoCategoria: vi.fn(),
  saveFinConfig: vi.fn(),
}));

import { useCloudSync, newId } from "./cloudSync.js";

beforeEach(() => {
  vi.clearAllMocks();
  authChangeCallback = null;
});

// ─── newId ───────────────────────────────────────────────────────────────
describe("newId", () => {
  it("genera un UUID v4 válido", () => {
    const id = newId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("genera ids distintos en llamadas sucesivas", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
  });

  it("sigue funcionando si crypto.randomUUID no está disponible (fallback manual)", () => {
    const original = globalThis.crypto?.randomUUID;
    // Se simula un entorno sin randomUUID (contexto no "seguro")
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
    const id = newId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: original, configurable: true });
  });
});

// ─── useCloudSync: estado ready ──────────────────────────────────────────
describe("useCloudSync — ready", () => {
  it("arranca en ready=false y pasa a true cuando hay sesión activa", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    const { result } = renderHook(() => useCloudSync());
    await act(async () => {}); // deja resolver la promesa de getCurrentUser
    expect(result.current.ready).toBe(true);
  });

  it("queda en ready=false si no hay sesión", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    expect(result.current.ready).toBe(false);
  });
});

// ─── syncAccountUpsert / syncTradeUpsert: el flujo que más importa ───────
describe("useCloudSync — cuentas y trades encadenados", () => {
  it("no llama a upsertAccount si todavía no hay sesión (ready=false)", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    await act(async () => { await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0); });
    expect(mockUpsertAccount).not.toHaveBeenCalled();
  });

  it("un trade se descarta (no se sube) si su cuenta todavía no tiene id remoto", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});

    // Nunca se sincronizó la cuenta "k1" -> no hay id remoto en el mapa interno
    await act(async () => { await result.current.syncTradeUpsert("k1", { id: "t1", date: "2026-08-01" }); });
    expect(mockUpsertTrade).not.toHaveBeenCalled();
  });

  it("una vez que la cuenta se sincronizó, el trade sí se sube con el accountId remoto correcto", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockUpsertAccount.mockResolvedValue({ id: "remote-acc-1", localKey: "k1" });
    mockUpsertTrade.mockResolvedValue({ id: "t1" });

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});

    await act(async () => {
      await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0);
    });
    await act(async () => {
      await result.current.syncTradeUpsert("k1", { id: "t1", date: "2026-08-01" });
    });

    expect(mockUpsertTrade).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", accountId: "remote-acc-1" })
    );
  });

  it("si upsertAccount falla, el status pasa a 'error' sin tirar excepción hacia afuera", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockUpsertAccount.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    await act(async () => {
      await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0);
    });

    expect(result.current.status).toBe("error");
  });
});

// ─── pullAll: reconstrucción del estado local desde la nube ─────────────
describe("useCloudSync — pullAll", () => {
  it("agrupa las cuentas por grupo (personal/funded/backtest) y arma accountOrder", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockFetchAllTradingData.mockResolvedValue({
      accounts: [
        { id: "a1", localKey: "p1", grupo: "personal", orden: 0, nombre: "Personal 1", saldoInicial: 1000, archivado: false },
        { id: "a2", localKey: "f1", grupo: "funded", orden: 0, nombre: "Funded 1", saldoInicial: 5000, archivado: false },
        { id: "a3", localKey: "bt1", grupo: "backtest", orden: 0, nombre: "Backtest", saldoInicial: 0, archivado: false },
      ],
      trades: [],
    });
    mockFetchAllFinanceData.mockResolvedValue({});

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});

    let pulled;
    await act(async () => { pulled = await result.current.pullAll(); });

    expect(pulled.accountOrder.personal).toEqual(["p1"]);
    expect(pulled.accountOrder.funded).toEqual(["f1"]);
    expect(pulled.backtestKey).toBe("bt1");
    expect(pulled.accounts.p1.name).toBe("Personal 1");
  });

  it("un trade cuyo accountId no matchea ninguna cuenta conocida se descarta silenciosamente (no rompe el pull)", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockFetchAllTradingData.mockResolvedValue({
      accounts: [{ id: "a1", localKey: "p1", grupo: "personal", orden: 0, nombre: "P1", saldoInicial: 0, archivado: false }],
      trades: [
        { id: "t1", accountId: "a1", date: "2026-08-01" },
        { id: "t2", accountId: "cuenta-fantasma", date: "2026-08-02" },
      ],
    });
    mockFetchAllFinanceData.mockResolvedValue({});

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});

    let pulled;
    await act(async () => { pulled = await result.current.pullAll(); });

    expect(pulled.trades.p1).toHaveLength(1);
    expect(pulled.trades.p1[0].id).toBe("t1");
  });

  it("devuelve null y status='error' si falla la carga (en vez de tirar la excepción hacia el llamador)", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockFetchAllTradingData.mockRejectedValue(new Error("timeout"));
    mockFetchAllFinanceData.mockResolvedValue({});

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});

    let pulled;
    await act(async () => { pulled = await result.current.pullAll(); });

    expect(pulled).toBeNull();
    expect(result.current.status).toBe("error");
  });
});

// ─── Conflictos de sincronización ────────────────────────────────────────
describe("useCloudSync — conflictos", () => {
  it("un SyncConflictError al subir un trade se guarda en `conflicts` en vez de perderse en consola", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockUpsertAccount.mockResolvedValue({ id: "remote-acc-1", localKey: "k1" });
    mockUpsertTrade.mockRejectedValue(new SyncConflictError("trade", { id: "t1", date: "2026-08-01" }, { id: "t1", date: "2026-08-02" }));

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    await act(async () => { await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0); });
    await act(async () => { await result.current.syncTradeUpsert("k1", { id: "t1", date: "2026-08-01" }); });

    expect(result.current.conflicts).toHaveLength(1);
    expect(result.current.conflicts[0].entity).toBe("trade");
    expect(result.current.status).toBe("error");
  });

  it("resolveConflict('theirs') limpia el conflicto y devuelve la data remota para pisar el estado local", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockUpsertAccount.mockResolvedValue({ id: "remote-acc-1", localKey: "k1" });
    const remoteVersion = { id: "t1", date: "2026-08-02", pnl: 999 };
    mockUpsertTrade.mockRejectedValue(new SyncConflictError("trade", { id: "t1", date: "2026-08-01" }, remoteVersion));

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    await act(async () => { await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0); });
    await act(async () => { await result.current.syncTradeUpsert("k1", { id: "t1", date: "2026-08-01" }); });

    const conflictId = result.current.conflicts[0].id;
    let outcome;
    await act(async () => { outcome = await result.current.resolveConflict(conflictId, "theirs"); });

    expect(outcome).toEqual({ applied: "remote", entity: "trade", localKey: "k1", data: remoteVersion });
    expect(result.current.conflicts).toHaveLength(0);
    // "theirs" no debe volver a llamar a upsertTrade — la nube ya tiene la versión correcta
    expect(mockUpsertTrade).toHaveBeenCalledTimes(1);
  });

  it("resolveConflict('mine') reintenta el upsert con force:true y limpia el conflicto", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1" });
    mockUpsertAccount.mockResolvedValue({ id: "remote-acc-1", localKey: "k1" });
    mockUpsertTrade
      .mockRejectedValueOnce(new SyncConflictError("trade", { id: "t1", date: "2026-08-01" }, { id: "t1", date: "2026-08-02" }))
      .mockResolvedValueOnce({ id: "t1", date: "2026-08-01" });

    const { result } = renderHook(() => useCloudSync());
    await act(async () => {});
    await act(async () => { await result.current.syncAccountUpsert("k1", { name: "N" }, "personal", 0); });
    await act(async () => { await result.current.syncTradeUpsert("k1", { id: "t1", date: "2026-08-01" }); });

    const conflictId = result.current.conflicts[0].id;
    let outcome;
    await act(async () => { outcome = await result.current.resolveConflict(conflictId, "mine"); });

    expect(outcome.applied).toBe("local");
    expect(result.current.conflicts).toHaveLength(0);
    // segunda llamada a upsertTrade con force:true, forzando la escritura
    expect(mockUpsertTrade).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "t1" }),
      { force: true }
    );
  });
});
