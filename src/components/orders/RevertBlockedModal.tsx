import { Modal } from "../ui/modal";

interface RevertBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

// Shown instead of RevertCancellationModal when the order/item status in
// BigCommerce does not currently allow a cancellation to be reverted.
export default function RevertBlockedModal({
  isOpen,
  onClose,
  message,
}: RevertBlockedModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[480px] rounded-3xl bg-white p-6 dark:bg-gray-900 sm:m-0 lg:p-10"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
        Cannot revert this cancellation
      </h4>

      <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-lg bg-brand-500 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
      >
        Close
      </button>
    </Modal>
  );
}
