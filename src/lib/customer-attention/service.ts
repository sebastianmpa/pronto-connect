import apiClient from "../apiClient";
import type {
  AgentCandidatesResponse,
  AgentMapping,
  AnalyticsQuery,
  Channel,
  CallReasonStatsResponse,
  ChatStatsResponse,
  CustomerAttentionCallDetail,
  CustomerAttentionCallsResponse,
  QualifiedCallDetailsResponse,
  QualifiedCallsResponse,
  MetricsResponse,
  OccupancyResponse,
  OutcomesResponse,
  VolumeResponse,
  TicketStatsResponse,
} from "./types";

const BASE_PATH = "/customer-attention/atc/v0";

export const customerAttentionService = {
  async ticketStats(query: Pick<AnalyticsQuery, "from" | "to" | "department_id">, signal: AbortSignal) {
    const { from, to, department_id } = query;
    const { data } = await apiClient.get<TicketStatsResponse>(`${BASE_PATH}/ticket-stats`, {
      params: { from, to, ...(department_id ? { department_id } : {}) },
      signal,
    });
    return data;
  },
  async callReasons(query: Pick<AnalyticsQuery, "from" | "to"> & { agent_email?: string; closure_method?: string }, signal: AbortSignal) {
    const { from, to, agent_email, closure_method } = query;
    const { data } = await apiClient.get<CallReasonStatsResponse>(`${BASE_PATH}/call-reasons`, {
      params: { from, to, ...(agent_email ? { agent_email } : {}), ...(closure_method ? { closure_method } : {}) },
      signal,
    });
    return data;
  },
  async chatStats(query: Pick<AnalyticsQuery, "from" | "to" | "department_id" | "agent_id">, signal: AbortSignal) {
    const { data } = await apiClient.get<ChatStatsResponse>(`${BASE_PATH}/chat-stats`, {
      params: query,
      signal,
    });
    return data;
  },
  async metrics(query: AnalyticsQuery, channels: Channel[], signal: AbortSignal) {
    const { data } = await apiClient.get<MetricsResponse>(`${BASE_PATH}/metrics`, {
      params: { ...query, channels: channels.filter((channel) => channel !== "email").join(",") },
      signal,
    });
    return data;
  },
  async volume(query: AnalyticsQuery, channels: Channel[], signal: AbortSignal) {
    const { data } = await apiClient.get<VolumeResponse>(`${BASE_PATH}/volume`, {
      params: { ...query, channels: channels.join(",") },
      signal,
    });
    return data;
  },
  async outcomes(query: AnalyticsQuery, signal: AbortSignal) {
    const { data } = await apiClient.get<OutcomesResponse>(`${BASE_PATH}/call-outcomes`, {
      params: query,
      signal,
    });
    return data;
  },
  async calls(
    query: { from: string; to: string; queue_id: string; agent_id?: string; page: number; page_size: number },
    signal: AbortSignal,
  ) {
    const { data } = await apiClient.get<CustomerAttentionCallsResponse>(`${BASE_PATH}/calls`, {
      params: query,
      signal,
    });
    return data;
  },
  async call(callKey: string, signal: AbortSignal) {
    const { data } = await apiClient.get<CustomerAttentionCallDetail>(
      `${BASE_PATH}/calls/${encodeURIComponent(callKey)}`,
      { signal },
    );
    return data;
  },
  async qualifiedCalls(query: { from: string; to: string; page: number; page_size: number }, signal: AbortSignal) {
    const { data } = await apiClient.get<QualifiedCallsResponse>(`${BASE_PATH}/qualified-calls`, {
      params: query,
      signal,
    });
    return data;
  },
  async qualifiedCall(conversationId: string, signal: AbortSignal) {
    const { data } = await apiClient.get<QualifiedCallDetailsResponse>(
      `${BASE_PATH}/qualified-calls/${encodeURIComponent(conversationId)}`,
      { signal },
    );
    return data;
  },
  async occupancy(query: AnalyticsQuery, signal: AbortSignal) {
    const { from, to, agent_id } = query;
    const { data } = await apiClient.get<OccupancyResponse>(`${BASE_PATH}/occupancy`, {
      params: { from, to, agent_id },
      signal,
    });
    return data;
  },
  async agents(signal: AbortSignal) {
    const { data } = await apiClient.get<AgentCandidatesResponse>(
      `${BASE_PATH}/agent-mappings/candidates`,
      { signal },
    );
    return data;
  },
  async mappings(signal: AbortSignal) {
    const { data } = await apiClient.get<AgentMapping[]>(`${BASE_PATH}/agent-mappings`, {
      signal,
    });
    return data;
  },
};
