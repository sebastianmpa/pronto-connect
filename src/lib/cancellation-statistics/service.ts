import apiClient from "../apiClient";
import type { CancellationAlertThresholds, CancellationStatisticsResponse } from "./types";

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
  async alertThresholds(signal: AbortSignal) {
    const { data } = await apiClient.get<CancellationAlertThresholds>(
      "/cancellations/atc/v0/statistics/order-cancellations/alert-thresholds",
      { signal },
    );
    return data;
  },
  async saveAlertThresholds(payload: CancellationAlertThresholds) {
    const { data } = await apiClient.put<CancellationAlertThresholds>(
      "/cancellations/atc/v0/statistics/order-cancellations/alert-thresholds",
      payload,
    );
    return data;
  },
};
