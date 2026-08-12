import type { SmsLogItem } from "../sms-logs/types";
import type { EmailLogItem } from "../email-logs/types";
import type { TicketItem } from "../tickets/types";

export interface CustomersSearchParams {
  store_url: string;
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerItem {
  customerId: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface CustomersResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  source: "ideal" | "bigcommerce";
  items: CustomerItem[];
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface CustomerHistoryBreakdown {
  totalOrders: number;
  totalAmount: number;
}

export interface CustomerHistory {
  totalOrders: number;
  totalAmount: number;
  salesOrder?: CustomerHistoryBreakdown;
  salesInvoice?: CustomerHistoryBreakdown;
}

export interface CustomerStoreOrder {
  store: string;
  customer_id: string;
  latest_order_number: string;
  latest_order_date: string;
  latest_order_total: number;
}

export interface CustomerAtcForm {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  zoho_ticket_id: string | null;
  ticket_text: string;
  created_at: string;
  form_type: string;
  form_sub_type: string | null;
  status: string;
  updated_at: string | null;
  updated_by: string | null;
}

export interface CustomerCancellation {
  salesOrderId: number | string;
  orderNumber: string;
  orderDate: string;
  cancellationDate: string | null;
  reason: string | null;
  type: string | null;
  user: string | null;
}

export interface CustomerContact {
  id: number;
  order_id: number | string;
  po: string | null;
  contact_request_id: number | null;
  customer_id: number | string | null;
  order_date: string | null;
  reason: string | null;
  result: string | null;
  notes: string | null;
  contact_type: string | null;
  contact_datetime: string | null;
  order_value: number | string | null;
  calls: number;
  emails: number;
  text_messages: number;
  contact_user: string | null;
}

export interface CustomerDetail {
  customerId: string;
  store: string;
  source: "ideal" | "bigcommerce";
  matchType: string;
  profile: CustomerProfile;
  history: CustomerHistory;
  store_orders: CustomerStoreOrder[];
  sms_logs: SmsLogItem[];
  email_logs: EmailLogItem[];
  zoho_tickets: TicketItem[];
  cancellations: CustomerCancellation[];
  customer_contacts: CustomerContact[];
  atc_forms: CustomerAtcForm[];
}
