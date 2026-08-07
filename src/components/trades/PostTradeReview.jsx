// Review post-trade estructurado — separado a propósito del campo "Notas"
// genérico. La idea es que "Notas" siga siendo para contexto libre (qué
// pasaba en el mercado, etc.) y este par de campos sea específicamente una
// reflexión de cierre, siempre con la misma pregunta, para que con el tiempo
// se pueda repasar "qué funcionó" y "qué mejorar" de muchos trades juntos sin
// tener que releer párrafos enteros de notas sueltas.
import { memo } from "react";
import { CheckCircle2, Wrench } from "lucide-react";
import { T, FS, S } from "../../theme";

const PostTradeReview = memo(function PostTradeReview({ whatWorked, whatToImprove, onChangeWorked, onChangeImprove }) {
  return (
    <div>
      <label style={{ ...S.label, marginBottom: 8 }}>Review del trade</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.sm, color: T.gain, fontWeight: 600, marginBottom: 5 }}>
            <CheckCircle2 size={13} />¿Qué funcionó bien?
          </label>
          <textarea value={whatWorked} onChange={e => onChangeWorked(e.target.value)} rows={2}
            placeholder="ej. Esperé la confirmación antes de entrar"
            style={{ ...S.input, resize: "vertical", minHeight: 44, fontFamily: "inherit" }} />
        </div>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: FS.sm, color: "#d97706", fontWeight: 600, marginBottom: 5 }}>
            <Wrench size={13} />¿Qué harías diferente?
          </label>
          <textarea value={whatToImprove} onChange={e => onChangeImprove(e.target.value)} rows={2}
            placeholder="ej. Salir antes ante la primera señal en contra"
            style={{ ...S.input, resize: "vertical", minHeight: 44, fontFamily: "inherit" }} />
        </div>
      </div>
    </div>
  );
});

export { PostTradeReview };
