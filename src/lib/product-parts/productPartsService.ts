import apiClient from "../apiClient";
import type { ModelManuals, WhereUsedItem } from "./types";

/**
 * Product Parts module — ATC product-parts service (manuals lookup).
 */
const productPartsService = {
  /**
   * GET /product-parts/atc/v0/models/manuals-by-model-name/{modelName}
   */
  getManualsByModelName: async (modelName: string): Promise<ModelManuals[]> => {
    const { data } = await apiClient.get<ModelManuals[]>(
      `/product-parts/atc/v0/models/manuals-by-model-name/${encodeURIComponent(modelName)}`
    );
    return data;
  },

  /**
   * GET /product-parts/atc/v0/parts/where-used?sku=...&brand_name=...
   * Response is nested (array of arrays); flattened here for callers.
   */
  getWhereUsed: async (sku: string, brandName: string): Promise<WhereUsedItem[]> => {
    const { data } = await apiClient.get<WhereUsedItem[][] | WhereUsedItem[]>(
      "/product-parts/atc/v0/parts/where-used",
      { params: { sku, brand_name: brandName } }
    );
    return Array.isArray(data) ? (data as WhereUsedItem[][]).flat() : [];
  },
};

export default productPartsService;
