import { DownloadIcon } from "../../icons";

interface FilteredResultsToolbarProps {
  /** Total number of records that match the filters, across every page. */
  filteredCount: number;
  /** Total number of records available before filters are applied. */
  totalCount: number;
  exporting: boolean;
  onExport: () => void;
  disabled?: boolean;
}

export default function FilteredResultsToolbar({
  filteredCount,
  totalCount,
  exporting,
  onExport,
  disabled = false,
}: FilteredResultsToolbarProps) {
  const safeFilteredCount = Math.max(0, filteredCount || 0);
  const safeTotalCount = Math.max(safeFilteredCount, totalCount || 0);

  return (
    <div className="flex flex-col gap-3 border-x border-b border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Filtered / total records
        </span>
        <span
          className="inline-flex min-w-[96px] items-center justify-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
          title={`${safeFilteredCount} records match the current filters out of ${safeTotalCount} total records`}
        >
          {safeFilteredCount} / {safeTotalCount}
        </span>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={disabled || exporting || safeFilteredCount === 0}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]"
      >
        <DownloadIcon className="h-4 w-4" />
        {exporting ? "Exporting..." : "Export XLSX"}
      </button>
    </div>
  );
}
