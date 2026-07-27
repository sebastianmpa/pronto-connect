import type { TicketDetail as TicketDetailType } from "../../lib/tickets/types";

function fmtDate(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString();
}

function statusBadgeClass(statusType: string | null): string {
  switch ((statusType ?? "").toLowerCase()) {
    case "closed":
      return "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300";
    case "open":
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    case "on hold":
    case "onhold":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    default:
      return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400";
  }
}

const FLAGS: Array<{ key: keyof TicketDetailType; label: string }> = [
  { key: "isOverDue", label: "Overdue" },
  { key: "isEscalated", label: "Escalated" },
  { key: "isSpam", label: "Spam" },
];

export default function TicketDetailView({ ticket }: { ticket: TicketDetailType }) {
  const counts = ticket.counts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {ticket.subject || "(No subject)"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ticket #{ticket.ticketNumber ?? ticket.id} &middot; {fmtDate(ticket.createdTime)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {FLAGS.filter((f) => ticket[f.key]).map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center rounded-full bg-error-50 px-3 py-1 text-xs font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-400"
            >
              {f.label}
            </span>
          ))}
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.statusType)}`}>
            {ticket.status || "—"}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Name</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.customer.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Email</dt>
              <dd className="text-gray-800 dark:text-white/90 lowercase break-all">{ticket.customer.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Phone</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.customer.phone || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Routing</p>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Department</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.department?.name || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Assignee</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.assignee?.name || "Unassigned"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Channel</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.channel || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-gray-400">Priority</dt>
              <dd className="text-gray-800 dark:text-white/90">{ticket.priority || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Timeline</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-400">Created</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{fmtDate(ticket.createdTime)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Modified</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{fmtDate(ticket.modifiedTime)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Due Date</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{fmtDate(ticket.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Closed</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{fmtDate(ticket.closedTime)}</dd>
          </div>
        </dl>
      </div>

      {/* Description / Resolution */}
      {(ticket.description || ticket.resolution) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ticket.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300">
                {ticket.description}
              </div>
            </div>
          )}
          {ticket.resolution && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Resolution</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300">
                {ticket.resolution}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Counts */}
      {counts && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Activity</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
            {(
              [
                ["Threads", counts.threads],
                ["Comments", counts.comments],
                ["Attachments", counts.attachments],
                ["Tasks", counts.tasks],
                ["Time Entries", counts.timeEntries],
                ["Followers", counts.followers],
                ["Approvals", counts.approvals],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.03]">
                <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket.webUrl && (
        <a
          href={ticket.webUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Open in Zoho Desk →
        </a>
      )}
    </div>
  );
}
