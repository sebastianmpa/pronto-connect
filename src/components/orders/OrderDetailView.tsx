import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useLocation, useNavigate } from "react-router";
import { useModal } from "../../hooks/useModal";
import { formatDate, formatDateTime } from "../../utils/date";
import CancelOrderModal from "./CancelOrderModal";
import ChangeCustomerInfoModal from "./ChangeCustomerInfoModal";
import OrderClientRequestsPanel from "./OrderClientRequestsPanel";
import OrderNotesPanel from "./OrderNotesPanel";
import RevertCancellationModal, {
  type RevertCancellationTarget,
} from "./RevertCancellationModal";
import partsService from "../../lib/parts/partsService";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";
import type { CustomerHistory } from "../../lib/customers/types";

// The customer status message can contain HTML (e.g. tracking links), so sanitize before rendering.
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined || String(val).trim() === "") return "—";
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(val);
}

function fmtStatusDate(raw?: string | null): string | null {
  return raw ? formatDate(raw) : null;
}

function fmtHistoryCurrency(value: number): string {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isFinalCancelledStatus(value: unknown): boolean {
  const status = normalizeStatus(value);

  return status === "cancelled" || status === "canceled" || status === "refunded";
}

function isYesFlag(value: unknown): boolean {
  return String(value ?? "").trim().toUpperCase() === "Y";
}

function isCancelledValue(value: unknown): boolean {
  const status = normalizeStatus(value);
  return status === "cancelled" || status === "canceled";
}

function isRefundedValue(value: unknown): boolean {
  return normalizeStatus(value) === "refunded";
}

function firstDisplayValue(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text !== "") return text;
  }

  return "—";
}

function resolveItemStatus(item: OrderDetailType["items"][number]): string {
  if (isYesFlag(item.refunded)) return "refunded";
  if (isYesFlag(item.cancelled)) return "cancelled";
  return firstText(item.item_status, "-");
}

function itemStatusClasses(status: string): string {
  const normalized = normalizeStatus(status);

  if (normalized === "refunded") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }

  return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
}

function resolveIdealPartDetailInfo(item: OrderDetailType["items"][number]) {
  return {
    mfr: firstText(item.mfr),
    partnumber: firstText(item.partnumber),
  };
}

function orderItemKey(item: OrderDetailType["items"][number]): string {
  return String(
    item.item_id_internal ??
      item.id ??
      `${String(item.mfr ?? "")}|${String(item.partnumber ?? "")}`,
  );
}

const STEPS = [
  "Received",
  "Processing",
  "Awaiting Shipment",
  "On the way",
  "Delivered",
];

export default function OrderDetailView({
  order,
  onCancelled,
  purchaseHistory,
  purchaseHistoryLoading = false,
  partDetailBackTo,
}: {
  order: OrderDetailType;
  onCancelled?: () => void;
  purchaseHistory?: CustomerHistory | null;
  purchaseHistoryLoading?: boolean;
  partDetailBackTo?: string;
}) {
  const cancelModal = useModal();
  const customerInfoModal = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  const [revertTarget, setRevertTarget] = useState<RevertCancellationTarget | null>(null);

  // The visible customer-service status must come from customer_service_status.status.
  // status_text/business_status can represent a different order/business status.
  const customerServiceStatus = firstText(
    order.customer_service_status?.status,
    order.status_text,
  );

  // IDEAL status is returned directly by the order-detail endpoint.
  // Keep it separate from the customer-service/business status because they
  // represent different states of the same order.
  const idealStatus = firstText(order.status_ideal);

  // Internal Sales Order ID from IDEAL. This is different from the storefront order number.
  const idealOrderId = firstText(order.ideal?.order_id, order.order_id);

  // Keep cancellation-related statuses visually highlighted in the stepper,
  // including "CANCELLATION UNDER REVIEW".
  const isCancelledStatus = /cancel/i.test(customerServiceStatus);

  // IMPORTANT: "CANCELLATION UNDER REVIEW" is not a final cancellation.
  // Do not hide Cancel Order merely because the visible status contains the word "cancel".
  const isAlreadyCancelled =
    isYesFlag(order.cancelled) ||
    isYesFlag(order.refunded) ||
    isFinalCancelledStatus(customerServiceStatus) ||
    isFinalCancelledStatus(order.status_text) ||
    isFinalCancelledStatus(order.business_status?.name);

  // Revert actions are disabled after the order reaches On the way or Delivered.
  const orderStatusCandidates = [
    order.customer_service_status?.status,
    order.customer_service_status?.order_status_internal_name,
    order.status_text,
    order.business_status?.name,
    order.header?.status,
  ];

  const revertBlockedByOrderStatus = orderStatusCandidates.some((value) => {
    const normalized = normalizeStatus(value);
    return normalized === "on the way" || normalized === "delivered";
  });

  // A refund means BigCommerce already processed the cancellation, so reversal is no longer offered.
  const orderIsCancelled =
    isYesFlag(order.cancelled) ||
    orderStatusCandidates.some((value) => isCancelledValue(value));

  const orderIsRefunded =
    isYesFlag(order.refunded) ||
    orderStatusCandidates.some((value) => isRefundedValue(value));

  const showOrderRevert =
    orderIsCancelled &&
    !orderIsRefunded &&
    !revertBlockedByOrderStatus;

  const [totalInvoicesByItem, setTotalInvoicesByItem] =
    useState<Record<string, number | null>>({});

  useEffect(() => {
    let active = true;

    if (!order.items?.length) {
      setTotalInvoicesByItem({});
      return () => {
        active = false;
      };
    }

    setTotalInvoicesByItem({});

    Promise.all(
      order.items.map(async (item) => {
        const { mfr, partnumber } = resolveIdealPartDetailInfo(item);

        if (!mfr || !partnumber) {
          return [orderItemKey(item), null] as const;
        }

        try {
          const detail = await partsService.getDetail({
            mfr,
            partNumber: partnumber,
            locationId: 4,
          });
          const rawTotal = detail.total_invoices as unknown;
          const parsed = Number(rawTotal);
          return [
            orderItemKey(item),
            rawTotal !== null && rawTotal !== undefined && Number.isFinite(parsed)
              ? parsed
              : null,
          ] as const;
        } catch {
          return [orderItemKey(item), null] as const;
        }
      }),
    ).then((entries) => {
      if (!active) return;
      setTotalInvoicesByItem(
        Object.fromEntries(entries) as Record<string, number | null>,
      );
    });

    return () => {
      active = false;
    };
  }, [order.items]);

  const openPartDetail = (item: OrderDetailType["items"][number]) => {
    const { mfr, partnumber } = resolveIdealPartDetailInfo(item);

    if (!mfr || !partnumber) {
      return;
    }

    navigate(
      `/parts/${encodeURIComponent(mfr)}/${encodeURIComponent(partnumber)}?locationid=4`,
      {
        state: {
          from:
            partDetailBackTo?.trim() ||
            `${location.pathname}${location.search}`,
        },
      },
    );
  };

  const openOrderRevert = () => {
    setRevertTarget({ type: "Total" });
  };

  const openItemRevert = (item: OrderDetailType["items"][number]) => {
    const { mfr, partnumber } = resolveIdealPartDetailInfo(item);
    const itemStatus = resolveItemStatus(item);

    setRevertTarget({
      type: "Partial",
      mfr,
      partnumber,
      itemName: firstText(item.description, item.name),
      itemStatus,
    });
  };

  const closeRevertModal = () => {
    setRevertTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Order #{order.order_number}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(order.header?.date_created)} &middot; via{" "}
            <span className="capitalize">{order.source}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Order ID:{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {idealOrderId || "—"}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {customerServiceStatus}
            </span>

            <span
              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
              title="Status returned by IDEAL"
            >
              IDEAL: {idealStatus || "—"}
            </span>
          </div>

          {order.internal_eta && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-right dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                Internal ETA
              </p>
              <p className="mt-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {formatDate(order.internal_eta)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={customerInfoModal.openModal}
              className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
            >
              Change customer&apos;s Info
            </button>

            {!isAlreadyCancelled && (
              <button
                type="button"
                onClick={cancelModal.openModal}
                className="rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
              >
                Cancel Order
              </button>
            )}

            {showOrderRevert && (
              <button
                type="button"
                onClick={openOrderRevert}
                className="rounded-lg border border-success-300 bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700 transition-colors hover:bg-success-100 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20"
              >
                Revert cancellation
              </button>
            )}
          </div>
        </div>
      </div>

      <CancelOrderModal
        isOpen={cancelModal.isOpen}
        onClose={cancelModal.closeModal}
        order={order}
        onCancelled={onCancelled}
      />

      <ChangeCustomerInfoModal
        isOpen={customerInfoModal.isOpen}
        onClose={customerInfoModal.closeModal}
        order={order}
        onUpdated={onCancelled}
      />

      <RevertCancellationModal
        isOpen={revertTarget !== null}
        onClose={closeRevertModal}
        orderNumber={order.order_number}
        target={revertTarget}
        onReverted={onCancelled}
      />

      {/* Progress stepper */}
      {order.customer_service_status && (
        <div>
          <div className="flex items-start">
            {STEPS.map((label, i) => {
              const currentIndex = (order.customer_service_status?.step ?? 0) - 1;
              const completed = i < currentIndex;
              const current = i === currentIndex;

              // The API status replaces the predefined label only on the active step.
              // Example: step=2 + status="PICKING" => circle 2 displays PICKING,
              // while the remaining circles keep their predefined labels.
              const displayLabel = current && customerServiceStatus ? customerServiceStatus : label;

              // The segment right before this circle is "done" once the previous circle is completed.
              const segmentBeforeDone = i > 0 && i - 1 < currentIndex;

              // The segment right after this circle is "done" once this circle itself is completed.
              const segmentAfterDone = completed;

              // Step 1 always keeps the order's own date; other steps show "Done" once passed,
              // or the status date from the API while they're the current step.
              const stepDate =
                i === 0
                  ? fmtStatusDate(order.header?.date_created)
                  : completed
                    ? "Done"
                    : current
                      ? fmtStatusDate(order.customer_service_status?.date)
                      : null;

              return (
                <div key={label} className="flex flex-1 flex-col items-center">
                  <div className="relative flex h-9 w-full items-center justify-center">
                    {i > 0 && (
                      <div
                        className={`absolute top-1/2 left-0 h-1 w-1/2 -translate-y-1/2 rounded-full ${
                          segmentBeforeDone ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    )}

                    {i < STEPS.length - 1 && (
                      <div
                        className={`absolute top-1/2 right-0 h-1 w-1/2 -translate-y-1/2 rounded-full ${
                          segmentAfterDone ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        current && isCancelledStatus
                          ? "bg-red-500 text-white ring-2 ring-red-200 dark:ring-red-500/30"
                          : completed
                            ? "bg-green-500 text-white"
                            : current
                              ? "bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-500/30"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                      }`}
                    >
                      {current && isCancelledStatus ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M8 8L16 16M16 8L8 16"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                  </div>

                  <span
                    className={`mt-1.5 text-xs text-center ${
                      current && isCancelledStatus
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : completed
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : current
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-gray-400"
                    }`}
                  >
                    {displayLabel}
                  </span>

                  {stepDate && (
                    <span className="text-[11px] text-center text-gray-600 dark:text-gray-400">
                      {stepDate}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {(order.customer_service_status.customer_message || fmtStatusDate(order.customer_service_status.date)) && (
            <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 [&_a]:font-semibold [&_a]:underline">
              {order.customer_service_status.customer_message && (
                <p
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(order.customer_service_status.customer_message),
                  }}
                />
              )}

              {fmtStatusDate(order.customer_service_status.date) && (
                <p className={order.customer_service_status.customer_message ? "mt-1 text-xs opacity-80" : "text-xs opacity-80"}>
                  Status date: {fmtStatusDate(order.customer_service_status.date)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order information: two columns for order data + one column for activity */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:items-start">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          {/* Billing and Shipping share the two-column order area. */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {order.header?.billing_address && (
              <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Billing</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {order.header.billing_address.first_name} {order.header.billing_address.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.header.billing_address.street_1}</p>
                {order.header.billing_address.street_2 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.header.billing_address.street_2}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.header.billing_address.city}, {order.header.billing_address.state}{" "}
                  {order.header.billing_address.zip}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.header.billing_address.country}</p>
                {order.header.billing_address.phone && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{order.header.billing_address.phone}</p>
                )}
                {order.header.billing_address.email && (
                  <p className="break-all text-sm lowercase text-gray-500 dark:text-gray-400">
                    {order.header.billing_address.email}
                  </p>
                )}
              </div>
            )}

            {order.shipping_addresses?.[0] && (
              <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Shipping</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {order.shipping_addresses[0].first_name} {order.shipping_addresses[0].last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].street_1}</p>
                {order.shipping_addresses[0].street_2 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].street_2}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.shipping_addresses[0].city}, {order.shipping_addresses[0].state}{" "}
                  {order.shipping_addresses[0].zip}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].country}</p>
                {order.shipping_addresses[0].phone && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].phone}</p>
                )}
                {order.shipping_addresses[0].email && (
                  <p className="break-all text-sm lowercase text-gray-500 dark:text-gray-400">
                    {order.shipping_addresses[0].email}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">Method: {order.shipping_addresses[0].shipping_method}</p>
                <p className="text-xs text-gray-400">Shipping: {fmt(order.shipping_addresses[0].cost_inc_tax)}</p>
              </div>
            )}
          </div>

          {/* Purchase History uses the same customer-detail endpoint/data as Customer Detail. */}
          <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Purchase History
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
                <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {purchaseHistoryLoading
                    ? "..."
                    : purchaseHistory
                      ? purchaseHistory.totalOrders
                      : "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
                <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {purchaseHistoryLoading
                    ? "..."
                    : purchaseHistory
                      ? fmtHistoryCurrency(purchaseHistory.totalAmount)
                      : "—"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
              </div>
            </div>
          </div>

          {/* Items stay inside the same two-column order area. */}
          {order.items?.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Items ({order.header?.items_total ?? order.items.length})
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">MFR</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">ALLOC</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">BO</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">NET</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Internal ETA</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Total Invoices</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Dtl.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {order.items.map((item) => (
                      <tr key={orderItemKey(item)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                          {firstDisplayValue(item.mfr)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                          {firstDisplayValue(item.partnumber)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {firstDisplayValue(item.quantity_ordered)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {firstDisplayValue(item.ALLOC)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {firstDisplayValue(item.BO)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {fmt(item.net)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90">
                          {fmt(item.total_price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const itemStatus = resolveItemStatus(item);
                            const itemIsCancelled =
                              isYesFlag(item.cancelled) ||
                              isCancelledValue(itemStatus);
                            const itemIsRefunded =
                              isYesFlag(item.refunded) ||
                              isRefundedValue(itemStatus);
                            const showItemRevert =
                              itemIsCancelled &&
                              !itemIsRefunded &&
                              !revertBlockedByOrderStatus;
                            const { mfr, partnumber } = resolveIdealPartDetailInfo(item);
                            const hasRevertIdentifiers = Boolean(mfr && partnumber);

                            return (
                              <div className="flex flex-col items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${itemStatusClasses(String(item.item_status ?? ""))}`}
                                >
                                  {String(item.item_status ?? "—")}
                                </span>

                                {showItemRevert && (
                                  <button
                                    type="button"
                                    onClick={() => openItemRevert(item)}
                                    disabled={!hasRevertIdentifiers}
                                    title={
                                      hasRevertIdentifiers
                                        ? `Revert cancellation: ${mfr} ${partnumber}`
                                        : "MFR or Part Number is not available for this item"
                                    }
                                    className="rounded-lg border border-success-300 bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 transition-colors hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20"
                                  >
                                    Revert
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {item.item_internal_eta ? formatDate(item.item_internal_eta) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                          {totalInvoicesByItem[orderItemKey(item)] === undefined
                            ? "..."
                            : totalInvoicesByItem[orderItemKey(item)] ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {(() => {
                            const { mfr, partnumber } = resolveIdealPartDetailInfo(item);
                            const canOpenPartDetail = Boolean(mfr) && Boolean(partnumber);

                            return canOpenPartDetail ? (
                              <button
                                type="button"
                                onClick={() => openPartDetail(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.10] dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                                title={`View part detail: ${mfr} ${partnumber}`}
                                aria-label={`View part detail for ${mfr} ${partnumber}`}
                              >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path
                                    d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.6" />
                                </svg>
                              </button>
                            ) : (
                              <span
                                className="inline-flex h-8 w-8 items-center justify-center text-gray-300 dark:text-gray-700"
                                title="MFR or Part Number is not available for this item"
                              >
                                -
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals also remain in the order-data area. */}
          {order.header && (
            <div className="flex flex-col items-end gap-1 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
              <div className="flex w-full max-w-xs justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{fmt(order.header.subtotal_inc_tax)}</span>
              </div>
              <div className="flex w-full max-w-xs justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span>{fmt(order.header.shipping_cost_inc_tax)}</span>
              </div>
              <div className="flex w-full max-w-xs justify-between font-semibold text-gray-800 dark:text-white/90">
                <span>Total</span>
                <span>{fmt(order.header.total_inc_tax)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Payment: {order.header.payment_method} &middot; {order.header.payment_status}
              </p>
            </div>
          )}
        </div>

        {/* Notes + activity occupy the remaining third. */}
        <div className="min-w-0 space-y-5 xl:col-span-1 xl:self-start">
          <OrderNotesPanel
            orderNumber={String(order.order_number)}
            ideal={order.ideal}
            bigcommerce={order.bigcommerce}
            customerSupportNotes={order.customer_support_notes}
          />

          <OrderClientRequestsPanel
            atcForms={order.atc_forms}
            cancellations={order.cancellations}
            customerContacts={order.customer_contacts}
            smsLogs={order.sms_logs}
            emailLogs={order.email_logs}
          />
        </div>
      </div>
    </div>
  );
}
