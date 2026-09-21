import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import type { AtcFormItem } from "../../lib/atc-forms/types";

const RESPONSIBLE_AREAS = [
  "Warehouse",
  "Carrier",
  "Customer",
  "Website",
  "Supplier",
  "Purchasing",
  "Customer Service",
  "Manufacturer",
] as const;

interface ConvertClaimToFac005ModalProps {
  claim: AtcFormItem | null;
  isConverting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (responsibleArea: string) => void;
}

export default function ConvertClaimToFac005Modal({
  claim,
  isConverting,
  error,
  onClose,
  onConfirm,
}: ConvertClaimToFac005ModalProps) {
  const [responsibleArea, setResponsibleArea] = useState("");

  useEffect(() => {
    setResponsibleArea("");
  }, [claim?.id]);

  return (
    <Modal
      isOpen={Boolean(claim)}
      onClose={onClose}
      className="relative my-auto w-full max-w-[480px] rounded-3xl bg-white p-6 dark:bg-gray-900"
      showCloseButton={!isConverting}
    >
      <div className="pr-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 8v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Convert Claim to FAC005
        </h4>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          This will create a FAC005 case from Client Request #{claim?.id}
          {claim?.order_number ? ` for order ${claim.order_number}` : ""}.
        </p>
        <div className="mt-4 rounded-lg bg-warning-50 px-4 py-3 text-sm leading-5 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
          This action cannot be repeated for the same Client Request.
        </div>
        <div className="mt-5">
          <label
            htmlFor="fac005-responsible-area"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Responsible area <span className="text-error-500">*</span>
          </label>
          <select
            id="fac005-responsible-area"
            value={responsibleArea}
            onChange={(event) => setResponsibleArea(event.target.value)}
            disabled={isConverting}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Select responsible area</option>
            {RESPONSIBLE_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isConverting}
          className="h-11 rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(responsibleArea)}
          disabled={isConverting || !responsibleArea}
          className="h-11 rounded-lg bg-gray-800 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isConverting ? "Converting…" : "Convert to FAC005"}
        </button>
      </div>
    </Modal>
  );
}
