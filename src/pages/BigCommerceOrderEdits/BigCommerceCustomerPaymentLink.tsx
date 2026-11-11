import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import bigCommerceOrderEditingService from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingService";
import type { BigCommercePaymentLinkAccess } from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingTypes";

const statusLabels: Record<string, string> = { pending: "Payment pending", paid: "Paid", expired: "Link expired", cancelled: "Link cancelled", failed: "Payment failed" };

export default function BigCommerceCustomerPaymentLink() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [link, setLink] = useState<BigCommercePaymentLinkAccess | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("This payment link is incomplete."); return; }
    bigCommerceOrderEditingService.getPublicPaymentLink(token).then(setLink).catch(() => setError("This payment link is invalid or no longer available."));
  }, [token]);

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950"><section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Pronto Mowers</p><h1 className="mt-2 text-2xl font-semibold">BigCommerce order payment</h1>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {!link && !error && <p className="mt-5 text-sm text-gray-500">Checking payment link…</p>}
    {link && <><p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm dark:bg-white/[0.04]">Status: <strong>{statusLabels[link.status] || link.status}</strong></p>{link.amount !== undefined && <p className="mt-4 text-3xl font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: link.currency || "USD" }).format(link.amount)}</p>}{link.expires_at && <p className="mt-2 text-sm text-gray-500">Expires {new Date(link.expires_at).toLocaleString()}</p>}
      {link.status === "pending" && <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Online payment is not available yet. Please contact customer service to complete payment. This link will not create a duplicate order.</p>}</>}
  </section></main>;
}
