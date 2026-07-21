// ─── Query params ─────────────────────────────────────────────────────────────

export interface OrdersSearchParams {
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  limit?: number;
  page?: number;
  name?: string;
  phone?: string;
  order_number?: string;
  email?: string;
}

// ─── Single order item ────────────────────────────────────────────────────────

export interface OrderItem {
  salesOrderId: string | null;
  orderDate: string;
  reference?: string;
  order_number?: string;
  customerName: string;
  customerEmail: string;
  source: string;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface OrdersResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: OrderItem[];
}

// ─── Order detail ─────────────────────────────────────────────────────────────

export interface OrderDetailItem {
  id: number;
  product_id: number;
  variant_id: number;
  sku: string;
  name: string;
  url_thumbnail: string;
  quantity: number;
  item_status: string;
  unit_price: string;
  total_price: string;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export interface ShippingAddress {
  id: number;
  first_name: string;
  last_name: string;
  street_1: string;
  street_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  shipping_method: string;
  cost_inc_tax: string;
}

export interface OrderHeader {
  id: number;
  customer_id: number;
  date_created: string;
  date_modified: string;
  date_shipped: string;
  status: string;
  status_id: number;
  total_inc_tax: string;
  subtotal_inc_tax: string;
  shipping_cost_inc_tax: string;
  items_total: number;
  items_shipped: number;
  payment_method: string;
  payment_status: string;
  billing_address: BillingAddress;
  order_source: string;
  currency_code: string;
}

export interface CustomerServiceStatus {
  status: string;
  order_status_internal_name: string;
  customer_message: string;
  step: number;
  eta: string;
}

export interface OrderDetail {
  order_number: string;
  source: string;
  status_text: string;
  business_status: { name: string } | null;
  customer_service_status: CustomerServiceStatus | null;
  cancellation_request: unknown | null;
  header: OrderHeader;
  items: OrderDetailItem[];
  shipping_addresses: ShippingAddress[];
  shipments: unknown[];
}
