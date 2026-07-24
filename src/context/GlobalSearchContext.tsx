import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import axios from "axios";
import globalSearchService from "../lib/globalSearch/globalSearchService";
import type { GlobalSearchResponse } from "../lib/globalSearch/types";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

type GlobalSearchContextType = {
  query: string;
  setQuery: (query: string) => void;
  result: GlobalSearchResponse | null;
  loading: boolean;
  error: string | null;
  /** True once the query is long enough to show a result panel in the main content area. */
  isActive: boolean;
  clear: () => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(
  undefined
);

export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within a GlobalSearchProvider");
  }
  return context;
};

export const GlobalSearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Navigating away (nav link, "Open full page", etc.) drops back to the normal page.
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setQuery("");
    }
  }, [location.pathname]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await globalSearchService.search(trimmed, controller.signal);
        setResult(res);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setResult(null);
        setError("No results found.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <GlobalSearchContext.Provider
      value={{
        query,
        setQuery,
        result,
        loading,
        error,
        isActive: query.trim().length >= MIN_QUERY_LENGTH,
        clear: () => setQuery(""),
      }}
    >
      {children}
    </GlobalSearchContext.Provider>
  );
};
