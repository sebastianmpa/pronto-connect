export type Channel = "call" | "chat" | "ticket" | "email";

export interface AnalyticsQuery {
  from: string;
  to: string;
  compare_from?: string;
  compare_to?: string;
  agent_id?: string;
  department_id?: string;
}

export interface DurationStats {
  count: number;
  average_seconds: number;
  p50_seconds: number;
  p90_seconds: number;
}

export interface MetricGroup {
  interactions: number;
  unattended: number;
  wait: DurationStats | null;
  attention: DurationStats | null;
  total: DurationStats | null;
  first_response: DurationStats | null;
}

export interface MetricAgent extends MetricGroup {
  agent_id: string;
  agent_name: string | null;
  source: "goto_connect" | "salesiq" | "zoho_desk";
}

export interface MetricPeriod {
  overall: MetricGroup;
  by_channel: Record<"call" | "chat" | "ticket", MetricGroup | null>;
  by_agent: Record<string, MetricAgent>;
  quality: { excluded_invalid_timestamps: number };
}

export interface MetricsResponse {
  current: MetricPeriod;
  comparison: MetricPeriod | null;
}

export interface VolumePoint {
  channel: Channel;
  date: string;
  total: number;
}

export interface VolumeResponse {
  current: VolumePoint[];
  comparison: VolumePoint[] | null;
}

export interface OutcomeReason {
  outcome: string | null;
  left_queue_reason: string | null;
  count: number;
  percent_of_total: number | null;
}

export interface OutcomeGroup {
  total: number;
  handled: number;
  unattended: number;
  attended_percent: number | null;
  unattended_reasons: OutcomeReason[];
}

export interface QueueOutcome extends OutcomeGroup {
  queue_id: string | null;
  queue_name: string | null;
}

export interface OutcomePeriod {
  overall: OutcomeGroup;
  by_queue: QueueOutcome[];
}

export interface OutcomesResponse {
  current: OutcomePeriod;
  comparison: OutcomePeriod | null;
}

export interface CustomerAttentionCallSummary {
  call_key: string;
  start_time_utc: string | null;
  call_outcome: string | null;
  left_queue_reason: string | null;
  queue_id: string | null;
  queue_name: string | null;
  agent_name: string | null;
  wait_time_seconds: number | null;
  talk_duration_seconds: number | null;
  duration_seconds: number | null;
}

export interface CustomerAttentionCallDetail extends CustomerAttentionCallSummary {
  start_time_local: string | null;
  legacy_outcome: string | null;
  media_type: string | null;
  direction: string | null;
  callback_offered: number | boolean | null;
  callback_requested: number | boolean | null;
  dialed_number_name: string | null;
  agent_ring_time_seconds: number | null;
  met_service_level: string | null;
  disposition_name: string | null;
  disposition_category: string | null;
}

export interface CustomerAttentionCallsResponse {
  filters: { from: string; to: string; queue_id: string; agent_id: string };
  pagination: { page: number; page_size: number; total: number; total_pages: number };
  calls: CustomerAttentionCallSummary[];
}

export interface TicketAgentStats {
  agent_id: string | null;
  agent_name: string | null;
  attended: number;
  first_response: { count: number; average_seconds: number } | null;
}

export interface TicketStatsGroup {
  total: number;
  attended: number;
  unanswered: number;
  attention_percent: number | null;
  first_response: { count: number; average_seconds: number } | null;
  by_status: { status: string; status_type: string | null; total: number }[];
  by_agent: TicketAgentStats[];
}

export interface TicketStatsResponse {
  filters: { from: string; to: string };
  overall: TicketStatsGroup;
  by_department: (TicketStatsGroup & { department_id: string | null; department_name: string | null })[];
}

export interface CallReasonStatsResponse {
  filters: { from: string; to: string; agent_email: string | null; closure_method: string | null };
  overall: {
    total: number;
    total_qualifications: number;
    unique_calls: number;
    repeated_calls: number;
    repeated_qualifications: number;
    average_qualifications_per_call: number | null;
    missing_call_id: number;
    call_id_coverage_percent: number | null;
    total_agents: number;
    missing_contact_reason: number;
    contact_reason_coverage_percent: number | null;
    missing_closure_method: number;
    closure_method_coverage_percent: number | null;
    missing_agent: number;
    agent_coverage_percent: number | null;
  };
  by_reason: { contact_reason: string; total: number; unique_calls: number; percent: number | null; unique_call_percent: number | null }[];
  by_agent: { agent_email: string; agent_name: string | null; extension: string | null; qualifications: number; unique_calls: number; distinct_reasons: number; percent: number | null }[];
  by_closure_method: { closure_method: string; qualifications: number; unique_calls: number; percent: number | null }[];
  by_reason_and_closure: { contact_reason: string; closure_method: string; qualifications: number; percent: number | null }[];
  by_day: { date: string; qualifications: number; unique_calls: number }[];
  agent_options: { agent_email: string; agent_name: string | null; extension: string | null }[];
  closure_options: string[];
}

export interface ChatStatsGroup {
  total: number;
  bot_only: number;
  bot_to_operator: number;
  operator_only: number;
  operator_to_bot: number;
  mixed: number;
  unclassified: number;
  bot_only_percent: number | null;
  bot_to_operator_percent: number | null;
  operator_only_percent: number | null;
  operator_to_bot_percent: number | null;
  mixed_percent: number | null;
  unclassified_percent: number | null;
  classified: number;
}

export interface ChatAgentStats {
  agent_id: string | null;
  agent_name: string | null;
  total: number;
}

export interface ChatStatsResponse {
  filters: { from: string; to: string; department_id: string | null; agent_id: string | null };
  overall: ChatStatsGroup;
  by_department: (ChatStatsGroup & { department_id: string | null; department_name: string | null })[];
  by_agent: ChatAgentStats[];
}

export interface OccupancyAgent {
  agent_id: string;
  agent_name: string;
  available_seconds: number;
  talk_seconds: number;
  idle_seconds: number;
  call_seconds: number;
  chat_seconds: number;
  occupancy_percent: number | null;
}

export interface OccupancyResponse {
  overall: OccupancyAgent;
  by_agent: OccupancyAgent[];
}

export interface AgentCandidate {
  agent_id: string;
  agent_name?: string | null;
}

export interface AgentCandidatesResponse {
  goto_agents: AgentCandidate[];
  salesiq_agents: AgentCandidate[];
  zoho_desk_agents: AgentCandidate[];
}

export interface AgentMapping {
  goto_agent_id: string;
  salesiq_agent_id: string;
  zoho_desk_agent_id: string | null;
  active: boolean | number;
}


export interface QualifiedCallSummary {
  conversation_id: string;
  call_created_utc: string | null;
  call_answered_utc: string | null;
  call_ended_utc: string | null;
  direction: string | null;
  caller_outcome: string | null;
  call_result: string | null;
  agent_name: string | null;
  agent_extension: string | null;
  qualification_count: number;
  latest_qualification_at: string | null;
}

export interface QualifiedCallsResponse {
  filters: { from: string; to: string };
  pagination: { page: number; page_size: number; total: number; total_pages: number };
  conversations: QualifiedCallSummary[];
}

export interface QualifiedCallEvent extends Omit<QualifiedCallSummary, 'qualification_count' | 'latest_qualification_at'> {
  call_initiator: string | null;
  queue_outcome: string | null;
  missed: number | boolean | null;
  duration_seconds: number | null;
  answer_delay_seconds: number | null;
}

export interface QualifiedCallQueueInteraction {
  queue_caller_key: string;
  start_time_utc: string | null;
  call_outcome: string | null;
  left_queue_reason: string | null;
  queue_id: string | null;
  queue_name: string | null;
  agent_name: string | null;
  wait_time_seconds: number | null;
  talk_duration_seconds: number | null;
  duration_seconds: number | null;
}

export interface QualifiedCallQualification {
  id: number;
  agent_name: string | null;
  extension: string | null;
  call_date_time: string | null;
  contact_reason: string | null;
  closure_method: string | null;
  created_at: string | null;
}

export interface QualifiedCallDetailsResponse {
  conversation_id: string;
  event: QualifiedCallEvent | null;
  report: {
    conversation_id: string;
    hangup_originator_id: string | null;
    ivr_systems: unknown;
    call_states: unknown;
    transfer_events: unknown;
  } | null;
  queue_interactions: QualifiedCallQueueInteraction[];
  qualifications: QualifiedCallQualification[];
}
