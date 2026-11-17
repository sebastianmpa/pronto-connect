export interface WeeklyScheduleSettings {
  timezone: string;
  call_queue_ids: string[];
  chat_department_ids: string[];
  chat_enabled: boolean;
  chat_capacity_per_agent_hour: number | null;
  service_level_percent: number;
  service_level_seconds: number;
  average_call_seconds: number;
  productive_hours: number;
  weekday_open_time: string;
  weekday_close_time: string;
  saturday_open_time: string;
  saturday_close_time: string;
  generation_weekday: number;
  generation_time: string;
  draft_ready_notice_time: string;
  approval_reminder_weekday: number;
  approval_reminder_time: string;
  approval_deadline_weekday: number;
  approval_deadline_time: string;
  report_weekday: number;
  report_time: string;
  alert_email: string | null;
}

export interface WeeklyScheduleAgent {
  id: number;
  name: string;
  user_email: string | null;
  skill_call: boolean;
  skill_chat: boolean;
  fixed_days_off: number[];
  preferred_lunch_time: string | null;
  active: boolean;
  saturday_assignments: number;
}

export interface WeeklyScheduleUser {
  id: string;
  name: string;
  email: string;
}

export interface WeeklyScheduleConfiguration {
  settings: WeeklyScheduleSettings;
  agents: WeeklyScheduleAgent[];
  users: WeeklyScheduleUser[];
  call_queues: { queue_id: string; queue_name: string }[];
  chat_departments: { department_id: string; department_name: string }[];
}

export interface WeeklyScheduleShift {
  id: number;
  staff_id: number;
  agent_name: string;
  user_email: string | null;
  shift_date: string;
  shift_kind: "weekday" | "saturday";
  start_time: string;
  end_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  rest1_start: string | null;
  rest1_end: string | null;
  rest2_start: string | null;
  rest2_end: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

export interface WeeklyScheduleSlot {
  slot_date: string;
  slot_start: string;
  forecast_calls: number | string;
  forecast_calls_p90: number | string;
  required_calls: number | string;
  required_calls_p90: number | string;
  available_calls: number | string;
  available_chats: number | string;
  assigned_calls: number | string;
  assigned_chats: number | string;
  deficit_calls: number | string;
  deficit_chats: number | string;
  surplus_calls: number | string;
  surplus_chats: number | string;
  forecast_chats: number | string;
  forecast_chats_p90: number | string;
  required_chats: number | string;
  required_chats_p90: number | string;
}

export interface WeeklyScheduleForecastSlot {
  date: string;
  time: string;
  sample_days: number;
  used_previous_forecast: boolean;
  calls: number;
  calls_p90: number;
  calls_required: number;
  calls_required_p90: number;
  chats: number;
  chats_p90: number;
  chats_required: number;
  chats_required_p90: number;
}

export interface WeeklySchedule {
  id: number;
  week_start: string;
  version: number;
  status: "draft" | "approved" | "published" | "failed";
  timezone: string;
  coverage_percent: number | string | null;
  shifts: WeeklyScheduleShift[];
  slots: WeeklyScheduleSlot[];
  forecast: {
    used_previous_forecast: boolean;
    history_weeks: number;
    heavy_day_method: string;
    heavy_day_reference_multiplier: number;
    slots: WeeklyScheduleForecastSlot[];
    excluded_dates: string[];
  };
  settings: WeeklyScheduleSettings;
  currently_published?: WeeklySchedule | null;
}

export interface WeeklyScheduleOwn {
  id: number;
  week_start: string;
  version: number;
  status: "published";
  timezone: string;
  shifts: WeeklyScheduleShift[];
}

export interface WeeklyScheduleInputs {
  holidays: { id: number; holiday_date: string; name: string; service_closed: number | boolean }[];
  absences: { id: number; staff_id: number; agent_name: string; starts_on: string; ends_on: string; absence_type: string; note: string | null }[];
  atypical_dates: { date: string; reason: string | null }[];
}

export interface WeeklyScheduleReport {
  week_start: string;
  report: {
    forecast_mape_percent: number | null;
    actual_service_level_percent: number | null;
    actual_calls: number;
    actual_handled: number;
    measured_intervals: number;
  };
}
