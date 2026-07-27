import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";

function fmt(val: string): string {
  const n = parseFloat(val);
  return isNaN(n) ? val : `$${n.toFixed(2)}`;
}

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
}

function fmtStatusDate(raw?: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

const STEPS = ["Received", "Processing", "Shipped", "Delivered"];

export default function OrderDetailView({ order }: { order: OrderDetailType }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Order #{order.order_number}
          </h2>
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
          <div className="flex items-start">
            {STEPS.map((label, i) => {
              const currentIndex = (order.customer_service_status?.step ?? 0) - 1;
              const completed = i < currentIndex;
              const current = i === currentIndex;
              // The segment right before this circle is "done" once the previous circle is completed.
              const segmentBeforeDone = i > 0 && i - 1 < currentIndex;
              // The segment right after this circle is "done" once this circle itself is completed.
              const segmentAfterDone = completed;
              return (
                <div key={label} className="flex flex-1 flex-col items-center last:flex-none">
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
                </div>
              );
            })}
          </div>
          {(order.customer_service_status.customer_message || fmtStatusDate(order.customer_service_status.date)) && (
            <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              {order.customer_service_status.customer_message && (
                <p>{order.customer_service_status.customer_message}</p>
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

      {/* Addresses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <p className="text-sm text-gray-500 dark:text-gray-400 lowercase">{order.header.billing_address.email}</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {order.shipping_addresses[0].city}, {order.shipping_addresses[0].state}{" "}
              {order.shipping_addresses[0].zip}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping_addresses[0].country}</p>
            <p className="mt-2 text-xs text-gray-400">Method: {order.shipping_addresses[0].shipping_method}</p>
            <p className="text-xs text-gray-400">Shipping: {fmt(order.shipping_addresses[0].cost_inc_tax)}</p>
          </div>
        )}
      </div>

      {/* Items table */}
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
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmt(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{fmt(item.total_price)}</td>
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
  );
}
