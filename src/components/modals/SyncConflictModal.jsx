// Se muestra cuando otro dispositivo modificó un trade o cuenta después de
// la última vez que ESTE dispositivo lo sincronizó — ver la detección en
// tradesSync.js (upsertTrade/upsertAccount) y cloudSync.js (resolveConflict).
//
// A propósito NO intenta fusionar campo por campo (un merge automático de
// un trade con emociones/errores/tags mezclados es más confuso que útil acá)
// — el usuario elige una versión completa u otra, mirando lado a lado los
// campos que más probablemente cambiaron.
import { memo, useState } from "react";
import { AlertTriangle, Smartphone, Cloud } from "lucide-react";
import { T, FS, S } from "../../theme";
import { EMOTIONS } from "../../constants";
import { money } from "../../utils";

function fieldsFor(entity, data) {
  if (!data) return [];
  if (entity === "account") {
    return [
      ["Nombre", data.nombre ?? data.name],
      ["Balance inicial", data.saldoInicial != null || data.size != null ? money(data.saldoInicial ?? data.size) : "—"],
      ["Riesgo máx.", data.riesgoPct ?? data.riskPct ? `${data.riesgoPct ?? data.riskPct}%` : "—"],
    ];
  }
  const emoLabels = (data.emotions || []).map(id => EMOTIONS.find(e => e.id === id)?.label || id).join(", ") || "—";
  return [
    ["Fecha", data.date || "—"],
    ["Instrumento", data.instrument || "—"],
    ["P&L", data.pnl != null ? money(data.pnl) : "—"],
    ["Emociones", emoLabels],
    ["Notas", data.notes || "—"],
  ];
}

const SyncConflictModal = memo(function SyncConflictModal({ conflicts, onResolve }) {
  const [resolving, setResolving] = useState(false);
  if (!conflicts || conflicts.length === 0) return null;
  const conflict = conflicts[0]; // se resuelven de a uno — si hay más, el siguiente aparece solo al cerrar este
  const localFields = fieldsFor(conflict.entity, conflict.localData);
  const remoteFields = fieldsFor(conflict.entity, conflict.remoteData);

  async function pick(choice) {
    setResolving(true);
    await onResolve(conflict.id, choice);
    setResolving(false);
  }

  return (
    <div className="hz-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(13,11,22,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 16 }}>
      <div className="hz-modal-in" style={{ ...S.modal, width: "100%", maxWidth: 560, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <AlertTriangle size={17} color="#d97706" />
          <div style={{ fontSize: FS.lg, fontWeight: 800, color: T.text }}>
            {conflict.entity === "account" ? "Esta cuenta" : "Este trade"} cambió en otro dispositivo
          </div>
        </div>
        <div style={{ fontSize: FS.sm, color: T.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Alguien (probablemente vos, desde otro dispositivo) guardó una versión distinta de esto después de tu última sincronización. Elegí cuál versión conservar — la otra se descarta.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ border: `1px solid ${T.brand}55`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: T.brand, marginBottom: 10 }}>
              <Smartphone size={13} />Tu versión (este dispositivo)
            </div>
            {localFields.map(([label, value]) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: FS.sm, color: T.text }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.sm, fontWeight: 700, color: T.textMuted, marginBottom: 10 }}>
              <Cloud size={13} />Versión en la nube
            </div>
            {remoteFields.map(([label, value]) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: FS.xs, color: T.textFaint, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: FS.sm, color: T.text }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button disabled={resolving} onClick={() => pick("theirs")}
            style={{ ...S.button("secondary"), cursor: resolving ? "default" : "pointer", opacity: resolving ? 0.6 : 1 }}>
            Usar la de la nube
          </button>
          <button disabled={resolving} onClick={() => pick("mine")}
            style={{ ...S.button("primary"), cursor: resolving ? "default" : "pointer", opacity: resolving ? 0.6 : 1 }}>
            Usar mi versión
          </button>
        </div>
        {conflicts.length > 1 && (
          <div style={{ fontSize: FS.xs, color: T.textFaint, marginTop: 10, textAlign: "right" }}>
            +{conflicts.length - 1} conflicto{conflicts.length - 1 === 1 ? "" : "s"} más pendiente{conflicts.length - 1 === 1 ? "" : "s"} después de este
          </div>
        )}
      </div>
    </div>
  );
});

export { SyncConflictModal };
