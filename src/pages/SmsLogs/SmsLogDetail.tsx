import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import smsLogsService from "../../lib/sms-logs/smsLogsService";
import type { SmsLogItem } from "../../lib/sms-logs/types";
import OrderDetailLink from "../../components/orders/OrderDetailLink";

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
}

export default function SmsLogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? "/sms-logs";

  const [log, setLog] = useState<SmsLogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    smsLogsService
      .getById(Number(id))
      .then(setLog)
      .catch(() => setError("Could not load log details. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <PageMeta
        title={`SMS Log #${id} | Pronto Connect`}
        description="SMS log detail"
      />
      <PageBreadcrumb pageTitle="SMS Log Detail" />

      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-sm">
        {/* Back button */}
        <button
          onClick={() => navigate(backTo)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && log && (
          <div className="space-y-5 max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  SMS Log #{log.id}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(log.sent_at)}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  log.status === "SENT"
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
                }`}
              >
                {log.status}
              </span>
            </div>

            {/* Details grid */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order #</dt>
                <dd className="mt-0.5 inline-flex items-center gap-1 text-gray-800 dark:text-white/90">
                  <span>{log.order_number}</span>
                  <OrderDetailLink orderNumber={log.order_number} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Status</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.order_status || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</dt>
                <dd className="mt-0.5 lowercase text-gray-800 dark:text-white/90">{log.customer_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.phone_number}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Template</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.template_id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Store ID</dt>
                <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.store_id}</dd>
              </div>
              {log.provider_message_id && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Provider ID</dt>
                  <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.provider_message_id}</dd>
                </div>
              )}
            </dl>

            {/* Message */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Message sent</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300">
                {log.message_sent}
              </div>
            </div>

            {/* Error message */}
            {log.error_message && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-error-500">Error</p>
                <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                  {log.error_message}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
