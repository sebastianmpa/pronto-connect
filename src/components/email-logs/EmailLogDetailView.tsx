import DOMPurify from "dompurify";
import { formatDateTime } from "../../utils/date";
import type { EmailLogItem } from "../../lib/email-logs/types";

interface EmailLogDetailViewProps {
  log: EmailLogItem;
}

function statusClasses(status: string): string {
  const normalized = status.toUpperCase();

  if (normalized === "SENT") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
  }

  if (normalized === "PENDING") {
    return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
  }

  return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
}

export default function EmailLogDetailView({ log }: EmailLogDetailViewProps) {
  const sanitizedEmail = DOMPurify.sanitize(log.message_sent || "", {
    WHOLE_DOCUMENT: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Email Log #{log.id}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(log.sent_at)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(log.status)}`}
        >
          {log.status || "—"}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Order #
          </dt>
          <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
            {log.order_number || "—"}
          </dd>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Order Status
          </dt>
          <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
            {log.order_status || "—"}
          </dd>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Store ID
          </dt>
          <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
            {log.store_id}
          </dd>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Customer
          </dt>
          <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
            {log.customer_name || "—"}
          </dd>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Customer Email
          </dt>
          <dd className="mt-1 break-all text-sm font-medium text-gray-800 dark:text-white/90">
            {log.customer_email || "—"}
          </dd>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Template ID
          </dt>
          <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
            {log.template_id || "—"}
          </dd>
        </div>
      </dl>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Subject
        </p>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium text-gray-800 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/90">
          {log.subject || "—"}
        </div>
      </div>

      {log.provider_message_id && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Provider Message ID
          </p>
          <div className="break-all rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300">
            {log.provider_message_id}
          </div>
        </div>
      )}

      {log.error_message && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-error-500">
            Error
          </p>
          <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            {log.error_message}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Email Preview
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800">
          {sanitizedEmail ? (
            <iframe
              title={`Email log ${log.id} preview`}
              srcDoc={sanitizedEmail}
              sandbox=""
              className="h-[560px] w-full bg-white"
            />
          ) : (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
              No email content available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
