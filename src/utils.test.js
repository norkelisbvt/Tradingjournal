// ─── Tests de las funciones puras de utils.js ──────────────────────────────
// Enfocado en las funciones que calculan plata/riesgo: un bug acá no rompe la
// UI, calcula mal y el usuario no se entera. No testeamos las funciones que
// tocan DOM/canvas/File (compressImage, svgToPngDataUrl, rasterizeAppIcon,
// etc.) porque no son cálculo — son integración con el navegador.
//
// IMPORTANTE: "./theme" y "./constants" se mockean acá con valores mínimos de
// prueba, NO con tus valores reales de producción (no los tengo). Los
// nombres exportados sí tienen que coincidir con tus archivos reales o los
// imports de utils.js van a fallar — si migraste algún nombre, actualizá los
// mocks de abajo.
//
// Correr con: npx vitest run

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./theme", () => ({
  T: { textFaint: "#888", loss: "#e5484d" },
}));
vi.mock("./constants", () => ({
  INST_META: {},
  DEMO_TRADES: {},
  REMINDERS_KEY: "reminders",
  DEFAULT_REMINDERS: [],
  ONBOARDING_KEY: "onboarding",
  GROUP_SHADES: { personal: ["#a"], funded: ["#b"] },
  DEFAULT_ACCOUNTS: {},
  DEFAULT_ACCOUNT_ORDER: { personal: [], funded: [] },
  APP_ICON_SVG: "<svg></svg>",
}));

import {
  computeAdvancedMetrics, computeCurrentStreak, streakTier, computePlaybookAdherence,
  computeRiskAlerts, migrateAccountsData, money, pctFmt, moneyCompact, validateTradeForm,
  groupOf, toggleInstrument, isWinPnl, isLossPnl, isBEPnl, toISODate,
  computeHoldTimeStats, formatDuration, computeEmotionStats, inferSessionFromUTCHour,
} from "./utils.js";

// ─── computeAdvancedMetrics ─────────────────────────────────────────────────
describe("computeAdvancedMetrics", () => {
  // 2 ganadoras (+200, +150), 2 perdedoras (-100, -50), 1 break-even (0),
  // todas con riskPct 1% sobre una cuenta de $10.000 (riesgo = $100/trade).
  const trades = [
    { id: 1, date: "2026-01-01", pnl: 200, riskPct: 1 },
    { id: 2, date: "2026-01-02", pnl: -100, riskPct: 1 },
    { id: 3, date: "2026-01-03", pnl: 150, riskPct: 1 },
    { id: 4, date: "2026-01-04", pnl: -50, riskPct: 1 },
    { id: 5, date: "2026-01-05", pnl: 0, riskPct: 1 },
  ];

  it("calcula drawdown máximo en $ y %", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    // equity: 10000→10200→10100→10250→10200→10200. Peor caída: 10200→10100 = $100
    expect(m.maxDD).toBe(100);
    expect(m.maxDDPct).toBeCloseTo(0.9804, 3);
  });

  it("calcula profit factor (ganancia bruta / pérdida bruta)", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    // 350 ganados / 150 perdidos
    expect(m.profitFactor).toBeCloseTo(2.3333, 3);
  });

  it("profit factor es Infinity si no hay pérdidas", () => {
    const allWins = computeAdvancedMetrics(
      [{ id: 1, date: "2026-01-01", pnl: 100 }, { id: 2, date: "2026-01-02", pnl: 50 }],
      10000
    );
    expect(allWins.profitFactor).toBe(Infinity);
  });

  it("expectancy en R y en $ promedia TODOS los trades, incluido el break-even", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    expect(m.expectancyR).toBeCloseTo(0.4, 5);      // (2 -1 +1.5 -0.5 +0) / 5
    expect(m.expectancyDollar).toBe(40);             // (200-100+150-50+0) / 5
  });

  it("calcula Sharpe y Sortino sobre retornos % por trade", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    expect(m.sharpe).toBeCloseTo(0.3455, 3);
    expect(m.sortino).toBeCloseTo(0.5060, 3);
  });

  it("Kelly Criterion queda acotado a [0, 100]", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    expect(m.kellyPct).toBeCloseTo(28.5714, 3);
    expect(m.kellyPct).toBeGreaterThanOrEqual(0);
    expect(m.kellyPct).toBeLessThanOrEqual(100);
  });

  it("recoveryFactor y calmarRatio relacionan ganancia neta con el drawdown", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    expect(m.recoveryFactor).toBe(2);        // 200 de ganancia neta / 100 de maxDD
    expect(m.calmarRatio).toBeCloseTo(2.04, 2);
  });

  it("con 0 trades no revienta y devuelve valores neutros/null en vez de NaN", () => {
    const m = computeAdvancedMetrics([], 10000);
    expect(m.count).toBe(0);
    expect(m.maxDD).toBe(0);
    expect(m.profitFactor).toBe(0);
    expect(m.sharpe).toBeNull();
    expect(m.sortino).toBeNull();
    expect(m.recoveryFactor).toBeNull();
    expect(m.calmarRatio).toBeNull();
    expect(m.kellyPct).toBeNull();
    expect(Number.isNaN(m.expectancyR)).toBe(false);
  });

  it("con tamaño de cuenta 0 (cuenta sin configurar) no calcula % sobre nada", () => {
    const m = computeAdvancedMetrics(trades, 0);
    expect(m.totalReturnPct).toBeNull();
    expect(m.sharpe).toBeNull();
    expect(m.sortino).toBeNull();
  });

  it("distribuye los R-múltiplos en los buckets del histograma", () => {
    const m = computeAdvancedMetrics(trades, 10000);
    const byLabel = Object.fromEntries(m.buckets.map(b => [b.label, b.count]));
    // R-múltiplos: [2, -1, 1.5, -0.5, 0]
    expect(byLabel["-1R a 0R"]).toBe(2);  // -1 y -0.5
    expect(byLabel["0R a 1R"]).toBe(1);   // 0
    expect(byLabel["1R a 2R"]).toBe(1);   // 1.5
    expect(byLabel["2R a 3R"]).toBe(1);   // 2
    expect(byLabel["< -2R"]).toBe(0);
    expect(byLabel["> 3R"]).toBe(0);
  });
});

// ─── computeCurrentStreak / streakTier ──────────────────────────────────────
describe("computeCurrentStreak", () => {
  it("un trade break-even (dentro de ±$5) corta la racha sin contar como pérdida", () => {
    const s = computeCurrentStreak([
      { id: 1, date: "2026-01-01", pnl: 100 },
      { id: 2, date: "2026-01-02", pnl: 80 },
      { id: 3, date: "2026-01-03", pnl: 2 }, // BE, resetea
    ]);
    expect(s).toEqual({ streak: 0, type: null });
  });

  it("+$5 exacto es break-even, no ganadora", () => {
    expect(computeCurrentStreak([{ id: 1, date: "2026-01-01", pnl: 5 }]))
      .toEqual({ streak: 0, type: null });
  });

  it("$5.01 ya cuenta como ganadora", () => {
    expect(computeCurrentStreak([{ id: 1, date: "2026-01-01", pnl: 5.01 }]))
      .toEqual({ streak: 1, type: "win" });
  });

  it("-$5 exacto es break-even, no perdedora", () => {
    expect(computeCurrentStreak([{ id: 1, date: "2026-01-01", pnl: -5 }]))
      .toEqual({ streak: 0, type: null });
  });

  it("ordena por fecha antes de calcular, sin importar el orden de entrada", () => {
    const s = computeCurrentStreak([
      { id: 2, date: "2026-01-02", pnl: 50 },
      { id: 1, date: "2026-01-01", pnl: 50 },
      { id: 3, date: "2026-01-03", pnl: 50 },
    ]);
    expect(s).toEqual({ streak: 3, type: "win" });
  });
});

describe("streakTier", () => {
  it("sin racha devuelve el estado neutro", () => {
    expect(streakTier(0, null).name).toBe("SIN RACHA");
  });
  it("clasifica rachas perdedoras por umbral (1-2 en calma, 3-4 fría, 5+ alerta roja)", () => {
    expect(streakTier(1, "loss").name).toBe("EN CALMA");
    expect(streakTier(3, "loss").name).toBe("RACHA FRÍA");
    expect(streakTier(5, "loss").name).toBe("ALERTA ROJA");
  });
  it("clasifica rachas ganadoras por umbral (1-2 bronce, 3-4 plata, 5-7 oro, 8+ diamante)", () => {
    expect(streakTier(1, "win").name).toBe("BRONCE");
    expect(streakTier(3, "win").name).toBe("PLATA");
    expect(streakTier(5, "win").name).toBe("ORO");
    expect(streakTier(8, "win").name).toBe("DIAMANTE");
  });
});

// ─── computePlaybookAdherence ───────────────────────────────────────────────
describe("computePlaybookAdherence", () => {
  it("solo cuenta trades donde se evaluó al menos una razón (checked o ignored)", () => {
    const r = computePlaybookAdherence([
      { date: "2026-01-01", pnl: 10, reasons: { a: { checked: true }, b: { checked: true }, c: { ignored: true } } }, // 2/3
      { date: "2026-01-15", pnl: -10, reasons: { a: { checked: false, ignored: true } } }, // 0/1
      { date: "2026-02-01", pnl: 5, reasons: {} }, // sin razones evaluadas -> excluido
    ]);
    expect(r.evaluatedCount).toBe(2);
    expect(r.totalCount).toBe(3);
    expect(r.overall).toBeCloseTo(33.333, 2); // promedio de 66.67% y 0%
  });

  it("agrupa el promedio por mes", () => {
    const r = computePlaybookAdherence([
      { date: "2026-01-01", pnl: 10, reasons: { a: { checked: true }, b: { checked: true }, c: { ignored: true } } },
      { date: "2026-01-15", pnl: -10, reasons: { a: { checked: false, ignored: true } } },
    ]);
    expect(r.monthly).toHaveLength(1);
    expect(r.monthly[0].month).toBe("2026-01");
    expect(r.monthly[0].count).toBe(2);
    expect(r.monthly[0].avg).toBeCloseTo(33.333, 2);
  });

  it("sin trades evaluados, overall es null (no 0, para distinguir 'sin datos' de 'cumplió 0%')", () => {
    const r = computePlaybookAdherence([{ date: "2026-01-01", pnl: 10, reasons: {} }]);
    expect(r.overall).toBeNull();
  });
});

// ─── computeRiskAlerts ───────────────────────────────────────────────────────
describe("computeRiskAlerts", () => {
  const acc = { size: 10000, dailyLossLimitPct: 4, maxDrawdownPct: 8, maxTradesPerDay: 3, weeklyRiskLimitPct: 5 };

  it("sin cuenta, devuelve array vacío (no revienta)", () => {
    expect(computeRiskAlerts(null, [])).toEqual([]);
  });

  it("avisa en 'warn' al llegar al 70% del límite de pérdida diaria", () => {
    const today = toISODate(new Date());
    const alerts = computeRiskAlerts(acc, [{ id: 1, date: today, pnl: -280 }]); // 280/400 = 70%
    expect(alerts.some(a => a.level === "warn" && a.text.includes("pérdida diaria"))).toBe(true);
  });

  it("avisa en 'danger' al 90% y en 'breach' al superar el 100%", () => {
    const today = toISODate(new Date());
    const danger = computeRiskAlerts(acc, [{ id: 1, date: today, pnl: -360 }]); // 90%
    expect(danger.find(a => a.text.includes("pérdida diaria")).level).toBe("danger");

    const breach = computeRiskAlerts(acc, [{ id: 1, date: today, pnl: -410 }]); // 102.5%
    expect(breach.find(a => a.text.includes("pérdida diaria")).level).toBe("breach");
  });

  it("avisa de sobre-trading un trade antes del límite, y en breach al alcanzarlo", () => {
    const today = toISODate(new Date());
    const oneLeft = computeRiskAlerts(acc, [
      { id: 1, date: today, pnl: 10 }, { id: 2, date: today, pnl: 10 },
    ]);
    expect(oneLeft.find(a => a.text.includes("trades hoy")).level).toBe("warn");

    const atLimit = computeRiskAlerts(acc, [
      { id: 1, date: today, pnl: 10 }, { id: 2, date: today, pnl: 10 }, { id: 3, date: today, pnl: 10 },
    ]);
    expect(atLimit.find(a => a.text.includes("trades hoy")).level).toBe("breach");
  });

  it("no genera alerta de pérdida diaria si el día va ganador", () => {
    const today = toISODate(new Date());
    const alerts = computeRiskAlerts(acc, [{ id: 1, date: today, pnl: 500 }]);
    expect(alerts.some(a => a.text.includes("pérdida diaria"))).toBe(false);
  });

  it("ignora límites no configurados (undefined/NaN) sin generar alertas falsas", () => {
    const accSinLimites = { size: 10000 };
    const today = toISODate(new Date());
    expect(computeRiskAlerts(accSinLimites, [{ id: 1, date: today, pnl: -5000 }])).toEqual([]);
  });
});

// ─── migrateAccountsData ────────────────────────────────────────────────────
describe("migrateAccountsData", () => {
  it("sin datos guardados (primera vez), devuelve la estructura vacía por defecto", () => {
    const r = migrateAccountsData(null);
    expect(r).toEqual({ trades: {}, accounts: {}, accountOrder: { personal: [], funded: [] } });
  });

  it("formato nuevo: fusiona campo a campo, no reemplaza la cuenta entera", () => {
    const saved = {
      accountOrder: { personal: ["personal-1"], funded: ["funded-1"] },
      accounts: { "personal-1": { name: "Mi cuenta", size: 5000 } },
      trades: { "personal-1": [{ id: 1, date: "2026-01-01", pnl: 100 }] },
    };
    const r = migrateAccountsData(saved);
    expect(r.accounts["personal-1"]).toEqual({ name: "Mi cuenta", size: 5000 });
    expect(r.trades["personal-1"]).toHaveLength(1);
    expect(r.accountOrder).toEqual({ personal: ["personal-1"], funded: ["funded-1"] });
  });

  it("formato viejo (una sola cuenta personal/funded plana): migra a 'personal-1'/'funded-1'", () => {
    const saved = {
      accounts: { personal: { size: 3000 }, funded: { size: 20000 } },
      trades: { personal: [{ id: 1, date: "2026-01-01", pnl: 50 }], funded: [] },
    };
    const r = migrateAccountsData(saved);
    expect(r.accounts["personal-1"]).toEqual({ name: "Personal 1", size: 3000 });
    expect(r.accounts["funded-1"]).toEqual({ name: "Fondeo 1", size: 20000 });
    expect(r.trades["personal-1"]).toHaveLength(1);
    // formato viejo no trae accountOrder -> se rellena con la cuenta migrada
    // (antes quedaba vacío y la cuenta "desaparecía" del listado; ver fix en
    // migrateAccountsData)
    expect(r.accountOrder).toEqual({ personal: ["personal-1"], funded: ["funded-1"] });

  });
});

// ─── Formato de dinero / porcentajes ────────────────────────────────────────
describe("money / pctFmt / moneyCompact", () => {
  it("money antepone el signo antes del $ en negativos, y no usa '+' en positivos", () => {
    expect(money(1234.5)).toBe("$1.234,50");
    expect(money(-1234.5)).toBe("-$1.234,50");
    expect(money(0)).toBe("$0,00");
  });

  it("pctFmt sigue el mismo criterio de signo que money", () => {
    expect(pctFmt(-3.456)).toBe("-3,46%");
    expect(pctFmt(3.456)).toBe("3,46%");
  });

  it("moneyCompact abrevia a K por encima de 1000", () => {
    expect(moneyCompact(1500)).toBe("$1.5K");
    expect(moneyCompact(-1500)).toBe("-$1.5K");
    expect(moneyCompact(500)).toBe("$500");
  });

  it("valores no numéricos (NaN, undefined) caen a 0 en vez de romper", () => {
    expect(money(undefined)).toBe("$0,00");
    expect(money(NaN)).toBe("$0,00");
  });
});

// ─── validateTradeForm ───────────────────────────────────────────────────────
describe("validateTradeForm", () => {
  it("LONG: el stop loss debe estar por debajo de la entrada", () => {
    expect(validateTradeForm({ direction: "LONG", entry: "100", stopLoss: "105" }))
      .toContain("En un LONG, el Stop Loss debe estar por debajo del precio de entrada.");
    expect(validateTradeForm({ direction: "LONG", entry: "100", stopLoss: "95" })).toEqual([]);
  });

  it("SHORT: el stop loss debe estar por encima de la entrada", () => {
    expect(validateTradeForm({ direction: "SHORT", entry: "100", stopLoss: "95" }))
      .toContain("En un SHORT, el Stop Loss debe estar por encima del precio de entrada.");
    expect(validateTradeForm({ direction: "SHORT", entry: "100", stopLoss: "105" })).toEqual([]);
  });

  it("la fecha de salida no puede ser anterior a la de entrada", () => {
    expect(validateTradeForm({ date: "2026-01-10", exitDate: "2026-01-05" }))
      .toContain("La fecha de salida no puede ser anterior a la fecha de entrada.");
  });

  it("con entry/stopLoss vacíos o no numéricos, no valida esa regla (evita falsos positivos)", () => {
    expect(validateTradeForm({ direction: "LONG", entry: "", stopLoss: "" })).toEqual([]);
  });
});

// ─── Helpers varios ──────────────────────────────────────────────────────────
describe("groupOf", () => {
  it("resuelve subcuentas al grupo correcto por prefijo", () => {
    expect(groupOf("personal-2")).toBe("personal");
    expect(groupOf("funded-3")).toBe("funded");
    expect(groupOf("backtest")).toBe("backtest");
  });
  it("una clave desconocida cae a 'personal' por defecto", () => {
    expect(groupOf("algo-random")).toBe("personal");
  });
});

describe("toggleInstrument", () => {
  it("agrega si no estaba, quita si estaba", () => {
    expect(toggleInstrument(["ES"], "NQ")).toEqual(["ES", "NQ"]);
    expect(toggleInstrument(["ES", "NQ"], "NQ")).toEqual(["ES"]);
  });
  it("no permite dejar la selección vacía", () => {
    expect(toggleInstrument(["ES"], "ES")).toEqual(["ES"]);
  });
});

describe("isWinPnl / isLossPnl / isBEPnl (banda de break-even ±$5)", () => {
  it("los límites exactos (±$5) son break-even, no ganancia/pérdida", () => {
    expect(isBEPnl(5)).toBe(true);
    expect(isBEPnl(-5)).toBe(true);
    expect(isBEPnl(0)).toBe(true);
    expect(isWinPnl(5)).toBe(false);
    expect(isLossPnl(-5)).toBe(false);
  });
  it("apenas fuera del límite ya cuenta como ganancia/pérdida", () => {
    expect(isWinPnl(5.01)).toBe(true);
    expect(isLossPnl(-5.01)).toBe(true);
  });
});

// ─── formatDuration ──────────────────────────────────────────────────────
describe("formatDuration", () => {
  it("minutos puros bajo 1 hora", () => {
    expect(formatDuration(20)).toBe("20m");
    expect(formatDuration(59)).toBe("59m");
  });
  it("horas exactas sin minutos sueltos", () => {
    expect(formatDuration(120)).toBe("2h");
  });
  it("horas con minutos sueltos", () => {
    expect(formatDuration(95)).toBe("1h 35m");
  });
  it("días exactos sin horas sueltas", () => {
    expect(formatDuration(1440)).toBe("1d");
  });
  it("días con horas sueltas", () => {
    expect(formatDuration(1500)).toBe("1d 1h");
  });
});

// ─── computeHoldTimeStats ────────────────────────────────────────────────
describe("computeHoldTimeStats", () => {
  it("devuelve null si ningún trade tiene hora de entrada Y de salida", () => {
    const trades = [{ date: "2026-08-01", pnl: 100 }, { date: "2026-08-02", time: "09:00", pnl: -50 }];
    expect(computeHoldTimeStats(trades, 10000)).toBeNull();
  });

  it("ignora trades sin ambos horarios cargados, pero calcula sobre los que sí los tienen", () => {
    const trades = [
      { date: "2026-08-01", time: "09:00", exitTime: "09:20", pnl: 100 }, // 20 min, con horarios
      { date: "2026-08-02", pnl: -50 }, // sin horarios -> se ignora
    ];
    const stats = computeHoldTimeStats(trades, 10000);
    expect(stats.coveredCount).toBe(1);
    expect(stats.totalCount).toBe(2);
  });

  it("calcula la duración correctamente cruzando fecha de entrada y de salida (trade overnight)", () => {
    const trades = [
      { date: "2026-08-01", time: "22:00", exitDate: "2026-08-02", exitTime: "02:00", pnl: 100 }, // 4 horas, cruza medianoche
    ];
    const stats = computeHoldTimeStats(trades, 10000);
    // 4 horas = 240 min -> cae en el bucket "4-24 h" (el límite del bucket anterior es < 240)
    expect(stats.buckets.find(b => b.id === "long").count).toBe(1);
  });

  it("descarta un trade con hora de salida anterior a la de entrada (dato mal cargado)", () => {
    const trades = [
      { date: "2026-08-01", time: "10:00", exitTime: "09:00", pnl: 100 }, // salida "antes" que entrada
    ];
    expect(computeHoldTimeStats(trades, 10000)).toBeNull();
  });

  it("separa la duración promedio de ganadores y perdedores", () => {
    const trades = [
      { date: "2026-08-01", time: "09:00", exitTime: "09:10", pnl: 100 },  // 10 min, ganador
      { date: "2026-08-01", time: "09:00", exitTime: "09:30", pnl: 100 },  // 30 min, ganador
      { date: "2026-08-01", time: "09:00", exitTime: "11:00", pnl: -50 }, // 120 min, perdedor
    ];
    const stats = computeHoldTimeStats(trades, 10000);
    expect(stats.avgMinutesWin).toBe(20); // (10+30)/2
    expect(stats.avgMinutesLoss).toBe(120);
  });

  it("agrupa correctamente en los buckets de duración", () => {
    const trades = [
      { date: "2026-08-01", time: "09:00", exitTime: "09:05", pnl: 50 },  // 5 min -> scalp
      { date: "2026-08-01", time: "09:00", exitTime: "09:45", pnl: 50 },  // 45 min -> short
      { date: "2026-08-01", time: "09:00", exitTime: "11:00", pnl: 50 },  // 120 min -> medium
    ];
    const stats = computeHoldTimeStats(trades, 10000);
    const byId = Object.fromEntries(stats.buckets.map(b => [b.id, b.count]));
    expect(byId.scalp).toBe(1);
    expect(byId.short).toBe(1);
    expect(byId.medium).toBe(1);
  });
});

// ─── computeEmotionStats ────────────────────────────────────────────────────
describe("computeEmotionStats", () => {
  it("ignora trades sin emociones cargadas", () => {
    const trades = [{ date: "2026-08-01", pnl: 100, emotions: [] }];
    expect(computeEmotionStats(trades, 10000)).toEqual([]);
  });

  it("un trade con 2 emociones suma a las estadísticas de ambas, no se reparte", () => {
    const trades = [{ date: "2026-08-01", pnl: 100, rr: "2", emotions: ["fomo", "confident"] }];
    const stats = computeEmotionStats(trades, 0);
    expect(stats).toHaveLength(2);
    expect(stats.find(s => s.id === "fomo").count).toBe(1);
    expect(stats.find(s => s.id === "confident").count).toBe(1);
  });

  it("avgIntensity es null si ningún trade de esa emoción cargó intensidad", () => {
    const trades = [{ date: "2026-08-01", pnl: 100, emotions: ["fomo"] }];
    expect(computeEmotionStats(trades, 0)[0].avgIntensity).toBeNull();
  });

  it("avgIntensity promedia solo los trades que SÍ cargaron intensidad para esa emoción", () => {
    const trades = [
      { date: "2026-08-01", pnl: 100, emotions: ["fomo"], emotionIntensity: { fomo: 4 } },
      { date: "2026-08-02", pnl: -50, emotions: ["fomo"], emotionIntensity: { fomo: 2 } },
      { date: "2026-08-03", pnl: 20, emotions: ["fomo"] }, // sin intensidad cargada
    ];
    const stats = computeEmotionStats(trades, 0);
    expect(stats[0].count).toBe(3);
    expect(stats[0].avgIntensity).toBe(3); // (4+2)/2, el tercero no cuenta
  });

  it("ordena de mejor a peor R promedio", () => {
    const trades = [
      { date: "2026-08-01", pnl: 500, rr: "3", emotions: ["confident"] },
      { date: "2026-08-02", pnl: -100, rr: "2", emotions: ["revenge"] },
    ];
    const stats = computeEmotionStats(trades, 0);
    expect(stats[0].id).toBe("confident");
    expect(stats[1].id).toBe("revenge");
  });
});

// ─── inferSessionFromUTCHour ────────────────────────────────────────────────
describe("inferSessionFromUTCHour", () => {
  it("clasifica cada franja horaria UTC en la sesión esperada", () => {
    expect(inferSessionFromUTCHour(0)).toBe("Asian");
    expect(inferSessionFromUTCHour(7)).toBe("Asian");
    expect(inferSessionFromUTCHour(8)).toBe("London");
    expect(inferSessionFromUTCHour(12)).toBe("London");
    expect(inferSessionFromUTCHour(13)).toBe("Overlap");
    expect(inferSessionFromUTCHour(16)).toBe("Overlap");
    expect(inferSessionFromUTCHour(17)).toBe("New York");
    expect(inferSessionFromUTCHour(23)).toBe("New York");
  });
});
