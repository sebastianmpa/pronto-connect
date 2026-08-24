import DOMPurify from "dompurify";
import { useLocation, useNavigate } from "react-router";
import { useModal } from "../../hooks/useModal";
import { formatDate, formatDateTime } from "../../utils/date";
import CancelOrderModal from "./CancelOrderModal";
import OrderClientRequestsPanel from "./OrderClientRequestsPanel";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";

// The customer status message can contain HTML (e.g. tracking links), so sanitize before rendering.
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

function fmt(val: string): string {
  const n = parseFloat(val);
  return isNaN(n) ? val : `$${n.toFixed(2)}`;
}

function fmtStatusDate(raw?: string | null): string | null {
  return raw ? formatDate(raw) : null;
}

const STEPS = ["Received", "Processing", "Shipped", "Delivered"];

export default function OrderDetailView({
  order,
  onCancelled,
}: {
  order: OrderDetailType;
  onCancelled?: () => void;
}) {
  const cancelModal = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const isAlreadyCancelled = /cancel/i.test(order.status_text ?? "") || /cancel/i.test(order.business_status?.name ?? "");

  const storeId =
    order.storeid ??
    order.store?.id ??
    order.store?.storeid ??
    order.store?.store_id ??
    null;

  const openPartDetail = (item: OrderDetailType["items"][number]) => {
    const brand = String(item.brand ?? "").trim();
    const mpn = String(item.mpn ?? "").trim();

    if (!brand || !mpn || storeId === null || storeId === undefined || String(storeId).trim() === "") {
      return;
    }

    navigate(
      `/parts/bc/${encodeURIComponent(brand)}/${encodeURIComponent(mpn)}?storeid=${encodeURIComponent(String(storeId))}`,
      {
        state: { from: `${location.pathname}${location.search}` },
      },
    );
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
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            {order.status_text}
          </span>
          {!isAlreadyCancelled && (
            <button
              onClick={cancelModal.openModal}
              className="rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <CancelOrderModal
        isOpen={cancelModal.isOpen}
        onClose={cancelModal.closeModal}
        order={order}
        onCancelled={onCancelled}
      />

      {/* Progress stepper */}
      {order.customer_service_status && (
        <div>
          <div className="flex items-start">
            {STEPS.map((label, i) => {
              const currentIndex = (order.customer_service_status?.step ?? 0) - 1;
              const completed = i < currentIndex;
              const current = i === currentIndex;
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
                        completed
                          ? "bg-green-500 text-white"
                          : current
                            ? "bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-500/30"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <span
                    className={`mt-1.5 text-xs text-center ${
                      completed
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : current
                          ? "text-blue-600 dark:text-blue-400 font-medium"
                          : "text-gray-400"
                    }`}
                  >
                    {label}
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
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Unit</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Dtl.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.url_thumbnail && (
                              <img
                                src={item.url_thumbnail}
                                alt={item.name}
                                className="h-10 w-10 rounded-lg border border-gray-100 bg-white object-contain dark:border-white/[0.06]"
                              />
                            )}
                            <span className="max-w-xs break-words font-medium text-gray-800 dark:text-white/90">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{item.sku}</td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(item.unit_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90">{fmt(item.total_price)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium capitalize text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                            {String(item.item_status ?? "-").toLowerCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {item.brand && item.mpn && storeId !== null && storeId !== undefined && String(storeId).trim() !== "" ? (
                            <button
                              type="button"
                              onClick={() => openPartDetail(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-white/[0.10] dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                              title={`View part detail: ${item.brand} ${item.mpn}`}
                              aria-label={`View part detail for ${item.brand} ${item.mpn}`}
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
                              title="Brand, MPN or Store ID is not available for this item"
                            >
                              -
                            </span>
                          )}
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

        {/* Activity occupies only the remaining third and scrolls internally. */}
        <div className="min-w-0 xl:col-span-1 xl:self-start">
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
