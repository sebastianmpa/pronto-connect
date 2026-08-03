import { useEffect } from "react";
import { useGoToConnect } from "../../context/GoToConnectContext";
import { getCallerInfo, getQueueName } from "../../lib/goToConnect/callInfo";

const AUTO_DISMISS_MS = 8000;

export default function CallToast() {
  const { latestCall, dismissToast } = useGoToConnect();

  useEffect(() => {
    if (!latestCall) return;
    const timer = setTimeout(dismissToast, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [latestCall, dismissToast]);

  if (!latestCall) return null;

  const { agent } = latestCall.event;
  const caller = getCallerInfo(latestCall.event);
  const queue = getQueueName(latestCall.event);

  return (
    <div className="fixed bottom-6 right-6 z-99999 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 5.5C3 4.11929 4.11929 3 5.5 3H8.5L10.5 8L8 9.5C9 12 12 15 14.5 16L16 13.5L21 15.5V18.5C21 19.8807 19.8807 21 18.5 21C10.9919 21 3 13.0081 3 5.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Call answered</p>
            <p className="text-xs text-gray-400">
              {agent.name} &middot; ext. {agent.extension}
            </p>
          </div>
        </div>
        <button
          onClick={dismissToast}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {caller && (
          <p className="text-gray-700 dark:text-gray-300">
            <span className="text-gray-400">From: </span>
            {caller.name}
            {caller.number && ` · ${caller.number}`}
          </p>
        )}
        {queue && <p className="text-xs text-gray-400">Queue: {queue}</p>}
      </div>
    </div>
  );
}
