import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ordersService from "../../lib/orders/ordersService";
import type { BigCommerceOrderSearchItem, OrderSearchStore } from "../../lib/orders/types";

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currency(value: string, currencyCode = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);
}

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not load BigCommerce orders. Please try again.";
}

export default function BigCommerceOrderEditsList() {
  const [stores, setStores] = useState<OrderSearchStore[]>([]);
  const [storeUrl, setStoreUrl] = useState("");
  const [startDate, setStartDate] = useState(() => localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => localDate(new Date()));
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [items, setItems] = useState<BigCommerceOrderSearchItem[]>([]);
  const [cursor, setCursor] = useState(1);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [previousCursors, setPreviousCursors] = useState<number[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    ordersService.getOrderSearchStores().then((storeList) => {
      if (!active) return;
      setStores(storeList);
      setStoreUrl(storeList[0]?.urlStore ?? "");
    }).catch((cause) => { if (active) setError(errorMessage(cause)); }).finally(() => { if (active) setLoadingStores(false); });
    return () => { active = false; };
  }, []);

  async function searchOrders(nextPage = 1, stack = previousCursors) {
    if (!storeUrl) { setError("Select a BigCommerce store first."); return; }
    if (!startDate || !endDate || startDate > endDate) { setError("Choose a valid date range."); return; }
    if (!email.trim() && !name.trim()) { setError("Enter the customer's name or email to search."); return; }
    setLoading(true); setError(""); setHasSearched(true);
    try {
      const response = await ordersService.searchBigCommerceOrders({
        store_url: storeUrl,
        start_date: startDate,
        end_date: endDate,
        email: email.trim() || undefined,
        name: name.trim() || undefined,
        cursor: nextPage,
      });
      setItems(response.items);
      setCursor(nextPage);
      setNextCursor(response.nextCursor);
      setPreviousCursors(stack);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }

  function goNext() {
    if (nextCursor === null) return;
    setPreviousCursors([...previousCursors, cursor]);
    void searchOrders(nextCursor, [...previousCursors, cursor]);
  }

  function goPrevious() {
    const previous = previousCursors[previousCursors.length - 1];
    if (previous === undefined) return;
    void searchOrders(previous, previousCursors.slice(0, -1));
  }

  return <>
    <PageMeta title="BigCommerce Order Editing | Pronto Connect" description="Search BigCommerce orders to edit items and manage payment links" />
    <PageBreadcrumb pageTitle="BigCommerce Order Editing" />
    <main className="space-y-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <header><h1 className="text-xl font-semibold">BigCommerce orders</h1><p className="mt-1 text-sm text-gray-500">Search a specific BigCommerce store to review and edit its orders.</p></header>
      <form onSubmit={(event) => { event.preventDefault(); void searchOrders(1, []); }} className="grid gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:grid-cols-3 xl:grid-cols-6">
        <label className="text-sm font-medium xl:col-span-2">Store<select value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} disabled={loadingStores || !stores.length} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"><option value="">Select a store</option>{stores.map((store) => <option key={store.id} value={store.urlStore}>{store.name} ({store.prefijo})</option>)}</select></label>
        <label className="text-sm font-medium">Start date<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950" /></label>
        <label className="text-sm font-medium">End date<input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950" /></label>
        <label className="text-sm font-medium">Customer name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950" /></label>
        <label className="text-sm font-medium">Customer email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950" /></label>
        <div className="flex items-end xl:col-span-6"><button type="submit" disabled={loading || loadingStores || !storeUrl} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Searching…" : "Search BigCommerce orders"}</button></div>
      </form>
      {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.04]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Store</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Action</th></tr></thead><tbody>
        {items.map((order) => <tr key={`${order.store_url}:${order.order_id}`} className="border-t border-gray-100 dark:border-gray-800"><td className="px-4 py-3 font-semibold">#{order.order_number}</td><td className="px-4 py-3">{order.store_name}</td><td className="px-4 py-3"><div>{order.customer_name || "—"}</div><div className="text-xs text-gray-500">{order.customer_email || "—"}</div></td><td className="px-4 py-3">{new Date(order.date_created).toLocaleString()}</td><td className="px-4 py-3">{order.status}</td><td className="px-4 py-3">{currency(order.total_inc_tax, order.currency_code)}</td><td className="px-4 py-3"><Link to={`/bigcommerce-order-edits/${encodeURIComponent(order.order_number)}`} className="font-semibold text-brand-500 hover:underline">Review and edit</Link></td></tr>)}
        {!loading && !items.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">{hasSearched ? "No BigCommerce orders matched this search." : "Choose a store and search for BigCommerce orders."}</td></tr>}
      </tbody></table></div>
      <footer className="flex justify-end gap-2"><button type="button" onClick={goPrevious} disabled={!previousCursors.length || loading} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Previous</button><span className="px-2 py-2 text-sm text-gray-500">Page {cursor}</span><button type="button" onClick={goNext} disabled={nextCursor === null || loading} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Next</button></footer>
    </main>
  </>;
}
