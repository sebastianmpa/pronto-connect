import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import FilteredResultsToolbar from "../common/FilteredResultsToolbar";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import answeredCallsService from "../../lib/answered-calls/answeredCallsService";
import type {
  AnsweredCallItem,
  AnsweredCallsParams,
} from "../../lib/answered-calls/types";
import { formatDateTime } from "../../utils/date";
import { fetchAllPages } from "../../utils/paginatedData";
import { downloadRowsAsXlsx } from "../../utils/xlsxExport";

interface CallFilters {
  agentName: string;
  agentEmail: string;
  customerPhoneNumber: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FILTERS: CallFilters = {
  agentName: "",
  agentEmail: "",
  customerPhoneNumber: "",
  startDate: "",
  endDate: "",
};

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const textFilters: { field: keyof Pick<CallFilters, "agentName" | "agentEmail" | "customerPhoneNumber">; label: string; placeholder: string }[] = [
  { field: "agentName", label: "Agent name", placeholder: "Search agent" },
  { field: "agentEmail", label: "Agent email", placeholder: "Search email" },
  { field: "customerPhoneNumber", label: "Customer phone", placeholder: "Search phone" },
];

function dateBoundary(value: string, endOfDay: boolean): string {
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

function buildParams(filters: CallFilters, page: number, limit: number): AnsweredCallsParams {
  return {
    page,
    limit,
    ...(filters.agentName && { agent_name: filters.agentName }),
    ...(filters.agentEmail && { agent_email: filters.agentEmail }),
    ...(filters.customerPhoneNumber && { customer_phone_number: filters.customerPhoneNumber }),
    ...(filters.startDate && { call_datetime_from: dateBoundary(filters.startDate, false) }),
    ...(filters.endDate && { call_datetime_to: dateBoundary(filters.endDate, true) }),
  };
}

export default function AnsweredCallsTable() {
  const [filters, setFilters] = useState<CallFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CallFilters>(EMPTY_FILTERS);
  const limit = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<AnsweredCallItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [overallTotalItems, setOverallTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchCalls = useCallback(async (page: number) => {
    const currentRequest = ++requestId.current;
    setLoading(true);

    try {
      const response = await answeredCallsService.getPaginated(buildParams(appliedFilters, page, limit));
      if (currentRequest !== requestId.current) return;
      setItems(Array.isArray(response.items) ? response.items : []);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch {
      if (currentRequest !== requestId.current) return;
      setItems([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [appliedFilters, limit]);

  useEffect(() => {
    void fetchCalls(1);
    return () => { requestId.current += 1; };
  }, [fetchCalls]);

  useEffect(() => {
    let active = true;
    void answeredCallsService.getPaginated({ page: 1, limit: 1 })
      .then((response) => {
        if (active) setOverallTotalItems(response.totalItems);
      })
      .catch(() => {
        if (active) setActionError("Could not load the total answered calls.");
      });

    return () => { active = false; };
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setValidationError("The Start date cannot be after the End date.");
      return;
    }

    setValidationError(null);
    setAppliedFilters({
      ...filters,
      agentName: filters.agentName.trim(),
      agentEmail: filters.agentEmail.trim(),
      customerPhoneNumber: filters.customerPhoneNumber.trim(),
    });
  };

  const handleExport = async () => {
    setExporting(true);
    setActionError(null);

    try {
      const rows = await fetchAllPages<AnsweredCallItem>((page, pageSize) =>
        answeredCallsService.getPaginated(
          buildParams(appliedFilters, page, pageSize),
        ),
      );

      downloadRowsAsXlsx({
        rows,
        filename: `answered-calls-${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "Answered Calls",
        columns: [
          { header: "Call date", value: (call) => formatDateTime(call.callDateTime) },
          { header: "Agent", value: (call) => call.agentName },
          { header: "Agent email", value: (call) => call.agentEmail },
          { header: "Extension", value: (call) => call.extension },
          { header: "Customer phone", value: (call) => call.customerPhoneNumber },
          { header: "Call ID", value: (call) => call.callId },
          { header: "Order", value: (call) => call.orderNumber },
          { header: "Contact reason", value: (call) => call.contactReason },
          { header: "Closure method", value: (call) => call.closureMethod },
          { header: "Origin", value: (call) => call.origin === "goto" ? "GoTo" : "Zoho" },
        ],
      });
    } catch {
      setActionError("Failed to export answered calls. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setValidationError(null);
  };

  const firstItem = (currentPage - 1) * limit + 1;
  const lastItem = Math.min(firstItem + items.length - 1, totalItems);

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      <form onSubmit={handleSearch} className="border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {textFilters.map(({ field, label, placeholder }) => (
            <label key={field} className="block text-sm text-gray-600 dark:text-gray-400">
              <span className="mb-1 block">{label}</span>
              <input
                type="text"
                value={filters[field]}
                onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))}
                placeholder={placeholder}
                className={inputClass}
              />
            </label>
          ))}
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            <span className="mb-1 block">From date</span>
            <input type="date" value={filters.startDate} max={filters.endDate || undefined}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
              className={inputClass} />
          </label>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            <span className="mb-1 block">To date</span>
            <input type="date" value={filters.endDate} min={filters.startDate || undefined}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
              className={inputClass} />
          </label>
        </div>
        {validationError && <p role="alert" className="mt-3 text-sm text-error-500">{validationError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600">Search</button>
          <button type="button" onClick={handleClear} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Clear</button>
        </div>
      </form>

      <FilteredResultsToolbar
        filteredCount={totalItems}
        totalCount={Math.max(overallTotalItems, totalItems)}
        exporting={exporting}
        onExport={() => void handleExport()}
        disabled={loading}
      />
      {actionError && (
        <p role="alert" className="border-x border-b border-gray-100 px-4 py-3 text-sm text-error-500 dark:border-white/[0.05]">
          {actionError}
        </p>
      )}

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <p role="status" className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">Loading answered calls…</p>
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Call date", "Agent", "Customer phone", "Call ID", "Order", "Contact reason", "Closure method", "Origin"].map((label) => (
                  <TableCell key={label} isHeader className="whitespace-nowrap border border-gray-100 px-4 py-3 text-left text-theme-xs font-medium text-gray-700 dark:border-white/[0.05] dark:text-gray-400">{label}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No answered calls found.</td></TableRow>
              ) : items.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-800 dark:border-white/[0.05] dark:text-white/90">{formatDateTime(call.callDateTime)}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-sm text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                    <span className="block whitespace-nowrap font-medium">{call.agentName}</span>
                    <span className="block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{call.agentEmail} · ext. {call.extension}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{call.customerPhoneNumber}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400"><span className="block max-w-48 break-all">{call.callId}</span></TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{call.orderNumber || "—"}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{call.contactReason}</TableCell>
                  <TableCell className="border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{call.closureMethod}</TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">{call.origin === "goto" ? "GoTo" : "Zoho"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && totalItems > 0 && (
        <div className="flex flex-col gap-3 border border-t-0 border-gray-100 px-4 py-4 dark:border-white/[0.05] xl:flex-row xl:items-center xl:justify-between">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 xl:text-left">Showing {firstItem} to {lastItem} of {totalItems} entries</p>
          <PaginationWithIcon key={currentPage} totalPages={totalPages} initialPage={currentPage} onPageChange={(page) => void fetchCalls(page)} />
        </div>
      )}
    </div>
  );
}
