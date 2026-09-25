// ─── Record ──────────────────────────────────────────────────────────────────

export interface CustomerMessageDictionaryItem {
  id: string;
  order_status_display_name: string;
  order_status_internal_name: string;
  customer_message: string;
  dial_plan_message: string;
  step: number;
  description: string;
  sms_code: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Query params ────────────────────────────────────────────────────────────

export interface CustomerMessagesDictionaryParams {
  page?: number;
  limit?: number;
}

export interface CustomerMessagesDictionaryMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CustomerMessagesDictionaryResponse {
  items: CustomerMessageDictionaryItem[];
  meta: CustomerMessagesDictionaryMeta;
}

/**
 * GET /customer-messages-dictionary/atc/v0/paginated — the exact key holding
 * the array wasn't confirmed (could be `data` or `items`), so the service
 * normalizes both shapes into CustomerMessagesDictionaryResponse.
 */
export interface CustomerMessagesDictionaryApiResponse {
  data?: CustomerMessageDictionaryItem[];
  items?: CustomerMessageDictionaryItem[];
  meta?: Partial<CustomerMessagesDictionaryMeta> | null;
  [key: string]: unknown;
}

// ─── Create / update payload ────────────────────────────────────────────────

export interface CustomerMessageDictionaryPayload {
  order_status_display_name: string;
  order_status_internal_name: string;
  customer_message: string;
  dial_plan_message: string;
  step: number;
  description: string;
  sms_code: string;
}
