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
  StaffResponse,
  StaffMember,
  StaffSchedule,
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
  async volume(query: AnalyticsQuery & { staffing?: boolean; planning_date?: string; history_from?: string; history_to?: string }, channels: Channel[], signal: AbortSignal) {
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
  async staffAccess(signal: AbortSignal) {
    const { data } = await apiClient.get<{ can_edit: boolean }>(`${BASE_PATH}/staff/access`, { signal });
    return data;
  },
  async staff(signal: AbortSignal) {
    const { data } = await apiClient.get<StaffResponse>(`${BASE_PATH}/staff`, { signal });
    return data;
  },
  async createStaff(payload: { name: string; team: StaffMember["team"]; goto_agent_id: string | null }) {
    const { data } = await apiClient.post<StaffMember>(`${BASE_PATH}/staff`, payload);
    return data;
  },
  async updateStaff(id: number, payload: Partial<Pick<StaffMember, "name" | "team" | "goto_agent_id" | "active">>) {
    const { data } = await apiClient.put<StaffMember>(`${BASE_PATH}/staff/${id}`, payload);
    return data;
  },
  async deactivateStaff(id: number) {
    await apiClient.delete(`${BASE_PATH}/staff/${id}`);
  },
  async addSchedule(id: number, payload: Omit<StaffSchedule, "id" | "staff_id">) {
    const { data } = await apiClient.post<StaffSchedule>(`${BASE_PATH}/staff/${id}/schedules`, payload);
    return data;
  },
  async updateDraftSchedule(id: number, scheduleId: number, payload: Omit<StaffSchedule, "id" | "staff_id">) {
    const { data } = await apiClient.put<StaffSchedule>(`${BASE_PATH}/staff/${id}/schedules/${scheduleId}`, payload);
    return data;
  },
  async saveCapacities(payload: StaffResponse["capacities"]) {
    const { data } = await apiClient.put<StaffResponse["capacities"]>(`${BASE_PATH}/staff/capacities`, payload);
    return data;
  },
  async mappings(signal: AbortSignal) {
    const { data } = await apiClient.get<AgentMapping[]>(`${BASE_PATH}/agent-mappings`, {
      signal,
    });
    return data;
  },
};
