import type { CustomerContactsFilterValues } from "../../lib/customer-contacts/types";

interface CustomerContactsFiltersProps {
  values: CustomerContactsFilterValues;
  limit: number;
  reasonOptions: string[];
  reasonsLoading: boolean;
  onChange: (
    name: keyof CustomerContactsFilterValues,
    value: string | boolean
  ) => void;
  onLimitChange: (limit: number) => void;
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

const inputClassName =
  "h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

const selectClassName =
  "h-9 w-full min-w-0 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-8 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function SelectArrow() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
      <svg
        className="stroke-current"
        width="12"
        height="8"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
          stroke=""
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function CustomerContactsFilters({
  values,
  limit,
  reasonOptions,
  reasonsLoading,
  onChange,
  onLimitChange,
  onSearch,
  onClear,
}: CustomerContactsFiltersProps) {
  return (
    <form
      onSubmit={onSearch}
      className="w-full min-w-0 rounded-t-xl border border-b-0 border-gray-100 px-4 py-4 dark:border-white/[0.05]"
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Customer ID
          </label>
          <input
            type="text"
            value={values.customer_id}
            onChange={(event) => onChange("customer_id", event.target.value)}
            placeholder="Customer ID"
            className={inputClassName}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Order ID
          </label>
          <input
            type="text"
            value={values.order_id}
            onChange={(event) => onChange("order_id", event.target.value)}
            placeholder="Order ID"
            className={inputClassName}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Reason
          </label>
          <div className="relative min-w-0">
            <select
              value={values.reason_id}
              onChange={(event) => onChange("reason_id", event.target.value)}
              disabled={reasonsLoading}
              className={`${selectClassName} disabled:cursor-wait disabled:opacity-60`}
            >
              <option value="" className="dark:bg-gray-900">
                {reasonsLoading ? "Loading reasons..." : "All reasons"}
              </option>
              {reasonOptions.map((reason) => (
                <option
                  key={reason}
                  value={reason}
                  className="dark:bg-gray-900"
                >
                  {reason}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Since
          </label>
          <input
            type="date"
            value={values.since}
            onChange={(event) => onChange("since", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Until
          </label>
          <input
            type="date"
            value={values.until}
            onChange={(event) => onChange("until", event.target.value)}
            className={inputClassName}
          />
        </div>

      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="h-9 rounded-lg bg-brand-500 px-5 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600"
          >
            Search
          </button>

          <button
            type="button"
            onClick={onClear}
            className="h-9 rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Clear filters
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative w-20">
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className={selectClassName}
            >
              {[10, 25, 50, 100].map((value) => (
                <option
                  key={value}
                  value={value}
                  className="dark:bg-gray-900"
                >
                  {value}
                </option>
              ))}
            </select>
            <SelectArrow />
          </div>
        </div>
      </div>
    </form>
  );
}
