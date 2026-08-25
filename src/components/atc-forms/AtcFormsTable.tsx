import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import FilteredResultsToolbar from "../common/FilteredResultsToolbar";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import { ATC_FORM_STATUSES } from "../../lib/atc-forms/types";
import { statusBadgeClass } from "../../lib/atc-forms/statusBadge";
import AtcFormDetailModal from "./AtcFormDetailModal";
import type { AtcFormItem, AtcFormsParams } from "../../lib/atc-forms/types";
import { formatDate } from "../../utils/date";
import { fetchAllPages } from "../../utils/paginatedData";
import { downloadRowsAsXlsx } from "../../utils/xlsxExport";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const inputCls =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

function buildParams(
  page: number,
  limit: number,
  filters: {
    formType: string;
    orderNumber: string;
    customerEmail: string;
    status: string;
    startDate: string;
    endDate: string;
  },
): AtcFormsParams {
  return {
    page,
    limit,
    ...(filters.formType && { form_type: filters.formType }),
    ...(filters.orderNumber && { order_number: filters.orderNumber }),
    ...(filters.customerEmail && { customer_email: filters.customerEmail }),
    ...(filters.status && { status: filters.status }),
    ...(filters.startDate && { created_at_from: `${filters.startDate}T00:00:00Z` }),
    ...(filters.endDate && { created_at_to: `${filters.endDate}T23:59:59Z` }),
  };
}

function plainText(html: string): string {
  if (!html) return "";
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return documentNode.body.textContent?.trim() ?? "";
}

export default function AtcFormsTable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceOrderId = (searchParams.get("order_id") ?? "").trim();
  const requestedRequestId = Number(searchParams.get("request_id") ?? 0);
  const hasRequestedRequestId =
    Number.isFinite(requestedRequestId) && requestedRequestId > 0;
  const autoOpenAttemptedRef = useRef<string | null>(null);

  const [formType, setFormType] = useState("");
  const [orderNumber, setOrderNumber] = useState(sourceOrderId);
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AtcFormItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [overallTotalItems, setOverallTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AtcFormItem | null>(null);

  useEffect(() => {
    setOrderNumber(sourceOrderId);
    setPage(1);
  }, [sourceOrderId]);

  useEffect(() => {
    let active = true;

    atcFormsService
      .getPaginated({ page: 1, limit: 10 })
      .then((response) => {
        if (active) setOverallTotalItems(response.totalItems ?? 0);
      })
      .catch(() => {
        // Keep the last known overall total if the secondary count request fails.
      });

    return () => {
      active = false;
    };
  }, []);

  const currentFilters = {
    formType: formType.trim(),
    orderNumber: orderNumber.trim(),
    customerEmail: customerEmail.trim(),
    status,
    startDate,
    endDate,
  };

  const fetchRequests = useCallback(
    async (requestedPage: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await atcFormsService.getPaginated(
          buildParams(requestedPage, limit, currentFilters),
        );

        setItems(response.items ?? []);
        setTotalPages(response.totalPages ?? 1);
        setTotalItems(response.totalItems ?? 0);
        setPage(response.currentPage ?? requestedPage);
      } catch {
        setItems([]);
        setTotalPages(1);
        setTotalItems(0);
        setError("Failed to load client requests. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [limit, formType, orderNumber, customerEmail, status, startDate, endDate],
  );

  useEffect(() => {
    void fetchRequests(1);
  }, [fetchRequests]);

  useEffect(() => {
    if (!sourceOrderId || !hasRequestedRequestId) return;

    const requestKey = `${sourceOrderId}:${requestedRequestId}`;
    if (autoOpenAttemptedRef.current === requestKey) return;
    autoOpenAttemptedRef.current = requestKey;

    let active = true;

    const loadRequestedClientRequest = async () => {
      try {
        let requestedPage = 1;
        let totalPages = 1;

        do {
          const response = await atcFormsService.getPaginated({
            page: requestedPage,
            limit: 100,
            order_number: sourceOrderId,
          });

          const match = (response.items ?? []).find(
            (item) => Number(item.id) === requestedRequestId,
          );

          if (match) {
            if (active) setSelectedRequest(match);
            return;
          }

          totalPages = Math.max(Number(response.totalPages) || 1, 1);
          requestedPage += 1;
        } while (requestedPage <= totalPages);

        if (active) {
          setError(
            `Client request #${requestedRequestId} was not found for order #${sourceOrderId}.`,
          );
        }
      } catch {
        if (active) {
          setError("Failed to load the selected client request. Please try again.");
        }
      }
    };

    void loadRequestedClientRequest();

    return () => {
      active = false;
    };
  }, [sourceOrderId, requestedRequestId, hasRequestedRequestId]);

  const closeSelectedRequest = () => {
    setSelectedRequest(null);

    if (sourceOrderId && hasRequestedRequestId) {
      navigate(`/client-requests?order_id=${encodeURIComponent(sourceOrderId)}`, {
        replace: true,
      });
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    if (startDate && endDate && startDate > endDate) {
      setValidationError("The Start date cannot be after the End date.");
      return;
    }

    setValidationError(null);
    void fetchRequests(1);
  };

  const handleExport = async () => {
    if (startDate && endDate && startDate > endDate) {
      setValidationError("The Start date cannot be after the End date.");
      return;
    }

    setValidationError(null);
    setExporting(true);
    setError(null);

    try {
      const rows = await fetchAllPages<AtcFormItem>((requestedPage, pageSize) =>
        atcFormsService.getPaginated(
          buildParams(requestedPage, pageSize, currentFilters),
        ),
      );

      downloadRowsAsXlsx({
        rows,
        filename: `client-requests-${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "Client Requests",
        columns: [
          { header: "ID", value: (row) => row.id },
          { header: "Order #", value: (row) => row.order_number },
          { header: "Customer Name", value: (row) => row.customer_name },
          { header: "Customer Email", value: (row) => row.customer_email },
          { header: "Form Type", value: (row) => row.form_type },
          { header: "Form Sub Type", value: (row) => row.form_sub_type },
          { header: "Status", value: (row) => row.status },
          { header: "Created", value: (row) => formatDate(row.created_at) },
          { header: "Updated", value: (row) => row.updated_at ? formatDate(row.updated_at) : "" },
          { header: "Updated By", value: (row) => row.updated_by },
          { header: "Zoho Ticket ID", value: (row) => row.zoho_ticket_id },
          { header: "Request", value: (row) => plainText(row.ticket_text) },
        ],
      });
    } catch {
      setError("Failed to export client requests. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const changeStatus = async (item: AtcFormItem, newStatus: string) => {
    const previous = item.status;
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, status: newStatus } : row,
      ),
    );

    try {
      await atcFormsService.updateStatus(item.id, newStatus);
    } catch {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: previous } : row,
        ),
      );
    }
  };

  const startIndex = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex =
    totalItems === 0
      ? 0
      : Math.min((page - 1) * limit + items.length, totalItems);

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      {sourceOrderId && (
        <div className="rounded-t-xl border border-b-0 border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => navigate(`/orders/${encodeURIComponent(sourceOrderId)}`)}
            className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors group-hover:border-brand-200 group-hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:group-hover:border-brand-500/30 dark:group-hover:text-brand-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Back to Order</span>
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              #{sourceOrderId}
            </span>
          </button>
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className={`flex flex-col gap-3 border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05] sm:flex-row sm:flex-wrap sm:items-end ${
          sourceOrderId ? "" : "rounded-t-xl"
        }`}
      >
        <input
          type="text"
          placeholder="Form type (e.g. claim)"
          value={formType}
          onChange={(event) => setFormType(event.target.value)}
          className={`${inputCls} w-40`}
        />
        <input
          type="text"
          placeholder="Order #"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          className={`${inputCls} w-32`}
        />
        <input
          type="email"
          placeholder="Customer email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          className={`${inputCls} w-52`}
        />

        <div className="relative">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-8 text-sm capitalize text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All statuses</option>
            {ATC_FORM_STATUSES.map((value) => (
              <option key={value} value={value} className="capitalize dark:bg-gray-900">
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Start date</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">End date</label>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value} className="dark:bg-gray-900">{value}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
        >
          Search
        </button>
      </form>

      {validationError && (
        <div className="border-x border-gray-100 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-white/[0.05] dark:bg-warning-500/10 dark:text-warning-400">
          {validationError}
        </div>
      )}

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
            <svg className="h-8 w-8 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Order #", "Customer", "Type", "Created", "Status", ""].map((label) => (
                  <TableCell key={label} isHeader className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]">
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
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 font-medium text-gray-800 text-theme-sm dark:border-white/[0.05] dark:text-white/90">
                      {item.order_number}
                    </TableCell>
                    <TableCell className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.customer_name}</p>
                      <p className="lowercase text-xs text-gray-500 dark:text-gray-400">{item.customer_email}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 capitalize text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {item.form_type}
                      {item.form_sub_type && <span className="text-gray-400"> · {item.form_sub_type}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-gray-600 text-theme-sm dark:border-white/[0.05] dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                      <select
                        value={item.status ?? "pending"}
                        onChange={(event) => void changeStatus(item, event.target.value)}
                        className={`h-8 appearance-none rounded-full border-0 pl-2.5 pr-6 text-xs font-medium capitalize shadow-theme-xs focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ${statusBadgeClass(item.status)}`}
                      >
                        {ATC_FORM_STATUSES.map((value) => (
                          <option key={value} value={value} className="bg-white text-gray-800 dark:bg-gray-900 dark:text-white/90">
                            {value}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(item)}
                        title="View request detail"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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

      {!loading && items.length > 0 && (
        <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </p>
            <PaginationWithIcon
              totalPages={totalPages}
              initialPage={page}
              onPageChange={(requestedPage) => void fetchRequests(requestedPage)}
            />
          </div>
        </div>
      )}

      <AtcFormDetailModal
        isOpen={!!selectedRequest}
        onClose={closeSelectedRequest}
        request={selectedRequest}
        onStatusChanged={(id, newStatus) => {
          setItems((current) =>
            current.map((row) => (row.id === id ? { ...row, status: newStatus } : row)),
          );
          setSelectedRequest((current) =>
            current && current.id === id ? { ...current, status: newStatus } : current,
          );
        }}
      />
    </div>
  );
}
