import apiClient from "../apiClient";
import type { CreateAnsweredCallPayload } from "./types";

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
};

export default answeredCallsService;
