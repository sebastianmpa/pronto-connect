import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { formatDateTime } from "../../utils/date";
import emailLogsService from "../../lib/email-logs/emailLogsService";
import type { EmailLogItem } from "../../lib/email-logs/types";
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

type SectionKey =
  | "client-requests"
  | "cancellations"
  | "customer-contacts"
  | "sms-logs"
  | "email-logs";

interface AccordionSectionProps {
  id: SectionKey;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: (id: SectionKey) => void;
  children: ReactNode;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AccordionSection({
  id,
  title,
  count,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-transparent">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-gray-400 dark:text-gray-500">
            <ChevronIcon open={isOpen} />
          </span>
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
        </div>

        <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
          {count}
        </span>
      </button>

      {isOpen && (
        <div
          id={`${id}-content`}
          className="border-t border-gray-100 px-4 py-3 dark:border-white/[0.06]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function EmptyActivity({ label }: { label: string }) {
  return (
    <p className="py-1 text-sm text-gray-400 dark:text-gray-500">
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
    <span className="inline-flex max-w-full items-center rounded-full bg-gray-100 px-2 py-0.5 text-center text-[11px] font-medium leading-4 text-gray-600 whitespace-normal break-words dark:bg-white/[0.06] dark:text-gray-300">
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

interface ActivityListProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
}

function ActivityList<T>({ items, getKey, renderItem }: ActivityListProps<T>) {
  return (
    <div className="max-h-80 divide-y divide-gray-100 overflow-x-hidden overflow-y-auto pr-2 dark:divide-white/[0.06]">
      {items.map((item, index) => (
        <div key={getKey(item, index)} className="py-3 first:pt-0 last:pb-0">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

function DetailButton({
  onClick,
  title = "View detail",
}: {
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
    >
      <EyeIcon />
    </button>
  );
}

export default function OrderClientRequestsPanel({
  atcForms = [],
  cancellations = [],
  customerContacts = [],
  smsLogs = [],
  emailLogs = [],
}: OrderClientRequestsPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    "client-requests": false,
    cancellations: false,
    "customer-contacts": false,
    "sms-logs": false,
    "email-logs": false,
  });

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

  const backState = { from: `${location.pathname}${location.search}` };

  const toggleSection = (id: SectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const openClientRequest = (item: OrderAtcForm) => {
    const orderNumber = String(item.order_number ?? "").trim();
    const requestId = Number(item.id);

    if (!orderNumber || !Number.isFinite(requestId) || requestId <= 0) {
      navigate("/client-requests", { state: backState });
      return;
    }

    navigate(
      `/client-requests?order_id=${encodeURIComponent(orderNumber)}&request_id=${encodeURIComponent(String(requestId))}`,
      { state: backState },
    );
  };

  const openCancellation = (salesOrderId: string | number) => {
    navigate(`/cancellations/${encodeURIComponent(String(salesOrderId))}`, {
      state: backState,
    });
  };

  const openCustomerContact = (contactRequestId?: number | null) => {
    const id = Number(contactRequestId ?? 0);
    if (!Number.isFinite(id) || id <= 0) return;

    navigate(`/customer-contacts/${id}`, {
      state: backState,
    });
  };

  const openSmsLog = (id: number) => {
    navigate(`/sms-logs/${id}`, {
      state: backState,
    });
  };

  const loadFullEmailLog = async (item: OrderEmailLog): Promise<EmailLogItem | null> => {
    const orderNumber = String(item.order_number ?? "").trim();
    if (!orderNumber) return null;

    let page = 1;
    let totalPages = 1;

    do {
      const response = await emailLogsService.getPaginated({
        page,
        limit: 100,
        order_number: orderNumber,
      });

      const rows = Array.isArray(response.items) ? response.items : [];
      const fullLog = rows.find((log) => Number(log.id) === Number(item.id));

      if (fullLog) return fullLog;

      totalPages = Math.max(Number(response.totalPages) || 1, 1);
      page += 1;
    } while (page <= totalPages);

    return null;
  };

  const openEmailLog = async (item: OrderEmailLog) => {
    try {
      const log = await loadFullEmailLog(item);

      if (!log) {
        window.alert(
          "The complete email log could not be loaded. Please open Email Logs and try again.",
        );
        return;
      }

      try {
        sessionStorage.setItem(`email-log:${log.id}`, JSON.stringify(log));
      } catch {
        // Route state below is enough for the normal navigation flow.
      }

      navigate(`/email-logs/${log.id}`, {
        state: {
          log,
          from: backState.from,
        },
      });
    } catch (error) {
      console.error("Unable to load email log detail from order activity.", error);
      window.alert(
        "The complete email log could not be loaded. Please try again.",
      );
    }
  };

  return (
    <div className="h-full rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Client Requests / Activity
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Client requests, cancellations and customer communications for this order.
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {totalActivity}
        </span>
      </div>

      <div className="space-y-3">
        <AccordionSection
          id="client-requests"
          title="Client Requests"
          count={sortedAtcForms.length}
          isOpen={openSections["client-requests"]}
          onToggle={toggleSection}
        >
          {sortedAtcForms.length === 0 ? (
            <EmptyActivity label="client requests" />
          ) : (
            <ActivityList
              items={sortedAtcForms}
              getKey={(item) => item.id}
              renderItem={(item) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium capitalize text-gray-800 dark:text-white/90">
                        {item.form_type || "Client request"}
                        {item.form_sub_type ? ` · ${item.form_sub_type}` : ""}
                      </p>
                      {statusBadge(item.status)}
                    </div>
                    <ActivityDate value={item.updated_at || item.created_at} />
                  </div>

                  <DetailButton
                    onClick={() => openClientRequest(item)}
                    title="View client request detail"
                  />
                </div>
              )}
            />
          )}
        </AccordionSection>

        <AccordionSection
          id="cancellations"
          title="Cancellations"
          count={sortedCancellations.length}
          isOpen={openSections.cancellations}
          onToggle={toggleSection}
        >
          {sortedCancellations.length === 0 ? (
            <EmptyActivity label="cancellations" />
          ) : (
            <ActivityList
              items={sortedCancellations}
              getKey={(item) => String(item.salesOrderId)}
              renderItem={(item) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.type || "Cancellation"}
                      </p>
                      {statusBadge(item.reason)}
                    </div>
                    <ActivityDate value={item.cancellationDate || item.orderDate} />
                  </div>

                  <DetailButton
                    onClick={() => openCancellation(item.salesOrderId)}
                    title="View cancellation detail"
                  />
                </div>
              )}
            />
          )}
        </AccordionSection>

        <AccordionSection
          id="customer-contacts"
          title="Customer Contacts"
          count={sortedCustomerContacts.length}
          isOpen={openSections["customer-contacts"]}
          onToggle={toggleSection}
        >
          {sortedCustomerContacts.length === 0 ? (
            <EmptyActivity label="customer contacts" />
          ) : (
            <ActivityList
              items={sortedCustomerContacts}
              getKey={(item) => item.id}
              renderItem={(item) => {
                const canOpenDetail = Number(item.contact_request_id ?? 0) > 0;

                return (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {item.contact_type || "Contact"}
                        </p>
                        {statusBadge(item.result)}
                      </div>

                      {item.reason && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {item.reason}
                        </p>
                      )}

                      {item.notes && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-gray-500 [overflow-wrap:anywhere] dark:text-gray-400">
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

                    {canOpenDetail ? (
                      <DetailButton
                        onClick={() => openCustomerContact(item.contact_request_id)}
                        title="View customer contact detail"
                      />
                    ) : (
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-300 dark:text-gray-700"
                        title="No contact request detail is available"
                      >
                        -
                      </span>
                    )}
                  </div>
                );
              }}
            />
          )}
        </AccordionSection>

        <AccordionSection
          id="sms-logs"
          title="SMS Logs"
          count={sortedSmsLogs.length}
          isOpen={openSections["sms-logs"]}
          onToggle={toggleSection}
        >
          {sortedSmsLogs.length === 0 ? (
            <EmptyActivity label="SMS logs" />
          ) : (
            <ActivityList
              items={sortedSmsLogs}
              getKey={(item) => item.id}
              renderItem={(item) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        SMS
                      </p>
                      {statusBadge(item.status)}
                      {statusBadge(item.order_status)}
                    </div>

                    {item.message && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-gray-500 [overflow-wrap:anywhere] dark:text-gray-400">
                        {item.message}
                      </p>
                    )}

                    {item.phone && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {item.phone}
                      </p>
                    )}

                    <ActivityDate value={item.sent_at} />
                  </div>

                  <DetailButton
                    onClick={() => openSmsLog(item.id)}
                    title="View SMS detail"
                  />
                </div>
              )}
            />
          )}
        </AccordionSection>

        <AccordionSection
          id="email-logs"
          title="Email Logs"
          count={sortedEmailLogs.length}
          isOpen={openSections["email-logs"]}
          onToggle={toggleSection}
        >
          {sortedEmailLogs.length === 0 ? (
            <EmptyActivity label="email logs" />
          ) : (
            <ActivityList
              items={sortedEmailLogs}
              getKey={(item) => item.id}
              renderItem={(item) => (
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className="w-full whitespace-normal break-words text-sm font-medium leading-5 text-gray-800 [overflow-wrap:anywhere] dark:text-white/90"
                      title={item.subject || undefined}
                    >
                      {item.subject || "Email"}
                    </p>

                    {(item.status || item.order_status) && (
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                        {statusBadge(item.status)}
                        {statusBadge(item.order_status)}
                      </div>
                    )}

                    {item.recipient && (
                      <p className="mt-1.5 whitespace-normal break-words text-xs leading-5 text-gray-500 [overflow-wrap:anywhere] dark:text-gray-400">
                        To: {item.recipient}
                      </p>
                    )}

                    <ActivityDate value={item.sent_at} />
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <DetailButton
                      onClick={() => void openEmailLog(item)}
                      title="View email detail"
                    />
                  </div>
                </div>
              )}
            />
          )}
        </AccordionSection>
      </div>
    </div>
  );
}
