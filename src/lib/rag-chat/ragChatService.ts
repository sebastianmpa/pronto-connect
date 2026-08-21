import { ragChatApiClient } from "../apiClient";
import type {
  SessionPayload,
  ChatRequest,
  ChatResponse,
  HistoryResponse,
  ConversationRequest,
  ConversationResponse,
  Customer,
  RatingRequest,
  RatingResponse,
} from "./types";

const envUrl = import.meta.env.VITE_RAG_CHAT_API_URL as string | undefined;
const RAG_CHAT_BASE_URL = (envUrl ?? "").replace(/\/+$/, "");

const ragChatService = {
  async createOrUpdateSession(payload: SessionPayload) {
    const { data } = await ragChatApiClient.post("/session", payload);
    return data;
  },

  async sendMessage(req: ChatRequest): Promise<ChatResponse> {
    const { data } = await ragChatApiClient.post<ChatResponse>("/chat", req);
    return data;
  },

  /** Streaming via SSE — the server sends lines "data: {json}\n\n". */
  async *streamMessage(req: ChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${RAG_CHAT_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ ...req, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Could not open the chat stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        yield part.trim().replace(/^data:\s?/, "");
      }
    }
  },

  async fetchHistory(sessionId: string, cursor?: string | null): Promise<HistoryResponse> {
    const { data } = await ragChatApiClient.get<HistoryResponse>("/history", {
      params: { sessionId, cursor: cursor ?? undefined },
    });
    return data;
  },

  async clearHistory(sessionId: string): Promise<void> {
    await ragChatApiClient.post("/history/clear", { sessionId });
  },

  async createCustomer(payload: {
    name: string;
    lastName: string;
    email: string;
  }): Promise<Customer> {
    const { data } = await ragChatApiClient.post("/api/customers/v0", payload);

    // The backend may return { customer, created }, [customer, created], or the customer directly.
    if (data?.customer) return data.customer as Customer;
    if (Array.isArray(data)) return data[0] as Customer;
    return data as Customer;
  },

  async findCustomerById(customerId: string): Promise<Customer> {
    const { data } = await ragChatApiClient.get<Customer>(
      `/api/customers/v0/${customerId}`,
    );
    return data;
  },

  async askQuestion(req: ConversationRequest): Promise<ConversationResponse> {
    const payload: Partial<ConversationRequest> = { ...req };
    if (payload.conversation_id === undefined) {
      delete payload.conversation_id;
    }

    const { data } = await ragChatApiClient.post<ConversationResponse>(
      "/api/conversations/v0",
      payload,
    );
    return data;
  },

  async submitRating(payload: RatingRequest): Promise<RatingResponse> {
    const { data } = await ragChatApiClient.post<RatingResponse>(
      "/api/ratings/v0",
      payload,
    );
    return data;
  },
};

export default ragChatService;
