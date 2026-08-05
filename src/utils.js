// ─── Utilidades puras: formato, fechas, cálculos de trading, migraciones ────
// Extraído de TradingJournal.jsx (fase 1 de modularización). Funciones puras
// (mismo input → mismo output) o con efectos acotados (localStorage, DOM para
// favicon/manifest) — ninguna devuelve JSX.
import { T } from "./theme";
import {
  INST_META, DEMO_TRADES, REMINDERS_KEY, DEFAULT_REMINDERS, ONBOARDING_KEY,
  GROUP_SHADES, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_ORDER, APP_ICON_SVG,
} from "./constants";

export function instLabel(inst) { return (INST_META[inst] && INST_META[inst].label) || inst; }
export function instEmoji(inst) { return (INST_META[inst] && INST_META[inst].emoji) || "🏳️"; }
// ─── Banda de Break Even compartida ────────────────────────────────────────
// Un trade se considera Break Even (BE) si su P&L cae dentro de ±$5. Esta es
// la ÚNICA definición de la banda en toda la app — TradingJournal.jsx la
// importa de acá en vez de redefinirla, así stats, rachas, dashboard
// principal y playbook usan siempre el mismo criterio.
export const BE_THRESHOLD = 5;
export const isWinPnl = (pnl) => pnl > BE_THRESHOLD;
export const isLossPnl = (pnl) => pnl < -BE_THRESHOLD;
export const isBEPnl = (pnl) => pnl >= -BE_THRESHOLD && pnl <= BE_THRESHOLD;
// Resuelve a qué grupo pertenece una clave de cuenta real (p.ej. "personal-2" → "personal").
export function groupOf(key) {
  if (key === "backtest") return "backtest";
  if (key.startsWith("personal")) return "personal";
  if (key.startsWith("funded")) return "funded";
  return "personal";
}
// Alterna un instrumento dentro de la selección múltiple (evita dejarla vacía)
export function toggleInstrument(prev, inst) {
  if (prev.includes(inst)) {
    return prev.length > 1 ? prev.filter(i => i !== inst) : prev;
  }
  return [...prev, inst];
}
// Resuelve un objeto { preset, customFrom, customTo } a fechas concretas { from, to }.
// "month" respeta el mes/año que se esté navegando (viewYear/viewMonth) si se pasan.
export function resolveDateRange(range, { viewYear, viewMonth } = {}) {
  const now = new Date();
  if (range.preset === "week") {
    const start = startOfWeekDate(new Date());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { from: toISODate(start), to: toISODate(end) };
  }
  if (range.preset === "month") {
    const y = viewYear ?? now.getFullYear(), m = viewMonth ?? now.getMonth();
    const start = new Date(y, m, 1), end = new Date(y, m + 1, 0);
    return { from: toISODate(start), to: toISODate(end) };
  }
  if (range.preset === "year") {
    const y = viewYear ?? now.getFullYear();
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  if (range.preset === "all") return { from: "2000-01-01", to: "2100-01-01" };
  return { from: range.customFrom, to: range.customTo }; // custom
}
// Valida la coherencia de los datos de un trade antes de guardarlo.
// Devuelve un array de mensajes de error (vacío si todo está OK).
export function validateTradeForm(form) {
  const errors = [];
  const entry = parseFloat(form.entry), stopLoss = parseFloat(form.stopLoss);
  if (form.date && form.exitDate && form.exitDate < form.date) {
    errors.push("La fecha de salida no puede ser anterior a la fecha de entrada.");
  }
  if (!isNaN(entry) && !isNaN(stopLoss)) {
    if (form.direction === "LONG" && stopLoss >= entry) {
      errors.push("En un LONG, el Stop Loss debe estar por debajo del precio de entrada.");
    }
    if (form.direction === "SHORT" && stopLoss <= entry) {
      errors.push("En un SHORT, el Stop Loss debe estar por encima del precio de entrada.");
    }
  }
  return errors;
}
// ─── Utilities ────────────────────────────────────────────────────────────────
export const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
export function isoWeekStart(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toISODate(d);
}
// Día ISO de la semana (Lun=1 ... Dom=7), usado en la tabla de trades estilo Notion.
export function isoWeekday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  return day === 0 ? 7 : day;
}
// Extrae la hora de entrada (0-23) de un trade a partir de su campo `time`
// ("HH:MM", guardado por el input type="time" del formulario). Devuelve null
// si el trade no tiene hora registrada (trades viejos, previos a este campo),
// para que el heatmap pueda excluirlos en vez de contarlos como "hora 0".
export function parseTradeHour(t) {
  if (!t || !t.time || typeof t.time !== "string") return null;
  const m = t.time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  return h >= 0 && h <= 23 ? h : null;
}
// Arma la matriz día-de-semana × hora para el heatmap de Estadísticas.
// Devuelve { cells, withTime, withoutTime }:
// - cells: array de 7 días (Lun→Dom) × 24 horas, cada uno { pnl, wins, count }
// - withTime / withoutTime: cuántos trades del set sí/no tenían hora registrada
export function buildHourWeekdayHeatmap(trades) {
  const cells = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ pnl: 0, wins: 0, count: 0 }))
  );
  let withTime = 0, withoutTime = 0;
  trades.forEach(t => {
    const hour = parseTradeHour(t);
    if (hour === null || !t.date) { withoutTime += 1; return; }
    withTime += 1;
    const dayIdx = isoWeekday(t.date) - 1; // 0=Lun ... 6=Dom
    const cell = cells[dayIdx][hour];
    cell.pnl += t.pnl;
    cell.count += 1;
    if (t.pnl > 0) cell.wins += 1;
  });
  return { cells, withTime, withoutTime };
}
// Formato de dinero unificado en toda la app (mismo criterio que el mockup de
// referencia): signo "-" antes del "$" en negativos, sin "+" en positivos,
// siempre 2 decimales y separador de miles. Sustituye a los distintos
// `${x>=0?"+":""}$${x.toFixed(2)}` que había repartidos por el código.
export function money(n, decimals = 2) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${v < 0 ? "-" : ""}$${s}`;
}
// Formato de porcentaje unificado: mismo criterio, sin "+" en positivos, con
// separador de miles cuando corresponde (ej. valores grandes de drawdown acumulado).
export function pctFmt(n, decimals = 2) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${v < 0 ? "-" : ""}${s}%`;
}

export function niceTicks(min, max, targetCount = 4) {
  if (!isFinite(min) || !isFinite(max)) return { ticks: [0, 1], min: 0, max: 1, step: 1 };
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const rawStep = span / Math.max(targetCount, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let niceNorm;
  if (norm <= 1) niceNorm = 1;
  else if (norm <= 2) niceNorm = 2;
  else if (norm <= 2.5) niceNorm = 2.5;
  else if (norm <= 5) niceNorm = 5;
  else niceNorm = 10;
  const step = niceNorm * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin, i = 0; v <= niceMax + step * 1e-6; v = niceMin + (++i) * step) {
    ticks.push(Math.round(v / step) * step);
  }
  return { ticks, min: niceMin, max: niceMax, step };
}
export function moneyCompact(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toFixed(0);
  return `${v < 0 ? "-" : ""}$${s}`;
}
// ─── Sistema de rachas / "medallas" tipográficas ──────────────────────────────
// Calcula la racha actual (ganadora o perdedora) en base al último trade hacia
// atrás, y la traduce a un nivel con nombre, color y mensaje — sin depender de
// iconos: el peso visual recae en la tipografía (tamaño, tracking, mayúsculas).
export function computeCurrentStreak(trades) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
  let streak = 0, type = null;
  sorted.forEach(t => {
    // Un trade Break Even corta la racha sin contar como pérdida.
    if (isBEPnl(t.pnl)) { streak = 0; type = null; return; }
    const isWin = isWinPnl(t.pnl);
    if (type === (isWin ? "win" : "loss")) streak += 1;
    else { streak = 1; type = isWin ? "win" : "loss"; }
  });
  return { streak, type };
}
export function streakTier(streak, type) {
  if (!streak || !type) return { name: "SIN RACHA", color: T.textFaint, sub: "Registra un trade para empezar a medir tu racha." };
  if (type === "loss") {
    if (streak >= 5) return { name: "ALERTA ROJA", color: T.loss, sub: `${streak} pérdidas seguidas — considera pausar y revisar tu plan.` };
    if (streak >= 3) return { name: "RACHA FRÍA", color: "#e5484d", sub: `${streak} pérdidas seguidas. Mantené la disciplina, no fuerces el próximo entry.` };
    return { name: "EN CALMA", color: "#f59e0b", sub: `${streak} pérdida${streak > 1 ? "s" : ""} seguida${streak > 1 ? "s" : ""}. Nada fuera de lo normal.` };
  }
  if (streak >= 8) return { name: "DIAMANTE", color: "#38bdf8", sub: `${streak} operaciones ganadoras seguidas — racha excepcional.` };
  if (streak >= 5) return { name: "ORO", color: "#d97706", sub: `${streak} ganadoras seguidas. Seguí ejecutando tu plan.` };
  if (streak >= 3) return { name: "PLATA", color: "#8b8fa3", sub: `${streak} ganadoras seguidas. Buen momentum.` };
  return { name: "BRONCE", color: "#b45309", sub: `${streak} ganadora${streak > 1 ? "s" : ""} seguida${streak > 1 ? "s" : ""}. Recién empezando la racha.` };
}
export function accountAccent(groupKey, idx) {
  const shades = GROUP_SHADES[groupKey] || GROUP_SHADES.personal;
  return shades[idx % shades.length];
}
// ─── Historical Analysis Panel ─────────────────────────────────────────────────
// ─── Historical Analysis Panel (datos reales, filtrados por rango de fechas) ──
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function startOfWeekDate(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
// Devuelve siempre un array de setups para un trade, sin importar si viene del
// formato antiguo (campo "setup" string) o el nuevo (campo "setups" array).
export function getTradeSetups(t) {
  if (Array.isArray(t.setups)) return t.setups;
  if (t.setup) return [t.setup];
  return [];
}
export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
// Comprime una imagen: la redimensiona (máx. 1600px de lado más largo) y la
// convierte a JPG con calidad 80% — reduce mucho el peso sin perder detalle
// visual relevante para revisar un gráfico de trading.
// Redimensiona un archivo de imagen a un <canvas>, preservando el aspect
// ratio — sin decidir todavía formato ni calidad de salida, eso lo define
// cada consumidor según su necesidad (compressImage de acá abajo guarda
// localmente como data URL JPEG liviana; cloud/r2.js sube a R2 priorizando
// WebP). Antes este cálculo estaba duplicado en los dos archivos con
// pequeñas diferencias que podían desincronizarse con el tiempo.
export async function resizeImageToCanvas(file, maxDim = 1600) {
  let width, height, drawSource;
  if (typeof createImageBitmap === "function") {
    // Más rápido y sin los callbacks onload/onerror de Image — se usa
    // cuando el entorno lo soporta (todos los navegadores modernos).
    const bitmap = await createImageBitmap(file);
    width = bitmap.width; height = bitmap.height; drawSource = bitmap;
  } else {
    // Fallback para entornos sin createImageBitmap.
    drawSource = await new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.onload = () => resolve(img); img.onerror = reject; img.src = reader.result; };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    width = drawSource.width; height = drawSource.height;
  }
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  // Fondo blanco (por si el original tenía transparencia, evita bordes negros en JPG)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(drawSource, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function compressImage(file, { maxDim = 1600, quality = 0.8 } = {}) {
  const canvas = await resizeImageToCanvas(file, maxDim);
  return canvas.toDataURL("image/jpeg", quality);
}
// Descarga cualquier contenido de texto como archivo (CSV, JSON, etc.)
// Convierte un elemento <svg> del DOM a una imagen PNG (data URL), para poder
// incrustarla en el PDF exportado (jsPDF no puede dibujar SVG directamente).
export function svgToPngDataUrl(svgEl, scale = 2, bg = "#ffffff") {
  return new Promise((resolve, reject) => {
    try {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      const vb = svgEl.viewBox?.baseVal;
      const w = (vb?.width || svgEl.clientWidth || 540) * scale;
      const h = (vb?.height || svgEl.clientHeight || 170) * scale;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}
// Dispara la descarga de una imagen ya generada (data URL de svgToPngDataUrl,
// típicamente) — separado de downloadTextFile porque acá el contenido ya es
// binario/base64, no texto a envolver en un Blob nuevo.
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
export function downloadTextFile(content, filename, mime = "text/plain") {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvEscape(val) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
export function exportTradesToCSV(trades, filename) {
  const headers = ["Fecha", "Hora", "Instrumento", "Dirección", "Sesión", "Entrada", "Salida", "Lotes", "R:R", "P&L", "Setup", "Tags", "Notas", "Razones cumplidas", "Señales ignoradas", "Emociones"];
  const rows = trades.map(t => {
    const reasonsChecked = Object.entries(t.reasons || {}).filter(([, v]) => v.checked && !v.ignored).map(([k]) => k).join(" | ");
    const reasonsIgnored = Object.entries(t.reasons || {}).filter(([, v]) => v.ignored).map(([k]) => k).join(" | ");
    const emotions = (t.emotions || []).join(" | ");
    const tags = (t.tags || []).join(" | ");
    return [t.date, t.time || "", t.instrument, t.direction, t.session, t.entry, t.exit, t.size, t.rr, t.pnl, getTradeSetups(t).join(" | "), tags, t.notes, reasonsChecked, reasonsIgnored, emotions];
  });
  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
  downloadTextFile("\uFEFF" + csv, filename, "text/csv"); // BOM para que Excel detecte UTF-8 bien
}
// Calcula métricas avanzadas de performance sobre un set de trades ya filtrado y
// ordenado cronológicamente: drawdown máximo, expectancy, distribución de
// R-múltiplos, y Sharpe/Sortino ratio (sobre retornos por trade, sin anualizar).
// ─── R-múltiplo de un trade individual ─────────────────────────────────────
// Extraído de computeAdvancedMetrics para poder reusar EXACTAMENTE el mismo
// criterio en otros cálculos (ej. computeEmotionStats) sin duplicar la lógica
// ni arriesgar que los dos lugares terminen calculando el R distinto.
// Usa riskPct del trade contra el tamaño de cuenta ACTUAL para estimar el $
// arriesgado (1R). Si no hay riskPct guardado, cae a una aproximación con el
// R:R cargado (ganancia = rr, pérdida = -1) — ver nota larga en el llamador
// original sobre por qué esto puede mezclar "R real" con "R estimado".
export function tradeRMultiple(trade, accountSize) {
  const riskPct = parseFloat(trade.riskPct);
  const riskDollars = accountSize && riskPct ? (accountSize * riskPct) / 100 : null;
  if (riskDollars && riskDollars > 0) return trade.pnl / riskDollars;
  return trade.pnl > 0 ? (parseFloat(trade.rr) || 1) : -1;
}

export function computeAdvancedMetrics(trades, accountSize) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
  const size = accountSize || 0;

  // Equity curve, drawdown máximo y curva de drawdown (% bajo el último pico, trade a trade)
  let equity = size, peak = size, maxDD = 0, maxDDPct = 0;
  const curve = [];
  const drawdownCurve = [];
  sorted.forEach(t => {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    if (ddPct > maxDDPct) maxDDPct = ddPct;
    curve.push({ date: t.date, equity });
    drawdownCurve.push({ date: t.date, ddPct: -ddPct, ddDollars: -dd });
  });

  // Profit factor: ganancia bruta / pérdida bruta (en valor absoluto). Un
  // trade Break Even (dentro de ±$5) no suma a ninguno de los dos lados.
  const grossWinDollars = sorted.filter(t => isWinPnl(t.pnl)).reduce((s, t) => s + t.pnl, 0);
  const grossLossDollars = Math.abs(sorted.filter(t => isLossPnl(t.pnl)).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLossDollars > 0 ? grossWinDollars / grossLossDollars : (grossWinDollars > 0 ? Infinity : 0);

  // R-múltiplos por trade: usa riskPct del trade (o el % de la cuenta arriesgado)
  // contra el tamaño de cuenta actual para estimar el $ arriesgado (1R). Si no hay
  // riskPct guardado, usa el R:R cargado como aproximación (ganancia = rr, pérdida = -1).
  const rMultiples = sorted.map(t => tradeRMultiple(t, size));

  const wins = sorted.filter(t => isWinPnl(t.pnl));
  const losses = sorted.filter(t => isLossPnl(t.pnl));
  const winRate = sorted.length ? wins.length / sorted.length : 0;
  const avgWinR = wins.length ? rMultiples.filter((r, i) => isWinPnl(sorted[i].pnl)).reduce((s, r) => s + r, 0) / wins.length : 0;
  const avgLossR = losses.length ? Math.abs(rMultiples.filter((r, i) => isLossPnl(sorted[i].pnl)).reduce((s, r) => s + r, 0) / losses.length) : 0;
  // Expectancy en R: promedio directo de los R-múltiplos de TODOS los trades
  // (gane, pierda o quede en BE). Es matemáticamente equivalente a la fórmula
  // winRate·avgWinR − lossRate·avgLossR cuando solo hay dos resultados
  // posibles, pero sigue siendo correcto ahora que existe un tercer estado
  // (BE) que esa fórmula derivada no contemplaba.
  const expectancyR = rMultiples.length ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;
  const expectancyDollar = sorted.length ? sorted.reduce((s, t) => s + t.pnl, 0) / sorted.length : 0;

  // Buckets para el histograma de distribución de R-múltiplos
  const buckets = [
    { label: "< -2R", test: r => r < -2 },
    { label: "-2R a -1R", test: r => r >= -2 && r < -1 },
    { label: "-1R a 0R", test: r => r >= -1 && r < 0 },
    { label: "0R a 1R", test: r => r >= 0 && r < 1 },
    { label: "1R a 2R", test: r => r >= 1 && r < 2 },
    { label: "2R a 3R", test: r => r >= 2 && r < 3 },
    { label: "> 3R", test: r => r >= 3 },
  ].map(b => ({ ...b, count: rMultiples.filter(b.test).length }));

  // Sharpe / Sortino sobre retornos % por trade (pnl / tamaño de cuenta), sin anualizar
  const returns = size ? sorted.map(t => (t.pnl / size) * 100) : [];
  const meanRet = returns.length ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
  const variance = returns.length ? returns.reduce((s, r) => s + Math.pow(r - meanRet, 2), 0) / returns.length : 0;
  const stdDev = Math.sqrt(variance);
  const downside = returns.filter(r => r < 0);
  const downsideVar = downside.length ? downside.reduce((s, r) => s + Math.pow(r, 2), 0) / downside.length : 0;
  const downsideDev = Math.sqrt(downsideVar);
  const sharpe = stdDev > 0 ? meanRet / stdDev : null;
  const sortino = downsideDev > 0 ? meanRet / downsideDev : null;

  const totalReturnPct = size ? ((equity - size) / size) * 100 : null;

  // Recovery Factor: cuánta ganancia neta generaste por cada $ del peor drawdown.
  // >1 significa que ya recuperaste y superaste tu peor caída; cuanto más alto, mejor.
  const netProfitDollars = equity - size;
  const recoveryFactor = maxDD > 0 ? netProfitDollars / maxDD : null;

  // Calmar Ratio: retorno total vs. drawdown máximo, ambos en %. Similar al Recovery
  // Factor pero normalizado en porcentaje, así se puede comparar entre cuentas de
  // distinto tamaño.
  const calmarRatio = maxDDPct > 0 && totalReturnPct != null ? totalReturnPct / maxDDPct : null;

  // Kelly Criterion: fracción de la cuenta que, matemáticamente, maximiza el
  // crecimiento a largo plazo dado tu winrate y tu ratio ganancia/pérdida promedio
  // (en R). f* = W - (1-W)/B, con B = avgWinR/avgLossR. Se limita a [0, 1] porque un
  // Kelly negativo solo significa "esta estrategia no tiene edge, no arriesgues nada".
  let kellyPct = null;
  if (avgLossR > 0 && avgWinR > 0) {
    const B = avgWinR / avgLossR;
    // El Criterio de Kelly asume resultados binarios (gana/pierde): se calcula
    // sobre trades decisivos únicamente (excluye Break Even), porque un
    // empate no aporta información de "ventaja" a la fórmula.
    const decisiveWinRate = wins.length / (wins.length + losses.length);
    const raw = decisiveWinRate - (1 - decisiveWinRate) / B;
    kellyPct = Math.max(0, Math.min(1, raw)) * 100;
  }

  // Riesgo de ruina (Monte Carlo): remuestrea con reemplazo tus propios R-múltiplos
  // históricos para simular miles de secuencias futuras de trades y mide en qué
  // porcentaje de esas simulaciones la cuenta cae por debajo de un umbral de "ruina"
  // (por defecto, -50% del capital). Es una estimación estadística sobre tu
  // comportamiento pasado, no una garantía de lo que va a pasar.
  function computeRiskOfRuin({ ruinThresholdPct = 50, tradesPerSim = 100, simulations = 1500 } = {}) {
    if (rMultiples.length < 10 || !size) return null;
    const riskPcts = sorted.map(t => parseFloat(t.riskPct)).filter(v => !isNaN(v) && v > 0);
    const avgRiskPct = riskPcts.length ? riskPcts.reduce((s, v) => s + v, 0) / riskPcts.length : 1;
    const riskDollars = size * (avgRiskPct / 100);
    const ruinFloor = size * (1 - ruinThresholdPct / 100);
    let ruinCount = 0;
    for (let s = 0; s < simulations; s++) {
      let eq = size;
      let ruined = false;
      for (let i = 0; i < tradesPerSim; i++) {
        const r = rMultiples[Math.floor(Math.random() * rMultiples.length)];
        eq += r * riskDollars;
        if (eq <= ruinFloor) { ruined = true; break; }
      }
      if (ruined) ruinCount++;
    }
    return { pct: (ruinCount / simulations) * 100, ruinThresholdPct, tradesPerSim, avgRiskPct };
  }

  return {
    maxDD, maxDDPct, curve, drawdownCurve, rMultiples, buckets, expectancyR, expectancyDollar,
    profitFactor, sharpe, sortino, totalReturnPct, count: sorted.length,
    recoveryFactor, calmarRatio, kellyPct, computeRiskOfRuin,
  };
}
// ─── Correlación emociones × rendimiento ───────────────────────────────────
// Cada trade puede tener 0, 1 o varias emociones etiquetadas (EmotionSelector
// es multi-select) — un trade con ["fomo","impatient"] suma a las estadísticas
// de AMBAS emociones, no se reparte entre ellas. Esto es intencional: "estaba
// impaciente Y sentí FOMO en este trade" son dos señales independientes, no
// una fracción de cada una.
//
// Importante: el color/orden con el que se muestre el resultado NO debe
// asumirse a partir de si la emoción está en NEG_EMOTIONS — la lista de
// constants.js es una etiqueta de intención ("esto suena a mal hábito"), pero
// el objetivo de este panel es mostrar el resultado REAL medido, que puede
// sorprender (ej. "FOMO" con winrate alto no sería raro si el trader confunde
// entrar rápido a un breakout legítimo con FOMO). El llamador decide cómo
// pintarlo según `avgR`/`pnlTotal`, no según la lista de "negativas".
export function computeEmotionStats(trades, accountSize) {
  const withEmotions = trades.filter(t => Array.isArray(t.emotions) && t.emotions.length > 0);
  const byEmotion = {};
  withEmotions.forEach(t => {
    const r = tradeRMultiple(t, accountSize);
    t.emotions.forEach(emo => {
      if (!byEmotion[emo]) byEmotion[emo] = { id: emo, trades: [], rSum: 0, pnlSum: 0, wins: 0 };
      const bucket = byEmotion[emo];
      bucket.trades.push(t);
      bucket.rSum += r;
      bucket.pnlSum += t.pnl;
      if (isWinPnl(t.pnl)) bucket.wins += 1;
    });
  });
  return Object.values(byEmotion).map(b => ({
    id: b.id,
    count: b.trades.length,
    winRate: b.trades.length ? b.wins / b.trades.length : 0,
    avgR: b.trades.length ? b.rSum / b.trades.length : 0,
    pnlTotal: b.pnlSum,
    pnlAvg: b.trades.length ? b.pnlSum / b.trades.length : 0,
  })).sort((a, b) => b.avgR - a.avgR);
}
// ─── Hold Time: duración real del trade × resultado ────────────────────────
// Requiere hora de ENTRADA y hora de SALIDA cargadas (form.time / form.exitTime)
// — sin ambas no hay forma de calcular una duración real. No se aproxima con
// "diferencia en días" como fallback: para un trade intradía eso da 0 días
// siempre, un dato inútil que ensuciaría el promedio en vez de aportar algo.
// Los trades sin ambos horarios simplemente no entran al cálculo.
const HOLD_BUCKETS = [
  { id: "scalp", label: "< 15 min", max: 15 },
  { id: "short", label: "15-60 min", max: 60 },
  { id: "medium", label: "1-4 h", max: 240 },
  { id: "long", label: "4-24 h", max: 1440 },
  { id: "swing", label: "> 1 día", max: Infinity },
];

function holdMinutes(trade) {
  if (!trade.date || !trade.time || !trade.exitTime) return null;
  const entryMs = new Date(`${trade.date}T${trade.time}:00`).getTime();
  const exitMs = new Date(`${trade.exitDate || trade.date}T${trade.exitTime}:00`).getTime();
  if (Number.isNaN(entryMs) || Number.isNaN(exitMs)) return null;
  const diffMin = (exitMs - entryMs) / 60000;
  return diffMin >= 0 ? diffMin : null; // salida antes que entrada = dato cargado mal, se descarta
}

/** "95" -> "1h 35m", "20" -> "20m", "1500" -> "1d 1h" */
export function formatDuration(totalMinutes) {
  const min = Math.round(totalMinutes);
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  const rem = min % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

export function computeHoldTimeStats(trades, accountSize) {
  const withDuration = trades.map(t => ({ t, min: holdMinutes(t) })).filter(x => x.min != null);
  if (withDuration.length === 0) return null;

  const wins = withDuration.filter(x => isWinPnl(x.t.pnl));
  const losses = withDuration.filter(x => isLossPnl(x.t.pnl));
  const avg = arr => (arr.length ? arr.reduce((s, x) => s + x.min, 0) / arr.length : null);

  const buckets = HOLD_BUCKETS.map((b, i) => {
    const min = i === 0 ? 0 : HOLD_BUCKETS[i - 1].max;
    const inBucket = withDuration.filter(x => x.min >= min && x.min < b.max);
    const bWins = inBucket.filter(x => isWinPnl(x.t.pnl));
    return {
      id: b.id,
      label: b.label,
      count: inBucket.length,
      winRate: inBucket.length ? bWins.length / inBucket.length : 0,
      avgR: inBucket.length ? inBucket.reduce((s, x) => s + tradeRMultiple(x.t, accountSize), 0) / inBucket.length : 0,
    };
  }).filter(b => b.count > 0);

  return {
    coveredCount: withDuration.length,
    totalCount: trades.length,
    avgMinutesWin: avg(wins),
    avgMinutesLoss: avg(losses),
    buckets,
  };
}
// ─── Playbook Scoring (adherencia a la estrategia) ────────────────────────────
// Convierte las "razones cumplidas" (checklist) de cada trade en un puntaje de
// adherencia (0-100%): razones marcadas como cumplidas sobre el total de razones
// evaluadas (cumplidas + ignoradas) en ese trade. Solo cuenta trades donde se
// evaluó al menos una razón. Luego promedia por mes para ver la tendencia.
export function computePlaybookAdherence(trades) {
  const perTrade = trades.map(t => {
    const reasons = Object.values(t.reasons || {});
    const evaluated = reasons.filter(r => r.checked || r.ignored);
    if (!evaluated.length) return null;
    const checked = evaluated.filter(r => r.checked).length;
    return { date: t.date, pnl: t.pnl, score: (checked / evaluated.length) * 100 };
  }).filter(Boolean);

  const overall = perTrade.length ? perTrade.reduce((s, p) => s + p.score, 0) / perTrade.length : null;

  const byMonth = {};
  perTrade.forEach(p => {
    const m = p.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { sum: 0, count: 0 };
    byMonth[m].sum += p.score;
    byMonth[m].count += 1;
  });
  const monthly = Object.entries(byMonth)
    .map(([m, v]) => ({ month: m, avg: v.sum / v.count, count: v.count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { overall, monthly, evaluatedCount: perTrade.length, totalCount: trades.length };
}
// Combina los datos guardados (localStorage / archivo de respaldo) con los valores
// por defecto, migrando formatos antiguos:
//  - guardados de antes de "backtest": simplemente no traían esa clave.
//  - guardados de antes de las subcuentas: traían una única "personal"/"funded"
//    plana en lugar de "personal-1"/"funded-1" dentro de un grupo.
// En ambos casos se rellena lo que falte sin perder los trades ya existentes.
export function migrateAccountsData(saved) {
  let trades = { ...DEMO_TRADES };
  let accounts = { ...DEFAULT_ACCOUNTS };
  let accountOrder = { personal: [...DEFAULT_ACCOUNT_ORDER.personal], funded: [...DEFAULT_ACCOUNT_ORDER.funded] };
  if (!saved) return { trades, accounts, accountOrder };

  const oldAccounts = saved.accounts || {};
  const oldTrades = saved.trades || {};

  if (saved.accountOrder) {
    // Ya está en el formato nuevo (con subcuentas): se combina tal cual.
    accountOrder = {
      personal: oldAccounts && saved.accountOrder.personal?.length ? saved.accountOrder.personal : accountOrder.personal,
      funded: saved.accountOrder.funded?.length ? saved.accountOrder.funded : accountOrder.funded,
    };
    // Fusión campo a campo (no reemplazo total) para que las cuentas guardadas
    // antes de agregar límites de riesgo (dailyLossLimitPct, maxDrawdownPct,
    // maxTradesPerDay) no pierdan esos defaults al cargar un respaldo viejo.
    Object.entries(oldAccounts).forEach(([key, val]) => {
      accounts[key] = { ...(accounts[key] || {}), ...val };
    });
    trades = { ...trades, ...oldTrades };
  } else {
    // Formato viejo: "personal"/"funded" planos (una sola cuenta cada uno).
    // FIX: además de crear la cuenta migrada, hay que agregarla a accountOrder;
    // si no, la cuenta migrada existe en `accounts`/`trades` pero no aparece
    // en el listado de la UI (que se ordena a partir de accountOrder).
    if (oldAccounts.personal) {
      accounts["personal-1"] = { name: "Personal 1", ...oldAccounts.personal };
      trades["personal-1"] = oldTrades.personal || [];
      if (!accountOrder.personal.includes("personal-1")) {
        accountOrder.personal = ["personal-1", ...accountOrder.personal];
      }
    }
    if (oldAccounts.funded) {
      accounts["funded-1"] = { name: "Fondeo 1", ...oldAccounts.funded };
      trades["funded-1"] = oldTrades.funded || [];
      if (!accountOrder.funded.includes("funded-1")) {
        accountOrder.funded = ["funded-1", ...accountOrder.funded];
      }
    }
    if (oldAccounts.backtest) accounts.backtest = { name: "Backtesting", ...oldAccounts.backtest };
    if (oldTrades.backtest) trades.backtest = oldTrades.backtest;
  }
  return { trades, accounts, accountOrder };
}
// ─── Alertas de reglas de prop firm (drawdown diario/total, sobre-trading) ────
// Avisa ANTES de romper la regla (a partir del 70% de uso del límite), no solo
// después de haberla incumplido.
export function computeRiskAlerts(acc, trades) {
  if (!acc) return [];
  const alerts = [];
  const todayISO = toISODate(new Date());
  const todayTrades = trades.filter(t => t.date === todayISO);
  const todayPnL = todayTrades.reduce((s, t) => s + t.pnl, 0);

  // 1) Pérdida diaria vs. límite
  const dailyLimitPct = parseFloat(acc.dailyLossLimitPct);
  if (!isNaN(dailyLimitPct) && dailyLimitPct > 0 && todayPnL < 0) {
    const limitDollars = (acc.size * dailyLimitPct) / 100;
    const usedPct = (Math.abs(todayPnL) / limitDollars) * 100;
    if (usedPct >= 100) {
      alerts.push({ level: "breach", text: `Superaste tu límite de pérdida diaria: ${money(-Math.abs(todayPnL))} de ${money(-limitDollars)} permitidos hoy. Deja de operar hoy.` });
    } else if (usedPct >= 90) {
      alerts.push({ level: "danger", text: `Estás al ${usedPct.toFixed(0)}% de tu límite de pérdida diaria (${money(-Math.abs(todayPnL))} de ${money(-limitDollars)}). Un trade más perdedor y lo rompes.` });
    } else if (usedPct >= 70) {
      alerts.push({ level: "warn", text: `Ya usaste el ${usedPct.toFixed(0)}% de tu límite de pérdida diaria (${money(-Math.abs(todayPnL))} de ${money(-limitDollars)}). Opera con cautela.` });
    }
  }

  // 2) Drawdown total (desde el pico de equity) vs. límite
  const maxDDPct = parseFloat(acc.maxDrawdownPct);
  if (!isNaN(maxDDPct) && maxDDPct > 0 && trades.length > 0) {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
    let running = acc.size, peak = acc.size;
    sorted.forEach(t => { running += t.pnl; if (running > peak) peak = running; });
    const ddDollars = peak - running;
    const ddPct = peak > 0 ? (ddDollars / peak) * 100 : 0;
    const usedPct = (ddPct / maxDDPct) * 100;
    if (ddPct >= maxDDPct) {
      alerts.push({ level: "breach", text: `Drawdown total del ${ddPct.toFixed(1)}%, supera tu límite de ${maxDDPct}%. Cuenta en riesgo de incumplimiento.` });
    } else if (usedPct >= 90) {
      alerts.push({ level: "danger", text: `Drawdown total del ${ddPct.toFixed(1)}% (límite ${maxDDPct}%) — muy cerca de romper la regla.` });
    } else if (usedPct >= 70) {
      alerts.push({ level: "warn", text: `Drawdown total del ${ddPct.toFixed(1)}% (límite ${maxDDPct}%). Vigila el riesgo por trade.` });
    }
  }

  // 3) Sobre-trading: número de trades hoy vs. límite diario
  const maxTrades = parseFloat(acc.maxTradesPerDay);
  if (!isNaN(maxTrades) && maxTrades > 0) {
    if (todayTrades.length >= maxTrades) {
      alerts.push({ level: "breach", text: `Llevas ${todayTrades.length} trades hoy — tu límite es ${maxTrades}. Deja de operar por hoy (sobre-trading).` });
    } else if (todayTrades.length === maxTrades - 1) {
      alerts.push({ level: "warn", text: `Llevas ${todayTrades.length} trades hoy, tu límite es ${maxTrades}. Te queda 1 antes de sobre-operar.` });
    }
  }

  // 4) Riesgo semanal acumulado: suma del % de riesgo cargado en cada trade de
  // esta semana (lunes a domingo) vs. el límite semanal configurado en la cuenta.
  // Es independiente de la alerta de pérdida diaria/drawdown: mide riesgo asumido,
  // no resultado.
  const weeklyLimitPct = parseFloat(acc.weeklyRiskLimitPct);
  if (!isNaN(weeklyLimitPct) && weeklyLimitPct > 0) {
    const weekStartISO = toISODate(startOfWeekDate(new Date()));
    const weekEndDate = new Date(weekStartISO + "T00:00:00");
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEndISO = toISODate(weekEndDate);
    const weekTrades = trades.filter(t => t.date >= weekStartISO && t.date <= weekEndISO);
    const weeklyRiskUsedPct = weekTrades.reduce((s, t) => s + (parseFloat(t.riskPct) || 0), 0);
    const usedOfLimitPct = (weeklyRiskUsedPct / weeklyLimitPct) * 100;
    if (weeklyRiskUsedPct >= weeklyLimitPct) {
      alerts.push({ level: "breach", text: `Riesgo semanal acumulado: ${pctFmt(weeklyRiskUsedPct, 1)} de ${pctFmt(weeklyLimitPct, 1)} permitido. Superaste tu límite de riesgo semanal.` });
    } else if (usedOfLimitPct >= 90) {
      alerts.push({ level: "danger", text: `Riesgo semanal al ${usedOfLimitPct.toFixed(0)}% de tu límite (${pctFmt(weeklyRiskUsedPct, 1)} de ${pctFmt(weeklyLimitPct, 1)}). Estás muy cerca de agotarlo.` });
    } else if (usedOfLimitPct >= 70) {
      alerts.push({ level: "warn", text: `Ya usaste el ${usedOfLimitPct.toFixed(0)}% de tu riesgo semanal permitido (${pctFmt(weeklyRiskUsedPct, 1)} de ${pctFmt(weeklyLimitPct, 1)}).` });
    }
  }

  return alerts;
}
export function loadReminders() {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return DEFAULT_REMINDERS;
}
export function hasSeenOnboarding() {
  try { return localStorage.getItem(ONBOARDING_KEY) === "1"; } catch { return true; }
}
export function markOnboardingSeen() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}
// Rasteriza el SVG de marca a PNG cuadrado del tamaño pedido, usando un
// <canvas> oculto. Devuelve una data-URL ("" si algo falla, p.ej. entorno
// sin DOM/canvas) — se usa para apple-touch-icon y los íconos del manifest.
export function rasterizeAppIcon(size) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = `data:image/svg+xml,${encodeURIComponent(APP_ICON_SVG)}`;
    } catch {
      resolve("");
    }
  });
}
// Crea (o reutiliza) una etiqueta <meta name="..."> y le fija su contenido.
export function setMetaTag(name, content, attr = "name") {
  let tag = document.querySelector(`meta[${attr}='${name}']`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
  return tag;
}