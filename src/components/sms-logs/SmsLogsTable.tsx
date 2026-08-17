import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import FilteredResultsToolbar from "../common/FilteredResultsToolbar";
import smsLogsService from "../../lib/sms-logs/smsLogsService";
import type { SmsLogItem, SmsLogsParams } from "../../lib/sms-logs/types";
import { formatDateTime } from "../../utils/date";
import { fetchAllPages, filterRowsByDateRange } from "../../utils/paginatedData";
import { downloadRowsAsXlsx } from "../../utils/xlsxExport";

interface SmsFilterState {
  orderNumber: string;
  customerEmail: string;
  phoneNumber: string;
  orderStatus: string;
  status: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: SmsFilterState = {
  orderNumber: "",
  customerEmail: "",
  phoneNumber: "",
  orderStatus: "",
  status: "",
  startDate: "",
  endDate: "",
};

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

function buildServerParams(
  filters: SmsFilterState,
  page: number,
  limit: number,
): SmsLogsParams {
  return {
    page,
    limit,
    ...(filters.orderNumber && { order_number: filters.orderNumber }),
    ...(filters.customerEmail && { customer_email: filters.customerEmail }),
    ...(filters.phoneNumber && { phone_number: filters.phoneNumber }),
    ...(filters.orderStatus && { order_status: filters.orderStatus }),
    ...(filters.status && { status: filters.status }),
  };
}

export default function SmsLogsTable() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SmsFilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<SmsFilterState>(EMPTY_FILTERS);
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<SmsLogItem[]>([]);
  const [dateFilteredRows, setDateFilteredRows] = useState<SmsLogItem[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [overallTotalItems, setOverallTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const openDetail = (id: number) => navigate(`/sms-logs/${id}`);

  const fetchOverallTotal = useCallback(async () => {
    try {
      const response = await smsLogsService.getPaginated({ page: 1, limit: 10 });
      setOverallTotalItems(response.totalItems ?? 0);
    } catch {
      // The main table request still reports any loading error. Keep the last
      // known overall total if this secondary count request fails.
    }
  }, []);

  useEffect(() => {
    void fetchOverallTotal();
  }, [fetchOverallTotal]);

  const fetchAllFilteredRows = useCallback(async () => {
    const rows = await fetchAllPages<SmsLogItem>((page, pageSize) =>
      smsLogsService.getPaginated(
        buildServerParams(appliedFilters, page, pageSize),
      ),
    );

    return filterRowsByDateRange(
      rows,
      (row) => row.sent_at,
      appliedFilters.startDate,
      appliedFilters.endDate,
    );
  }, [appliedFilters]);

  const fetchLogs = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const hasDateFilter =
          Boolean(appliedFilters.startDate) || Boolean(appliedFilters.endDate);

        if (hasDateFilter) {
          // The current SMS endpoint does not expose date query parameters.
          // Load all rows matching the supported server filters, then apply the
          // date range locally so the count and pagination remain accurate.
          const filteredRows = await fetchAllFilteredRows();
          setDateFilteredRows(filteredRows);
          const start = (page - 1) * limit;
          const pageRows = filteredRows.slice(start, start + limit);

          setItems(pageRows);
          setTotalItems(filteredRows.length);
          setTotalPages(Math.max(1, Math.ceil(filteredRows.length / limit)));
          setCurrentPage(page);
        } else {
          setDateFilteredRows(null);
          const response = await smsLogsService.getPaginated(
            buildServerParams(appliedFilters, page, limit),
          );

          setItems(Array.isArray(response.items) ? response.items : []);
          setTotalPages(Math.max(response.totalPages || 1, 1));
          setTotalItems(response.totalItems || 0);
          setCurrentPage(response.currentPage || page);
        }
      } catch {
        setItems([]);
        setDateFilteredRows(null);
        setTotalPages(1);
        setTotalItems(0);
        setError("Failed to load SMS logs. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, fetchAllFilteredRows, limit],
  );

  useEffect(() => {
    void fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterChange = (field: keyof SmsFilterState, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      setValidationError("The Start date cannot be after the End date.");
      return;
    }

    setValidationError(null);
    setCurrentPage(1);
    setAppliedFilters({
      orderNumber: filters.orderNumber.trim(),
      customerEmail: filters.customerEmail.trim(),
      phoneNumber: filters.phoneNumber.trim(),
      orderStatus: filters.orderStatus.trim(),
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  const handleClear = () => {
    setValidationError(null);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setDateFilteredRows(null);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const hasDateFilter = Boolean(appliedFilters.startDate) || Boolean(appliedFilters.endDate);
      const rows = hasDateFilter && dateFilteredRows !== null
        ? dateFilteredRows
        : await fetchAllFilteredRows();

      downloadRowsAsXlsx({
        rows,
        filename: `sms-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "SMS Logs",
        columns: [
          { header: "ID", value: (row) => row.id },
          { header: "Sent At", value: (row) => formatDateTime(row.sent_at) },
          { header: "Order #", value: (row) => row.order_number },
          { header: "Customer Name", value: (row) => row.customer_name },
          { header: "Customer Email", value: (row) => row.customer_email },
          { header: "Phone", value: (row) => row.phone_number },
          { header: "Order Status", value: (row) => row.order_status },
          { header: "Status", value: (row) => row.status },
          { header: "Template ID", value: (row) => row.template_id },
          { header: "Message", value: (row) => row.message_sent },
          { header: "Error", value: (row) => row.error_message },
        ],
      });
    } catch {
      setError("Failed to export SMS logs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    const hasDateFilter = Boolean(appliedFilters.startDate) || Boolean(appliedFilters.endDate);

    if (hasDateFilter && dateFilteredRows !== null) {
      const start = (page - 1) * limit;
      setItems(dateFilteredRows.slice(start, start + limit));
      setCurrentPage(page);
      return;
    }

    setCurrentPage(page);
    void fetchLogs(page);
  };

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(startIndex + items.length - 1, totalItems);

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      <form
        onSubmit={handleSearch}
        className="border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05]"
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Order #
            </label>
            <input
              type="text"
              placeholder="Order #"
              value={filters.orderNumber}
              onChange={(event) =>
                handleFilterChange("orderNumber", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Customer Email
            </label>
            <input
              type="email"
              placeholder="Customer email"
              value={filters.customerEmail}
              onChange={(event) =>
                handleFilterChange("customerEmail", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Phone
            </label>
            <input
              type="text"
              placeholder="Phone"
              value={filters.phoneNumber}
              onChange={(event) =>
                handleFilterChange("phoneNumber", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Order Status
            </label>
            <input
              type="text"
              placeholder="Order status"
              value={filters.orderStatus}
              onChange={(event) =>
                handleFilterChange("orderStatus", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              SMS Status
            </label>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange("status", event.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                handleFilterChange("startDate", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                handleFilterChange("endDate", event.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        {validationError && (
          <div className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            {validationError}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="h-10 rounded-lg bg-brand-500 px-5 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Clear filters
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {[10, 25, 50, 100].map((value) => (
                <option key={value} value={value} className="dark:bg-gray-900">
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <FilteredResultsToolbar
        filteredCount={totalItems}
        totalCount={Math.max(overallTotalItems, totalItems)}
        exporting={exporting}
        onExport={() => void handleExport()}
        disabled={loading}
      />

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {error && (
          <div className="m-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["ID", "Sent at", "Order #", "Customer", "Phone", "Order Status", "Status", ""].map(
                  (label) => (
                    <TableCell
                      key={label}
                      isHeader
                      className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        {label}
                      </p>
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No SMS logs found for the selected filters.
                  </td>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 font-medium text-gray-800 text-theme-sm dark:border-white/[0.05] dark:text-white/90">
                      {item.id}
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {formatDateTime(item.sent_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {item.order_number}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {item.customer_name}
                      </p>
                      <p className="lowercase text-xs text-gray-500 dark:text-gray-400">
                        {item.customer_email}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {item.phone_number}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-4 py-3 text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {item.order_status || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "SENT"
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                            : item.status === "PENDING"
                              ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                              : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => openDetail(item.id)}
                        title="View detail"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
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
