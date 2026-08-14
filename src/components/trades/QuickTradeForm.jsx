// Carga rápida de trade — pensado para cargar en 60-90 segundos, en caliente,
// sin perder el hábito de documentar por la fricción del form completo.
// Deja afuera a propósito: checklist de razones, errores de ejecución,
// intensidad emocional, tags libres, notas, y el review de cierre — todo eso
// se completa después con la cabeza más fría, editando el trade desde el
// form completo (TradeForm.jsx). Ese guardado posterior es lo que marca el
// trade como reviewCompleted: true (ver saveTrade en TradingJournalInner.jsx).
import { useEffect, useMemo, memo } from "react";
import { Zap, AlertTriangle } from "lucide-react";
import { T, FS, S } from "../../theme";
import { INSTRUMENTS, DIRECTIONS, SESSIONS, EMOTIONS } from "../../constants";
import { instLabel, instEmoji, validateTradeForm, money, inferSessionFromUTCHour } from "../../utils";
import { SetupSelector } from "./SetupSelector";
import { PositionSizeCalculator } from "./PositionSizeCalculator";

// Selector de UNA sola emoción (a diferencia de EmotionSelector, que es
// multi-select con intensidad por cada una) — acá el objetivo es un solo tap,
// no un análisis emocional completo. Se puede sumar más detalle después.
function QuickEmotionPicker({ selected, onChange }) {
  return (
    <div>
      <label id="quick-emotion-label" style={{ ...S.label, marginBottom: 8 }}>¿Cómo te sentiste? (opcional)</label>
      <div role="radiogroup" aria-labelledby="quick-emotion-label" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {EMOTIONS.map(e => {
          const active = selected === e.id;
          return (
            <button key={e.id} type="button" role="radio" aria-checked={active}
              onClick={() => onChange(active ? null : e.id)}
              style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? T.brand + "66" : T.border}`, background: active ? T.brand + "12" : T.surfaceAlt, color: active ? T.brand : T.textMuted, cursor: "pointer", fontSize: FS.sm, fontWeight: active ? 700 : 400 }}>
              {e.emoji} {e.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const QuickTradeForm = memo(function QuickTradeForm({ form, setForm, onSave, onCancel, accentColor, accountLabel, accountSize, defaultRiskPct, setupsList, setSetupsList, instrumentSpecs, setInstrumentSpecs }) {
  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  // Auto-completar hora + sesión al abrir un trade NUEVO en modo rápido —
  // un click menos. Solo corre una vez al montar y solo si `time` está
  // vacío (así no pisa un valor que el usuario ya haya cargado si, por
  // ejemplo, vuelve de "Completo" a "Rápido" sin perder lo tipeado).
  useEffect(() => {
    if (form.time) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setForm(p => ({ ...p, time: `${hh}:${mm}`, session: inferSessionFromUTCHour(now.getUTCHours()) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcRR = useMemo(() => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit), sl = parseFloat(form.stopLoss);
    if (!e || !x || !sl) return null;
    const reward = Math.abs(x - e);
    const risk = Math.abs(e - sl);
    if (!risk) return null;
    return (reward / risk).toFixed(2);
  }, [form.entry, form.exit, form.stopLoss]);

  useEffect(() => {
    if (calcRR && calcRR !== form.rr) setForm(p => ({ ...p, rr: calcRR }));
  }, [calcRR]);

  const effectiveRiskPct = form.riskPct !== "" ? parseFloat(form.riskPct) : parseFloat(defaultRiskPct || 0);
  const riskDollars = accountSize && effectiveRiskPct ? (accountSize * effectiveRiskPct) / 100 : null;
  const pnlNum = parseFloat(form.pnl);
  const validationErrors = useMemo(() => validateTradeForm(form), [form.date, form.exitDate, form.entry, form.stopLoss, form.direction]);

  // El picker de emoción única trabaja sobre el mismo array `emotions` que
  // usa el form completo — así, si más tarde se completa el review, ya
  // arranca con esta emoción precargada en vez de perderla.
  const primaryEmotion = (form.emotions || [])[0] || null;
  const setPrimaryEmotion = (id) => setForm(p => ({ ...p, emotions: id ? [id] : [] }));

  return (
    <div style={{ background: T.surface, border: `1px solid ${accentColor}66`, borderRadius: 14, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <Zap size={16} color={accentColor} />
        <div style={{ fontWeight: 700, fontSize: FS.lg, color: T.text }}>Carga rápida</div>
      </div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 20 }}>
        Cuenta: <span style={{ color: accentColor, fontWeight: 700 }}>{accountLabel}</span> · completá el resto (razones, errores, notas) cuando tengas un momento — el trade queda marcado como pendiente de review hasta entonces.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={S.label}>Fecha</label><input type="date" value={form.date} onChange={f("date")} style={S.input} /></div>
        <div><label style={S.label}>Hora (opcional)</label><input type="time" value={form.time} onChange={f("time")} style={S.input} /></div>
        <div><label style={S.label}>Instrumento</label><select value={form.instrument} onChange={f("instrument")} style={S.input}>{INSTRUMENTS.map(i => <option key={i} value={i}>{instEmoji(i)} {instLabel(i)}</option>)}</select></div>
        <div>
          <label style={S.label}>Dirección</label>
          <div style={{ display: "flex", gap: 6 }}>
            {DIRECTIONS.map(d => (
              <button key={d} type="button" onClick={() => setForm(p => ({ ...p, direction: d }))}
                style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: `1px solid ${form.direction === d ? (d === "LONG" ? T.gain : T.loss) + "66" : T.border}`, cursor: "pointer", fontSize: FS.base, fontWeight: 700, background: form.direction === d ? (d === "LONG" ? "#dcfce7" : "#fee2e2") : T.surfaceAlt, color: form.direction === d ? (d === "LONG" ? T.gain : T.loss) : T.textMuted }}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div><label style={S.label}>Sesión</label><select value={form.session} onChange={f("session")} style={S.input}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={S.label}>Entrada</label><input type="number" placeholder="ej. 19250" value={form.entry} onChange={f("entry")} style={S.input} /></div>
        <div><label style={S.label}>Salida</label><input type="number" placeholder="ej. 19400" value={form.exit} onChange={f("exit")} style={S.input} /></div>
        <div><label style={S.label}>Stop Loss</label><input type="number" placeholder="ej. 19120" value={form.stopLoss} onChange={f("stopLoss")} style={S.input} /></div>
        <div><label style={S.label}>Tamaño lote</label><input type="number" placeholder="ej. 1.0" value={form.size} onChange={f("size")} style={S.input} /></div>
        <div>
          <label style={S.label}>Riesgo del trade (%)</label>
          <input type="number" placeholder={defaultRiskPct ? `def. ${defaultRiskPct}` : "ej. 1"} value={form.riskPct} onChange={f("riskPct")} style={S.input} />
        </div>
        {riskDollars != null && (
          <div style={{ gridColumn: "1 / -1", fontSize: FS.sm, color: T.textMuted, marginTop: -6 }}>
            Arriesgando <span style={{ fontWeight: 700, color: accentColor }}>{effectiveRiskPct}%</span> = <span style={{ fontWeight: 700, color: accentColor }}>{money(riskDollars)}</span>
            {calcRR && <> · R:R 1:{calcRR}</>}
          </div>
        )}
        <PositionSizeCalculator
          instrument={form.instrument}
          entry={form.entry}
          stopLoss={form.stopLoss}
          riskDollars={riskDollars}
          instrumentSpecs={instrumentSpecs}
          setInstrumentSpecs={setInstrumentSpecs}
          onApplySize={(lots) => setForm(p => ({ ...p, size: lots }))}
          accentColor={accentColor}
        />
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.label}>P&L ($)</label>
          <input type="number" placeholder="ej. 250 o -80" value={form.pnl} onChange={f("pnl")}
            style={{ ...S.input, borderColor: pnlNum > 0 ? "#16a34a66" : pnlNum < 0 ? "#dc262666" : T.border, color: pnlNum > 0 ? T.gain : pnlNum < 0 ? T.loss : T.text, fontWeight: 700, fontSize: FS.lg }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}><SetupSelector selected={form.setups || []} onChange={v => setForm(p => ({ ...p, setups: v }))} setupsList={setupsList} setSetupsList={setSetupsList} /></div>
        <div style={{ gridColumn: "1 / -1" }}><QuickEmotionPicker selected={primaryEmotion} onChange={setPrimaryEmotion} /></div>
      </div>
      {validationErrors.length > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.loss}66`, background: `${T.loss}12` }}>
          {validationErrors.map((err, i) => (
            <div key={i} style={{ fontSize: FS.base, color: T.loss, fontWeight: 600, display: "flex", gap: 6, marginBottom: i < validationErrors.length - 1 ? 4 : 0 }}>
              <AlertTriangle size={13} /><span>{err}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ ...S.button("secondary"), flex: 1, padding: "10px 0" }}>Cancelar</button>
        <button onClick={() => validationErrors.length === 0 && onSave()} disabled={validationErrors.length > 0}
          title={validationErrors.length > 0 ? "Corregí los errores marcados arriba antes de guardar" : ""}
          style={{ ...S.button("primary", accentColor), flex: 2, padding: "10px 0", background: validationErrors.length > 0 ? T.border : accentColor, color: validationErrors.length > 0 ? T.textFaint : "#fff", boxShadow: validationErrors.length > 0 ? "none" : `0 2px 8px ${accentColor}33` }}>
          <Zap size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Guardar rápido
        </button>
      </div>
    </div>
  );
});

export { QuickTradeForm };
