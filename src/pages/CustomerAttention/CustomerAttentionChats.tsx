import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CollapsibleFilters from "../../components/common/CollapsibleFilters";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { AgentCandidatesResponse, ChatStatsResponse } from "../../lib/customer-attention/types";

const numberFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>{detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}</div>;
}

export default function CustomerAttentionChats() {
  const today = todayInNewYork();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [departmentId, setDepartmentId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [applied, setApplied] = useState({ from: monthStart, to: today, department_id: "", agent_id: "" });
  const [data, setData] = useState<ChatStatsResponse | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<ChatStatsResponse["by_department"]>([]);
  const [agents, setAgents] = useState<AgentCandidatesResponse["salesiq_agents"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    customerAttentionService.agents(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setAgents(result.salesiq_agents); })
      .catch(() => { /* Agent names can still be obtained from the aggregate response. */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    customerAttentionService.chatStats(applied, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        if (!applied.department_id) setDepartmentOptions(result.by_department);
      })
      .catch(() => { if (!controller.signal.aborted) setError("No se pudieron cargar las estadísticas de chats. Intenta actualizar los filtros."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied]);

  const selected = data?.overall;
  const buckets = useMemo(() => [
    { name: "Solo bot", count: selected?.bot_only ?? 0, percent: selected?.bot_only_percent ?? null, color: "#465FFF" },
    { name: "Bot → agente", count: selected?.bot_to_operator ?? 0, percent: selected?.bot_to_operator_percent ?? null, color: "#12B76A" },
    { name: "Solo agente", count: selected?.operator_only ?? 0, percent: selected?.operator_only_percent ?? null, color: "#F79009" },
    { name: "Agente → bot", count: selected?.operator_to_bot ?? 0, percent: selected?.operator_to_bot_percent ?? null, color: "#8B5CF6" },
    { name: "Mixto", count: selected?.mixed ?? 0, percent: selected?.mixed_percent ?? null, color: "#06AED4" },
    { name: "Sin clasificar", count: selected?.unclassified ?? 0, percent: selected?.unclassified_percent ?? null, color: "#98A2B3" },
  ].sort((a, b) => b.count - a.count), [selected]);
  const bucketTotal = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const chartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: buckets.map((bucket) => bucket.color),
    plotOptions: { bar: { horizontal: true, distributed: true, barHeight: "82%", borderRadius: 5, dataLabels: { position: "center" } } },
    dataLabels: {
      enabled: true,
      formatter: (_value, options) => {
        const bucket = buckets[options.dataPointIndex];
        return bucket?.count ? `${numberFormat.format(bucket.count)} · ${percentFormat.format(bucketTotal ? bucket.count / bucketTotal * 100 : 0)} %` : "";
      },
      style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 },
    },
    xaxis: { categories: buckets.map((bucket) => bucket.name), labels: { formatter: (value) => numberFormat.format(Number(value)) } },
    yaxis: { labels: { maxWidth: 160 } },
    legend: { show: false },
    tooltip: { y: { formatter: (_value, options) => {
      const bucket = buckets[options.dataPointIndex];
      return `${numberFormat.format(bucket?.count ?? 0)} chats · ${percentFormat.format(bucketTotal ? (bucket?.count ?? 0) / bucketTotal * 100 : 0)} %`;
    } } },
  };
  const chartSeries = [{ name: "Chats", data: buckets.map((bucket) => bucket.count) }];

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setValidation("Selecciona un rango de fechas válido.");
      return;
    }
    setValidation("");
    setApplied({ from, to, department_id: departmentId, agent_id: agentId });
  }

  return <>
    <PageMeta title="Estadísticas de chats | Pronto Connect" description="Recorrido de chats de SalesIQ entre bot y operadores" />
    <PageBreadcrumb pageTitle="Estadísticas de chats" />
    <div className="space-y-6">
      <CollapsibleFilters description="El rango usa días de Nueva York. Agente o bot asociado filtra chats donde participó esa identidad; un chat transferido por un bot también puede quedar asociado al agente que lo aceptó.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-gray-700 dark:text-gray-300">Desde<input aria-label="Desde" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Hasta<input aria-label="Hasta" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 px-3 dark:border-gray-700 dark:bg-gray-900" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Departamento<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"><option value="">Todos los departamentos</option>{departmentOptions.filter((row) => row.department_id).map((row) => <option key={row.department_id} value={row.department_id!}>{row.department_name || row.department_id}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Agente o bot asociado<select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"><option value="">Todos los agentes</option>{(agents.length ? agents : (data?.by_agent ?? []).filter((row) => row.agent_id).map((row) => ({ agent_id: row.agent_id!, agent_name: row.agent_name }))).map((agent) => <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_name || agent.agent_id}</option>)}</select></label>
          <div className="flex items-end"><button type="submit" disabled={loading} className="h-9 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Cargando…" : "Aplicar filtros"}</button></div>
          {validation && <p role="alert" className="text-sm text-red-600 sm:col-span-2 xl:col-span-4">{validation}</p>}
        </form>
      </CollapsibleFilters>
      {loading && <p role="status" className="text-sm text-gray-500">Cargando estadísticas de chats…</p>}
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{error}</p>}
      {!loading && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Chats del período" value={numberFormat.format(data.overall.total)} />
          <Kpi label="Solo bot" value={numberFormat.format(data.overall.bot_only)} detail={data.overall.bot_only_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.bot_only_percent)} % del total`} />
          <Kpi label="Bot → agente" value={numberFormat.format(data.overall.bot_to_operator)} detail={data.overall.bot_to_operator_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.bot_to_operator_percent)} % del total`} />
          <Kpi label="Solo agente" value={numberFormat.format(data.overall.operator_only)} detail={data.overall.operator_only_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.operator_only_percent)} % del total`} />
          <Kpi label="Agente → bot" value={numberFormat.format(data.overall.operator_to_bot)} detail={data.overall.operator_to_bot_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.operator_to_bot_percent)} % del total`} />
          <Kpi label="Mixto" value={numberFormat.format(data.overall.mixed)} detail={data.overall.mixed_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.mixed_percent)} % del total`} />
          <Kpi label="Sin clasificar" value={numberFormat.format(data.overall.unclassified)} detail={data.overall.unclassified_percent == null ? "Porcentaje no disponible" : `${percentFormat.format(data.overall.unclassified_percent)} % del total`} />
        </div>
        {data.overall.unclassified > 0 && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Algunos chats tienen hilos sin atendiente identificado; se conservan como sin clasificar.</p>}
        <ComponentCard title="Recorrido de atención" desc={`${numberFormat.format(data.overall.classified)} de ${numberFormat.format(data.overall.total)} chats clasificados, ordenados de mayor a menor por tipo de recorrido.`}>
          {data.overall.total ? <div className="min-w-0 overflow-x-auto" aria-label="Recorrido de atención de chats entre bot y agentes"><Chart options={chartOptions} series={chartSeries} type="bar" height={Math.max(260, buckets.length * 48)} /></div> : <p className="py-8 text-center text-sm text-gray-500">No hay chats en este período.</p>}
        </ComponentCard>
        {data.by_agent.length > 0 && <ComponentCard title="Chats por agente" desc="Cuenta chats distintos asociados a cada agente. Si varios agentes atendieron un mismo chat, aparecerá en cada fila; la suma de asociaciones puede superar el total general.">
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Agente</th><th className="p-3">Chats asociados</th><th className="p-3">% del total del período</th></tr></thead><tbody>{data.by_agent.map((agent) => <tr key={agent.agent_id || "unknown"} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium text-gray-800 dark:text-gray-200">{agent.agent_name || agent.agent_id || "Agente sin identificar"}</td><td className="p-3">{numberFormat.format(agent.total)}</td><td className="p-3">{percentFormat.format(data.overall.total ? agent.total / data.overall.total * 100 : 0)} %</td></tr>)}<tr className="font-semibold"><td className="p-3">Suma de asociaciones</td><td className="p-3">{numberFormat.format(data.by_agent.reduce((sum, agent) => sum + agent.total, 0))}</td><td className="p-3">{percentFormat.format(data.overall.total ? data.by_agent.reduce((sum, agent) => sum + agent.total, 0) / data.overall.total * 100 : 0)} %</td></tr></tbody></table></div>
        </ComponentCard>}
      </>}
    </div>
  </>;
}
