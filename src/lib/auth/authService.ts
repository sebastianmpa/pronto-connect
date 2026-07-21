import apiClient from "../apiClient";
import type { LoginRequest, AuthResponse } from "./types";

/**
 * Auth module — ATC authentication service.
 * All calls are relative to the baseURL defined in apiClient.
 */
const authService = {
  /**
   * POST /atc-auth/atc/v0/access-token
   * Returns a JWT access token for ATC users.
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      "/atc-auth/atc/v0/access-token",
      credentials
    );
    return data;
  },
};

export default authService;
