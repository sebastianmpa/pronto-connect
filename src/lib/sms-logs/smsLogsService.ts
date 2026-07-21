import apiClient from "../apiClient";
import type { SmsLogsParams, SmsLogsResponse, SmsLogItem } from "./types";

/**
 * SMS Logs module — ATC sms-logs service.
 */
const smsLogsService = {
  /**
   * GET /sms-logs/atc/v0/paginated
   */
  getPaginated: async (params: SmsLogsParams): Promise<SmsLogsResponse> => {
    const { data } = await apiClient.get<SmsLogsResponse>(
      "/sms-logs/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /sms-logs/atc/v0/{id}
   */
  getById: async (id: number): Promise<SmsLogItem> => {
    const { data } = await apiClient.get<SmsLogItem>(
      `/sms-logs/atc/v0/${id}`
    );
    return data;
  },
};

export default smsLogsService;
