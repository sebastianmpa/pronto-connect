import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import PaginationWithIcon from "../tables/DataTables/TableOne/PaginationWithIcon";
import customersService from "../../lib/customers/customersService";
import type { CustomerItem, CustomersSearchParams } from "../../lib/customers/types";

const STORES = [
  { label: "Echo Parts Online", value: "https://www.echopartsonline.com" },
  { label: "Briggs & Stratton Store", value: "https://www.briggsstrattonstore.com" },
  { label: "Hustler Lawnmower Parts", value: "https://www.hustlerlawnmowerparts.com" },
  { label: "Hustler Lawnmowers Parts", value: "https://hustler.lawnmowers.parts" },
  { label: "Husqv Parts", value: "https://www.husqvparts.com" },
  { label: "Hydro Gear Parts", value: "https://www.hydrogear.parts" },
  { label: "Small Engines Pro Dealer", value: "https://www.smallenginesprodealer.com" },
  { label: "Ideal", value: "ideal" },
];

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5C6.47715 5 2 12 2 12C2 12 6.47715 19 12 19C17.5228 19 22 12 22 12C22 12 17.5228 5 12 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const inputCls =
  "h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export default function CustomersTable() {
  const navigate = useNavigate();

  const [storeUrl, setStoreUrl] = useState(STORES[0].value);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<CustomerItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: CustomersSearchParams = {
          store_url: storeUrl,
          page,
          limit,
          ...(name  && { name }),
          ...(email && { email }),
          ...(phone && { phone }),
        };
        const res = await customersService.search(params);
        setItems(res.items);
        setTotalPages(res.totalPages);
        setTotalItems(res.totalItems);
        setCurrentPage(res.currentPage);
        setSource(res.source);
      } catch {
        setError("Failed to load customers. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [storeUrl, limit, name, email, phone]
  );

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const openDetail = (item: CustomerItem) => {
    const qs = new URLSearchParams({
      store: storeUrl,
      email: item.email,
      id: item.customerId,
    }).toString();
    navigate(`/customers/detail?${qs}`);
  };

  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(startIndex + items.length - 1, totalItems);

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:flex-wrap sm:items-end"
      >
        {/* Store selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Store <span className="text-error-500">*</span></label>
          <div className="relative">
            <select
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-8 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {STORES.map((s) => (
                <option key={s.value} value={s.value} className="dark:bg-gray-900">
                  {s.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="stroke-current" width="12" height="8" viewBox="0 0 16 16" fill="none">
                <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} w-40`} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} w-48`} />
        <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} w-36`} />

        {/* Limit */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 appearance-none rounded-lg border border-gray-300 bg-transparent py-1 pl-3 pr-7 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {[10, 25, 50, 100].map((v) => (
                <option key={v} value={v} className="dark:bg-gray-900">{v}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="stroke-current" width="12" height="8" viewBox="0 0 16 16" fill="none">
                <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <button type="submit" className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        {error && (
          <div className="m-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {["Customer ID", "Name", "Email", "Phone", "Source", ""].map((label) => (
                  <TableCell key={label} isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                    <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{label}</p>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No customers found for the selected filters.
                  </td>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.customerId}>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {item.customerId}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{item.name}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap lowercase">
                      {item.email}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-theme-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {item.phone || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        source === "ideal"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      }`}>
                        {source}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                      <button
                        onClick={() => openDetail(item)}
                        title="View customer detail"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                      >
                        <EyeIcon />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer */}
      {!loading && items.length > 0 && (
        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              Showing {startIndex} to {endIndex} of {totalItems} entries
            </p>
            <PaginationWithIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={(p) => fetchCustomers(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
