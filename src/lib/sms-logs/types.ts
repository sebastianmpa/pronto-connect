// ─── Query params ─────────────────────────────────────────────────────────────

export interface SmsLogsParams {
  page?: number;
  limit?: number;
  order_status?: string;
  customer_email?: string;
  order_number?: string;
  phone_number?: string;
  status?: string;
}

// ─── Single SMS log ───────────────────────────────────────────────────────────

export interface SmsLogItem {
  id: number;
  store_id: number;
  order_number: string;
  template_id: string;
  phone_number: string;
  message_sent: string;
  status: "SENT" | "FAILED" | string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string;
  customer_name: string;
  customer_email: string;
  order_status: string;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface SmsLogsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: SmsLogItem[];
}
