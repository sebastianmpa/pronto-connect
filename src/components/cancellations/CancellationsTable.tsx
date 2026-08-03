import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import cancellationsService from "../../lib/cancellations/cancellationsService";
import type { CancellationItem, CancellationsParams } from "../../lib/cancellations/types";
import { formatDate, formatDateTime } from "../../utils/date";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const inputCls =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

// ─── Component ───────────────────────────────────────────────────────────────

export default function CancellationsTable() {
  const navigate = useNavigate();

  const [orderNumber, setOrderNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [user, setUser] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<CancellationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cancellationsService.getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const openDetail = (salesOrderId: number) => navigate(`/cancellations/${salesOrderId}`);

  const fetchCancellations = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: CancellationsParams = {
          page: p,
          limit,
          ...(orderNumber && { orderNumber }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(user && { user }),
        };
        const res = await cancellationsService.getPaginated(params);
        setItems(res.items ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotalItems(res.totalItems ?? 0);
        setPage(res.currentPage ?? p);
      } catch {
        setItems([]);
        setError("Failed to load cancellations. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [limit, orderNumber, startDate, endDate, user]
  );

  useEffect(() => {
    fetchCancellations(1);
  }, [fetchCancellations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCancellations(1);
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
          placeholder="Order #"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={`${inputCls} w-36`}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="relative">
          <select
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-8 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u} value={u} className="dark:bg-gray-900">{u}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="stroke-current" width="12" height="8" viewBox="0 0 16 16" fill="none">
              <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
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
                {["Order #", "Order Date", "Cancelled On", "Reason", "Type", "User", ""].map((label) => (
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
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No cancellations found for the selected filters.
                  </td>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.salesOrderId}>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {item.orderNumber}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(item.orderDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(item.cancellationDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400">
                      {item.reason}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.type === "Total"
                            ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                        }`}
                      >
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.user}
                    </TableCell>
                    <TableCell className="px-3 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                      <button
                        onClick={() => openDetail(item.salesOrderId)}
                        title="View cancellation detail"
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
              onPageChange={(p) => fetchCancellations(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
