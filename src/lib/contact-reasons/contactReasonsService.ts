import apiClient from "../apiClient";
import type {
  ContactReasonsParams,
  ContactReasonsResponse,
  ContactReasonItem,
  CreateContactReasonPayload,
  UpdateContactReasonPayload,
} from "./types";

/**
 * Contact Reasons module — ATC contact-reasons service.
 */
const contactReasonsService = {
  /**
   * GET /contact-reasons/atc/v0 — full unpaginated list (used e.g. for reason pickers).
   */
  getAll: async (): Promise<ContactReasonItem[]> => {
    const { data } = await apiClient.get<ContactReasonItem[]>("/contact-reasons/atc/v0");
    return data;
  },

  /**
   * GET /contact-reasons/atc/v0/paginated
   */
  getPaginated: async (params: ContactReasonsParams): Promise<ContactReasonsResponse> => {
    const { data } = await apiClient.get<ContactReasonsResponse>(
      "/contact-reasons/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /contact-reasons/atc/v0/{id}
   */
  getById: async (id: string): Promise<ContactReasonItem> => {
    const { data } = await apiClient.get<ContactReasonItem>(
      `/contact-reasons/atc/v0/${id}`
    );
    return data;
  },

  /**
   * GET /contact-reasons/atc/v0/internal-name/{internalName}
   */
  getByInternalName: async (internalName: string): Promise<ContactReasonItem> => {
    const { data } = await apiClient.get<ContactReasonItem>(
      `/contact-reasons/atc/v0/internal-name/${internalName}`
    );
    return data;
  },

  /**
   * POST /contact-reasons/atc/v0
   */
  create: async (payload: CreateContactReasonPayload): Promise<ContactReasonItem> => {
    const { data } = await apiClient.post<ContactReasonItem>(
      "/contact-reasons/atc/v0",
      payload
    );
    return data;
  },

  /**
   * PUT /contact-reasons/atc/v0/{id}
   */
  update: async (
    id: string,
    payload: UpdateContactReasonPayload
  ): Promise<ContactReasonItem> => {
    const { data } = await apiClient.put<ContactReasonItem>(
      `/contact-reasons/atc/v0/${id}`,
      payload
    );
    return data;
  },

  /**
   * DELETE /contact-reasons/atc/v0/{id}
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/contact-reasons/atc/v0/${id}`);
  },
};

export default contactReasonsService;
