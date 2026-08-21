import { useState } from "react";
import productPartsService from "../../lib/product-parts/productPartsService";
import type { ModelManuals } from "../../lib/product-parts/types";

const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ManualsSearch() {
  const [modelName, setModelName] = useState("");
  const [results, setResults] = useState<ModelManuals[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modelName.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await productPartsService.getManualsByModelName(trimmed);
      setResults(res ?? []);
      setSearchedFor(trimmed);
    } catch {
      setError("Could not load manuals for that model. Please try again.");
      setSearchedFor(trimmed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* ── Search ── */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Model name</label>
          <input
            type="text"
            placeholder="e.g. SRM-225"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="h-9 w-64 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !modelName.trim()}
          className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* ── Results ── */}
      <div className="p-4">
        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && !error && results && results.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No manuals found for &ldquo;{searchedFor}&rdquo;. Check the model name and try again.
          </p>
        )}

        {!loading && !error && results && results.length > 0 && (
          <div className="space-y-6">
            {results.map((group, i) => (
              <div key={`${group.name}-${i}`}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {group.name} — {group.models.length} manual{group.models.length === 1 ? "" : "s"}
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-white/[0.03]">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Serial number range</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {group.models.map((m, j) => (
                        <tr key={j} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {m.serial_number}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={m.serial_number_manual}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors"
                            >
                              <PdfIcon />
                              View manual
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !results && (
          <p className="py-10 text-center text-sm text-gray-400">
            Search a model name (e.g. SRM-225) to find its available manuals.
          </p>
        )}
      </div>
    </div>
  );
}
