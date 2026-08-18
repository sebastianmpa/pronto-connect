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
import type { PartDetailResponse } from "../../lib/parts/types";

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

function getDescription(part: PartDetailResponse): string {
  return part.product?.DESCRIPTION || "—";
}

const SUPPLIER_QUANTITY_KEYS = [
  "provider_quantity",
  "providerQuantity",
  "PROVIDERQUANTITY",
  "PROVIDER_QUANTITY",
  "ProviderQuantity",
  "Provider Quantity",
  "quantity",
  "qty",
  "QTY",
  "onhand",
  "on_hand",
  "stock",
];

function toNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getSupplierRowQuantity(row: Record<string, unknown>): number {
  for (const key of SUPPLIER_QUANTITY_KEYS) {
    const numericValue = toNumericValue(row[key]);
    if (numericValue !== null) return numericValue;
  }

  const fallbackKey = Object.keys(row).find((key) => {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    return [
      "providerquantity",
      "quantity",
      "qty",
      "supplierstock",
      "stock",
      "onhand",
    ].includes(normalizedKey);
  });

  if (!fallbackKey) return 0;

  return toNumericValue(row[fallbackKey]) ?? 0;
}

function getSupplierStock(part: PartDetailResponse): number {
  const rows = Array.isArray(part.supplier_stock) ? part.supplier_stock : [];

  if (rows.length === 0) return 0;

  return rows.reduce((total, row) => total + getSupplierRowQuantity(row), 0);
}

export default function PartsTable() {
  const navigate = useNavigate();

  const [mfr, setMfr] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [locationId, setLocationId] = useState("");
  const [result, setResult] = useState<PartDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanMfr = mfr.trim();
    const cleanPartNumber = partNumber.trim();
    const cleanLocationId = locationId.trim();

    if (!cleanMfr || !cleanPartNumber || !cleanLocationId) {
      setError("MFR, Part Number and Location ID are required by the current detail endpoint.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await partsService.getDetail({
        mfr: cleanMfr,
        partNumber: cleanPartNumber,
        locationId: cleanLocationId,
      });
      setResult(data);
    } catch {
      setResult(null);
      setError(
        "Part detail could not be loaded. Please verify MFR, Part Number, Location ID and the Ideal API configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMfr("");
    setPartNumber("");
    setLocationId("");
    setResult(null);
    setError(null);
    setSearched(false);
  };

  const openDetail = (part: PartDetailResponse) => {
    const selectedLocation = String(
      part.stock_location?.locationid ?? locationId.trim(),
    );
    const query = new URLSearchParams({ locationid: selectedLocation }).toString();

    navigate(
      `/parts/${encodeURIComponent(part.mfr)}/${encodeURIComponent(part.partnumber)}?${query}`,
      { state: { from: "/parts" } },
    );
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-4 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 md:grid-cols-2 xl:grid-cols-[minmax(150px,0.55fr)_minmax(220px,0.9fr)_minmax(150px,0.55fr)_auto] xl:items-end dark:border-white/[0.05]"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            MFR
          </label>
          <input
            type="text"
            value={mfr}
            onChange={(event) => setMfr(event.target.value)}
            placeholder="HST"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Part Number
          </label>
          <input
            type="text"
            value={partNumber}
            onChange={(event) => setPartNumber(event.target.value)}
            placeholder="795633"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Location ID
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            placeholder="1"
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
            Search result
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            The current endpoint is an exact detail lookup. A SKU-only search needs a separate search/list endpoint because one part number can exist under multiple MFRs and locations.
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
                {["MFR", "Part Number", "Description", "Location", "Cost", "Supplier Stock", "On Hand", "Available", ""].map(
                  (label) => (
                    <TableCell
                      key={label || "actions"}
                      isHeader
                      className="border border-gray-100 px-4 py-3 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        {label}
                      </p>
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!result ? (
                <TableRow>
                  <td
                    colSpan={9}
                    className="border border-gray-100 px-4 py-10 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400"
                  >
                    {searched
                      ? "No part detail available for the selected filters."
                      : "Enter MFR, Part Number and Location ID to search."}
                  </td>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                    {result.mfr}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm font-medium text-gray-800 dark:border-white/[0.05] dark:text-white/90">
                    {result.partnumber}
                  </TableCell>
                  <TableCell className="min-w-[260px] border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    <span className="block break-words">{getDescription(result)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    {displayValue(result.stock_location?.locationid)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    {displayValue(result.product?.LISTPRICE)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    {getSupplierStock(result)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    {displayValue(result.stock_location?.onhand)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400">
                    {displayValue(result.stock_location?.onhand_available)}
                  </TableCell>
                  <TableCell className="border border-gray-100 px-3 py-3 text-center dark:border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => openDetail(result)}
                      title="View part detail"
                      aria-label={`View part ${result.partnumber}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                    >
                      <EyeIcon />
                    </button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
