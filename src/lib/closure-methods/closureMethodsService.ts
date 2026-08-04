import apiClient from "../apiClient";
import type {
  ClosureMethodsParams,
  ClosureMethodsResponse,
  ClosureMethodItem,
  CreateClosureMethodPayload,
  UpdateClosureMethodPayload,
} from "./types";

/**
 * Closure Methods module — ATC closure-methods service.
 */
const closureMethodsService = {
  /**
   * GET /closure-methods/atc/v0 — full unpaginated list (used e.g. for method pickers).
   */
  getAll: async (): Promise<ClosureMethodItem[]> => {
    const { data } = await apiClient.get<ClosureMethodItem[]>("/closure-methods/atc/v0");
    return data;
  },

  /**
   * GET /closure-methods/atc/v0/paginated
   */
  getPaginated: async (params: ClosureMethodsParams): Promise<ClosureMethodsResponse> => {
    const { data } = await apiClient.get<ClosureMethodsResponse>(
      "/closure-methods/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /closure-methods/atc/v0/{id}
   */
  getById: async (id: string): Promise<ClosureMethodItem> => {
    const { data } = await apiClient.get<ClosureMethodItem>(
      `/closure-methods/atc/v0/${id}`
    );
    return data;
  },

  /**
   * GET /closure-methods/atc/v0/internal-name/{internalName}
   */
  getByInternalName: async (internalName: string): Promise<ClosureMethodItem> => {
    const { data } = await apiClient.get<ClosureMethodItem>(
      `/closure-methods/atc/v0/internal-name/${internalName}`
    );
    return data;
  },

  /**
   * POST /closure-methods/atc/v0
   */
  create: async (payload: CreateClosureMethodPayload): Promise<ClosureMethodItem> => {
    const { data } = await apiClient.post<ClosureMethodItem>(
      "/closure-methods/atc/v0",
      payload
    );
    return data;
  },

  /**
   * PUT /closure-methods/atc/v0/{id}
   */
  update: async (
    id: string,
    payload: UpdateClosureMethodPayload
  ): Promise<ClosureMethodItem> => {
    const { data } = await apiClient.put<ClosureMethodItem>(
      `/closure-methods/atc/v0/${id}`,
      payload
    );
    return data;
  },
};

export default closureMethodsService;
