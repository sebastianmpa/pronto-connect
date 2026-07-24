import apiClient from "../apiClient";
import type { GlobalSearchResponse } from "./types";

const globalSearchService = {
  /**
   * GET /atc-search/v0/global-search?search={query}
   */
  async search(
    query: string,
    signal?: AbortSignal
  ): Promise<GlobalSearchResponse> {
    const res = await apiClient.get<GlobalSearchResponse>(
      "/atc-search/v0/global-search",
      { params: { search: query }, signal }
    );
    return res.data;
  },
};

export default globalSearchService;
