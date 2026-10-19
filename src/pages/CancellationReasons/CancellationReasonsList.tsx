import { useCallback, useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import cancellationReasonsService from "../../lib/cancellation-reasons/cancellationReasonsService";
import type { CancellationReason, CancellationSubReason } from "../../lib/cancellation-reasons/types";

const buttonClass = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export default function CancellationReasonsList() {
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonName, setReasonName] = useState("");
  const [reasonDescription, setReasonDescription] = useState("");
  const [reasonActive, setReasonActive] = useState(true);
  const [editingReasonId, setEditingReasonId] = useState("");
  const [subReasonName, setSubReasonName] = useState("");
  const [subReasonDescription, setSubReasonDescription] = useState("");
  const [subReasonActive, setSubReasonActive] = useState(true);
  const [editingSubReasonId, setEditingSubReasonId] = useState("");

  const selectedReason = reasons.find((reason) => reason.id === selectedId) ?? null;

  const loadReasons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await cancellationReasonsService.getAll();
      setReasons(records);
      setSelectedId((current) => records.some((reason) => reason.id === current) ? current : records[0]?.id ?? "");
    } catch {
      setError("Could not load cancellation reasons. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReasons(); }, [loadReasons]);

  const saveReason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reasonName.trim()) return setError("Enter a reason name.");
    setSaving(true);
    setError(null);
    try {
      const payload = { reasonName: reasonName.trim(), description: reasonDescription.trim() || null, isActive: reasonActive };
      if (editingReasonId) await cancellationReasonsService.update(editingReasonId, payload);
      else await cancellationReasonsService.create(payload);
      setReasonName("");
      setReasonDescription("");
      setEditingReasonId("");
      await loadReasons();
    } catch {
      setError("Could not save the cancellation reason. Check that its name is unique.");
    } finally {
      setSaving(false);
    }
  };

  const editReason = (reason: CancellationReason) => {
    setSelectedId(reason.id);
    setEditingReasonId(reason.id);
    setReasonName(reason.reasonName);
    setReasonDescription(reason.description ?? "");
    setReasonActive(reason.isActive);
  };

  const removeReason = async (reason: CancellationReason) => {
    if (!window.confirm(`Delete “${reason.reasonName}” and its sub-reasons?`)) return;
    setSaving(true);
    setError(null);
    try {
      await cancellationReasonsService.remove(reason.id);
      if (editingReasonId === reason.id) resetReasonForm();
      await loadReasons();
    } catch {
      setError("Could not delete the cancellation reason.");
    } finally {
      setSaving(false);
    }
  };

  const saveSubReason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedReason) return setError("Select a cancellation reason first.");
    if (!subReasonName.trim()) return setError("Enter a sub-reason name.");
    setSaving(true);
    setError(null);
    try {
      const payload = { reasonName: subReasonName.trim(), description: subReasonDescription.trim() || null, isActive: subReasonActive };
      if (editingSubReasonId) await cancellationReasonsService.updateSubReason(selectedReason.id, editingSubReasonId, payload);
      else await cancellationReasonsService.createSubReason(selectedReason.id, payload);
      resetSubReasonForm();
      await loadReasons();
    } catch {
      setError("Could not save the sub-reason. Check that its name is unique for this reason.");
    } finally {
      setSaving(false);
    }
  };

  const editSubReason = (subReason: CancellationSubReason) => {
    setEditingSubReasonId(subReason.id);
    setSubReasonName(subReason.reasonName);
    setSubReasonDescription(subReason.description ?? "");
    setSubReasonActive(subReason.isActive);
  };

  const toggleReason = async (reason: CancellationReason) => {
    setSaving(true);
    setError(null);
    try {
      await cancellationReasonsService.update(reason.id, { isActive: !reason.isActive });
      await loadReasons();
    } catch {
      setError("Could not update the cancellation reason status.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubReason = async (subReason: CancellationSubReason) => {
    if (!selectedReason) return;
    setSaving(true);
    setError(null);
    try {
      await cancellationReasonsService.updateSubReason(selectedReason.id, subReason.id, { isActive: !subReason.isActive });
      await loadReasons();
    } catch {
      setError("Could not update the sub-reason status.");
    } finally {
      setSaving(false);
    }
  };

  const removeSubReason = async (subReason: CancellationSubReason) => {
    if (!selectedReason || !window.confirm(`Delete “${subReason.reasonName}”?`)) return;
    setSaving(true);
    setError(null);
    try {
      await cancellationReasonsService.removeSubReason(selectedReason.id, subReason.id);
      if (editingSubReasonId === subReason.id) resetSubReasonForm();
      await loadReasons();
    } catch {
      setError("Could not delete the sub-reason.");
    } finally {
      setSaving(false);
    }
  };

  const resetReasonForm = () => { setEditingReasonId(""); setReasonName(""); setReasonDescription(""); setReasonActive(true); };
  const resetSubReasonForm = () => { setEditingSubReasonId(""); setSubReasonName(""); setSubReasonDescription(""); setSubReasonActive(true); };

  return (
    <>
      <PageMeta title="Cancellation Reasons | Pronto Connect" description="Manage cancellation reasons and sub-reasons" />
      <PageBreadcrumb pageTitle="Cancellation Reasons" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Cancellation Reasons and Sub-reasons">
          {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <section className="space-y-4">
              <form onSubmit={saveReason} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <h3 className="font-medium text-gray-800 dark:text-white/90">{editingReasonId ? "Edit reason" : "Add reason"}</h3>
                <div><Label>Reason name</Label><Input value={reasonName} onChange={(event) => setReasonName(event.target.value)} placeholder="Reason name" /></div>
                <div><Label>Description</Label><TextArea rows={2} value={reasonDescription} onChange={setReasonDescription} placeholder="Optional description" /></div>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={reasonActive} onChange={(event) => setReasonActive(event.target.checked)} /> Active</label>
                <div className="flex gap-2">
                  <button disabled={saving} className={`${buttonClass} bg-brand-500 text-white disabled:opacity-50`}>{saving ? "Saving…" : editingReasonId ? "Save reason" : "Add reason"}</button>
                  {editingReasonId && <button type="button" onClick={resetReasonForm} className={`${buttonClass} border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300`}>Cancel</button>}
                </div>
              </form>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                {loading ? <p className="p-5 text-sm text-gray-500">Loading reasons…</p> : reasons.length === 0 ? <p className="p-5 text-sm text-gray-500">No cancellation reasons found.</p> : reasons.map((reason) => (
                  <div key={reason.id} className={`flex items-center justify-between gap-3 border-b border-gray-100 p-3 last:border-b-0 dark:border-gray-800 ${selectedId === reason.id ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}>
                    <button type="button" onClick={() => { setSelectedId(reason.id); resetSubReasonForm(); }} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{reason.reasonName}</span>
                      <span className="text-xs text-gray-500">{reason.subReasons?.length ?? 0} sub-reasons{reason.isActive ? "" : " · inactive"}</span>
                    </button>
                    <button type="button" onClick={() => editReason(reason)} className="text-xs text-brand-600 hover:underline dark:text-brand-400">Edit</button>
                    <button type="button" disabled={saving} onClick={() => void toggleReason(reason)} className="text-xs text-gray-600 hover:underline disabled:opacity-50 dark:text-gray-300">{reason.isActive ? "Disable" : "Enable"}</button>
                    <button type="button" disabled={saving} onClick={() => void removeReason(reason)} className="text-xs text-error-600 hover:underline disabled:opacity-50">Delete</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div><h3 className="font-medium text-gray-800 dark:text-white/90">Sub-reasons</h3><p className="text-sm text-gray-500">{selectedReason ? `For ${selectedReason.reasonName}` : "Select a reason to manage its sub-reasons."}</p></div>
              {selectedReason && <>
                <form onSubmit={saveSubReason} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{editingSubReasonId ? "Edit sub-reason" : "Add sub-reason"}</h4>
                  <div><Label>Sub-reason name</Label><Input value={subReasonName} onChange={(event) => setSubReasonName(event.target.value)} placeholder="Sub-reason name" /></div>
                  <div><Label>Description</Label><TextArea rows={2} value={subReasonDescription} onChange={setSubReasonDescription} placeholder="Optional description" /></div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={subReasonActive} onChange={(event) => setSubReasonActive(event.target.checked)} /> Active</label>
                  <div className="flex gap-2"><button disabled={saving} className={`${buttonClass} bg-brand-500 text-white disabled:opacity-50`}>{saving ? "Saving…" : editingSubReasonId ? "Save sub-reason" : "Add sub-reason"}</button>{editingSubReasonId && <button type="button" onClick={resetSubReasonForm} className={`${buttonClass} border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300`}>Cancel</button>}</div>
                </form>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {(selectedReason.subReasons ?? []).length === 0 ? <p className="p-4 text-sm text-gray-500">No sub-reasons configured yet.</p> : selectedReason.subReasons.map((subReason) => <div key={subReason.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{subReason.reasonName}</p>{subReason.description && <p className="truncate text-xs text-gray-500">{subReason.description}</p>}</div><button type="button" onClick={() => editSubReason(subReason)} className="text-xs text-brand-600 hover:underline dark:text-brand-400">Edit</button><button type="button" disabled={saving} onClick={() => void toggleSubReason(subReason)} className="text-xs text-gray-600 hover:underline disabled:opacity-50 dark:text-gray-300">{subReason.isActive ? "Disable" : "Enable"}</button><button type="button" disabled={saving} onClick={() => void removeSubReason(subReason)} className="text-xs text-error-600 hover:underline disabled:opacity-50">Delete</button></div>)}
                </div>
              </>}
            </section>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
