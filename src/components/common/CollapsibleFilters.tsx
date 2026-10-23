import { useId, useState, type ReactNode } from "react";
import ComponentCard from "./ComponentCard";

interface CollapsibleFiltersProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function CollapsibleFilters({
  children,
  title = "Filtros",
  description,
}: CollapsibleFiltersProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 3.5h15l-5.75 6.7v4.55l-3.5 1.75V10.2L2.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filtros
          <svg aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div id={panelId}>
          <ComponentCard title={title} desc={description}>
            {children}
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
