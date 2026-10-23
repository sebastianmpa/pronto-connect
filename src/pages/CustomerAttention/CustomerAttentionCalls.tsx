import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CollapsibleFilters from "../../components/common/CollapsibleFilters";
import CallDetailsModal from "./CallDetailsModal";
import QualifiedCallDetailsModal from "./QualifiedCallDetailsModal";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { AgentCandidate, AgentCandidatesResponse, AnalyticsQuery, OutcomesResponse, QualifiedCallSummary, QueueOutcome } from "../../lib/customer-attention/types";

const numberFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const dateToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const initialFrom = `${dateToday.slice(0, 7)}-01`;

function percent(value: number | null) {
  return value == null ? "—" : `${percentFormat.format(value)} %`;
}

function complementaryPercent(value: number | null) {
  return value == null ? "—" : `${percentFormat.format(100 - Math.round(value * 10) / 10)} %`;
}

function callDate(value: string | null) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date);
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{text}</p>;
}

export default function CustomerAttentionCalls() {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(dateToday);
  const [agentId, setAgentId] = useState("");
  const [applied, setApplied] = useState({ from: initialFrom, to: dateToday, agentId: "" });
  const [outcomes, setOutcomes] = useState<OutcomesResponse | null>(null);
  const [qualifiedCalls, setQualifiedCalls] = useState<QualifiedCallSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [agents, setAgents] = useState<AgentCandidate[]>([]);
  const [agentsError, setAgentsError] = useState(false);
  const [queue, setQueue] = useState<QueueOutcome | null>(null);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    customerAttentionService.agents(controller.signal)
      .then((response: AgentCandidatesResponse) => {
        if (!controller.signal.aborted) setAgents(response.goto_agents);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAgentsError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const query: AnalyticsQuery = { from: applied.from, to: applied.to, ...(applied.agentId ? { agent_id: applied.agentId } : {}) };
    Promise.allSettled([
      customerAttentionService.outcomes(query, controller.signal),
      customerAttentionService.qualifiedCalls({ from: applied.from, to: applied.to, page, page_size: 15 }, controller.signal),
    ]).then(([outcomeResult, qualifiedResult]) => {
      if (controller.signal.aborted) return;
      const messages: string[] = [];
      if (outcomeResult.status === "fulfilled") setOutcomes(outcomeResult.value);
      else { setOutcomes(null); messages.push("No se pudieron cargar las llamadas por cola."); }
      if (qualifiedResult.status === "fulfilled") {
        setQualifiedCalls(qualifiedResult.value.conversations);
        setTotal(qualifiedResult.value.pagination.total);
        setTotalPages(qualifiedResult.value.pagination.total_pages);
      } else { setQualifiedCalls([]); messages.push("No se pudieron cargar las llamadas calificadas."); }
      setError(messages.join(" "));
      setLoading(false);
    });
    return () => controller.abort();
  }, [applied, page]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setValidation("Selecciona un rango de fechas válido.");
      return;
    }
    setValidation("");
    setPage(1);
    setApplied({ from, to, agentId });
  }

  const queues = [...(outcomes?.current.by_queue ?? [])].sort((a, b) => b.total - a.total || (a.queue_name || a.queue_id || "").localeCompare(b.queue_name || b.queue_id || ""));
  const queueTotal = queues.reduce((sum, item) => sum + item.total, 0);
  const queueColors = ["#465FFF", "#8B5CF6", "#12B76A", "#F79009"];
  const chartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: queues.map((_, index) => queueColors[index % queueColors.length]),
    plotOptions: { bar: { horizontal: true, distributed: true, barHeight: "82%", borderRadius: 5, dataLabels: { position: "center" } } },
    dataLabels: { enabled: true, formatter: (_value, options) => {
      const queue = queues[options.dataPointIndex];
      return queue?.total ? `${numberFormat.format(queue.total)} · ${percent(queueTotal ? queue.total / queueTotal * 100 : null)}` : "";
    }, style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 } },
    xaxis: { categories: queues.map((item) => item.queue_name || item.queue_id || "Sin cola"), labels: { formatter: (value) => numberFormat.format(Number(value)) } },
    legend: { show: false },
    tooltip: { y: { formatter: (_value, options) => {
      const queue = queues[options.dataPointIndex];
      return `${numberFormat.format(queue?.total ?? 0)} llamadas · ${percent(queueTotal ? (queue?.total ?? 0) / queueTotal * 100 : null)}`;
    } } },
  };
  const chartSeries = [{ name: "Llamadas", data: queues.map((item) => item.total) }];

  return <>
    <PageMeta title="Detalle de llamadas | Pronto Connect" description="Consultas y detalle de llamadas GoTo" />
    <PageBreadcrumb pageTitle="Detalle de llamadas" />
    <div className="space-y-6">
      <CollapsibleFilters description="El rango usa días de Nueva York. El agente aplica a las llamadas por cola; las calificadas no tienen filtro de agente.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-gray-700 dark:text-gray-300">Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Agente GoTo<select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"><option value="">Todos los agentes</option>{agents.map((agent) => <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_name || agent.agent_id}</option>)}</select></label>
          <div className="flex items-end"><button type="submit" className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white">Aplicar filtros</button></div>
          {validation && <p role="alert" className="text-sm text-red-600 sm:col-span-2 xl:col-span-4">{validation}</p>}
          {agentsError && <p className="text-xs text-amber-700 sm:col-span-2 xl:col-span-4">No se pudo cargar la lista de agentes GoTo; puedes consultar todas las colas.</p>}
        </form>
      </CollapsibleFilters>
      {loading && <p role="status" className="text-sm text-gray-500">Cargando llamadas…</p>}
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}

      <ComponentCard title="Llamadas por cola" desc="Barras ordenadas por volumen; la tabla conserva el desglose de atendidas y no atendidas. Abre una cola para revisar cada interacción.">
        {outcomes && queues.length ? <>
          <div className="mb-4 min-w-0 overflow-x-auto" aria-label="Volumen total de llamadas por cola"><Chart options={chartOptions} series={chartSeries} type="bar" height={Math.max(260, queues.length * 56)} /></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700"><tr><th className="p-3">Cola</th><th className="p-3">Total</th><th className="p-3">Atendidas</th><th className="p-3">No atendidas</th><th className="p-3">Atendidas %</th><th className="p-3">No atendidas %</th><th className="p-3">Acción</th></tr></thead><tbody>{queues.map((item) => <tr key={`${item.queue_id ?? ""}:${item.queue_name ?? ""}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{item.queue_name || item.queue_id || "Sin cola"}</td><td className="p-3">{numberFormat.format(item.total)}</td><td className="p-3">{numberFormat.format(item.handled)}</td><td className="p-3">{numberFormat.format(item.unattended)}</td><td className="p-3">{percent(item.attended_percent)}</td><td className="p-3">{complementaryPercent(item.attended_percent)}</td><td className="p-3"><button type="button" disabled={!item.queue_id} onClick={() => { setQueue(item); setQueueModalOpen(true); }} className="whitespace-nowrap font-medium text-brand-600 disabled:opacity-40">Ver llamadas</button></td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{numberFormat.format(outcomes!.current.overall.total)}</td><td className="p-3">{numberFormat.format(outcomes!.current.overall.handled)}</td><td className="p-3">{numberFormat.format(outcomes!.current.overall.unattended)}</td><td className="p-3">{percent(outcomes!.current.overall.attended_percent)}</td><td className="p-3">{complementaryPercent(outcomes!.current.overall.attended_percent)}</td><td className="p-3">—</td></tr></tfoot></table></div>
        </> : !loading && !error ? <Empty text="No hay llamadas en colas para este período." /> : null}
      </ComponentCard>

      <ComponentCard title="Llamadas calificadas" desc="Una fila por conversación con calificaciones guardadas. La acción abre los eventos y las calificaciones disponibles.">
        {qualifiedCalls.length ? <>
          <div className="mb-3 text-sm text-gray-500">{numberFormat.format(total)} conversaciones calificadas</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700"><tr><th className="p-3">Fecha</th><th className="p-3">Dirección</th><th className="p-3">Resultado</th><th className="p-3">Agente GoTo</th><th className="p-3">Calificaciones</th><th className="p-3">Detalle</th></tr></thead><tbody>{qualifiedCalls.map((call) => <tr key={call.conversation_id} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3">{callDate(call.call_created_utc)}</td><td className="p-3">{call.direction || "Sin dato"}</td><td className="p-3">{call.caller_outcome || call.call_result || "Sin resultado"}</td><td className="p-3">{[call.agent_name, call.agent_extension].filter(Boolean).join(" · ") || "Sin agente"}</td><td className="p-3">{numberFormat.format(call.qualification_count)}</td><td className="p-3"><button type="button" onClick={() => setConversationId(call.conversation_id)} className="whitespace-nowrap font-medium text-brand-600">Ver qué pasó</button></td></tr>)}</tbody></table></div>
          {totalPages > 1 && <div className="mt-4 flex items-center justify-between gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Anterior</button><span className="text-xs text-gray-500">Página {page} de {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Siguiente</button></div>}
        </> : !loading && !error ? <Empty text="No hay llamadas calificadas en este período." /> : null}
      </ComponentCard>
      <CallDetailsModal isOpen={queueModalOpen} onClose={() => setQueueModalOpen(false)} queue={queue} from={applied.from} to={applied.to} agentId={applied.agentId || undefined} />
      <QualifiedCallDetailsModal isOpen={Boolean(conversationId)} conversationId={conversationId} onClose={() => setConversationId(null)} />
    </div>
  </>;
}
