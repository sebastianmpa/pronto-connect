export interface CreateAnsweredCallPayload {
  agentName: string;
  agentEmail: string;
  /** YYYY-MM-DD */
  callDateTime: string;
  extension: string;
  callId: string;
  customerPhoneNumber: string;
  contactReason: string;
  closureMethod: string;
  origin: "goto" | "zoho";
}

export interface AnsweredCallsParams {
  page: number;
  limit: number;
  agent_name?: string;
  agent_email?: string;
  extension?: string;
  call_datetime_from?: string;
  call_datetime_to?: string;
  call_id?: string;
  customer_phone_number?: string;
  order_number?: string;
  contact_reason?: string;
  closure_method?: string;
  origin?: "goto" | "zoho";
}

export interface AnsweredCallItem {
  id: string;
  agentName: string;
  agentEmail: string;
  extension: string;
  callDateTime: string;
  callId: string;
  customerPhoneNumber: string;
  orderNumber: string | null;
  contactReason: string;
  closureMethod: string;
  origin: "goto" | "zoho";
  createdAt: string;
  updatedAt: string;
}

export interface AnsweredCallsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: AnsweredCallItem[];
}
