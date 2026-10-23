import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import CollapsibleFilters from "../../components/common/CollapsibleFilters";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { StaffingAnalysis, VolumeWeekdayHour } from "../../lib/customer-attention/types";

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const weekdayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const halfHours = Array.from({ length: 48 }, (_, slot) => `${String(Math.floor(slot / 2)).padStart(2, "0")}:${slot % 2 ? "30" : "00"}`);
function heatColor(value: number | null, maximum: number, hue: "blue" | "amber") {
  if (value == null) return "#f3f4f6";
  if (value === 0) return "#f9fafb";
  const alpha = 0.15 + 0.65 * Math.min(value / Math.max(maximum, 1), 1);
  return hue === "amber" ? `rgba(245,158,11,${alpha})` : `rgba(70,95,255,${alpha})`;
}
function floridaToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function initialHistory() {
  const today = floridaToday();
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay() || 7;
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() - weekday);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 55);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}
const defaultHistory = initialHistory();
const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function CustomerAttentionStaffing() {
  const [planningDate, setPlanningDate] = useState(floridaToday());
  const [historyFrom, setHistoryFrom] = useState(defaultHistory.from);
  const [historyTo, setHistoryTo] = useState(defaultHistory.to);
  const [applied, setApplied] = useState({ planningDate: floridaToday(), historyFrom: defaultHistory.from, historyTo: defaultHistory.to });
  const [result, setResult] = useState<StaffingAnalysis | null>(null);
  const [volume, setVolume] = useState<VolumeWeekdayHour[]>([]);
  const [volumeChannel, setVolumeChannel] = useState<"all" | "call" | "chat">("all");
  const [weeklyTeam, setWeeklyTeam] = useState<"calls" | "chat_ticket">("calls");
  const [weeklyMetric, setWeeklyMetric] = useState<"suggested" | "scheduled" | "gap">("gap");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    customerAttentionService.volume({ from: applied.historyFrom, to: applied.historyTo, staffing: true, planning_date: applied.planningDate, history_from: applied.historyFrom, history_to: applied.historyTo }, ["call", "chat"], controller.signal)
      .then((response) => { if (!controller.signal.aborted) { setResult(response.staffing ?? null); setVolume(response.current_by_weekday_hour ?? []); } })
      .catch(() => { if (!controller.signal.aborted) { setResult(null); setVolume([]); setError("No se pudo cargar la dotación. Revisa los filtros y vuelve a intentar."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied]);

  const volumeValues = useMemo(() => weekdayNames.map((_, day) => hours.map((_, hour) => {
    const point = volume.find((item) => item.weekday === day + 1 && item.hour === hour);
    return volumeChannel === "all" ? point?.total ?? 0 : point?.by_channel[volumeChannel] ?? 0;
  })), [volume, volumeChannel]);
  const maximumVolume = Math.max(1, ...volumeValues.flat());
  const weeklyValues = useMemo(() => result?.weekly?.map((day) => day.slots.map((slot) => slot[weeklyTeam][weeklyMetric] ?? null)) ?? [], [result, weeklyTeam, weeklyMetric]);
  const maximumWeekly = Math.max(1, ...weeklyValues.flat().filter((value): value is number => value != null));

  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: { type: "line", toolbar: { show: false }, fontFamily: "Outfit, sans-serif", animations: { enabled: false } },
    colors: ["#465FFF", "#98A2B3", "#12B76A", "#98A2B3"],
    stroke: { curve: "smooth", width: 3 },
    dataLabels: { enabled: false },
    xaxis: { categories: result?.slots.map((slot) => slot.time) ?? [], tickAmount: 12, labels: { rotate: -45 } },
    yaxis: { min: 0, forceNiceScale: true, title: { text: "Número de agentes" } },
    legend: { position: "bottom" },
    tooltip: { shared: true, intersect: false, y: { formatter: (value) => value == null ? "Sin horario" : `${numberFormat.format(value)} agentes` } },
    markers: { size: 0, hover: { size: 5 } },
  }), [result]);
  const chartSeries = useMemo(() => result ? [
    { name: "Llamadas sugeridas", data: result.slots.map((slot) => slot.calls.suggested) },
    { name: "Llamadas programadas", data: result.slots.map((slot) => slot.calls.scheduled) },
    { name: "Chats sugeridos", data: result.slots.map((slot) => slot.chat_ticket.suggested) },
    { name: "Chats programados (equipo compartido)", data: result.slots.map((slot) => slot.chat_ticket.scheduled) },
  ] : [], [result]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!planningDate || !historyFrom || !historyTo || historyFrom > historyTo || historyTo >= floridaToday()) {
      setValidation("Elige una fecha de planificación y un histórico válido anterior a hoy.");
      return;
    }
    setValidation("");
    setApplied({ planningDate, historyFrom, historyTo });
  }

  return <>
    <PageMeta title="Dotación sugerida | Pronto Connect" description="Demanda y cobertura del equipo por franja" />
    <div className="hidden sm:block"><PageBreadcrumb pageTitle="Dotación sugerida" /></div>
    <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white sm:hidden">Dotación sugerida</h1>
    <div className="space-y-6">
      <CollapsibleFilters title="Filtros de planificación" description="La demanda se compara por día de semana y franja de 30 minutos, en hora de Florida.">
        <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">Fecha a planificar<input type="date" className={inputClass} value={planningDate} onChange={(event) => setPlanningDate(event.target.value)} /></label>
          <label className="text-sm">Histórico desde<input type="date" className={inputClass} value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} /></label>
          <label className="text-sm">Histórico hasta<input type="date" className={inputClass} value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} /></label>
          <div className="flex items-end"><button className="h-10 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white" disabled={loading}>Aplicar</button></div>
          {validation && <p role="alert" className="text-sm text-red-600 sm:col-span-2 xl:col-span-4">{validation}</p>}
        </form>
      </CollapsibleFilters>
      {loading && <p role="status" className="text-sm text-gray-500">Calculando demanda y cobertura…</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && result && <>
        <ComponentCard title="Volumen por día y hora" desc="Contactos registrados en todo el histórico seleccionado, agrupados por hora de Florida. Cada celda suma esos días; aquí los chats incluyen bots, mientras la dotación sugerida usa solo chats atendidos por personas.">
          <label className="block max-w-xs text-sm">Canal<select className={inputClass} value={volumeChannel} onChange={(event) => setVolumeChannel(event.target.value as typeof volumeChannel)}><option value="all">Todos: llamadas y chats</option><option value="call">Llamadas</option><option value="chat">Chats</option></select></label>
          {maximumVolume === 1 && volumeValues.flat().every((value) => value === 0) && <p className="mt-3 text-sm text-gray-500">No hay contactos de este canal en el histórico elegido.</p>}
          <div className="overflow-x-auto"><table className="mt-4 min-w-[1050px] border-separate border-spacing-1 text-center text-xs">
            <thead><tr><th className="sticky left-0 bg-white p-1 text-left dark:bg-gray-900">Día</th>{hours.map((hour) => <th key={hour} className="min-w-9 p-1">{hour}</th>)}</tr></thead>
            <tbody>{volumeValues.map((row, day) => <tr key={day}><th className="sticky left-0 bg-white p-1 text-left dark:bg-gray-900">{weekdayNames[day]}</th>{row.map((value, hour) => <td key={hour} className="rounded p-1" style={{ backgroundColor: heatColor(value, maximumVolume, "blue") }} title={`${weekdayNames[day]} ${hours[hour]}: ${value} contactos`}>{value}</td>)}</tr>)}</tbody>
          </table></div>
        </ComponentCard>
        <ComponentCard title="Cobertura y faltantes de la semana" desc="Semana que contiene la fecha de planificación. Cada columna representa 30 minutos; los descansos reducen la cobertura programada.">
          <div className="flex flex-wrap gap-4">
            <label className="text-sm">Equipo<select className={inputClass} value={weeklyTeam} onChange={(event) => setWeeklyTeam(event.target.value as typeof weeklyTeam)}><option value="calls">Llamadas</option><option value="chat_ticket">Chats (equipo compartido)</option></select></label>
            <label className="text-sm">Mostrar<select className={inputClass} value={weeklyMetric} onChange={(event) => setWeeklyMetric(event.target.value as typeof weeklyMetric)}><option value="gap">Agentes faltantes</option><option value="scheduled">Agentes programados</option><option value="suggested">Agentes sugeridos</option></select></label>
          </div>
          {result.capacities[weeklyTeam === "calls" ? "call" : "chat"] == null && weeklyMetric !== "scheduled" && <p className="mt-3 text-sm text-amber-700">Falta configurar una o más capacidades por agente y hora para calcular sugerencias y faltantes.</p>}
          {!result.weekly?.length ? <p className="mt-4 text-sm text-amber-700">Actualiza el API para consultar el cruce de toda la semana.</p> : <div className="overflow-x-auto"><table className="mt-4 min-w-[1900px] border-separate border-spacing-1 text-center text-xs">
            <thead><tr><th className="sticky left-0 bg-white p-1 text-left dark:bg-gray-900">Día</th>{halfHours.map((hour) => <th key={hour} className="min-w-9 p-1">{hour}</th>)}</tr></thead>
            <tbody>{result.weekly.map((day, index) => <tr key={day.date}><th className="sticky left-0 bg-white p-1 text-left dark:bg-gray-900">{weekdayNames[index]}<span className="block font-normal">{day.date}</span></th>{weeklyValues[index].map((value, slot) => <td key={slot} className="rounded p-1" style={{ backgroundColor: heatColor(value, maximumWeekly, weeklyMetric === "gap" ? "amber" : "blue") }} title={`${weekdayNames[index]} ${day.date} ${halfHours[slot]}: ${value ?? "Sin datos"}`}>{value ?? "—"}</td>)}</tr>)}</tbody>
          </table></div>}
          <p className="mt-2 text-xs text-gray-500">— indica que faltan capacidad configurada, días históricos suficientes o un horario publicado para ese equipo.</p>
        </ComponentCard>
        <ComponentCard title="Agentes sugeridos y programados" desc={`Plan: ${result.planning_date} · Histórico: ${result.history_from} a ${result.history_to} · ${result.slots[0]?.sample_days ?? 0} días comparables · ${result.timezone}`}>
          {(result.slots[0]?.sample_days ?? 0) < 4 && <p className="mb-4 text-sm text-amber-700">Se necesitan al menos cuatro días con contactos para calcular la recomendación.</p>}
          {(result.capacities.call == null || result.capacities.chat == null) && <p className="mb-4 text-sm text-amber-700">Falta configurar capacidad por agente y hora en Admin → Equipo y horarios.</p>}
          <div className="min-w-0"><Chart options={chartOptions} series={chartSeries} type="line" height={380} /></div>
        </ComponentCard>
        <ComponentCard title="Detalle por franja" desc="La recomendación se redondea a agentes completos. La cobertura descuenta los descansos publicados.">
          <div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[850px] text-left text-sm">
            <thead className="sticky top-0 bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300"><tr><th className="p-2">Hora</th><th className="p-2">Llamadas P75</th><th className="p-2">Sugeridos</th><th className="p-2">Programados</th><th className="p-2">Faltan</th><th className="p-2">Chats humanos P75</th><th className="p-2">Chats sugeridos</th><th className="p-2">Chats programados</th><th className="p-2">Faltan</th></tr></thead>
            <tbody>{result.slots.map((slot) => <tr key={slot.time} className="border-t border-gray-100 dark:border-gray-800"><td className="p-2 font-medium">{slot.time}</td><td className="p-2">{slot.demand_p75.call?.toFixed(1) ?? "—"}</td><td className="p-2">{slot.calls.suggested ?? "—"}</td><td className="p-2">{slot.calls.scheduled ?? "Sin horario"}</td><td className="p-2">{slot.calls.gap ?? "—"}</td><td className="p-2">{slot.demand_p75.chat?.toFixed(1) ?? "—"}</td><td className="p-2">{slot.chat_ticket.suggested ?? "—"}</td><td className="p-2">{slot.chat_ticket.scheduled ?? "Sin horario"}</td><td className="p-2">{slot.chat_ticket.gap ?? "—"}</td></tr>)}</tbody>
          </table></div>
        </ComponentCard>
      </>}
    </div>
  </>;
}
