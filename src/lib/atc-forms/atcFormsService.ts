import apiClient from "../apiClient";
import type { AtcFormsParams, AtcFormsResponse } from "./types";

/**
 * Client Requests module — ATC "atc-forms" service (claims, returns, feedback, cancellations).
 */
const atcFormsService = {
  /**
   * GET /atc-forms/atc/v0/paginated
   */
  getPaginated: async (params: AtcFormsParams): Promise<AtcFormsResponse> => {
    const { data } = await apiClient.get<AtcFormsResponse>(
      "/atc-forms/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * PUT /atc-forms/atc/v0/{id}/status
   */
  updateStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.put(`/atc-forms/atc/v0/${id}/status`, { status });
  },
};

export default atcFormsService;
