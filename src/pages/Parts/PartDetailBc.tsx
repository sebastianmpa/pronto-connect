import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PartDetailView from "../../components/parts/PartDetailView";
import partsService from "../../lib/parts/partsService";
import type {
  PartDetailBcResponse,
  PartDetailResponse,
} from "../../lib/parts/types";

export default function PartDetailBc() {
  const { brand = "", mpn = "" } = useParams<{ brand: string; mpn: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const storeId = searchParams.get("storeid") ?? "";
  const backTo = (location.state as { from?: string } | null)?.from ?? "/orders";

  const [part, setPart] = useState<PartDetailBcResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId || !brand || !mpn) {
      setLoading(false);
      setError("Missing Store ID, Brand or MPN. Return to the order and open the part again.");
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    // IMPORTANT: this route continues using /api/parts/detail-bc.
    // Only the visual component is shared with the regular Part Detail page.
    partsService
      .getDetailBc({ storeId, brand, mpn })
      .then((response) => {
        if (active) setPart(response);
      })
      .catch(() => {
        if (active) setError("Could not load the BigCommerce part detail. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId, brand, mpn]);

  // Both /detail and /detail-bc now expose supplier inventory as
  // `supplier_stock`. Keep `suppliers` only as a temporary legacy fallback
  // so older environments do not lose supplier inventory while deploying.
  const normalizedPart = useMemo<PartDetailResponse | null>(() => {
    if (!part) return null;

    return {
      ...part,
      supplier_stock: part.supplier_stock ?? part.suppliers ?? [],
    };
  }, [part]);

  const resolvedLocationId = String(
    normalizedPart?.stock_location?.locationid ?? "",
  );

  // Keep the same information block used by the regular /api/parts/detail view.
  // The page still loads its data from /api/parts/detail-bc; only the presentation
  // is intentionally identical to the regular Part Detail screen.
  const extraMetrics = useMemo(() => {
    if (!part) return [];

    return [
      { label: "Available", value: part.stock_location?.onhand_available },
      { label: "ETA", value: part.eta },
    ];
  }, [part]);

  const extraContext = useMemo(() => {
    if (!part) return [];

    return [
      { label: "Category", value: part.product?.CATEGORY },
      { label: "Status", value: part.product?.STATUS },
    ];
  }, [part]);

  const extraDetails = useMemo(() => {
    if (!part?.treatment) return [];
    return [{ label: "Treatment", value: part.treatment }];
  }, [part?.treatment]);

  return (
    <>
      <PageMeta title={`${brand} ${mpn} | Pronto Connect`} description="BigCommerce part detail" />
      <PageBreadcrumb pageTitle="Part Detail" />

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Order
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && normalizedPart && (
          <PartDetailView
            part={normalizedPart}
            locationId={resolvedLocationId}
            extraMetrics={extraMetrics}
            extraContext={extraContext}
            extraDetails={extraDetails}
          />
        )}
      </div>
    </>
  );
}
