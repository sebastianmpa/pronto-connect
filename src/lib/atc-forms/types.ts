// ─── Query params ─────────────────────────────────────────────────────────────

export interface AtcFormsParams {
  page?: number;
  limit?: number;
  form_type?: string;
  customer_email?: string;
  order_number?: string;
  status?: string;
  /** ISO datetime, e.g. 2026-08-01T00:00:00Z */
  created_at_from?: string;
  /** ISO datetime, e.g. 2026-08-04T23:59:59Z */
  created_at_to?: string;
}

// ─── Client request ("atc form") record ────────────────────────────────────────

export const ATC_FORM_STATUSES = ["pending", "processed", "cancelled"] as const;
export type AtcFormStatus = (typeof ATC_FORM_STATUSES)[number];

export interface AtcFormItem {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  zoho_ticket_id: string;
  /** HTML — may contain unescaped customer-submitted text, sanitize before rendering. */
  ticket_text: string;
  created_at: string;
  form_type: string;
  form_sub_type: string | null;
  status: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface AtcFormsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: AtcFormItem[];
}
