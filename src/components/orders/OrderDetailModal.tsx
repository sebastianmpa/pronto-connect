import { Modal } from "../ui/modal";
import type { OrderDetail } from "../../lib/orders/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function fmt(val: string): string {
  const n = parseFloat(val);
  return isNaN(n) ? val : `$${n.toFixed(2)}`;
}

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
}

const STEPS = ["Received", "Processing", "Shipped", "Delivered"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  loading,
  error,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-6xl rounded-2xl bg-white p-6 dark:bg-gray-900 overflow-y-auto overflow-x-hidden max-h-[92vh]"
    >
      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
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
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !error && order && (
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Order #{order.order_number}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fmtDate(order.header?.date_created)} &middot; via{" "}
                <span className="capitalize">{order.source}</span>
              </p>
            </div>
            <span className="inline-flex items-center self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {order.status_text}
            </span>
          </div>

          {/* Progress stepper */}
          {order.customer_service_status && (
            <div>
              <div className="flex items-center gap-0">
                {STEPS.map((label, i) => {
                  const active = i < (order.customer_service_status?.step ?? 0);
                  const current = i === (order.customer_service_status?.step ?? 0) - 1;
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          active
                            ? "bg-brand-500 text-gray-900"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        } ${current ? "ring-2 ring-brand-300" : ""}`}
                      >
                        {i + 1}
                      </div>
                      <span className={`mt-1 text-xs ${active ? "text-brand-600 dark:text-brand-400 font-medium" : "text-gray-400"}`}>
                        {label}
                      </span>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`absolute mt-4 hidden h-px w-full sm:block ${
                            i + 1 < (order.customer_service_status?.step ?? 0)
                              ? "bg-brand-500"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {order.customer_service_status.customer_message && (
                <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  {order.customer_service_status.customer_message}
                </p>
              )}
            </div>
          )}

          {/* Addresses */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Billing */}
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
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {order.header.billing_address.phone}
                  </p>
                )}
                {order.header.billing_address.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 lowercase">
                    {order.header.billing_address.email}
                  </p>
                )}
              </div>
            )}

            {/* Shipping */}
            {order.shipping_addresses?.[0] && (
              <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Shipping</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {order.shipping_addresses[0].first_name} {order.shipping_addresses[0].last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].street_1}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.shipping_addresses[0].city}, {order.shipping_addresses[0].state}{" "}
                  {order.shipping_addresses[0].zip}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].country}</p>
                <p className="mt-2 text-xs text-gray-400">
                  Method: {order.shipping_addresses[0].shipping_method}
                </p>
                <p className="text-xs text-gray-400">
                  Shipping cost: {fmt(order.shipping_addresses[0].cost_inc_tax)}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
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
                                className="h-10 w-10 rounded-lg object-contain border border-gray-100 dark:border-white/[0.06] bg-white"
                              />
                            )}
                            <span className="font-medium text-gray-800 dark:text-white/90 line-clamp-2 max-w-xs">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.sku}</td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {fmt(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                          {fmt(item.total_price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 capitalize">
                            {item.item_status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
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
      )}
    </Modal>
  );
}
