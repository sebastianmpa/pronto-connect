import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import { ATC_FORM_STATUSES } from "../../lib/atc-forms/types";
import { statusBadgeClass } from "../../lib/atc-forms/statusBadge";
import AtcFormDetailModal from "./AtcFormDetailModal";
import type { AtcFormItem, AtcFormsParams } from "../../lib/atc-forms/types";
import { formatDate } from "../../utils/date";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const inputCls =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export default function AtcFormsTable() {
  const [formType, setFormType] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AtcFormItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<AtcFormItem | null>(null);

  const fetchRequests = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: AtcFormsParams = {
          page: p,
          limit,
          ...(formType && { form_type: formType }),
          ...(orderNumber && { order_number: orderNumber }),
          ...(customerEmail && { customer_email: customerEmail }),
          ...(status && { status }),
          ...(startDate && { created_at_from: `${startDate}T00:00:00Z` }),
          ...(endDate && { created_at_to: `${endDate}T23:59:59Z` }),
        };
        const res = await atcFormsService.getPaginated(params);
        setItems(res.items ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotalItems(res.totalItems ?? 0);
        setPage(res.currentPage ?? p);
      } catch {
        setItems([]);
        setError("Failed to load client requests. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [limit, formType, orderNumber, customerEmail, status, startDate, endDate]
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests(1);
  };

  const changeStatus = async (item: AtcFormItem, newStatus: string) => {
    const previous = item.status;
    setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r)));
    try {
      await atcFormsService.updateStatus(item.id, newStatus);
    } catch {
      setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: previous } : r)));
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* ── Filters ── */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:flex-wrap sm:items-end"
      >
        <input
          type="text"
          placeholder="Form type (e.g. claim)"
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          className={`${inputCls} w-40`}
        />
        <input
          type="text"
          placeholder="Order #"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={`${inputCls} w-32`}
        />
        <input
          type="email"
          placeholder="Customer email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className={`${inputCls} w-52`}
        />

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-8 text-sm capitalize text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All statuses</option>
            {ATC_FORM_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize dark:bg-gray-900">{s}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="stroke-current" width="12" height="8" viewBox="0 0 16 16" fill="none">
              <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

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
          type="submit"
          className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600 transition-colors"
        >
          Search
        </button>
      </form>

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
                {["Order #", "Customer", "Type", "Created", "Status", ""].map((label) => (
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
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No client requests found for the selected filters.
                  </td>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {item.order_number}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{item.customer_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 lowercase">{item.customer_email}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 capitalize whitespace-nowrap">
                      {item.form_type}
                      {item.form_sub_type && <span className="text-gray-400"> · {item.form_sub_type}</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <select
                        value={item.status ?? "pending"}
                        onChange={(e) => changeStatus(item, e.target.value)}
                        className={`h-8 appearance-none rounded-full border-0 pl-2.5 pr-6 text-xs font-medium capitalize shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ${statusBadgeClass(item.status)}`}
                      >
                        {ATC_FORM_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-white text-gray-800 dark:bg-gray-900 dark:text-white/90">
                            {s}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-3 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                      <button
                        onClick={() => setSelectedRequest(item)}
                        title="View request detail"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                      >
                        <EyeIcon />
                      </button>
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
              onPageChange={(p) => fetchRequests(p)}
            />
          </div>
        </div>
      )}

      <AtcFormDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onStatusChanged={(id, newStatus) => {
          setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
          setSelectedRequest((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
        }}
      />
    </div>
  );
}
