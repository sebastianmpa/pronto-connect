import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PartDetailView from "../../components/parts/PartDetailView";
import partsService from "../../lib/parts/partsService";
import type { PartDetailResponse } from "../../lib/parts/types";

// While a live scrape job is running (source SCRAPPER, job_status !== "finished"),
// keep polling the same endpoint until it settles.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~60s before giving up and leaving the last known data on screen

interface StockMeta {
  source: string;
  jobStatus: string;
  stale: boolean;
  refreshing: boolean;
  lastChecked: string | null;
}

export default function PartDetail() {
  const { mfr = "", partNumber = "" } = useParams<{
    mfr: string;
    partNumber: string;
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const locationId = searchParams.get("locationid") ?? "";
  const po = searchParams.get("po") ?? "";
  const backTo = (location.state as { from?: string } | null)?.from ?? "/parts";

  const backLabel = backTo.startsWith("/orders/") ? "Back to Order" : "Back to Parts";

  const [part, setPart] = useState<PartDetailResponse | null>(null);
  const [stockMeta, setStockMeta] = useState<StockMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mfr || !partNumber || !locationId) {
      setLoading(false);
      setError(
        "Missing MFR, Part Number or Location ID. Return to Parts and run the lookup again.",
      );
      return;
    }

    let cancelled = false;
    let attempts = 0;

    setLoading(true);
    setError(null);
    setPart(null);
    setStockMeta(null);

    const poll = async () => {
      try {
        const response = await partsService.getSupplierStock({
          mfrId: mfr,
          partNumber,
          locationId,
          force: true,
        });

        if (cancelled) return;

        setPart(response.data);
        setStockMeta({
          source: response.source,
          jobStatus: response.job_status,
          stale: response.stale,
          refreshing: response.refreshing,
          lastChecked: response.last_checked,
        });
        setLoading(false);

        attempts += 1;
        if (response.job_status !== "finished" && attempts < MAX_POLL_ATTEMPTS) {
          setTimeout(() => {
            if (!cancelled) void poll();
          }, POLL_INTERVAL_MS);
        }
      } catch {
        if (cancelled) return;
        setPart(null);
        setError("Could not load part details. Please try again.");
        setLoading(false);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [mfr, partNumber, locationId]);

  return (
    <>
      <PageMeta
        title={`${mfr} ${partNumber} | Pronto Connect`}
        description="Part detail"
      />
      <PageBreadcrumb pageTitle="Part Detail" />

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
          {backLabel}
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && part && (
          <>
            {stockMeta && stockMeta.jobStatus !== "finished" && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                <svg className="h-4 w-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Fetching live stock from the supplier — showing cached data below, this will update automatically.
              </div>
            )}

            <PartDetailView
              part={part}
              locationId={locationId}
              po={po}
              extraMetrics={[
                { label: "Available", value: part.stock_location?.onhand_available },
                { label: "ETA", value: part.eta },
              ]}
              extraContext={[
                { label: "Category", value: part.product?.CATEGORY },
                { label: "Status", value: part.product?.STATUS },
                ...(stockMeta ? [{ label: "Data Source", value: stockMeta.source }] : []),
              ]}
              extraDetails={
                part.treatment
                  ? [{ label: "Treatment", value: part.treatment }]
                  : []
              }
            />
          </>
        )}
      </div>
    </>
  );
}
