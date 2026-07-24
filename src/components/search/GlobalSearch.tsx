import { useRef } from "react";
import { useSidebar } from "../../context/SidebarContext";
import { useGlobalSearch } from "../../context/GlobalSearchContext";
import { SearchIcon } from "../../icons";

export default function GlobalSearch() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const { query, setQuery, loading, isActive, clear } = useGlobalSearch();
  const expanded = isExpanded || isHovered || isMobileOpen;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    if (!expanded) {
      setIsHovered(true);
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative mb-4">
      <span
        onClick={handleIconClick}
        className={`absolute inset-y-0 left-0 flex items-center text-gray-400 ${
          expanded ? "pl-3 pointer-events-none" : "w-full justify-center cursor-pointer"
        }`}
      >
        <SearchIcon className="size-4" />
      </span>

      {expanded && (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && clear()}
          placeholder="Search orders or customers…"
          className="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-8 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
      )}

      {!expanded && (
        <button
          type="button"
          onClick={handleIconClick}
          aria-label="Search"
          className="flex h-10 w-full items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
        />
      )}

      {expanded && loading && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </span>
      )}

      {expanded && !loading && isActive && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
