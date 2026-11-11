import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import bigCommerceOrderEditingService from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingService";
import type { BigCommerceOrderEditReason } from "../../lib/bigcommerce-order-edits/bigCommerceOrderEditingTypes";

function responseMessage(error: unknown) {
  const requestError = error as {
    message?: string;
    response?: { status?: number; data?: { message?: string; errors?: string[] } | string };
  };
  const responseData = requestError.response?.data;
  if (typeof responseData === "string" && responseData.trim()) return responseData;
  if (responseData && typeof responseData === "object") {
    if (responseData.message) return responseData.message;
    if (responseData.errors?.length) return responseData.errors.join(" ");
  }
  if (requestError.response?.status) return `Request failed with HTTP ${requestError.response.status}.`;
  return requestError.message;
}

export default function BigCommerceOrderEditReasons() {
  const [reasons, setReasons] = useState<BigCommerceOrderEditReason[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReasons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReasons(await bigCommerceOrderEditingService.getReasons());
    } catch (cause) {
      setError(responseMessage(cause) || "Could not load reasons. This page requires the order edit reason management permission.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReasons(); }, [loadReasons]);

  async function addReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await bigCommerceOrderEditingService.createReason(normalizedName);
      setName("");
      setNotice("Reason added. It is now available when editing BigCommerce orders.");
      await loadReasons();
    } catch (cause) {
      setError(responseMessage(cause) || "Could not add this reason.");
    } finally {
      setSaving(false);
    }
  }

  async function disableReason(reason: BigCommerceOrderEditReason) {
    if (!window.confirm(`Deactivate the reason “${reason.name}”? Existing audit records will remain unchanged.`)) return;
    setError("");
    setNotice("");
    try {
      await bigCommerceOrderEditingService.disableReason(reason.id);
      setNotice(`Reason “${reason.name}” deactivated.`);
      await loadReasons();
    } catch (cause) {
      setError(responseMessage(cause) || "Could not deactivate this reason.");
    }
  }

  return <>
    <PageMeta title="BigCommerce Order Edit Reasons | Pronto Connect" description="Manage reasons for BigCommerce order changes" />
    <PageBreadcrumb pageTitle="BigCommerce Order Edit Reasons" />
    <main className="space-y-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <header>
        <h1 className="text-xl font-semibold">Order change reasons</h1>
        <p className="mt-1 text-sm text-gray-500">Manage the reasons agents must select when changing BigCommerce order quantities.</p>
      </header>
      <form onSubmit={addReason} className="flex max-w-2xl flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <label className="min-w-64 flex-1 text-sm font-medium">New reason
          <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="For example: Customer requested item removal" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-950" />
        </label>
        <button type="submit" disabled={saving || !name.trim()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Adding…" : "Add reason"}</button>
      </form>
      {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</div>}
      <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <h2 className="border-b border-gray-200 px-4 py-3 font-semibold dark:border-gray-800">Active reasons</h2>
        {loading ? <p className="p-4 text-sm text-gray-500">Loading reasons…</p> : !reasons.length ? <p className="p-4 text-sm text-gray-500">No active reasons yet. Add one above before editing an order.</p> : <ul className="divide-y divide-gray-100 dark:divide-gray-800">{reasons.map((reason) => <li key={reason.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span>{reason.name}</span><button type="button" onClick={() => void disableReason(reason)} className="text-red-600 hover:underline">Deactivate</button></li>)}</ul>}
      </section>
    </main>
  </>;
}
