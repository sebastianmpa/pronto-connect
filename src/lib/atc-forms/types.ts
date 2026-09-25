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

export interface AtcFormTypesResponse {
  form_types: string[];
}

export type AtcFormSubmissionType = "claim" | "return" | "cancellation";

export interface AtcFormSubmissionResponse {
  success: boolean;
  id: number;
  zohoTicket: string | null;
  message?: string;
}

export interface Fac005ClaimConversionResponse {
  success: true;
  atcFormId: number;
  fac005ClaimId: number;
  caseNumber: string;
  imageSync: Fac005ImageSyncRunSummary;
}

export interface Fac005ImageSyncSummary {
  total: number;
  synced: number;
  failed: number;
  pending: number;
  processing: number;
}

export interface Fac005ImageSyncRunSummary {
  total: number;
  synced: number;
  failed: number;
  skipped: number;
}

export type AtcFormFac005Summary =
  | { converted: false }
  | {
      converted: true;
      claimId: number;
      caseNumber: string;
      status: string | null;
      imageSync: Fac005ImageSyncSummary;
    };

export interface Fac005ClaimImage {
  name: string;
  status: string;
  url: string | null;
  error: string | null;
  syncedAt: string | null;
}

export interface Fac005ClaimDetails {
  claimId: number;
  caseNumber: string;
  status: string | null;
  amountRefunded: number | string | null;
  comments: string | null;
  responsibleArea: string | null;
  currentArea: string | null;
  convertedAt: string | null;
  convertedBy: string | null;
  imageSync: Fac005ImageSyncSummary;
  images: Fac005ClaimImage[];
}

export interface Fac005ClaimDetailsResponse {
  success: true;
  atcFormId: number;
  converted: boolean;
  fac005: Fac005ClaimDetails | null;
}

export interface Fac005ImageRetryResponse {
  success: true;
  atcFormId: number;
  fac005ClaimId: number;
  caseNumber: string;
  imageSync: Fac005ImageSyncRunSummary;
}

// ─── Client request ("atc form") record ────────────────────────────────────────

export const ATC_FORM_STATUSES = ["pending", "processed", "cancelled"] as const;
export type AtcFormStatus = (typeof ATC_FORM_STATUSES)[number];

export interface AtcFormItem {
  /** atc_forms.id — this is the ID required by the status update endpoint. */
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  zoho_ticket_id: string | null;
  /** HTML — may contain unescaped customer-submitted text, sanitize before rendering. */
  ticket_text: string;
  created_at: string;
  form_type: string;
  form_sub_type: string | null;
  status: string | null;
  updated_at: string | null;
  updated_by: string | null;
  detail?: Record<string, unknown> | null;
  /** FAC005 conversion summary, supplied by the paginated endpoint. */
  fac005?: AtcFormFac005Summary;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface AtcFormsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: AtcFormItem[];
}
