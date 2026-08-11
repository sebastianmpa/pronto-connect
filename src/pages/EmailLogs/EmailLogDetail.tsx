import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import EmailLogDetailView from "../../components/email-logs/EmailLogDetailView";
import type { EmailLogItem } from "../../lib/email-logs/types";

interface EmailLogLocationState {
  log?: EmailLogItem;
  from?: string;
}

export default function EmailLogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as EmailLogLocationState | null) ?? null;
  const backTo = state?.from ?? "/email-logs";

  const [log, setLog] = useState<EmailLogItem | null>(state?.log ?? null);

  useEffect(() => {
    if (!id) return;

    if (state?.log && String(state.log.id) === id) {
      setLog(state.log);
      try {
        sessionStorage.setItem(`email-log:${id}`, JSON.stringify(state.log));
      } catch {
        // Ignore storage errors; navigation state already has the detail.
      }
      return;
    }

    try {
      const cached = sessionStorage.getItem(`email-log:${id}`);
      if (cached) {
        const parsed = JSON.parse(cached) as EmailLogItem;
        if (String(parsed.id) === id) {
          setLog(parsed);
        }
      }
    } catch {
      setLog(null);
    }
  }, [id, state?.log]);

  return (
    <>
      <PageMeta
        title={`Email Log #${id ?? ""} | Pronto Connect`}
        description="Email log detail"
      />
      <PageBreadcrumb pageTitle="Email Log Detail" />

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Email Logs
        </button>

        {log ? (
          <EmailLogDetailView log={log} />
        ) : (
          <div className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            This email log detail is not available in the current browser session. Return to Email Logs and open the record again.
          </div>
        )}
      </div>
    </>
  );
}
