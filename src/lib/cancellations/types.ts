// ─── Query params ─────────────────────────────────────────────────────────────

export interface CancellationsParams {
  page?: number;
  limit?: number;
  orderNumber?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  user?: string;
}

// ─── Single cancellation (list item) ─────────────────────────────────────────

export interface CancellationItem {
  salesOrderId: number;
  orderNumber: string;
  orderDate: string;
  cancellationDate: string;
  reason: string;
  type: string; // "Total" | "Partial"
  user: string;
  refundedprice?: number | string | null;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface CancellationsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: CancellationItem[];
}

// ─── Users / reasons lists ────────────────────────────────────────────────────

export interface CancellationUsersResponse {
  users: string[];
}

/**
 * Response used by the cancellation-reasons endpoint.
 * The current UI consumes the reason text values from this collection.
 */
export interface CancellationReasonsResponse {
  reasons: string[];
  [key: string]: unknown;
}

// ─── Cancellation detail ──────────────────────────────────────────────────────

export interface CancellationCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CancellationLineItem {
  mfr: string;
  partNumber: string;
  cancelledQuantity: number;
  refundedAmount: number;
}

export interface CancellationDetail extends CancellationItem {
  note: string;
  customer: CancellationCustomer;
  items: CancellationLineItem[];
}

// ─── Submitting a new cancellation ────────────────────────────────────────────

export interface CancellationRequestItem {
  mfr: string;
  partnumber: string;
  UnitsToRefund: number;
  /** Identifies the exact BigCommerce order line for a partial refund. */
  bigcommerce_order_product_id?: number;
}

interface CreateCancellationPayloadBase {
  OrderID: string;
  reason: string;
  note?: string;
  atcFormId?: number;
}

export type CreateCancellationPayload =
  | (CreateCancellationPayloadBase & {
      type: "Total";
      /** Total cancellations must not send line-item details. */
      details?: never;
    })
  | (CreateCancellationPayloadBase & {
      type: "Partial";
      /** Partial cancellations require the selected line-item details. */
      details: CancellationRequestItem[];
    });

export interface CreateCancellationResult {
  success: boolean;
  id?: number | null;
  soid?: number | null;
  OrderID: string;
  user: string;
  correlationId: string;
  source?: "ideal" | "bigcommerce";
  atc_form?: {
    status: string;
    updated?: boolean;
    source?: "ideal" | "bigcommerce";
  };
  refund?: {
    id: string | number | null;
    status: string | null;
  };
  bigcommerce?: {
    status: string | null;
    cancelled: "Y" | "N";
  };
  shipworks?: {
    orderId: string;
    localStatus: string;
    changed: boolean;
  };
}
