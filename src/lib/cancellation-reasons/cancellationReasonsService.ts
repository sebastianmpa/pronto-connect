import apiClient from "../apiClient";
import type { CancellationReason, CancellationReasonPayload, CancellationSubReason } from "./types";

const root = "/cancellation-reasons/atc/v0";

const cancellationReasonsService = {
  getAll: async (): Promise<CancellationReason[]> => {
    const { data } = await apiClient.get<CancellationReason[]>(root);
    return data;
  },
  getActive: async (): Promise<CancellationReason[]> => {
    const { data } = await apiClient.get<CancellationReason[]>("/cancellations/atc/v0/catalog/reasons");
    return data;
  },
  create: async (payload: CancellationReasonPayload): Promise<CancellationReason> => {
    const { data } = await apiClient.post<CancellationReason>(root, payload);
    return data;
  },
  update: async (id: string, payload: Partial<CancellationReasonPayload>): Promise<CancellationReason> => {
    const { data } = await apiClient.put<CancellationReason>(`${root}/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${root}/${id}`);
  },
  createSubReason: async (reasonId: string, payload: CancellationReasonPayload): Promise<CancellationSubReason> => {
    const { data } = await apiClient.post<CancellationSubReason>(`${root}/${reasonId}/sub-reasons`, payload);
    return data;
  },
  updateSubReason: async (reasonId: string, subReasonId: string, payload: Partial<CancellationReasonPayload>): Promise<CancellationSubReason> => {
    const { data } = await apiClient.put<CancellationSubReason>(`${root}/${reasonId}/sub-reasons/${subReasonId}`, payload);
    return data;
  },
  removeSubReason: async (reasonId: string, subReasonId: string): Promise<void> => {
    await apiClient.delete(`${root}/${reasonId}/sub-reasons/${subReasonId}`);
  },
  getSubReasons: async (reasonId: string): Promise<CancellationSubReason[]> => {
    const { data } = await apiClient.get<CancellationSubReason[]>(`${root}/${reasonId}/sub-reasons`);
    return data;
  },
};

export default cancellationReasonsService;
