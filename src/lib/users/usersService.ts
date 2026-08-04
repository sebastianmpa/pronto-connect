import apiClient from "../apiClient";
import type {
  UsersParams,
  UsersResponse,
  UserItem,
  CreateUserPayload,
  UpdateUserPayload,
} from "./types";

/**
 * Users module — ATC users service.
 */
const usersService = {
  /**
   * GET /users/atc/v0 — full unpaginated list.
   */
  getAll: async (): Promise<UserItem[]> => {
    const { data } = await apiClient.get<UserItem[]>("/users/atc/v0");
    return data;
  },

  /**
   * GET /users/atc/v0/paginated
   */
  getPaginated: async (params: UsersParams): Promise<UsersResponse> => {
    const { data } = await apiClient.get<UsersResponse>("/users/atc/v0/paginated", {
      params,
    });
    return data;
  },

  /**
   * GET /users/atc/v0/{id}
   */
  getById: async (id: string): Promise<UserItem> => {
    const { data } = await apiClient.get<UserItem>(`/users/atc/v0/${id}`);
    return data;
  },

  /**
   * GET /users/atc/v0/email/{email}
   */
  getByEmail: async (email: string): Promise<UserItem> => {
    const { data } = await apiClient.get<UserItem>(`/users/atc/v0/email/${email}`);
    return data;
  },

  /**
   * POST /users/atc/v0
   */
  create: async (payload: CreateUserPayload): Promise<UserItem> => {
    const { data } = await apiClient.post<UserItem>("/users/atc/v0", payload);
    return data;
  },

  /**
   * PUT /users/atc/v0/{id}
   */
  update: async (id: string, payload: UpdateUserPayload): Promise<UserItem> => {
    const { data } = await apiClient.put<UserItem>(`/users/atc/v0/${id}`, payload);
    return data;
  },

  /**
   * DELETE /users/atc/v0/{id}
   */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/atc/v0/${id}`);
  },
};

export default usersService;
