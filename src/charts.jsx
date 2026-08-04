// ─── Componentes de gráficos (migrados a visx) ──────────────────────────────
// Extraído de TradingJournal.jsx (fase 1 de modularización) y luego migrado
// de SVG a mano a primitivas de visx (@visx/scale, @visx/shape, @visx/group,
// @visx/gradient, @visx/heatmap). La lógica de negocio (zoom/pan, tooltips,
// export a PNG, animaciones CSS) se mantiene igual; lo que cambia es CÓMO se
// calculan escalas/posiciones y cómo se dibujan las formas. Todos reciben
// datos por props y no dependen del estado del componente principal — se
// pueden usar, testear o reemplazar de forma aislada.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TrendingUp, Download, RotateCcw } from "lucide-react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { LinePath, Area, AreaClosed, Bar, Pie, Arc } from "@visx/shape";
import { LinearGradient } from "@visx/gradient";
import { HeatmapRect } from "@visx/heatmap";
import { T, FS, numMonoStyle, S } from "./theme";
import { INSTRUMENTS, INST_COLOR, MONTHS_SHORT, EMOTIONS, CONFETTI_COLORS, NEG_EMOTIONS, ROUTINE_ACTIVITIES } from "./constants";
import { instLabel, instEmoji, getDaysInMonth, money, moneyCompact, toISODate, svgToPngDataUrl, downloadDataUrl, niceTicks, buildHourWeekdayHeatmap } from "./utils";

// Botón pequeño y discreto (aparece al pasar el mouse por el gráfico) para
// exportar el SVG actual como PNG. Reutilizado por varios gráficos — cada uno
// le pasa su propio <svg> vía ref y un nombre de archivo descriptivo.
function ChartExportButton({ svgRef, filename, visible }) {
  const [busy, setBusy] = useState(false);
  const handleClick = async (e) => {
    e.stopPropagation();
    if (!svgRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await svgToPngDataUrl(svgRef.current, 2.5, T.surface);
      downloadDataUrl(dataUrl, filename);
    } catch {
      // Exportar es un extra, no algo crítico — si falla (navegador viejo,
      // etc.) simplemente no pasa nada; no interrumpimos con un error visible.
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={handleClick} title="Descargar como imagen" aria-label="Descargar gráfico como imagen"
      style={{
        position: "absolute", top: 4, right: 4, zIndex: 6,
        width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted,
        opacity: visible ? 1 : 0, transition: "opacity 0.15s ease", cursor: "pointer",
      }}>
      <Download size={13} />
    </button>
  );
}

// Mide el ancho real en píxeles de un contenedor con ResizeObserver. Se usa en
// todos los gráficos SVG de ancho variable para igualar su viewBox al tamaño
// realmente renderizado — así el navegador nunca tiene que escalar X e Y con
// factores distintos (lo que difumina/deforma líneas y texto).
export function useMeasuredWidth(fallback = 700) {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(fallback);
  const ref = useCallback((el) => setNode(el), []);
  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(prev => (Math.abs(w - prev) > 0.5 ? w : prev));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);
  return [ref, Math.max(200, Math.round(width))];
}

// ─── Gráfico premium reutilizable (grid + ejes + tooltip al hover) ────────────
// Componente genérico para curvas acumuladas (equity, drawdown, etc.), ahora
// sobre primitivas de visx: @visx/scale (scaleLinear) para posicionar puntos,
// @visx/shape (Area + LinePath) para el relleno y la línea, y @visx/gradient
// para el degradado bajo la curva. El resto (zoom con rueda, paneo arrastrando,
// tooltip que sigue al mouse) es lógica propia de la app — visx no impone un
// motor de interacción, así que se conserva tal cual estaba.
// points: [{ x: cualquier valor, y: number, label: string (fecha u otra etiqueta) }]
export function InteractiveCurveChart({
  points, color = T.gain, height = 220, formatValue = v => String(v),
  formatSub = null, referenceValue = null, referenceLabel = null, fillOpacity = 0.28,
  emptyLabel = "Aún no hay suficientes datos para graficar.", exportFilename = "grafico.png",
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [measuredW, setMeasuredW] = useState(700);
  const [hoverContainer, setHoverContainer] = useState(false);
  const gradId = useRef(`grad-${Math.random().toString(36).slice(2, 9)}`).current;

  // Zoom/pan: "zoom" guarda el rango VISIBLE como fracción [0,1] del total de
  // puntos (0 = primer punto, 1 = último). {start:0,end:1} = sin zoom.
  const [zoom, setZoom] = useState({ start: 0, end: 1 });
  const dragRef = useRef(null); // { startX, zoomStart, zoomEnd } mientras se arrastra
  const [isDragging, setIsDragging] = useState(false);

  const fullN = points.length;
  // Si cambian los datos de fondo (otra cuenta, otro rango de fechas...) el
  // zoom vuelve a 0 — quedarse "zoomeado" sobre un dataset distinto sería
  // confuso. points.length + primer/último label alcanza como huella para
  // detectar "son datos distintos" sin depender de que el padre memoice el
  // array con la misma referencia.
  const dataFingerprint = `${fullN}|${points[0]?.label ?? ""}|${points[fullN - 1]?.label ?? ""}`;
  const prevFingerprint = useRef(dataFingerprint);
  useEffect(() => {
    if (prevFingerprint.current !== dataFingerprint) {
      prevFingerprint.current = dataFingerprint;
      setZoom({ start: 0, end: 1 });
    }
  }, [dataFingerprint]);

  const isZoomed = zoom.end - zoom.start < 0.999;

  // Mide el ancho real del contenedor con ResizeObserver, para que el viewBox
  // del SVG coincida 1:1 con los píxeles renderizados. Sin esto, el navegador
  // escala X e Y con factores distintos y tanto los trazos como el texto de
  // los ejes quedan levemente estirados según el ancho real de pantalla.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setMeasuredW(prev => (Math.abs(w - prev) > 0.5 ? w : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Zoom con la rueda del mouse, centrado en el cursor (como Google Maps): no
  // corre como onWheel de React porque React la registra como "passive" y no
  // deja hacer preventDefault. Se registra a mano como no-pasiva.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || fullN < 2) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorFrac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setZoom(prev => {
        const span = prev.end - prev.start;
        const globalCursorFrac = prev.start + cursorFrac * span;
        const factor = e.deltaY < 0 ? 0.85 : 1 / 0.85; // scroll arriba = acercar
        const minSpan = Math.min(1, 5 / Math.max(fullN - 1, 1)); // no menos de ~5 puntos visibles
        let newSpan = Math.max(minSpan, Math.min(1, span * factor));
        let newStart = globalCursorFrac - (globalCursorFrac - prev.start) * (newSpan / span);
        let newEnd = newStart + newSpan;
        if (newStart < 0) { newEnd -= newStart; newStart = 0; }
        if (newEnd > 1) { newStart -= (newEnd - 1); newEnd = 1; }
        return { start: Math.max(0, newStart), end: Math.min(1, newEnd) };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fullN]);

  // Termina el arrastre (paneo) aunque el mouse se suelte fuera del gráfico.
  useEffect(() => {
    if (!isDragging) return;
    const onUp = () => { dragRef.current = null; setIsDragging(false); };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [isDragging]);

  const empty = fullN < 2;

  let inner = null;
  if (!empty) {
    // Índices visibles del array completo según el zoom actual.
    const rawStart = Math.round(zoom.start * (fullN - 1));
    const rawEnd = Math.round(zoom.end * (fullN - 1));
    const startIdx = Math.max(0, Math.min(rawStart, rawEnd - 1));
    const endIdx = Math.min(fullN - 1, Math.max(rawEnd, startIdx + 1));
    const visiblePoints = points.slice(startIdx, endIdx + 1);
    const n = visiblePoints.length;

    const W = Math.max(200, Math.round(measuredW)), H = height;
    const padL = 56, padR = 14, padT = 16, padB = 26;
    const innerW = W - padL - padR, innerH = H - padT - padB;

    const vals = visiblePoints.map(p => p.y).concat(referenceValue != null ? [referenceValue] : []);
    const maxRaw = Math.max(...vals);
    const minRaw = Math.min(...vals);
    const spread = (maxRaw - minRaw) || Math.abs(maxRaw) || 1;
    const pad = spread * 0.12;
    // Eje calibrado a pasos redondos (ver niceTicks en utils.js): topY/botY ya
    // no son el máximo/mínimo crudo de los datos +/- padding, sino el rango
    // "lindo" más chico que los contiene — así cada línea de grid cae en un
    // número entero/redondo en vez de una fracción arbitraria del máximo.
    const { ticks: yTicks, min: topYmin, max: topYmax } = niceTicks(minRaw - pad, maxRaw + pad, 4);

    // Escalas de visx: reemplazan las funciones x(i)/y(v) hechas a mano.
    const xScale = scaleLinear({ domain: [0, Math.max(n - 1, 1)], range: [padL, padL + innerW] });
    const yScale = scaleLinear({ domain: [topYmin, topYmax], range: [padT + innerH, padT] });

    const anchorY = referenceValue != null ? yScale(referenceValue) : padT + innerH;

    const handleMouseDown = (e) => {
      if (!isZoomed) return; // sin zoom no hay nada para panear
      dragRef.current = { startX: e.clientX, zoomStart: zoom.start, zoomEnd: zoom.end };
      setIsDragging(true);
    };

    const handleMove = (e) => {
      if (dragRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const span = dragRef.current.zoomEnd - dragRef.current.zoomStart;
        const dxFrac = ((e.clientX - dragRef.current.startX) / rect.width) * span;
        let newStart = dragRef.current.zoomStart - dxFrac;
        let newEnd = dragRef.current.zoomEnd - dxFrac;
        if (newStart < 0) { newEnd -= newStart; newStart = 0; }
        if (newEnd > 1) { newStart -= (newEnd - 1); newEnd = 1; }
        setZoom({ start: Math.max(0, newStart), end: Math.min(1, newEnd) });
        return;
      }
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * W;
      let idx = Math.round(xScale.invert(relX));
      idx = Math.max(0, Math.min(n - 1, idx));
      setHover({ i: idx, cx: xScale(idx), cy: yScale(visiblePoints[idx].y) });
    };

    const tooltipLeftPct = hover ? (hover.cx / W) * 100 : 0;
    const tooltipFlip = hover && hover.cx > W * 0.68;

    inner = (
      <>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ width: "100%", height, display: "block", cursor: isDragging ? "grabbing" : isZoomed ? "grab" : "crosshair" }}
          onMouseDown={handleMouseDown} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
          <LinearGradient id={gradId} from={color} to={color} fromOpacity={fillOpacity} toOpacity={0} />
          {/* Grid horizontal + etiquetas eje Y, calibrado a valores redondos (posiciones vía yScale) */}
          {yTicks.map((v, gi) => {
            const gy = yScale(v);
            return (
              <g key={gi}>
                <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={T.border} strokeWidth={1} strokeDasharray={Math.abs(v) < 1e-6 ? undefined : "3,4"} opacity={Math.abs(v) < 1e-6 ? 0.85 : 0.5} />
                <text x={padL - 8} y={gy + 3} fontSize="9.5" fill={T.textFaint} textAnchor="end">{formatValue(v)}</text>
              </g>
            );
          })}
          {/* Línea de referencia (ej. balance inicial o 0%) */}
          {referenceValue != null && (
            <g>
              <line x1={padL} x2={W - padR} y1={yScale(referenceValue)} y2={yScale(referenceValue)} stroke={T.textFaint} strokeWidth={1.3} strokeDasharray="5,3" opacity={0.7} />
              {referenceLabel && <text x={W - padR} y={yScale(referenceValue) - 4} fontSize="9" fill={T.textFaint} textAnchor="end">{referenceLabel}</text>}
            </g>
          )}
          {/* Área + línea de la curva (Area/LinePath de @visx/shape). La línea se
              "dibuja" de izquierda a derecha al montar (pathLength=1 + stroke-dashoffset
              animado por CSS, ver .hz-draw-line), y el área hace fade-in justo detrás. */}
          <Area
            data={visiblePoints}
            x={(d, i) => xScale(i)}
            y0={() => anchorY}
            y1={d => yScale(d.y)}
            fill={`url(#${gradId})`}
            className="hz-draw-area"
          />
          <LinePath
            data={visiblePoints}
            x={(d, i) => xScale(i)}
            y={d => yScale(d.y)}
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="hz-draw-line"
          />
          {/* Punto final destacado */}
          <circle cx={xScale(n - 1)} cy={yScale(visiblePoints[n - 1].y)} r="4" fill={color} stroke={T.surface} strokeWidth="1.5" className="hz-draw-dot" />
          {/* Etiquetas eje X: inicio / medio / fin */}
          {[0, Math.floor((n - 1) / 2), n - 1].map(i => (
            <text key={i} x={xScale(i)} y={H - 8} fontSize="9.5" fill={T.textFaint}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{visiblePoints[i].label}</text>
          ))}
          {/* Crosshair al hover */}
          {hover && (
            <g>
              <line x1={hover.cx} x2={hover.cx} y1={padT} y2={padT + innerH} stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.55" />
              <circle cx={hover.cx} cy={hover.cy} r="5" fill={color} stroke={T.surface} strokeWidth="2" />
            </g>
          )}
        </svg>
        {hover && (
          <div style={{
            position: "absolute", left: `${tooltipLeftPct}%`, top: 6,
            transform: tooltipFlip ? "translate(-100%, 0)" : "translate(8px, 0)",
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
            padding: "7px 11px", fontSize: FS.xs, boxShadow: "0 10px 28px rgba(20,16,40,0.16)",
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
          }}>
            <div style={{ fontWeight: 700, color: T.textFaint, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 9.5 }}>{visiblePoints[hover.i].label}</div>
            <div style={{ fontWeight: 800, color: T.text, fontSize: FS.sm, ...numMonoStyle }}>{formatValue(visiblePoints[hover.i].y)}</div>
            {formatSub && <div style={{ color: T.textMuted, fontSize: 10.5, marginTop: 1 }}>{formatSub(visiblePoints[hover.i])}</div>}
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}
      onMouseEnter={() => setHoverContainer(true)} onMouseLeave={() => setHoverContainer(false)}>
      {empty
        ? <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: FS.base }}>{emptyLabel}</div>
        : inner}
      {!empty && isZoomed && (
        <button onClick={() => setZoom({ start: 0, end: 1 })} title="Restablecer zoom"
          style={{
            position: "absolute", top: 4, left: 4, zIndex: 6, display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px 3px 6px", borderRadius: 999, border: `1px solid ${T.border}`,
            background: T.surface, color: T.textMuted, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
          }}>
          <RotateCcw size={11} /> Restablecer zoom
        </button>
      )}
      {!empty && <ChartExportButton svgRef={svgRef} filename={exportFilename} visible={hoverContainer} />}
    </div>
  );
}

export function Confetti({ count = 26 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.25,
    duration: 1 + Math.random() * 0.6,
    rotate: Math.floor(Math.random() * 360),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + Math.random() * 4,
  })), [count]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {pieces.map(p => (
        <span key={p.id} className="hz-confetti-piece" style={{
          position: "absolute", top: -10, left: `${p.left}%`, width: p.size, height: p.size * 0.4,
          background: p.color, borderRadius: 1,
          animation: `hzConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          transform: `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}
// Hook: dispara Confetti (por ~1.3s) la primera vez que `active` pasa a true
// desde false — así festeja el momento en que se alcanza un hito, sin
// repetirse en cada render mientras el hito sigue cumplido.
export function useCelebration(active) {
  const [show, setShow] = useState(false);
  const prev = useRef(false);
  useEffect(() => {
    if (active && !prev.current) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1500);
      prev.current = active;
      return () => clearTimeout(t);
    }
    prev.current = active;
  }, [active]);
  return show;
}

// ─── Sparkline ──────────────────────────────────────────────────────────────
// Mini-gráfico de tendencia (sin ejes, sin tooltip) para reforzar visualmente
// las cifras KPI de una sola línea (drawdown, profit factor) — Area + LinePath
// de @visx/shape sobre una escala lineal que se normaliza sola a partir de
// `values`. `values` es una serie simple de números.
export function Sparkline({ values, color, width = 72, height = 28, fill = true }) {
  if (!values || values.length < 2) return null;
  const data = values.map((v, i) => ({ i, v }));
  const xScale = scaleLinear({ domain: [0, values.length - 1], range: [0, width] });
  const yScale = scaleLinear({ domain: [Math.min(...values), Math.max(...values)], range: [height, 0] });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
      {fill && (
        <AreaClosed data={data} x={d => xScale(d.i)} y={d => yScale(d.v)} yScale={yScale} fill={color} opacity={0.14} />
      )}
      <LinePath data={data} x={d => xScale(d.i)} y={d => yScale(d.v)} stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Donut "Porcentaje de aciertos" ───────────────────────────────────────────
// Un segmento de anillo por cada cuenta (Personal 1, Personal 2, Fondeo 1...),
// con su % de acierto propio, y el % de acierto combinado en el centro. Los
// segmentos son de ancho IGUAL entre sí (no proporcionales a la cantidad de
// trades) — por eso a <Pie> se le pasa pieValue={() => 1}, y el color/valor
// real de cada uno se dibuja aparte con el % de acierto de esa cuenta.
export function WinRateDonut({ accountList, allTrades, viewYear, viewMonth }) {
  const svgRef = useRef(null);
  const [hoverContainer, setHoverContainer] = useState(false);
  const size = 210, stroke = 26, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const gapAngle = 0.1; // radianes de separación entre segmentos (~6°)

  const monthOf = (t) => {
    const d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  };

  const entries = accountList.map(({ key, label, color }) => {
    const trades = (allTrades[key] || []).filter(monthOf);
    const wins = trades.filter(t => t.pnl >= 0).length;
    const wr = trades.length ? Math.round((wins / trades.length) * 100) : 0;
    return { key, label, color, wr, count: trades.length };
  });

  const totalTrades = entries.reduce((s, e) => s + e.count, 0);
  const totalWins = entries.reduce((s, e) => s + (e.count ? Math.round((e.wr / 100) * e.count) : 0), 0);
  const overallWr = totalTrades ? Math.round((totalWins / totalTrades) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}
        onMouseEnter={() => setHoverContainer(true)} onMouseLeave={() => setHoverContainer(false)}>
        <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Group top={cy} left={cx}>
            <circle cx={0} cy={0} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
            <Pie
              data={entries}
              pieValue={() => 1}
              outerRadius={r + stroke / 2}
              innerRadius={r - stroke / 2}
              padAngle={gapAngle}
              cornerRadius={stroke / 2}
            >
              {(pie) => pie.arcs.map((arc) => {
                const e = arc.data;
                const [lx, ly] = pie.path.centroid(arc);
                const labelScale = 1.32; // empuja la etiqueta un poco afuera del anillo
                return (
                  <g key={e.key}>
                    <path d={pie.path(arc)} fill={e.color} />
                    <text x={lx * labelScale} y={ly * labelScale} fontSize={11.5} fontWeight={800} fill={e.color} textAnchor="middle" dominantBaseline="middle">
                      {e.count ? `${e.wr}%` : "—"}
                    </text>
                  </g>
                );
              })}
            </Pie>
          </Group>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: FS.xl, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{overallWr}%</span>
          <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>Acierto total</span>
        </div>
        <ChartExportButton svgRef={svgRef} filename="porcentaje-de-aciertos.png" visible={hoverContainer} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", marginTop: 14 }}>
        {entries.map(e => (
          <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.color, display: "inline-block" }} />
            {e.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── "Rentabilidad de la inversión": barras $ mensuales + línea % acumulada ──
// Modo "$" usa <Bar> de @visx/shape sobre escalas lineales; modo "%" reutiliza
// InteractiveCurveChart (ya migrado a visx más arriba).
export function ProfitabilityChart({ trades, accountSize }) {
  const [mode, setMode] = useState("dollar"); // "dollar" | "percent"
  const [hoverBar, setHoverBar] = useState(null);
  const [containerRef, measuredW] = useMeasuredWidth(900);

  const months = useMemo(() => {
    if (trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].date.slice(0, 7);
    const last = sorted[sorted.length - 1].date.slice(0, 7);
    const [fy, fm] = first.split("-").map(Number);
    const [ly, lm] = last.split("-").map(Number);
    const out = [];
    let y = fy, m = fm - 1;
    while (y < ly || (y === ly && m <= lm - 1)) {
      out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
      m++; if (m > 11) { m = 0; y++; }
    }
    return out.slice(-9); // últimos 9 meses con actividad, como en la referencia
  }, [trades]);

  const data = useMemo(() => {
    let cum = 0;
    return months.map(mk => {
      const monthPnl = trades.filter(t => t.date.startsWith(mk)).reduce((s, t) => s + t.pnl, 0);
      cum += monthPnl;
      const cumPct = accountSize > 0 ? (cum / accountSize) * 100 : 0;
      const [y, m] = mk.split("-");
      return { mk, label: `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`, monthPnl, cumPct };
    });
  }, [months, trades, accountSize]);

  const W = measuredW, H = 240, padL = 50, padR = 16, padT = 20, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = Math.max(data.length, 1);

  if (data.length === 0) {
    return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: FS.base }}>Aún no hay suficientes trades para mostrar la evolución.</div>;
  }

  const toggleBtn = (key, label) => (
    <button onClick={() => setMode(key)}
      style={{ padding: "4px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: FS.xs, fontWeight: 700, background: mode === key ? T.brandSoft : "transparent", color: mode === key ? T.brand : T.textMuted }}>
      {label}
    </button>
  );

  if (mode === "dollar") {
    const vals = data.map(d => d.monthPnl).concat([0]);
    const rawMax = Math.max(...vals, 1), rawMin = Math.min(...vals, 0);
    // Igual que en InteractiveCurveChart: el dominio se expande al rango
    // "lindo" más chico que contiene los datos, para que el grid quede en
    // números redondos en vez de fracciones arbitrarias del máximo.
    const { ticks: yTicks, min, max } = niceTicks(rawMin, rawMax, 4);
    const range = max - min || 1;
    const barW = (innerW / n) * 0.5;
    const xScale = scaleLinear({ domain: [0, n], range: [padL, padL + innerW] });
    const yScale = scaleLinear({ domain: [min, max], range: [padT + innerH, padT] });
    const y0 = yScale(0);
    return (
      <div>
        <div style={{ display: "flex", gap: 3, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3, width: "fit-content", marginBottom: 12 }}>
          {toggleBtn("dollar", "Rentabilidad en $")}{toggleBtn("percent", "Rentabilidad en %")}
        </div>
        <div ref={containerRef} style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 220, display: "block" }}>
            {yTicks.map((v, gi) => {
              const gy = yScale(v);
              return (
                <g key={gi}>
                  <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={T.border} strokeWidth={1} strokeDasharray={Math.abs(v) < 1e-6 ? undefined : "3,4"} opacity={Math.abs(v) < 1e-6 ? 0.9 : 0.5} />
                  <text x={padL - 8} y={gy + 3} fontSize="9.5" fill={T.textFaint} textAnchor="end">{moneyCompact(v)}</text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const cx = padL + (innerW / n) * (i + 0.5);
              const top = yScale(Math.max(d.monthPnl, 0));
              const bottom = yScale(Math.min(d.monthPnl, 0));
              const color = d.monthPnl >= 0 ? T.gain : T.loss;
              const isHover = hoverBar === i;
              return (
                <g key={d.mk} onMouseEnter={() => setHoverBar(i)} onMouseLeave={() => setHoverBar(null)} style={{ cursor: "pointer" }}>
                  <rect x={cx - innerW / n / 2} y={padT} width={innerW / n} height={innerH} fill="transparent" />
                  <Bar x={cx - barW / 2} y={top} width={barW} height={Math.max(bottom - top, 1)} rx={5} fill={color} opacity={isHover ? 1 : 0.85}
                    className="hz-bar-grow" style={{ transformOrigin: `${cx}px ${y0}px`, animationDelay: `${i * 45}ms` }} />
                  <text x={cx} y={H - 8} fontSize="9.5" fontWeight={isHover ? 700 : 400} fill={isHover ? T.text : T.textFaint} textAnchor="middle">{d.label}</text>
                </g>
              );
            })}
          </svg>
          {hoverBar != null && (() => {
            const d = data[hoverBar];
            const cx = padL + (innerW / n) * (hoverBar + 0.5);
            const color = d.monthPnl >= 0 ? T.gain : T.loss;
            const flip = cx > W * 0.68;
            return (
              <div style={{
                position: "absolute", left: `${(cx / W) * 100}%`, top: 4,
                transform: flip ? "translate(-100%, 0)" : "translate(8px, 0)",
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
                padding: "7px 11px", fontSize: FS.xs, boxShadow: "0 10px 28px rgba(20,16,40,0.16)",
                pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
              }}>
                <div style={{ fontWeight: 700, color: T.textFaint, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 9.5 }}>{d.label}</div>
                <div style={{ fontWeight: 800, color, fontSize: FS.sm, ...numMonoStyle }}>{money(d.monthPnl)}</div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 3, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3, width: "fit-content", marginBottom: 12 }}>
        {toggleBtn("dollar", "Rentabilidad en $")}{toggleBtn("percent", "Rentabilidad en %")}
      </div>
      <InteractiveCurveChart
        points={data.map(d => ({ y: d.cumPct, label: d.label }))}
        color={T.brand}
        height={220}
        referenceValue={0}
        referenceLabel="0%"
        formatValue={v => `${v.toFixed(1)}%`}
        exportFilename="rentabilidad-acumulada.png"
      />
    </div>
  );
}

// ─── Gráfica combinada de tendencia mensual ───────────────────────────────────
// Muestra el P&L acumulado por instrumento a lo largo del mes que se está
// viendo, con una <LinePath> de @visx/shape por instrumento sobre una escala
// lineal compartida.
export function MonthlyTrendChart({ trades, year, month, accentColor }) {
  const svgRef = useRef(null);
  const [containerRef, measuredW] = useMeasuredWidth(640);
  const [hoverDay, setHoverDay] = useState(null);
  const days = getDaysInMonth(year, month);
  const instruments = [...new Set(trades.map(t => t.instrument))];
  const W = measuredW, H = 220, padL = 46, padR = 16, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;

  const series = instruments.map(inst => {
    let running = 0;
    const points = [];
    for (let d = 1; d <= days; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      running += trades.filter(t => t.date === ds && t.instrument === inst).reduce((s, t) => s + t.pnl, 0);
      points.push(running);
    }
    return { inst, points, color: INST_COLOR[inst] || accentColor };
  });

  const allVals = series.flatMap(s => s.points).concat([0]);
  const rawMax = Math.max(...allVals, 1), rawMin = Math.min(...allVals, 0);
  const { ticks: yTicks, min, max } = niceTicks(rawMin, rawMax, 4);
  const range = max - min || 1;
  const xScale = scaleLinear({ domain: [0, Math.max(days - 1, 1)], range: [padL, padL + innerW] });
  const yScale = scaleLinear({ domain: [min, max], range: [padT + innerH, padT] });

  if (instruments.length === 0) {
    return <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: FS.base }}>Sin trades este mes todavía.</div>;
  }

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round(xScale.invert(relX));
    idx = Math.max(0, Math.min(days - 1, idx));
    setHoverDay(idx);
  }

  const tooltipFlip = hoverDay != null && xScale(hoverDay) > W * 0.62;
  return (
    <div>
      <div ref={containerRef} style={{ position: "relative" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 200, display: "block", cursor: "crosshair" }}
          onMouseMove={handleMove} onMouseLeave={() => setHoverDay(null)}>
          {yTicks.map((v, i) => {
            const gy = yScale(v);
            return (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={T.border} strokeWidth={1} strokeDasharray={Math.abs(v) < 1e-6 ? undefined : "3,4"} opacity={Math.abs(v) < 1e-6 ? 0.9 : 0.5} />
                <text x={padL - 8} y={gy + 3} fontSize={9} fill={T.textFaint} textAnchor="end">{moneyCompact(v)}</text>
              </g>
            );
          })}
          {series.map(s => (
            <LinePath key={s.inst} data={s.points} x={(_, i) => xScale(i)} y={v => yScale(v)}
              stroke={s.color} strokeWidth={2.2} pathLength="1" className="hz-draw-line" />
          ))}
          {series.map(s => {
            const lastIdx = s.points.length - 1;
            return <circle key={s.inst + "-dot"} cx={xScale(lastIdx)} cy={yScale(s.points[lastIdx])} r={3.2} fill={s.color} className="hz-draw-dot" />;
          })}
          {[1, Math.ceil(days / 2), days].map(d => (
            <text key={d} x={xScale(d - 1)} y={H - 8} fontSize="9.5" fill={T.textFaint} textAnchor={d === 1 ? "start" : d === days ? "end" : "middle"}>{d}</text>
          ))}
          {hoverDay != null && (
            <g>
              <line x1={xScale(hoverDay)} x2={xScale(hoverDay)} y1={padT} y2={padT + innerH} stroke={T.textFaint} strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              {series.map(s => <circle key={s.inst + "-hover"} cx={xScale(hoverDay)} cy={yScale(s.points[hoverDay])} r="4.5" fill={s.color} stroke={T.surface} strokeWidth="2" />)}
            </g>
          )}
        </svg>
        {hoverDay != null && (
          <div style={{
            position: "absolute", left: `${(xScale(hoverDay) / W) * 100}%`, top: 6,
            transform: tooltipFlip ? "translate(-100%, 0)" : "translate(8px, 0)",
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
            padding: "7px 11px", fontSize: FS.xs, boxShadow: "0 10px 28px rgba(20,16,40,0.16)",
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
          }}>
            <div style={{ fontWeight: 700, color: T.textFaint, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 9.5 }}>Día {hoverDay + 1}</div>
            {series.map(s => (
              <div key={s.inst} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: T.textMuted, fontSize: 10.5 }}>{instLabel(s.inst)}</span>
                <span style={{ fontWeight: 800, color: T.text, ...numMonoStyle, marginLeft: "auto", paddingLeft: 10 }}>{moneyCompact(s.points[hoverDay])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4, paddingLeft: padL }}>
        {series.map(s => (
          <div key={s.inst} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.sm, color: T.textMuted }}>
            <span style={{ width: 14, height: 2.5, background: s.color, display: "inline-block", borderRadius: 2 }} />
            {s.inst}
          </div>
        ))}
      </div>
    </div>
  );
}

// Pequeña gráfica tipo "ruleta" (anillo) que cuenta, para el mes que se está
// viendo, cuántos días se operó vs. cuántos no. El arco de progreso se dibuja
// con <Arc> de @visx/shape (ángulos en radianes, 0 = arriba, sentido horario)
// en vez de calcular strokeDasharray a mano.
export function TradingDaysWheel({ trades, year, month, color }) {
  const todayObj = new Date();
  const isFutureMonth = year > todayObj.getFullYear() || (year === todayObj.getFullYear() && month > todayObj.getMonth());
  const isCurrentMonth = year === todayObj.getFullYear() && month === todayObj.getMonth();
  const totalDays = isFutureMonth ? 0 : isCurrentMonth ? todayObj.getDate() : getDaysInMonth(year, month);

  const tradedDates = new Set(
    trades.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month;
    }).map(t => t.date)
  );
  const tradedDays = tradedDates.size;
  const notTradedDays = Math.max(totalDays - tradedDays, 0);
  const pct = totalDays > 0 ? tradedDays / totalDays : 0;

  const size = 76, stroke = 10, r = (size - stroke) / 2;

  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingLeft: 16, borderLeft: `1px solid ${T.border}` }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Group top={size / 2} left={size / 2}>
            <circle cx={0} cy={0} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
            {totalDays > 0 && (
              <Arc
                innerRadius={r - stroke / 2}
                outerRadius={r + stroke / 2}
                startAngle={0}
                endAngle={pct * 2 * Math.PI}
                cornerRadius={stroke / 2}
                fill={color}
              />
            )}
          </Group>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.base, fontWeight: 800, color: T.text }}>
          {totalDays > 0 ? `${Math.round(pct * 100)}%` : "—"}
        </div>
      </div>
      <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Días operados</div>
      <div style={{ fontSize: FS.xs, color: T.textMuted, textAlign: "center" }}>
        <span style={{ color, fontWeight: 700 }}>{tradedDays}</span> sí · <span style={{ fontWeight: 700 }}>{notTradedDays}</span> no
      </div>
    </div>
  );
}

// ─── P&L Chart ────────────────────────────────────────────────────────────────
// Curvas acumuladas por instrumento a lo largo del mes, con <LinePath> de
// @visx/shape sobre un eje X posicional (una fecha por índice).
export function PnLChart({ monthTrades }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [hoverContainer, setHoverContainer] = useState(false);
  const sorted = useMemo(() => [...monthTrades].sort((a, b) => a.date.localeCompare(b.date)), [monthTrades]);
  const byInst = useMemo(() => {
    const m = Object.fromEntries(INSTRUMENTS.map(inst => [inst, []]));
    const cum = Object.fromEntries(INSTRUMENTS.map(inst => [inst, 0]));
    sorted.forEach(t => { cum[t.instrument] += t.pnl; m[t.instrument].push({ date: t.date, y: cum[t.instrument] }); });
    return m;
  }, [sorted]);
  const allPts = INSTRUMENTS.flatMap(inst => byInst[inst]);
  if (allPts.length < 2) return <div style={{ textAlign: "center", color: T.textFaint, padding: "48px 0", fontSize: FS.base }}>Añade al menos 2 trades para ver el gráfico.</div>;
  const allDates = [...new Set(allPts.map(p => p.date))].sort();
  // Valor acumulado de cada instrumento en cada fecha global, arrastrando el
  // último valor conocido (necesario para el tooltip cuando no todos los
  // instrumentos operaron ese mismo día).
  const carried = Object.fromEntries(INSTRUMENTS.map(inst => {
    let last = 0, ptr = 0;
    const pts = byInst[inst];
    const vals = allDates.map(d => {
      while (ptr < pts.length && pts[ptr].date <= d) { last = pts[ptr].y; ptr++; }
      return last;
    });
    return [inst, vals];
  }));
  const allY = allPts.map(p => p.y);
  const rawMaxY = Math.max(...allY, 0), rawMinY = Math.min(...allY, 0);
  const rangeY = rawMaxY - rawMinY || 1;
  const pad = rangeY * 0.1;
  const { ticks: yTicks, min: botY, max: topY } = niceTicks(rawMinY - pad, rawMaxY + pad, 4);
  const W = 540, H = 150, padL = 40, padR = 10;
  const innerW = W - padL - padR;
  const xScale = scaleLinear({ domain: [0, Math.max(allDates.length - 1, 1)], range: [padL, padL + innerW] });
  const yScale = scaleLinear({ domain: [botY, topY], range: [H, 0] });
  const zeroY = yScale(0);

  function handleMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let idx = Math.round(xScale.invert(relX));
    idx = Math.max(0, Math.min(allDates.length - 1, idx));
    setHoverIdx(idx);
  }
  const tooltipFlip = hoverIdx != null && xScale(hoverIdx) > W * 0.6;

  return (
    <div>
      <div style={{ position: "relative" }}
        onMouseEnter={() => setHoverContainer(true)} onMouseLeave={() => setHoverContainer(false)}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="none" style={{ width: "100%", height: 175, cursor: "crosshair" }}
          onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}>
          {yTicks.map((v, gi) => {
            const gy = yScale(v);
            return (
              <g key={gi}>
                <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={T.border} strokeWidth="1" strokeDasharray={Math.abs(v) < 1e-6 ? undefined : "3,4"} opacity={Math.abs(v) < 1e-6 ? 0.9 : 0.5} />
                <text x={padL - 6} y={gy + 3} fontSize="8.5" fill={T.textFaint} textAnchor="end">{moneyCompact(v)}</text>
              </g>
            );
          })}
          {INSTRUMENTS.map(inst => byInst[inst].length >= 2 && (
            <LinePath key={inst} data={byInst[inst]}
              x={p => xScale(allDates.indexOf(p.date))} y={p => yScale(p.y)}
              stroke={INST_COLOR[inst]} strokeWidth="2.5" strokeLinejoin="round" pathLength="1" className="hz-draw-line" />
          ))}
          {INSTRUMENTS.flatMap(inst => byInst[inst].map((p, i) => <circle key={`${inst}-${i}`} cx={xScale(allDates.indexOf(p.date))} cy={yScale(p.y)} r="3.5" fill={INST_COLOR[inst]} className="hz-draw-dot" />))}
          {allDates.filter((_, i) => i % Math.ceil(allDates.length / 6) === 0).map(d => (
            <text key={d} x={xScale(allDates.indexOf(d))} y={H + 17} textAnchor="middle" fontSize="9" fill={T.textFaint}>{d.slice(5)}</text>
          ))}
          {hoverIdx != null && (
            <g>
              <line x1={xScale(hoverIdx)} x2={xScale(hoverIdx)} y1={0} y2={H} stroke={T.textFaint} strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
              {INSTRUMENTS.filter(inst => byInst[inst].length > 0).map(inst => (
                <circle key={inst + "-hover"} cx={xScale(hoverIdx)} cy={yScale(carried[inst][hoverIdx])} r="4.5" fill={INST_COLOR[inst]} stroke={T.surface} strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
        {hoverIdx != null && (
          <div style={{
            position: "absolute", left: `${(xScale(hoverIdx) / W) * 100}%`, top: 4,
            transform: tooltipFlip ? "translate(-100%, 0)" : "translate(8px, 0)",
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
            padding: "7px 11px", fontSize: FS.xs, boxShadow: "0 10px 28px rgba(20,16,40,0.16)",
            pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
          }}>
            <div style={{ fontWeight: 700, color: T.textFaint, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 9.5 }}>{allDates[hoverIdx]}</div>
            {INSTRUMENTS.filter(inst => byInst[inst].length > 0).map(inst => (
              <div key={inst} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: INST_COLOR[inst], display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: T.textMuted, fontSize: 10.5 }}>{instLabel(inst)}</span>
                <span style={{ fontWeight: 800, color: T.text, ...numMonoStyle, marginLeft: "auto", paddingLeft: 10 }}>{money(carried[inst][hoverIdx], 0)}</span>
              </div>
            ))}
          </div>
        )}
        <ChartExportButton svgRef={svgRef} filename="pnl-por-instrumento.png" visible={hoverContainer} />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {INSTRUMENTS.filter(inst => byInst[inst].length > 0).map(inst => <div key={inst} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.sm, color: T.textMuted }}><div style={{ width: 16, height: 3, background: INST_COLOR[inst], borderRadius: 2 }} />{instEmoji(inst)} {instLabel(inst)}</div>)}
      </div>
    </div>
  );
}

// Correlación entre las emociones registradas y el P&L: barras de progreso
// simples (HTML/CSS, no un gráfico SVG con ejes/escalas), se mantienen igual.
export function EmotionCorrelationChart({ trades, accentColor }) {
  const data = useMemo(() => {
    const map = {};
    EMOTIONS.forEach(e => { map[e.id] = { ...e, count: 0, pnl: 0, wins: 0 }; });
    trades.forEach(t => {
      (t.emotions || []).forEach(eid => {
        if (!map[eid]) return;
        map[eid].count += 1;
        map[eid].pnl += t.pnl;
        if (t.pnl > 0) map[eid].wins += 1;
      });
    });
    return Object.values(map)
      .filter(e => e.count > 0)
      .map(e => ({ ...e, avgPnl: e.pnl / e.count, wr: (e.wins / e.count) * 100 }))
      .sort((a, b) => b.avgPnl - a.avgPnl);
  }, [trades]);

  if (!data.length) {
    return (
      <div style={{ ...S.card, padding: 18, marginBottom: 14, textAlign: "center", color: T.textFaint, fontSize: FS.base }}>
        Etiquetá emociones en tus trades para ver aquí su correlación con el P&L.
      </div>
    );
  }
  const maxAbs = Math.max(...data.map(d => Math.abs(d.avgPnl)), 1);

  return (
    <div style={{ ...S.card, padding: 18, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>😌 Emociones vs P&L</div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>P&L promedio por trade según el estado emocional registrado</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {data.map(e => {
          const pct = Math.max((Math.abs(e.avgPnl) / maxAbs) * 100, 2);
          const positive = e.avgPnl >= 0;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 132, fontSize: FS.base, color: NEG_EMOTIONS.includes(e.id) ? T.loss : T.textMuted, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <span>{e.emoji}</span><span>{e.label}</span>
              </div>
              <div style={{ flex: 1, height: 16, background: T.surfaceAlt, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                <div className="hz-bar-grow-x" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: positive ? T.gain : T.loss, borderRadius: 4, transition: "width 0.2s" }} />
              </div>
              <div style={{ width: 85, textAlign: "right", fontSize: FS.base, fontWeight: 700, color: positive ? T.gain : T.loss, flexShrink: 0 }}>
                {money(e.avgPnl, 0)}
              </div>
              <div style={{ width: 78, textAlign: "right", fontSize: FS.xs, color: T.textFaint, flexShrink: 0 }}>{e.count} trades · {e.wr.toFixed(0)}% WR</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini-gráfica de hábitos: barras con el % de actividades completadas por día,
// para los últimos N días, ahora con <Bar> de @visx/shape sobre una escala lineal.
export function HabitMiniChart({ data, accentColor, days = 21 }) {
  const series = useMemo(() => {
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const done = ROUTINE_ACTIVITIES.filter(a => data[iso]?.[a.key]).length;
      arr.push({ date: iso, pct: done / ROUTINE_ACTIVITIES.length, done });
    }
    return arr;
  }, [data, days]);

  const W = 640, H = 110, padL = 4, padR = 4, padT = 8, padB = 18;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const barW = innerW / series.length;
  const yScale = scaleLinear({ domain: [0, 1], range: [padT + innerH, padT] });

  return (
    <div style={{ ...S.card, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: FS.base, color: T.text }}><TrendingUp size={14} />Hábitos en el tiempo</span>
        <span style={{ fontSize: FS.sm, color: T.textFaint }}>últimos {days} días</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100, display: "block" }}>
        <line x1={padL} x2={W - padR} y1={padT + innerH} y2={padT + innerH} stroke={T.border} strokeWidth={1} />
        {series.map((s, i) => {
          const barH = Math.max(innerH - (yScale(s.pct) - padT), s.done > 0 ? 3 : 0);
          const x = padL + i * barW + barW * 0.18;
          const w = barW * 0.64;
          const y = padT + innerH - barH;
          const color = s.pct >= 1 ? T.gain : s.pct > 0 ? accentColor : T.border;
          return (
            <rect key={s.date} x={x} y={y} width={w} height={barH} rx={2} fill={color}
              className="hz-bar-grow" style={{ transformOrigin: `${x + w / 2}px ${padT + innerH}px`, animationDelay: `${i * 12}ms` }}>
              <title>{`${s.date}: ${s.done}/${ROUTINE_ACTIVITIES.length}`}</title>
            </rect>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: FS.xs, color: T.textFaint, marginTop: 2 }}>
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Gauge de Profit Factor ────────────────────────────────────────────────
// Semicírculo con zona roja (< 1) y zona verde (≥ 1), dibujado con dos <Arc>
// de @visx/shape sobre un dominio fijo [0, domainMax]. Convención de ángulos
// de d3/visx: 0 = arriba (12 en punto), sentido horario positivo — el
// semicírculo superior queda entre -π/2 (izquierda, PF=0) y +π/2 (derecha,
// PF=domainMax), pasando por 0 (arriba).
export function ProfitFactorGauge({ profitFactor, domainMax = 3 }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(false);
  const size = 190, cx = size / 2, cy = size / 2 + 6, r = 74, stroke = 15;
  const pf = Number.isFinite(profitFactor) ? profitFactor : (profitFactor > 0 ? domainMax : 0);
  const displayValue = Number.isFinite(profitFactor) ? profitFactor : "∞";
  const clamped = Math.max(0, Math.min(pf, domainMax));
  const boundaryFrac = 1 / domainMax; // dónde cae PF=1 dentro del dominio

  const angleFor = (frac) => -Math.PI / 2 + frac * Math.PI;
  const boundaryAngle = angleFor(boundaryFrac);
  const valueAngle = angleFor(clamped / domainMax);
  const needlePoint = (angle) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
  const [needleX, needleY] = needlePoint(valueAngle);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <svg ref={svgRef} width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        <Group top={cy} left={cx}>
          {/* zona roja: PF entre 0 y 1 */}
          <Arc innerRadius={r - stroke / 2} outerRadius={r + stroke / 2} startAngle={-Math.PI / 2} endAngle={boundaryAngle} cornerRadius={stroke / 2} fill={T.loss} />
          {/* zona verde: PF entre 1 y domainMax */}
          <Arc innerRadius={r - stroke / 2} outerRadius={r + stroke / 2} startAngle={boundaryAngle} endAngle={Math.PI / 2} cornerRadius={stroke / 2} fill={T.gain} />
        </Group>
        <circle cx={needleX} cy={needleY} r={7} fill={T.surface} stroke={T.text} strokeWidth={2.5} />
      </svg>
      <div style={{ marginTop: 2, fontSize: FS.xl, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
        {typeof displayValue === "number" ? displayValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : displayValue}
      </div>
      <ChartExportButton svgRef={svgRef} filename="profit-factor.png" visible={hover} />
    </div>
  );
}

// ─── Donut genérico por categoría (segmentos con label/value/color propios) ──
// Mismo patrón visual que WinLossBreakdownDonut (anillo vía <Pie>, centro con
// total, leyenda abajo) pero genérico: no asume wins/losses/breakeven, recibe
// los segmentos ya armados. Usado por el Panel financiero (Gastos/Ingresos
// por categoría) — los colores se pasan desde afuera para que quien lo usa
// decida qué tokens de T reutilizar en vez de que el chart invente los suyos.
export function CategoryBreakdownDonut({ segments, formatValue = v => String(v), totalLabel = "Total", size = 190, stroke = 24, emptyLabel = "Sin datos todavía." }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(false);
  const r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const visible = segments.filter(s => s.value > 0);
  const total = visible.reduce((s, seg) => s + seg.value, 0);

  if (total <= 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: size, color: T.textFaint, fontSize: FS.base, textAlign: "center", padding: "0 20px" }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Group top={cy} left={cx}>
            <circle cx={0} cy={0} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
            <Pie data={visible} pieValue={d => d.value} outerRadius={r + stroke / 2} innerRadius={r - stroke / 2}>
              {(pie) => pie.arcs.map(arc => <path key={arc.data.label} d={pie.path(arc)} fill={arc.data.color} />)}
            </Pie>
          </Group>
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          width: Math.max((r - stroke / 2) * 2 * 0.86, 0), textAlign: "center", lineHeight: 1.15,
        }}>
          <span style={{ fontSize: size < 140 ? FS.sm : FS.lg, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", ...numMonoStyle }}>{formatValue(total)}</span>
          <span style={{ fontSize: size < 140 ? 10 : FS.sm, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{totalLabel}</span>
        </div>
        <ChartExportButton svgRef={svgRef} filename="desglose-categorias.png" visible={hover} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: 12 }}>
        {visible.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.label} · {formatValue(s.value)} <span style={{ color: T.textFaint }}>({Math.round((s.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Donut Ganadores / Perdedores / Breakeven ─────────────────────────────
// Tres segmentos de anillo (verde/rojo/gris oscuro), ahora vía <Pie> de
// @visx/shape con pieValue proporcional al conteo real de cada categoría.
export function WinLossBreakdownDonut({ wins, losses, breakeven }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(false);
  const size = 190, stroke = 24, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const total = wins + losses + breakeven;
  const segments = [
    { key: "wins", label: "Ganadores", value: wins, color: T.gain },
    { key: "losses", label: "Perdedores", value: losses, color: T.loss },
    { key: "breakeven", label: "Breakeven", value: breakeven, color: T.breakeven },
  ].filter(s => s.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Group top={cy} left={cx}>
            <circle cx={0} cy={0} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
            {total > 0 && (
              <Pie data={segments} pieValue={d => d.value} outerRadius={r + stroke / 2} innerRadius={r - stroke / 2}>
                {(pie) => pie.arcs.map(arc => <path key={arc.data.key} d={pie.path(arc)} fill={arc.data.color} />)}
              </Pie>
            )}
          </Group>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: FS.xl, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{total}</span>
          <span style={{ fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>{total === 1 ? "trade" : "trades"}</span>
        </div>
        <ChartExportButton svgRef={svgRef} filename="ganadores-perdedores.png" visible={hover} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: 12 }}>
        {[
          { label: "Ganadores", value: wins, color: T.gain },
          { label: "Perdedores", value: losses, color: T.loss },
          { label: "Breakeven", value: breakeven, color: T.breakeven },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, color: T.textMuted, fontWeight: 600 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            {s.label} · {s.value}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barra Trade ganador promedio VS Trade perdedor promedio ─────────────
// Pastilla horizontal (HTML/CSS, no un gráfico con ejes) — se mantiene igual.
export function AvgWinLossBar({ avgWin, avgLoss }) {
  const w = Math.abs(avgWin), l = Math.abs(avgLoss);
  const total = w + l;
  const winPct = total > 0 ? (w / total) * 100 : 50;
  return (
    <div>
      <div style={{ display: "flex", height: 15, borderRadius: 8, overflow: "hidden", background: T.border }}>
        {winPct > 0 && <div style={{ width: `${winPct}%`, background: T.gain, transition: "width 0.3s ease" }} />}
        {winPct < 100 && <div style={{ width: `${100 - winPct}%`, background: T.loss, transition: "width 0.3s ease" }} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: FS.lg, fontWeight: 800 }}>
        <span style={{ color: T.gain }}>{money(w)}</span>
        <span style={{ color: T.loss }}>{money(l)}</span>
      </div>
    </div>
  );
}

// ─── Distribución de R-múltiplo (histograma) ──────────────────────────────────
// Consume `buckets` y `expectancyR` tal como los devuelve computeAdvancedMetrics
// (utils.js) — no recalcula nada, solo visualiza con <Bar> de @visx/shape.
// Los primeros 3 buckets del array son siempre el lado de pérdida (< -2R, -2R
// a -1R, -1R a 0R) y los 4 restantes el lado de ganancia (0R a 1R en adelante).
export function RMultipleDistribution({ buckets, expectancyR }) {
  const svgRef = useRef(null);
  const [hoverBar, setHoverBar] = useState(null);
  const [containerRef, measuredW] = useMeasuredWidth(700);
  const [hovering, setHovering] = useState(false);

  const totalTrades = useMemo(() => buckets.reduce((s, b) => s + b.count, 0), [buckets]);

  const W = measuredW, H = 220, padL = 34, padR = 16, padT = 24, padB = 34;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = Math.max(buckets.length, 1);
  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  if (totalTrades === 0) {
    return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint, fontSize: FS.base }}>Aún no hay suficientes trades para mostrar la distribución de R.</div>;
  }

  const barW = (innerW / n) * 0.62;
  const yScale = scaleLinear({ domain: [0, maxCount], range: [padT + innerH, padT] });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: FS.sm, color: T.textMuted }}>
          Cuántos de tus {totalTrades} trades cayeron en cada rango de R (múltiplo de tu riesgo por operación).
        </div>
        {expectancyR != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: expectancyR >= 0 ? T.gain : T.loss, ...numMonoStyle }}>
            Expectancy: {expectancyR >= 0 ? "+" : ""}{expectancyR.toFixed(2)}R
          </div>
        )}
      </div>
      <div ref={containerRef} style={{ position: "relative" }} onMouseEnter={() => setHovering(true)} onMouseLeave={() => { setHovering(false); setHoverBar(null); }}>
        <ChartExportButton svgRef={svgRef} filename="distribucion-r-multiplo.png" visible={hovering} />
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, display: "block" }}>
          {/* Línea base en 0 trades */}
          <line x1={padL} x2={W - padR} y1={padT + innerH} y2={padT + innerH} stroke={T.borderStrong} strokeWidth={1} />
          {buckets.map((b, i) => {
            const cx = padL + (innerW / n) * (i + 0.5);
            const top = yScale(b.count);
            const bottom = padT + innerH;
            const isLossSide = i < 3; // primeros 3 buckets = lado de pérdida (ver comentario arriba)
            const color = isLossSide ? T.loss : T.gain;
            const isHover = hoverBar === i;
            return (
              <g key={b.label} onMouseEnter={() => setHoverBar(i)} onMouseLeave={() => setHoverBar(null)} style={{ cursor: "pointer" }}>
                <rect x={cx - innerW / n / 2} y={padT} width={innerW / n} height={innerH} fill="transparent" />
                <Bar x={cx - barW / 2} y={top} width={barW} height={Math.max(bottom - top, b.count > 0 ? 2 : 0)} rx={5}
                  fill={color} opacity={isHover ? 1 : 0.85} />
                {b.count > 0 && (
                  <text x={cx} y={top - 6} fontSize="10" fontWeight={isHover ? 800 : 600} fill={isHover ? T.text : T.textFaint} textAnchor="middle" style={numMonoStyle}>
                    {b.count}
                  </text>
                )}
                <text x={cx} y={H - 10} fontSize="9" fontWeight={isHover ? 700 : 500} fill={isHover ? T.text : T.textFaint} textAnchor="middle">
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
        {hoverBar != null && (() => {
          const b = buckets[hoverBar];
          const cx = padL + (innerW / n) * (hoverBar + 0.5);
          const isLossSide = hoverBar < 3;
          const color = isLossSide ? T.loss : T.gain;
          const pct = totalTrades ? (b.count / totalTrades) * 100 : 0;
          const flip = cx > W * 0.68;
          return (
            <div style={{
              position: "absolute", left: `${(cx / W) * 100}%`, top: 4,
              transform: flip ? "translate(-100%, 0)" : "translate(8px, 0)",
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
              padding: "7px 11px", fontSize: FS.xs, boxShadow: "0 10px 28px rgba(20,16,40,0.16)",
              pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
            }}>
              <div style={{ fontWeight: 700, color: T.textFaint, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 9.5 }}>{b.label}</div>
              <div style={{ fontWeight: 800, color, fontSize: FS.sm, ...numMonoStyle }}>{b.count} trade{b.count === 1 ? "" : "s"} ({pct.toFixed(0)}%)</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Heatmap día × hora ───────────────────────────────────────────────────────
// Muestra el P&L agrupado por día de la semana y hora exacta de entrada (campo
// `time` del formulario, "HH:MM"). Trades sin hora registrada se excluyen del
// cálculo, no se cuentan como 00:00.
//
// Migrado a <HeatmapRect> de @visx/heatmap: las 24 horas son las "columnas" y
// los 7 días son las "filas" (bins) dentro de cada columna. `xScale`/`yScale`
// (de @visx/scale) posicionan cada celda; el color de cada celda NO usa el
// colorScale/opacityScale "de catálogo" de visx (que da una única escala de
// color continua) — se sigue calculando a mano, igual que antes, para
// mantener el criterio discreto rojo (pérdida) / verde (ganancia) según el
// signo del P&L de esa celda, con la intensidad (alpha) dada por la magnitud.
const HEATMAP_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
function hexToRgba(hex, alpha) {
  const h = (hex || "#999999").replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const bigint = parseInt(full, 16) || 0;
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
export function DayHourHeatmap({ trades }) {
  const { cells, withTime, withoutTime } = useMemo(() => buildHourWeekdayHeatmap(trades), [trades]);
  const [hoverCell, setHoverCell] = useState(null); // { day, hour }

  const maxAbsPnl = useMemo(() => {
    let m = 0;
    cells.forEach(row => row.forEach(c => { if (c.count) m = Math.max(m, Math.abs(c.pnl)); }));
    return m || 1;
  }, [cells]);

  const best = useMemo(() => {
    let top = null;
    cells.forEach((row, dayIdx) => row.forEach((c, hour) => {
      if (c.count && (!top || c.pnl > top.pnl)) top = { day: dayIdx, hour, ...c };
    }));
    return top;
  }, [cells]);

  // Estructura de datos que espera @visx/heatmap: un array de "columnas" (una
  // por hora), cada una con un array `bins` (una entrada por día). Se llevan
  // pnl/wins además de count para poder calcular el color discreto a mano.
  const heatmapData = useMemo(() => (
    Array.from({ length: 24 }, (_, hour) => ({
      bin: hour,
      bins: HEATMAP_DAYS.map((_, dayIdx) => ({
        bin: dayIdx,
        count: cells[dayIdx][hour].count,
        pnl: cells[dayIdx][hour].pnl,
        wins: cells[dayIdx][hour].wins,
      })),
    }))
  ), [cells]);

  if (withTime === 0) {
    return (
      <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>Heatmap por día y hora</div>
        <div style={{ fontSize: FS.sm, color: T.textMuted }}>
          Todavía no hay trades con hora exacta cargada. Agregá la hora de entrada al registrar un trade para ver este heatmap.
        </div>
      </div>
    );
  }

  const cellSize = 22, gap = 3, leftLabelWidth = 34, topLabelHeight = 22;
  const numCols = 24, numRows = 7;
  const innerW = numCols * (cellSize + gap) - gap;
  const innerH = numRows * (cellSize + gap) - gap;
  const W = leftLabelWidth + innerW, H = topLabelHeight + innerH;
  const binWidth = innerW / numCols, binHeight = innerH / numRows;
  const xScale = scaleLinear({ domain: [0, numCols], range: [0, innerW] });
  const yScale = scaleLinear({ domain: [0, numRows], range: [0, innerH] });

  return (
    <div style={{ ...S.card, padding: 20, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: FS.base, color: T.text, marginBottom: 2 }}>Heatmap por día y hora</div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 14 }}>
        P&L por hora exacta de entrada · {withTime} trade{withTime === 1 ? "" : "s"}
        {withoutTime ? ` · ${withoutTime} sin hora registrada (excluidos)` : ""}
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          {/* Etiquetas de hora (cada 3ra) arriba de las columnas */}
          {Array.from({ length: numCols }, (_, h) => h % 3 === 0 && (
            <text key={h} x={leftLabelWidth + xScale(h) + binWidth / 2} y={topLabelHeight - 7}
              fontSize={9} fill={T.textFaint} textAnchor="middle">{h}</text>
          ))}
          {/* Etiquetas de día a la izquierda de cada fila */}
          {HEATMAP_DAYS.map((label, dayIdx) => (
            <text key={label} x={leftLabelWidth - 8} y={topLabelHeight + yScale(dayIdx) + binHeight / 2 + 4}
              fontSize={FS.xs} fontWeight={700} fill={T.textMuted} textAnchor="end">{label}</text>
          ))}
          <Group top={topLabelHeight} left={leftLabelWidth}>
            <HeatmapRect
              data={heatmapData}
              xScale={(c) => xScale(c)}
              yScale={(r) => yScale(r)}
              colorScale={() => T.surfaceAlt}
              opacityScale={() => 1}
              binWidth={binWidth}
              binHeight={binHeight}
              gap={gap}
            >
              {(heatmap) =>
                heatmap.map((column) =>
                  column.map((bin) => {
                    const { count, pnl, wins } = bin.bin;
                    const isHover = hoverCell && hoverCell.day === bin.row && hoverCell.hour === bin.column;
                    const alpha = count ? Math.max(0.18, Math.min(1, Math.abs(pnl) / maxAbsPnl)) : 0;
                    const fill = count ? hexToRgba(pnl >= 0 ? T.gain : T.loss, alpha) : T.surfaceAlt;
                    const wr = count ? ((wins / count) * 100).toFixed(0) : null;
                    const label = HEATMAP_DAYS[bin.row];
                    return (
                      <rect key={`hm-${bin.row}-${bin.column}`}
                        x={bin.x} y={bin.y} width={bin.width} height={bin.height} rx={4}
                        fill={fill}
                        stroke={isHover ? T.text : T.border}
                        strokeWidth={isHover ? 1.5 : 1}
                        style={{ cursor: count ? "pointer" : "default", transition: "stroke 0.1s ease" }}
                        onMouseEnter={() => setHoverCell({ day: bin.row, hour: bin.column })}
                        onMouseLeave={() => setHoverCell(null)}>
                        <title>
                          {count
                            ? `${label} ${String(bin.column).padStart(2, "0")}:00 · ${count} trade${count > 1 ? "s" : ""} · ${money(pnl, 0)} · ${wr}% WR`
                            : `${label} ${String(bin.column).padStart(2, "0")}:00 · sin trades`}
                        </title>
                      </rect>
                    );
                  })
                )
              }
            </HeatmapRect>
          </Group>
        </svg>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: FS.xs, color: T.textFaint }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: hexToRgba(T.loss, 0.7) }} /> Pérdida
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: hexToRgba(T.gain, 0.7) }} /> Ganancia
        </span>
        <span>· Intensidad = magnitud del P&L</span>
      </div>

      {best && best.count > 0 && (
        <div style={{ marginTop: 8, fontSize: FS.xs, color: T.textFaint }}>
          Mejor franja: <span style={{ color: T.gain, fontWeight: 700 }}>{HEATMAP_DAYS[best.day]} {String(best.hour).padStart(2, "0")}:00</span> · {money(best.pnl, 0)} en {best.count} trade{best.count > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
