import type { SmsLogItem } from "../sms-logs/types";
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

export interface CustomerDetail {
  customerId: string;
  store: string;
  source: "ideal" | "bigcommerce";
  matchType: string;
  profile: CustomerProfile;
  history: CustomerHistory;
  store_orders: CustomerStoreOrder[];
  sms_logs: SmsLogItem[];
  zoho_tickets: TicketItem[];
}
