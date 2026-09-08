import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import CancelOrderModal from "../orders/CancelOrderModal";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import ordersService from "../../lib/orders/ordersService";
import { ATC_FORM_STATUSES } from "../../lib/atc-forms/types";
import { statusBadgeClass } from "../../lib/atc-forms/statusBadge";
import type { AtcFormItem } from "../../lib/atc-forms/types";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";
import { formatDateTime } from "../../utils/date";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeFormType(value: unknown): string {
  return normalizeValue(value).toLowerCase();
}

/**
 * Converts the request HTML to text while preserving the most useful visual
 * breaks. Cancellation requests currently arrive inside ticket_text rather
 * than as dedicated reason/comment properties.
 */
function requestTextWithBreaks(html: string): string {
  if (!html) return "";

  const documentNode = new DOMParser().parseFromString(html, "text/html");

  documentNode.querySelectorAll("br").forEach((node) => {
    node.replaceWith("\n");
  });

  documentNode
    .querySelectorAll("p, div, li, tr, section, article")
    .forEach((node) => {
      node.append("\n");
    });

  return (documentNode.body.textContent ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRequestField(
  source: string,
  labels: string[],
  stopLabels: string[],
): string {
  if (!source) return "";

  const labelPattern = labels.map(escapeRegExp).join("|");
  const stopPattern = stopLabels.map(escapeRegExp).join("|");

  const expression = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${stopPattern})\\s*:|$)`,
    "i",
  );

  const match = source.match(expression);
  return normalizeValue(match?.[1]);
}

function extractCancellationDefaults(ticketText: string) {
  const text = requestTextWithBreaks(ticketText);

  const knownLabels = [
    "Order #",
    "Order",
    "Email",
    "Customer Email",
    "Customer Name",
    "Cancellation Reason",
    "Cancel Reason",
    "Reason",
    "Comment",
    "Comments",
    "Customer Comment",
    "Note",
  ];

  const reason = extractRequestField(
    text,
    ["Cancellation Reason", "Cancel Reason", "Reason"],
    knownLabels,
  );

  const comment = extractRequestField(
    text,
    ["Comment", "Comments", "Customer Comment", "Note"],
    knownLabels,
  );

  return { reason, comment };
}

interface AtcFormDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AtcFormItem | null;
  onStatusChanged: (id: number, status: string) => void;
}

export default function AtcFormDetailModal({
  isOpen,
  onClose,
  request,
  onStatusChanged,
}: AtcFormDetailModalProps) {
  const [status, setStatus] = useState<string>("pending");
  const [saving, setSaving] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellationOrder, setCancellationOrder] = useState<OrderDetailType | null>(null);
  const [cancellationWasSubmitted, setCancellationWasSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !request) return;

    setStatus(request.status ?? "pending");
    setError(null);
    setCancellationOrder(null);
    setCancellationWasSubmitted(false);
  }, [isOpen, request?.id]);

  const cancellationDefaults = useMemo(
    () => extractCancellationDefaults(request?.ticket_text ?? ""),
    [request?.ticket_text],
  );

  if (!request) return null;

  const isCancellationRequest =
    normalizeFormType(request.form_type) === "cancellation";

  const updateStatusDirectly = async () => {
    const updated = await atcFormsService.updateStatus(request.id, status);
    const updatedStatus = normalizeValue(updated?.status) || status;
    onStatusChanged(request.id, updatedStatus);
  };

  const openCancellationFlow = async () => {
    setLoadingOrder(true);
    setError(null);

    try {
      const order = await ordersService.getOrderDetail(request.order_number);
      setCancellationOrder(order);
      setCancellationWasSubmitted(false);
    } catch {
      setError(
        `Could not load order #${request.order_number} to create the cancellation. Please try again.`,
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSaveStatus = async () => {
    setError(null);

    /*
     * A Cancellation Client Request is considered processed only after the
     * corresponding cancellation has been created. Therefore, changing it to
     * processed opens the normal order-cancellation modal first.
     */
    if (isCancellationRequest && status === "processed") {
      await openCancellationFlow();
      return;
    }

    setSaving(true);

    try {
      await updateStatusDirectly();
    } catch {
      setError("Could not update the status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancellationSubmitted = async () => {
    setCancellationWasSubmitted(true);

    try {
      const updated = await atcFormsService.updateStatus(request.id, "processed");
      const updatedStatus = normalizeValue(updated?.status) || "processed";
      onStatusChanged(request.id, updatedStatus);
    } catch {
      throw new Error(
        "The cancellation was created, but the Client Request could not be marked as processed. Please refresh and verify its status.",
      );
    }
  };

  const handleCancellationClose = () => {
    setCancellationOrder(null);

    if (cancellationWasSubmitted) {
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !cancellationOrder}
        onClose={onClose}
        className="relative w-full max-w-[650px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
      >
        <div>
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2 pr-8">
            <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
              {request.customer_name} — Order #{request.order_number}
            </h4>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(request.status)}`}
            >
              {request.status ?? "pending"}
            </span>
          </div>

          <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {request.form_type}
            {request.form_sub_type && ` · ${request.form_sub_type}`} · Zoho ticket #{request.zoho_ticket_id}
          </p>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Customer email
                </dt>
                <dd className="mt-0.5 break-all text-sm lowercase text-gray-800 dark:text-white/90">
                  {request.customer_email}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Created
                </dt>
                <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                  {formatDateTime(request.created_at)}
                </dd>
              </div>

              {request.updated_at && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Last updated
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                    {formatDateTime(request.updated_at)}
                    {request.updated_by && ` · ${request.updated_by}`}
                  </dd>
                </div>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Request details
              </p>
              <div
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(request.ticket_text),
                }}
              />
            </div>

            {isCancellationRequest &&
              (cancellationDefaults.reason || cancellationDefaults.comment) && (
                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    Cancellation data detected
                  </p>
                  {cancellationDefaults.reason && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Reason:</span>{" "}
                      {cancellationDefaults.reason}
                    </p>
                  )}
                  {cancellationDefaults.comment && (
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Comment:</span>{" "}
                      {cancellationDefaults.comment}
                    </p>
                  )}
                </div>
              )}

            <div>
              <Label>Status</Label>
              <div className="flex items-center gap-3">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={saving || loadingOrder}
                  className="h-11 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 text-sm capitalize text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {ATC_FORM_STATUSES.map((value) => (
                    <option
                      key={value}
                      value={value}
                      className="capitalize dark:bg-gray-900"
                    >
                      {value}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void handleSaveStatus()}
                  disabled={
                    saving ||
                    loadingOrder ||
                    status === (request.status ?? "pending")
                  }
                  className="h-11 shrink-0 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingOrder
                    ? "Loading order…"
                    : saving
                      ? "Saving…"
                      : "Update status"}
                </button>
              </div>

              {isCancellationRequest && status === "processed" && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Updating this Cancellation request to Processed will first open the cancellation form for order #{request.order_number}.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {cancellationOrder && (
        <CancelOrderModal
          isOpen={true}
          onClose={handleCancellationClose}
          order={cancellationOrder}
          initialReason={cancellationDefaults.reason}
          initialNote={cancellationDefaults.comment}
          onSubmitted={handleCancellationSubmitted}
        />
      )}
    </>
  );
}
