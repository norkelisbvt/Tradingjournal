// ─── Tests de useFinanceState ───────────────────────────────────────────────
// Mismo harness manual de renderHook que ya se usa en cloudSync.test.js (sin
// @testing-library/react, que no está en las dependencias del proyecto).
//
// Foco: la lógica de negocio más propensa a bugs silenciosos — que guardar
// un movimiento realmente lo sincronice, que las categorías no se dupliquen
// ni queden vacías, y sobre todo la auto-generación mensual de recurrentes
// (es la parte más "mágica" del hook: corre sola en un useEffect).
//
// Correr con: npx vitest run

import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useFinanceState } from "./useFinanceState.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  return { result, unmount: () => act(() => root.unmount()) };
}

function makeMockCloud() {
  return {
    syncMovimientoUpsert: vi.fn(),
    syncMovimientoDelete: vi.fn(),
    syncCategoriaAdd: vi.fn(),
    syncCategoriaRemove: vi.fn(),
    syncRecurrenteUpsert: vi.fn(),
    syncRecurrenteDelete: vi.fn(),
    syncPresupuesto: vi.fn(),
  };
}

describe("useFinanceState — CRUD de gastos/ingresos", () => {
  it("saveFinRecord crea un gasto nuevo y lo sincroniza", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.openFinForm("gasto"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "Supermercado", fecha: "2026-08-01", valor: "50" })); });
    act(() => { result.current.saveFinRecord(); });

    expect(result.current.gastos).toHaveLength(1);
    expect(result.current.gastos[0]).toMatchObject({ nombre: "Supermercado", valor: 50 });
    expect(cloud.syncMovimientoUpsert).toHaveBeenCalledWith("gasto", expect.objectContaining({ nombre: "Supermercado" }));
    expect(result.current.finForm).toBeNull(); // el form se cierra solo al guardar
  });

  it("saveFinRecord no hace nada si falta nombre, fecha o valor (evita registros vacíos)", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.openFinForm("gasto"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "", valor: "50" })); }); // sin nombre
    act(() => { result.current.saveFinRecord(); });

    expect(result.current.gastos).toHaveLength(0);
    expect(cloud.syncMovimientoUpsert).not.toHaveBeenCalled();
  });

  it("deleteFinRecord saca el registro local y sincroniza el borrado", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.openFinForm("ingreso"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "Sueldo", fecha: "2026-08-01", valor: "1000" })); });
    act(() => { result.current.saveFinRecord(); });
    const id = result.current.ingresos[0].id;

    act(() => { result.current.deleteFinRecord("ingreso", id); });

    expect(result.current.ingresos).toHaveLength(0);
    expect(cloud.syncMovimientoDelete).toHaveBeenCalledWith("ingreso", id);
  });
});

describe("useFinanceState — categorías", () => {
  it("addFinCategory agrega y sincroniza, sin duplicar (case-insensitive)", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.addFinCategory("gasto", "Mascotas"); });
    expect(result.current.gastoCatsList).toContain("Mascotas");
    expect(cloud.syncCategoriaAdd).toHaveBeenCalledTimes(1);

    act(() => { result.current.addFinCategory("gasto", "mascotas"); }); // mismo nombre, otra capitalización
    expect(result.current.gastoCatsList.filter(c => c.toLowerCase() === "mascotas")).toHaveLength(1);
    expect(cloud.syncCategoriaAdd).toHaveBeenCalledTimes(1); // no se volvió a sincronizar
  });

  it("removeFinCategory no deja la lista de categorías vacía", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    // Vaciar todas las categorías de ingreso menos una
    const initial = [...result.current.ingresoCatsList];
    act(() => {
      initial.slice(0, -1).forEach(c => result.current.removeFinCategory("ingreso", c));
    });
    // Como cada act() captura el snapshot del closure, reintentamos sacando la última manualmente:
    act(() => { result.current.removeFinCategory("ingreso", result.current.ingresoCatsList[0]); });

    expect(result.current.ingresoCatsList.length).toBeGreaterThanOrEqual(1);
  });
});

describe("useFinanceState — recurrentes", () => {
  it("saveRecRecord crea una plantilla recurrente y la sincroniza", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.openRecForm("gasto"); });
    act(() => { result.current.setRecForm(f => ({ ...f, nombre: "Netflix", valor: "15", diaMes: 5 })); });
    act(() => { result.current.saveRecRecord(); });

    expect(result.current.recurrentes).toHaveLength(1);
    expect(result.current.recurrentes[0]).toMatchObject({ nombre: "Netflix", valor: 15, diaMes: 5, activo: true });
    expect(cloud.syncRecurrenteUpsert).toHaveBeenCalled();
  });

  it("toggleRecActivo invierte el estado activo y resincroniza", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.openRecForm("gasto"); });
    act(() => { result.current.setRecForm(f => ({ ...f, nombre: "Gym", valor: "30" })); });
    act(() => { result.current.saveRecRecord(); });
    const id = result.current.recurrentes[0].id;

    act(() => { result.current.toggleRecActivo(id); });
    expect(result.current.recurrentes[0].activo).toBe(false);
    act(() => { result.current.toggleRecActivo(id); });
    expect(result.current.recurrentes[0].activo).toBe(true);
  });

  it("auto-genera el movimiento del mes cuando ya pasó el día configurado y no se generó todavía", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    const now = new Date();
    // Día ya pasado este mes (o el 1, que siempre ya "pasó" al momento de correr el test)
    act(() => { result.current.openRecForm("gasto"); });
    act(() => { result.current.setRecForm(f => ({ ...f, nombre: "Renta", valor: "500", diaMes: 1 })); });
    act(() => { result.current.saveRecRecord(); });

    // El useEffect de auto-generación corre solo al montar/actualizar recurrentes
    expect(result.current.gastos.some(g => g.nombre === "Renta" && g.recurrenteId)).toBe(true);
    expect(cloud.syncMovimientoUpsert).toHaveBeenCalledWith("gasto", expect.objectContaining({ nombre: "Renta" }));
    // Y la plantilla queda marcada como generada este mes (no se duplica si se re-renderiza)
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(result.current.recurrentes[0].ultimoGenerado).toBe(mesActual);
  });

  it("no auto-genera nada mientras loaded=false (evita duplicar contra lo que ya viene de la nube/respaldo)", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: false }));

    act(() => { result.current.openRecForm("gasto"); });
    act(() => { result.current.setRecForm(f => ({ ...f, nombre: "Renta", valor: "500", diaMes: 1 })); });
    act(() => { result.current.saveRecRecord(); });

    expect(result.current.gastos).toHaveLength(0);
  });
});

describe("useFinanceState — cálculos derivados", () => {
  it("gastoMesActual suma solo los gastos del mes calendario actual, en la moneda seleccionada", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;

    act(() => { result.current.openFinForm("gasto"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "A", fecha: hoy, valor: "100" })); });
    act(() => { result.current.saveFinRecord(); });
    act(() => { result.current.openFinForm("gasto"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "B", fecha: "2020-01-01", valor: "9999" })); }); // fuera del mes actual
    act(() => { result.current.saveFinRecord(); });

    expect(result.current.gastoMesActual).toBe(100);
  });

  it("balanceMesActual = ingresos - gastos del mes actual", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;

    act(() => { result.current.openFinForm("ingreso"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "Sueldo", fecha: hoy, valor: "1000" })); });
    act(() => { result.current.saveFinRecord(); });
    act(() => { result.current.openFinForm("gasto"); });
    act(() => { result.current.setFinForm(f => ({ ...f, nombre: "Renta", fecha: hoy, valor: "300" })); });
    act(() => { result.current.saveFinRecord(); });

    expect(result.current.balanceMesActual).toBe(700);
  });

  it("setPresupuestoCategoria guarda y sincroniza; '' o null borra el presupuesto de esa categoría", () => {
    const cloud = makeMockCloud();
    const { result } = renderHook(() => useFinanceState({ cloud, loaded: true }));

    act(() => { result.current.setPresupuestoCategoria("Comida", "200"); });
    expect(result.current.presupuestosCat.Comida).toBe(200);
    expect(cloud.syncPresupuesto).toHaveBeenCalledWith("Comida", 200);

    act(() => { result.current.setPresupuestoCategoria("Comida", ""); });
    expect(result.current.presupuestosCat.Comida).toBeUndefined();
    expect(cloud.syncPresupuesto).toHaveBeenCalledWith("Comida", null);
  });
});
