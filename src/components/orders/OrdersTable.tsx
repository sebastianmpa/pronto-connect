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
import ordersService from "../../lib/orders/ordersService";
import type { OrderItem, OrdersSearchParams } from "../../lib/orders/types";
import { downloadOrderInvoicePdf } from "../../lib/orders/orderInvoicePdf";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDate(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrdersTable() {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(daysAgo(14));
  const [endDate, setEndDate] = useState(today());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null);

  const normalizeOrderNumber = (reference: string | undefined) =>
    (reference ?? "")
      .replace(/^E-/i, "")
      .replace(/-RET$/i, "")
      .trim();

  const openDetail = (reference: string | undefined) => {
    const rawNum = normalizeOrderNumber(reference);
    if (!rawNum) return;
    navigate(`/orders/${rawNum}`);
  };

  const downloadInvoice = async (item: OrderItem) => {
    const rawNum = normalizeOrderNumber(item.reference ?? item.order_number);
    if (!rawNum || downloadingOrder) return;

    setDownloadingOrder(rawNum);
    setError(null);

    try {
      const detail = await ordersService.getOrderDetail(rawNum);
      await downloadOrderInvoicePdf(detail);
    } catch {
      setError("Failed to download the invoice PDF. Please try again.");
    } finally {
      setDownloadingOrder(null);
    }
  };

  const fetchOrders = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: OrdersSearchParams = {
          startDate,
          endDate,
          limit,
          page,
          name,
          phone,
          email,
          order_number: orderNumber,
        };
        const res = await ordersService.searchByDateRange(params);
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalItems(res.totalItems);
        setCurrentPage(res.currentPage);
      } catch {
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, limit, name, phone, email, orderNumber]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(startIndex + items.length - 1, totalItems);

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* ── Filters ── */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:flex-wrap sm:items-end"
      >
        {/* Date range */}
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </div>

        {/* Search inputs */}
        <input
          type="text"
          placeholder="Order #"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 w-32"
        />
        <input
          type="text"
          placeholder="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 w-40"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 w-48"
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 w-32"
        />

        {/* Entries per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-7 text-sm text-gray-800 appearance-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v} className="dark:bg-gray-900">
                  {v}
                </option>
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
      <div className="max-w-full overflow-x-hidden">
        {error && (
          <div className="px-4 py-3 m-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-brand-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <Table className="w-full table-fixed">
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  ["Order ID", "w-[10%]"],
                  ["Order Date", "w-[11%]"],
                  ["Reference / Order #", "w-[15%]"],
                  ["Customer Name", "w-[16%]"],
                  ["Email", "w-[25%]"],
                  ["Source", "w-[13%]"],
                  ["Dtl.", "w-[5%]"],
                  ["PDF", "w-[5%]"],
                ].map(([label, width]) => (
                  <TableCell
                    key={label}
                    isHeader
                    className={`${width} border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]`}
                  >
                    <p className="text-center text-[11px] font-medium text-gray-700 dark:text-gray-400">
                      {label}
                    </p>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No orders found for the selected filters.
                  </td>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={item.salesOrderId ?? i}>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-xs font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                      {item.salesOrderId ?? "—"}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-xs text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                      {formatDate(item.orderDate)}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-xs text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                      {item.reference ?? item.order_number ?? "—"}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-xs text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                      {item.customerName}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-xs lowercase text-gray-600 break-all dark:border-white/[0.05] dark:text-gray-400">
                      {item.customerEmail}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-2 py-2.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                        {item.source}
                      </span>
                    </TableCell>
                    {/* Detail */}
                    <TableCell className="border border-gray-100 px-1 py-2 text-center dark:border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => openDetail(item.reference ?? item.order_number)}
                        title="View order detail"
                        aria-label="View order detail"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </TableCell>

                    {/* Direct PDF invoice download */}
                    <TableCell className="border border-gray-100 px-1 py-2 text-center dark:border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(item)}
                        disabled={Boolean(downloadingOrder)}
                        title="Download invoice PDF"
                        aria-label="Download invoice PDF"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:cursor-wait disabled:opacity-40 dark:hover:bg-brand-500/10"
                      >
                        {downloadingOrder === normalizeOrderNumber(item.reference ?? item.order_number) ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V15M12 15L7.5 10.5M12 15L16.5 10.5M5 20H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
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
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </p>
            <PaginationWithIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
