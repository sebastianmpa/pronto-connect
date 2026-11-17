import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router";
import ComponentCard from "../../components/common/ComponentCard";
import InfoTooltip from "../../components/common/InfoTooltip";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { weeklyScheduleService } from "../../lib/customer-attention/weeklyScheduleService";
import type {
  WeeklySchedule,
  WeeklyScheduleAgent,
  WeeklyScheduleConfiguration,
  WeeklyScheduleInputs,
  WeeklyScheduleOwn,
  WeeklyScheduleReport,
  WeeklyScheduleSettings,
  WeeklyScheduleShift,
  WeeklyScheduleSlot,
} from "../../lib/customer-attention/weeklyScheduleTypes";

const shortDays = ["L", "M", "Mi", "J", "V", "S"];
const inputClass = "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const buttonClass = "inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

type Tab = "schedule" | "configuration" | "exceptions" | "reports";
type ShiftDraft = Pick<WeeklyScheduleShift, "start_time" | "end_time" | "lunch_start" | "lunch_end" | "rest1_start" | "rest1_end" | "rest2_start" | "rest2_end">;

function number(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function errorStatus(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; details?: { message: string }[] } } }).response;
    const data = response?.data;
    if (data?.message) {
      const details = data.details?.map((item) => item.message).filter(Boolean);
      return details?.length ? data.message + " " + details.join(" ") : data.message;
    }
  }
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

function addDays(date: string, count: number) {
  const result = new Date(date + "T12:00:00Z");
  result.setUTCDate(result.getUTCDate() + count);
  return result.toISOString().slice(0, 10);
}

function mondayOf(date: string) {
  const weekday = new Date(date + "T12:00:00Z").getUTCDay() || 7;
  return addDays(date, 1 - weekday);
}

function todayInNewYork() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("es-CO", { ...options, timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
}

function weekDates(weekStart: string) {
  return Array.from({ length: 6 }, (_, index) => addDays(weekStart, index));
}

function selectedOptions(event: React.ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.currentTarget.selectedOptions).map((option) => option.value);
}

function statusLabel(status?: string) {
  if (status === "draft") return "Borrador";
  if (status === "published") return "Publicado";
  if (status === "approved") return "Aprobado";
  return "Sin horario";
}

function SlotTable({ slots }: { slots: WeeklyScheduleSlot[] }) {
  return <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <tr>
          <th className="px-3 py-3">Franja</th>
          <th className="whitespace-nowrap px-3 py-3">Llamadas <InfoTooltip label="Demanda de llamadas" content="Media es el promedio de los días históricos comparables. P90 muestra una franja de demanda alta observada." /></th>
          <th className="whitespace-nowrap px-3 py-3">Agentes de llamada <InfoTooltip label="Cobertura de llamadas" content="Requeridos es la dotación calculada; asignados cubre la franja y disponibles excluye almuerzos y descansos." /></th>
          <th className="whitespace-nowrap px-3 py-3">Faltan / sobran <InfoTooltip label="Déficit y excedente" content="Déficit compara agentes requeridos con asignados. Excedente muestra agentes disponibles por encima del requerimiento." /></th>
          <th className="whitespace-nowrap px-3 py-3">Chats <InfoTooltip label="Demanda de chat" content="Media y P90 representan contactos de chat por franja según los departamentos configurados." /></th>
          <th className="whitespace-nowrap px-3 py-3">Agentes de chat <InfoTooltip label="Cobertura de chat" content="Requeridos se estima con la capacidad de chats por agente/hora; asignados y disponibles reflejan esta franja." /></th>
          <th className="whitespace-nowrap px-3 py-3">Faltan / sobran <InfoTooltip label="Déficit y excedente de chat" content="Déficit compara agentes requeridos con asignados. Excedente muestra agentes disponibles por encima del requerimiento." /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {slots.map((slot) => <tr key={slot.slot_start} className="text-gray-700 dark:text-gray-200">
          <td className="whitespace-nowrap px-3 py-2 font-medium">{slot.slot_start}–{formatEndTime(slot.slot_start)}</td>
          <td className="whitespace-nowrap px-3 py-2">{number(slot.forecast_calls).toFixed(1)} / {number(slot.forecast_calls_p90).toFixed(1)}</td>
          <td className="whitespace-nowrap px-3 py-2">{number(slot.required_calls)} / {number(slot.required_calls_p90)} · {number(slot.assigned_calls)} / {number(slot.available_calls)}</td>
          <td className="whitespace-nowrap px-3 py-2"><Coverage gap={number(slot.deficit_calls)} surplus={number(slot.surplus_calls)} /></td>
          <td className="whitespace-nowrap px-3 py-2">{number(slot.forecast_chats).toFixed(1)} / {number(slot.forecast_chats_p90).toFixed(1)}</td>
          <td className="whitespace-nowrap px-3 py-2">{number(slot.required_chats)} / {number(slot.required_chats_p90)} · {number(slot.assigned_chats)} / {number(slot.available_chats)}</td>
          <td className="whitespace-nowrap px-3 py-2"><Coverage gap={number(slot.deficit_chats)} surplus={number(slot.surplus_chats)} /></td>
        </tr>)}
        {!slots.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">No hay franjas operativas para este día.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function formatEndTime(start: string) {
  const [hours, minutes] = start.split(":").map(Number);
  const total = hours * 60 + minutes + 30;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

function Coverage({ gap, surplus }: { gap: number; surplus: number }) {
  if (gap) return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">−{gap}</span>;
  if (surplus) return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">+{surplus}</span>;
  return <span className="text-gray-400">0</span>;
}

export default function CustomerAttentionWeeklySchedule() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayInNewYork()));
  const [activeDate, setActiveDate] = useState(weekStart);
  const [tab, setTab] = useState<Tab>("schedule");
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [ownSchedule, setOwnSchedule] = useState<WeeklyScheduleOwn | null>(null);
  const [configuration, setConfiguration] = useState<WeeklyScheduleConfiguration | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<WeeklyScheduleSettings | null>(null);
  const [agentDrafts, setAgentDrafts] = useState<Record<number, WeeklyScheduleAgent>>({});
  const [inputs, setInputs] = useState<WeeklyScheduleInputs | null>(null);
  const [reports, setReports] = useState<WeeklyScheduleReport[]>([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingShift, setEditingShift] = useState<number | null>(null);
  const [shiftDraft, setShiftDraft] = useState<ShiftDraft | null>(null);
  const [absence, setAbsence] = useState({ staff_id: "", starts_on: weekStart, ends_on: weekStart, absence_type: "vacation", note: "" });
  const [holiday, setHoliday] = useState({ holiday_date: weekStart, name: "", service_closed: true });
  const [atypical, setAtypical] = useState({ date: "", reason: "", atypical: true });

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const selectedSlots = useMemo(() => (schedule?.slots ?? []).filter((slot) => slot.slot_date === activeDate), [schedule, activeDate]);
  const selectedShifts = useMemo(() => (schedule?.shifts ?? []).filter((shift) => shift.shift_date === activeDate), [schedule, activeDate]);
  const selectedOwnShifts = useMemo(() => (ownSchedule?.shifts ?? []).filter((shift) => shift.shift_date === activeDate), [ownSchedule, activeDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let canReadFull = true;
      let currentSchedule: WeeklySchedule | null = null;
      try {
        currentSchedule = await weeklyScheduleService.schedule(weekStart);
      } catch (caught) {
        if (errorStatus(caught) !== 403) throw caught;
        canReadFull = false;
      }
      setFullAccess(canReadFull);
      if (canReadFull) {
        let config: WeeklyScheduleConfiguration | null = null;
        try {
          config = await weeklyScheduleService.configuration();
        } catch (caught) {
          if (errorStatus(caught) !== 403) throw caught;
        }
        setSchedule(currentSchedule);
        setOwnSchedule(null);
        setConfiguration(config);
        setSettingsDraft(config?.settings ?? null);
        setAgentDrafts(Object.fromEntries((config?.agents ?? []).map((agent) => [agent.id, agent])));
        const from = addDays(weekStart, -56);
        const to = addDays(weekStart, 13);
        const [reportResult, inputResult] = await Promise.allSettled([
          weeklyScheduleService.reports(addDays(weekStart, -56), addDays(weekStart, 6)),
          config ? weeklyScheduleService.inputs(from, to) : Promise.resolve(null),
        ]);
        if (reportResult.status === "fulfilled") setReports(reportResult.value);
        else setReports([]);
        if (inputResult.status === "fulfilled") setInputs(inputResult.value);
        else setInputs(null);
      } else {
        const own = await weeklyScheduleService.own(weekStart);
        setOwnSchedule(own);
        setSchedule(null);
        setConfiguration(null);
        setSettingsDraft(null);
        setAgentDrafts({});
        setInputs(null);
        setReports([]);
      }
      setActiveDate((current) => dates.includes(current) ? current : weekStart);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [weekStart, dates]);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function changeWeek(offset: number) {
    const next = addDays(weekStart, offset * 7);
    setWeekStart(next);
    setActiveDate(next);
    setMessage("");
  }

  function beginEdit(shift: WeeklyScheduleShift) {
    setEditingShift(shift.id);
    setShiftDraft({
      start_time: shift.start_time,
      end_time: shift.end_time,
      lunch_start: shift.lunch_start,
      lunch_end: shift.lunch_end,
      rest1_start: shift.rest1_start,
      rest1_end: shift.rest1_end,
      rest2_start: shift.rest2_start,
      rest2_end: shift.rest2_end,
    });
  }

  async function saveShift(event: React.FormEvent<HTMLFormElement>, scheduleId: number, shiftId: number) {
    event.preventDefault();
    if (!shiftDraft) return;
    await run(() => weeklyScheduleService.editShift(scheduleId, shiftId, {
      ...shiftDraft,
      lunch_start: shiftDraft.lunch_start || null,
      lunch_end: shiftDraft.lunch_end || null,
      rest1_start: shiftDraft.rest1_start || null,
      rest1_end: shiftDraft.rest1_end || null,
      rest2_start: shiftDraft.rest2_start || null,
      rest2_end: shiftDraft.rest2_end || null,
    }), "Turno actualizado y cobertura recalculada.");
    setEditingShift(null);
    setShiftDraft(null);
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settingsDraft) return;
    await run(() => weeklyScheduleService.updateSettings(settingsDraft), "Configuración guardada.");
  }

  async function saveAgent(event: React.FormEvent<HTMLFormElement>, agent: WeeklyScheduleAgent) {
    event.preventDefault();
    await run(() => weeklyScheduleService.updateAgent(agent.id, agent), "Configuración de agente guardada.");
  }

  async function addAbsence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!absence.staff_id) { setError("Selecciona un agente."); return; }
    await run(async () => {
      const result = await weeklyScheduleService.addAbsence({
        ...absence,
        staff_id: Number(absence.staff_id),
        note: absence.note.trim() || null,
      });
      const count = result.proposed_schedules?.length ?? 0;
      setMessage(count ? "Ausencia registrada. Se prepararon " + count + " borradores para revisión." : "Ausencia aprobada registrada.");
    }, "Ausencia registrada.");
    setAbsence((current) => ({ ...current, note: "" }));
  }

  async function addHoliday(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!holiday.name.trim()) { setError("Escribe el nombre del festivo."); return; }
    await run(() => weeklyScheduleService.addHoliday({ ...holiday, name: holiday.name.trim() }), "Festivo guardado.");
    setHoliday((current) => ({ ...current, name: "" }));
  }

  async function saveAtypical(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!atypical.date) { setError("Selecciona una fecha."); return; }
    await run(() => weeklyScheduleService.setAtypicalDate({
      date: atypical.date,
      reason: atypical.reason.trim() || null,
      atypical: atypical.atypical,
    }), atypical.atypical ? "Fecha atípica excluida del pronóstico." : "Fecha reincorporada al pronóstico.");
    setAtypical((current) => ({ ...current, reason: "" }));
  }

  function updateSetting<K extends keyof WeeklyScheduleSettings>(key: K, value: WeeklyScheduleSettings[K]) {
    setSettingsDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function updateAgent(id: number, patch: Partial<WeeklyScheduleAgent>) {
    setAgentDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  const report = reports.find((item) => item.week_start === weekStart)?.report ?? null;
  const isOwnOnly = !fullAccess;

  return <>
    <PageMeta title="Programación semanal ATC | Pronto Connect" description="Borradores, cobertura y publicación del horario operativo ATC" />
    <PageBreadcrumb pageTitle="Programación semanal ATC" />
    <div className="space-y-5">
      <ComponentCard title="Programación semanal ATC" desc="Borrador, revisión y publicación · hora del Este (ET).">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{dateLabel(weekStart)} – {dateLabel(addDays(weekStart, 5), { month: "short", day: "numeric", year: "numeric" })}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Zona horaria: America/New_York · No se programan turnos el domingo</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => changeWeek(-1)}>Semana anterior</button>
            <button type="button" className={secondaryButtonClass} onClick={() => changeWeek(1)}>Semana siguiente</button>
          </div>
        </div>
      </ComponentCard>
      {!loading && <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        <p>{fullAccess ? "Este es el horario operativo por semana. Crear borrador prepara una propuesta; publicar la confirma para el equipo." : "Aquí puedes consultar y confirmar tus turnos publicados."} <span className="hidden sm:inline">Los horarios de referencia de Admin alimentan Dotación sugerida y se mantienen aparte.</span></p>
        <InfoTooltip label="Cómo se relacionan las pantallas" content="Esta página guarda turnos concretos por fecha y es la programación que se aprueba y publica. Equipo y horarios base mantiene horarios y capacidades que usa Dotación sugerida; publicar aquí no actualiza esa vista. La capacidad de chat del generador se configura en esta página." />
        {configuration && <Link to="/customer-attention/staff" className="shrink-0 font-medium underline">Ver equipo y horarios base</Link>}
      </div>}

      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">{error}</p>}
      {loading && <p role="status" className="text-sm text-gray-500">Cargando horario…</p>}

      {!loading && <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones del horario ATC">
        <TabButton active={tab === "schedule"} onClick={() => setTab("schedule")}>Horario</TabButton>
        {!isOwnOnly && <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>Reportes</TabButton>}
        {configuration && <TabButton active={tab === "configuration"} onClick={() => setTab("configuration")}>Configuración</TabButton>}
        {configuration && <TabButton active={tab === "exceptions"} onClick={() => setTab("exceptions")}>Ausencias y festivos</TabButton>}
      </div>}

      {!loading && tab === "schedule" && <SchedulePanel
        schedule={schedule}
        ownSchedule={ownSchedule}
        fullAccess={fullAccess}
        canEdit={fullAccess}
        canManage={Boolean(configuration)}
        busy={busy}
        activeDate={activeDate}
        dates={dates}
        selectedSlots={selectedSlots}
        selectedShifts={selectedShifts}
        selectedOwnShifts={selectedOwnShifts}
        editingShift={editingShift}
        shiftDraft={shiftDraft}
        setActiveDate={setActiveDate}
        setShiftDraft={setShiftDraft}
        setEditingShift={setEditingShift}
        beginEdit={beginEdit}
        saveShift={saveShift}
        run={run}
      />}

      {!loading && tab === "configuration" && configuration && settingsDraft && <section className="space-y-5">
        <ComponentCard title="Configuración" desc="Abre solo la sección que necesites. Las reglas obligatorias del horario se mantienen fijas.">
          <form onSubmit={saveSettings} className="space-y-4">
            <details open className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <summary className="cursor-pointer font-medium text-gray-800 dark:text-white">Fuentes de demanda</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="text-sm"><div className="flex items-center"><label htmlFor="weekly-call-queues">Colas de llamadas ATC</label><InfoTooltip label="Colas GoTo" content="Solo las llamadas de estas colas se incluyen en el pronóstico semanal." /></div>
                <select id="weekly-call-queues" multiple value={settingsDraft.call_queue_ids} onChange={(event) => updateSetting("call_queue_ids", selectedOptions(event))} className={inputClass + " min-h-28"}>
                  {configuration.call_queues.map((queue) => <option key={queue.queue_id} value={queue.queue_id}>{queue.queue_name} · {queue.queue_id}</option>)}
                </select>
              </div>
              <div className="text-sm"><div className="flex items-center"><label htmlFor="weekly-chat-departments">Departamentos SalesIQ</label><InfoTooltip label="Departamentos de chat" content="Los chats de estos departamentos se agregan a la demanda si el canal está habilitado." /></div>
                <select id="weekly-chat-departments" multiple value={settingsDraft.chat_department_ids} onChange={(event) => updateSetting("chat_department_ids", selectedOptions(event))} className={inputClass + " min-h-28"}>
                  {configuration.chat_departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name} · {department.department_id}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={settingsDraft.chat_enabled} onChange={(event) => updateSetting("chat_enabled", event.target.checked)} /> Incluir chats en el pronóstico</label><InfoTooltip label="Incluir chats" content="Al activarlo, el pronóstico calcula también los agentes necesarios para atender chats." /></div>
              {settingsDraft.chat_enabled && <NumberField label="Capacidad de chats por agente/hora" help="Contactos que un agente puede atender por hora. Se usa para convertir demanda de chat en agentes requeridos." value={settingsDraft.chat_capacity_per_agent_hour ?? ""} min="0.1" step="0.1" onChange={(value) => updateSetting("chat_capacity_per_agent_hour", value === "" ? null : Number(value))} />}
              </div>
            </details>
            <details className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <summary className="cursor-pointer font-medium text-gray-800 dark:text-white">Metas de servicio</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <NumberField label="Meta de servicio (%)" help="Porcentaje objetivo de llamadas que deben atenderse dentro del tiempo de espera configurado." value={settingsDraft.service_level_percent} min="1" max="100" step="1" onChange={(value) => updateSetting("service_level_percent", Number(value))} />
              <NumberField label="Meta de espera (segundos)" help="Tiempo máximo usado para calcular la meta de servicio de llamadas." value={settingsDraft.service_level_seconds} min="1" step="1" onChange={(value) => updateSetting("service_level_seconds", Number(value))} />
              <NumberField label="Duración promedio por llamada (segundos)" help="Tiempo promedio de atención. Se recalcula con el historial cuando hay datos suficientes." value={settingsDraft.average_call_seconds} min="1" step="1" onChange={(value) => updateSetting("average_call_seconds", Number(value))} />
              </div>
            </details>
            <details className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <summary className="cursor-pointer font-medium text-gray-800 dark:text-white">Avisos y automatización</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="text-sm"><div className="flex items-center"><label htmlFor="weekly-alert-email">Correo de alertas</label><InfoTooltip label="Correo de alertas" content="Si se deja vacío, las alertas para responsables se envían a usuarios admin. El horario publicado se envía al correo vinculado a cada agente." /></div><input id="weekly-alert-email" type="email" className={inputClass} value={settingsDraft.alert_email ?? ""} onChange={(event) => updateSetting("alert_email", event.target.value || null)} /></div>
              <TimeField label="Generar borrador · jueves" help="Hora del Este a la que se prepara el borrador de la semana siguiente." value={settingsDraft.generation_time} onChange={(value) => updateSetting("generation_time", value)} />
              <TimeField label="Avisar borrador · jueves" help="Hora del aviso a responsables para revisar el borrador." value={settingsDraft.draft_ready_notice_time} onChange={(value) => updateSetting("draft_ready_notice_time", value)} />
              <TimeField label="Recordar aprobación · viernes" help="Hora del recordatorio previo al cierre del plazo." value={settingsDraft.approval_reminder_time} onChange={(value) => updateSetting("approval_reminder_time", value)} />
              <TimeField label="Límite de aprobación · viernes" help="Después de esta hora no se puede publicar el borrador de esa semana." value={settingsDraft.approval_deadline_time} onChange={(value) => updateSetting("approval_deadline_time", value)} />
              <TimeField label="Generar reporte · domingo" help="Hora del Este en que se guardan el MAPE y el nivel de servicio real." value={settingsDraft.report_time} onChange={(value) => updateSetting("report_time", value)} />
              </div>
            </details>
            <p className="flex items-center text-xs text-gray-500">Pronóstico: ocho semanas de historial; mínimo cuatro días comparables. <InfoTooltip label="Historial del pronóstico" content="La base usa el promedio y la banda de carga alta usa el percentil 90. Estos valores están fijados por el requerimiento." /></p>
            <button className={buttonClass} disabled={busy}>Guardar parámetros</button>
          </form>
        </ComponentCard>

        <ComponentCard title="Agentes ATC" desc="Abre un agente para cambiar su vínculo y disponibilidad.">
          <div className="space-y-3">
            {Object.values(agentDrafts).map((agent) => <details key={agent.id} className="rounded-xl border border-gray-200 px-4 dark:border-gray-800">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-4 font-medium text-gray-800 dark:text-white">
                <span>{agent.name}</span>
                <span className="text-xs font-normal text-gray-500">{agent.active ? "Activo" : "Inactivo"} · {agent.user_email || "Sin usuario vinculado"} · {agent.saturday_assignments} sábados recientes</span>
              </summary>
              <form onSubmit={(event) => void saveAgent(event, agent)} className="border-t border-gray-100 py-4 dark:border-gray-800">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="text-sm"><div className="flex items-center"><label htmlFor={"weekly-agent-user-" + agent.id}>Usuario de Pronto Connect</label><InfoTooltip label="Usuario de Pronto Connect" content="Vincula el correo que puede consultar y confirmar los turnos de este agente." /></div>
                  <select id={"weekly-agent-user-" + agent.id} value={agent.user_email ?? ""} onChange={(event) => updateAgent(agent.id, { user_email: event.target.value || null })} className={inputClass}>
                    <option value="">Seleccionar usuario</option>
                    {configuration.users.map((user) => <option key={user.id} value={user.email}>{user.name} · {user.email}</option>)}
                  </select>
                </div>
                <TimeField label="Almuerzo preferido" help="Preferencia flexible; el planificador puede moverla para mantener cobertura y evitar el pico." value={agent.preferred_lunch_time ?? ""} onChange={(value) => updateAgent(agent.id, { preferred_lunch_time: value || null })} />
                <div className="flex items-center gap-2 pt-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={agent.skill_call} onChange={(event) => updateAgent(agent.id, { skill_call: event.target.checked })} /> Llamadas</label><InfoTooltip label="Habilidad de llamadas" content="El agente puede cubrir franjas de llamadas. Se requieren al menos dos agentes activos con esta habilidad." /></div>
                <div className="flex items-center gap-2 pt-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={agent.skill_chat} onChange={(event) => updateAgent(agent.id, { skill_chat: event.target.checked })} /> Chats</label><InfoTooltip label="Habilidad de chat" content="El agente puede cubrir franjas de chat cuando el canal está habilitado." /></div>
              </div>
              <div className="mt-3">
                <p className="mb-2 flex items-center text-sm">Días libres <InfoTooltip label="Días libres fijos" content="El planificador no asigna turnos en estos días, salvo que deba conservar un turno que ya estaba confirmado." /></p>
                <div className="flex flex-wrap gap-3">
                {shortDays.map((label, index) => <label key={label} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={agent.fixed_days_off.includes(index + 1)} onChange={(event) => updateAgent(agent.id, { fixed_days_off: event.target.checked ? [...agent.fixed_days_off, index + 1] : agent.fixed_days_off.filter((day) => day !== index + 1) })} /> Libre {label}</label>)}
                <div className="flex items-center gap-1.5 text-sm"><label className="flex items-center gap-1.5"><input type="checkbox" checked={agent.active} onChange={(event) => updateAgent(agent.id, { active: event.target.checked })} /> Activo</label><InfoTooltip label="Agente activo" content="Los cinco agentes deben estar activos y configurados para generar el horario semanal." /></div>
                </div>
              </div>
              <button className={secondaryButtonClass + " mt-4"} disabled={busy}>Guardar {agent.name}</button>
              </form>
            </details>)}
          </div>
        </ComponentCard>
      </section>}

      {!loading && tab === "exceptions" && configuration && <ExceptionsPanel
        configuration={configuration}
        inputs={inputs}
        absence={absence}
        holiday={holiday}
        atypical={atypical}
        setAbsence={setAbsence}
        setHoliday={setHoliday}
        setAtypical={setAtypical}
        addAbsence={addAbsence}
        addHoliday={addHoliday}
        saveAtypical={saveAtypical}
        busy={busy}
        run={run}
      />}

      {!loading && tab === "reports" && <ReportsPanel report={report} reports={reports} weekStart={weekStart} />}
    </div>
  </>;
}

function SchedulePanel(props: {
  schedule: WeeklySchedule | null;
  ownSchedule: WeeklyScheduleOwn | null;
  fullAccess: boolean;
  canEdit: boolean;
  canManage: boolean;
  busy: boolean;
  activeDate: string;
  dates: string[];
  selectedSlots: WeeklyScheduleSlot[];
  selectedShifts: WeeklyScheduleShift[];
  selectedOwnShifts: WeeklyScheduleShift[];
  editingShift: number | null;
  shiftDraft: ShiftDraft | null;
  setActiveDate: (date: string) => void;
  setShiftDraft: React.Dispatch<React.SetStateAction<ShiftDraft | null>>;
  setEditingShift: (id: number | null) => void;
  beginEdit: (shift: WeeklyScheduleShift) => void;
  saveShift: (event: React.FormEvent<HTMLFormElement>, scheduleId: number, shiftId: number) => Promise<void>;
  run: (action: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const { schedule, ownSchedule, fullAccess, canEdit, canManage, busy, activeDate, dates, selectedSlots, selectedShifts, selectedOwnShifts } = props;
  const published = schedule?.currently_published;
  const viewStatus = schedule?.status ?? ownSchedule?.status;
  const viewVersion = schedule?.version ?? ownSchedule?.version;
  const viewCoverage = schedule?.coverage_percent;
  const viewShifts = fullAccess ? selectedShifts : selectedOwnShifts;

  return <div className="space-y-5">
    <ComponentCard title="Estado de la semana" desc="Revisa el borrador antes de publicarlo.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{statusLabel(viewStatus)}</span>
          {viewVersion != null && <span className="text-sm text-gray-500">Versión {viewVersion}</span>}
          {fullAccess && schedule && <span className="flex items-center text-sm text-gray-500">Franjas completas: {number(viewCoverage).toFixed(2)}% <InfoTooltip label="Franjas completas" content="Porcentaje de intervalos de 30 minutos sin déficit de llamadas ni chats frente a la demanda base." /></span>}
          {fullAccess && schedule?.forecast.used_previous_forecast && <span className="flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Pronóstico anterior <InfoTooltip label="Pronóstico anterior" content="Se reutilizó el pronóstico publicado porque el histórico no tenía suficientes días comparables." /></span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <span className="inline-flex items-center gap-1"><button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => void props.run(async () => { const result = await weeklyScheduleService.generate(schedule?.week_start ?? dates[0]); if (!result) return; }, "Borrador generado.")}>Crear borrador</button><InfoTooltip label="Crear borrador" content="Calcula una propuesta nueva. No reemplaza el horario publicado hasta que un administrador la apruebe." /></span>}
          {canManage && schedule?.status === "draft" && <span className="inline-flex items-center gap-1"><button type="button" className={buttonClass} disabled={busy} onClick={() => void props.run(() => weeklyScheduleService.approve(schedule.id), "Horario aprobado y publicado.")}>Aprobar y publicar</button><InfoTooltip label="Aprobar y publicar" content="Publica esta versión y notifica a los agentes vinculados. Solo está disponible para administradores." /></span>}
        </div>
      </div>
      {published && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">La versión publicada {published.version} sigue vigente mientras se revisa este borrador.</p>}
      {fullAccess && schedule?.forecast.used_previous_forecast && <p className="mt-2 text-sm text-gray-500">El historial no tuvo cuatro días limpios para cada día de semana. El borrador señala el uso del pronóstico anterior.</p>}
      {!viewStatus && <p className="mt-4 text-sm text-gray-500">No hay un horario publicado para esta semana.</p>}
    </ComponentCard>

    <ComponentCard title="Días de operación" desc="Selecciona un día para revisar turnos y cobertura en intervalos de 30 minutos.">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Días de la semana">
        {dates.map((date, index) => <button key={date} type="button" role="tab" aria-selected={activeDate === date} onClick={() => props.setActiveDate(date)} className={activeDate === date ? buttonClass : secondaryButtonClass}>{shortDays[index]} · {date.slice(5)}</button>)}
      </div>
      {fullAccess && <div className="mt-5">
        <h3 className="mb-3 font-semibold text-gray-800 dark:text-white">Cobertura · {dateLabel(activeDate)}</h3>
        <SlotTable slots={selectedSlots} />
      </div>}
      <div className="mt-5">
        <h3 className="mb-3 font-semibold text-gray-800 dark:text-white">{fullAccess ? "Turnos del equipo" : "Tus turnos"} · {dateLabel(activeDate)}</h3>
        <div className="space-y-3">
          {viewShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} scheduleId={schedule?.id ?? ownSchedule?.id ?? 0} canEdit={canEdit && schedule?.status === "draft"} busy={busy} editing={props.editingShift === shift.id} draft={props.shiftDraft} beginEdit={props.beginEdit} setDraft={props.setShiftDraft} cancel={() => props.setEditingShift(null)} save={props.saveShift} confirm={() => void props.run(() => weeklyScheduleService.confirm(ownSchedule?.id ?? schedule?.id ?? 0, shift.id), "Turno confirmado.")} showConfirm={!fullAccess && !shift.confirmed_at} />)}
          {!viewShifts.length && <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">No hay turnos asignados para este día.</p>}
        </div>
      </div>
    </ComponentCard>
  </div>;
}

function ShiftCard(props: {
  shift: WeeklyScheduleShift;
  scheduleId: number;
  canEdit: boolean;
  busy: boolean;
  editing: boolean;
  draft: ShiftDraft | null;
  beginEdit: (shift: WeeklyScheduleShift) => void;
  setDraft: React.Dispatch<React.SetStateAction<ShiftDraft | null>>;
  cancel: () => void;
  save: (event: React.FormEvent<HTMLFormElement>, scheduleId: number, shiftId: number) => Promise<void>;
  confirm: () => void;
  showConfirm: boolean;
}) {
  const { shift, scheduleId, canEdit, busy, editing, draft } = props;
  if (!editing || !draft) return <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
    <div>
      <h4 className="font-semibold text-gray-800 dark:text-white">{shift.agent_name}</h4>
      <p className="text-sm text-gray-500">{shift.start_time}–{shift.end_time} · almuerzo {shift.lunch_start ?? "—"}–{shift.lunch_end ?? "—"}</p>
      <p className="text-xs text-gray-500">Descansos: {shift.rest1_start ?? "—"}–{shift.rest1_end ?? "—"} y {shift.rest2_start ?? "—"}–{shift.rest2_end ?? "—"}{shift.confirmed_at ? " · Confirmado" : ""}</p>
    </div>
    <div className="flex gap-2">
      {canEdit && !shift.confirmed_at && <button type="button" className={secondaryButtonClass} onClick={() => props.beginEdit(shift)}>Editar</button>}
      {props.showConfirm && <button type="button" className={buttonClass} disabled={busy} onClick={props.confirm}>Confirmar turno</button>}
    </div>
  </article>;
  return <form onSubmit={(event) => void props.save(event, scheduleId, shift.id)} className="rounded-xl border border-brand-200 p-4 dark:border-brand-900">
    <h4 className="mb-3 flex items-center font-semibold text-gray-800 dark:text-white">Editar turno · {shift.agent_name} · {shift.shift_date}<InfoTooltip label="Reglas del turno" content="El turno conserva su duración laboral; el almuerzo y los descansos deben quedar dentro del turno y no romper la cobertura obligatoria." /></h4>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <TimeField label="Inicio" value={draft.start_time} onChange={(value) => props.setDraft((current) => current ? { ...current, start_time: value } : current)} />
      <TimeField label="Fin" value={draft.end_time} onChange={(value) => props.setDraft((current) => current ? { ...current, end_time: value } : current)} />
      <TimeField label="Almuerzo inicio" value={draft.lunch_start ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, lunch_start: value || null } : current)} />
      <TimeField label="Almuerzo fin" value={draft.lunch_end ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, lunch_end: value || null } : current)} />
      <TimeField label="Descanso 1 inicio" value={draft.rest1_start ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, rest1_start: value || null } : current)} />
      <TimeField label="Descanso 1 fin" value={draft.rest1_end ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, rest1_end: value || null } : current)} />
      <TimeField label="Descanso 2 inicio" value={draft.rest2_start ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, rest2_start: value || null } : current)} />
      <TimeField label="Descanso 2 fin" value={draft.rest2_end ?? ""} onChange={(value) => props.setDraft((current) => current ? { ...current, rest2_end: value || null } : current)} />
    </div>
    <div className="mt-4 flex gap-2"><button className={buttonClass} disabled={busy}>Guardar y revalidar</button><button type="button" className={secondaryButtonClass} onClick={props.cancel}>Cancelar</button></div>
  </form>;
}

function ExceptionsPanel(props: {
  configuration: WeeklyScheduleConfiguration;
  inputs: WeeklyScheduleInputs | null;
  absence: { staff_id: string; starts_on: string; ends_on: string; absence_type: string; note: string };
  holiday: { holiday_date: string; name: string; service_closed: boolean };
  atypical: { date: string; reason: string; atypical: boolean };
  setAbsence: React.Dispatch<React.SetStateAction<{ staff_id: string; starts_on: string; ends_on: string; absence_type: string; note: string }>>;
  setHoliday: React.Dispatch<React.SetStateAction<{ holiday_date: string; name: string; service_closed: boolean }>>;
  setAtypical: React.Dispatch<React.SetStateAction<{ date: string; reason: string; atypical: boolean }>>;
  addAbsence: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  addHoliday: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  saveAtypical: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  busy: boolean;
  run: (action: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const { inputs, configuration } = props;
  return <div className="grid gap-5 xl:grid-cols-2">
    <ComponentCard title="Ausencias aprobadas" desc="Vacaciones, incapacidades y permisos autorizados.">
      <p className="flex items-center text-xs text-gray-500">Se preparan borradores de reemplazo cuando la ausencia afecta una semana publicada. <InfoTooltip label="Replanificación por ausencia" content="Se conservan los turnos confirmados de otros agentes. El horario publicado sigue vigente hasta que un administrador apruebe el borrador nuevo." /></p>
      <form onSubmit={(event) => void props.addAbsence(event)} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Agente<select className={inputClass} value={props.absence.staff_id} onChange={(event) => props.setAbsence((current) => ({ ...current, staff_id: event.target.value }))}><option value="">Seleccionar</option>{configuration.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        <label className="text-sm">Tipo<select className={inputClass} value={props.absence.absence_type} onChange={(event) => props.setAbsence((current) => ({ ...current, absence_type: event.target.value }))}><option value="vacation">Vacaciones</option><option value="sick_leave">Incapacidad</option><option value="permission">Permiso</option></select></label>
        <label className="text-sm">Desde<input type="date" className={inputClass} value={props.absence.starts_on} onChange={(event) => props.setAbsence((current) => ({ ...current, starts_on: event.target.value }))} /></label>
        <label className="text-sm">Hasta<input type="date" className={inputClass} value={props.absence.ends_on} onChange={(event) => props.setAbsence((current) => ({ ...current, ends_on: event.target.value }))} /></label>
        <label className="text-sm sm:col-span-2">Nota<input className={inputClass} maxLength={500} value={props.absence.note} onChange={(event) => props.setAbsence((current) => ({ ...current, note: event.target.value }))} /></label>
        <button className={buttonClass + " sm:col-span-2"} disabled={props.busy}>Registrar ausencia</button>
      </form>
      <ul className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
        {(inputs?.absences ?? []).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <span>{item.agent_name} · {item.starts_on}–{item.ends_on} · {absenceLabel(item.absence_type)}</span>
          <button type="button" className="text-red-600 hover:underline" disabled={props.busy} onClick={() => void props.run(() => weeklyScheduleService.deleteAbsence(item.id), "Ausencia eliminada.")}>Eliminar</button>
        </li>)}
        {!inputs?.absences.length && <li className="py-3 text-sm text-gray-500">No hay ausencias en este rango.</li>}
      </ul>
    </ComponentCard>

    <ComponentCard title="Festivos de la empresa" desc="Indica si ATC trabajará ese día.">
      <p className="flex items-center text-xs text-gray-500">Los festivos cerrados no reciben turnos. <InfoTooltip label="Cierre en festivo" content="Si marcas ATC estará cerrado, esa fecha no genera turnos y se excluye del pronóstico histórico. Si queda abierto, se trata como día operativo." /></p>
      <form onSubmit={(event) => void props.addHoliday(event)} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Fecha<input type="date" className={inputClass} value={props.holiday.holiday_date} onChange={(event) => props.setHoliday((current) => ({ ...current, holiday_date: event.target.value }))} /></label>
        <label className="text-sm">Nombre<input className={inputClass} maxLength={160} value={props.holiday.name} onChange={(event) => props.setHoliday((current) => ({ ...current, name: event.target.value }))} /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={props.holiday.service_closed} onChange={(event) => props.setHoliday((current) => ({ ...current, service_closed: event.target.checked }))} /> ATC estará cerrado</label>
        <button className={buttonClass + " sm:col-span-2"} disabled={props.busy}>Guardar festivo</button>
      </form>
      <ul className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
        {(inputs?.holidays ?? []).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <span>{item.holiday_date} · {item.name} · {item.service_closed ? "Cerrado" : "Abierto"}</span>
          <button type="button" className="text-red-600 hover:underline" disabled={props.busy} onClick={() => void props.run(() => weeklyScheduleService.deleteHoliday(item.id), "Festivo eliminado.")}>Eliminar</button>
        </li>)}
        {!inputs?.holidays.length && <li className="py-3 text-sm text-gray-500">No hay festivos en este rango.</li>}
      </ul>
    </ComponentCard>

    <ComponentCard title="Fechas atípicas del histórico" desc="Excluye días extraordinarios de futuros pronósticos.">
      <p className="flex items-center text-xs text-gray-500">Solo afecta nuevas proyecciones; no cambia horarios publicados. <InfoTooltip label="Fecha atípica" content="Marca fechas con eventos excepcionales para que sus volúmenes no distorsionen el promedio ni el P90 de semanas futuras." /></p>
      <form onSubmit={(event) => void props.saveAtypical(event)} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Fecha<input type="date" className={inputClass} value={props.atypical.date} onChange={(event) => props.setAtypical((current) => ({ ...current, date: event.target.value }))} /></label>
        <label className="text-sm">Nota<input className={inputClass} maxLength={500} value={props.atypical.reason} onChange={(event) => props.setAtypical((current) => ({ ...current, reason: event.target.value }))} /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={props.atypical.atypical} onChange={(event) => props.setAtypical((current) => ({ ...current, atypical: event.target.checked }))} /> Excluir del pronóstico</label>
        <button className={buttonClass + " sm:col-span-2"} disabled={props.busy}>Guardar fecha</button>
      </form>
      <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {(inputs?.atypical_dates ?? []).map((item) => <li key={item.date} className="py-3 text-sm">{item.date}{item.reason ? " · " + item.reason : ""}</li>)}
        {!inputs?.atypical_dates.length && <li className="py-3 text-sm text-gray-500">No hay fechas atípicas en este rango.</li>}
      </ul>
    </ComponentCard>
  </div>;
}

function ReportsPanel({ report, reports, weekStart }: { report: WeeklyScheduleReport["report"] | null; reports: WeeklyScheduleReport[]; weekStart: string }) {
  const current = report ?? reports.find((item) => item.week_start === weekStart)?.report ?? null;
  return <ComponentCard title="Resultado semanal" desc="El reporte se calcula el domingo por la noche, con llamadas reales por franja y nivel de servicio logrado.">
    {current ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="MAPE de llamadas" help="Error porcentual absoluto medio entre llamadas pronosticadas y recibidas; se calcula solo en franjas con llamadas reales." value={current.forecast_mape_percent == null ? "Sin datos" : current.forecast_mape_percent.toFixed(2) + "%"} />
      <Metric label="Nivel de servicio real" help="Porcentaje de llamadas recibidas que se atendieron dentro del tiempo objetivo." value={current.actual_service_level_percent == null ? "Sin datos" : current.actual_service_level_percent.toFixed(2) + "%"} />
      <Metric label="Llamadas recibidas" help="Total de llamadas registradas durante la semana publicada." value={String(current.actual_calls)} />
      <Metric label="Llamadas atendidas" help="Llamadas contestadas por un agente durante la semana." value={String(current.actual_handled)} />
    </div> : <p className="text-sm text-gray-500">Todavía no hay un reporte guardado para esta semana.</p>}
    <h3 className="mt-6 mb-2 font-semibold text-gray-800 dark:text-white">Reportes disponibles</h3>
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {reports.map((item) => <li key={item.week_start} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>Semana del {item.week_start}</span><span>MAPE {item.report.forecast_mape_percent == null ? "—" : item.report.forecast_mape_percent.toFixed(2) + "%"} · servicio {item.report.actual_service_level_percent == null ? "—" : item.report.actual_service_level_percent.toFixed(2) + "%"}</span></li>)}
      {!reports.length && <li className="py-3 text-sm text-gray-500">No hay reportes disponibles.</li>}
    </ul>
  </ComponentCard>;
}

function Metric({ label, value, help }: { label: string; value: string; help: string }) {
  return <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="flex items-center text-sm text-gray-500">{label}<InfoTooltip label={label} content={help} /></p><p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">{value}</p></div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={active ? buttonClass : secondaryButtonClass}>{children}</button>;
}

function NumberField({ label, value, min, max, step, onChange, help }: { label: string; value: string | number; min?: string; max?: string; step?: string; onChange: (value: string) => void; help?: string }) {
  const inputId = useId();
  return <div className="text-sm"><div className="flex items-center"><label htmlFor={inputId}>{label}</label>{help && <InfoTooltip label={label} content={help} />}</div><input id={inputId} type="number" className={inputClass} value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} /></div>;
}

function TimeField({ label, value, onChange, help }: { label: string; value: string; onChange: (value: string) => void; help?: string }) {
  const inputId = useId();
  return <div className="text-sm"><div className="flex items-center"><label htmlFor={inputId}>{label}</label>{help && <InfoTooltip label={label} content={help} />}</div><input id={inputId} type="time" className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function absenceLabel(type: string) {
  if (type === "vacation") return "Vacaciones";
  if (type === "sick_leave") return "Incapacidad";
  return "Permiso";
}
