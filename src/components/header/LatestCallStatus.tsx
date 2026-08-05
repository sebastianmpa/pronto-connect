import { useState } from "react";
import { useNavigate } from "react-router";
import { useGoToConnect } from "../../context/GoToConnectContext";
import { getCallerInfo, getQueueName } from "../../lib/goToConnect/callInfo";
import { formatDateTime } from "../../utils/date";
import QualifyCallModal from "./QualifyCallModal";
import customersService from "../../lib/customers/customersService";

/** Inline header widget: shows only the most recent answered call, with a live-status phone icon. */
export default function LatestCallStatus() {
  const navigate = useNavigate();
  const { status, calls } = useGoToConnect();
  const latest = calls[0] ?? null;
  // A freshly-arrived call always reappears, even if a previous one was dismissed.
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [qualifyOpen, setQualifyOpen] = useState(false);

  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);

  const goToCustomerDetail = async () => {
    if (!latest) return;
    const caller = getCallerInfo(latest.event);
    if (!caller?.number) return;

    setCustomerSearchLoading(true);
    setCustomerSearchError(null);
    try {
      const res = await customersService.search({
        store_url: "",
        page: 1,
        limit: 1,
        phone: caller.number,
      });
      const match = res.items?.[0];
      if (!match) {
        setCustomerSearchError("No customer found for this number.");
        return;
      }
      const qs = new URLSearchParams({
        store: res.source,
        email: match.email,
        id: match.customerId,
      }).toString();
      navigate(`/customers/detail?${qs}`);
    } catch {
      setCustomerSearchError("Could not search for this customer. Please try again.");
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const statusLabel =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "error"
          ? "Connection error"
          : "Offline";

  const showBadge = latest && latest.localId !== dismissedId;
  const caller = showBadge ? getCallerInfo(latest.event) : null;
  const queue = showBadge ? getQueueName(latest.event) : null;

  return (
    <div className="flex items-center gap-2">
      {showBadge && (
        <div className="relative hidden lg:block">
          <div
            onClick={goToCustomerDetail}
            className="flex max-w-md cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-2.5 text-xs shadow-theme-xs transition-colors hover:border-brand-300 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
              {customerSearchLoading ? (
                <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 5.5C3 4.11929 4.11929 3 5.5 3H8.5L10.5 8L8 9.5C9 12 12 15 14.5 16L16 13.5L21 15.5V18.5C21 19.8807 19.8807 21 18.5 21C10.9919 21 3 13.0081 3 5.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium text-gray-800 dark:text-white/90">
                {caller ? caller.name : "Unknown caller"}
                {caller?.number && <span className="ml-1 font-normal text-gray-400">{caller.number}</span>}
              </p>
              <p className="truncate text-gray-400">
                {customerSearchError ?? (
                  <>
                    {latest.event.agent.name} (ext. {latest.event.agent.extension})
                    {queue && ` · ${queue}`} · {formatDateTime(latest.event.occurredAt)}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQualifyOpen(true);
              }}
              className="ml-1 shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-gray-900 shadow-theme-xs hover:bg-brand-600 transition-colors"
            >
              Qualify
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDismissedId(latest.localId);
              }}
              className="shrink-0 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
        title={statusLabel}
      >
        {status === "connected" && (
          <span className="absolute top-0.5 right-0 z-10 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
          </span>
        )}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
          <path
            d="M3 5.5C3 4.11929 4.11929 3 5.5 3H8.5L10.5 8L8 9.5C9 12 12 15 14.5 16L16 13.5L21 15.5V18.5C21 19.8807 19.8807 21 18.5 21C10.9919 21 3 13.0081 3 5.5Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <QualifyCallModal
        isOpen={qualifyOpen}
        onClose={() => setQualifyOpen(false)}
        call={latest}
      />
    </div>
  );
}
