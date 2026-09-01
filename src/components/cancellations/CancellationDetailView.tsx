import type { CancellationDetail as CancellationDetailType } from "../../lib/cancellations/types";
import { formatDate, formatDateTime } from "../../utils/date";
import OrderDetailLink from "../orders/OrderDetailLink";

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CancellationDetailView({
  cancellation,
}: {
  cancellation: CancellationDetailType;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Order {cancellation.orderNumber}
            </h2>
            <OrderDetailLink orderNumber={cancellation.orderNumber} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order date: {formatDate(cancellation.orderDate)} &middot; Cancelled: {formatDateTime(cancellation.cancellationDate)}
          </p>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold ${
            cancellation.type === "Total"
              ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
              : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
          }`}
        >
          {cancellation.type} cancellation
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Name</dt>
              <dd className="text-gray-800 dark:text-white/90">{cancellation.customer?.name || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-white/90 lowercase break-all">{cancellation.customer?.email || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-white/90">{cancellation.customer?.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Cancellation</p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Reason</dt>
              <dd className="text-gray-800 dark:text-white/90">{cancellation.reason || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Handled by</dt>
              <dd className="text-gray-800 dark:text-white/90">{cancellation.user || "—"}</dd>
            </div>
            {cancellation.note && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-gray-400">Note</dt>
                <dd className="text-gray-800 dark:text-white/90">{cancellation.note}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Cancelled items */}
      {cancellation.items?.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Cancelled Items ({cancellation.items.length})
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Manufacturer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Part #</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Qty</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Refunded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {cancellation.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{item.mfr}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{item.partNumber}</td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{item.cancelledQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {fmtCurrency(item.refundedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
