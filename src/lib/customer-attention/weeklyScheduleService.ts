import apiClient from "../apiClient";
import type {
  WeeklySchedule,
  WeeklyScheduleAgent,
  WeeklyScheduleConfiguration,
  WeeklyScheduleInputs,
  WeeklyScheduleOwn,
  WeeklyScheduleReport,
  WeeklyScheduleSettings,
} from "./weeklyScheduleTypes";

const BASE_PATH = "/customer-attention/atc/v0/schedules/weekly";

export const weeklyScheduleService = {
  async schedule(weekStart: string) {
    const { data } = await apiClient.get<WeeklySchedule | null>(BASE_PATH, { params: { week_start: weekStart } });
    return data;
  },
  async own(weekStart: string) {
    const { data } = await apiClient.get<WeeklyScheduleOwn | null>(BASE_PATH + "/own", { params: { week_start: weekStart } });
    return data;
  },
  async configuration(signal?: AbortSignal) {
    const { data } = await apiClient.get<WeeklyScheduleConfiguration>(BASE_PATH + "/configuration", { signal });
    return data;
  },
  async inputs(from: string, to: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<WeeklyScheduleInputs>(BASE_PATH + "/inputs", { params: { from, to }, signal });
    return data;
  },
  async reports(from: string, to: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<WeeklyScheduleReport[]>(BASE_PATH + "/reports", { params: { from, to }, signal });
    return data;
  },
  async generate(weekStart: string) {
    const { data } = await apiClient.post<WeeklySchedule>(BASE_PATH + "/drafts", { week_start: weekStart });
    return data;
  },
  async updateSettings(payload: Partial<WeeklyScheduleSettings>) {
    const { data } = await apiClient.put<WeeklyScheduleSettings>(BASE_PATH + "/settings", payload);
    return data;
  },
  async updateAgent(id: number, payload: Partial<WeeklyScheduleAgent>) {
    const { data } = await apiClient.put<WeeklyScheduleAgent>(BASE_PATH + "/agents/" + id, payload);
    return data;
  },
  async editShift(scheduleId: number, shiftId: number, payload: {
    start_time: string;
    end_time: string;
    lunch_start: string | null;
    lunch_end: string | null;
    rest1_start: string | null;
    rest1_end: string | null;
    rest2_start: string | null;
    rest2_end: string | null;
  }) {
    const { data } = await apiClient.put<WeeklySchedule>(BASE_PATH + "/" + scheduleId + "/shifts/" + shiftId, payload);
    return data;
  },
  async approve(scheduleId: number) {
    const { data } = await apiClient.post<WeeklySchedule>(BASE_PATH + "/" + scheduleId + "/approve");
    return data;
  },
  async confirm(scheduleId: number, shiftId: number) {
    const { data } = await apiClient.post<WeeklyScheduleOwn>(BASE_PATH + "/" + scheduleId + "/shifts/" + shiftId + "/confirm");
    return data;
  },
  async addAbsence(payload: { staff_id: number; starts_on: string; ends_on: string; absence_type: string; note: string | null }) {
    const { data } = await apiClient.post(BASE_PATH + "/absences", payload);
    return data as { proposed_schedules?: WeeklySchedule[] };
  },
  async deleteAbsence(id: number) {
    await apiClient.delete(BASE_PATH + "/absences/" + id);
  },
  async addHoliday(payload: { holiday_date: string; name: string; service_closed: boolean }) {
    const { data } = await apiClient.post(BASE_PATH + "/holidays", payload);
    return data;
  },
  async deleteHoliday(id: number) {
    await apiClient.delete(BASE_PATH + "/holidays/" + id);
  },
  async setAtypicalDate(payload: { date: string; reason: string | null; atypical: boolean }) {
    const { data } = await apiClient.post(BASE_PATH + "/atypical-dates", payload);
    return data;
  },
};
