import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import partsService from "../../lib/parts/partsService";
import type {
  PartDynamicRow,
  PartLookupItem,
} from "../../lib/parts/types";

const inputClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getProviderQuantity(row: PartDynamicRow): number {
  const candidates = [
    "provider_qty",
    "provider_quantity",
    "providerQuantity",
    "Provider Quantity",
    "qty",
    "quantity",
  ];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return toNumber(row[key]);
    }
  }

  return 0;
}

function getSupplierStockTotal(part: PartLookupItem): number {
  return (part.supplier_stock ?? []).reduce(
    (total, row) => total + getProviderQuantity(row),
    0,
  );
}

function getDescription(part: PartLookupItem): string {
  return part.description || part.product?.DESCRIPTION || "—";
}

export default function PartsTable() {
  const navigate = useNavigate();

  const [sku, setSku] = useState("");
  const [results, setResults] = useState<PartLookupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanSku = sku.trim();

    if (!cleanSku) {
      setError("SKU is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await partsService.searchBySku({
        partNumber: cleanSku,
      });

      setResults(response.items);
      setTotal(response.meta.total);

      if (response.items.length === 0) {
        setError("No parts were found for this SKU.");
      }
    } catch {
      setResults([]);
      setTotal(0);
      setError(
        "Parts could not be loaded. Please verify the SKU and the Ideal API configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSku("");
    setResults([]);
    setTotal(0);
    setError(null);
    setSearched(false);
  };

  const openDetail = (part: PartLookupItem) => {
    const locationId = part.stock?.location_id;

    if (
      locationId === null ||
      locationId === undefined ||
      locationId === ""
    ) {
      return;
    }

    // IDEAL location 0 must open Part Detail using location 4.
    // The list keeps showing the original location value (0); only the detail
    // request is remapped.
    const detailLocationId = Number(locationId) === 0 ? 4 : locationId;

    const query = new URLSearchParams({
      locationid: String(detailLocationId),
    }).toString();

    navigate(
      `/parts/${encodeURIComponent(part.mfr)}/${encodeURIComponent(
        part.partnumber,
      )}?${query}`,
      { state: { from: "/parts" } },
    );
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-4 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 md:flex-row md:items-end dark:border-white/[0.05]"
      >
        <div className="w-full md:max-w-xl">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            SKU
          </label>

          <input
            type="text"
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="795633"
            className={inputClass}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-brand-500 px-5 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="border-x border-gray-100 px-4 py-3 dark:border-white/[0.05]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search results{searched ? ` (${total})` : ""}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Search by SKU and select the matching MFR/location to open Part Detail.
          </p>
        </div>
      </div>

      {error && (
        <div className="border-x border-gray-100 px-4 pb-4 dark:border-white/[0.05]">
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center border border-gray-100 py-16 dark:border-white/[0.05]">
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
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "MFR",
                  "Part Number",
                  "Description",
                  "Location",
                  "Cost",
                  "Supplier Stock",
                  "On Hand",
                  "",
                ].map((label) => (
                  <TableCell
                    key={label || "actions"}
                    isHeader
                    className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"
                  >
                    <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                      {label}
                    </p>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={8}
                    className="border border-gray-100 px-4 py-10 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400"
                  >
                    {searched
                      ? "No parts available for this SKU."
                      : "Enter a SKU to search."}
                  </td>
                </TableRow>
              ) : (
                results.map((part, index) => {
                  const locationId = part.stock?.location_id;
                  const canOpenDetail =
                    locationId !== null &&
                    locationId !== undefined &&
                    locationId !== "";

                  return (
                    <TableRow
                      key={`${part.mfr}-${part.partnumber}-${String(
                        locationId,
                      )}-${index}`}
                    >
                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                        {part.mfr}
                      </TableCell>

                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                        {part.partnumber}
                      </TableCell>

                      <TableCell className="min-w-[260px] border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        <span className="block break-words">
                          {getDescription(part)}
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        {displayValue(locationId)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        {displayValue(part.product?.LISTPRICE)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        {getSupplierStockTotal(part)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                        {displayValue(part.stock?.onhand)}
                      </TableCell>

                      <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]">
                        <button
                          type="button"
                          onClick={() => openDetail(part)}
                          disabled={!canOpenDetail}
                          title={
                            canOpenDetail
                              ? "View part detail"
                              : "Location ID is required to open detail"
                          }
                          aria-label={`View part ${part.partnumber}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-brand-500/10"
                        >
                          <EyeIcon />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
