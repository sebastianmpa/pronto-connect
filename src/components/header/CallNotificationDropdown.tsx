import { useState } from "react";
import { cn } from "../../utils";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useGoToConnect } from "../../context/GoToConnectContext";
import { getCallerInfo, getQueueName } from "../../lib/goToConnect/callInfo";
import { formatDateTime } from "../../utils/date";

export default function CallNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { status, calls, unseenCount, markAllSeen, clearHistory } = useGoToConnect();

  const toggleDropdown = () => {
    setIsOpen((prev) => {
      if (!prev) markAllSeen();
      return !prev;
    });
  };

  const closeDropdown = () => setIsOpen(false);

  const statusColor =
    status === "connected" ? "bg-success-500" : status === "connecting" ? "bg-yellow-400" : "bg-gray-300";
  const statusLabel =
    status === "connected" ? "Live" : status === "connecting" ? "Connecting…" : status === "error" ? "Connection error" : "Offline";

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        title={statusLabel}
      >
        <span
          className={cn(
            "absolute top-0.5 right-0 z-10 h-2 w-2 rounded-full bg-orange-400",
            unseenCount === 0 ? "hidden" : "flex"
          )}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
          <path
            d="M3 5.5C3 4.11929 4.11929 3 5.5 3H8.5L10.5 8L8 9.5C9 12 12 15 14.5 16L16 13.5L21 15.5V18.5C21 19.8807 19.8807 21 18.5 21C10.9919 21 3 13.0081 3 5.5Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -left-13.5 mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-[361px] xl:right-0 xl:left-auto dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Calls</h5>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
              {statusLabel}
            </span>
          </div>
          <button
            onClick={closeDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ul className="flex custom-scrollbar h-auto flex-col overflow-y-auto">
          {calls.length === 0 ? (
            <li className="py-10 text-center text-sm text-gray-400">No calls yet.</li>
          ) : (
            calls.map((c) => {
              const caller = getCallerInfo(c.event);
              const queue = getQueueName(c.event);
              return (
                <li key={c.localId}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex flex-col gap-1 rounded-lg border-b border-gray-100 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                  >
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {caller ? caller.name : "Unknown caller"}
                      {caller?.number && (
                        <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">{caller.number}</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Answered by {c.event.agent.name} (ext. {c.event.agent.extension})
                      {queue && ` · ${queue}`}
                    </span>
                    <span className="text-xs text-gray-400">{formatDateTime(c.event.occurredAt)}</span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        {calls.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Clear all
          </button>
        )}
      </Dropdown>
    </div>
  );
}
