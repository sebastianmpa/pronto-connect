// Query parameters supported by GET /contact-requests/atc/v0.
export interface CustomerContactsParams {
  limit: number;
  offset: number;
  since?: string;
  until?: string;
  customer_id?: string;
  order_id?: string;
  reason_id?: string;
}

export type ContactRequestIdValue = number | string | null | undefined;

/**
 * Item returned by GET /contact-requests/atc/v0.
 *
 * Important backend contract (2026-08-11):
 * - the old generic `id` field is no longer returned by the listing;
 * - `order_id` is the canonical order identifier used by create/contact endpoints;
 * - `order_number` is the visible/business order number and is also used as PO
 *   when creating a contact request;
 * - `contact_request_id` identifies an existing contact request when present;
 * - `sources` only indicates where the unified row was found.
 */
export interface CustomerContactItem {
  type: string;
  sources?: string[];
  order_id: number | string;
  order_number: number | string | null;
  contact_request_id?: ContactRequestIdValue;
  customer_id: number | string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  order_date: string | null;
  reason?: string | null;
  onhold_reason: string | null;
  last_contacted: string | null;
  contact_count: number;
  notes: string | null;
  po?: string | null;
}

export interface CustomerContactsMeta {
  total: number;
  limit: number;
  offset: number;
  partial: boolean;
  unavailable_sources: string[];
}

export interface CustomerContactsResponse {
  items: CustomerContactItem[];
  meta: CustomerContactsMeta;
}

export interface CustomerContactsFilterValues {
  since: string;
  until: string;
  customer_id: string;
  order_id: string;
  reason_id: string;
}

export type CustomerContactType = "Call" | "Email" | "Text Message";

export interface CustomerContactHistory {
  id: number;
  contact_request_id: number;
  result: string | null;
  notes: string | null;
  contact_type: CustomerContactType | string | null;
  contact_datetime: string | null;
  order_value: number | null;
  calls: number;
  emails: number;
  text_messages: number;
  contact_user: string | null;
}

// Response returned by GET /contact-requests/atc/v0/:contactRequestId.
export interface CustomerContactDetail {
  id: number;
  order_id: number | string;
  po: string | null;
  customer_id: number | string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  order_date: string | null;
  reason: string | null;
  notes: string | null;
  contact_user: string | null;
  date: string | null;
  customer_contact: CustomerContactHistory | null;
}

// Payload for POST /contact-requests/atc/v0.
export interface SaveCustomerContactRequestPayload {
  order_id: number;
  contact_request_id?: number;
  po: string;
  customer_id: number;
  order_date: string;
  notes: string;
  reason: string;
}

export interface SaveCustomerContactRequestResponse {
  id?: number | string;
  [key: string]: unknown;
}

// Payload documented for POST /customer-orders/atc/v0/:orderId/contact.
export interface MarkCustomerContactPayload {
  contact_type: CustomerContactType;
  contact_datetime: string;
  result: string;
  notes: string;
}

export interface CustomerContactRecord {
  id: number;
  order_id?: number | string;
  po?: string | null;
  contact_request_id: number;
  customer_id?: number | string;
  order_date?: string | null;
  reason?: string | null;
  result: string;
  notes: string;
  contact_type: CustomerContactType | string;
  contact_datetime: string;
  order_value: number | null;
  calls: number;
  emails: number;
  text_messages: number;
  contact_user: string;
}

export interface MarkCustomerContactResponse {
  status: string;
  contact: CustomerContactRecord;
}
