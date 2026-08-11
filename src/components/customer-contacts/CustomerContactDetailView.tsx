import type { ReactNode } from "react";
import Button from "../ui/button/Button";
import type { CustomerContactDetail } from "../../lib/customer-contacts/types";
import { formatDate, formatDateTime } from "../../utils/date";

interface CustomerContactDetailViewProps {
  contact: CustomerContactDetail;
  markingContact?: boolean;
  onMarkAsContacted: () => void;
}

interface DetailFieldProps {
  label: string;
  value: ReactNode;
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function ContactCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3.5H5.5A2.5 2.5 0 0 0 3 6v12a2.5 2.5 0 0 0 2.5 2.5h13A2.5 2.5 0 0 0 21 18v-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 13.5l2 2 7-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CustomerContactDetailView({
  contact,
  markingContact = false,
  onMarkAsContacted,
}: CustomerContactDetailViewProps) {
  const recordedContact = contact.customer_contact;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Contact Request #{contact.id}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {contact.customer_name || "Customer contact request"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          {contact.reason && (
            <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {contact.reason}
            </span>
          )}

          <Button
            size="sm"
            startIcon={<ContactCheckIcon />}
            onClick={onMarkAsContacted}
            disabled={markingContact || !contact.order_id}
          >
            {markingContact ? "Saving…" : "Mark as contacted"}
          </Button>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Request information
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Request ID" value={contact.id} />
          <DetailField label="Order ID" value={contact.order_id} />
          <DetailField label="Purchase Order" value={contact.po} />
          <DetailField label="Order Date" value={formatDate(contact.order_date)} />
          <DetailField label="Customer ID" value={contact.customer_id} />
          <DetailField label="Reason" value={contact.reason} />
          <DetailField label="Contact User" value={contact.contact_user} />
          <DetailField label="Request Date" value={formatDateTime(contact.date)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Customer information
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Customer" value={contact.customer_name} />
          <DetailField
            label="Phone"
            value={
              contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                >
                  {contact.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailField
            label="Email"
            value={
              contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all lowercase text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
                >
                  {contact.email}
                </a>
              ) : (
                "—"
              )
            }
          />
        </dl>
      </section>

      {recordedContact && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Customer contact
          </h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailField label="Contact ID" value={recordedContact.id} />
            <DetailField
              label="Contact request ID"
              value={recordedContact.contact_request_id}
            />
            <DetailField label="Contact type" value={recordedContact.contact_type} />
            <DetailField
              label="Contact date"
              value={formatDateTime(recordedContact.contact_datetime)}
            />
            <DetailField label="Contacted by" value={recordedContact.contact_user} />
            <DetailField label="Result" value={recordedContact.result} />
            <DetailField label="Calls" value={recordedContact.calls} />
            <DetailField label="Emails" value={recordedContact.emails} />
            <DetailField
              label="Text messages"
              value={recordedContact.text_messages}
            />
            <DetailField label="Order value" value={recordedContact.order_value} />
          </dl>
          <div className="mt-3 min-h-20 whitespace-pre-wrap rounded-xl border border-gray-100 p-4 text-sm leading-6 text-gray-700 dark:border-white/[0.06] dark:text-gray-300">
            {recordedContact.notes || "No contact notes available."}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Request notes
        </h3>
        <div className="min-h-24 whitespace-pre-wrap rounded-xl border border-gray-100 p-4 text-sm leading-6 text-gray-700 dark:border-white/[0.06] dark:text-gray-300">
          {contact.notes || "No notes available."}
        </div>
      </section>
    </div>
  );
}
