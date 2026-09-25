import apiClient from "../apiClient";
import type {
  CustomerMessageDictionaryItem,
  CustomerMessageDictionaryPayload,
  CustomerMessagesDictionaryApiResponse,
  CustomerMessagesDictionaryParams,
  CustomerMessagesDictionaryResponse,
} from "./types";

function normalizePaginatedResponse(
  response: CustomerMessagesDictionaryApiResponse
): CustomerMessagesDictionaryResponse {
  const items = response.data ?? response.items ?? [];
  const meta = response.meta ?? {};

  return {
    items,
    meta: {
      total: Number(meta.total ?? items.length),
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? items.length),
      total_pages: Number(meta.total_pages ?? 1),
    },
  };
}

/**
 * Status Dictionary module — ATC customer-messages-dictionary service.
 */
const customerMessagesDictionaryService = {
  /**
   * GET /customer-messages-dictionary/atc/v0 — full unpaginated list.
   */
  getAll: async (): Promise<CustomerMessageDictionaryItem[]> => {
    const { data } = await apiClient.get<CustomerMessageDictionaryItem[]>(
      "/customer-messages-dictionary/atc/v0"
    );
    return data;
  },

  /**
   * GET /customer-messages-dictionary/atc/v0/paginated
   */
  getPaginated: async (
    params: CustomerMessagesDictionaryParams
  ): Promise<CustomerMessagesDictionaryResponse> => {
    const { data } = await apiClient.get<CustomerMessagesDictionaryApiResponse>(
      "/customer-messages-dictionary/atc/v0/paginated",
      { params }
    );
    return normalizePaginatedResponse(data);
  },

  /**
   * GET /customer-messages-dictionary/atc/v0/internal-name/{internalName}
   */
  getByInternalName: async (internalName: string): Promise<CustomerMessageDictionaryItem> => {
    const { data } = await apiClient.get<CustomerMessageDictionaryItem>(
      `/customer-messages-dictionary/atc/v0/internal-name/${encodeURIComponent(internalName)}`
    );
    return data;
  },

  /**
   * GET /customer-messages-dictionary/atc/v0/{id}
   */
  getById: async (id: string): Promise<CustomerMessageDictionaryItem> => {
    const { data } = await apiClient.get<CustomerMessageDictionaryItem>(
      `/customer-messages-dictionary/atc/v0/${id}`
    );
    return data;
  },

  /**
   * POST /customer-messages-dictionary/atc/v0 — same path as the get-all route.
   */
  create: async (
    payload: CustomerMessageDictionaryPayload
  ): Promise<CustomerMessageDictionaryItem> => {
    const { data } = await apiClient.post<CustomerMessageDictionaryItem>(
      "/customer-messages-dictionary/atc/v0",
      payload
    );
    return data;
  },

  /**
   * PUT /customer-messages-dictionary/atc/v0/{id}
   */
  update: async (
    id: string,
    payload: CustomerMessageDictionaryPayload
  ): Promise<CustomerMessageDictionaryItem> => {
    const { data } = await apiClient.put<CustomerMessageDictionaryItem>(
      `/customer-messages-dictionary/atc/v0/${id}`,
      payload
    );
    return data;
  },

  /**
   * DELETE /customer-messages-dictionary/atc/v0/{id}
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/customer-messages-dictionary/atc/v0/${id}`);
  },
};

export default customerMessagesDictionaryService;
