import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import availabilityMessagesService from "../../lib/availability-messages/availabilityMessagesService";
import type {
  AvailabilityMessage,
  AvailabilityMessagePayload,
  SupplierOption,
} from "../../lib/availability-messages/types";

const buttonClass = "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const pageSize = 100;

export default function AvailabilityMessagesList() {
  const [messages, setMessages] = useState<AvailabilityMessage[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const supplierNames = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, `${supplier.name} (${supplier.code})`])),
    [suppliers],
  );

  const loadMessages = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await availabilityMessagesService.getPaginated(requestedPage, pageSize);
      setMessages(result.items);
      setPage(result.currentPage);
      setTotalPages(Math.max(result.totalPages, 1));
      setTotalItems(result.totalItems);
    } catch {
      setError("Could not load availability messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      availabilityMessagesService.getSuppliers().then(setSuppliers).catch(() => {
        setError("Could not load suppliers. Refresh the page and try again.");
      }),
      loadMessages(1),
    ]);
  }, [loadMessages]);

  const resetForm = () => {
    setEditingId("");
    setSupplierId("");
    setReason("");
    setMessage("");
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim() || !message.trim()) {
      setError("Enter both a reason and a customer message.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: AvailabilityMessagePayload = {
      supplier_id: supplierId || null,
      reason: reason.trim(),
      message: message.trim(),
    };
    try {
      if (editingId) await availabilityMessagesService.update(editingId, payload);
      else await availabilityMessagesService.create(payload);
      resetForm();
      await loadMessages(editingId ? page : 1);
    } catch {
      setError("Could not save the availability message. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const edit = async (item: AvailabilityMessage) => {
    setSaving(true);
    setError(null);
    try {
      const record = await availabilityMessagesService.getById(item.id);
      setEditingId(record.id);
      setSupplierId(record.supplier_id ?? "");
      setReason(record.reason);
      setMessage(record.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not load this availability message for editing.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AvailabilityMessage) => {
    if (!window.confirm("Delete this availability message?")) return;
    setSaving(true);
    setError(null);
    try {
      await availabilityMessagesService.remove(item.id);
      const nextPage = messages.length === 1 && page > 1 ? page - 1 : page;
      await loadMessages(nextPage);
      if (editingId === item.id) resetForm();
    } catch {
      setError("Could not delete the availability message.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Availability Messages | Pronto Connect" description="Manage availability messages" />
      <PageBreadcrumb pageTitle="Availability Messages" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Availability Messages" desc="Configure the message shown for each availability reason and supplier.">
          {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          <form onSubmit={save} className="mb-6 grid gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:grid-cols-2">
            <div className="md:col-span-2"><h2 className="font-medium text-gray-800 dark:text-white/90">{editingId ? "Edit availability message" : "Add availability message"}</h2><p className="mt-1 text-sm text-gray-500">Choose a supplier or leave it global for all suppliers.</p></div>
            <div>
              <Label htmlFor="availability-supplier">Supplier</Label>
              <select id="availability-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} disabled={saving} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                <option value="">All suppliers (global)</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.code})</option>)}
              </select>
            </div>
            <div><Label htmlFor="availability-reason">Reason</Label><Input id="availability-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Availability reason" disabled={saving} /></div>
            <div className="md:col-span-2"><Label>Customer message</Label><TextArea rows={4} value={message} onChange={setMessage} placeholder="Message shown to the customer" disabled={saving} /></div>
            <div className="flex gap-2 md:col-span-2">
              <button disabled={saving} className={`${buttonClass} bg-brand-500 text-white disabled:opacity-50`}>{saving ? "Saving…" : editingId ? "Save changes" : "Create message"}</button>
              {editingId && <button type="button" onClick={resetForm} disabled={saving} className={`${buttonClass} border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300`}>Cancel</button>}
            </div>
          </form>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900/40"><tr><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Message</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading availability messages…</td></tr> : messages.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No availability messages found.</td></tr> : messages.map((item) => <tr key={item.id} className="align-top"><td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.supplier_id ? supplierNames.get(item.supplier_id) ?? "Unknown supplier" : "All suppliers (global)"}</td><td className="max-w-xs px-4 py-3 text-gray-700 dark:text-gray-300">{item.reason}</td><td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-gray-600 dark:text-gray-400">{item.message}</td><td className="whitespace-nowrap px-4 py-3 text-right"><button type="button" disabled={saving} onClick={() => void edit(item)} className="mr-3 text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400">Edit</button><button type="button" disabled={saving} onClick={() => void remove(item)} className="text-error-600 hover:underline disabled:opacity-50">Delete</button></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <span>{totalItems} messages · Page {page} of {totalPages}</span>
            <div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => void loadMessages(page - 1)} className={`${buttonClass} border border-gray-300 disabled:opacity-40 dark:border-gray-700`}>Previous</button><button type="button" disabled={loading || page >= totalPages} onClick={() => void loadMessages(page + 1)} className={`${buttonClass} border border-gray-300 disabled:opacity-40 dark:border-gray-700`}>Next</button></div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
