import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import type {
  CustomerContactDetail,
  CustomerContactType,
  MarkCustomerContactPayload,
  MarkCustomerContactResponse,
} from "../../lib/customer-contacts/types";
import { formatDate, formatDateTime } from "../../utils/date";

interface CustomerContactMarkModalProps {
  isOpen: boolean;
  contact: CustomerContactDetail;
  saving: boolean;
  error: string | null;
  success?: string | null;
  response?: MarkCustomerContactResponse | null;
  onClose: () => void;
  onSubmit: (payload: MarkCustomerContactPayload) => Promise<void>;
}

interface SummaryFieldProps {
  label: string;
  value: ReactNode;
}

const CONTACT_TYPE_OPTIONS: Array<{
  value: CustomerContactType;
  label: string;
}> = [
  { value: "Call", label: "Call" },
  { value: "Email", label: "Email" },
  { value: "Text Message", label: "Text Message" },
];

function SummaryField({ label, value }: SummaryFieldProps) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
        {value === null || value === undefined || value === "" ? "—" : value}
      </div>
    </div>
  );
}

function getLocalDateTimeValue(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function toApiDateTime(value: string): string {
  if (!value) return "";

  const normalized = value.replace("T", " ");
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export default function CustomerContactMarkModal({
  isOpen,
  contact,
  saving,
  error,
  success = null,
  response = null,
  onClose,
  onSubmit,
}: CustomerContactMarkModalProps) {
  const [contactType, setContactType] = useState<CustomerContactType>("Email");
  const [contactDateTime, setContactDateTime] = useState("");
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setContactType("Email");
    setContactDateTime(getLocalDateTimeValue());
    setResult("");
    setNotes("");
    setSubmitted(false);
    setValidationError(null);
  }, [isOpen, contact.id, contact.order_id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const normalizedResult = result.trim();
    const normalizedNotes = notes.trim();
    const validDate =
      contactDateTime.trim() !== "" &&
      !Number.isNaN(new Date(contactDateTime).getTime());

    if (!contactType || !validDate || !normalizedResult || !normalizedNotes) {
      setValidationError(
        "Contact type, contact date and time, result, and notes are required."
      );
      return;
    }

    setValidationError(null);

    await onSubmit({
      contact_type: contactType,
      contact_datetime: toApiDateTime(contactDateTime),
      result: normalizedResult,
      notes: normalizedNotes,
    });
  };

  const recordedContact = response?.contact;

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => undefined : onClose}
      className="relative w-full max-w-[760px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10"
    >
      <div className="pr-10">
        <h4 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Mark customer as contacted
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          Record the completed contact for order {contact.order_id || "—"}.
        </p>
      </div>

      <div className="mt-6">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Contact request
        </h5>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryField label="Request ID" value={contact.id} />
          <SummaryField label="Order ID" value={contact.order_id} />
          <SummaryField label="PO" value={contact.po} />
          <SummaryField label="Customer ID" value={contact.customer_id} />
          <SummaryField label="Customer" value={contact.customer_name} />
          <SummaryField label="Phone" value={contact.phone} />
          <SummaryField label="Email" value={contact.email} />
          <SummaryField label="Order date" value={formatDate(contact.order_date)} />
          <SummaryField label="Reason" value={contact.reason} />
        </div>
      </div>

      {success && (
        <div className="mt-5 rounded-xl bg-success-50 px-4 py-4 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">
          <p className="font-semibold">{success}</p>
          {response?.status && (
            <p className="mt-1 text-xs opacity-80">
              The API returned status: {response.status}.
            </p>
          )}
        </div>
      )}

      {recordedContact && (
        <div className="mt-5">
          <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Response received
          </h5>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryField label="Contact ID" value={recordedContact.id} />
            <SummaryField
              label="Contact request ID"
              value={recordedContact.contact_request_id}
            />
            <SummaryField label="Contact type" value={recordedContact.contact_type} />
            <SummaryField
              label="Contact date"
              value={formatDateTime(recordedContact.contact_datetime)}
            />
            <SummaryField label="Contacted by" value={recordedContact.contact_user} />
            <SummaryField label="Calls" value={recordedContact.calls} />
            <SummaryField label="Emails" value={recordedContact.emails} />
            <SummaryField
              label="Text messages"
              value={recordedContact.text_messages}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryField label="Result" value={recordedContact.result} />
            <SummaryField label="Notes" value={recordedContact.notes} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Information sent to the service
        </h5>

        <div className="space-y-4">
          <div>
            <Label>Contact type *</Label>
            <div className="relative">
              <select
                value={contactType}
                onChange={(event) =>
                  setContactType(event.target.value as CustomerContactType)
                }
                disabled={saving}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs outline-hidden transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                {CONTACT_TYPE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-400"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4.79175 8.02075L10.0001 13.2291L15.2084 8.02075"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div>
            <Label>Contact date and time *</Label>
            <Input
              type="datetime-local"
              value={contactDateTime}
              onChange={(event) => setContactDateTime(event.target.value)}
              disabled={saving}
              error={
                submitted &&
                (contactDateTime.trim() === "" ||
                  Number.isNaN(new Date(contactDateTime).getTime()))
              }
            />
          </div>

          <div>
            <Label>Result *</Label>
            <Input
              type="text"
              value={result}
              onChange={(event) => setResult(event.target.value)}
              placeholder="Describe the result of the contact"
              disabled={saving}
              error={submitted && !result.trim()}
            />
          </div>

          <div>
            <Label>Notes *</Label>
            <TextArea
              rows={4}
              value={notes}
              onChange={setNotes}
              placeholder="Add notes about the completed contact"
              disabled={saving}
              error={submitted && !notes.trim()}
            />
          </div>

          {(validationError || error) && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {validationError || error}
            </div>
          )}
        </div>

        <div className="mt-8 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 w-full rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
          >
            {success ? "Close" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={saving || !contact.order_id}
            className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Mark as contacted"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
