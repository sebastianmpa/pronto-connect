// ─── Query params ─────────────────────────────────────────────────────────────

export interface CancellationsParams {
  page?: number;
  limit?: number;
  orderNumber?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  user?: string;
}

// ─── Single cancellation (list item) ───────────────────────────────────────────

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

// ─── Paginated response ────────────────────────────────────────────────────────

export interface CancellationsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: CancellationItem[];
}

// ─── Users list (for the filter dropdown) ──────────────────────────────────────

export interface CancellationUsersResponse {
  users: string[];
}

// ─── Cancellation detail ───────────────────────────────────────────────────────

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

// ─── Submitting a new cancellation (from Order Detail) ─────────────────────────

export interface CancellationRequestItem {
  PartNumber: string;
  MFRID: string;
  UnitsToRefund: number;
}

export interface CreateCancellationPayload {
  OrderID: string;
  type: "Total" | "Partial";
  reason: string;
  details: CancellationRequestItem[];
}

export interface CreateCancellationResult {
  success: boolean;
  id: number;
  soid: number;
  OrderID: string;
  user: string;
  correlationId: string;
  shipworks?: {
    orderId: string;
    localStatus: string;
    changed: boolean;
  };
}
