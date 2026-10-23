import apiClient from "../apiClient";
import type { CancellationStatisticsResponse } from "./types";

export const cancellationStatisticsService = {
  async get(query: {
    from: string;
    to: string;
    store?: string;
    focus?: "" | "high-rate" | "high-impact";
    reason?: string;
    agent?: string;
    age?: string;
  }, signal: AbortSignal) {
    const { data } = await apiClient.get<CancellationStatisticsResponse>(
      "/cancellations/atc/v0/statistics/order-cancellations",
      { params: query, signal },
    );
    return data;
  },
};
