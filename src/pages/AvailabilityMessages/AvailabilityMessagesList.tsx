import { useCallback, useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import { Modal } from "../../components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import ConfirmModal from "../../components/common/ConfirmModal";
import availabilityMessagesService from "../../lib/availability-messages/availabilityMessagesService";
import type {
  AvailabilityMessage,
  AvailabilityMessagePayload,
  SupplierOption,
} from "../../lib/availability-messages/types";

const inputClass =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

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

export default function AvailabilityMessagesList() {
  const [messages, setMessages] = useState<AvailabilityMessage[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<AvailabilityMessage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reasonFilterInput, setReasonFilterInput] = useState("");
  const [supplierFilterInput, setSupplierFilterInput] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const supplierNames = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, `${supplier.name} (${supplier.code})`])),
    [suppliers],
  );

  const filteredMessages = useMemo(() => {
    const normalizedReason = reasonFilter.trim().toLowerCase();
    return messages.filter((item) => {
      const matchesReason = !normalizedReason || item.reason.toLowerCase().includes(normalizedReason);
      const matchesSupplier = !supplierFilter || (item.supplier_id ?? "") === supplierFilter;
      return matchesReason && matchesSupplier;
    });
  }, [messages, reasonFilter, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const visibleMessages = filteredMessages.slice((page - 1) * pageSize, page * pageSize);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const result = await availabilityMessagesService.getAll();
      setMessages(result);
    } catch {
      setListError("Could not load availability messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      availabilityMessagesService.getSuppliers().then(setSuppliers).catch(() => {
        setListError("Could not load suppliers. Refresh the page and try again.");
      }),
      loadMessages(),
    ]);
  }, [loadMessages]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetForm = () => {
    setEditingId("");
    setSupplierId("");
    setReason("");
    setMessage("");
    setFormError(null);
    setFormOpen(false);
  };

  const openCreate = () => {
    setEditingId("");
    setSupplierId("");
    setReason("");
    setMessage("");
    setFormError(null);
    setFormOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim() || !message.trim()) {
      setFormError("Enter both a reason and a customer message.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: AvailabilityMessagePayload = {
      supplier_id: supplierId || null,
      reason: reason.trim(),
      message: message.trim(),
    };
    try {
      if (editingId) await availabilityMessagesService.update(editingId, payload);
      else await availabilityMessagesService.create(payload);
      resetForm();
      await loadMessages();
    } catch {
      setFormError("Could not save the availability message. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const edit = async (item: AvailabilityMessage) => {
    setSaving(true);
    setFormError(null);
    try {
      const record = await availabilityMessagesService.getById(item.id);
      setEditingId(record.id);
      setSupplierId(record.supplier_id ?? "");
      setReason(record.reason);
      setMessage(record.message);
      setFormOpen(true);
    } catch {
      setListError("Could not load this availability message for editing.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deletingMessage) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await availabilityMessagesService.remove(deletingMessage.id);
      await loadMessages();
      if (editingId === deletingMessage.id) resetForm();
      setDeletingMessage(null);
    } catch {
      setDeleteError("Could not delete the availability message.");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReasonFilter(reasonFilterInput);
    setSupplierFilter(supplierFilterInput);
    setPage(1);
  };

  return (
    <>
      <PageMeta title="Availability Messages | Pronto Connect" description="Manage availability messages" />
      <PageBreadcrumb pageTitle="Availability Messages" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Availability Messages" desc="Configure the message shown for each availability reason and supplier.">
          <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
          <Modal isOpen={formOpen} onClose={resetForm} className="relative w-full max-w-[550px] rounded-3xl bg-white p-6 sm:m-0 lg:p-10 dark:bg-gray-900">
            <div>
              <h4 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">{editingId ? "Edit Availability Message" : "New Availability Message"}</h4>
              <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">Choose a supplier or leave it global for all suppliers.</p>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <Label htmlFor="availability-supplier">Supplier</Label>
                  <select id="availability-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} disabled={saving} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    <option value="">All suppliers (global)</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.code})</option>)}
                  </select>
                </div>
                <div><Label htmlFor="availability-reason">Reason</Label><Input id="availability-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Availability reason" disabled={saving} /></div>
                <div><Label>Customer message</Label><TextArea rows={4} value={message} onChange={setMessage} placeholder="Message shown to the customer" disabled={saving} /></div>
                {formError && <div role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{formError}</div>}
                <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row dark:border-gray-800">
                  <button type="button" onClick={resetForm} disabled={saving} className="h-11 w-full rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]">Cancel</button>
                  <button type="submit" disabled={saving} className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Create message"}</button>
                </div>
              </form>
            </div>
          </Modal>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05] sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor="availability-filter-reason">Reason</Label>
              <input id="availability-filter-reason" value={reasonFilterInput} onChange={(event) => setReasonFilterInput(event.target.value)} placeholder="Search by reason" className={`${inputClass} w-full sm:w-64`} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="availability-filter-supplier">Supplier</Label>
              <select id="availability-filter-supplier" value={supplierFilterInput} onChange={(event) => setSupplierFilterInput(event.target.value)} className={`${inputClass} w-full sm:w-56`}>
                <option value="">All suppliers</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.code})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
              <select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className={`${inputClass} w-20`}>
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <button type="submit" className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600">Search</button>
            <button type="button" onClick={openCreate} className="h-9 rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 sm:ml-auto">+ New Message</button>
          </form>

          {listError && <div role="alert" className="m-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{listError}</div>}
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <svg className="h-8 w-8 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : (
              <Table>
                <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]"><TableRow>{["Supplier", "Reason", "Message", ""].map((label) => <TableCell key={label} isHeader className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"><p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{label}</p></TableCell>)}</TableRow></TableHeader>
                <TableBody>
                  {visibleMessages.length === 0 ? <TableRow><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No availability messages found for the selected filters.</td></TableRow> : visibleMessages.map((item) => <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-theme-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">{item.supplier_id ? supplierNames.get(item.supplier_id) ?? "Unknown supplier" : "All suppliers (global)"}</TableCell>
                    <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{item.reason}</TableCell>
                    <TableCell className="border border-gray-100 px-4 py-3 text-theme-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400"><span className="line-clamp-1 max-w-sm">{item.message}</span></TableCell>
                    <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]"><div className="flex items-center justify-center gap-1"><button type="button" disabled={saving} onClick={() => void edit(item)} title="Edit availability message" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:opacity-50 dark:hover:bg-brand-500/10"><PencilIcon /></button><button type="button" disabled={saving} onClick={() => { setDeletingMessage(item); setDeleteError(null); }} title="Delete availability message" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-error-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-error-500/10"><TrashIcon /></button></div></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            )}
          </div>
          {!loading && filteredMessages.length > 0 && <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
              <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredMessages.length)} of {filteredMessages.length} entries</p>
              <PaginationWithIcon key={`${page}-${totalPages}`} totalPages={totalPages} initialPage={page} onPageChange={setPage} />
            </div>
          </div>}
          <ConfirmModal isOpen={!!deletingMessage} onClose={() => setDeletingMessage(null)} onConfirm={() => void remove()} title="Delete availability message?" message="This will permanently delete the selected availability message. This action cannot be undone." confirming={saving} error={deleteError} />
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
