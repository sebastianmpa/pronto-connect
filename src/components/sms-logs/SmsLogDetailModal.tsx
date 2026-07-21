import { Modal } from "../ui/modal";
import type { SmsLogItem } from "../../lib/sms-logs/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  log: SmsLogItem | null;
  loading: boolean;
  error: string | null;
}

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
}

export default function SmsLogDetailModal({ isOpen, onClose, log, loading, error }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-gray-900 overflow-x-hidden"
    >
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && log && (
        <div className="space-y-5">
          {/* Header — pr-12 keeps content clear of the absolute close button */}
          <div className="flex items-start justify-between gap-3 pr-12">
            <div>
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                SMS Log #{log.id}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fmtDate(log.sent_at)}
              </p>
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
              <dd className="mt-0.5 text-gray-800 dark:text-white/90">{log.order_number}</dd>
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
    </Modal>
  );
}
