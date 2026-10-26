import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import flatpickr from "flatpickr";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CollapsibleFilters from "../../components/common/CollapsibleFilters";
import Tooltip from "../../components/ui/tooltip/Tooltip";
import { CalendarAltIcon } from "../../icons";
import { cancellationStatisticsService } from "../../lib/cancellation-statistics/service";
import type { CancellationStatisticsResponse } from "../../lib/cancellation-statistics/types";

const countFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const usdFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
type FocusFilter = "all" | "high-rate" | "high-impact";
type StatisticsQuery = { from: string; to: string; store: string; focus: "" | "high-rate" | "high-impact"; reason: string; agent: string; age: string };
function ChartTableContent({ label, chart, table }: { label: string; chart: ReactNode; table: ReactNode }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return <>
    <div className="mb-4 flex justify-end">
      <div role="group" aria-label={`Vista de ${label}`} className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")} className={`rounded-md px-3 py-1.5 text-sm ${view === "chart" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>Gráfico</button>
        <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={`rounded-md px-3 py-1.5 text-sm ${view === "table" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>Tabla</button>
      </div>
    </div>
    {view === "chart" ? chart : table}
  </>;
}

function InfoTooltip({ label, content }: { label: string; content: string }) {
  return <Tooltip content={content} placement="top" variant="light">
    <button type="button" aria-label={`Información: ${label}`} className="ml-1 inline-flex size-5 items-center justify-center rounded-full border border-current text-[11px] font-semibold opacity-70 hover:opacity-100">i</button>
  </Tooltip>;
}

function HorizontalBarChart({ categories, series, tooltipText, height }: {
  categories: string[];
  series: { name: string; data: number[] }[];
  tooltipText: (seriesIndex: number, dataPointIndex: number) => string;
  height: number;
}) {
  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "90%" } },
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { formatter: (value) => count(Number(value)) } },
    yaxis: { labels: { maxWidth: 220 } },
    tooltip: { y: { formatter: (_value, context) => tooltipText(context.seriesIndex, context.dataPointIndex) } },
  };
  return <div className="min-w-0 overflow-x-auto"><Chart options={options} series={series} type="bar" height={height} /></div>;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateRangeInput({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const initialRangeRef = useRef([from, to]);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => {
    if (!inputRef.current) return;
    const picker = flatpickr(inputRef.current, {
      mode: "range",
      defaultDate: initialRangeRef.current.map(parseLocalDate).filter((date): date is Date => Boolean(date)),
      dateFormat: "m/d/Y",
      disableMobile: true,
      onChange: (dates) => {
        if (dates.length === 2) onChangeRef.current(formatLocalDate(dates[0]), formatLocalDate(dates[1]));
      },
    });
    return () => picker.destroy();
  }, []);

  return <div className="relative w-full">
    <input ref={inputRef} aria-label="Rango de fechas de cancelación" placeholder="Selecciona el rango de fechas" className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
    <CalendarAltIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
  </div>;
}

function todayInBogota() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function count(value: number | null | undefined) {
  return value == null ? "—" : countFormat.format(value);
}

function usd(value: number | null | undefined) {
  return value == null ? "—" : usdFormat.format(value);
}

function percent(value: number | null | undefined) {
  return value == null ? "—" : `${percentFormat.format(value)} %`;
}

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
  </div>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{text}</p>;
}

export default function CancellationStatistics() {
  const today = todayInBogota();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState<StatisticsQuery>({ from: yearStart, to: today, store: "", focus: "", reason: "", agent: "", age: "" });
  const [storeFilter, setStoreFilter] = useState("");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [reasonFilter, setReasonFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [data, setData] = useState<CancellationStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    cancellationStatisticsService.get(applied, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("No se pudieron cargar las estadísticas. Revisa el rango e intenta nuevamente.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied]);

  const storeOptions = data?.available_filters.stores ?? [];
  const reasonOptions = data?.available_filters.reasons ?? [];
  const agentOptions = data?.available_filters.agents ?? [];
  const ageOptions = data?.available_filters.ages ?? [];
  const stores = data?.stores ?? [];
  const filteredReasons = data?.reasons ?? [];
  const filteredBrands = data?.brands ?? [];
  const filteredAgents = data?.agents ?? [];
  const brandTimes = data?.time_to_cancel.by_brand ?? [];
  const storeChartRows = [...stores].sort((a, b) => b.cancellations_quantity - a.cancellations_quantity || a.store_name.localeCompare(b.store_name));
  const reasonChartRows = [...filteredReasons].sort((a, b) => b.cancellations_quantity - a.cancellations_quantity || a.store_name.localeCompare(b.store_name) || a.reason.localeCompare(b.reason));
  const brandChartRows = [...filteredBrands].sort((a, b) => b.cancelled_units - a.cancelled_units || a.store_name.localeCompare(b.store_name) || (a.brand ?? "").localeCompare(b.brand ?? ""));
  const agentChartRows = [...filteredAgents].sort((a, b) => b.cancellations - a.cancellations || a.agent.localeCompare(b.agent));
  const brandTimeChartRows = [...brandTimes].sort((a, b) => b.cancellations - a.cancellations || a.brand.localeCompare(b.brand) || a.bucket.localeCompare(b.bucket));

  const totals = data?.totals;
  const alertThresholds = data?.alert_thresholds;
  const lateCancellationPercent = data?.alerts.total_cancellations
    ? data.alerts.cancellations_over_30_days / data.alerts.total_cancellations * 100
    : null;
  const storeTableTotals = stores.reduce((sum, row) => ({
    sales_quantity: sum.sales_quantity + row.sales_quantity,
    sales_usd: sum.sales_usd + row.sales_usd,
    cancellations_quantity: sum.cancellations_quantity + row.cancellations_quantity,
    cancellations_usd: sum.cancellations_usd + row.cancellations_usd,
  }), { sales_quantity: 0, sales_usd: 0, cancellations_quantity: 0, cancellations_usd: 0 });
  const reasonTableTotals = filteredReasons.reduce((sum, row) => ({
    cancellations_quantity: sum.cancellations_quantity + row.cancellations_quantity,
    cancellations_usd: sum.cancellations_usd + row.cancellations_usd,
  }), { cancellations_quantity: 0, cancellations_usd: 0 });
  const brandTableTotals = filteredBrands.reduce((sum, row) => ({
    cancelled_units: sum.cancelled_units + row.cancelled_units,
    cancellations_usd: sum.cancellations_usd + row.cancellations_usd,
  }), { cancelled_units: 0, cancellations_usd: 0 });
  const agentTableTotals = filteredAgents.reduce((sum, row) => ({
    cancellations: sum.cancellations + row.cancellations,
    share_percent: sum.share_percent + row.share_percent,
  }), { cancellations: 0, share_percent: 0 });
  const brandTimeTableTotals = brandTimes.reduce((sum, row) => ({
    cancellations: sum.cancellations + row.cancellations,
    weightedDays: sum.weightedDays + (row.average_days == null ? 0 : row.average_days * row.cancellations),
    daysWeight: sum.daysWeight + (row.average_days == null ? 0 : row.cancellations),
  }), { cancellations: 0, weightedDays: 0, daysWeight: 0 });
  const bucketRows = [...(data?.time_to_cancel.by_bucket ?? [])].sort(
    (a, b) => b.cancellations - a.cancellations || a.bucket.localeCompare(b.bucket),
  );
  const bucketTotal = bucketRows.reduce((total, row) => total + row.cancellations, 0);
  const bucketColors = ["#465FFF", "#8B5CF6", "#12B76A", "#F79009"];
  const bucketOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: bucketRows.map((_, index) => bucketColors[index % bucketColors.length]),
    plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 5, barHeight: "82%", dataLabels: { position: "center" } } },
    dataLabels: {
      enabled: true,
      formatter: (value) => {
        const amount = Number(value);
        const share = bucketTotal ? (amount / bucketTotal) * 100 : 0;
        return amount ? `${count(amount)} · ${percentFormat.format(share)} %` : "";
      },
      style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 },
    },
    xaxis: { categories: bucketRows.map((row) => row.bucket), min: 0, labels: { formatter: (value) => count(Number(value)) } },
    yaxis: { labels: { maxWidth: 180 } },
    legend: { show: false },
    tooltip: { y: { formatter: (value) => {
      const share = bucketTotal ? (value / bucketTotal) * 100 : 0;
      return `${count(value)} cancelaciones · ${percentFormat.format(share)} % del total válido`;
    } } },
    noData: { text: "Sin datos para este rango" },
  };
  const bucketSeries = [{ name: "Cancelaciones", data: bucketRows.map((row) => row.cancellations) }];

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setValidation("Selecciona un rango de fechas válido.");
      return;
    }
    setValidation("");
    setApplied({ from, to, store: storeFilter, focus: focusFilter === "all" ? "" : focusFilter, reason: reasonFilter, agent: agentFilter, age: ageFilter });
  }

  return <>
    <PageMeta title="Orden vs cancelación | Pronto Connect" description="Estadísticas de ventas, cancelaciones, razones, marcas y tiempos" />
    <div className="hidden sm:block"><PageBreadcrumb pageTitle="Orden vs cancelación" /></div>
    <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white sm:hidden">Orden vs cancelación</h1>
    <div className="space-y-6">
      <CollapsibleFilters description="El servidor aplica estos filtros al consultar y preparar cada sección. Las fechas filtran por día de cancelación e incluyen ambos extremos; vendedor y antigüedad se consolidan entre tiendas.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-gray-700 dark:text-gray-300">Rango de cancelación<div className="mt-1"><DateRangeInput from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} /></div></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Tienda<select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todas las tiendas</option>{storeOptions.map((store) => <option key={store} value={store}>{store}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Enfoque<select value={focusFilter} onChange={(event) => setFocusFilter(event.target.value as FocusFilter)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="all">Todas las tiendas</option><option value="high-rate">{alertThresholds ? `Tasa de cancelación ≥ ${alertThresholds.high_rate_percent} %` : "Tasa alta"}</option><option value="high-impact">{alertThresholds ? `Impacto cancelado ≥ ${usd(alertThresholds.high_impact_usd)}` : "Impacto alto"}</option></select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Motivo<select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los motivos</option>{reasonOptions.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Vendedor<select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los vendedores</option>{agentOptions.map((agent) => <option key={agent} value={agent}>{agent}</option>)}</select></label>
          <label className="text-sm text-gray-700 dark:text-gray-300">Antigüedad<select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Todos los rangos</option>{ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}</select></label>
          <button type="submit" disabled={loading} className="h-10 self-end rounded-lg bg-brand-500 px-5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Cargando…" : "Aplicar filtros"}</button>
          {validation && <p role="alert" className="text-sm text-red-600 sm:col-span-2 xl:col-span-3">{validation}</p>}
        </form>
      </CollapsibleFilters>
      {loading && <p role="status" className="text-sm text-gray-500">Cargando estadísticas de cancelaciones…</p>}
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{error}</p>}
      {!loading && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Kpi label="Ventas" value={count(totals?.sales_quantity)} />
          <Kpi label="Ventas USD" value={usd(totals?.sales_usd)} />
          <Kpi label="Cancelaciones" value={count(totals?.cancellations_quantity)} />
          <Kpi label="Cancelaciones USD" value={usd(totals?.cancellations_usd)} />
          <Kpi label="Tasa de cancelación por cantidad" value={percent(totals?.cancellation_rate_quantity)} detail="Cancelaciones ÷ ventas" />
          <Kpi label="Tasa de cancelación por USD" value={percent(totals?.cancellation_rate_usd)} detail="USD cancelado ÷ USD vendido" />
        </div>
        <ComponentCard title="Alertas para revisar" desc="Conteos generales del período, independientes de los filtros de tienda, motivo, vendedor y antigüedad; las alertas no implican causalidad.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10"><p className="flex items-center text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">Tasa alta <InfoTooltip label="Tasa alta" content={`Cuenta tiendas cuya tasa de cancelación por cantidad es igual o superior a ${data.alert_thresholds.high_rate_percent} %. Se calcula como cancelaciones ÷ ventas × 100 en el período, sin los filtros de tienda, motivo, vendedor o antigüedad.`} /></p><p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{count(data.alerts.high_rate_stores)} tiendas</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Tasa por cantidad ≥ {data.alert_thresholds.high_rate_percent} %</p></div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10"><p className="flex items-center text-xs font-medium uppercase tracking-wide text-red-800 dark:text-red-300">Impacto alto <InfoTooltip label="Impacto alto" content={`Cuenta tiendas con un importe de cancelaciones igual o superior a ${usd(data.alert_thresholds.high_impact_usd)} en el período. El conteo es general y no depende de los filtros de tienda, motivo, vendedor o antigüedad.`} /></p><p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{count(data.alerts.high_impact_stores)} tiendas</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">USD cancelado ≥ {usd(data.alert_thresholds.high_impact_usd)}</p></div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/10"><p className="flex items-center text-xs font-medium uppercase tracking-wide text-orange-800 dark:text-orange-300">Cancelación tardía <InfoTooltip label="Cancelación tardía" content={`${count(data.alerts.cancellations_over_30_days)} cancelaciones con ${data.alert_thresholds.late_cancellation_days} días o más desde la orden. El porcentaje divide ese conteo entre ${count(data.alerts.total_cancellations)} cancelaciones del período, sin filtros adicionales.`} /></p><p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{percent(lateCancellationPercent)}</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{count(data.alerts.cancellations_over_30_days)} de {count(data.alerts.total_cancellations)} cancelaciones · {data.alert_thresholds.late_cancellation_days}+ días</p></div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/5"><p className="flex items-center text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Revisar fechas <InfoTooltip label="Revisar fechas" content="Cuenta cancelaciones del período cuya fecha de orden es posterior a la fecha de cancelación. Estas fechas inconsistentes se excluyen de los promedios y rangos de tiempo." /></p><p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{count(data.alerts.inconsistent_dates)}</p><p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Orden posterior a cancelación</p></div>
          </div>
        </ComponentCard>
        <ComponentCard title="Días desde la orden hasta la cancelación" desc="El gráfico muestra cancelaciones por rango de días. El tooltip indica el conteo y su proporción entre fechas válidas; el promedio excluye fechas faltantes e inconsistentes.">
          {bucketRows.length ? <div className="min-w-0 overflow-x-auto"><Chart options={bucketOptions} series={bucketSeries} type="bar" height={300} /></div> : <Empty text="No hay cancelaciones con fechas válidas en este rango de antigüedad." />}
        </ComponentCard>
        <ComponentCard title="Ventas y cancelaciones por tienda" desc={`El gráfico compara cantidades de ventas y cancelaciones; su tooltip muestra también los importes en USD. Las tasas comparan los totales agregados del rango. El enfoque prioriza tiendas con tasa ≥ ${data.alert_thresholds.high_rate_percent} % o impacto cancelado ≥ ${usd(data.alert_thresholds.high_impact_usd)} USD.`}>
          {stores.length ? <ChartTableContent label="ventas y cancelaciones por tienda"
            chart={<HorizontalBarChart categories={storeChartRows.map((row) => row.store_name)} series={[{ name: "Ventas", data: storeChartRows.map((row) => row.sales_quantity) }, { name: "Cancelaciones", data: storeChartRows.map((row) => row.cancellations_quantity) }]} tooltipText={(seriesIndex, index) => { const row = storeChartRows[index]; return seriesIndex === 0 ? `${count(row.sales_quantity)} ventas · ${usd(row.sales_usd)}` : `${count(row.cancellations_quantity)} cancelaciones · ${usd(row.cancellations_usd)}`; }} height={Math.max(300, storeChartRows.length * 44)} />}
            table={<div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Tienda</th><th className="p-3 text-right">Ventas</th><th className="p-3 text-right">Ventas USD</th><th className="p-3 text-right">Cancelaciones</th><th className="p-3 text-right">Cancelaciones USD</th><th className="p-3 text-right">Tasa cantidad</th><th className="p-3 text-right">Tasa USD</th></tr></thead><tbody>{stores.map((row) => <tr key={`${row.store_name}:${row.store_prefix ?? ""}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{row.store_name}</td><td className="p-3 text-right">{count(row.sales_quantity)}</td><td className="p-3 text-right">{usd(row.sales_usd)}</td><td className="p-3 text-right">{count(row.cancellations_quantity)}</td><td className="p-3 text-right">{usd(row.cancellations_usd)}</td><td className="p-3 text-right">{percent(row.cancellation_rate_quantity)}</td><td className="p-3 text-right">{percent(row.cancellation_rate_usd)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total</td><td className="p-3 text-right">{count(storeTableTotals.sales_quantity)}</td><td className="p-3 text-right">{usd(storeTableTotals.sales_usd)}</td><td className="p-3 text-right">{count(storeTableTotals.cancellations_quantity)}</td><td className="p-3 text-right">{usd(storeTableTotals.cancellations_usd)}</td><td className="p-3 text-right">{percent(storeTableTotals.sales_quantity ? storeTableTotals.cancellations_quantity / storeTableTotals.sales_quantity * 100 : null)}</td><td className="p-3 text-right">{percent(storeTableTotals.sales_usd ? storeTableTotals.cancellations_usd / storeTableTotals.sales_usd * 100 : null)}</td></tr></tfoot></table></div>}
          /> : <Empty text="No hay ventas o cancelaciones para este período." />}
        </ComponentCard>
        <ComponentCard title="Razones de cancelación" desc="Cantidad e importe cancelado por tienda y razón; respeta la tienda y el enfoque seleccionados arriba.">
          {filteredReasons.length ? <ChartTableContent label="razones de cancelación"
            chart={<HorizontalBarChart categories={reasonChartRows.map((row) => `${row.store_name} · ${row.reason}`)} series={[{ name: "Cancelaciones", data: reasonChartRows.map((row) => row.cancellations_quantity) }]} tooltipText={(_, index) => `${count(reasonChartRows[index].cancellations_quantity)} cancelaciones · ${usd(reasonChartRows[index].cancellations_usd)}`} height={Math.max(300, reasonChartRows.length * 44)} />}
            table={<div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Tienda</th><th className="p-3">Razón</th><th className="p-3 text-right">Cancelaciones</th><th className="p-3 text-right">USD</th></tr></thead><tbody>{filteredReasons.map((row, index) => <tr key={`${row.store_name}:${row.reason}:${index}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3">{row.store_name}</td><td className="p-3">{row.reason}</td><td className="p-3 text-right">{count(row.cancellations_quantity)}</td><td className="p-3 text-right">{usd(row.cancellations_usd)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3" colSpan={2}>Total</td><td className="p-3 text-right">{count(reasonTableTotals.cancellations_quantity)}</td><td className="p-3 text-right">{usd(reasonTableTotals.cancellations_usd)}</td></tr></tfoot></table></div>}
          /> : <Empty text="No hay razones para esta tienda y período." />}
        </ComponentCard>
        <ComponentCard title="Cancelaciones por marca" desc="Marca (mfr), unidades canceladas e importe reportado en la vista de detalle; respeta la tienda y el enfoque seleccionados arriba.">
          {filteredBrands.length ? <ChartTableContent label="cancelaciones por marca"
            chart={<HorizontalBarChart categories={brandChartRows.map((row) => `${row.store_name} · ${row.brand || "Sin marca"}`)} series={[{ name: "Unidades", data: brandChartRows.map((row) => row.cancelled_units) }]} tooltipText={(_, index) => `${count(brandChartRows[index].cancelled_units)} unidades · ${usd(brandChartRows[index].cancellations_usd)}`} height={Math.max(300, brandChartRows.length * 44)} />}
            table={<div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Tienda</th><th className="p-3">Marca</th><th className="p-3 text-right">Unidades</th><th className="p-3 text-right">USD</th></tr></thead><tbody>{filteredBrands.map((row, index) => <tr key={`${row.store_name}:${row.brand}:${index}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3">{row.store_name}</td><td className="p-3">{row.brand || "Sin marca"}</td><td className="p-3 text-right">{count(row.cancelled_units)}</td><td className="p-3 text-right">{usd(row.cancellations_usd)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3" colSpan={2}>Total</td><td className="p-3 text-right">{count(brandTableTotals.cancelled_units)}</td><td className="p-3 text-right">{usd(brandTableTotals.cancellations_usd)}</td></tr></tfoot></table></div>}
          /> : <Empty text="No hay marcas para esta tienda y período." />}
        </ComponentCard>
        <ComponentCard title="Participación por vendedor" desc="Porcentaje sobre todas las cancelaciones del período.">
          {filteredAgents.length ? <ChartTableContent label="participación por vendedor"
            chart={<HorizontalBarChart categories={agentChartRows.map((row) => row.agent)} series={[{ name: "Cancelaciones", data: agentChartRows.map((row) => row.cancellations) }]} tooltipText={(_, index) => `${count(agentChartRows[index].cancellations)} cancelaciones · ${percent(agentChartRows[index].share_percent)} del total`} height={Math.max(300, agentChartRows.length * 44)} />}
            table={<div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Vendedor</th><th className="p-3 text-right">Cancelaciones</th><th className="p-3 text-right">Participación</th></tr></thead><tbody>{filteredAgents.map((row) => <tr key={row.agent} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3 font-medium">{row.agent}</td><td className="p-3 text-right">{count(row.cancellations)}</td><td className="p-3 text-right">{percent(row.share_percent)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total</td><td className="p-3 text-right">{count(agentTableTotals.cancellations)}</td><td className="p-3 text-right">{percent(agentTableTotals.share_percent)}</td></tr></tfoot></table></div>}
          /> : <Empty text="No hay vendedores para este período." />}
        </ComponentCard>
        <ComponentCard title="Antigüedad por marca" desc="Consolidado entre tiendas; usa el mismo filtro de antigüedad del gráfico. Una orden con varias marcas aparece en cada marca asociada.">
          {brandTimes.length ? <ChartTableContent label="antigüedad por marca"
            chart={<HorizontalBarChart categories={brandTimeChartRows.map((row) => `${row.brand} · ${row.bucket}`)} series={[{ name: "Cancelaciones", data: brandTimeChartRows.map((row) => row.cancellations) }]} tooltipText={(_, index) => `${count(brandTimeChartRows[index].cancellations)} cancelaciones · promedio ${brandTimeChartRows[index].average_days == null ? "sin datos" : `${percentFormat.format(brandTimeChartRows[index].average_days)} días`}`} height={Math.max(300, brandTimeChartRows.length * 44)} />}
            table={<div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 border-b border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900"><tr><th className="p-3">Marca</th><th className="p-3">Rango</th><th className="p-3 text-right">Cancelaciones</th><th className="p-3 text-right">Promedio de días</th></tr></thead><tbody>{brandTimes.map((row, index) => <tr key={`${row.brand}:${row.bucket}:${index}`} className="border-b border-gray-100 dark:border-gray-800"><td className="p-3">{row.brand}</td><td className="p-3">{row.bucket}</td><td className="p-3 text-right">{count(row.cancellations)}</td><td className="p-3 text-right">{row.average_days == null ? "—" : percentFormat.format(row.average_days)}</td></tr>)}</tbody><tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3" colSpan={2}>Total</td><td className="p-3 text-right">{count(brandTimeTableTotals.cancellations)}</td><td className="p-3 text-right">{brandTimeTableTotals.daysWeight ? percentFormat.format(brandTimeTableTotals.weightedDays / brandTimeTableTotals.daysWeight) : "—"}</td></tr></tfoot></table></div>}
          /> : <Empty text="No hay datos de antigüedad por marca para este período." />}
        </ComponentCard>
      </>}
    </div>
  </>;
}
