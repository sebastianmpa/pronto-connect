import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type {
  CustomerAttentionCallDetail,
  CustomerAttentionCallSummary,
  QueueOutcome,
} from "../../lib/customer-attention/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  queue: QueueOutcome | null;
  from: string;
  to: string;
  agentId?: string;
}

const numberFormat = new Intl.NumberFormat("es-CO");

function duration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

function dateTime(value: string | null | undefined) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">{value}</dd>
    </div>
  );
}

function answered(call: CustomerAttentionCallSummary) {
  return String(call.call_outcome || "").toUpperCase() === "HANDLED";
}

export default function CallDetailsModal({ isOpen, onClose, queue, from, to, agentId }: Props) {
  const [calls, setCalls] = useState<CustomerAttentionCallSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [detail, setDetail] = useState<CustomerAttentionCallDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!isOpen || !queue?.queue_id) return;
    const controller = new AbortController();
    setListLoading(true);
    setListError("");
    customerAttentionService.calls({
      from,
      to,
      queue_id: queue.queue_id,
      ...(agentId ? { agent_id: agentId } : {}),
      page,
      page_size: 15,
    }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setCalls(response.calls);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.total_pages);
        setSelectedKey(response.calls[0]?.call_key ?? "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setListError("No se pudieron cargar las llamadas de esta cola.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    return () => controller.abort();
  }, [isOpen, queue?.queue_id, from, to, agentId, page]);

  useEffect(() => {
    if (!isOpen || !selectedKey) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError("");
    customerAttentionService.call(selectedKey, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setDetail(response);
      })
      .catch(() => {
        if (!controller.signal.aborted) setDetailError("No se pudo cargar el detalle de esta llamada.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [isOpen, selectedKey]);

  const selectPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const closeModal = () => {
    setPage(1);
    setSelectedKey("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white p-5 dark:bg-gray-900 md:p-7">
      <div className="space-y-5">
        <header className="pr-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Llamadas · {queue?.queue_name || "Cola GoTo"}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {from} a {to} · {numberFormat.format(total)} llamadas encontradas
          </p>
        </header>

        {listError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{listError}</p>}
        {listLoading && <p role="status" className="py-8 text-center text-sm text-gray-500">Cargando llamadas…</p>}
        {!listLoading && !listError && calls.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay llamadas para esta cola en el período seleccionado.</p>}

        {!listLoading && !listError && calls.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
            <section aria-label="Llamadas de la cola" className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Registros</h3>
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {calls.map((call) => (
                  <button
                    key={call.call_key}
                    type="button"
                    onClick={() => setSelectedKey(call.call_key)}
                    aria-pressed={selectedKey === call.call_key}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedKey === call.call_key ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"}`}
                  >
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${answered(call) ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                      {answered(call) ? "Atendida" : "No atendida"}
                    </span>
                    <span className="mt-2 block text-sm font-medium text-gray-800 dark:text-white/90">{dateTime(call.start_time_utc)}</span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {call.agent_name || "Sin agente asignado"} · {call.call_outcome || "Sin resultado"}
                    </span>
                  </button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button type="button" disabled={page <= 1} onClick={() => selectPage(page - 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-700">Anterior</button>
                  <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => selectPage(page + 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-40 dark:border-gray-700">Siguiente</button>
                </div>
              )}
            </section>

            <section aria-label="Detalle de llamada" className="min-h-64 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Qué pasó</h3>
              {detailLoading && <p role="status" className="py-8 text-center text-sm text-gray-500">Cargando detalle…</p>}
              {detailError && <p role="alert" className="mt-4 text-sm text-red-600">{detailError}</p>}
              {!detailLoading && !detailError && detail && (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailItem label="Resultado GoTo" value={detail.call_outcome || "Sin resultado"} />
                  <DetailItem label="Motivo de salida" value={detail.left_queue_reason || "Sin motivo registrado"} />
                  <DetailItem label="Agente" value={detail.agent_name || "Sin agente asignado"} />
                  <DetailItem label="Cola" value={detail.queue_name || detail.queue_id || "Sin cola"} />
                  <DetailItem label="Inicio (hora de Nueva York)" value={dateTime(detail.start_time_utc)} />
                  <DetailItem label="Línea de destino" value={detail.dialed_number_name || "Sin dato"} />
                  <DetailItem label="Espera en cola" value={duration(detail.wait_time_seconds)} />
                  <DetailItem label="Timbrado al agente" value={duration(detail.agent_ring_time_seconds)} />
                  <DetailItem label="Tiempo hablando" value={duration(detail.talk_duration_seconds)} />
                  <DetailItem label="Duración total" value={duration(detail.duration_seconds)} />
                  <DetailItem label="Disposición" value={[detail.disposition_category, detail.disposition_name].filter(Boolean).join(" · ") || "Sin disposición"} />
                  <DetailItem label="Nivel de servicio" value={detail.met_service_level || "Sin dato"} />
                  <DetailItem label="Dirección / medio" value={[detail.direction, detail.media_type].filter(Boolean).join(" · ") || "Sin dato"} />
                  <DetailItem label="Devolución de llamada" value={`Ofrecida: ${detail.callback_offered ? "Sí" : "No"} · Solicitada: ${detail.callback_requested ? "Sí" : "No"}`} />
                </dl>
              )}
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}
