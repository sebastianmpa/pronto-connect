import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import type {
  CustomerContactItem,
  SaveCustomerContactRequestPayload,
} from "../../lib/customer-contacts/types";
import { formatDate } from "../../utils/date";

interface CustomerContactRequestModalProps {
  isOpen: boolean;
  contact: CustomerContactItem;
  saving: boolean;
  error: string | null;
  success: string | null;
  onClose: () => void;
  onSubmit: (payload: SaveCustomerContactRequestPayload) => Promise<void>;
}

interface SummaryFieldProps {
  label: string;
  value: ReactNode;
}

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

function getValidContactRequestId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.length >= 10 ? value.slice(0, 10) : "";
  }

  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000
  );
  return localDate.toISOString().slice(0, 10);
}

export default function CustomerContactRequestModal({
  isOpen,
  contact,
  saving,
  error,
  success,
  onClose,
  onSubmit,
}: CustomerContactRequestModalProps) {
  const contactRequestId = useMemo(
    () => getValidContactRequestId(contact.contact_request_id),
    [contact.contact_request_id]
  );

  const [orderId, setOrderId] = useState("");
  const [po, setPo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Updated backend contract:
    // CREATE and EDIT both use the real `order_id`.
    // EDIT additionally sends `contact_request_id`.
    setOrderId(contact.order_id ? String(contact.order_id) : "");

    // New listing exposes the visible order number separately. The backend
    // example uses that value as PO when creating a request.
    setPo(
      contact.po?.trim() ||
        (contact.order_number !== null && contact.order_number !== undefined
          ? String(contact.order_number)
          : "")
    );

    setCustomerId(contact.customer_id ? String(contact.customer_id) : "");
    setOrderDate(toDateInputValue(contact.order_date));
    setNotes(contact.notes?.trim() ?? "");
    setReason(contact.reason?.trim() || contact.onhold_reason?.trim() || "");
    setSubmitted(false);
    setValidationError(null);
  }, [isOpen, contact]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const normalizedOrderId = orderId.trim();
    const normalizedPo = po.trim();
    const normalizedCustomerId = customerId.trim();
    const normalizedOrderDate = orderDate.trim();
    const normalizedNotes = notes.trim();
    const normalizedReason = reason.trim();

    const parsedOrderId = Number(normalizedOrderId);
    const parsedCustomerId = Number(normalizedCustomerId);

    const validOrderId = Number.isFinite(parsedOrderId) && parsedOrderId > 0;
    const validCustomerId =
      Number.isFinite(parsedCustomerId) && parsedCustomerId > 0;
    const validOrderDate =
      normalizedOrderDate !== "" &&
      !Number.isNaN(new Date(`${normalizedOrderDate}T00:00:00`).getTime());

    if (
      !validOrderId ||
      !normalizedPo ||
      !validCustomerId ||
      !validOrderDate ||
      !normalizedNotes ||
      !normalizedReason
    ) {
      setValidationError(
        "Order ID, PO, Customer ID, Order date, Notes, and Reason are required. Order ID and Customer ID must be valid numbers greater than zero."
      );
      return;
    }

    setValidationError(null);

    const payload: SaveCustomerContactRequestPayload = {
      order_id: parsedOrderId,
      po: normalizedPo,
      customer_id: parsedCustomerId,
      order_date: normalizedOrderDate,
      notes: normalizedNotes,
      reason: normalizedReason,
    };

    if (contactRequestId !== null) {
      payload.contact_request_id = contactRequestId;
    }

    await onSubmit(payload);
  };

  const editing = contactRequestId !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => undefined : onClose}
      className="relative w-full max-w-[820px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10"
    >
      <div className="pr-10">
        <h4 className="mb-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit contact request" : "Create contact request"}
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          {editing
            ? `Edit contact request #${contactRequestId}.`
            : "Create a request so an agent can contact this customer."}
        </p>
      </div>

      <div className="mt-6">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Current information
        </h5>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {editing && (
            <SummaryField label="Contact request ID" value={contactRequestId} />
          )}
          <SummaryField label="Order #" value={contact.order_number ?? contact.po} />
          <SummaryField label="Customer" value={contact.customer_name} />
          <SummaryField label="Order date" value={formatDate(contact.order_date)} />
        </div>
      </div>

      {success && (
        <div className="mt-5 rounded-xl bg-success-50 px-4 py-4 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">
          <p className="font-semibold">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Information sent to the service
        </h5>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Order ID *</Label>
            <Input
              type="text"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="2195176"
              disabled={saving}
              error={
                submitted &&
                (!orderId.trim() ||
                  !Number.isFinite(Number(orderId.trim())) ||
                  Number(orderId.trim()) <= 0)
              }
            />
          </div>

          <div>
            <Label>PO *</Label>
            <Input
              type="text"
              value={po}
              onChange={(event) => setPo(event.target.value)}
              placeholder="450218752"
              disabled={saving}
              error={submitted && !po.trim()}
            />
          </div>

          <div>
            <Label>Customer ID *</Label>
            <Input
              type="text"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              placeholder="752995"
              disabled={saving}
              error={
                submitted &&
                (!customerId.trim() ||
                  !Number.isFinite(Number(customerId.trim())) ||
                  Number(customerId.trim()) <= 0)
              }
            />
          </div>

          <div>
            <Label>Order date *</Label>
            <Input
              type="date"
              value={orderDate}
              onChange={(event) => setOrderDate(event.target.value)}
              disabled={saving}
              error={submitted && !orderDate.trim()}
            />
          </div>

          <div>
            <Label>Reason *</Label>
            <Input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="ETA"
              disabled={saving}
              error={submitted && !reason.trim()}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Notes *</Label>
            <TextArea
              rows={5}
              value={notes}
              onChange={setNotes}
              placeholder="Solicitud creada"
              disabled={saving}
              error={submitted && !notes.trim()}
            />
          </div>

          {(validationError || error) && (
            <div className="sm:col-span-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
            disabled={saving}
            className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving…"
              : editing
                ? "Update contact request"
                : "Create contact request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
