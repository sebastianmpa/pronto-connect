import { useMemo, type ReactNode } from "react";
import { formatDateTime } from "../../utils/date";
import type {
  OrderAtcForm,
  OrderCancellation,
  OrderCustomerContact,
  OrderEmailLog,
  OrderSmsLog,
} from "../../lib/orders/types";

interface OrderClientRequestsPanelProps {
  atcForms?: OrderAtcForm[];
  cancellations?: OrderCancellation[];
  customerContacts?: OrderCustomerContact[];
  smsLogs?: OrderSmsLog[];
  emailLogs?: OrderEmailLog[];
}

interface ActivitySectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

function ActivitySection({ title, count, children }: ActivitySectionProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-transparent">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyActivity({ label }: { label: string }) {
  return (
    <p className="text-sm text-gray-400 dark:text-gray-500">
      No {label.toLowerCase()} found.
    </p>
  );
}

function ActivityDate({ value }: { value?: string | null }) {
  if (!value) return null;

  return (
    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
      {formatDateTime(value)}
    </p>
  );
}

function statusBadge(value?: string | null) {
  if (!value) return null;

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
      {value}
    </span>
  );
}

function sortByDateDesc<T>(
  items: T[] | undefined,
  getDate: (item: T) => string | null | undefined,
): T[] {
  return [...(items ?? [])].sort((a, b) => {
    const aDate = getDate(a);
    const bDate = getDate(b);
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });
}

function ActivityList<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
      {items.map((item, index) => (
        <div key={index} className="py-3 first:pt-0 last:pb-0">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

export default function OrderClientRequestsPanel({
  atcForms = [],
  cancellations = [],
  customerContacts = [],
  smsLogs = [],
  emailLogs = [],
}: OrderClientRequestsPanelProps) {
  const sortedClientRequests = useMemo(
    () => sortByDateDesc(atcForms, (item) => item.updated_at || item.created_at),
    [atcForms],
  );
  const sortedCancellations = useMemo(
    () =>
      sortByDateDesc(
        cancellations,
        (item) => item.cancellationDate || item.orderDate,
      ),
    [cancellations],
  );
  const sortedCustomerContacts = useMemo(
    () =>
      sortByDateDesc(
        customerContacts,
        (item) => item.contact_datetime || item.order_date,
      ),
    [customerContacts],
  );
  const sortedSmsLogs = useMemo(
    () => sortByDateDesc(smsLogs, (item) => item.sent_at),
    [smsLogs],
  );
  const sortedEmailLogs = useMemo(
    () => sortByDateDesc(emailLogs, (item) => item.sent_at),
    [emailLogs],
  );

  const totalActivity =
    sortedClientRequests.length +
    sortedCancellations.length +
    sortedCustomerContacts.length +
    sortedSmsLogs.length +
    sortedEmailLogs.length;

  return (
    <div className="flex max-h-[760px] min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-transparent">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 dark:border-white/[0.06]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Client Requests / Activity
          </p>
          <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
            Client requests, cancellations and customer communications for this order.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {totalActivity}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          <ActivitySection title="Client Requests" count={sortedClientRequests.length}>
            {sortedClientRequests.length === 0 ? (
              <EmptyActivity label="client requests" />
            ) : (
              <ActivityList
                items={sortedClientRequests}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                        {item.form_type || "Client request"}
                        {item.form_sub_type ? ` · ${item.form_sub_type}` : ""}
                      </p>
                      {statusBadge(item.status)}
                    </div>
                    <ActivityDate value={item.updated_at || item.created_at} />
                  </div>
                )}
              />
            )}
          </ActivitySection>

          <ActivitySection title="Cancellations" count={sortedCancellations.length}>
            {sortedCancellations.length === 0 ? (
              <EmptyActivity label="cancellations" />
            ) : (
              <ActivityList
                items={sortedCancellations}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.type || "Cancellation"}
                      </p>
                      {statusBadge(item.reason)}
                    </div>
                    <ActivityDate value={item.cancellationDate || item.orderDate} />
                  </div>
                )}
              />
            )}
          </ActivitySection>

          <ActivitySection title="Customer Contacts" count={sortedCustomerContacts.length}>
            {sortedCustomerContacts.length === 0 ? (
              <EmptyActivity label="customer contacts" />
            ) : (
              <ActivityList
                items={sortedCustomerContacts}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.contact_type || "Contact"}
                      </p>
                      {statusBadge(item.result)}
                    </div>
                    {item.notes && (
                      <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                        {item.notes}
                      </p>
                    )}
                    <ActivityDate value={item.contact_datetime || item.order_date} />
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <span>Calls: {item.calls ?? 0}</span>
                      <span>Emails: {item.emails ?? 0}</span>
                      <span>Texts: {item.text_messages ?? 0}</span>
                    </div>
                  </div>
                )}
              />
            )}
          </ActivitySection>

          <ActivitySection title="SMS Logs" count={sortedSmsLogs.length}>
            {sortedSmsLogs.length === 0 ? (
              <EmptyActivity label="SMS logs" />
            ) : (
              <ActivityList
                items={sortedSmsLogs}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">SMS</p>
                      {statusBadge(item.status)}
                      {statusBadge(item.order_status)}
                    </div>
                    {item.message && (
                      <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                        {item.message}
                      </p>
                    )}
                    <ActivityDate value={item.sent_at} />
                  </div>
                )}
              />
            )}
          </ActivitySection>

          <ActivitySection title="Email Logs" count={sortedEmailLogs.length}>
            {sortedEmailLogs.length === 0 ? (
              <EmptyActivity label="email logs" />
            ) : (
              <ActivityList
                items={sortedEmailLogs}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.subject || "Email"}
                      </p>
                      {statusBadge(item.status)}
                      {statusBadge(item.order_status)}
                    </div>
                    <ActivityDate value={item.sent_at} />
                  </div>
                )}
              />
            )}
          </ActivitySection>
        </div>
      </div>
    </div>
  );
}
