import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import bigCommerceOrderEditingService from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingService";
import type { BigCommerceOrderEditApproval } from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingTypes";

export default function BigCommerceOrderEditApprovals() {
  const [approvals, setApprovals] = useState<BigCommerceOrderEditApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setApprovals(await bigCommerceOrderEditingService.listApprovals()); }
    catch { setError("Could not load pending approvals. Check your supervisor permissions and try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusyId(id); setError("");
    try { await bigCommerceOrderEditingService.decideApproval(id, decision); await load(); }
    catch (cause) { setError((cause as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not resolve this request."); }
    finally { setBusyId(""); }
  }

  return <>
    <PageMeta title="Order edit approvals | Pronto Connect" description="Review order item changes" />
    <PageBreadcrumb pageTitle="Order Edit Approvals" />
    <main className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">Pending BigCommerce order changes</h1><p className="mt-1 text-sm text-gray-500">Review requests for orders in picking before approving or rejecting.</p></div><button onClick={() => void load()} className="rounded-lg border px-3 py-2 text-sm">Refresh</button></div>
      {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="py-10 text-center text-sm text-gray-500">Loading requests…</p> : !approvals.length ? <p className="py-10 text-center text-sm text-gray-500">There are no pending requests.</p> : <div className="space-y-4">{approvals.map((approval) => <article key={approval.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <header className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold">Order <Link className="text-brand-500 underline" to={`/bigcommerce-order-edits/${encodeURIComponent(approval.orderNumber)}`}>#{approval.orderNumber}</Link></h2><p className="text-sm text-gray-500">Requested by {approval.requestedBy} · {new Date(approval.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span></header>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="py-2">SKU</th><th>Product</th><th>Current qty</th><th>Requested qty</th></tr></thead><tbody>{approval.changes.map((change, index) => { const isExistingLine = "order_product_id" in change; const item = isExistingLine ? approval.beforeValue.items.find((entry) => entry.order_product_id === change.order_product_id) : undefined; const requestedName = !isExistingLine ? change.product_name : undefined; const requestedSku = !isExistingLine ? change.sku : undefined; return <tr key={isExistingLine ? change.order_product_id : `new:${change.catalog_product_id}:${change.variant_id ?? "base"}:${index}`} className="border-b border-gray-100 dark:border-gray-800"><td className="py-2">{item?.sku || requestedSku || (isExistingLine ? change.order_product_id : "—")}</td><td>{item?.name || requestedName || (isExistingLine ? "Order item" : "New catalog item")}</td><td>{item?.quantity ?? (isExistingLine ? "—" : "New item")}</td><td>{change.quantity}</td></tr>; })}</tbody></table></div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Current total: {approval.beforeValue.totals.currency} {approval.beforeValue.totals.total.toFixed(2)}</p>
        <div className="mt-4 flex justify-end gap-2"><button disabled={busyId === approval.id} onClick={() => void decide(approval.id, "rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50">Reject</button><button disabled={busyId === approval.id} onClick={() => void decide(approval.id, "approved")} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve and apply</button></div>
      </article>)}</div>}
    </main>
  </>;
}
