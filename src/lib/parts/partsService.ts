import { idealApiClient } from "../apiClient";
import type { PartDetailParams, PartDetailResponse } from "./types";

const partsService = {
  async getDetail(params: PartDetailParams): Promise<PartDetailResponse> {
    const apiUrl = import.meta.env.VITE_IDEAL_API_URL as string | undefined;
    const apiKey = import.meta.env.VITE_IDEAL_API_KEY as string | undefined;

    if (!apiUrl?.trim()) {
      throw new Error("VITE_IDEAL_API_URL is not configured.");
    }

    if (!apiKey?.trim()) {
      throw new Error("VITE_IDEAL_API_KEY is not configured.");
    }

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
