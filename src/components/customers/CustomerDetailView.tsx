import { useLocation, useNavigate } from "react-router";
import type { CustomerDetail as CustomerDetailType } from "../../lib/customers/types";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

function fmtDateTime(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
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
  const navigate = useNavigate();
  const location = useLocation();
  const backState = { from: `${location.pathname}${location.search}` };

  const storeOrders = detail.store_orders ?? [];
  const smsLogs = detail.sms_logs ?? [];
  const zohoTickets = detail.zoho_tickets ?? [];

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
              <p className="text-lg font-semibold text-gray-700 dark:text-white/80">{detail.history.salesOrder?.totalOrders ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales Orders</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-white/80">{detail.history.salesInvoice?.totalOrders ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Orders, SMS Logs & Tickets — side by side */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Store Orders */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Store Orders ({storeOrders.length})
          </p>
          {storeOrders.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Store</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {storeOrders.map((o, i) => (
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
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate(`/orders/${o.latest_order_number}`, { state: backState })}
                          title="View order detail"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
              No store orders found.
            </p>
          )}
        </div>

        {/* SMS Logs */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            SMS Logs ({smsLogs.length})
          </p>
          {smsLogs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sent At</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {smsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {fmtDateTime(log.sent_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                        {log.order_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            log.status === "SENT"
                              ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                              : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate(`/sms-logs/${log.id}`, { state: backState })}
                          title="View SMS log detail"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
              No SMS logs found for this customer.
            </p>
          )}
        </div>

        {/* Tickets */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tickets ({zohoTickets.length})
          </p>
          {zohoTickets.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ticket #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {zohoTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                        {ticket.ticketNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="line-clamp-1 max-w-[10rem]">{ticket.subject || "—"}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ticket.status ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
                            {ticket.status}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`, { state: backState })}
                          title="View ticket detail"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <EyeIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
              No tickets found for this customer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
