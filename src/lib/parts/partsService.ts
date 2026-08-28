import { idealApiClient } from "../apiClient";
import type {
  PartDetailBcParams,
  PartDetailBcResponse,
  PartDetailParams,
  PartDetailResponse,
  PartLookupApiResponse,
  PartLookupItem,
  PartLookupParams,
  PartLookupResponse,
} from "./types";

function assertIdealConfiguration() {
  const apiUrl = import.meta.env.VITE_IDEAL_API_URL as string | undefined;
  const apiKey = import.meta.env.VITE_IDEAL_API_KEY as string | undefined;

  if (!apiUrl?.trim()) {
    throw new Error("VITE_IDEAL_API_URL is not configured.");
  }

  if (!apiKey?.trim()) {
    throw new Error("VITE_IDEAL_API_KEY is not configured.");
  }
}

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
    assertIdealConfiguration();

    const response = await idealApiClient.get<PartLookupApiResponse>(
      "/api/parts/lookup",
      {
        params: {
          partNumber: params.partNumber.trim(),
        },
      },
    );

    return normalizeLookupResponse(response.data);
  },

  async getDetail(params: PartDetailParams): Promise<PartDetailResponse> {
    assertIdealConfiguration();

    const cleanPo = params.po?.trim();

    const response = await idealApiClient.get<PartDetailResponse>(
      "/api/parts/detail",
      {
        params: {
          mfr: params.mfr.trim(),
          partnumber: params.partNumber.trim(),
          locationid: params.locationId,
          ...(cleanPo ? { po: cleanPo } : {}),
        },
      },
    );

    return response.data;
  },

  async getDetailBc(params: PartDetailBcParams): Promise<PartDetailBcResponse> {
    assertIdealConfiguration();

    const response = await idealApiClient.get<PartDetailBcResponse>(
      "/api/parts/detail-bc",
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
