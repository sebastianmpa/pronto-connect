import { useCallback, useEffect, useRef, useState } from "react";
import bigCommerceOrderEditingService from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingService";
import type { BigCommerceCatalogCategory, BigCommerceCatalogProductOption, BigCommerceEditableOrder, BigCommerceOrderEditAuditEntry, BigCommerceOrderEditReason, BigCommerceOrderItemChange } from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingTypes";

function money(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function readableError(error: unknown) {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || "The order edit request could not be completed.";
}

export default function BigCommerceOrderEditingWorkspace({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<BigCommerceEditableOrder | null>(null);
  const [reasons, setReasons] = useState<BigCommerceOrderEditReason[]>([]);
  const [audit, setAudit] = useState<BigCommerceOrderEditAuditEntry[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<BigCommerceCatalogProductOption[]>([]);
  const [addedProducts, setAddedProducts] = useState<Array<BigCommerceCatalogProductOption & { quantity: number }>>([]);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogSearched, setCatalogSearched] = useState(false);
  const [categories, setCategories] = useState<BigCommerceCatalogCategory[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesBusy, setCategoriesBusy] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [viewingProduct, setViewingProduct] = useState<BigCommerceCatalogProductOption | null>(null);
  const catalogSearchIdRef = useRef(0);
  const [reasonId, setReasonId] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const startingEditRef = useRef(false);

  const refresh = useCallback(async () => {
    const [nextOrder, nextReasons, nextAudit] = await Promise.all([
      bigCommerceOrderEditingService.getOrder(orderNumber),
      bigCommerceOrderEditingService.getReasons(),
      bigCommerceOrderEditingService.getAudit(orderNumber),
    ]);
    setOrder(nextOrder);
    setReasons(nextReasons);
    setAudit(nextAudit);
    setQuantities(Object.fromEntries(nextOrder.items.map((item) => [item.order_product_id, item.quantity])));
  }, [orderNumber]);

  useEffect(() => {
    let active = true;
    Promise.all([
      bigCommerceOrderEditingService.getOrder(orderNumber),
      bigCommerceOrderEditingService.getReasons(),
      bigCommerceOrderEditingService.getAudit(orderNumber),
    ]).then(([nextOrder, nextReasons, nextAudit]) => {
      if (!active) return;
      setOrder(nextOrder);
      setReasons(nextReasons);
      setAudit(nextAudit);
      setQuantities(Object.fromEntries(nextOrder.items.map((item) => [item.order_product_id, item.quantity])));
    }).catch((cause) => { if (active) setError(readableError(cause)); });
    return () => { active = false; };
  }, [orderNumber]);

  useEffect(() => {
    if (!editing) return;
    const timer = window.setInterval(() => {
      bigCommerceOrderEditingService.renewSession(orderNumber).catch((cause) => {
        setError(readableError(cause));
        setEditing(false);
      });
    }, 4 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [editing, orderNumber]);

  useEffect(() => {
    if (!editing) return;
    return () => { void bigCommerceOrderEditingService.releaseSession(orderNumber).catch(() => {}); };
  }, [editing, orderNumber]);

  async function startEditing() {
    if (startingEditRef.current) return;
    startingEditRef.current = true;
    setError(""); setNotice(""); setBusy(true);
    try {
      await bigCommerceOrderEditingService.acquireSession(orderNumber);
      setAddedProducts([]); setCatalogResults([]); setCatalogQuery(""); setSelectedCategoryId(null); setCatalogSearched(false);
      setEditing(true);
      setNotice("This order is reserved for you for 10 minutes. The reservation renews while you edit.");
    } catch (cause) { setError(readableError(cause)); }
    finally { startingEditRef.current = false; setBusy(false); }
  }

  async function stopEditing() {
    setBusy(true);
    try { await bigCommerceOrderEditingService.releaseSession(orderNumber); }
    catch (cause) { setError(readableError(cause)); }
    setEditing(false); setBusy(false);
  }

  async function submitChanges() {
    if (!order || !reasonId) { setError("Select a change reason before continuing."); return; }
    const items: BigCommerceOrderItemChange[] = [
      ...order.items.map((item) => ({ order_product_id: item.order_product_id, quantity: quantities[item.order_product_id] ?? item.quantity })),
      ...addedProducts.map((item) => ({
        catalog_product_id: item.catalog_product_id,
        ...(item.variant_id ? { variant_id: item.variant_id } : {}),
        quantity: item.quantity,
      })),
    ];
    setBusy(true); setError(""); setNotice("");
    try {
      if (order.edit_policy.requiresApproval) {
        await bigCommerceOrderEditingService.requestApproval(orderNumber, reasonId, items);
        setNotice("The change request was sent to a supervisor.");
      } else {
        const result = await bigCommerceOrderEditingService.saveItems(orderNumber, reasonId, items) as { balance_review_required?: boolean };
        setNotice(result.balance_review_required ? "Order updated. The resulting credit balance requires manual review." : "Order updated and totals recalculated by BigCommerce.");
      }
      setEditing(false);
      setAddedProducts([]); setCatalogResults([]); setCatalogQuery("");
      await refresh();
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!editing) return;
    const query = catalogQuery.trim();
    const searchId = ++catalogSearchIdRef.current;
    if (!query && !selectedCategoryId) {
      setCatalogResults([]); setCatalogBusy(false); setCatalogSearched(false);
      return;
    }
    setError(""); setCatalogBusy(true); setCatalogSearched(false);
    const timer = window.setTimeout(async () => {
      try {
        const results = await bigCommerceOrderEditingService.searchProducts(orderNumber, query, selectedCategoryId);
        if (catalogSearchIdRef.current === searchId) { setCatalogResults(results); setCatalogSearched(true); }
      } catch (cause) {
        if (catalogSearchIdRef.current === searchId) { setCatalogResults([]); setError(readableError(cause)); setCatalogSearched(false); }
      } finally {
        if (catalogSearchIdRef.current === searchId) setCatalogBusy(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [editing, catalogQuery, selectedCategoryId, orderNumber]);

  async function toggleCategories() {
    const opening = !categoriesOpen;
    setCategoriesOpen(opening);
    if (!opening || categories.length || categoriesBusy) return;
    setCategoriesBusy(true);
    try { setCategories(await bigCommerceOrderEditingService.getProductCategories(orderNumber)); }
    catch (cause) { setError(readableError(cause)); }
    finally { setCategoriesBusy(false); }
  }

  function categoryDepth(category: BigCommerceCatalogCategory) {
    let depth = 0;
    let parentId = category.parent_id;
    const seen = new Set<number>([category.id]);
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId); depth += 1;
      parentId = categories.find((entry) => entry.id === parentId)?.parent_id || 0;
    }
    return depth;
  }

  function addCatalogProduct(product: BigCommerceCatalogProductOption) {
    if (addedProducts.some((item) => item.catalog_product_id === product.catalog_product_id && item.variant_id === product.variant_id)) return;
    setAddedProducts((current) => [...current, { ...product, quantity: 1 }]);
    setCatalogResults((current) => current.filter((item) => !(item.catalog_product_id === product.catalog_product_id && item.variant_id === product.variant_id)));
  }

  async function copyPaymentLink() {
    if (!order) return;
    setBusy(true); setError("");
    try {
      const link = await bigCommerceOrderEditingService.createPaymentLink(orderNumber);
      setPaymentLinkUrl(link.url);
      try {
        await navigator.clipboard.writeText(link.url);
        setNotice("Payment link copied. Share it with the customer.");
      } catch {
        setNotice("Payment link created. Copy the URL below to share it with the customer.");
      }
      await refresh();
    } catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  async function cancelPaymentLink(id: string) {
    setBusy(true); setError("");
    try { await bigCommerceOrderEditingService.cancelPaymentLink(orderNumber, id); setNotice("Payment link cancelled."); await refresh(); }
    catch (cause) { setError(readableError(cause)); }
    finally { setBusy(false); }
  }

  if (error && !order) return <section className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Could not load order editing: {error}</section>;
  if (!order) return <section className="mt-8 rounded-xl border border-gray-200 p-5 text-sm text-gray-500">Loading order editing details…</section>;

  const currency = order.totals.currency || "USD";
  const totals = [
    ["Subtotal", order.totals.subtotal], ["Discount", order.totals.discount], ["Tax", order.totals.tax],
    ["Shipping", order.totals.shipping], ["Order total", order.totals.total],
    ["Confirmed payments", order.totals.confirmed_paid], ["Balance due", order.totals.balance_due],
  ] as const;

  return <section className="mt-8 space-y-5 rounded-xl border border-gray-200 p-5 dark:border-gray-800">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">BigCommerce order changes and payment</h2><p className="text-sm text-gray-500">Status: {order.status}</p></div>
      <div className="flex flex-wrap gap-2">
        {order.edit_policy.requiresApproval && <a href="/bigcommerce-order-edit-approvals" className="rounded-lg border px-3 py-2 text-sm">Supervisor approvals</a>}
        {!editing && (order.edit_policy.edit || order.edit_policy.requiresApproval) && <button disabled={busy} onClick={startEditing} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Edit items</button>}
        {editing && <><button disabled={busy || !reasonId} onClick={submitChanges} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{order.edit_policy.requiresApproval ? "Request supervisor approval" : "Save changes"}</button><button disabled={busy} onClick={stopEditing} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></>}
      </div>
    </header>

    {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</div>}
    {paymentLinkUrl && <div className="flex flex-wrap gap-2"><input aria-label="Customer payment link" readOnly value={paymentLinkUrl} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /><button onClick={() => void navigator.clipboard.writeText(paymentLinkUrl)} className="rounded-lg border px-3 py-2 text-sm">Copy URL</button></div>}
    {!order.edit_policy.edit && !order.edit_policy.requiresApproval && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Item changes are unavailable for this order state ({order.edit_policy.reason}).</p>}

    <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-3">Item</th><th>SKU</th><th>Unit price</th><th>Quantity</th><th>Line total</th></tr></thead><tbody>
      {order.items.map((item) => <tr key={item.order_product_id} className="border-b border-gray-100 dark:border-gray-800"><td className="py-3 font-medium">{item.name}</td><td>{item.sku || "—"}</td><td>{money(item.unit_price, currency)}</td><td>{editing ? <input aria-label={`Quantity for ${item.name}`} type="number" min={0} step={1} value={quantities[item.order_product_id] ?? item.quantity} onChange={(event) => setQuantities({ ...quantities, [item.order_product_id]: Math.max(0, Number(event.target.value)) })} className="w-20 rounded border px-2 py-1 dark:bg-gray-900" /> : item.quantity}</td><td>{money(item.total_price, currency)}</td></tr>)}
    </tbody></table></div>
    {editing && <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="font-semibold">Add products from BigCommerce</h3>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search BigCommerce products" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search by product name, SKU, etc." className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        <button type="button" onClick={() => void toggleCategories()} className="rounded-lg border px-4 py-2 text-sm">{categoriesOpen ? "Hide categories" : "Browse categories"}</button>
      </div>
      {categoriesOpen && <div className="max-w-xl space-y-2 rounded-lg border p-3 dark:border-gray-800"><label className="block text-sm font-medium">Filter by category<select value={selectedCategoryId ?? ""} onChange={(event) => setSelectedCategoryId(event.target.value ? Number(event.target.value) : null)} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{`${"— ".repeat(categoryDepth(category))}${category.name}`}</option>)}</select></label>{categoriesBusy && <p className="text-xs text-gray-500">Loading categories…</p>}</div>}
      {catalogBusy && <p role="status" className="text-sm text-gray-500">Searching BigCommerce products…</p>}
      {catalogResults.length > 0 && <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border dark:divide-gray-800 dark:border-gray-800">{catalogResults.map((product) => <li key={`${product.catalog_product_id}:${product.variant_id ?? "base"}`} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"><span className="flex min-w-0 items-center gap-3">{product.image_url ? <img src={product.image_url} alt="" className="h-12 w-12 rounded object-contain" /> : <span className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-400">□</span>}<span className="min-w-0"><strong>{product.name}</strong>{product.options_label && ` · ${product.options_label}`}<span className="block text-gray-500">SKU: {product.sku || "—"} · {money(product.unit_price, currency)}</span></span></span><span className="flex gap-3">{product.product_url ? <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">View product</a> : <button type="button" onClick={() => setViewingProduct(product)} className="text-brand-500 hover:underline">View product</button>}<button type="button" onClick={() => addCatalogProduct(product)} className="rounded-lg border px-3 py-1.5">Add</button></span></li>)}</ul>}
      {catalogSearched && !catalogBusy && !catalogResults.length && <p className="text-sm text-gray-500">No products found for this search or category.</p>}
      {addedProducts.length > 0 && <div className="space-y-2"><h4 className="text-sm font-medium">Items to add</h4>{addedProducts.map((product) => <div key={`new:${product.catalog_product_id}:${product.variant_id ?? "base"}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.04]"><span className="flex min-w-0 items-center gap-3">{product.image_url ? <img src={product.image_url} alt="" className="h-14 w-14 rounded object-contain" /> : <span className="flex h-14 w-14 items-center justify-center rounded bg-white text-gray-400">□</span>}<span><strong>{product.name}</strong>{product.options_label && ` · ${product.options_label}`}<span className="block text-gray-500">SKU: {product.sku || "—"} · {money(product.unit_price, currency)}</span></span></span><span className="flex items-center gap-2"><label>Qty <input aria-label={`Quantity to add for ${product.name}`} type="number" min={1} step={1} value={product.quantity} onChange={(event) => setAddedProducts((items) => items.map((item) => item.catalog_product_id === product.catalog_product_id && item.variant_id === product.variant_id ? { ...item, quantity: Math.max(1, Number(event.target.value)) } : item))} className="w-20 rounded border px-2 py-1 dark:bg-gray-900" /></label><button type="button" onClick={() => setAddedProducts((items) => items.filter((item) => !(item.catalog_product_id === product.catalog_product_id && item.variant_id === product.variant_id)))} className="text-red-600">Remove</button></span></div>)}</div>}
      <p className="text-xs text-gray-500">BigCommerce recalculates totals after saving. Changing or adding items can remove discounts or promotions on affected lines.</p>
    </section>}
    {viewingProduct && <div role="dialog" aria-modal="true" aria-label="Product details" className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingProduct(null)}><article className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold">{viewingProduct.name}</h3><button type="button" aria-label="Close product details" onClick={() => setViewingProduct(null)} className="rounded border px-3 py-1">×</button></div><div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">{viewingProduct.image_url ? <img src={viewingProduct.image_url} alt={viewingProduct.name} className="max-h-48 w-full rounded object-contain" /> : <div className="flex h-40 items-center justify-center rounded bg-gray-100 text-gray-400">No image available</div>}<div className="space-y-2 text-sm"><p><strong>SKU:</strong> {viewingProduct.sku || "—"}</p><p><strong>Variant:</strong> {viewingProduct.options_label || "Base product"}</p><p><strong>Price:</strong> {money(viewingProduct.unit_price, currency)}</p><p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{viewingProduct.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "No product description."}</p></div></div><div className="mt-5 flex justify-end"><button type="button" onClick={() => { addCatalogProduct(viewingProduct); setViewingProduct(null); }} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Add product</button></div></article></div>}
    {editing && <label className="block max-w-xl text-sm font-medium">Reason for change<select value={reasonId} onChange={(event) => setReasonId(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"><option value="">Choose a reason</option>{reasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}</select></label>}

    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{totals.map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 font-semibold">{money(value, currency)}</p></div>)}</div>
    {editing && <p className="text-xs text-gray-500">Final totals and payment balance are recalculated by BigCommerce after the changes are saved.</p>}
    {order.totals.credit_balance > 0 && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Credit balance {money(order.totals.credit_balance, currency)}. Review manually; no refund is issued automatically.</p>}

    <div className="border-t pt-4 dark:border-gray-800"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Payment links</h3><button onClick={copyPaymentLink} disabled={busy || !order.edit_policy.payment || order.totals.balance_due <= 0} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Create and copy link</button></div><div className="mt-2 space-y-2">{order.payment_links.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.04]"><span>{money(link.amount, link.currency)} · {link.status} · expires {new Date(link.expires_at).toLocaleString()}</span>{link.status === "pending" && <button disabled={busy} onClick={() => cancelPaymentLink(link.id)} className="text-red-600">Cancel link</button>}</div>)}{!order.payment_links.length && <p className="text-sm text-gray-500">No payment links have been created.</p>}</div></div>

    <div className="border-t pt-4 dark:border-gray-800"><h3 className="font-semibold">Change history</h3><ol className="mt-2 space-y-2">{audit.slice(0, 10).map((entry) => <li key={entry.id} className="text-sm"><span className="font-medium">{entry.action.replace(/_/g, " ")}</span><span className="text-gray-500"> — {entry.actorEmail} · {new Date(entry.createdAt).toLocaleString()}</span></li>)}{!audit.length && <li className="text-sm text-gray-500">No changes recorded.</li>}</ol></div>
  </section>;
}
