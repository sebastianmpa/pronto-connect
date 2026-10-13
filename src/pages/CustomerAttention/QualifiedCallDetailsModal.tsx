import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { QualifiedCallDetailsResponse } from "../../lib/customer-attention/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
}

const numberFormat = new Intl.NumberFormat("es-CO");

function dateTime(value: string | null | undefined) {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function duration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "Sin dato";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">{value}</dd>
    </div>
  );
}

function safeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function eventCount(value: unknown) {
  const parsed = safeJson(value);
  return Array.isArray(parsed) ? parsed.length : parsed == null ? 0 : 1;
}

export default function QualifiedCallDetailsModal({ isOpen, onClose, conversationId }: Props) {
  const [detail, setDetail] = useState<QualifiedCallDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setDetail(null);
    customerAttentionService.qualifiedCall(conversationId, controller.signal)
      .then((response) => { if (!controller.signal.aborted) setDetail(response); })
      .catch(() => { if (!controller.signal.aborted) setError("No se pudo cargar el detalle de esta conversación."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isOpen, conversationId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 dark:bg-gray-900 md:p-7">
      <div className="space-y-6">
        <header className="pr-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detalle de la llamada calificada</h2>
          <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">Conversación GoTo: {conversationId}</p>
        </header>
        {loading && <p role="status" className="py-8 text-center text-sm text-gray-500">Cargando detalle…</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
        {!loading && !error && detail && (
          <>
            <section className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Resumen GoTo</h3>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Inicio (hora de Nueva York)" value={dateTime(detail.event?.call_created_utc)} />
                <DetailItem label="Contestada" value={dateTime(detail.event?.call_answered_utc)} />
                <DetailItem label="Finalizada" value={dateTime(detail.event?.call_ended_utc)} />
                <DetailItem label="Dirección" value={detail.event?.direction || "Sin dato"} />
                <DetailItem label="Resultado" value={detail.event?.caller_outcome || detail.event?.call_result || detail.event?.queue_outcome || "Sin resultado"} />
                <DetailItem label="Agente GoTo" value={[detail.event?.agent_name, detail.event?.agent_extension].filter(Boolean).join(" · ") || "Sin agente"} />
                <DetailItem label="Duración" value={duration(detail.event?.duration_seconds)} />
                <DetailItem label="Tiempo para contestar" value={duration(detail.event?.answer_delay_seconds)} />
                <DetailItem label="Origen de finalización" value={detail.report?.hangup_originator_id || "Sin dato"} />
                <DetailItem label="Eventos IVR" value={numberFormat.format(eventCount(detail.report?.ivr_systems))} />
                <DetailItem label="Estados de llamada" value={numberFormat.format(eventCount(detail.report?.call_states))} />
                <DetailItem label="Transferencias" value={numberFormat.format(eventCount(detail.report?.transfer_events))} />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Interacciones en colas GoTo</h3>
              {detail.queue_interactions.length ? <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700"><tr><th className="p-3">Hora</th><th className="p-3">Cola</th><th className="p-3">Resultado / motivo</th><th className="p-3">Agente</th><th className="p-3">Espera</th><th className="p-3">Atención</th></tr></thead>
                  <tbody>{detail.queue_interactions.map((row) => <tr key={row.queue_caller_key} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="p-3">{dateTime(row.start_time_utc)}</td><td className="p-3">{row.queue_name || row.queue_id || "Sin cola"}</td>
                    <td className="p-3">{[row.call_outcome, row.left_queue_reason].filter(Boolean).join(" · ") || "Sin resultado"}</td><td className="p-3">{row.agent_name || "Sin agente"}</td>
                    <td className="p-3">{duration(row.wait_time_seconds)}</td><td className="p-3">{duration(row.talk_duration_seconds)}</td>
                  </tr>)}</tbody>
                </table>
              </div> : <p className="text-sm text-gray-500">GoTo no tiene una interacción de cola asociada a esta conversación.</p>}
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Historial de calificaciones ({detail.qualifications.length})</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700"><tr><th className="p-3">Fecha de registro</th><th className="p-3">Agente</th><th className="p-3">Motivo de contacto</th><th className="p-3">Cierre</th></tr></thead>
                  <tbody>{detail.qualifications.map((row) => <tr key={row.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="p-3">{dateTime(row.created_at || row.call_date_time)}</td><td className="p-3">{[row.agent_name, row.extension].filter(Boolean).join(" · ") || "Sin agente"}</td>
                    <td className="p-3">{row.contact_reason || "Sin motivo"}</td><td className="p-3">{row.closure_method || "Sin cierre"}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
