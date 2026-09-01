// ─── Query params ─────────────────────────────────────────────────────────────

export interface OrdersSearchParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
  mpn?: string | null;
  brand?: string | null;
  name: string;
  url_thumbnail: string;
  quantity: number;
  ALLOC?: number | string | null;
  BO?: number | string | null;
  item_status: string;
  cancelled?: string | null;
  refunded?: string | null;
  unit_price: string;
  total_price: string;
  raw?: {
    brand?: string;
    package?: string | number | null;
    package_info?: string | number | null;
    package_label?: string | number | null;
    pack?: string | number | null;
    pack_qty?: string | number | null;
    package_quantity?: string | number | null;
    [key: string]: unknown;
  };
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
  total_tax?: string;
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
  date?: string;
}

// ─── Client requests / activity included in order detail ─────────────────────

export interface OrderAtcForm {
  id: number;
  order_number: string;
  form_type: string;
  form_sub_type: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}
export interface OrderCancellation {
  salesOrderId: number | string;
  orderNumber: string;
  orderDate: string;
  cancellationDate: string | null;
  reason: string | null;
  type: string | null;
}
export interface OrderContactRequest {
  id: number;
  order_id: number | string;
  po?: string | null;
  customer_id?: number | string | null;
  customer_name?: string | null;
  phone?: string | null;
  email?: string | null;
  order_date?: string | null;
  reason?: string | null;
  notes?: string | null;
  contact_user?: string | null;
  date?: string | null;
}
export interface OrderCustomerContact {
  id: number;
  order_id: number | string;
  po: string | null;
  contact_request_id: number | null;
  customer_id?: number | string | null;
  order_date: string | null;
  reason: string | null;
  result: string | null;
  notes?: string | null;
  contact_type: string | null;
  contact_datetime: string | null;
  order_value?: number | string | null;
  calls: number;
  emails: number;
  text_messages: number;
  contact_user?: string | null;
}
export interface OrderSmsLog {
  id: number;
  order_number: string;
  status: string | null;
  sent_at: string | null;
  order_status: string | null;
  message?: string | null;
  phone?: string | null;
}

export interface OrderEmailLog {
  id: number;
  order_number: string;
  subject: string | null;
  status: string | null;
  sent_at: string | null;
  order_status: string | null;
  recipient?: string | null;
}


export interface OrderIdealInfo {
  order_id: number | string | null;
  notes: string | null;
  is_hold: boolean;
  hold_reason: string | null;
}

export interface OrderBigCommerceInfo {
  customer_note: string | null;
}

export interface OrderStore {
  description: string;
  url: string;
  logo_color: string | null;
  logo_white: string | null;

  // Store identifier used by GET /api/parts/detail-bc.
  // The API may expose the same identifier with any of these names.
  id?: number | string | null;
  storeid?: number | string | null;
  store_id?: number | string | null;
  // Invoice configuration returned by the order API. Its exact inner shape is
  // intentionally left open so the PDF can consume the backend value without
  // forcing a frontend-only schema.
  invoice?: unknown;

  // Backward-compatible fields used only if invoice does not provide them.
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface OrderDetail {
  order_number: string;
  storeid?: number | string | null;
  store?: OrderStore | null;
  source: string;
  status_text: string;
  cancelled?: string | null;
  refunded?: string | null;
  business_status: { name: string } | null;
  customer_service_status: CustomerServiceStatus | null;
  cancellation_request: unknown | null;
  header: OrderHeader;
  items: OrderDetailItem[];
  shipping_addresses: ShippingAddress[];
  shipments: unknown[];
  ideal?: OrderIdealInfo | null;
  bigcommerce?: OrderBigCommerceInfo | null;
  // The order detail endpoint now includes the most recent ATC/client activity.
  atc_forms?: OrderAtcForm[];
  cancellations?: OrderCancellation[];
  contact_requests?: OrderContactRequest[];
  customer_contacts?: OrderCustomerContact[];
  sms_logs?: OrderSmsLog[];
  email_logs?: OrderEmailLog[];
}

// ─── Revert cancellation ──────────────────────────────────────────────────────

export type RevertCancellationPayload =
  | {
      type: "Total";
    }
  | {
      type: "Partial";
      brand: string;
      mpn: string;
    };

export interface RevertCancellationResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

// ─── Order notes ──────────────────────────────────────────────────────────────

export interface AddOrderNoteResponse {
  success?: boolean;
  order_number?: string;
  ideal?: OrderIdealInfo | null;
  message?: string;
  [key: string]: unknown;
}

