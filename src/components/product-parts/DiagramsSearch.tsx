import { useEffect, useState } from "react";
import productPartsService from "../../lib/product-parts/productPartsService";
import type { Brand, BrandModel } from "../../lib/product-parts/types";

const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const selectClass =
  "h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const inputClass =
  "h-9 w-64 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export default function DiagramsSearch() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  const [brandId, setBrandId] = useState("");
  const [query, setQuery] = useState("");

  const [brandName, setBrandName] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [models, setModels] = useState<BrandModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    productPartsService
      .getBrands()
      .then((data) => setBrands(data))
      .catch(() => setBrandsError("Could not load brands."))
      .finally(() => setBrandsLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      setError("Select a brand to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setModels(null);
    setSearched(true);

    try {
      const res = await productPartsService.getModelsByBrandId(brandId, query);
      setBrandName(res.brand);
      setTotalItems(res.totalItems);
      setModels(res.models ?? []);
    } catch {
      setError("Could not load diagrams for this brand. Please try again.");
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
          <label className="text-xs text-gray-500 dark:text-gray-400">Brand</label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            disabled={brandsLoading || !!brandsError}
            className={selectClass}
          >
            <option value="">
              {brandsLoading ? "Loading brands…" : brandsError ? "Could not load brands" : "Select a brand"}
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Model (optional)</label>
          <input
            type="text"
            placeholder="e.g. SRM-225"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !brandId}
          className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* ── Results ── */}
      <div className="p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {searched && !loading && !error && models && models.length > 0 && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {brandName} — {totalItems} model{totalItems === 1 ? "" : "s"}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Model</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Series</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Manuals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <svg className="mx-auto h-8 w-8 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </td>
                </tr>
              ) : !searched ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    Select a brand, optionally narrow by model, and search to find diagrams and manuals.
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    Try searching again.
                  </td>
                </tr>
              ) : !models || models.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    No models found{brandName ? ` for ${brandName}` : ""}
                    {query ? ` matching "${query}"` : ""}.
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr key={model.modelId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {model.modelName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {model.serie || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {model.type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {model.manuals.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {model.manuals.map((manual) => (
                            <a
                              key={manual.manualId}
                              href={manual.downloadLink}
                              target="_blank"
                              rel="noreferrer"
                              title={`Serial: ${manual.serial_number}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10 transition-colors"
                            >
                              <PdfIcon />
                              {manual.serial_number}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
