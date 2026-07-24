import type { CustomerDetail as CustomerDetailType } from "../../lib/customers/types";

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function storeLabel(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function CustomerDetailView({ detail }: { detail: CustomerDetailType }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {detail.profile.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customer ID: {detail.customerId} &middot; {storeLabel(detail.store)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            detail.source === "ideal"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
              : "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
          }`}>
            {detail.source}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
            {detail.matchType}
          </span>
        </div>
      </div>

      {/* Profile */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Contact Info</p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-white/90 lowercase break-all">{detail.profile.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-white/90">{detail.profile.phone || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Address</dt>
              <dd className="text-gray-800 dark:text-white/90">{detail.profile.address || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Purchase history */}
        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Purchase History</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3 text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{detail.history.totalOrders}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3 text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">{fmtCurrency(detail.history.totalAmount)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-white/80">{detail.history.salesOrder.totalOrders}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales Orders</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-white/80">{detail.history.salesInvoice.totalOrders}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Orders */}
      {detail.store_orders.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Store Orders ({detail.store_orders.length})
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Store</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {detail.store_orders.map((o, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {storeLabel(o.store)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {o.latest_order_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {fmtDate(o.latest_order_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {fmtCurrency(o.latest_order_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMS Logs */}
      {detail.sms_logs.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            SMS Logs ({detail.sms_logs.length})
          </p>
          <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
              {JSON.stringify(detail.sms_logs, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {detail.sms_logs.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">No SMS logs found for this customer.</p>
      )}
    </div>
  );
}
