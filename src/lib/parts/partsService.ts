import apiClient from "../apiClient";
import type {
  PartDetailBcParams,
  PartDetailBcResponse,
  PartDetailParams,
  PartDetailResponse,
  PartLookupApiResponse,
  PartLookupItem,
  PartLookupParams,
  PartLookupResponse,
  SupplierStockParams,
  SupplierStockResponse,
} from "./types";


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTotal(meta: unknown, directTotal: unknown, fallback: number): number {
  let candidate = directTotal;

  if (isRecord(meta) && meta.total !== undefined && meta.total !== null) {
    candidate = meta.total;
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLookupResponse(response: PartLookupApiResponse): PartLookupResponse {
  if (Array.isArray(response)) {
    return {
      items: response,
      meta: { total: response.length },
    };
  }

  if (isRecord(response)) {
    const items = Array.isArray(response.items)
      ? (response.items as PartLookupItem[])
      : Array.isArray(response.data)
        ? (response.data as PartLookupItem[])
        : Array.isArray(response.results)
          ? (response.results as PartLookupItem[])
          : null;

    if (items) {
      return {
        items,
        meta: {
          total: readTotal(response.meta, response.total, items.length),
        },
      };
    }
  }

  return {
    items: [response as PartLookupItem],
    meta: { total: 1 },
  };
}

const partsService = {
  async searchBySku(params: PartLookupParams): Promise<PartLookupResponse> {

    const response = await apiClient.get<PartLookupApiResponse>(
      "/supplier-stock/v0/ideal/lookup",
      {
        params: {
          partNumber: params.partNumber.trim(),
        },
      },
    );

    return normalizeLookupResponse(response.data);
  },

  async getDetail(params: PartDetailParams): Promise<PartDetailResponse> {

    const response = await apiClient.get<PartDetailResponse>(
      "/supplier-stock/v0/ideal/detail",
      {
        params: {
          mfr: params.mfr.trim(),
          partnumber: params.partNumber.trim(),
          locationid: params.locationId,
        },
      },
    );

    return response.data;
  },

  /**
   * GET /supplier-stock/v0/stock — Pronto Connect's own part-detail/stock
   * endpoint (main ATC client, not the Ideal service). See SupplierStockResponse
   * for the TABLE / queued-SCRAPPER / finished-SCRAPPER cases; callers are
   * responsible for polling while job_status !== "finished".
   */
  async getSupplierStock(params: SupplierStockParams): Promise<SupplierStockResponse> {
    const { data } = await apiClient.get<SupplierStockResponse>(
      "/supplier-stock/v0/stock",
      {
        params: {
          mfr_id: params.mfrId.trim(),
          part_number: params.partNumber.trim(),
          locationid: params.locationId,
          force: params.force ?? true,
        },
      },
    );

    return data;
  },

  async getDetailBc(params: PartDetailBcParams): Promise<PartDetailBcResponse> {

    const response = await apiClient.get<PartDetailBcResponse>(
      "/supplier-stock/v0/ideal/detail-bc",
      {
        params: {
          storeid: params.storeId,
          brand: params.brand.trim(),
          mpn: params.mpn.trim(),
        },
      },
    );

    return response.data;
  },
};

export default partsService;
