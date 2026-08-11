import apiClient from "../apiClient";
import type { EmailLogsParams, EmailLogsResponse } from "./types";

/**
 * Email Logs module.
 *
 * Backend documentation currently exposes the paginated endpoint only.
 * The response already contains all fields required by the detail view,
 * including subject, message_sent, provider_message_id and error_message.
 */
const emailLogsService = {
  /**
   * GET /email-logs/atc/v0/paginated
   */
  getPaginated: async (params: EmailLogsParams): Promise<EmailLogsResponse> => {
    const { data } = await apiClient.get<EmailLogsResponse>(
      "/email-logs/atc/v0/paginated",
      { params },
    );

    return data;
  },
};

export default emailLogsService;
