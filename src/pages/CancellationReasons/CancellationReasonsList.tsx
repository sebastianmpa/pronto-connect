import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Switch from "../../components/form/switch/Switch";
import { Modal } from "../../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import ConfirmModal from "../../components/common/ConfirmModal";
import cancellationReasonsService from "../../lib/cancellation-reasons/cancellationReasonsService";
import type { CancellationReason, CancellationSubReason } from "../../lib/cancellation-reasons/types";

const inputClass = "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface DraftSubReason {
  key: number;
  reasonName: string;
  description: string | null;
  isActive: boolean;
}

export default function CancellationReasonsList() {
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonName, setReasonName] = useState("");
  const [reasonDescription, setReasonDescription] = useState("");
  const [reasonActive, setReasonActive] = useState(true);
  const [editingReasonId, setEditingReasonId] = useState("");
  const [reasonFormOpen, setReasonFormOpen] = useState(false);
  const [reasonFormError, setReasonFormError] = useState<string | null>(null);
  const [reasonFormNotice, setReasonFormNotice] = useState<string | null>(null);
  const [subReasonName, setSubReasonName] = useState("");
  const [subReasonDescription, setSubReasonDescription] = useState("");
  const [subReasonActive, setSubReasonActive] = useState(true);
  const [editingSubReasonId, setEditingSubReasonId] = useState("");
  const [subReasonFormOpen, setSubReasonFormOpen] = useState(false);
  const [subReasonFormError, setSubReasonFormError] = useState<string | null>(null);
  const [draftSubReasons, setDraftSubReasons] = useState<DraftSubReason[]>([]);
  const [editingDraftKey, setEditingDraftKey] = useState<number | null>(null);
  const nextDraftKey = useRef(0);
  const [deletingReason, setDeletingReason] = useState<CancellationReason | null>(null);
  const [deletingSubReason, setDeletingSubReason] = useState<CancellationSubReason | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reasonSearchInput, setReasonSearchInput] = useState("");
  const [reasonSearch, setReasonSearch] = useState("");
  const [activeFilterInput, setActiveFilterInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const loadRequestId = useRef(0);

  const editingReason = reasons.find((reason) => reason.id === editingReasonId) ?? null;
  const filteredReasons = useMemo(() => reasons.filter((reason) => {
    const matchesName = !reasonSearch || reason.id === reasonSearch;
    const matchesStatus = !activeFilter || String(reason.isActive) === activeFilter;
    return matchesName && matchesStatus;
  }), [reasons, reasonSearch, activeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredReasons.length / pageSize));
  const visibleReasons = filteredReasons.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const loadReasons = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const records = await cancellationReasonsService.getAll();
      if (requestId === loadRequestId.current) setReasons(records);
    } catch {
      if (requestId === loadRequestId.current) setError("Could not load cancellation reasons. Please try again.");
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReasons(); }, [loadReasons]);

  const saveReason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (subReasonFormOpen) return setReasonFormError("Add or cancel the open sub-reason first.");
    if (!reasonName.trim()) return setReasonFormError("Enter a reason name.");
    setSaving(true);
    setReasonFormError(null);
    setReasonFormNotice(null);
    try {
      const payload = { reasonName: reasonName.trim(), description: reasonDescription.trim() || null, isActive: reasonActive };
      let reasonId = editingReasonId;
      let createdReason: CancellationReason | null = null;
      const createdSubReasons: CancellationSubReason[] = [];
      if (editingReasonId) {
        await cancellationReasonsService.update(editingReasonId, payload);
      } else {
        createdReason = await cancellationReasonsService.create(payload);
        reasonId = createdReason.id;
        setEditingReasonId(createdReason.id);
      }
      let savedDrafts = 0;
      for (const draft of draftSubReasons) {
        try {
          const createdSubReason = await cancellationReasonsService.createSubReason(reasonId, {
            reasonName: draft.reasonName,
            description: draft.description,
            isActive: draft.isActive,
          });
          createdSubReasons.push(createdSubReason);
          savedDrafts += 1;
        } catch {
          setDraftSubReasons(draftSubReasons.slice(savedDrafts));
          setReasonFormError("The reason was saved, but some sub-reasons could not be saved. Check the pending items and save again.");
          await loadReasons();
          return;
        }
      }
      setDraftSubReasons([]);
      setReasonFormNotice(editingReasonId ? "Reason saved." : "Reason and sub-reasons created. You can add more below.");
      if (createdReason) {
        const savedReason = createdReason;
        // Keep the newly created reason visible even if an earlier list request is still in flight.
        loadRequestId.current += 1;
        setReasons((current) => [
          ...current.filter((reason) => reason.id !== savedReason.id),
          { ...savedReason, subReasons: [...(savedReason.subReasons ?? []), ...createdSubReasons] },
        ]);
        setReasonSearchInput("");
        setReasonSearch("");
        setActiveFilterInput("");
        setActiveFilter("");
        setPage(1);
        setLoading(false);
      } else {
        await loadReasons();
      }
    } catch {
      setReasonFormError("Could not save the cancellation reason. Check that its name is unique.");
    } finally {
      setSaving(false);
    }
  };

  const editReason = (reason: CancellationReason) => {
    setEditingReasonId(reason.id);
    setReasonName(reason.reasonName);
    setReasonDescription(reason.description ?? "");
    setReasonActive(reason.isActive);
    setReasonFormError(null);
    setReasonFormNotice(null);
    resetSubReasonForm();
    setReasonFormOpen(true);
  };

  const removeReason = async (reason: CancellationReason) => {
    setSaving(true);
    setDeleteError(null);
    try {
      await cancellationReasonsService.remove(reason.id);
      if (editingReasonId === reason.id) resetReasonForm();
      await loadReasons();
      setDeletingReason(null);
    } catch {
      setDeleteError("Could not delete the cancellation reason.");
    } finally {
      setSaving(false);
    }
  };

  const saveSubReason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subReasonName.trim()) return setSubReasonFormError("Enter a sub-reason name.");
    if (draftSubReasons.some((draft) => draft.key !== editingDraftKey && draft.reasonName.toLowerCase() === subReasonName.trim().toLowerCase())) {
      return setSubReasonFormError("A sub-reason with this name is already pending.");
    }
    if (editingReason?.subReasons.some((item) => item.id !== editingSubReasonId && item.reasonName.toLowerCase() === subReasonName.trim().toLowerCase())) {
      return setSubReasonFormError("A sub-reason with this name already exists.");
    }
    if (!editingReasonId || editingDraftKey !== null) {
      const draft = {
        reasonName: subReasonName.trim(),
        description: subReasonDescription.trim() || null,
        isActive: subReasonActive,
      };
      if (editingDraftKey === null) {
        const key = ++nextDraftKey.current;
        setDraftSubReasons((current) => [...current, { key, ...draft }]);
      } else {
        setDraftSubReasons((current) => current.map((item) => item.key === editingDraftKey ? { ...item, ...draft } : item));
      }
      setReasonFormError(null);
      resetSubReasonForm();
      return;
    }
    setSaving(true);
    setSubReasonFormError(null);
    try {
      const payload = { reasonName: subReasonName.trim(), description: subReasonDescription.trim() || null, isActive: subReasonActive };
      if (editingSubReasonId) await cancellationReasonsService.updateSubReason(editingReasonId, editingSubReasonId, payload);
      else await cancellationReasonsService.createSubReason(editingReasonId, payload);
      resetSubReasonForm();
      setReasonFormNotice(null);
      await loadReasons();
    } catch {
      setSubReasonFormError("Could not save the sub-reason. Check that its name is unique for this reason.");
    } finally {
      setSaving(false);
    }
  };

  const editSubReason = (subReason: CancellationSubReason) => {
    setEditingDraftKey(null);
    setEditingSubReasonId(subReason.id);
    setSubReasonName(subReason.reasonName);
    setSubReasonDescription(subReason.description ?? "");
    setSubReasonActive(subReason.isActive);
    setSubReasonFormError(null);
    setSubReasonFormOpen(true);
  };

  const editDraftSubReason = (draft: DraftSubReason) => {
    setEditingDraftKey(draft.key);
    setEditingSubReasonId("");
    setSubReasonName(draft.reasonName);
    setSubReasonDescription(draft.description ?? "");
    setSubReasonActive(draft.isActive);
    setSubReasonFormError(null);
    setSubReasonFormOpen(true);
  };

  const toggleReason = async (reason: CancellationReason, nextActive: boolean) => {
    setSaving(true);
    setError(null);
    setReasons((current) => current.map((item) => item.id === reason.id ? { ...item, isActive: nextActive } : item));
    try {
      await cancellationReasonsService.update(reason.id, { isActive: nextActive });
      await loadReasons();
    } catch {
      setReasons((current) => current.map((item) => item.id === reason.id ? { ...item, isActive: reason.isActive } : item));
      setError("Could not update the cancellation reason status.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubReason = async (subReason: CancellationSubReason, nextActive: boolean) => {
    if (!editingReasonId) return;
    setSaving(true);
    setError(null);
    setReasons((current) => current.map((reason) => reason.id === editingReasonId ? {
      ...reason,
      subReasons: (reason.subReasons ?? []).map((item) => item.id === subReason.id ? { ...item, isActive: nextActive } : item),
    } : reason));
    try {
      await cancellationReasonsService.updateSubReason(editingReasonId, subReason.id, { isActive: nextActive });
      await loadReasons();
    } catch {
      setReasons((current) => current.map((reason) => reason.id === editingReasonId ? {
        ...reason,
        subReasons: (reason.subReasons ?? []).map((item) => item.id === subReason.id ? { ...item, isActive: subReason.isActive } : item),
      } : reason));
      setError("Could not update the sub-reason status.");
    } finally {
      setSaving(false);
    }
  };

  const removeSubReason = async (subReason: CancellationSubReason) => {
    if (!editingReasonId) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await cancellationReasonsService.removeSubReason(editingReasonId, subReason.id);
      if (editingSubReasonId === subReason.id) resetSubReasonForm();
      await loadReasons();
      setDeletingSubReason(null);
    } catch {
      setDeleteError("Could not delete the sub-reason.");
    } finally {
      setSaving(false);
    }
  };

  const resetReasonForm = () => { setEditingReasonId(""); setReasonName(""); setReasonDescription(""); setReasonActive(true); setReasonFormError(null); setReasonFormNotice(null); setReasonFormOpen(false); setDraftSubReasons([]); resetSubReasonForm(); };
  const resetSubReasonForm = () => { setEditingSubReasonId(""); setEditingDraftKey(null); setSubReasonName(""); setSubReasonDescription(""); setSubReasonActive(true); setSubReasonFormError(null); setSubReasonFormOpen(false); };

  const openCreateReason = () => {
    resetReasonForm();
    setError(null);
    setReasonFormOpen(true);
  };

  const openCreateSubReason = () => {
    resetSubReasonForm();
    setError(null);
    setSubReasonFormOpen(true);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReasonSearch(reasonSearchInput);
    setActiveFilter(activeFilterInput);
    setPage(1);
  };

  return (
    <>
      <PageMeta title="Cancellation Reasons | Pronto Connect" description="Manage cancellation reasons and sub-reasons" />
      <PageBreadcrumb pageTitle="Cancellation Reasons" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Cancellation Reasons and Sub-reasons">
          <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
          {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          <Modal isOpen={reasonFormOpen} onClose={() => { if (!saving) resetReasonForm(); }} className="relative w-full max-w-[760px] rounded-3xl bg-white p-6 sm:m-0 lg:p-8 dark:bg-gray-900">
            <div>
              <h4 className="mb-1 pr-12 text-title-sm font-semibold text-gray-800 dark:text-white/90">{editingReasonId ? "Edit Cancellation Reason" : "New Cancellation Reason"}</h4>
              <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Manage the reason and its sub-reasons in one place.</p>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
                <form id="cancellation-reason-form" onSubmit={saveReason} className="space-y-4">
                  {reasonFormError && <div role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{reasonFormError}</div>}
                  {reasonFormNotice && <div role="status" className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">{reasonFormNotice}</div>}
                  <div><Label>Reason name</Label><Input value={reasonName} onChange={(event) => setReasonName(event.target.value)} placeholder="Reason name" disabled={saving} /></div>
                  <div><Label>Description</Label><TextArea rows={3} value={reasonDescription} onChange={setReasonDescription} placeholder="Optional description" disabled={saving} /></div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={reasonActive} onChange={(event) => setReasonActive(event.target.checked)} disabled={saving} /> Active</label>
                </form>

                <section className="border-t border-gray-100 pt-5 dark:border-gray-800">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h5 className="font-medium text-gray-800 dark:text-white/90">Sub-reasons</h5><p className="text-sm text-gray-500 dark:text-gray-400">{draftSubReasons.length > 0 ? "Pending sub-reasons will be saved with Save reason." : editingReasonId ? "Sub-reason changes save when you add or edit them." : "Add sub-reasons now; they will be saved with the reason."}</p></div>
                    <button type="button" onClick={openCreateSubReason} disabled={saving} className="h-9 rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-500/10">+ New Sub-reason</button>
                  </div>

                    {subReasonFormOpen && <form onSubmit={saveSubReason} className="mb-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                      <h6 className="text-sm font-medium text-gray-800 dark:text-white/90">{editingSubReasonId || editingDraftKey !== null ? "Edit sub-reason" : "New sub-reason"}</h6>
                      {subReasonFormError && <div role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{subReasonFormError}</div>}
                      <div><Label>Sub-reason name</Label><Input value={subReasonName} onChange={(event) => setSubReasonName(event.target.value)} placeholder="Sub-reason name" disabled={saving} /></div>
                      <div><Label>Description</Label><TextArea rows={2} value={subReasonDescription} onChange={setSubReasonDescription} placeholder="Optional description" disabled={saving} /></div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={subReasonActive} onChange={(event) => setSubReasonActive(event.target.checked)} disabled={saving} /> Active</label>
                      <div className="flex justify-end gap-2"><button type="button" onClick={resetSubReasonForm} disabled={saving} className="h-9 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">Cancel</button><button type="submit" disabled={saving} className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 disabled:opacity-50">{saving ? "Saving…" : editingSubReasonId || editingDraftKey !== null ? "Save sub-reason" : "Add sub-reason"}</button></div>
                    </form>}
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                      {(editingReason?.subReasons ?? []).length === 0 && draftSubReasons.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-500">No sub-reasons configured yet.</p>}
                      {draftSubReasons.map((draft) => <div key={`draft-${draft.key}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-800 dark:text-white/90">{draft.reasonName} <span className="ml-2 text-xs font-normal text-gray-500">Pending save</span></p>{draft.description && <p className="truncate text-xs text-gray-500">{draft.description}</p>}</div>
                        <Switch key={`${draft.key}-${draft.isActive}`} defaultChecked={draft.isActive} disabled={saving} onChange={(checked) => setDraftSubReasons((current) => current.map((item) => item.key === draft.key ? { ...item, isActive: checked } : item))} />
                        <button type="button" disabled={saving} onClick={() => editDraftSubReason(draft)} aria-label={`Edit ${draft.reasonName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:opacity-50 dark:hover:bg-brand-500/10"><PencilIcon /></button>
                        <button type="button" disabled={saving} onClick={() => { if (editingDraftKey === draft.key) resetSubReasonForm(); setDraftSubReasons((current) => current.filter((item) => item.key !== draft.key)); }} aria-label={`Remove ${draft.reasonName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"><TrashIcon /></button>
                      </div>)}
                      {(editingReason?.subReasons ?? []).map((subReason) => <div key={subReason.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-800 dark:text-white/90">{subReason.reasonName}</p>{subReason.description && <p className="truncate text-xs text-gray-500">{subReason.description}</p>}</div>
                        <Switch key={`${subReason.id}-${subReason.isActive}`} defaultChecked={subReason.isActive} disabled={saving} onChange={(checked) => void toggleSubReason(subReason, checked)} />
                        <button type="button" disabled={saving} onClick={() => editSubReason(subReason)} aria-label={`Edit ${subReason.reasonName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:opacity-50 dark:hover:bg-brand-500/10"><PencilIcon /></button>
                        <button type="button" disabled={saving} onClick={() => { setDeletingSubReason(subReason); setDeleteError(null); }} aria-label={`Delete ${subReason.reasonName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"><TrashIcon /></button>
                      </div>)}
                    </div>
                </section>
              </div>
              <div className="mt-6 flex w-full flex-col items-center justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row dark:border-gray-800">
                <button type="button" onClick={resetReasonForm} disabled={saving} className="h-11 w-full rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]">{editingReasonId && draftSubReasons.length === 0 ? "Close" : "Cancel"}</button>
                <button type="submit" form="cancellation-reason-form" disabled={saving || subReasonFormOpen} className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:opacity-50">{saving ? "Saving…" : editingReasonId ? "Save reason" : "Create reason"}</button>
              </div>
              {subReasonFormOpen && <p className="mt-2 text-right text-xs text-gray-500">Add or cancel the open sub-reason before saving the reason.</p>}
            </div>
          </Modal>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05] sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1"><Label htmlFor="reason-search">Reason</Label><select id="reason-search" value={reasonSearchInput} onChange={(event) => setReasonSearchInput(event.target.value)} className={`${inputClass} w-full sm:w-64`}><option value="">All reasons</option>{reasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.reasonName}</option>)}</select></div>
            <div className="flex flex-col gap-1"><Label htmlFor="reason-status-filter">Status</Label><select id="reason-status-filter" value={activeFilterInput} onChange={(event) => setActiveFilterInput(event.target.value)} className={`${inputClass} w-full sm:w-40`}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
            <div className="flex items-center gap-2"><span className="text-sm text-gray-500 dark:text-gray-400">Show</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className={`${inputClass} w-20`}>{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
            <button type="submit" className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600">Search</button>
            <button type="button" onClick={openCreateReason} className="h-9 rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 sm:ml-auto">+ New Reason</button>
          </form>

          <div className="max-w-full overflow-x-auto custom-scrollbar">
            {loading ? <div className="flex items-center justify-center py-16"><svg className="h-8 w-8 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg></div> : <Table>
              <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]"><TableRow>{["Reason", "Description", "Sub-reasons", "Active", ""].map((label) => <TableCell key={label} isHeader className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{label}</p></TableCell>)}</TableRow></TableHeader>
              <TableBody>
                {visibleReasons.length === 0 ? <TableRow><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No cancellation reasons found for the selected filters.</td></TableRow> : visibleReasons.map((reason) => <TableRow key={reason.id}>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-theme-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90"><button type="button" onClick={() => editReason(reason)} className="text-left hover:text-brand-600 dark:hover:text-brand-400">{reason.reasonName}</button></TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400"><span className="line-clamp-1 max-w-sm">{reason.description || "—"}</span></TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{reason.subReasons?.length ?? 0}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"><Switch key={`${reason.id}-${reason.isActive}`} defaultChecked={reason.isActive} disabled={saving} onChange={(checked) => void toggleReason(reason, checked)} /></TableCell>
                  <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]"><div className="flex items-center justify-center gap-1"><button type="button" onClick={() => editReason(reason)} title="Edit cancellation reason" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"><PencilIcon /></button><button type="button" disabled={saving} onClick={() => { setDeletingReason(reason); setDeleteError(null); }} title="Delete cancellation reason" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"><TrashIcon /></button></div></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>}
          </div>

          {!loading && filteredReasons.length > 0 && <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
              <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredReasons.length)} of {filteredReasons.length} entries</p>
              <PaginationWithIcon key={`${page}-${totalPages}`} totalPages={totalPages} initialPage={page} onPageChange={setPage} />
            </div>
          </div>}

          <ConfirmModal isOpen={!!deletingReason || !!deletingSubReason} onClose={() => { setDeletingReason(null); setDeletingSubReason(null); }} onConfirm={() => { if (deletingReason) void removeReason(deletingReason); else if (deletingSubReason) void removeSubReason(deletingSubReason); }} title={deletingReason ? "Delete cancellation reason?" : "Delete sub-reason?"} message={deletingReason ? `This will permanently delete "${deletingReason.reasonName}" and its sub-reasons.` : `This will permanently delete "${deletingSubReason?.reasonName}".`} confirming={saving} error={deleteError} />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
