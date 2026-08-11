import { useCallback, useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import CustomerContactsFilters from "./CustomerContactsFilters";
import CustomerContactRequestModal from "./CustomerContactRequestModal";
import customerContactsService from "../../lib/customer-contacts/customerContactsService";
import type {
  CustomerContactItem,
  CustomerContactsFilterValues,
  CustomerContactsMeta,
  CustomerContactsParams,
  SaveCustomerContactRequestPayload,
} from "../../lib/customer-contacts/types";
import { formatDate, formatDateTime } from "../../utils/date";
import { PencilIcon, PlusIcon } from "../../icons";

const DetailIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M2.75 12s3.25-6 9.25-6 9.25 6 9.25 6-3.25 6-9.25 6S2.75 12 2.75 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="2.75"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const EMPTY_FILTERS: CustomerContactsFilterValues = {
  since: "",
  until: "",
  customer_id: "",
  order_id: "",
  reason_id: "",
};

const EMPTY_META: CustomerContactsMeta = {
  total: 0,
  limit: 25,
  offset: 0,
  partial: false,
  unavailable_sources: [],
};

function cleanFilters(
  filters: CustomerContactsFilterValues
): CustomerContactsFilterValues {
  return {
    ...filters,
    customer_id: filters.customer_id.trim(),
    order_id: filters.order_id.trim(),
    reason_id: filters.reason_id.trim(),
  };
}

function getValidContactRequestId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getApiErrorMessage(
  error: unknown,
  fallback = "Could not save the customer contact request. Please try again."
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; errors?: unknown }
      | undefined;

    if (Array.isArray(data?.errors)) {
      const errors = data.errors.filter(
        (item): item is string => typeof item === "string" && item.trim() !== ""
      );

      if (errors.length > 0) {
        return errors.join(" ");
      }
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function CustomerContactsTable() {
  const navigate = useNavigate();
  const location = useLocation();

  const [draftFilters, setDraftFilters] =
    useState<CustomerContactsFilterValues>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<CustomerContactsFilterValues>(EMPTY_FILTERS);
  const [limit, setLimit] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<CustomerContactItem[]>([]);
  const [meta, setMeta] = useState<CustomerContactsMeta>(EMPTY_META);
  const [reasonOptions, setReasonOptions] = useState<string[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<CustomerContactItem | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [loadingRequestId, setLoadingRequestId] = useState<number | null>(null);

  const fetchContacts = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      const params: CustomerContactsParams = {
        limit,
        offset: (page - 1) * limit,
        ...(appliedFilters.since && { since: appliedFilters.since }),
        ...(appliedFilters.until && { until: appliedFilters.until }),
        ...(appliedFilters.customer_id && {
          customer_id: appliedFilters.customer_id,
        }),
        ...(appliedFilters.order_id && {
          order_id: appliedFilters.order_id,
        }),
        ...(appliedFilters.reason_id && {
          reason_id: appliedFilters.reason_id,
        }),
      };

      try {
        const response = await customerContactsService.getAll(params);
        const responseItems = Array.isArray(response.items) ? response.items : [];

        setItems(responseItems);
        setMeta(response.meta ?? EMPTY_META);
        setCurrentPage(page);
      } catch {
        setItems([]);
        setMeta({ ...EMPTY_META, limit, offset: (page - 1) * limit });
        setError("Failed to load customer contacts. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, limit]
  );

  useEffect(() => {
    fetchContacts(1);
  }, [fetchContacts]);

  useEffect(() => {
    let active = true;

    setReasonsLoading(true);

    customerContactsService
      .getOnHoldReasonOptions()
      .then((options) => {
        if (active) {
          setReasonOptions(options);
        }
      })
      .catch(() => {
        if (active) {
          setReasonOptions([]);
        }
      })
      .finally(() => {
        if (active) {
          setReasonsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleFilterChange = (
    name: keyof CustomerContactsFilterValues,
    value: string | boolean
  ) => {
    setDraftFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      draftFilters.since &&
      draftFilters.until &&
      draftFilters.since > draftFilters.until
    ) {
      setValidationError("The Since date cannot be after the Until date.");
      return;
    }

    setValidationError(null);
    setAppliedFilters(cleanFilters(draftFilters));
  };

  const handleClear = () => {
    setValidationError(null);
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const openRequestModal = async (item: CustomerContactItem) => {
    const contactRequestId = getValidContactRequestId(item.contact_request_id);

    setRequestError(null);
    setRequestSuccess(null);
    setError(null);

    // CREATE: the unified listing already gives us the canonical order_id.
    if (!contactRequestId) {
      setSelectedRequest(item);
      setRequestModalOpen(true);
      return;
    }

    // EDIT: load the contact request by contact_request_id so fields that are
    // not part of the listing (PO, notes, order_date, etc.) are not lost.
    setLoadingRequestId(contactRequestId);

    try {
      const detail = await customerContactsService.getById(contactRequestId);

      setSelectedRequest({
        ...item,
        order_id: detail.order_id,
        order_number: detail.po ?? item.order_number ?? null,
        contact_request_id: contactRequestId,
        customer_id: detail.customer_id,
        customer_name: detail.customer_name,
        phone: detail.phone,
        email: detail.email,
        order_date: detail.order_date,
        notes: detail.notes,
        reason: detail.reason,
        po: detail.po,
      });
      setRequestModalOpen(true);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Could not load the contact request for editing. Please try again."
        )
      );
    } finally {
      setLoadingRequestId(null);
    }
  };

  const closeRequestModal = () => {
    if (savingRequest) return;

    setRequestModalOpen(false);
    setSelectedRequest(null);
    setRequestError(null);
    setRequestSuccess(null);
  };

  const handleSaveRequest = async (
    payload: SaveCustomerContactRequestPayload
  ) => {
    setSavingRequest(true);
    setRequestError(null);
    setRequestSuccess(null);

    const editingRequestId = getValidContactRequestId(
      payload.contact_request_id
    );

    try {
      await customerContactsService.saveContactRequest(payload);

      setRequestSuccess(
        editingRequestId
          ? "Customer contact request was updated successfully."
          : "Customer contact request was created successfully."
      );

      // The backend now returns one unified row and preserves the
      // contact_request_id relation, so always reload the current page.
      await fetchContacts(currentPage);
    } catch (requestError) {
      setRequestError(getApiErrorMessage(requestError));
    } finally {
      setSavingRequest(false);
    }
  };

  const openDetail = (item: CustomerContactItem) => {
    const contactRequestId = getValidContactRequestId(item.contact_request_id);
    if (!contactRequestId) return;

    // Detail endpoint is keyed by contact_request_id.
    navigate(`/customer-contacts/${contactRequestId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));
  const startIndex = meta.total === 0 ? 0 : meta.offset + 1;
  const endIndex = Math.min(meta.offset + items.length, meta.total);

  return (
    <>
      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
        <CustomerContactsFilters
          values={draftFilters}
          limit={limit}
          reasonOptions={reasonOptions}
          reasonsLoading={reasonsLoading}
          onChange={handleFilterChange}
          onLimitChange={setLimit}
          onSearch={handleSearch}
          onClear={handleClear}
        />

        {validationError && (
          <div className="mx-4 mt-4 rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            {validationError}
          </div>
        )}

        {meta.partial && (
          <div className="mx-4 mt-4 rounded-lg bg-warning-50 px-3 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Some data sources are temporarily unavailable
            {meta.unavailable_sources.length > 0
              ? `: ${meta.unavailable_sources.join(", ")}`
              : ""}
            . The displayed results may be incomplete.
          </div>
        )}

        <div className="custom-scrollbar w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
          {error && (
            <div className="m-4 rounded-lg bg-red-100 px-3 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10 border-t border-gray-100 bg-white dark:border-white/[0.05] dark:bg-gray-900">
                <TableRow>
                  {[
                    { label: "Detail", width: "w-[4%]" },
                    { label: "Request", width: "w-[5%]" },
                    { label: "Order #", width: "w-[8%]" },
                    { label: "Customer ID", width: "w-[7%]" },
                    { label: "Customer", width: "w-[11%]" },
                    { label: "Phone", width: "w-[9%]" },
                    { label: "Email", width: "w-[15%]" },
                    { label: "Order Date", width: "w-[8%]" },
                    { label: "On-hold Reason", width: "w-[9%]" },
                    { label: "Last Contacted", width: "w-[10%]" },
                    { label: "Contacts", width: "w-[5%]" },
                    { label: "Notes", width: "w-[9%]" },
                  ].map((header) => (
                    <TableCell
                      key={header.label}
                      isHeader
                      className={`${header.width} border border-gray-100 px-1.5 py-2 align-middle dark:border-white/[0.05]`}
                    >
                      <p className="text-center text-[11px] font-medium leading-4 text-gray-700 dark:text-gray-400">
                        {header.label}
                      </p>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No customer contacts found for the selected filters.
                    </td>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const contactRequestId = getValidContactRequestId(
                      item.contact_request_id
                    );

                    return (
                      <TableRow key={`${item.type}-${item.order_id}-${contactRequestId ?? "new"}`}>
                        <TableCell className="border border-gray-100 px-1 py-2 text-center align-middle dark:border-white/[0.05]">
                          {contactRequestId ? (
                            <button
                              type="button"
                              onClick={() => openDetail(item)}
                              title="View customer contact detail"
                              aria-label="View customer contact detail"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                            >
                              <DetailIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <span
                              className="text-gray-300 dark:text-gray-700"
                              title="This order does not have a contact request yet"
                            >
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1 py-2 text-center align-middle dark:border-white/[0.05]">
                          <button
                            type="button"
                            onClick={() => void openRequestModal(item)}
                            disabled={contactRequestId !== null && loadingRequestId === contactRequestId}
                            title={
                              contactRequestId
                                ? `Edit contact request #${contactRequestId}`
                                : "Create contact request"
                            }
                            aria-label={
                              contactRequestId
                                ? `Edit contact request ${contactRequestId}`
                                : `Create contact request for order ${item.order_id || "unavailable"}`
                            }
                            className={
                              contactRequestId
                                ? "inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-brand-500/10"
                                : "inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500 transition-colors hover:bg-brand-100 disabled:cursor-wait disabled:opacity-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
                            }
                          >
                            {loadingRequestId === contactRequestId && contactRequestId ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="9"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z"
                                />
                              </svg>
                            ) : contactRequestId ? (
                              <PencilIcon className="h-4 w-4" />
                            ) : (
                              <PlusIcon className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="break-all border border-gray-100 px-1.5 py-2 align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {item.order_number ?? item.order_id ?? "—"}
                        </TableCell>
                        <TableCell className="break-all border border-gray-100 px-1.5 py-2 align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {item.customer_id || "—"}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 align-top dark:border-white/[0.05]">
                          <p
                            className="break-words text-xs font-medium leading-4 text-gray-800 dark:text-white/90"
                            title={item.customer_name || undefined}
                          >
                            {item.customer_name || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="break-words border border-gray-100 px-1.5 py-2 align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {item.phone || "—"}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 align-top lowercase text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          <span
                            className="block break-all leading-4"
                            title={item.email || undefined}
                          >
                            {item.email || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 text-center align-top text-[11px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {formatDate(item.order_date)}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          <span
                            className="block break-words leading-4"
                            title={item.onhold_reason || undefined}
                          >
                            {item.onhold_reason || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 text-center align-top text-[11px] leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {formatDateTime(item.last_contacted)}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1 py-2 text-center align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          {item.contact_count}
                        </TableCell>
                        <TableCell className="border border-gray-100 px-1.5 py-2 align-top text-xs leading-4 text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                          <span
                            className="block break-words leading-4"
                            title={item.notes || undefined}
                          >
                            {item.notes || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div className="rounded-b-xl border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
              <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                Showing {startIndex} to {endIndex} of {meta.total} entries
              </p>
              <PaginationWithIcon
                key={`${currentPage}-${totalPages}`}
                totalPages={totalPages}
                initialPage={currentPage}
                onPageChange={fetchContacts}
              />
            </div>
          </div>
        )}
      </div>

      {selectedRequest && (
        <CustomerContactRequestModal
          isOpen={requestModalOpen}
          contact={selectedRequest}
          saving={savingRequest}
          error={requestError}
          success={requestSuccess}
          onClose={closeRequestModal}
          onSubmit={handleSaveRequest}
        />
      )}
    </>
  );
}
