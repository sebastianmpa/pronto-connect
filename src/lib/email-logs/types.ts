export interface EmailLogsParams {
  page?: number;
  limit?: number;
  customer_email?: string;
  customer_name?: string;
  order_number?: string;
  order_status?: string;
}

export interface EmailLogItem {
  id: number;
  store_id: number;
  order_number: string;
  template_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  message_sent: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  order_status: string;
  sent_at: string;
}

export interface EmailLogsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: EmailLogItem[];
}
