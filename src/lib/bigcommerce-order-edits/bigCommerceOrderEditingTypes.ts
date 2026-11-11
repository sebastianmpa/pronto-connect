export interface BigCommerceEditableOrderItem {
  order_product_id: string;
  product_id: number;
  variant_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
}

export interface BigCommerceCatalogProductOption {
  catalog_product_id: number;
  variant_id: number | null;
  name: string;
  sku: string;
  options_label: string;
  unit_price: number;
  availability: string;
  image_url: string | null;
  product_url: string | null;
  description: string;
  category_ids: number[];
}

export interface BigCommerceCatalogCategory {
  id: number;
  parent_id: number;
  name: string;
  is_visible: boolean;
  tree_id: number | null;
}

export type BigCommerceOrderItemChange =
  | { order_product_id: string; quantity: number }
  | {
      catalog_product_id: number;
      variant_id?: number;
      quantity: number;
      product_name?: string;
      sku?: string;
      unit_price?: number | null;
    };

export interface BigCommerceOrderEditTotals {
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  shipping: number | null;
  total: number;
  confirmed_paid: number;
  balance_due: number;
  credit_balance: number;
  currency: string;
}

export interface BigCommerceEditableOrder {
  order_number: string;
  order_id: string;
  status: string;
  editable: boolean;
  edit_policy: {
    edit: boolean;
    requiresApproval: boolean;
    payment: boolean;
    reason: string | null;
  };
  customer: Record<string, unknown>;
  items: BigCommerceEditableOrderItem[];
  payments: Array<{ id: string | null; type: string | null; status: string | null; amount: number | null; currency: string | null; created_at: string | null }>;
  totals: BigCommerceOrderEditTotals;
  payment_links: BigCommercePaymentLinkSummary[];
  active_payment_link: BigCommercePaymentLinkSummary | null;
}

export interface BigCommercePaymentLinkSummary {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "failed";
  expires_at: string;
  created_at?: string;
}

export interface BigCommerceOrderEditReason {
  id: string;
  name: string;
}

export interface BigCommerceOrderEditApproval {
  id: string;
  orderNumber: string;
  orderId: string;
  requestedBy: string;
  resolvedBy: string | null;
  status: string;
  reasonId: string;
  changes: BigCommerceOrderItemChange[];
  beforeValue: { items: BigCommerceEditableOrderItem[]; totals: BigCommerceOrderEditTotals };
  decisionNote: string | null;
  createdAt: string;
}

export interface BigCommerceOrderEditAuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  reasonId: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BigCommercePaymentLinkAccess {
  status: string;
  amount?: number;
  currency?: string;
  expires_at?: string;
}
