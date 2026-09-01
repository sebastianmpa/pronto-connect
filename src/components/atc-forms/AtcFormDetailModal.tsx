import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import { ATC_FORM_STATUSES } from "../../lib/atc-forms/types";
import { statusBadgeClass } from "../../lib/atc-forms/statusBadge";
import type { AtcFormItem } from "../../lib/atc-forms/types";
import { formatDateTime } from "../../utils/date";
import OrderDetailLink from "../orders/OrderDetailLink";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "p", "a", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

interface AtcFormDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AtcFormItem | null;
  onStatusChanged: (id: number, status: string) => void;
}

export default function AtcFormDetailModal({
  isOpen,
  onClose,
  request,
  onStatusChanged,
}: AtcFormDetailModalProps) {
  const [status, setStatus] = useState<string>("pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !request) return;
    setStatus(request.status ?? "pending");
    setError(null);
  }, [isOpen, request]);

  if (!request) return null;

  const handleSaveStatus = async () => {
    setSaving(true);
    setError(null);
    try {
      await atcFormsService.updateStatus(request.id, status);
      onStatusChanged(request.id, status);
    } catch {
      setError("Could not update the status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[650px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      <div>
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2 pr-8">
          <div className="flex min-w-0 items-center gap-1">
            <h4 className="min-w-0 text-title-sm font-semibold text-gray-800 dark:text-white/90">
              {request.customer_name} — Order #{request.order_number}
            </h4>
            <OrderDetailLink orderNumber={request.order_number} />
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(request.status)}`}>
            {request.status ?? "pending"}
          </span>
        </div>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {request.form_type}
          {request.form_sub_type && ` · ${request.form_sub_type}`} · Zoho ticket #{request.zoho_ticket_id}
        </p>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer email</dt>
              <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90 lowercase break-all">{request.customer_email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Created</dt>
              <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">{formatDateTime(request.created_at)}</dd>
            </div>
            {request.updated_at && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last updated</dt>
                <dd className="mt-0.5 text-sm text-gray-800 dark:text-white/90">
                  {formatDateTime(request.updated_at)}
                  {request.updated_by && ` · ${request.updated_by}`}
                </dd>
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Request details</p>
            <div
              className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(request.ticket_text) }}
            />
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 text-sm capitalize text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                {ATC_FORM_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize dark:bg-gray-900">
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={saving || status === (request.status ?? "pending")}
                className="h-11 shrink-0 rounded-lg bg-brand-500 px-4 text-sm font-medium text-gray-900 hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Update status"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
