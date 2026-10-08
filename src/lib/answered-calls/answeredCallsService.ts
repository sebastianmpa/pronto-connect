import apiClient from "../apiClient";
import type {
  AnsweredCallsParams,
  AnsweredCallsResponse,
  CreateAnsweredCallPayload,
} from "./types";

/**
 * Answered Calls module — ATC answered-calls service (call qualification).
 */
const answeredCallsService = {
  /**
   * POST /answered-calls/atc/v0
   */
  create: async (payload: CreateAnsweredCallPayload): Promise<void> => {
    await apiClient.post("/answered-calls/atc/v0", payload);
  },

  getPaginated: async (params: AnsweredCallsParams): Promise<AnsweredCallsResponse> => {
    const { data } = await apiClient.get<AnsweredCallsResponse>(
      "/answered-calls/atc/v0/paginated",
      { params },
    );
    return data;
  },
};

export default answeredCallsService;
