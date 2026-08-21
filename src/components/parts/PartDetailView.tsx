import type {
  PartDetailResponse,
  PartDynamicRow,
} from "../../lib/parts/types";

interface PartDetailViewProps {
  part: PartDetailResponse;
  locationId: string;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function DynamicRowsTable({
  rows,
  emptyMessage,
}: {
  rows: PartDynamicRow[];
  emptyMessage: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400 dark:border-white/[0.05]">
        {emptyMessage}
      </div>
    );
  }

  const columns = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
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

export default function PartDetailView({ part, locationId }: PartDetailViewProps) {
  const stock = part.stock_location;
  const product = part.product;
  const supplierStock = part.supplier_stock ?? [];
  const purchaseOrders = part.purchase_orders ?? [];
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
        </div>

        <div className="rounded-xl border border-gray-100 px-4 py-3 text-sm dark:border-white/[0.05]">
          <p className="text-xs uppercase tracking-wide text-gray-400">Location ID</p>
          <p className="mt-1 font-medium text-gray-700 dark:text-gray-300">
            {displayValue(stock?.locationid ?? locationId)}
          </p>
        </div>
      </div>

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
        <DynamicRowsTable
          rows={purchaseOrders}
          emptyMessage="No purchase orders returned for this part."
        />
      </div>
    </div>
  );
}
