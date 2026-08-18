import { idealApiClient } from "../apiClient";
import type {
  PartDetailParams,
  PartDetailResponse,
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

const partsService = {
  async searchBySku(params: PartLookupParams): Promise<PartLookupResponse> {
    assertIdealConfiguration();

    const response = await idealApiClient.get<PartLookupResponse>(
      "/api/parts/lookup",
      {
        params: {
          partNumber: params.partNumber.trim(),
        },
      },
    );

    return response.data;
  },

  async getDetail(params: PartDetailParams): Promise<PartDetailResponse> {
    assertIdealConfiguration();

    const response = await idealApiClient.get<PartDetailResponse>(
      "/api/parts/detail",
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
};

export default partsService;
