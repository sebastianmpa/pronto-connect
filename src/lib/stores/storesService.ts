import apiClient from "../apiClient";
import type { Store } from "./types";

/**
 * Stores module — ATC stores service.
 * Note: the response also carries BigCommerce credentials (clientSecret/accessToken).
 * Only display-safe fields (name, urlStore, etc.) should ever be used in the UI.
 */
const storesService = {
  /**
   * GET /stores/atc/v0/
   */
  getAll: async (): Promise<Store[]> => {
    const { data } = await apiClient.get<Store[]>("/stores/atc/v0/");
    return data;
  },
};

export default storesService;
