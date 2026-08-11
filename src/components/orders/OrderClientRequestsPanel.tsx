import { useMemo, useState, type ReactNode } from "react";
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

const INITIAL_VISIBLE_ITEMS = 4;

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

function toTimestamp(value?: string | null): number {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortNewestFirst<T>(
  items: T[] | undefined,
  getDate: (item: T) => string | null | undefined,
): T[] {
  if (!items?.length) return [];

  return [...items].sort(
    (a, b) => toTimestamp(getDate(b)) - toTimestamp(getDate(a)),
  );
}

interface ExpandableActivityListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

function ExpandableActivityList<T>({
  items,
  renderItem,
}: ExpandableActivityListProps<T>) {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded
    ? items
    : items.slice(0, INITIAL_VISIBLE_ITEMS);

  const hiddenCount = Math.max(items.length - INITIAL_VISIBLE_ITEMS, 0);
  const canExpand = items.length > INITIAL_VISIBLE_ITEMS;

  return (
    <div>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {visibleItems.map((item, index) => (
          <div key={index} className={index === 0 ? "pb-3 last:pb-0" : "py-3 last:pb-0"}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 inline-flex items-center text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {expanded ? "Show less" : `View ${hiddenCount} more`}
        </button>
      )}
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
  const sortedAtcForms = useMemo(
    () => sortNewestFirst(atcForms, (item) => item.updated_at || item.created_at),
    [atcForms],
  );

  const sortedCancellations = useMemo(
    () =>
      sortNewestFirst(
        cancellations,
        (item) => item.cancellationDate || item.orderDate,
      ),
    [cancellations],
  );

  const sortedCustomerContacts = useMemo(
    () =>
      sortNewestFirst(
        customerContacts,
        (item) => item.contact_datetime || item.order_date,
      ),
    [customerContacts],
  );

  const sortedSmsLogs = useMemo(
    () => sortNewestFirst(smsLogs, (item) => item.sent_at),
    [smsLogs],
  );

  const sortedEmailLogs = useMemo(
    () => sortNewestFirst(emailLogs, (item) => item.sent_at),
    [emailLogs],
  );

  const totalActivity =
    atcForms.length +
    cancellations.length +
    customerContacts.length +
    smsLogs.length +
    emailLogs.length;

  return (
    <div className="h-full rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Client Requests / Activity
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ATC forms, cancellations and customer communications for this order.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {totalActivity}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <ActivitySection title="ATC Forms" count={sortedAtcForms.length}>
          {sortedAtcForms.length === 0 ? (
            <EmptyActivity label="ATC forms" />
          ) : (
            <ExpandableActivityList
              items={sortedAtcForms}
              renderItem={(item) => (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                      {item.form_type || "ATC form"}
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
            <ExpandableActivityList
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

        <ActivitySection
          title="Customer Contacts"
          count={sortedCustomerContacts.length}
        >
          {sortedCustomerContacts.length === 0 ? (
            <EmptyActivity label="customer contacts" />
          ) : (
            <ExpandableActivityList
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
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.notes}
                    </p>
                  )}

                  <ActivityDate
                    value={item.contact_datetime || item.order_date}
                  />

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
            <ExpandableActivityList
              items={sortedSmsLogs}
              renderItem={(item) => (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      SMS
                    </p>
                    {statusBadge(item.status)}
                    {statusBadge(item.order_status)}
                  </div>

                  {item.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.message}
                    </p>
                  )}

                  <ActivityDate value={item.sent_at} />
                </div>
              )}
            />
          )}
        </ActivitySection>

        <div className="xl:col-span-2">
          <ActivitySection title="Email Logs" count={sortedEmailLogs.length}>
            {sortedEmailLogs.length === 0 ? (
              <EmptyActivity label="email logs" />
            ) : (
              <ExpandableActivityList
                items={sortedEmailLogs}
                renderItem={(item) => (
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-white/90"
                        title={item.subject || undefined}
                      >
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
