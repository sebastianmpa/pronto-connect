  import { useEffect, useMemo, useRef, useState } from "react";
  import flatpickr from "flatpickr";
  import type { ApexOptions } from "apexcharts";
  import Chart from "react-apexcharts";
  import PageMeta from "../../components/common/PageMeta";
  import PageBreadcrumb from "../../components/common/PageBreadCrumb";
  import ComponentCard from "../../components/common/ComponentCard";
  import { CalendarAltIcon } from "../../icons";
  import { customerAttentionService } from "../../lib/customer-attention/service";
  import type {
    AgentCandidatesResponse,
    AgentMapping,
    AnalyticsQuery,
    Channel,
    DurationStats,
    MetricsResponse,
    OccupancyResponse,
    OutcomesResponse,
    VolumeResponse,
    VolumeWeekdayHour,
  } from "../../lib/customer-attention/types";

  const CHANNELS: { id: Channel; label: string }[] = [
    { id: "call", label: "Llamadas" },
    { id: "chat", label: "Chats" },
    { id: "ticket", label: "Tickets" },
    { id: "email", label: "Emails" },
  ];
  const CHANNEL_COLORS: Record<Channel, string> = {
    call: "#465FFF",
    chat: "#12B76A",
    ticket: "#F79009",
    email: "#8B5CF6",
  };
  const numberFormat = new Intl.NumberFormat("es-CO");
  const percentFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
  const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  type Section = "metrics" | "volume" | "outcomes" | "occupancy";
  type DashboardData = {
    metrics?: MetricsResponse;
    volume?: VolumeResponse;
    outcomes?: OutcomesResponse;
    occupancy?: OccupancyResponse;
  };
  type Form = {
    from: string;
    to: string;
    compare: boolean;
    compareFrom: string;
    compareTo: string;
    channels: Channel[];
    agent: string;
  };
  type AgentGroup = "goto" | "goto_name" | "salesiq" | "zoho";
  type AgentOption = { value: string; name: string; group: AgentGroup; occupancyId?: string };

  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day, 12);
  }

  function DateFilterInput({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const onChangeRef = useRef(onChange);
    const initialValueRef = useRef(value);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      if (!inputRef.current) return;
      const picker = flatpickr(inputRef.current, {
        defaultDate: parseLocalDate(initialValueRef.current),
        dateFormat: "m/d/Y",
        disableMobile: true,
        onChange: ([date]) => {
          if (date) onChangeRef.current(formatLocalDate(date));
        },
      });
      return () => picker.destroy();
    }, []);

    return (
    <div className="relative w-full">
        <input
          ref={inputRef}
          aria-label={label}
          className="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 pr-9 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <CalendarAltIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  function nyToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  }

  const today = nyToday();
  const initialForm: Form = {
    from: `${today.slice(0, 7)}-01`,
    to: today,
    compare: false,
    compareFrom: "",
    compareTo: "",
    channels: CHANNELS.map((channel) => channel.id),
    agent: "all",
  };

  function duration(seconds: number | null | undefined) {
    if (seconds == null || !Number.isFinite(seconds)) return "—";
    if (seconds < 60) return `${Math.round(seconds)} s`;
    if (seconds < 3600) return `${percentFormat.format(seconds / 60)} min`;
    return `${percentFormat.format(seconds / 3600)} h`;
  }

  function percentage(value: number | null | undefined) {
    return value == null ? "—" : `${percentFormat.format(value)} %`;
  }

  function complementaryPercentage(value: number | null | undefined) {
    return value == null ? "—" : `${percentFormat.format(100 - Math.round(value * 10) / 10)} %`;
  }

  function comparisonText(current: number, previous: number | undefined) {
    if (previous === undefined) return null;
    if (previous === 0) return "Comparativo: 0";
    const delta = ((current - previous) / previous) * 100;
    return `${delta > 0 ? "+" : ""}${percentFormat.format(delta)} % vs. comparativo`;
  }

  function volumeHeatmapSeries(points: VolumeWeekdayHour[]) {
    return WEEKDAY_NAMES.map((name, weekdayIndex) => ({
      name,
      data: Array.from({ length: 24 }, (_, hour) => ({
        x: `${String(hour).padStart(2, "0")}:00`,
        y: points.find((point) => point.weekday === weekdayIndex + 1 && point.hour === hour)?.total ?? 0,
      })),
    }));
  }

  function volumeHeatmapOptions(points: VolumeWeekdayHour[], selectedChannels: Channel[]): ApexOptions {
    return {
      chart: {
        type: "heatmap",
        toolbar: { show: false },
        fontFamily: "Outfit, sans-serif",
        animations: { enabled: false },
      },
      dataLabels: { enabled: false },
      plotOptions: { heatmap: { shadeIntensity: 0.55, radius: 3, useFillColorAsStroke: false } },
      xaxis: { type: "category", labels: { rotate: -45 } },
      yaxis: { labels: { maxWidth: 88 } },
      legend: { show: false },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex }) => {
          const weekday = seriesIndex + 1;
          const hour = dataPointIndex;
          const point = points.find((item) => item.weekday === weekday && item.hour === hour);
          const channelLines = CHANNELS
            .filter((channel) => selectedChannels.includes(channel.id))
            .map((channel) => `<div>${channel.label}: ${numberFormat.format(point?.by_channel[channel.id] ?? 0)}</div>`)
            .join("");
          return `<div style="pointer-events:none;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#374151;font-size:12px;box-shadow:0 8px 16px rgba(0,0,0,.12)"><strong>${WEEKDAY_NAMES[seriesIndex]} · ${String(hour).padStart(2, "0")}:00</strong><div style="margin-top:4px">Total: ${numberFormat.format(point?.total ?? 0)}</div>${channelLines}</div>`;
        },
      },
    };
  }

  function selectedAgentId(value: string) {
    return value === "all" ? undefined : value.slice(value.indexOf(":") + 1);
  }

  function normalizedGotoName(name: string) {
    return name.split(" (on ")[0].trim().toLowerCase();
  }

  function gotoAgentId(value: string, mappings: AgentMapping[], fallback: AgentOption[]) {
    if (value === "all") return undefined;
    const [source] = value.split(":", 1);
    const id = selectedAgentId(value);
    if (source === "goto") return id;
    if (source === "goto_name") return fallback.find((agent) => agent.value === value)?.occupancyId;
    const mapping = mappings.find(
      (entry) =>
        Boolean(Number(entry.active)) &&
        (source === "salesiq" ? entry.salesiq_agent_id === id : entry.zoho_desk_agent_id === id),
    );
    return mapping?.goto_agent_id;
  }

  function fallbackAgentOptions(metrics?: MetricsResponse, occupancy?: OccupancyResponse): AgentOption[] {
    const options: AgentOption[] = [];
    const occupancyByName = new Map((occupancy?.by_agent ?? []).map((agent) => [normalizedGotoName(agent.agent_name), agent.agent_id]));
    for (const agent of Object.values(metrics?.current.by_agent ?? {})) {
      if (!agent.agent_id || agent.agent_id === "unassigned") continue;
      const group: AgentGroup = agent.source === "goto_connect" ? "goto_name" : agent.source === "salesiq" ? "salesiq" : "zoho";
      if (!agent.agent_name?.trim()) continue;
      const name = agent.agent_name.trim();
      options.push({ value: `${group}:${agent.agent_id}`, name, group, occupancyId: group === "goto_name" ? occupancyByName.get(normalizedGotoName(name)) : undefined });
    }
    const callNames = new Set(options.filter((option) => option.group === "goto_name").map((option) => normalizedGotoName(option.name)));
    for (const agent of occupancy?.by_agent ?? []) {
      if (agent.agent_id && agent.agent_name?.trim() && !callNames.has(normalizedGotoName(agent.agent_name))) {
        options.push({ value: `goto:${agent.agent_id}`, name: agent.agent_name.trim(), group: "goto" });
      }
    }
    return options;
  }

  function agentOptions(candidates: AgentCandidatesResponse | null, fallback: AgentOption[]) {
    const options: AgentOption[] = [...fallback];
    if (candidates) {
      for (const [group, agents] of [
        ["goto", candidates.goto_agents],
        ["salesiq", candidates.salesiq_agents],
        ["zoho", candidates.zoho_desk_agents],
      ] as const) {
        for (const agent of agents) {
          if (agent.agent_id && agent.agent_name?.trim()) {
            options.push({ value: `${group}:${agent.agent_id}`, name: agent.agent_name.trim(), group });
          }
        }
      }
    }
    const unique = [...new Map(options.map((option) => [option.value, option])).values()];
    const gotoNames = new Set(unique.filter((option) => option.group === "goto").map((option) => normalizedGotoName(option.name)));
    const filtered = candidates
      ? unique.filter((option) => option.group !== "goto_name" || !gotoNames.has(normalizedGotoName(option.name)))
      : unique;
    return [
      { title: "GoTo", group: "goto" },
      { title: "GoTo (nombre en llamadas)", group: "goto_name" },
      { title: "SalesIQ", group: "salesiq" },
      { title: "Zoho Desk", group: "zoho" },
    ].map(({ title, group }) => ({ title, group, options: filtered.filter((option) => option.group === group) }))
      .filter(({ options: groupOptions }) => groupOptions.length > 0);
  }

  function Kpi({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        {detail && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>}
      </div>
    );
  }

  function Empty({ text }: { text: string }) {
    return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{text}</p>;
  }

  function MetricStat({ label, value }: { label: string; value: DurationStats | null }) {
    return (
      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
          {duration(value?.p50_seconds)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          p90 {duration(value?.p90_seconds)} · promedio {duration(value?.average_seconds)}
        </p>
      </div>
    );
  }

  export default function CustomerAttentionDashboard() {
    const [form, setForm] = useState<Form>(initialForm);
    const [applied, setApplied] = useState<Form>(initialForm);
    const [validation, setValidation] = useState("");
    const [data, setData] = useState<DashboardData>({});
    const [errors, setErrors] = useState<Partial<Record<Section, string>>>({});
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<AgentCandidatesResponse | null>(null);
    const [fallbackAgents, setFallbackAgents] = useState<AgentOption[]>([]);
    const [mappings, setMappings] = useState<AgentMapping[]>([]);
    const [agentError, setAgentError] = useState(false);
    const [outcomesView, setOutcomesView] = useState<"table" | "chart">("table");

    useEffect(() => {
      const controller = new AbortController();
      Promise.allSettled([
        customerAttentionService.agents(controller.signal),
        customerAttentionService.mappings(controller.signal),
      ]).then(([agents, mappingRows]) => {
        if (controller.signal.aborted) return;
        if (agents.status === "fulfilled") setCandidates(agents.value);
        else setAgentError(true);
        if (mappingRows.status === "fulfilled") setMappings(mappingRows.value);
      });
      return () => controller.abort();
    }, []);

    const occupancyAgent = gotoAgentId(applied.agent, mappings, fallbackAgents);
    const showOccupancy = applied.channels.some((channel) => channel === "call" || channel === "chat");
    const canLoadOccupancy = showOccupancy && (applied.agent === "all" || Boolean(occupancyAgent));

    useEffect(() => {
      const controller = new AbortController();
      const query: AnalyticsQuery = {
        from: applied.from,
        to: applied.to,
        ...(applied.compare ? { compare_from: applied.compareFrom, compare_to: applied.compareTo } : {}),
        ...(applied.agent !== "all" ? { agent_id: selectedAgentId(applied.agent) } : {}),
      };
      const requests: { section: Section; request: Promise<unknown> }[] = [
        { section: "volume", request: customerAttentionService.volume(query, applied.channels, controller.signal) },
      ];
      if (applied.channels.some((channel) => channel !== "email")) {
        requests.push({ section: "metrics", request: customerAttentionService.metrics(query, applied.channels, controller.signal) });
      }
      if (applied.channels.includes("call")) {
        requests.push({ section: "outcomes", request: customerAttentionService.outcomes(query, controller.signal) });
      }
      if (canLoadOccupancy) {
        requests.push({
          section: "occupancy",
          request: customerAttentionService.occupancy(
            { ...query, agent_id: occupancyAgent },
            controller.signal,
          ),
        });
      }
      setLoading(true);
      setErrors({});
      setData({});
      Promise.allSettled(requests.map(({ request }) => request)).then((settled) => {
        if (controller.signal.aborted) return;
        const next: DashboardData = {};
        const failures: Partial<Record<Section, string>> = {};
        settled.forEach((result, index) => {
          const section = requests[index].section;
          if (result.status === "rejected") {
            failures[section] = "No se pudieron cargar estos datos. Intenta actualizar los filtros.";
          } else if (section === "metrics") next.metrics = result.value as MetricsResponse;
          else if (section === "volume") next.volume = result.value as VolumeResponse;
          else if (section === "outcomes") next.outcomes = result.value as OutcomesResponse;
          else next.occupancy = result.value as OccupancyResponse;
        });
        setData(next);
        setErrors(failures);
        if (applied.agent === "all") {
          const found = fallbackAgentOptions(next.metrics, next.occupancy);
          if (found.length) {
            setFallbackAgents((previous) => [...new Map([...previous, ...found].map((option) => [option.value, option])).values()]);
          }
        }
        setLoading(false);
      });
      return () => controller.abort();
    }, [applied, canLoadOccupancy, occupancyAgent]);

    const volumeTotals = useMemo(() => {
      const sum = (rows: VolumeResponse["current"] | null | undefined) =>
        rows?.reduce((total, row) => total + row.total, 0) ?? 0;
      return { current: sum(data.volume?.current), comparison: data.volume?.comparison ? sum(data.volume.comparison) : undefined };
    }, [data.volume]);
    const channelTotals = useMemo(() => CHANNELS.filter((channel) => applied.channels.includes(channel.id)).map((channel) => {
      const total = data.volume?.current.filter((row) => row.channel === channel.id).reduce((sum, row) => sum + row.total, 0) ?? 0;
      return { ...channel, total, percent: volumeTotals.current ? (total / volumeTotals.current) * 100 : 0 };
    }).sort((a, b) => b.total - a.total || CHANNELS.findIndex((channel) => channel.id === a.id) - CHANNELS.findIndex((channel) => channel.id === b.id)), [applied.channels, data.volume, volumeTotals.current]);

    const dates = useMemo(
      () => [...new Set(data.volume?.current.map((row) => row.date) ?? [])].sort(),
      [data.volume],
    );
    const chartOptions: ApexOptions = {
      chart: { type: "area", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
      colors: CHANNELS.filter((channel) => applied.channels.includes(channel.id)).map((channel) => CHANNEL_COLORS[channel.id]),
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      xaxis: { categories: dates, labels: { rotate: -45 } },
      yaxis: { min: 0, decimalsInFloat: 0 },
      legend: { position: "bottom" },
      tooltip: { shared: true },
    };
    const chartSeries = CHANNELS.filter((channel) => applied.channels.includes(channel.id)).map((channel) => ({
      name: channel.label,
      data: dates.map((date) => data.volume?.current.find((row) => row.date === date && row.channel === channel.id)?.total ?? 0),
    }));
    const currentHeatmapPoints = data.volume?.current_by_weekday_hour ?? [];
    const comparisonHeatmapPoints = data.volume?.comparison_by_weekday_hour ?? null;
    const currentHeatmapSeries = useMemo(() => volumeHeatmapSeries(currentHeatmapPoints), [currentHeatmapPoints]);
    const currentHeatmapOptions = useMemo(
      () => volumeHeatmapOptions(currentHeatmapPoints, applied.channels),
      [currentHeatmapPoints, applied.channels],
    );
    const comparisonHeatmapSeries = useMemo(
      () => comparisonHeatmapPoints ? volumeHeatmapSeries(comparisonHeatmapPoints) : [],
      [comparisonHeatmapPoints],
    );
    const comparisonHeatmapOptions = useMemo(
      () => comparisonHeatmapPoints ? volumeHeatmapOptions(comparisonHeatmapPoints, applied.channels) : undefined,
      [comparisonHeatmapPoints, applied.channels],
    );
    const channelChartOptions: ApexOptions = {
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
      colors: channelTotals.map((channel) => CHANNEL_COLORS[channel.id]),
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: "82%", borderRadius: 5, dataLabels: { position: "center" } } },
      dataLabels: { enabled: true, formatter: (_value, options) => {
        const row = channelTotals[options.dataPointIndex];
        return row?.total ? `${numberFormat.format(row.total)} · ${percentage(row.percent)}` : "";
      }, style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 } },
      xaxis: { categories: channelTotals.map((row) => row.label), labels: { formatter: (value) => numberFormat.format(Number(value)) } },
      yaxis: { labels: { maxWidth: 180 } },
      legend: { show: false },
      tooltip: { y: { formatter: (_value, options) => `${numberFormat.format(channelTotals[options.dataPointIndex]?.total ?? 0)} contactos · ${percentage(channelTotals[options.dataPointIndex]?.percent)}` } },
    };
    const channelChartSeries = [{ name: "Contactos", data: channelTotals.map((row) => row.total) }];

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!form.from || !form.to || form.from > form.to) {
        setValidation("Selecciona un rango principal válido.");
        return;
      }
      if (form.compare && (!form.compareFrom || !form.compareTo || form.compareFrom > form.compareTo)) {
        setValidation("Selecciona ambas fechas del período comparativo en orden.");
        return;
      }
      if (form.channels.length === 0) {
        setValidation("Selecciona al menos un canal.");
        return;
      }
      setValidation("");
      setApplied({ ...form, channels: [...form.channels] });
    }

    const byChannel = data.metrics?.current.by_channel;
    const comparisonByChannel = data.metrics?.comparison?.by_channel;
    const selectedMetrics = CHANNELS.filter((channel) => channel.id !== "email" && applied.channels.includes(channel.id));
    const outcomeQueues = [...(data.outcomes?.current.by_queue ?? [])]
      .sort((a, b) => b.total - a.total || (a.queue_name || a.queue_id || "").localeCompare(b.queue_name || b.queue_id || ""));
    const outcomeTotal = outcomeQueues.reduce((sum, queue) => sum + queue.total, 0);
    const outcomeColors = ["#465FFF", "#8B5CF6", "#12B76A", "#F79009"];
    const outcomeChartOptions: ApexOptions = {
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
      colors: outcomeQueues.map((_, index) => outcomeColors[index % outcomeColors.length]),
      plotOptions: { bar: { horizontal: true, distributed: true, barHeight: "82%", borderRadius: 5, dataLabels: { position: "center" } } },
      dataLabels: { enabled: true, formatter: (_value, options) => {
        const queue = outcomeQueues[options.dataPointIndex];
        return queue?.total ? `${numberFormat.format(queue.total)} · ${percentage(outcomeTotal ? queue.total / outcomeTotal * 100 : null)}` : "";
      }, style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 } },
      xaxis: {
        categories: outcomeQueues.map((queue) => queue.queue_name || queue.queue_id || "Sin cola"),
        labels: { formatter: (value) => numberFormat.format(Number(value)) },
      },
      yaxis: { labels: { maxWidth: 220 } },
      legend: { show: false },
      tooltip: { y: { formatter: (_value, options) => {
        const queue = outcomeQueues[options.dataPointIndex];
        return `${numberFormat.format(queue?.total ?? 0)} llamadas · ${percentage(outcomeTotal ? (queue?.total ?? 0) / outcomeTotal * 100 : null)}`;
      } } },
    };
    const outcomeChartSeries = [{ name: "Llamadas", data: outcomeQueues.map((queue) => queue.total) }];

    return (
      <>
        <PageMeta title="Métricas de atención | Pronto Connect" description="Métricas de atención ATC" />
        <div className="hidden sm:block"><PageBreadcrumb pageTitle="Métricas de atención" /></div>
        <h1 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white sm:hidden">Métricas de atención</h1>
        <div className="space-y-6">
          <ComponentCard title="Filtros" desc="Los días se calculan en la zona horaria de Nueva York.">
            <form onSubmit={applyFilters} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
                <label className="text-sm text-gray-700 dark:text-gray-300 xl:col-span-2">Desde
                  <div className="mt-1"><DateFilterInput label="Desde" value={form.from} onChange={(from) => setForm((current) => ({ ...current, from }))} /></div>
                </label>
                <label className="text-sm text-gray-700 dark:text-gray-300 xl:col-span-2">Hasta
                  <div className="mt-1"><DateFilterInput label="Hasta" value={form.to} onChange={(to) => setForm((current) => ({ ...current, to }))} /></div>
                </label>
                <label className="text-sm text-gray-700 dark:text-gray-300 xl:col-span-2">Agente
                  <select value={form.agent} onChange={(event) => setForm({ ...form, agent: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    <option value="all">Todos los agentes</option>
                    {agentOptions(candidates, fallbackAgents).map((group) => (
                      <optgroup key={group.group} label={group.title}>
                        {group.options.map((agent) => (
                          <option key={agent.value} value={agent.value}>
                            {agent.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <fieldset className="min-w-0 text-sm text-gray-700 dark:text-gray-300 xl:col-span-3">
                  <legend>Canales</legend>
                  <div className="mt-1 flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700">
                    {CHANNELS.map((channel) => (
                      <label key={channel.id} className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm">
                        <input className="size-4 accent-brand-500" type="checkbox" checked={form.channels.includes(channel.id)} onChange={() => setForm({
                          ...form,
                          channels: form.channels.includes(channel.id)
                            ? form.channels.filter((item) => item !== channel.id)
                            : [...form.channels, channel.id],
                        })} />
                        {channel.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input className="size-4 accent-brand-500" type="checkbox" checked={form.compare} onChange={(event) => setForm({ ...form, compare: event.target.checked })} />
                Comparar con otro período
              </label>
              {form.compare && (
                <div className="grid gap-4 sm:grid-cols-2 xl:w-1/2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Comparar desde
                    <div className="mt-1"><DateFilterInput label="Comparar desde" value={form.compareFrom} onChange={(compareFrom) => setForm((current) => ({ ...current, compareFrom }))} /></div>
                  </label>
                  <label className="text-sm text-gray-700 dark:text-gray-300">Comparar hasta
                    <div className="mt-1"><DateFilterInput label="Comparar hasta" value={form.compareTo} onChange={(compareTo) => setForm((current) => ({ ...current, compareTo }))} /></div>
                  </label>
                </div>
              )}
              {validation && <p role="alert" className="text-sm text-red-600">{validation}</p>}
              {agentError && <p className="text-sm text-amber-600">{fallbackAgents.length ? "Se muestran agentes encontrados en las métricas disponibles; la lista completa no está disponible." : "No se pudo cargar la lista de agentes. Puedes consultar el total."}</p>}
              <div className="flex justify-start pt-1">
                <button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? "Cargando…" : "Aplicar filtros"}
                </button>
              </div>
            </form>
          </ComponentCard>

          {loading && <p role="status" className="text-sm text-gray-500">Cargando métricas de atención…</p>}
          {!loading && Object.keys(errors).length > 0 && (
            <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              Algunas secciones no se pudieron cargar. Las demás muestran los datos disponibles.
            </p>
          )}

          {!loading && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Contactos registrados" value={data.volume ? numberFormat.format(volumeTotals.current) : "—"} detail={comparisonText(volumeTotals.current, volumeTotals.comparison)} />
                <Kpi label="Interacciones con métricas" value={data.metrics ? numberFormat.format(data.metrics.current.overall.interactions) : "—"} detail={data.metrics?.comparison ? comparisonText(data.metrics.current.overall.interactions, data.metrics.comparison.overall.interactions) : undefined} />
                <Kpi label="Tasa de atención de llamadas" value={data.outcomes ? percentage(data.outcomes.current.overall.attended_percent) : "—"} detail={data.outcomes ? `${complementaryPercentage(data.outcomes.current.overall.attended_percent)} no atendidas${data.outcomes.comparison ? ` · Comparativo atendidas: ${percentage(data.outcomes.comparison.overall.attended_percent)}` : ""}` : undefined} />
                <Kpi label="Ocupación GoTo" value={data.occupancy ? percentage(data.occupancy.overall.occupancy_percent) : "—"} detail="Tiempo atendiendo / tiempo disponible" />
              </div>

              <ComponentCard title="Volumen diario" desc="Email se contabiliza aquí; no tiene métricas de duración.">
                {errors.volume ? <p role="alert" className="text-sm text-red-600">{errors.volume}</p> : dates.length ? (
                  <div className="min-w-0" aria-label="Gráfica de volumen diario por canal">
                    <Chart options={chartOptions} series={chartSeries} type="area" height={320} />
                  </div>
                ) : <Empty text="No hay contactos en este período." />}
                {data.volume?.comparison && (
                  <div className="grid gap-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800 sm:grid-cols-4">
                    {CHANNELS.filter((channel) => applied.channels.includes(channel.id)).map((channel) => {
                      const current = data.volume!.current.filter((row) => row.channel === channel.id).reduce((sum, row) => sum + row.total, 0);
                      const previous = data.volume!.comparison!.filter((row) => row.channel === channel.id).reduce((sum, row) => sum + row.total, 0);
                      return <p key={channel.id} className="text-gray-600 dark:text-gray-300">{channel.label}: {numberFormat.format(current)} / {numberFormat.format(previous)}</p>;
                    })}
                    <p className="col-span-full text-xs text-gray-500">Actual / comparativo</p>
                  </div>
                )}
              </ComponentCard>

              <ComponentCard title="Volumen por día y hora" desc="Cada celda muestra los contactos de esa hora y día de semana en la zona horaria de Nueva York.">
                {errors.volume ? <p role="alert" className="text-sm text-red-600">{errors.volume}</p> : volumeTotals.current ? (
                  <div className={`grid gap-6 ${comparisonHeatmapPoints ? "xl:grid-cols-2" : ""}`}>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Período actual · {applied.from} a {applied.to}</h3>
                      <div className="overflow-x-auto" aria-label="Heatmap de volumen actual por día y hora">
                        <div className="min-w-[900px]"><Chart options={currentHeatmapOptions} series={currentHeatmapSeries} type="heatmap" height={340} /></div>
                      </div>
                    </div>
                    {comparisonHeatmapPoints && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Período comparativo · {applied.compareFrom} a {applied.compareTo}</h3>
                        <div className="overflow-x-auto" aria-label="Heatmap de volumen comparativo por día y hora">
                          <div className="min-w-[900px]"><Chart options={comparisonHeatmapOptions!} series={comparisonHeatmapSeries} type="heatmap" height={340} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : <Empty text="No hay contactos en este período." />}
              </ComponentCard>

              <ComponentCard title="Volumen total por canal" desc="El porcentaje de cada barra se calcula sobre el total de los canales seleccionados.">
                {errors.volume ? <p role="alert" className="text-sm text-red-600">{errors.volume}</p> : volumeTotals.current ? <div className="min-w-0 overflow-x-auto" aria-label="Volumen total por canal"><Chart options={channelChartOptions} series={channelChartSeries} type="bar" height={Math.max(220, channelTotals.length * 64)} /></div> : <Empty text="No hay contactos en este período." />}
              </ComponentCard>

              {selectedMetrics.length > 0 && <ComponentCard title="Tiempos por canal" desc="p50 = mediana; p90 = el 90 % de los casos está por debajo. Los tiempos se expresan en tiempo calendario.">
                {errors.metrics ? <p role="alert" className="text-sm text-red-600">{errors.metrics}</p> : (
                  <div className="grid gap-4 xl:grid-cols-3">
                    {selectedMetrics.map((channel) => {
                      const current = byChannel?.[channel.id as "call" | "chat" | "ticket"];
                      const previous = comparisonByChannel?.[channel.id as "call" | "chat" | "ticket"];
                      return <div key={channel.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{channel.label}</h4>
                          <span className="text-sm text-gray-500">{numberFormat.format(current?.interactions ?? 0)} interacciones</span>
                        </div>
                        {current ? <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          {channel.id !== "ticket" && <MetricStat label="Espera" value={current.wait} />}
                          {channel.id !== "ticket" && <MetricStat label="Atención" value={current.attention} />}
                          {channel.id !== "ticket" && <MetricStat label="Duración total" value={current.total} />}
                          {channel.id === "ticket" && <MetricStat label="Primera respuesta" value={current.first_response} />}
                        </div> : <Empty text="Sin registros válidos." />}
                        {previous && <p className="mt-3 text-xs text-gray-500">Comparativo: {numberFormat.format(previous.interactions)} interacciones</p>}
                      </div>;
                    })}
                  </div>
                )}
                {data.metrics && data.metrics.current.quality.excluded_invalid_timestamps > 0 && (
                  <p className="text-xs text-amber-700">Se excluyeron {numberFormat.format(data.metrics.current.quality.excluded_invalid_timestamps)} registros con fechas inconsistentes.</p>
                )}
              </ComponentCard>}

              {applied.channels.includes("call") && <ComponentCard title="Resultados por cola GoTo" desc="Atendidas = resultado HANDLED. Los otros resultados se muestran con el motivo original de GoTo.">
                {errors.outcomes ? <p role="alert" className="text-sm text-red-600">{errors.outcomes}</p> : outcomeQueues.length ? (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Compara el resultado de las llamadas en cada cola.</p>
                      <div role="group" aria-label="Vista de resultados por cola" className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                        <button type="button" aria-pressed={outcomesView === "table"} onClick={() => setOutcomesView("table")} className={`rounded-md px-3 py-1.5 text-sm ${outcomesView === "table" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
                          Tabla
                        </button>
                        <button type="button" aria-pressed={outcomesView === "chart"} onClick={() => setOutcomesView("chart")} className={`rounded-md px-3 py-1.5 text-sm ${outcomesView === "chart" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
                          Gráfica
                        </button>
                      </div>
                    </div>
                    {outcomesView === "chart" ? (
                      <div className="min-w-0 overflow-x-auto" aria-label="Volumen total de llamadas por cola">
                        <Chart options={outcomeChartOptions} series={outcomeChartSeries} type="bar" height={Math.max(260, outcomeQueues.length * 48)} />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Cola</th><th className="p-3">Total</th><th className="p-3">Atendidas</th><th className="p-3">No atendidas</th><th className="p-3">% atendidas</th><th className="p-3">% no atendidas</th><th className="p-3">Motivo principal no atendido</th></tr></thead>
                          <tbody>{outcomeQueues.map((queue) => (
                            <tr key={`${queue.queue_id ?? ""}:${queue.queue_name ?? ""}`} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{queue.queue_name || queue.queue_id || "Sin cola"}</td>
                              <td className="p-3">{numberFormat.format(queue.total)}</td>
                              <td className="p-3">{numberFormat.format(queue.handled)}</td>
                              <td className="p-3">{numberFormat.format(queue.unattended)}</td>
                              <td className="p-3">{percentage(queue.attended_percent)}</td>
                              <td className="p-3">{complementaryPercentage(queue.attended_percent)}</td>
                              <td className="p-3">{queue.unattended_reasons[0] ? `${queue.unattended_reasons[0].outcome ?? "Sin resultado"}${queue.unattended_reasons[0].left_queue_reason ? ` · ${queue.unattended_reasons[0].left_queue_reason}` : ""}` : "—"}</td>
                            </tr>
                          ))}</tbody>
                          <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{numberFormat.format(data.outcomes?.current.overall.total ?? 0)}</td><td className="p-3">{numberFormat.format(data.outcomes?.current.overall.handled ?? 0)}</td><td className="p-3">{numberFormat.format(data.outcomes?.current.overall.unattended ?? 0)}</td><td className="p-3">{percentage(data.outcomes?.current.overall.attended_percent)}</td><td className="p-3">{complementaryPercentage(data.outcomes?.current.overall.attended_percent)}</td><td className="p-3">—</td></tr></tfoot>
                        </table>
                      </div>
                    )}
                    {data.outcomes?.comparison && <p className="mt-3 text-xs text-gray-500">Comparativo general: {numberFormat.format(data.outcomes.comparison.overall.total)} llamadas, {percentage(data.outcomes.comparison.overall.attended_percent)} atendidas.</p>}
                  </>
                ) : <Empty text="No hay llamadas en este período." />}
              </ComponentCard>}

              {showOccupancy && <ComponentCard title="Ocupación por agente" desc="Incluye llamadas y chats; este endpoint no aplica el filtro de canal ni admite comparación. Disponible = conectado menos pausas y estados administrativos.">
                {!canLoadOccupancy ? <Empty text="Este agente no tiene una relación activa con GoTo para consultar ocupación." /> : errors.occupancy ? <p role="alert" className="text-sm text-red-600">{errors.occupancy}</p> : data.occupancy?.by_agent.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[590px] text-left text-sm">
                      <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800"><tr><th className="p-3">Agente</th><th className="p-3">Ocupación</th><th className="p-3">Disponible</th><th className="p-3">Atendiendo</th><th className="p-3">Libre</th></tr></thead>
                      <tbody>{data.occupancy.by_agent.map((agent) => (
                        <tr key={agent.agent_id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{agent.agent_name || agent.agent_id}</td>
                          <td className="p-3">{percentage(agent.occupancy_percent)}</td>
                          <td className="p-3">{duration(agent.available_seconds)}</td>
                          <td className="p-3">{duration(agent.talk_seconds)}</td>
                          <td className="p-3">{duration(agent.idle_seconds)}</td>
                        </tr>
                      ))}</tbody>
                      <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold dark:border-gray-700 dark:bg-gray-900"><tr><td className="p-3">Total general</td><td className="p-3">{percentage(data.occupancy.overall.occupancy_percent)}</td><td className="p-3">{duration(data.occupancy.overall.available_seconds)}</td><td className="p-3">{duration(data.occupancy.overall.talk_seconds)}</td><td className="p-3">{duration(data.occupancy.overall.idle_seconds)}</td></tr></tfoot>
                    </table>
                  </div>
                ) : <Empty text="No hay sesiones GoTo en este período." />}
              </ComponentCard>}
            </>
          )}
        </div>
      </>
    );
  }
