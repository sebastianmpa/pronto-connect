// ─── Query params ─────────────────────────────────────────────────────────────

export interface EmailTemplatesParams {
  page?: number;
  limit?: number;
  query?: string;
  sms_template_id?: string;
  active?: "Y" | "N";
}

// ─── Template record ───────────────────────────────────────────────────────────

export interface EmailTemplateItem {
  id: number;
  sms_template_id: string;
  name: string;
  subject: string;
  html_body: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  active: string;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface EmailTemplatesResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: EmailTemplateItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────

export interface CreateEmailTemplatePayload {
  sms_template_id: string;
  name: string;
  subject: string;
  html_body: string;
  active: "Y" | "N";
}

export interface UpdateEmailTemplatePayload {
  name?: string;
  subject?: string;
  html_body?: string;
  active?: "Y" | "N";
}
