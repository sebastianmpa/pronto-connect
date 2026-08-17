import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import FilteredResultsToolbar from "../common/FilteredResultsToolbar";
import emailLogsService from "../../lib/email-logs/emailLogsService";
import type {
  EmailLogItem,
  EmailLogsParams,
} from "../../lib/email-logs/types";
import { formatDateTime } from "../../utils/date";
import { fetchAllPages, filterRowsByDateRange } from "../../utils/paginatedData";
import { downloadRowsAsXlsx } from "../../utils/xlsxExport";

interface FilterState {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderStatus: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: FilterState = {
  customerEmail: "",
  customerName: "",
  orderNumber: "",
  orderStatus: "",
  startDate: "",
  endDate: "",
};

function statusClasses(status: string): string {
  const normalized = status.toUpperCase();

  if (normalized === "SENT") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
  }

  if (normalized === "PENDING") {
    return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
  }

  return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
}

function buildServerParams(
  filters: FilterState,
  page: number,
  limit: number,
): EmailLogsParams {
  return {
    page,
    limit,
    ...(filters.customerEmail && { customer_email: filters.customerEmail }),
    ...(filters.customerName && { customer_name: filters.customerName }),
    ...(filters.orderNumber && { order_number: filters.orderNumber }),
    ...(filters.orderStatus && { order_status: filters.orderStatus }),
  };
}

export default function EmailLogsTable() {
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(EMPTY_FILTERS);
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<EmailLogItem[]>([]);
  const [dateFilteredRows, setDateFilteredRows] = useState<EmailLogItem[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [overallTotalItems, setOverallTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchOverallTotal = useCallback(async () => {
    try {
      const response = await emailLogsService.getPaginated({ page: 1, limit: 10 });
      setOverallTotalItems(response.totalItems ?? 0);
    } catch {
      // Keep the last known overall total if this secondary count request fails.
    }
  }, []);

  useEffect(() => {
    void fetchOverallTotal();
  }, [fetchOverallTotal]);

  const fetchAllFilteredRows = useCallback(async () => {
    const rows = await fetchAllPages<EmailLogItem>((page, pageSize) =>
      emailLogsService.getPaginated(
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
          // Email Logs currently documents only the non-date query parameters.
          // Fetch all rows matching those filters and apply Sent At locally so
          // the filtered total and XLSX export are complete, not page-only.
          const filteredRows = await fetchAllFilteredRows();
          setDateFilteredRows(filteredRows);
          const start = (page - 1) * limit;

          setItems(filteredRows.slice(start, start + limit));
          setTotalItems(filteredRows.length);
          setTotalPages(Math.max(1, Math.ceil(filteredRows.length / limit)));
          setCurrentPage(page);
        } else {
          setDateFilteredRows(null);
          const response = await emailLogsService.getPaginated(
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
        setError("Failed to load email logs. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, fetchAllFilteredRows, limit],
  );

  useEffect(() => {
    void fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
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
      customerEmail: filters.customerEmail.trim(),
      customerName: filters.customerName.trim(),
      orderNumber: filters.orderNumber.trim(),
      orderStatus: filters.orderStatus.trim(),
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

  const openDetail = (log: EmailLogItem) => {
    const from = `${location.pathname}${location.search}`;

    try {
      sessionStorage.setItem(`email-log:${log.id}`, JSON.stringify(log));
    } catch {
      // Route state below is enough for regular navigation.
    }

    navigate(`/email-logs/${log.id}`, {
      state: { log, from },
    });
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
        filename: `email-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "Email Logs",
        columns: [
          { header: "ID", value: (row) => row.id },
          { header: "Sent At", value: (row) => formatDateTime(row.sent_at) },
          { header: "Order #", value: (row) => row.order_number },
          { header: "Customer Name", value: (row) => row.customer_name },
          { header: "Customer Email", value: (row) => row.customer_email },
          { header: "Subject", value: (row) => row.subject },
          { header: "Order Status", value: (row) => row.order_status },
          { header: "Status", value: (row) => row.status },
          { header: "Template ID", value: (row) => row.template_id },
          { header: "Message", value: (row) => row.message_sent },
          { header: "Error", value: (row) => row.error_message },
        ],
      });
    } catch {
      setError("Failed to export email logs. Please try again.");
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
    totalItems === 0
      ? 0
      : Math.min(startIndex + items.length - 1, totalItems);

  const inputClass =
    "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      <form
        onSubmit={handleSearch}
        className="border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05]"
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div className="min-w-0">
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

          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="Customer name"
              value={filters.customerName}
              onChange={(event) =>
                handleFilterChange("customerName", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Order Number
            </label>
            <input
              type="text"
              placeholder="Order number"
              value={filters.orderNumber}
              onChange={(event) =>
                handleFilterChange("orderNumber", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
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

          <div className="min-w-0">
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

          <div className="min-w-0">
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

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex items-center gap-2 sm:justify-end">
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

      <div className="w-full overflow-x-auto custom-scrollbar">
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
          <div className="w-full">
            <Table className="w-full table-fixed">
              <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="w-[13%] border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Sent At</p>
                  </TableCell>
                  <TableCell isHeader className="w-[10%] border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Order #</p>
                  </TableCell>
                  <TableCell isHeader className="w-[20%] border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Customer</p>
                  </TableCell>
                  <TableCell isHeader className="w-[27%] border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Subject</p>
                  </TableCell>
                  <TableCell isHeader className="w-[16%] border border-gray-100 px-2 py-2.5 dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Order Status</p>
                  </TableCell>
                  <TableCell isHeader className="w-[8%] border border-gray-100 px-2 py-2.5 text-center dark:border-white/[0.05]">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Status</p>
                  </TableCell>
                  <TableCell isHeader className="sticky right-0 z-20 w-[6%] border border-gray-100 bg-white px-2 py-2.5 text-center dark:border-white/[0.05] dark:bg-gray-900">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-400">Detail</p>
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No email logs found for the selected filters.
                    </td>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top text-[12px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        <span className="block break-words">{formatDateTime(item.sent_at)}</span>
                      </TableCell>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top text-[12px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        <span className="block break-all">{item.order_number || "—"}</span>
                      </TableCell>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top dark:border-white/[0.05]">
                        <p className="break-words text-[12px] font-medium leading-4 text-gray-800 dark:text-white/90">
                          {item.customer_name || "—"}
                        </p>
                        <p className="mt-1 break-all text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                          {item.customer_email || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top text-[12px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        <p className="break-words [overflow-wrap:anywhere]">{item.subject || "—"}</p>
                      </TableCell>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top text-[11px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        <span className="block break-words [overflow-wrap:anywhere]">{item.order_status || "—"}</span>
                      </TableCell>
                      <TableCell className="border border-gray-100 px-2 py-2.5 align-top text-center dark:border-white/[0.05]">
                        <span className={`inline-flex max-w-full items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ${statusClasses(item.status)}`}>
                          <span className="break-all">{item.status || "—"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border border-gray-100 bg-white px-2 py-2.5 text-center align-top dark:border-white/[0.05] dark:bg-gray-900">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          title="View detail"
                          aria-label={`View email log ${item.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
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
