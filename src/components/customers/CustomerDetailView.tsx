import { useLocation, useNavigate } from "react-router";
import type { EmailLogItem } from "../../lib/email-logs/types";
import type {
  CustomerAtcForm,
  CustomerDetail as CustomerDetailType,
} from "../../lib/customers/types";

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function fmtDate(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString();
}

function fmtDateTime(raw?: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function storeLabel(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function plainTextFromHtml(raw?: string | null): string {
  if (!raw) return "—";

  return raw
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function statusBadgeClass(status?: string | null): string {
  const normalized = (status ?? "").trim().toUpperCase();

  if (["SENT", "CLOSED", "COMPLETED", "APPROVED"].includes(normalized)) {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
  }

  if (["PENDING", "OPEN", "UNDER REVIEW", "CANCELLATION UNDER REVIEW"].includes(normalized)) {
    return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
  }

  if (["FAILED", "ERROR", "CANCELLED", "DENIED", "REJECTED"].includes(normalized)) {
    return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
  }

  return "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300";
}

function TypeBadge({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
      {value || "—"}
    </span>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
        value
      )}`}
    >
      {value || "—"}
    </span>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
      {children}
    </p>
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {label} ({count})
    </p>
  );
}

export default function CustomerDetailView({
  detail,
}: {
  detail: CustomerDetailType;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const backState = { from: `${location.pathname}${location.search}` };

  const storeOrders = detail.store_orders ?? [];
  const atcForms = detail.atc_forms ?? [];
  const cancellations = detail.cancellations ?? [];
  const smsLogs = detail.sms_logs ?? [];
  const emailLogs = detail.email_logs ?? [];
  const zohoTickets = detail.zoho_tickets ?? [];
  const customerContacts = detail.customer_contacts ?? [];

  const openEmailLog = (log: EmailLogItem) => {
    try {
      sessionStorage.setItem(`email-log:${log.id}`, JSON.stringify(log));
    } catch {
      // Route state below is enough for normal navigation.
    }

    navigate(`/email-logs/${log.id}`, {
      state: {
        log,
        from: `${location.pathname}${location.search}`,
      },
    });
  };

  const atcFormLabel = (form: CustomerAtcForm) => {
    if (form.form_sub_type) {
      return `${form.form_type} / ${form.form_sub_type}`;
    }

    return form.form_type || "—";
  };

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

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              detail.source === "ideal"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                : "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
            }`}
          >
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Contact Info
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Email</dt>
              <dd className="break-all lowercase text-gray-800 dark:text-white/90">
                {detail.profile.email}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-white/90">
                {detail.profile.phone || "—"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-gray-400">Address</dt>
              <dd className="text-gray-800 dark:text-white/90">
                {detail.profile.address || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Purchase History
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                {detail.history.totalOrders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
              <p className="text-xl font-bold text-gray-800 dark:text-white/90">
                {fmtCurrency(detail.history.totalAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Orders */}
      <div>
        <SectionTitle label="Store Orders" count={storeOrders.length} />
        {storeOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Store</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {storeOrders.map((order, index) => (
                  <tr key={`${order.store}-${order.latest_order_number}-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                      {storeLabel(order.store)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {order.latest_order_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                      {fmtDate(order.latest_order_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-800 dark:text-white/90">
                      {fmtCurrency(order.latest_order_total)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/orders/${order.latest_order_number}`, {
                            state: backState,
                          })
                        }
                        title="View order detail"
                        aria-label={`View order ${order.latest_order_number}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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
          <EmptyState>No store orders found.</EmptyState>
        )}
      </div>

      {/* Customer activity — 3 columns, 2 rows in the requested order */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* 1. SMS */}
        <div className="min-w-0">
          <SectionTitle label="SMS Logs" count={smsLogs.length} />
          {smsLogs.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[430px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sent At</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {smsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{fmtDateTime(log.sent_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{log.order_number}</td>
                      <td className="px-3 py-3"><StatusBadge value={log.status} /></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/sms-logs/${log.id}`, { state: backState })}
                          title="View SMS log detail"
                          aria-label={`View SMS log ${log.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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
            <EmptyState>No SMS logs found for this customer.</EmptyState>
          )}
        </div>

        {/* 2. Client Requests (backend field: atc_forms) */}
        <div className="min-w-0">
          <SectionTitle label="Client Requests" count={atcForms.length} />
          {atcForms.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[500px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Created</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Request</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {atcForms.map((form) => (
                    <tr key={form.id} className="align-top hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{fmtDateTime(form.created_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{form.order_number || "—"}</td>
                      <td className="px-3 py-3"><TypeBadge value={atcFormLabel(form)} /></td>
                      <td className="px-3 py-3"><StatusBadge value={form.status} /></td>
                      <td className="max-w-[220px] px-3 py-3 text-gray-600 dark:text-gray-400">
                        <span className="block break-words" title={plainTextFromHtml(form.ticket_text)}>{plainTextFromHtml(form.ticket_text)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No client requests found for this customer.</EmptyState>
          )}
        </div>

        {/* 3. Cancellations */}
        <div className="min-w-0">
          <SectionTitle label="Cancellations" count={cancellations.length} />
          {cancellations.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[470px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Reason</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {cancellations.map((cancellation) => (
                    <tr key={cancellation.salesOrderId} className="align-top hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{cancellation.orderNumber}</td>
                      <td className="px-3 py-3"><TypeBadge value={cancellation.type} /></td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{fmtDateTime(cancellation.cancellationDate)}</td>
                      <td className="max-w-[180px] px-3 py-3 text-gray-600 dark:text-gray-400"><span className="block break-words">{cancellation.reason || "—"}</span></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/cancellations/${cancellation.salesOrderId}`, { state: backState })}
                          title="View cancellation detail"
                          aria-label={`View cancellation for order ${cancellation.orderNumber}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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
            <EmptyState>No cancellations found for this customer.</EmptyState>
          )}
        </div>

        {/* 4. Email */}
        <div className="min-w-0">
          <SectionTitle label="Email Logs" count={emailLogs.length} />
          {emailLogs.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Sent At</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{fmtDateTime(log.sent_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{log.order_number}</td>
                      <td className="max-w-[220px] px-3 py-3 text-gray-600 dark:text-gray-400"><span className="block break-words">{log.subject || "—"}</span></td>
                      <td className="px-3 py-3"><StatusBadge value={log.status} /></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openEmailLog(log)}
                          title="View email log detail"
                          aria-label={`View email log ${log.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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
            <EmptyState>No email logs found for this customer.</EmptyState>
          )}
        </div>

        {/* 5. Tickets */}
        <div className="min-w-0">
          <SectionTitle label="Tickets" count={zohoTickets.length} />
          {zohoTickets.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[430px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ticket #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Subject</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {zohoTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{ticket.ticketNumber ?? "—"}</td>
                      <td className="max-w-[190px] px-3 py-3 text-gray-600 dark:text-gray-400"><span className="block break-words">{ticket.subject || "—"}</span></td>
                      <td className="px-3 py-3"><StatusBadge value={ticket.status} /></td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket.id}`, { state: backState })}
                          title="View ticket detail"
                          aria-label={`View ticket ${ticket.ticketNumber ?? ticket.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
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
            <EmptyState>No tickets found for this customer.</EmptyState>
          )}
        </div>

        {/* 6. Customer Contacts */}
        <div className="min-w-0">
          <SectionTitle label="Customer Contacts" count={customerContacts.length} />
          {customerContacts.length > 0 ? (
            <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Contacted</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Result</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400">User</th>
                    <th className="px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {customerContacts.map((contact) => (
                    <tr key={contact.id} className="align-top hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-gray-400">{fmtDateTime(contact.contact_datetime)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-800 dark:text-white/90">{contact.po || contact.order_id}</td>
                      <td className="px-3 py-3"><TypeBadge value={contact.contact_type} /></td>
                      <td className="max-w-[180px] px-3 py-3 text-gray-600 dark:text-gray-400"><span className="block break-words">{contact.result || "—"}</span></td>
                      <td className="max-w-[170px] px-3 py-3 text-gray-600 dark:text-gray-400"><span className="block break-words">{contact.contact_user || "—"}</span></td>
                      <td className="px-3 py-3 text-center">
                        {Number(contact.contact_request_id) > 0 ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/customer-contacts/${contact.contact_request_id}`, { state: backState })}
                            title="View customer contact detail"
                            aria-label={`View customer contact ${contact.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                          >
                            <EyeIcon />
                          </button>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>No customer contacts found for this customer.</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
