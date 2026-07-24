import { useNavigate } from "react-router";
import { useGlobalSearch } from "../../context/GlobalSearchContext";
import OrderDetailView from "../orders/OrderDetailView";
import CustomerDetailView from "../customers/CustomerDetailView";

export default function GlobalSearchResult() {
  const navigate = useNavigate();
  const { query, result, loading, error, clear } = useGlobalSearch();

  const goToFullPage = () => {
    if (!result) return;
    if (result.result_type === "order") {
      navigate(`/orders/${result.result.order_number}`);
    } else {
      const qs = new URLSearchParams({
        store: result.result.store,
        email: result.result.profile.email,
        id: result.result.customerId,
      }).toString();
      navigate(`/customers/detail?${qs}`);
    }
    clear();
  };

  return (
    <div className="rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clear search
        </button>
        <p className="text-sm text-gray-400">
          Search results for &ldquo;<span className="text-gray-600 dark:text-gray-300">{query}</span>&rdquo;
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {!loading && !error && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {result.result_type === "order" ? "Order match" : "Customer match"}
            </span>
            <button
              onClick={goToFullPage}
              className="text-xs font-medium text-brand-500 hover:underline"
            >
              Open full page →
            </button>
          </div>

          {result.result_type === "order" ? (
            <OrderDetailView order={result.result} />
          ) : (
            <CustomerDetailView detail={result.result} />
          )}
        </div>
      )}

      {!loading && !error && !result && (
        <p className="py-10 text-center text-sm text-gray-400">No results found.</p>
      )}
    </div>
  );
}
