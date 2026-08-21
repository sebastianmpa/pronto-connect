export type Locale = "es" | "en";

export type SessionId = string;
export type CustomerId = string;
export type ConversationId = string;
export type RagSessionId = string;

export interface SessionPayload {
  name: string;
  lastName: string;
  email: string;
  consent: boolean;
  locale: Locale;
  sessionId: SessionId;
}

export interface Customer {
  id: CustomerId;
  name: string;
  lastName: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

/** Some backends return [customer, created] instead of the bare customer. */
export type CreateCustomerResponseRaw = [Customer, boolean] | Customer;

export interface ConversationRequest {
  customer_id: CustomerId;
  conversation_id?: ConversationId;
  question: string;
  lang: string; // IETF BCP 47, e.g. "es-ES", "en-US"
  store_domain: string; // e.g. "www.echopartsonline.com"
}

export interface ConversationResponse {
  conversation_id: ConversationId;
  answer: string;
  /** If true, the UI should show the rating form automatically. */
  close_chat?: boolean;
  actions?: ChatAction[];
}

export interface RatingRequest {
  conversation_id: ConversationId;
  rating: "good" | "neutral" | "bad";
  comment?: string;
}

export interface RatingResponse {
  success: boolean;
}

export type ChatAction =
  | { type: "add_to_cart"; label: string; cartUrl: string }
  | { type: "download_pdf"; label: string; pdfUrl: string }
  | { type: "details"; label: string; url: string };

export interface ChatMessage {
  id: string;
  who: "user" | "assistant" | "system";
  text?: string;
  actions?: ChatAction[];
  createdAt?: string;
}

export interface HistoryResponse {
  messages: ChatMessage[];
  cursor?: string | null;
}

/** Compat with the older /chat and /chat/stream endpoints. */
export interface ChatRequest {
  sessionId: SessionId;
  message: string;
  locale?: Locale;
  metadata?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  cursor?: string | null;
}
