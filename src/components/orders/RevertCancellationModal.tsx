import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import ordersService from "../../lib/orders/ordersService";
import type {
  RevertCancellationPayload,
  RevertCancellationResponse,
} from "../../lib/orders/types";

export type RevertCancellationTarget =
  | {
      type: "Total";
    }
  | {
      type: "Partial";
      brand: string;
      mpn: string;
      itemName?: string;
      itemStatus?: string;
    };

interface RevertCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  target: RevertCancellationTarget | null;
  onReverted?: () => void;
}

function responseMessage(response: RevertCancellationResponse | null): string {
  if (!response) return "";
  const message = String(response.message ?? "").trim();
  return message || "The cancellation was reverted successfully.";
}

export default function RevertCancellationModal({
  isOpen,
  onClose,
  orderNumber,
  target,
  onReverted,
}: RevertCancellationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RevertCancellationResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitting(false);
    setError(null);
    setResult(null);
  }, [isOpen, target]);

  const payload = useMemo<RevertCancellationPayload | null>(() => {
    if (!target) return null;

    if (target.type === "Total") {
      return { type: "Total" };
    }

    const brand = String(target.brand ?? "").trim();
    const mpn = String(target.mpn ?? "").trim();

    if (!brand || !mpn) return null;

    return {
      type: "Partial",
      brand,
      mpn,
    };
  }, [target]);

  const handleConfirm = async () => {
    if (!payload) {
      setError("Brand and MPN are required to revert an item cancellation.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await ordersService.revertCancellation(orderNumber, payload);
      setResult(response);
      onReverted?.();
    } catch (error: unknown) {
      let message = "Could not revert the cancellation. Please try again.";

      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as {
          response?: {
            data?: {
              message?: unknown;
            };
          };
        }).response;

        const apiMessage = response?.data?.message;

        if (typeof apiMessage === "string" && apiMessage.trim()) {
          message = apiMessage.trim();
        }
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isPartial = target?.type === "Partial";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[560px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      {result ? (
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            Cancellation reverted
          </h4>

          <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {responseMessage(result)}
          </p>

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
            {isPartial ? "Revert item cancellation" : "Revert order cancellation"}
          </h4>

          <p className="mb-5 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {isPartial
              ? "This will request the reversal of the cancellation for this item."
              : "This will request the reversal of the total cancellation for this order."}
          </p>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">Order</span>
              <span className="font-medium text-gray-800 dark:text-white/90">#{orderNumber}</span>
            </div>

            {target?.type === "Partial" && (
              <>
                {target.itemName && (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">Item</span>
                    <span className="max-w-[320px] text-right font-medium text-gray-800 dark:text-white/90">
                      {target.itemName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Brand</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{target.brand}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">MPN</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{target.mpn}</span>
                </div>

                {target.itemStatus && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">Current status</span>
                    <span className="font-medium capitalize text-gray-800 dark:text-white/90">
                      {target.itemStatus.toLowerCase()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-7 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
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
              onClick={handleConfirm}
              disabled={submitting || !payload}
              className="h-11 w-full rounded-lg bg-success-500 text-sm font-medium text-white transition-colors hover:bg-success-600 disabled:opacity-50"
            >
              {submitting ? "Reverting..." : "Confirm revert"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
