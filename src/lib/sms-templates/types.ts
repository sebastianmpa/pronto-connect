// ─── Query params ─────────────────────────────────────────────────────────────

export interface SmsTemplatesParams {
  page?: number;
  limit?: number;
  query?: string;
  active?: "yes" | "no";
}

// ─── Template record ───────────────────────────────────────────────────────────

export interface SmsTemplateItem {
  id: string;
  name: string;
  message_body: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  active: string;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface SmsTemplatesResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: SmsTemplateItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────

export interface CreateSmsTemplatePayload {
  id: string;
  name: string;
  message_body: string;
  active: "yes" | "no";
}

export interface UpdateSmsTemplatePayload {
  name?: string;
  message_body?: string;
  active?: "yes" | "no";
}
