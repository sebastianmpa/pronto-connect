import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import ConfirmModal from "../common/ConfirmModal";
import contactReasonsService from "../../lib/contact-reasons/contactReasonsService";
import ContactReasonFormModal from "./ContactReasonFormModal";
import type { ContactReasonItem } from "../../lib/contact-reasons/types";
import { formatDateTime } from "../../utils/date";

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

export default function ContactReasonsTable() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<ContactReasonItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ContactReasonItem | null>(null);

  const [deletingReason, setDeletingReason] = useState<ContactReasonItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchReasons = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await contactReasonsService.getPaginated({ page: p, limit });
        setItems(res.items ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotalItems(res.totalItems ?? 0);
        setPage(res.currentPage ?? p);
      } catch {
        setItems([]);
        setError("Failed to load contact reasons. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchReasons(1);
  }, [fetchReasons]);

  const openCreate = () => {
    setEditingReason(null);
    setFormOpen(true);
  };

  const openEdit = (reason: ContactReasonItem) => {
    setEditingReason(reason);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingReason) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await contactReasonsService.remove(deletingReason.id);
      setDeletingReason(null);
      fetchReasons(page);
    } catch {
      setDeleteError("Could not delete the contact reason. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-7 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v} className="dark:bg-gray-900">{v}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="stroke-current" width="12" height="8" viewBox="0 0 16 16" fill="none">
                <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="h-9 rounded-lg border border-brand-500 px-4 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors sm:ml-auto"
        >
          + New Reason
        </button>
      </div>

      {/* ── Table ── */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {error && (
          <div className="m-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Reason Name", "Internal Name", "Description", "Updated", ""].map((label) => (
                  <TableCell
                    key={label}
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{label}</p>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No contact reasons found.
                  </td>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {r.reasonName}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {r.internalName}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400">
                      <span className="line-clamp-1 max-w-sm">{r.description}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(r.updatedAt)}
                    </TableCell>
                    <TableCell className="px-3 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          title="Edit contact reason"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingReason(r);
                            setDeleteError(null);
                          }}
                          title="Delete contact reason"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && items.length > 0 && (
        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min((page - 1) * limit + items.length, totalItems)} of {totalItems} entries
            </p>
            <PaginationWithIcon
              totalPages={totalPages}
              initialPage={page}
              onPageChange={(p) => fetchReasons(p)}
            />
          </div>
        </div>
      )}

      <ContactReasonFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        reason={editingReason}
        onSaved={() => fetchReasons(page)}
      />

      <ConfirmModal
        isOpen={!!deletingReason}
        onClose={() => setDeletingReason(null)}
        onConfirm={handleDelete}
        title="Delete contact reason?"
        message={`This will permanently delete "${deletingReason?.reasonName}". This action cannot be undone.`}
        confirming={deleting}
        error={deleteError}
      />
    </div>
  );
}
