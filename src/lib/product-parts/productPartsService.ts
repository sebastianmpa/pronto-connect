import apiClient from "../apiClient";
import type { Brand, ModelsByBrandResponse, WhereUsedItem } from "./types";

/**
 * Product Parts module — ATC product-parts service (diagrams/manuals + where-used lookups).
 */
const productPartsService = {
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

  /**
   * GET /product-parts/atc/v0/brands
   */
  getBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<Brand[]>("/product-parts/atc/v0/brands");
    return data;
  },

  /**
   * GET /product-parts/atc/v0/models/by-brand-id/{brandId}?q=...
   */
  getModelsByBrandId: async (brandId: string, query?: string): Promise<ModelsByBrandResponse> => {
    const { data } = await apiClient.get<ModelsByBrandResponse>(
      `/product-parts/atc/v0/models/by-brand-id/${encodeURIComponent(brandId)}`,
      { params: query?.trim() ? { q: query.trim() } : undefined }
    );
    return data;
  },
};

export default productPartsService;
