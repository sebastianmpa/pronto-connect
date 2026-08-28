import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";
import Radio from "../form/input/Radio";
import Select from "../form/Select";
import cancellationsService from "../../lib/cancellations/cancellationsService";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";
import type { CreateCancellationPayload, CreateCancellationResult } from "../../lib/cancellations/types";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetailType;
  onCancelled?: () => void;
}

interface ItemSelection {
  checked: boolean;
  qty: number;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onCancelled,
}: CancelOrderModalProps) {
  const [type, setType] = useState<"Total" | "Partial">("Total");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, ItemSelection>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateCancellationResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setType("Total");
    setReason("");
    setNote("");
    setError(null);
    setResult(null);
    const initial: Record<number, ItemSelection> = {};
    (order.items ?? []).forEach((item) => {
      initial[item.id] = { checked: true, qty: item.quantity };
    });
    setSelected(initial);

    setReasonsLoading(true);
    cancellationsService
      .getReasons()
      .then(setReasons)
      .catch(() => setReasons([]))
      .finally(() => setReasonsLoading(false));
  }, [isOpen, order]);

  const toggleItem = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id]?.checked } }));
  };

  const setQty = (id: number, qty: number, max: number) => {
    const clamped = Math.max(1, Math.min(qty || 1, max));
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], qty: clamped } }));
  };

  const handleConfirm = async () => {
    if (!reason) {
      setError("Please select a reason for the cancellation.");
      return;
    }

    const payload: CreateCancellationPayload = {
      OrderID: order.order_number,
      type,
      reason,
      note: note.trim() || undefined,
    };

    if (type === "Partial") {
      const details = (order.items ?? [])
        .filter((item) => selected[item.id]?.checked)
        .map((item) => ({
          PartNumber: item.sku,
          MFRID: item.raw?.brand ?? "",
          UnitsToRefund: selected[item.id]?.qty ?? item.quantity,
        }));

      if (details.length === 0) {
        setError("Select at least one item to cancel.");
        return;
      }

      payload.details = details;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await cancellationsService.submit(payload);
      setResult(res);
      onCancelled?.();
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
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Cancellation submitted
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Order {result.OrderID} was submitted for cancellation. Reference ID: {result.id}.
            {result.shipworks && ` ShipWorks status: ${result.shipworks.localStatus}.`}
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-lg bg-brand-500 text-sm font-medium text-gray-900 hover:bg-brand-600 transition-colors"
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
                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">SKU {item.sku}</span>
                    {type === "Partial" ? (
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        disabled={!selected[item.id]?.checked}
                        value={selected[item.id]?.qty ?? item.quantity}
                        onChange={(e) => setQty(item.id, Number(e.target.value), item.quantity)}
                        className="h-8 w-16 shrink-0 rounded-lg border border-gray-300 bg-transparent px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-40"
                      />
                    ) : (
                      <span className="w-16 shrink-0 text-right text-xs text-gray-400">Qty {item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <Select
                options={reasons.map((r) => ({ value: r, label: r }))}
                onChange={setReason}
                placeholder={reasonsLoading ? "Loading reasons…" : "Select a reason"}
              />
            </div>

            <div>
              <Label>Note (optional)</Label>
              <TextArea
                rows={2}
                value={note}
                onChange={setNote}
                placeholder="Any additional context about this cancellation"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row w-full items-center justify-between gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-full h-11 rounded-lg ring-1 ring-inset ring-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] transition-colors"
            >
              Never mind
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-error-500 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting…" : "Confirm cancellation"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
