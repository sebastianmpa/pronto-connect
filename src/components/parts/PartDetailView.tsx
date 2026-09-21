import { Fragment, useState } from "react";
import { formatDateTime } from "../../utils/date";
import type {
  PartDetailResponse,
  PartDynamicRow,
  PartStoreOffer,
} from "../../lib/parts/types";

interface PartDetailViewProps {
  part: PartDetailResponse;
  locationId: string;
  po?: string;
  extraMetrics?: Array<{ label: string; value: unknown }>;
  extraContext?: Array<{ label: string; value: unknown }>;
  extraDetails?: Array<{ label: string; value: unknown }>;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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
  if (value === null || value === undefined || value === "") return "—";

  if (isPriceColumn(column)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : displayValue(value);
  }

  return displayValue(value);
}

function StoreOffersTable({ offers }: { offers: PartStoreOffer[] }) {
  if (!offers.length) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.05]">
        No store offers returned for this part.
      </div>
    );
  }

  const returnedColumns = Array.from(
    offers.reduce<Set<string>>((set, offer) => {
      Object.keys(offer).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const columns = [
    ...STORE_OFFER_COLUMN_ORDER.filter((column) => returnedColumns.includes(column)),
    ...returnedColumns.filter((column) => !STORE_OFFER_COLUMN_ORDER.includes(column)),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 custom-scrollbar dark:border-white/[0.05]">
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

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

interface WarehouseEntry {
  warehouse_name?: string;
  onhandqty?: number | string;
  is_main_warehouse?: boolean;
  last_updated?: string;
  [key: string]: unknown;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseWarehouses(value: unknown): WarehouseEntry[] {
  return Array.isArray(value) ? (value as WarehouseEntry[]) : [];
}

// Rendered as a full-width table row (colSpan across every column) so the
// expanded warehouse breakdown is not squeezed into the narrow cell width.
function WarehousesPanel({ warehouses }: { warehouses: WarehouseEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {warehouses.map((warehouse, index) => (
        <div
          key={`${warehouse.warehouse_name ?? "warehouse"}-${index}`}
          className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.02]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {displayValue(warehouse.warehouse_name)}
            </span>
            {warehouse.is_main_warehouse && (
              <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                Main
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Qty: {displayValue(warehouse.onhandqty)}
          </p>
          {warehouse.last_updated && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Updated {formatDateTime(warehouse.last_updated)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

interface PurchaseOrderShipment extends Record<string, unknown> {}

function findColumnKey(
  row: Record<string, unknown>,
  normalizedNames: string[],
): string | undefined {
  return Object.keys(row).find((key) =>
    normalizedNames.includes(normalizeColumnKey(key)),
  );
}

function getShipmentValue(
  shipment: PurchaseOrderShipment,
  normalizedNames: string[],
): unknown {
  const key = findColumnKey(shipment, normalizedNames);
  return key ? shipment[key] : undefined;
}

function getShipmentTrackingNumber(shipment: PurchaseOrderShipment): string {
  const value = getShipmentValue(shipment, [
    "number",
    "trackingnumber",
    "trackingno",
    "tracking",
  ]);

  return value === null || value === undefined ? "" : String(value).trim();
}

function getShipmentTrackingUrl(shipment: PurchaseOrderShipment): string {
  const value = getShipmentValue(shipment, [
    "url",
    "trackingurl",
    "trackinglink",
    "link",
  ]);

  return value === null || value === undefined ? "" : String(value).trim();
}

function getShipmentSkuMatch(shipment: PurchaseOrderShipment): string {
  const value = getShipmentValue(shipment, [
    "skumatch",
    "matchsku",
  ]);

  return value === null || value === undefined ? "" : String(value).trim();
}

function isSkuMatchYes(shipment: PurchaseOrderShipment): boolean {
  return getShipmentSkuMatch(shipment).toUpperCase() === "Y";
}

function parsePurchaseOrderShipments(value: unknown): PurchaseOrderShipment[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is PurchaseOrderShipment =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function isInvoicesTrackingColumn(column: string): boolean {
  return [
    "invoicestracking",
    "invoicetracking",
    "shipmentstracking",
    "shipments",
  ].includes(normalizeColumnKey(column));
}

function ShipmentTrackingTable({
  shipments,
}: {
  shipments: PurchaseOrderShipment[];
}) {
  /*
   * SKU Match = Y siempre se muestra primero.
   * Se conserva el orden original dentro de cada grupo.
   */
  const sortedShipments = shipments
    .map((shipment, originalIndex) => ({
      shipment,
      originalIndex,
    }))
    .sort((a, b) => {
      const aMatch = isSkuMatchYes(a.shipment) ? 0 : 1;
      const bMatch = isSkuMatchYes(b.shipment) ? 0 : 1;

      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ shipment }) => shipment);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white custom-scrollbar dark:border-white/[0.05] dark:bg-gray-900">
      <table className="w-full min-w-[850px] text-xs">
        <thead className="bg-gray-50 dark:bg-white/[0.03]">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Number
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Tracking #
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Status
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Eta
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Carrier
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
              Sku Match
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {sortedShipments.map((shipment, shipmentIndex) => {
            const matched = isSkuMatchYes(shipment);
            const trackingNumber = getShipmentTrackingNumber(shipment);
            const trackingUrl = getShipmentTrackingUrl(shipment);

            const status = getShipmentValue(shipment, ["status"]);
            const eta = getShipmentValue(shipment, [
              "eta",
              "estimateddelivery",
              "estimateddeliverydate",
            ]);
            const carrier = getShipmentValue(shipment, ["carrier"]);
            const skuMatch = getShipmentSkuMatch(shipment);

            return (
              <tr
                key={`${trackingNumber || "shipment"}-${shipmentIndex}`}
                className={
                  matched
                    ? "bg-green-50 transition-colors hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/15"
                    : "transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                }
              >
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                  {trackingNumber || "—"}
                </td>

                <td className="px-3 py-2.5">
                  {trackingNumber && trackingUrl ? (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={trackingUrl}
                      className={`inline-flex items-center gap-1 font-medium underline underline-offset-2 ${
                        matched
                          ? "text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          : "text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      }`}
                    >
                      {trackingNumber}
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span
                      className={
                        matched
                          ? "font-medium text-green-700 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      }
                    >
                      {trackingNumber || "—"}
                    </span>
                  )}
                </td>

                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                  {displayValue(status)}
                </td>

                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                  {displayValue(eta)}
                </td>

                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                  {displayValue(carrier)}
                </td>

                <td
                  className={`px-3 py-2.5 ${
                    matched
                      ? "font-bold text-green-700 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {skuMatch || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseOrdersTable({
  rows,
  emptyMessage,
}: {
  rows: PartDynamicRow[];
  emptyMessage: string;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.05]">
        {emptyMessage}
      </div>
    );
  }

  const columns = orderColumns(
    Array.from(
      rows.reduce<Set<string>>((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()),
    ),
  );

  const invoicesTrackingColumn = columns.find(isInvoicesTrackingColumn);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 custom-scrollbar dark:border-white/[0.05]">
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
          {rows.map((row, rowIndex) => {
            const shipments = invoicesTrackingColumn
              ? parsePurchaseOrderShipments(row[invoicesTrackingColumn])
              : [];

            const isExpanded =
              expandedRow === rowIndex && shipments.length > 0;

            return (
              <Fragment key={rowIndex}>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="max-w-[320px] px-4 py-3 align-top text-gray-600 dark:text-gray-400"
                    >
                      {column === invoicesTrackingColumn ? (
                        shipments.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRow((current) =>
                                current === rowIndex ? null : rowIndex,
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            <ChevronIcon open={isExpanded} />
                            {shipments.length} shipment
                            {shipments.length === 1 ? "" : "s"}
                          </button>
                        ) : (
                          <span>—</span>
                        )
                      ) : (
                        <span className="block break-words">
                          {displayValue(row[column])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {isExpanded && (
                  <tr className="bg-gray-50/60 dark:bg-white/[0.02]">
                    <td colSpan={columns.length} className="px-4 py-4">
                      <ShipmentTrackingTable shipments={shipments} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
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
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.05]">
        {emptyMessage}
      </div>
    );
  }

  const columns = orderColumns(
    Array.from(
      rows.reduce<Set<string>>((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()),
    ),
  );

  const warehousesColumn = columns.find(
    (column) => normalizeColumnKey(column) === "warehouses",
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 custom-scrollbar dark:border-white/[0.05]">
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
          {rows.map((row, rowIndex) => {
            const warehouses = warehousesColumn
              ? parseWarehouses(row[warehousesColumn])
              : [];
            const isExpanded = expandedRow === rowIndex && warehouses.length > 0;

            return (
              <Fragment key={rowIndex}>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="max-w-[320px] px-4 py-3 align-top text-gray-600 dark:text-gray-400"
                    >
                      {column === warehousesColumn ? (
                        warehouses.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRow((current) => (current === rowIndex ? null : rowIndex))
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            <ChevronIcon open={isExpanded} />
                            {warehouses.length} warehouse{warehouses.length === 1 ? "" : "s"}
                          </button>
                        )
                      ) : (
                        <span className="block break-words">{displayValue(row[column])}</span>
                      )}
                    </td>
                  ))}
                </tr>

                {isExpanded && (
                  <tr className="bg-gray-50/60 dark:bg-white/[0.02]">
                    <td colSpan={columns.length} className="px-4 py-4">
                      <WarehousesPanel warehouses={warehouses} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PartDetailView({
  part,
  locationId,
  po = "",
  extraMetrics = [],
  extraContext = [],
  extraDetails = [],
}: PartDetailViewProps) {
  const stock = part.stock_location;
  const product = part.product;
  const supplierStock = part.supplier_stock ?? [];
  const purchaseOrders = part.purchase_orders ?? [];
  const storeOffers = part.store_offers ?? [];
  const tracking = part.tracking;
  const description = product?.DESCRIPTION || "No description provided.";


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              {part.mfr}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {part.partnumber}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>

          {extraContext.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {extraContext.map((item) => (
                <span key={item.label}>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{item.label}:</span>{" "}
                  {displayValue(item.value)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-gray-100 px-4 py-3 text-sm dark:border-white/[0.05]">
            <p className="text-xs uppercase tracking-wide text-gray-400">Location ID</p>
            <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
              {displayValue(stock?.locationid ?? locationId)}
            </p>
          </div>

          {extraMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-gray-100 px-4 py-3 text-sm dark:border-white/[0.05]"
            >
              <p className="text-xs uppercase tracking-wide text-gray-400">{metric.label}</p>
              <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
                {displayValue(metric.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {extraDetails.length > 0 && (
        <div className="space-y-2">
          {extraDetails.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-white/[0.05] dark:text-gray-400"
            >
              <span className="font-semibold text-gray-700 dark:text-gray-300">{item.label}:</span>{" "}
              {displayValue(item.value)}
            </div>
          ))}
        </div>
      )}

      <div>
        <SectionHeader title="Stock by Location" />
        <div className="overflow-x-auto rounded-xl border border-gray-100 custom-scrollbar dark:border-white/[0.05]">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                {["Location", "On Hand", "Allocated", "On Order", "Backorder", "Cost", "Bin"].map((label) => (
                  <th key={label} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{displayValue(stock?.locationid)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.onhand)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.allocated)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.onorder_qty)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.backorder_qty)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.cost)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.binlocation)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionHeader
          title="Stock Levels"
          subtitle="The current detail response exposes Min, Max, SumMin and SumMax for the selected location."
        />
        <div className="overflow-x-auto rounded-xl border border-gray-100 custom-scrollbar dark:border-white/[0.05]">
          <table className="w-full min-w-[650px] text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                {["Location", "Min", "Max", "SumMin", "SumMax"].map((label) => (
                  <th key={label} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{displayValue(stock?.locationid)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.min)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.max)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.summin)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{displayValue(stock?.summax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {tracking?.number && (
        <div>
          <SectionHeader
            title="Tracking Information"
            subtitle="Latest tracking associated with the selected PO and part."
          />

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">PO #</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {po || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Carrier</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {displayValue(tracking.carrier)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Tracking #</p>
                {tracking.url ? (
                  <a
                    href={tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 break-all text-sm font-semibold text-brand-500 hover:text-brand-600 hover:underline"
                  >
                    {tracking.number}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 5H19V10M19 5L11 13"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19 13V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V6C5 5.44772 5.44772 5 6 5H11"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                    {tracking.number}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {displayValue(tracking.status)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">ETA</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {displayValue(tracking.eta)}
                </p>
              </div>
            </div>

            {tracking.url && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
                <a
                  href={tracking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
                >
                  Track Package
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 5H19V10M19 5L11 13"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <SectionHeader
          title={`Supplier Stock (${supplierStock.length})`}
          subtitle="If the API returns supplier_stock rows, every returned field is displayed."
        />
        <DynamicRowsTable
          rows={supplierStock}
          emptyMessage="No supplier stock returned for this part."
        />
      </div>

      <div>
        <SectionHeader
          title={`Purchase Orders (${part.purchase_orders_meta?.total ?? purchaseOrders.length})`}
          subtitle="If the API returns purchase_orders rows, every returned field is displayed."
        />
        <PurchaseOrdersTable
          rows={purchaseOrders}
          emptyMessage="No purchase orders returned for this part."
        />
      </div>

      <div>
        <SectionHeader
          title={`Store Offers (${storeOffers.length})`}
          subtitle="Prices and public product links for every store returned by the API. One row is shown per store, including every returned field."
        />
        <StoreOffersTable offers={storeOffers} />
      </div>
    </div>
  );
}
