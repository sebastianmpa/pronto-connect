import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CollapsibleFilters from "../../components/common/CollapsibleFilters";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { TicketStatsResponse } from "../../lib/customer-attention/types";
import ticketsService from "../../lib/tickets/ticketsService";
import type { TicketDepartmentOption } from "../../lib/tickets/types";

const numberFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function duration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${percentFormat.format(seconds / 60)} min`;
  return `${percentFormat.format(seconds / 3600)} h`;
}
function percentage(value: number | null | undefined) { return value == null ? "—" : `${percentFormat.format(value)} %`; }
function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>{detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}</div>;
}
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{text}</p>; }

export default function CustomerAttentionTickets() {
  const today = todayInNewYork();
  const initialFrom = `${today.slice(0, 7)}-01`;
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [departmentId, setDepartmentId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [appliedAgentId, setAppliedAgentId] = useState("");
  const [departments, setDepartments] = useState<TicketDepartmentOption[]>([]);
  const [departmentsError, setDepartmentsError] = useState(false);
  const [data, setData] = useState<TicketStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");
  const [applied, setApplied] = useState({ from: initialFrom, to: today, department_id: "" });

  useEffect(() => {
    let active = true;
    ticketsService.getDepartments().then((rows) => { if (active) setDepartments(rows); }).catch(() => { if (active) setDepartmentsError(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    customerAttentionService.ticketStats(applied, controller.signal).then((result) => { if (!controller.signal.aborted) setData(result); }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudieron cargar las estadísticas. Intenta actualizar los filtros.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied]);

  const agentRows = useMemo(() => data?.overall.by_agent ?? [], [data]);
  const activeAgent = agentRows.find((agent) => agent.agent_id === appliedAgentId) ?? null;
  const selectedAgentName = activeAgent?.agent_name || activeAgent?.agent_id || "agente seleccionado";
  const selectedDepartment = applied.department_id ? data?.by_department.find((department) => department.department_id === applied.department_id) : null;
  const selectedDepartmentAgent = selectedDepartment?.by_agent.find((agent) => agent.agent_id === appliedAgentId) ?? null;
  const displayedGroup = applied.department_id ? selectedDepartment : data?.overall;
  const selectedAgent = selectedDepartment ? selectedDepartmentAgent : activeAgent;
  const attended = selectedAgent ? selectedAgent.attended : appliedAgentId ? 0 : displayedGroup?.attended ?? 0;
  const unansweredPercent = displayedGroup?.total ? displayedGroup.unanswered / displayedGroup.total * 100 : null;
  const otherAttendedPercent = displayedGroup?.total ? Math.max(0, displayedGroup.attended - attended) / displayedGroup.total * 100 : null;
  const responseSeconds = selectedAgent?.first_response?.average_seconds ?? displayedGroup?.first_response?.average_seconds;
  const rate = displayedGroup?.total ? attended / displayedGroup.total * 100 : null;
  const chartRows = useMemo(() => {
    if (!data) return [];
    const rows = applied.department_id
      ? data.by_department.filter((department) => department.department_id === applied.department_id)
      : data.by_department;
    const count = (department: typeof rows[number]) => appliedAgentId
      ? department.by_agent.find((agent) => agent.agent_id === appliedAgentId)?.attended ?? 0
      : department.total;
    return [...rows].sort((a, b) => count(b) - count(a) || (a.department_name || a.department_id || "").localeCompare(b.department_name || b.department_id || ""));
  }, [data, applied.department_id, appliedAgentId]);
  const chartCounts = chartRows.map((department) => appliedAgentId
    ? department.by_agent.find((agent) => agent.agent_id === appliedAgentId)?.attended ?? 0
    : department.total);
  const chartTotal = chartCounts.reduce((sum, count) => sum + count, 0);
  const chartColors = ["#465FFF", "#8B5CF6", "#12B76A", "#F79009"];
  const chartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: chartRows.map((_, index) => chartColors[index % chartColors.length]),
    plotOptions: { bar: { horizontal: true, distributed: true, barHeight: "82%", borderRadius: 5, dataLabels: { position: "center" } } },
    dataLabels: { enabled: true, formatter: (_value, options) => {
      const count = chartCounts[options.dataPointIndex] ?? 0;
      return count ? `${numberFormat.format(count)} · ${percentage(chartTotal ? count / chartTotal * 100 : null)}` : "";
    }, style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 } },
    xaxis: { min: 0, categories: chartRows.map((department) => department.department_name || department.department_id || "Sin departamento"), labels: { formatter: (value) => numberFormat.format(Number(value)) } },
    yaxis: { labels: { maxWidth: 220 } }, legend: { show: false }, tooltip: { y: { formatter: (_value, options) => {
      const count = chartCounts[options.dataPointIndex] ?? 0;
      return `${numberFormat.format(count)} tickets · ${percentage(chartTotal ? count / chartTotal * 100 : null)}`;
    } } },
  };
  const chartSeries = [{ name: appliedAgentId ? "Tickets atendidos por el agente" : "Tickets creados", data: chartCounts }];

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) { setValidation("Selecciona un rango de fechas válido."); return; }
    setValidation(""); setApplied({ from, to, department_id: departmentId }); setAppliedAgentId(agentId);
  }

  return <>
    <PageMeta title="Estadísticas de tickets | Pronto Connect" description="Atención de tickets Zoho Desk por departamento y agente" />
    <div className="hidden sm:block"><PageBreadcrumb pageTitle="Estadísticas de tickets" /></div>
    <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white sm:hidden">Estadísticas de tickets</h1>
    <div className="space-y-6">
      <CollapsibleFilters description="El reporte abre con el total general. El agente corresponde a quien envió la primera respuesta pública.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-gray-700 dark:text-gray-300">Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Departamento<select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setAgentId(""); }} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los departamentos</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Agente de primera respuesta<select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los agentes</option>{((departmentId ? data?.by_department.find((department) => department.department_id === departmentId)?.by_agent : agentRows) ?? agentRows).filter((agent) => agent.agent_id).map((agent) => <option key={agent.agent_id} value={agent.agent_id!}>{agent.agent_name || agent.agent_id}</option>)}</select></label>
          <div className="flex items-end"><button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? "Cargando…" : "Aplicar filtros"}</button></div>
          {validation && <p role="alert" className="sm:col-span-2 text-sm text-red-600">{validation}</p>}{departmentsError && <p className="sm:col-span-2 text-sm text-amber-600">No se pudo cargar el catálogo de departamentos; puedes consultar el total general.</p>}
        </form>
      </CollapsibleFilters>
      {loading && <p role="status" className="text-sm text-gray-500">Cargando estadísticas de tickets…</p>}
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{error}</p>}
      {!loading && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Tickets creados en el alcance" value={numberFormat.format(displayedGroup?.total ?? 0)} />
          <Kpi label={appliedAgentId ? "Atendidos por el agente" : "Tickets atendidos"} value={numberFormat.format(attended)} detail={appliedAgentId ? `${percentage(rate)} de los tickets creados` : undefined} />
          <Kpi label="Sin respuesta en el alcance" value={numberFormat.format(displayedGroup?.unanswered ?? 0)} />
          <Kpi label={appliedAgentId ? "Participación del agente" : "Tasa de atención"} value={percentage(rate)} detail={appliedAgentId ? `${percentage(otherAttendedPercent)} atendidos por otros · ${percentage(unansweredPercent)} sin respuesta` : `${percentage(unansweredPercent)} sin respuesta`} />
          <Kpi label={appliedAgentId ? "Primera respuesta del agente" : "Promedio primera respuesta"} value={duration(responseSeconds)} />
        </div>
        <ComponentCard title={appliedAgentId ? `Volumen por departamento · ${selectedAgentName}` : "Volumen por departamento"} desc={appliedAgentId ? "Tickets atendidos por el agente, ordenados de mayor a menor." : "Tickets creados por departamento, ordenados de mayor a menor."}>
          {chartRows.length ? <div className="min-w-0 overflow-x-auto" aria-label="Volumen de tickets por departamento"><Chart options={chartOptions} series={chartSeries} type="bar" height={Math.max(260, chartRows.length * 56)} /></div> : <Empty text="No hay tickets en este período." />}
        </ComponentCard>
        {chartRows.length ? <div className="space-y-4">{chartRows.map((department) => {
          const agent = department.by_agent.find((row) => row.agent_id === appliedAgentId);
          const departmentAttended = appliedAgentId ? agent?.attended ?? 0 : department.attended;
          const selectedAgentAttended = agent?.attended ?? 0;
          const tableRows = appliedAgentId
            ? [
                { key: `selected:${appliedAgentId}`, name: selectedAgentName, attended: selectedAgentAttended, response: agent?.first_response?.average_seconds },
                { key: "other-attended", name: "Atendidos por otros agentes o sin agente identificado", attended: Math.max(0, department.attended - selectedAgentAttended), response: null },
              ]
            : [
                ...department.by_agent.map((row) => ({ key: row.agent_id ?? "unknown-agent", name: row.agent_name || row.agent_id || "Sin agente identificado", attended: row.attended, response: row.first_response?.average_seconds })),
                ...(department.attended > department.by_agent.reduce((sum, row) => sum + row.attended, 0) ? [{ key: "unassigned-attended", name: "Atendidos sin agente identificado", attended: department.attended - department.by_agent.reduce((sum, row) => sum + row.attended, 0), response: null }] : []),
              ];
          tableRows.push({ key: "unanswered", name: "Sin respuesta", attended: department.unanswered, response: null });
          let displayedShare = 0;
          const tablePercentages = tableRows.map((row, index) => {
            if (!department.total) return null;
            if (index === tableRows.length - 1) return Math.max(0, Math.round((100 - displayedShare) * 10) / 10);
            const share = Math.round((row.attended / department.total) * 1000) / 10;
            displayedShare += share;
            return share;
          });
          return <ComponentCard key={department.department_id ?? "unassigned"} title={department.department_name || department.department_id || "Sin departamento"} desc={`${numberFormat.format(departmentAttended)} de ${numberFormat.format(department.total)} tickets atendidos (${percentage(department.total ? departmentAttended / department.total * 100 : null)}) · ${numberFormat.format(department.unanswered)} sin respuesta (${percentage(department.total ? department.unanswered / department.total * 100 : null)}) · primera respuesta promedio ${duration(appliedAgentId ? agent?.first_response?.average_seconds : department.first_response?.average_seconds)}`}>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Agente / resultado</th><th className="p-3">Tickets</th><th className="p-3">% de tickets creados</th><th className="p-3">Promedio primera respuesta</th></tr></thead><tbody>{tableRows.map((row, index) => <tr key={row.key} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{row.name}</td><td className="p-3">{numberFormat.format(row.attended)}</td><td className="p-3">{percentage(tablePercentages[index])}</td><td className="p-3">{duration(row.response)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total de tickets creados</td><td className="p-3">{numberFormat.format(department.total)}</td><td className="p-3">100 %</td><td className="p-3">{duration(appliedAgentId ? agent?.first_response?.average_seconds : department.first_response?.average_seconds)}</td></tr></tfoot></table></div>
            {!appliedAgentId && <div className="flex flex-wrap gap-2 pt-3">{department.by_status.map((status) => <span key={`${status.status}:${status.status_type ?? ""}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">Estado actual · {status.status}: {numberFormat.format(status.total)}</span>)}</div>}
          </ComponentCard>;
        })}</div> : null}
      </>}
    </div>
  </>;
}
