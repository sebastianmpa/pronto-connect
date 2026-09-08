import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";
import Radio from "../form/input/Radio";
import cancellationsService from "../../lib/cancellations/cancellationsService";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";
import type { CreateCancellationResult } from "../../lib/cancellations/types";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetailType;
  onCancelled?: () => void;

  /** Optional values used when the modal is opened from a Client Request. */
  initialReason?: string;
  initialNote?: string;

  /**
   * Called after the cancellation itself was created successfully. It is used
   * by the Client Requests flow to mark the originating ATC form as processed.
   */
  onSubmitted?: (result: CreateCancellationResult) => void | Promise<void>;
}

interface ItemSelection {
  checked: boolean;
  qty: number;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onCancelled,
  initialReason = "",
  initialNote = "",
  onSubmitted,
}: CancelOrderModalProps) {
  const [type, setType] = useState<"Total" | "Partial">("Total");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Record<number, ItemSelection>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowWarning, setWorkflowWarning] = useState<string | null>(null);
  const [result, setResult] = useState<CreateCancellationResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setType("Total");
    setReason(initialReason.trim());
    setNote(initialNote.trim());
    setError(null);
    setWorkflowWarning(null);
    setResult(null);

    const initial: Record<number, ItemSelection> = {};
    (order.items ?? []).forEach((item) => {
      initial[item.id] = { checked: true, qty: item.quantity };
    });
    setSelected(initial);
  }, [isOpen, order, initialReason, initialNote]);

  const toggleItem = (id: number) => {
    setSelected((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        checked: !previous[id]?.checked,
      },
    }));
  };

  const setQty = (id: number, qty: number, max: number) => {
    const clamped = Math.max(1, Math.min(qty || 1, max));
    setSelected((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        qty: clamped,
      },
    }));
  };

  const handleConfirm = async () => {
    const cleanReason = reason.trim();
    const cleanNote = note.trim();

    if (!cleanReason) {
      setError("Please provide a reason for the cancellation.");
      return;
    }

    const details =
      type === "Total"
        ? (order.items ?? []).map((item) => ({
            PartNumber: item.sku,
            MFRID: item.raw?.brand ?? "",
            UnitsToRefund: item.quantity,
          }))
        : (order.items ?? [])
            .filter((item) => selected[item.id]?.checked)
            .map((item) => ({
              PartNumber: item.sku,
              MFRID: item.raw?.brand ?? "",
              UnitsToRefund: selected[item.id]?.qty ?? item.quantity,
            }));

    if (type === "Partial" && details.length === 0) {
      setError("Select at least one item to cancel.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setWorkflowWarning(null);

    try {
      const response = await cancellationsService.submit({
        OrderID: order.order_number,
        type,
        reason: cleanReason,
        ...(cleanNote ? { note: cleanNote } : {}),
        details,
      });

      setResult(response);
      onCancelled?.();

      if (onSubmitted) {
        try {
          await onSubmitted(response);
        } catch (postSubmitError) {
          setWorkflowWarning(
            errorMessage(
              postSubmitError,
              "The cancellation was created, but the related workflow could not be completed.",
            ),
          );
        }
      }
    } catch {
      setError("Could not submit the cancellation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[600px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      {result ? (
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Cancellation submitted
          </h4>

          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Order {result.OrderID} was submitted for cancellation. Reference ID: {result.id}.
            {result.shipworks && ` ShipWorks status: ${result.shipworks.localStatus}.`}
          </p>

          {workflowWarning && (
            <div className="mb-5 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
              {workflowWarning}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
          >
            Close
          </button>
        </div>
      ) : (
        <div>
          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Cancel Order #{order.order_number}
          </h4>

          <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
            This will submit a cancellation request to the order system. This action cannot be undone.
          </p>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-6">
              <Radio
                id="cancel-total"
                name="cancel-type"
                value="Total"
                checked={type === "Total"}
                onChange={() => setType("Total")}
                label="Cancel entire order"
              />
              <Radio
                id="cancel-partial"
                name="cancel-type"
                value="Partial"
                checked={type === "Partial"}
                onChange={() => setType("Partial")}
                label="Cancel specific items"
              />
            </div>

            <div>
              <Label>{type === "Total" ? "Items to cancel" : "Select items to cancel"}</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {type === "Partial" && (
                      <input
                        type="checkbox"
                        checked={selected[item.id]?.checked ?? false}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300"
                      />
                    )}

                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                      SKU {item.sku}
                    </span>

                    {type === "Partial" ? (
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        disabled={!selected[item.id]?.checked}
                        value={selected[item.id]?.qty ?? item.quantity}
                        onChange={(event) =>
                          setQty(item.id, Number(event.target.value), item.quantity)
                        }
                        className="h-8 w-16 shrink-0 rounded-lg border border-gray-300 bg-transparent px-2 text-sm disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                    ) : (
                      <span className="w-16 shrink-0 text-right text-xs text-gray-400">
                        Qty {item.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <TextArea
                rows={2}
                value={reason}
                onChange={setReason}
                placeholder="Why is this order being cancelled?"
              />
              {initialReason.trim() && (
                <p className="mt-1 text-xs text-gray-400">
                  Pre-filled from the Cancellation Client Request. You can edit it before submitting.
                </p>
              )}
            </div>

            <div>
              <Label>Note (optional)</Label>
              <TextArea
                rows={3}
                value={note}
                onChange={setNote}
                placeholder="Any additional context about this cancellation"
              />
              {initialNote.trim() && (
                <p className="mt-1 text-xs text-gray-400">
                  Pre-filled from the Client Request comment. You can edit it before submitting.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="mt-8 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-white text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
            >
              Never mind
            </button>

            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-error-500 text-sm font-medium text-white transition-colors hover:bg-error-600 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Confirm cancellation"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
