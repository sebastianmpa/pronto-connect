import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import partsService from "../../lib/parts/partsService";
import type {
  PartDetailBcResponse,
  PartDynamicRow,
  PartStoreOffer,
} from "../../lib/parts/types";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function money(value: unknown): string {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : displayValue(value);
}

function normalizeColumnKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function humanizeKey(key: string): string {
  if (normalizeColumnKey(key) === "purchaseorderid") {
    return "PO #";
  }

  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function orderColumns(columns: string[]): string[] {
  return [...columns].sort((a, b) => {
    const aIsPo = normalizeColumnKey(a) === "purchaseorderid";
    const bIsPo = normalizeColumnKey(b) === "purchaseorderid";

    if (aIsPo && !bIsPo) return -1;
    if (!aIsPo && bIsPo) return 1;

    return 0;
  });
}

const STORE_OFFER_COLUMN_ORDER = [
  "store_id",
  "store_name",
  "brand",
  "status",
  "product_id",
  "variant_id",
  "sku",
  "mpn",
  "price",
  "base_price",
  "sale_price",
  "product_url",
  "error_code",
];

function isPriceColumn(column: string): boolean {
  return ["price", "base_price", "sale_price"].includes(column);
}

function formatOfferValue(column: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";

  if (isPriceColumn(column)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : displayValue(value);
  }

  return displayValue(value);
}

function StoreOffersTable({ offers }: { offers: PartStoreOffer[] }) {
  const columns = useMemo(() => {
    const returnedColumns = Array.from(
      offers.reduce<Set<string>>((set, offer) => {
        Object.keys(offer).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()),
    );

    return [
      ...STORE_OFFER_COLUMN_ORDER.filter((column) => returnedColumns.includes(column)),
      ...returnedColumns.filter((column) => !STORE_OFFER_COLUMN_ORDER.includes(column)),
    ];
  }, [offers]);

  if (!offers.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
        No store offers returned for this part.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
      <table className="w-full min-w-max text-sm">
        <thead className="bg-gray-50 dark:bg-white/[0.03]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400"
              >
                {humanizeKey(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {offers.map((offer, rowIndex) => (
            <tr
              key={`${String(offer.store_id ?? rowIndex)}-${rowIndex}`}
              className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            >
              {columns.map((column) => {
                const value = offer[column];

                return (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="max-w-[360px] px-4 py-3 align-top text-gray-600 dark:text-gray-400"
                  >
                    {column === "product_url" && typeof value === "string" && value.trim() ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        title={value}
                      >
                        Open product
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="block break-words">{formatOfferValue(column, value)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DynamicRowsTable({
  rows,
  emptyMessage,
}: {
  rows: PartDynamicRow[];
  emptyMessage: string;
}) {
  const columns = useMemo(
    () =>
      orderColumns(
        Array.from(
          rows.reduce<Set<string>>((set, row) => {
            Object.keys(row).forEach((key) => set.add(key));
            return set;
          }, new Set<string>()),
        ),
      ),
    [rows],
  );

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/10 dark:text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
      <table className="w-full min-w-max text-sm">
        <thead className="bg-gray-50 dark:bg-white/[0.03]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400"
              >
                {humanizeKey(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column}`}
                  className="max-w-[320px] px-4 py-3 align-top text-gray-600 dark:text-gray-400"
                >
                  <span className="block break-words">{displayValue(row[column])}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 break-words text-base font-semibold text-gray-800 dark:text-white/90">
        {displayValue(value)}
      </p>
    </div>
  );
}

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

  const product = part?.product;
  const stock = part?.stock_location;
  const suppliers = part?.suppliers ?? [];
  const purchaseOrders = part?.purchase_orders ?? [];
  const storeOffers = part?.store_offers ?? [];

  return (
    <>
      <PageMeta title={`${brand} ${mpn} | Pronto Connect`} description="BigCommerce part detail" />
      <PageBreadcrumb pageTitle="Part Detail" />

      <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
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

        {!loading && !error && part && (
          <>
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 dark:border-white/[0.06] sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    {part.brand || brand}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    MPN: {part.mpn || mpn}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
                  {product?.DESCRIPTION || "No description provided."}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  IDEAL: {part.mfr || "-"} {part.partnumber || "-"}
                </p>
              </div>
              <div className="text-left text-xs text-gray-400 sm:text-right">
                <p>Store ID: {storeId}</p>
                {product?.CATEGORY && <p>Category: {product.CATEGORY}</p>}
                {product?.STATUS && <p>Status: {product.STATUS}</p>}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Inventory</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <MetricCard label="On Hand" value={stock?.onhand} />
                <MetricCard label="Available" value={stock?.onhand_available} />
                <MetricCard label="Allocated" value={stock?.allocated} />
                <MetricCard label="On Order" value={stock?.onorder_qty} />
                <MetricCard label="Backorder" value={stock?.backorder_qty} />
                <MetricCard label="Cost" value={stock?.cost === null || stock?.cost === undefined ? "-" : money(stock.cost)} />
                <MetricCard label="Min" value={stock?.min} />
                <MetricCard label="Max" value={stock?.max} />
                <MetricCard label="Bin" value={stock?.binlocation} />
                <MetricCard label="ETA" value={part.eta} />
              </div>
              {part.treatment && (
                <div className="mt-3 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.06] dark:text-gray-400">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Treatment:</span>{" "}
                  {part.treatment}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Supplier Availability ({suppliers.length})
              </p>
              <DynamicRowsTable rows={suppliers} emptyMessage="No supplier availability found." />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Associated Purchase Orders ({part.purchase_orders_meta?.total ?? purchaseOrders.length})
                </p>
              </div>
              <DynamicRowsTable rows={purchaseOrders} emptyMessage="No associated purchase orders found." />
            </div>

            <div>
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Store Offers ({storeOffers.length})
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Prices and public product links for every store returned by the API. One row is shown per store, including every returned field.
                </p>
              </div>
              <StoreOffersTable offers={storeOffers} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
