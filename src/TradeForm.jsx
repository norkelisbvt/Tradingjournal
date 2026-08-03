// Generado por refactor automático a partir de TradingJournal.jsx original (revisar antes de usar en producción).
import { useEffect, useMemo, memo } from "react";
import { BarChart3, AlertTriangle, Camera } from "lucide-react";
import { T, FS, S } from "../../theme";
import { INSTRUMENTS, DIRECTIONS, SESSIONS } from "../../constants";
import { instLabel, instEmoji, validateTradeForm, money } from "../../utils";
import { EmotionSelector } from "./EmotionSelector";
import { ErrorTagSelector } from "./ErrorTagSelector";
import { FreeTagsInput } from "./FreeTagsInput";
import { ImageUpload } from "./ImageUpload";
import { PositionSizeCalculator } from "./PositionSizeCalculator";
import { ReasonsChecklist } from "./ReasonsChecklist";
import { SetupSelector } from "./SetupSelector";

const TradeForm = memo(function TradeForm({ form, setForm, onSave, onCancel, accentColor, editId, accountLabel, accountSize, defaultRiskPct, reasonsList, setReasonsList, setupsList, setSetupsList, errorsList, setErrorsList, instrumentSpecs, setInstrumentSpecs }) {
  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  // R:R se calcula solo, a partir de entrada/salida/stop loss — ya no se tipea a mano.
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

  return (
    <div style={{ background: T.surface, border: `1px solid ${accentColor}66`, borderRadius: 14, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight: 700, fontSize: FS.lg, color: T.text, marginBottom: 2 }}>{editId ? "Editar Trade" : "Nuevo Trade"}</div>
      <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 20 }}>Cuenta: <span style={{ color: accentColor, fontWeight: 700 }}>{accountLabel}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={S.label}>Fecha de entrada</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="date" value={form.date} onChange={f("date")} style={{ ...S.input, flex: 2 }} />
            <input type="time" value={form.time || ""} onChange={f("time")} style={{ ...S.input, flex: 1 }} />
          </div>
        </div>
        <div><label style={S.label}>Fecha de salida (opcional)</label><input type="date" value={form.exitDate} min={form.date || undefined} onChange={f("exitDate")} style={{ ...S.input, borderColor: form.exitDate && form.date && form.exitDate < form.date ? `${T.loss}66` : T.border }} /></div>
        <div><label style={S.label}>Instrumento</label><select value={form.instrument} onChange={f("instrument")} style={S.input}>{INSTRUMENTS.map(i => <option key={i} value={i}>{instEmoji(i)} {instLabel(i)}</option>)}</select></div>
        <div>
          <label style={S.label}>Dirección</label>
          <div style={{ display: "flex", gap: 6 }}>
            {DIRECTIONS.map(d => (
              <button key={d} onClick={() => setForm(p => ({ ...p, direction: d }))}
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
        <div>
          <label style={S.label}>R:R (automático)</label>
          <div style={{ ...S.input, display: "flex", alignItems: "center", background: T.surfaceAlt, color: calcRR ? accentColor : T.textFaint, fontWeight: 700 }}>
            {calcRR ? `1 : ${calcRR}` : "— completá entrada, salida y SL"}
          </div>
        </div>
        {riskDollars != null && (
          <div style={{ gridColumn: "1 / -1", fontSize: FS.sm, color: T.textMuted, marginTop: -6 }}>
            Arriesgando <span style={{ fontWeight: 700, color: accentColor }}>{effectiveRiskPct}%</span> de la cuenta ({accountLabel}) = <span style={{ fontWeight: 700, color: accentColor }}>{money(riskDollars)}</span>
            {calcRR && <> · recompensa potencial ≈ <span style={{ fontWeight: 700, color: T.gain }}>{money(riskDollars * parseFloat(calcRR))}</span></>}
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
        <div><SetupSelector selected={form.setups || []} onChange={v => setForm(p => ({ ...p, setups: v }))} setupsList={setupsList} setSetupsList={setSetupsList} /></div>
        <div><label style={S.label}>Notas</label><input type="text" placeholder="contexto, mercado..." value={form.notes} onChange={f("notes")} style={S.input} /></div>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, margin: "18px 0" }} />
      <div style={{ marginBottom: 18 }}><ReasonsChecklist reasons={form.reasons} onChange={r => setForm(p => ({ ...p, reasons: r }))} reasonsList={reasonsList} setReasonsList={setReasonsList} /></div>
      <div style={{ marginBottom: 18 }}><EmotionSelector selected={form.emotions} onChange={e => setForm(p => ({ ...p, emotions: e }))} /></div>
      <div style={{ marginBottom: 18 }}><ErrorTagSelector selected={form.errors || []} onChange={e => setForm(p => ({ ...p, errors: e }))} errorsList={errorsList} setErrorsList={setErrorsList} /></div>
      <div style={{ marginBottom: 18 }}><FreeTagsInput tags={form.tags || []} onChange={v => setForm(p => ({ ...p, tags: v }))} accentColor={accentColor} /></div>
      <div style={{ borderTop: `1px solid ${T.border}`, margin: "18px 0" }} />
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: FS.xs, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}><Camera size={11} />Capturas del trade</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ImageUpload label="Antes — Análisis" icon={BarChart3} value={form.imgBefore} remoteKey={form.imagenAntesKey}
            onChange={v => setForm(p => ({ ...p, imgBefore: v, ...(v === null ? { imagenAntesKey: null } : {}) }))} accentColor={accentColor} />
          <ImageUpload label="Después — Resultado" icon={Camera} value={form.imgAfter} remoteKey={form.imagenDespuesKey}
            onChange={v => setForm(p => ({ ...p, imgAfter: v, ...(v === null ? { imagenDespuesKey: null } : {}) }))} accentColor={accentColor} />
        </div>
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
          {editId ? "Guardar cambios" : "Añadir trade"}
        </button>
      </div>
    </div>
  );
});


export { TradeForm };
