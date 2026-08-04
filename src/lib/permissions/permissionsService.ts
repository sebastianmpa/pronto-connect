import apiClient from "../apiClient";
import type {
  PermissionsParams,
  PermissionsResponse,
  PermissionItem,
  CreatePermissionPayload,
  UpdatePermissionPayload,
} from "./types";

/**
 * Permissions module — ATC permissions service.
 */
const permissionsService = {
  /**
   * GET /permissions/atc/v0 — full unpaginated list (used e.g. for permission pickers).
   */
  getAll: async (): Promise<PermissionItem[]> => {
    const { data } = await apiClient.get<PermissionItem[]>("/permissions/atc/v0");
    return data;
  },

  /**
   * GET /permissions/atc/v0/paginated
   */
  getPaginated: async (params: PermissionsParams): Promise<PermissionsResponse> => {
    const { data } = await apiClient.get<PermissionsResponse>(
      "/permissions/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /permissions/atc/v0/{id}
   */
  getById: async (id: string): Promise<PermissionItem> => {
    const { data } = await apiClient.get<PermissionItem>(`/permissions/atc/v0/${id}`);
    return data;
  },

  /**
   * GET /permissions/atc/v0/internal-name/{internalName}
   */
  getByInternalName: async (internalName: string): Promise<PermissionItem> => {
    const { data } = await apiClient.get<PermissionItem>(
      `/permissions/atc/v0/internal-name/${internalName}`
    );
    return data;
  },

  /**
   * POST /permissions/atc/v0
   */
  create: async (payload: CreatePermissionPayload): Promise<PermissionItem> => {
    const { data } = await apiClient.post<PermissionItem>("/permissions/atc/v0", payload);
    return data;
  },

  /**
   * PUT /permissions/atc/v0/{id}
   */
  update: async (id: string, payload: UpdatePermissionPayload): Promise<PermissionItem> => {
    const { data } = await apiClient.put<PermissionItem>(
      `/permissions/atc/v0/${id}`,
      payload
    );
    return data;
  },

  /**
   * DELETE /permissions/atc/v0/{id}
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/permissions/atc/v0/${id}`);
  },
};

export default permissionsService;
