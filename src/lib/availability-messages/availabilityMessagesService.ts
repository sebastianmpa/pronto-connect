import apiClient from "../apiClient";
import type {
  AvailabilityMessage,
  AvailabilityMessagePayload,
  AvailabilityMessagesPage,
  SupplierOption,
} from "./types";

const root = "/availability-description-messages/atc/v0";

const availabilityMessagesService = {
  getAll: async (): Promise<AvailabilityMessage[]> => {
    const { data } = await apiClient.get<AvailabilityMessage[]>(root);
    return data;
  },
  getPaginated: async (page = 1, limit = 100): Promise<AvailabilityMessagesPage> => {
    const { data } = await apiClient.get<AvailabilityMessagesPage>(`${root}/paginated`, {
      params: { page, limit },
    });
    return data;
  },
  getById: async (id: string): Promise<AvailabilityMessage> => {
    const { data } = await apiClient.get<AvailabilityMessage>(`${root}/${id}`);
    return data;
  },
  create: async (payload: AvailabilityMessagePayload): Promise<AvailabilityMessage> => {
    const { data } = await apiClient.post<AvailabilityMessage>(root, payload);
    return data;
  },
  update: async (id: string, payload: AvailabilityMessagePayload): Promise<AvailabilityMessage> => {
    const { data } = await apiClient.put<AvailabilityMessage>(`${root}/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${root}/${id}`);
  },
  getSuppliers: async (): Promise<SupplierOption[]> => {
    const { data } = await apiClient.get<SupplierOption[]>("/suppliers/atc/v0");
    return data;
  },
};

export default availabilityMessagesService;
