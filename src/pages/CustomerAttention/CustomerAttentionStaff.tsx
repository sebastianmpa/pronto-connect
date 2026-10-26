import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ConfirmModal from "../../components/common/ConfirmModal";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import { customerAttentionService } from "../../lib/customer-attention/service";
import type { AgentMapping, StaffMember, StaffResponse, StaffSchedule } from "../../lib/customer-attention/types";
import { cancellationStatisticsService } from "../../lib/cancellation-statistics/service";
import type { CancellationAlertThresholds } from "../../lib/cancellation-statistics/types";

const days = ["L", "M", "Mi", "J", "V", "S", "D"];
const blankSchedule: Omit<StaffSchedule, "id" | "staff_id"> = {
  effective_from: "", weekdays: [1, 2, 3, 4, 5], start_time: null, end_time: null,
  break_start: null, break_end: null, status: "draft",
};
const inputClass = "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const buttonClass = "h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:opacity-50";
type AlertThresholdDraft = Record<keyof CancellationAlertThresholds, string>;

function toAlertThresholdDraft(values: CancellationAlertThresholds): AlertThresholdDraft {
  return {
    high_rate_percent: String(values.high_rate_percent),
    high_impact_usd: String(values.high_impact_usd),
    late_cancellation_days: String(values.late_cancellation_days),
  };
}

const PencilIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const DisableIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M9 11v5m6-5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "No se pudo guardar el cambio.";
}
function scheduleLabel(row: StaffSchedule) {
  const shift = row.start_time && row.end_time ? `${row.start_time}–${row.end_time}` : "Turno pendiente";
  const rest = row.break_start && row.break_end ? ` · descanso ${row.break_start}–${row.break_end}` : "";
  return `${row.status === "published" ? "Publicado" : "Borrador"} · ${row.effective_from || "sin vigencia"} · ${row.weekdays.map((day) => days[day - 1]).join(", ")} · ${shift}${rest}`;
}
function currentSchedule(agent: StaffMember) {
  const published = agent.schedules.filter((row) => row.status === "published").sort((a, b) => (b.effective_from || "").localeCompare(a.effective_from || ""))[0];
  if (published) return scheduleLabel(published);
  return agent.schedules.length ? "Turno pendiente de publicar" : "Sin horario";
}

export default function CustomerAttentionStaff() {
  const [canEdit, setCanEdit] = useState(false);
  const [data, setData] = useState<StaffResponse | null>(null);
  const [mappings, setMappings] = useState<AgentMapping[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [person, setPerson] = useState({ name: "", team: "call" as StaffMember["team"], goto_agent_id: "" });
  const [schedule, setSchedule] = useState(blankSchedule);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [capacities, setCapacities] = useState<StaffResponse["capacities"]>({ call: null, chat: null, ticket: null });
  const [alertThresholdDraft, setAlertThresholdDraft] = useState<AlertThresholdDraft>({ high_rate_percent: "", high_impact_usd: "", late_cancellation_days: "" });
  const [loadingAlertThresholds, setLoadingAlertThresholds] = useState(true);
  const [hasAlertThresholds, setHasAlertThresholds] = useState(false);
  const [savingAlertThresholds, setSavingAlertThresholds] = useState(false);
  const [alertThresholdError, setAlertThresholdError] = useState("");
  const [alertThresholdMessage, setAlertThresholdMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<StaffMember | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selected = data?.staff.find((agent) => agent.id === selectedId) ?? null;
  const filteredStaff = useMemo(() => data?.staff.filter((agent) => {
    const matchesName = !search || agent.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesTeam = !teamFilter || agent.team === teamFilter;
    return matchesName && matchesTeam;
  }) ?? [], [data, search, teamFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const visibleStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

  const refresh = useCallback(async (signal: AbortSignal) => {
    const result = await customerAttentionService.staff(signal);
    if (signal.aborted) return;
    setData(result);
    setCapacities(result.capacities);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadingAlertThresholds(true);
    setAlertThresholdError("");
    Promise.allSettled([refresh(controller.signal), customerAttentionService.mappings(controller.signal), customerAttentionService.staffAccess(controller.signal)]).then(([staffResult, mappingsResult, permissionsResult]) => {
      if (controller.signal.aborted) return;
      if (staffResult.status === "rejected") setError(errorMessage(staffResult.reason));
      if (mappingsResult.status === "fulfilled") setMappings(mappingsResult.value);
      if (permissionsResult.status === "fulfilled") setCanEdit(permissionsResult.value.can_edit);
      setLoading(false);
    });
    cancellationStatisticsService.alertThresholds(controller.signal)
      .then((values) => {
        if (controller.signal.aborted) return;
        setAlertThresholdDraft(toAlertThresholdDraft(values));
        setHasAlertThresholds(true);
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setAlertThresholdError(errorMessage(caught));
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingAlertThresholds(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  function openCreate() {
    setSelectedId(null);
    setPerson({ name: "", team: "call", goto_agent_id: "" });
    setSchedule(blankSchedule);
    setEditingDraftId(null);
    setError(""); setMessage(""); setFormOpen(true);
  }
  function openEdit(agent: StaffMember) {
    setSelectedId(agent.id);
    setPerson({ name: agent.name, team: agent.team, goto_agent_id: agent.goto_agent_id || "" });
    setSchedule(blankSchedule);
    setEditingDraftId(null);
    setError(""); setMessage(""); setFormOpen(true);
  }
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      await action();
      await refresh(new AbortController().signal);
      setMessage(success);
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }
  async function saveAlertThresholds(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAlertThresholds(true);
    setAlertThresholdError("");
    setAlertThresholdMessage("");
    try {
      const saved = await cancellationStatisticsService.saveAlertThresholds({
        high_rate_percent: Number(alertThresholdDraft.high_rate_percent),
        high_impact_usd: Number(alertThresholdDraft.high_impact_usd),
        late_cancellation_days: Number(alertThresholdDraft.late_cancellation_days),
      });
      setAlertThresholdDraft(toAlertThresholdDraft(saved));
      setAlertThresholdMessage("Umbrales guardados.");
    } catch (caught) {
      setAlertThresholdError(errorMessage(caught));
    } finally {
      setSavingAlertThresholds(false);
    }
  }
  async function savePerson(event: React.FormEvent) {
    event.preventDefault();
    if (!person.name.trim()) { setError("Escribe el nombre del agente."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      if (selected) {
        await customerAttentionService.updateStaff(selected.id, { ...person, name: person.name.trim(), goto_agent_id: person.goto_agent_id || null });
        await refresh(new AbortController().signal);
        setMessage("Agente actualizado.");
      } else {
        const created = await customerAttentionService.createStaff({ ...person, name: person.name.trim(), goto_agent_id: person.goto_agent_id || null });
        await refresh(new AbortController().signal);
        setSelectedId(created.id);
        setPerson({ name: created.name, team: created.team, goto_agent_id: created.goto_agent_id || "" });
        setMessage("Agente creado. Ya puedes configurar sus horarios.");
      }
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }
  async function saveSchedule(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!schedule.weekdays.length) { setError("Selecciona al menos un día."); return; }
    if (Boolean(schedule.start_time) !== Boolean(schedule.end_time) || (schedule.start_time && schedule.end_time && schedule.start_time >= schedule.end_time)) { setError("El turno necesita inicio y fin válidos."); return; }
    if (Boolean(schedule.break_start) !== Boolean(schedule.break_end) || (schedule.break_start && schedule.break_end && schedule.break_start >= schedule.break_end)) { setError("El descanso necesita inicio y fin válidos."); return; }
    if (schedule.start_time && schedule.break_start && (schedule.break_start < schedule.start_time || schedule.break_end! > schedule.end_time!)) { setError("El descanso debe estar dentro del turno."); return; }
    if (schedule.status === "published" && (!schedule.effective_from || !schedule.start_time || !schedule.end_time)) { setError("Para publicar, indica fecha de vigencia y turno completo."); return; }
    if (schedule.status === "published" && selected.schedules.some((row) => row.status === "published" && row.effective_from && schedule.effective_from && row.effective_from <= schedule.effective_from) && !window.confirm("¿Publicar esta nueva versión? El horario anterior seguirá visible en el historial.")) return;
    await run(() => editingDraftId
      ? customerAttentionService.updateDraftSchedule(selected.id, editingDraftId, { ...schedule, effective_from: schedule.effective_from || null })
      : customerAttentionService.addSchedule(selected.id, { ...schedule, effective_from: schedule.effective_from || null }), "Horario guardado.");
    setEditingDraftId(null);
    setSchedule(blankSchedule);
  }
  function editSchedule(row: StaffSchedule) {
    setSchedule({ effective_from: row.effective_from || "", weekdays: [...row.weekdays], start_time: row.start_time, end_time: row.end_time, break_start: row.break_start, break_end: row.break_end, status: row.status === "published" ? "draft" : row.status });
    setEditingDraftId(row.status === "draft" ? row.id : null);
    setMessage(row.status === "published" ? "Se creará una nueva versión; el horario anterior seguirá en el historial." : "Editando borrador.");
  }
  async function toggleActive(agent: StaffMember) {
    await run(() => agent.active ? customerAttentionService.deactivateStaff(agent.id) : customerAttentionService.updateStaff(agent.id, { active: true }), agent.active ? "Agente desactivado; sus horarios se conservaron." : "Agente reactivado.");
    setDeactivating(null);
  }
  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearch(searchInput); setTeamFilter(teamInput); setPage(1);
  }

  return <>
    <PageMeta title="Equipo y horarios | Pronto Connect" description="Administración de agentes y horarios" />
    <PageBreadcrumb pageTitle="Equipo y horarios" />
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Equipo y horarios" desc="Administra el padrón operativo, los turnos y su cobertura en hora de Florida (America/New_York). Los borradores no cuentan como cobertura publicada.">
        <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05] sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1"><Label htmlFor="staff-search">Agente</Label><input id="staff-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nombre" className={`${inputClass} w-full sm:w-64`} /></div>
            <div className="flex flex-col gap-1"><Label htmlFor="staff-team-filter">Equipo</Label><select id="staff-team-filter" value={teamInput} onChange={(event) => setTeamInput(event.target.value)} className={`${inputClass} w-full sm:w-52`}><option value="">Todos los equipos</option><option value="call">Llamadas</option><option value="chat_ticket">Chats</option></select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-gray-500 dark:text-gray-400">Mostrar</span><select aria-label="Filas por página" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className={`${inputClass} w-20`}>{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
            <button type="submit" className={buttonClass}>Buscar</button>
            {canEdit && <button type="button" onClick={openCreate} className="h-9 rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 sm:ml-auto">+ Nuevo agente</button>}
          </form>
          {error && !formOpen && <div role="alert" className="m-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          {message && !formOpen && <div role="status" className="m-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            {loading ? <div role="status" className="py-16 text-center text-sm text-gray-500">Cargando equipo…</div> : <Table>
              <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]"><TableRow>{["Agente", "Equipo", "Horario vigente", "Estado", "Acciones"].map((label) => <TableCell key={label} isHeader className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{label}</p></TableCell>)}</TableRow></TableHeader>
              <TableBody>
                {visibleStaff.length === 0 ? <TableRow><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No se encontraron agentes para esos filtros.</td></TableRow> : visibleStaff.map((agent) => <TableRow key={agent.id}>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-theme-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">{agent.name}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{agent.team === "call" ? "Llamadas" : "Chats"}</TableCell>
                  <TableCell className="min-w-[260px] border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{currentSchedule(agent)}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{agent.active ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]"><div className="flex items-center justify-center gap-1">{canEdit && <><button type="button" onClick={() => openEdit(agent)} title={`Editar ${agent.name}`} aria-label={`Editar ${agent.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"><PencilIcon /></button><button type="button" onClick={() => setDeactivating(agent)} title={agent.active ? `Desactivar ${agent.name}` : `Reactivar ${agent.name}`} aria-label={agent.active ? `Desactivar ${agent.name}` : `Reactivar ${agent.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"><DisableIcon /></button></>}</div></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>}
          </div>
          {!loading && filteredStaff.length > 0 && <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]"><div className="flex flex-col xl:flex-row xl:items-center xl:justify-between"><p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filteredStaff.length)} de {filteredStaff.length} agentes</p><PaginationWithIcon key={`${page}-${totalPages}`} totalPages={totalPages} initialPage={page} onPageChange={setPage} /></div></div>}
        </div>
      </ComponentCard>

      <ComponentCard title="Capacidad por agente y hora" desc="Se usa para estimar agentes a partir de la demanda histórica. Deja un canal vacío para indicar que falta configurarlo.">
        <form onSubmit={(event) => { event.preventDefault(); void run(() => customerAttentionService.saveCapacities(capacities), "Capacidades guardadas."); }} className="flex flex-wrap items-end gap-4">
          {(["call", "chat"] as const).map((channel) => <label key={channel} className="text-sm">{channel === "call" ? "Llamadas" : "Chats"}<input type="number" min="0.001" max="10000" step="0.001" disabled={!canEdit} className={`${inputClass} mt-1 block w-full`} value={capacities[channel] ?? ""} onChange={(event) => setCapacities({ ...capacities, [channel]: event.target.value ? Number(event.target.value) : null })} /></label>)}
          {canEdit && <button disabled={busy} className={buttonClass}>Guardar capacidades</button>}
        </form>
      </ComponentCard>

      <ComponentCard title="Umbrales de alertas de cancelación" desc="Configura los valores que determinan tasa alta, impacto alto y cancelación tardía. También se usan en el filtro Enfoque de Orden vs cancelación.">
        <form onSubmit={saveAlertThresholds} className="flex flex-wrap items-end gap-4">
          <label className="text-sm">Tasa alta (%)<input type="number" required min="0.001" max="1000" step="0.001" disabled={!canEdit || !hasAlertThresholds || loadingAlertThresholds || savingAlertThresholds} className={`${inputClass} mt-1 block w-full sm:w-40`} value={alertThresholdDraft.high_rate_percent} onChange={(event) => setAlertThresholdDraft({ ...alertThresholdDraft, high_rate_percent: event.target.value })} /></label>
          <label className="text-sm">Impacto alto (USD)<input type="number" required min="0.01" max="999999999999.999" step="0.01" disabled={!canEdit || !hasAlertThresholds || loadingAlertThresholds || savingAlertThresholds} className={`${inputClass} mt-1 block w-full sm:w-48`} value={alertThresholdDraft.high_impact_usd} onChange={(event) => setAlertThresholdDraft({ ...alertThresholdDraft, high_impact_usd: event.target.value })} /></label>
          <label className="text-sm">Cancelación tardía (días)<input type="number" required min="1" max="3650" step="1" disabled={!canEdit || !hasAlertThresholds || loadingAlertThresholds || savingAlertThresholds} className={`${inputClass} mt-1 block w-full sm:w-48`} value={alertThresholdDraft.late_cancellation_days} onChange={(event) => setAlertThresholdDraft({ ...alertThresholdDraft, late_cancellation_days: event.target.value })} /></label>
          {canEdit && <button disabled={!hasAlertThresholds || loadingAlertThresholds || savingAlertThresholds} className={buttonClass}>{savingAlertThresholds ? "Guardando…" : "Guardar umbrales"}</button>}
          {loadingAlertThresholds && <p role="status" className="w-full text-sm text-gray-500">Cargando umbrales…</p>}
          {alertThresholdMessage && <p role="status" className="w-full text-sm text-green-700 dark:text-green-400">{alertThresholdMessage}</p>}
          {alertThresholdError && <p role="alert" className="w-full text-sm text-red-600">{alertThresholdError}</p>}
        </form>
      </ComponentCard>
    </div>

    <Modal isOpen={formOpen} onClose={() => { if (!busy) { setFormOpen(false); setError(""); setMessage(""); } }} className="relative max-h-[90vh] w-full max-w-[1000px] overflow-y-auto rounded-3xl bg-white p-6 sm:m-0 lg:p-8 dark:bg-gray-900">
      <h2 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">{selected ? `Editar agente: ${selected.name}` : "Nuevo agente"}</h2>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">El vínculo con el mapeo de estadísticas es opcional. Los cambios de horario conservan versiones anteriores.</p>
      <form onSubmit={savePerson} className="grid gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-3">
        <label className="text-sm">Nombre<input required maxLength={100} className={`${inputClass} mt-1 w-full`} value={person.name} onChange={(event) => setPerson({ ...person, name: event.target.value })} /></label>
        <label className="text-sm">Equipo<select className={`${inputClass} mt-1 w-full`} value={person.team} onChange={(event) => setPerson({ ...person, team: event.target.value as StaffMember["team"] })}><option value="call">Llamadas</option><option value="chat_ticket">Chats</option></select></label>
        <label className="text-sm">Vínculo con GoTo<select className={`${inputClass} mt-1 w-full`} value={person.goto_agent_id} onChange={(event) => setPerson({ ...person, goto_agent_id: event.target.value })}><option value="">Sin vínculo</option>{mappings.filter((mapping) => Boolean(Number(mapping.active))).map((mapping) => <option key={mapping.goto_agent_id} value={mapping.goto_agent_id}>{mapping.goto_agent_id}</option>)}</select></label>
        <div className="flex justify-end sm:col-span-3"><button disabled={busy} className={buttonClass}>{busy ? "Guardando…" : selected ? "Guardar agente" : "Crear agente"}</button></div>
      </form>
      {selected && <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h3 className="mb-3 font-medium text-gray-800 dark:text-white/90">Historial de horarios</h3>
          {selected.team === "call" && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Turnos objetivo de llamadas: 08:30–17:30 (4 agentes), 09:00–18:00 (2) y 09:30–18:30 (1).</p>}
          {selected.schedules.length ? <ol className="max-h-56 space-y-2 overflow-y-auto text-sm">{selected.schedules.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"><span>{scheduleLabel(row)}</span>{canEdit && <button type="button" className="text-brand-600 underline dark:text-brand-400" onClick={() => editSchedule(row)}>{row.status === "draft" ? "Editar borrador" : "Nueva versión"}</button>}</li>)}</ol> : <p className="text-sm text-gray-500">Este agente todavía no tiene horarios.</p>}
        </section>
        {canEdit && <form onSubmit={saveSchedule} className="space-y-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h3 className="font-medium text-gray-800 dark:text-white/90">{editingDraftId ? "Editar borrador" : "Agregar horario"}</h3>
          {selected.team === "call" && <label className="block text-sm">Aplicar turno sugerido<select className={`${inputClass} mt-1 w-full`} value="" onChange={(event) => { const [start_time, end_time] = event.target.value.split("|"); if (start_time && end_time) setSchedule({ ...schedule, start_time, end_time }); }}><option value="">Seleccionar horario</option><option value="08:30|17:30">08:30–17:30 (4 agentes)</option><option value="09:00|18:00">09:00–18:00 (2 agentes)</option><option value="09:30|18:30">09:30–18:30 (1 agente)</option></select></label>}
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Vigente desde<input type="date" className={`${inputClass} mt-1 w-full`} value={schedule.effective_from || ""} onChange={(event) => setSchedule({ ...schedule, effective_from: event.target.value })} /></label><label className="text-sm">Estado<select className={`${inputClass} mt-1 w-full`} value={schedule.status} onChange={(event) => setSchedule({ ...schedule, status: event.target.value as StaffSchedule["status"] })}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label><label className="text-sm">Inicio<input type="time" step={1800} className={`${inputClass} mt-1 w-full`} value={schedule.start_time || ""} onChange={(event) => setSchedule({ ...schedule, start_time: event.target.value || null })} /></label><label className="text-sm">Fin<input type="time" step={1800} className={`${inputClass} mt-1 w-full`} value={schedule.end_time || ""} onChange={(event) => setSchedule({ ...schedule, end_time: event.target.value || null })} /></label><label className="text-sm">Descanso desde<input type="time" step={1800} className={`${inputClass} mt-1 w-full`} value={schedule.break_start || ""} onChange={(event) => setSchedule({ ...schedule, break_start: event.target.value || null })} /></label><label className="text-sm">Descanso hasta<input type="time" step={1800} className={`${inputClass} mt-1 w-full`} value={schedule.break_end || ""} onChange={(event) => setSchedule({ ...schedule, break_end: event.target.value || null })} /></label></div>
          <fieldset><legend className="mb-2 text-sm">Días de la semana</legend><div className="flex flex-wrap gap-3">{days.map((label, index) => <label key={index} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={schedule.weekdays.includes(index + 1)} onChange={() => setSchedule({ ...schedule, weekdays: schedule.weekdays.includes(index + 1) ? schedule.weekdays.filter((day) => day !== index + 1) : [...schedule.weekdays, index + 1].sort() })} />{label}</label>)}</div></fieldset>
          {message && <p role="status" className="text-xs text-green-700">{message}</p>}{error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2"><button type="button" className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700" onClick={() => { setSchedule(blankSchedule); setEditingDraftId(null); }}>Limpiar</button><button disabled={busy} className={buttonClass}>{busy ? "Guardando…" : "Guardar horario"}</button></div>
        </form>}
      </div>}
      {error && <div role="alert" className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
      {message && <div role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => { setFormOpen(false); setError(""); setMessage(""); }} disabled={busy} className="h-9 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">Cerrar</button></div>
    </Modal>
    <ConfirmModal isOpen={!!deactivating} onClose={() => setDeactivating(null)} onConfirm={() => deactivating && void toggleActive(deactivating)} title={deactivating?.active ? "¿Desactivar agente?" : "¿Reactivar agente?"} message={deactivating?.active ? `Se desactivará a ${deactivating.name}. Sus horarios publicados y el historial se conservarán.` : `Se reactivará a ${deactivating?.name}. Sus horarios anteriores se mantienen.`} confirmLabel={deactivating?.active ? "Desactivar" : "Reactivar"} confirming={busy} error={error || null} />
  </>;
}
