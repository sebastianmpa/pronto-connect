import apiClient from "../apiClient";
import type {
  RolesParams,
  RolesResponse,
  RoleItem,
  CreateRolePayload,
  UpdateRolePayload,
  RolePermissionItem,
  SetRolePermissionsPayload,
} from "./types";

/**
 * Roles module — ATC roles service.
 */
const rolesService = {
  /**
   * GET /roles/atc/v0 — full unpaginated list (used e.g. for role pickers).
   */
  getAll: async (): Promise<RoleItem[]> => {
    const { data } = await apiClient.get<RoleItem[]>("/roles/atc/v0");
    return data;
  },

  /**
   * GET /roles/atc/v0/paginated
   */
  getPaginated: async (params: RolesParams): Promise<RolesResponse> => {
    const { data } = await apiClient.get<RolesResponse>("/roles/atc/v0/paginated", {
      params,
    });
    return data;
  },

  /**
   * GET /roles/atc/v0/{id}
   */
  getById: async (id: string): Promise<RoleItem> => {
    const { data } = await apiClient.get<RoleItem>(`/roles/atc/v0/${id}`);
    return data;
  },

  /**
   * GET /roles/atc/v0/internal-name/{internalName}
   */
  getByInternalName: async (internalName: string): Promise<RoleItem> => {
    const { data } = await apiClient.get<RoleItem>(
      `/roles/atc/v0/internal-name/${internalName}`
    );
    return data;
  },

  /**
   * POST /roles/atc/v0
   */
  create: async (payload: CreateRolePayload): Promise<RoleItem> => {
    const { data } = await apiClient.post<RoleItem>("/roles/atc/v0", payload);
    return data;
  },

  /**
   * PUT /roles/atc/v0/{id}
   */
  update: async (id: string, payload: UpdateRolePayload): Promise<RoleItem> => {
    const { data } = await apiClient.put<RoleItem>(`/roles/atc/v0/${id}`, payload);
    return data;
  },

  /**
   * GET /roles/atc/v0/{id}/permissions
   */
  getPermissions: async (id: string): Promise<RolePermissionItem[]> => {
    const { data } = await apiClient.get<RolePermissionItem[]>(
      `/roles/atc/v0/${id}/permissions`
    );
    return data;
  },

  /**
   * PUT /roles/atc/v0/{id}/permissions — replaces the role's assigned permissions.
   */
  setPermissions: async (id: string, permissionIds: string[]): Promise<void> => {
    const payload: SetRolePermissionsPayload = { permission_ids: permissionIds };
    await apiClient.put(`/roles/atc/v0/${id}/permissions`, payload);
  },
};

export default rolesService;
