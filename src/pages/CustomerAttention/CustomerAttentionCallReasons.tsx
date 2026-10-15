import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { CalendarAltIcon } from "../../icons";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { CallReasonStatsResponse } from "../../lib/customer-attention/types";

const numberFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="relative w-full"><input aria-label={label} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 pr-9 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><CalendarAltIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" /></div>;
}
function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>{detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}</div>;
}
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{text}</p>; }

export default function CustomerAttentionCallReasons() {
  const today = todayInNewYork();
  const firstDay = `${today.slice(0, 7)}-01`;
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [agentEmail, setAgentEmail] = useState("");
  const [closureMethod, setClosureMethod] = useState("");
  const [applied, setApplied] = useState({ from: firstDay, to: today, agent_email: "", closure_method: "" });
  const [data, setData] = useState<CallReasonStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");
  const [view, setView] = useState<"chart" | "table">("chart");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    customerAttentionService.callReasons(applied, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudieron cargar las calificaciones. Intenta actualizar los filtros.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied]);

  const reasons = useMemo(() => [...(data?.by_reason ?? [])]
    .sort((a, b) => b.total - a.total || a.contact_reason.localeCompare(b.contact_reason)), [data]);
  const reasonColors = ["#465FFF", "#8B5CF6", "#12B76A", "#F79009"];
  const chartOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: reasons.map((_, index) => reasonColors[index % reasonColors.length]),
    plotOptions: { bar: { horizontal: true, barHeight: "82%", borderRadius: 5, distributed: true, dataLabels: { position: "center" } } },
    dataLabels: { enabled: true, formatter: (value) => {
      const share = data?.overall.total_qualifications ? (Number(value) / data.overall.total_qualifications) * 100 : 0;
      return Number(value) ? `${numberFormat.format(Number(value))} · ${percentFormat.format(share)} %` : "";
    }, style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 } }, xaxis: { min: 0, labels: { formatter: (value) => numberFormat.format(Number(value)) } },
    yaxis: { labels: { maxWidth: 260 } }, legend: { show: false },
    tooltip: { y: { formatter: (value, context) => {
      const reason = reasons[context.dataPointIndex];
      return `${numberFormat.format(value)} calificaciones · ${numberFormat.format(reason?.unique_calls ?? 0)} llamadas únicas · ${percentFormat.format(reason?.percent ?? 0)} % de calificaciones`;
    } } },
  };
  const chartSeries = [{ name: "Calificaciones", data: reasons.map((reason) => reason.total) }];
  const dailyOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#465FFF", "#12B76A"], dataLabels: { enabled: false }, stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: data?.by_day.map((point) => point.date) ?? [], labels: { rotate: -45 } },
    yaxis: { min: 0, decimalsInFloat: 0, labels: { formatter: (value) => numberFormat.format(value) } },
    legend: { position: "bottom" }, tooltip: { shared: true },
  };
  const dailySeries = [
    { name: "Calificaciones", data: data?.by_day.map((point) => point.qualifications) ?? [] },
    { name: "Llamadas únicas", data: data?.by_day.map((point) => point.unique_calls) ?? [] },
  ];

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) { setValidation("Selecciona un rango de fechas válido."); return; }
    setValidation(""); setApplied({ from, to, agent_email: agentEmail, closure_method: closureMethod });
  }

  return <>
    <PageMeta title="Motivos de llamadas | Pronto Connect" description="Análisis de calificaciones de llamadas por motivo, agente y cierre" />
    <div className="hidden sm:block"><PageBreadcrumb pageTitle="Motivos de llamadas" /></div>
    <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white sm:hidden">Motivos de llamadas</h1>
    <div className="space-y-6">
      <ComponentCard title="Filtros" desc="Fuente: tabla de calificaciones `answered_calls` en PostgreSQL. Cada fila cuenta como una calificación; las llamadas se cuentan por call_id único.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm text-gray-700 dark:text-gray-300">Desde<div className="mt-1"><DateInput label="Desde" value={from} onChange={setFrom} /></div></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Hasta<div className="mt-1"><DateInput label="Hasta" value={to} onChange={setTo} /></div></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Agente<select value={agentEmail} onChange={(event) => setAgentEmail(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los agentes</option>{(data?.agent_options ?? []).map((agent) => <option key={agent.agent_email} value={agent.agent_email}>{agent.agent_name || agent.agent_email}{agent.extension ? ` · Ext. ${agent.extension}` : ""}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Método de cierre<select value={closureMethod} onChange={(event) => setClosureMethod(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los métodos</option>{(data?.closure_options ?? []).map((method) => <option key={method} value={method}>{method === "__missing__" ? "Sin método" : method}</option>)}</select></label>
          <div className="flex items-end"><button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? "Cargando…" : "Aplicar filtros"}</button></div>
          {validation && <p role="alert" className="text-sm text-red-600">{validation}</p>}
        </form>
      </ComponentCard>
      {loading && <p role="status" className="text-sm text-gray-500">Cargando estadísticas de llamadas…</p>}
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{error}</p>}
      {!loading && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Kpi label="Calificaciones" value={numberFormat.format(data.overall.total_qualifications)} detail="Filas registradas en el período" />
          <Kpi label="Llamadas únicas" value={numberFormat.format(data.overall.unique_calls)} detail="Conversaciones distintas por call_id" />
          <Kpi label="Conversaciones recalificadas" value={numberFormat.format(data.overall.repeated_calls)} detail={`${numberFormat.format(data.overall.repeated_qualifications)} calificaciones adicionales`} />
          <Kpi label="Motivos distintos" value={numberFormat.format(reasons.filter((reason) => reason.contact_reason !== "Sin motivo").length)} />
          <Kpi label="Calificaciones por llamada" value={data.overall.average_qualifications_per_call == null ? "—" : percentFormat.format(data.overall.average_qualifications_per_call)} detail="Promedio de registros con call_id" />
          <Kpi label="Motivo registrado" value={data.overall.contact_reason_coverage_percent == null ? "—" : `${percentFormat.format(data.overall.contact_reason_coverage_percent)} %`} detail={`${numberFormat.format(data.overall.missing_contact_reason)} sin motivo`} />
        </div>
        <ComponentCard title="Calificaciones por motivo" desc="Cada fila cuenta una vez. Las llamadas únicas de distintos motivos pueden solaparse si una conversación se calificó con más de un motivo.">
          {reasons.length ? <>
            <div className="mb-4 flex justify-end"><div role="group" aria-label="Vista de calificaciones por motivo" className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700"><button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")} className={`rounded-md px-3 py-1.5 text-sm ${view === "chart" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>Gráfica</button><button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={`rounded-md px-3 py-1.5 text-sm ${view === "table" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}>Tabla</button></div></div>
            {view === "chart" ? <div className="min-w-0 overflow-x-auto" aria-label="Gráfica de calificaciones por motivo"><Chart options={{ ...chartOptions, xaxis: { ...chartOptions.xaxis, categories: reasons.map((reason) => reason.contact_reason) } }} series={chartSeries} type="bar" height={Math.max(260, reasons.length * 52)} /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Motivo</th><th className="p-3">Calificaciones</th><th className="p-3">Llamadas únicas</th><th className="p-3">% de calificaciones</th><th className="p-3">% de llamadas únicas*</th></tr></thead><tbody>{reasons.map((reason) => <tr key={reason.contact_reason} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium text-gray-800 dark:text-gray-200">{reason.contact_reason}</td><td className="p-3">{numberFormat.format(reason.total)}</td><td className="p-3">{numberFormat.format(reason.unique_calls)}</td><td className="p-3">{percentFormat.format(reason.percent ?? 0)} %</td><td className="p-3">{percentFormat.format(reason.unique_call_percent ?? 0)} %</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{numberFormat.format(data.overall.total_qualifications)}</td><td className="p-3">{numberFormat.format(data.overall.unique_calls)}</td><td className="p-3">100 %</td><td className="p-3">100 % general</td></tr></tfoot></table><p className="mt-2 text-xs text-gray-500">* Una llamada puede aparecer en más de un motivo; estos porcentajes no necesariamente suman 100 %. El total de llamadas únicas es el conteo distinto general, no la suma de filas.</p></div>}
          </> : <Empty text="No hay calificaciones para los filtros seleccionados." />}
        </ComponentCard>
        <ComponentCard title="Tendencia diaria" desc="Compara calificaciones registradas con conversaciones únicas; ambas series usan la fecha de llamada.">
          {data.by_day.length ? <div className="min-w-0 overflow-x-auto" aria-label="Tendencia diaria de calificaciones y llamadas únicas"><Chart options={dailyOptions} series={dailySeries} type="area" height={300} /></div> : <Empty text="No hay actividad diaria en este período." />}
        </ComponentCard>
        <div className="grid gap-6 xl:grid-cols-2">
          <ComponentCard title="Actividad por agente" desc="El agente identifica al usuario registrado en la calificación. Si un call_id fue calificado por varios agentes, esa llamada aparece en cada agente.">
            {data.by_agent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Agente</th><th className="p-3">Calificaciones</th><th className="p-3">Llamadas únicas</th><th className="p-3">Motivos distintos</th><th className="p-3">% del total</th></tr></thead><tbody>{data.by_agent.map((agent) => <tr key={agent.agent_email} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{agent.agent_name || agent.agent_email}{agent.extension ? <span className="block text-xs text-gray-500">Ext. {agent.extension}</span> : null}</td><td className="p-3">{numberFormat.format(agent.qualifications)}</td><td className="p-3">{numberFormat.format(agent.unique_calls)}</td><td className="p-3">{numberFormat.format(agent.distinct_reasons)}</td><td className="p-3">{percentFormat.format(agent.percent ?? 0)} %</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{numberFormat.format(data.overall.total_qualifications)}</td><td className="p-3">{numberFormat.format(data.overall.unique_calls)}</td><td className="p-3">{numberFormat.format(reasons.filter((reason) => reason.contact_reason !== "Sin motivo").length)}</td><td className="p-3">100 %</td></tr></tfoot></table><p className="mt-2 text-xs text-gray-500">El total de llamadas únicas es distinto general; una llamada calificada por varios agentes aparece en más de una fila.</p></div> : <Empty text="No hay agentes para los filtros seleccionados." />}
          </ComponentCard>
          <ComponentCard title="Métodos de cierre" desc="Distribución de los métodos registrados. Una misma llamada puede aparecer bajo más de un método si tuvo varias calificaciones.">
            {data.by_closure_method.length ? <div className="overflow-x-auto"><table className="w-full min-w-[430px] text-left text-sm"><thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Método</th><th className="p-3">Calificaciones</th><th className="p-3">Llamadas únicas</th><th className="p-3">%</th></tr></thead><tbody>{data.by_closure_method.map((row) => <tr key={row.closure_method} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{row.closure_method}</td><td className="p-3">{numberFormat.format(row.qualifications)}</td><td className="p-3">{numberFormat.format(row.unique_calls)}</td><td className="p-3">{percentFormat.format(row.percent ?? 0)} %</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{numberFormat.format(data.overall.total_qualifications)}</td><td className="p-3">{numberFormat.format(data.overall.unique_calls)}</td><td className="p-3">100 %</td></tr></tfoot></table><p className="mt-2 text-xs text-gray-500">El total de llamadas únicas es distinto general; una llamada puede tener varias calificaciones y métodos de cierre.</p></div> : <Empty text="No hay métodos de cierre para los filtros seleccionados." />}
          </ComponentCard>
        </div>
        <ComponentCard title="Motivo y método de cierre" desc="Cruce descriptivo: muestra qué método de cierre se registró para cada motivo; no representa una tasa de resolución.">
          {data.by_reason_and_closure.length ? <div className="max-h-[480px] overflow-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Motivo</th><th className="p-3">Método de cierre</th><th className="p-3">Calificaciones</th><th className="p-3">% del período</th></tr></thead><tbody>{data.by_reason_and_closure.map((row) => <tr key={`${row.contact_reason}:${row.closure_method}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3">{row.contact_reason}</td><td className="p-3">{row.closure_method}</td><td className="p-3">{numberFormat.format(row.qualifications)}</td><td className="p-3">{percentFormat.format(row.percent ?? 0)} %</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3" colSpan={2}>Total general</td><td className="p-3">{numberFormat.format(data.overall.total_qualifications)}</td><td className="p-3">100 %</td></tr></tfoot></table></div> : <Empty text="No hay combinaciones de motivo y cierre para este período." />}
        </ComponentCard>
        <ComponentCard title="Calidad de los registros" desc="Porcentaje con dato presente, calculado sobre las calificaciones filtradas.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="call_id identificado" value={data.overall.call_id_coverage_percent == null ? "—" : `${percentFormat.format(data.overall.call_id_coverage_percent)} %`} detail={`${numberFormat.format(data.overall.missing_call_id)} sin call_id`} /><Kpi label="Agente identificado" value={data.overall.agent_coverage_percent == null ? "—" : `${percentFormat.format(data.overall.agent_coverage_percent)} %`} detail={`${numberFormat.format(data.overall.missing_agent)} sin agente`} /><Kpi label="Método de cierre registrado" value={data.overall.closure_method_coverage_percent == null ? "—" : `${percentFormat.format(data.overall.closure_method_coverage_percent)} %`} detail={`${numberFormat.format(data.overall.missing_closure_method)} sin método`} /><Kpi label="Agentes en el período" value={numberFormat.format(data.overall.total_agents)} /></div>
        </ComponentCard>
      </>}
    </div>
  </>;
}
