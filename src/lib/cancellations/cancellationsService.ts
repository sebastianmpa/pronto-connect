import apiClient from "../apiClient";
import type {
  CancellationsParams,
  CancellationsResponse,
  CancellationUsersResponse,
  CancellationReasonsResponse,
  CancellationDetail,
  CreateCancellationPayload,
  CreateCancellationResult,
} from "./types";

/**
 * Cancellations module — ATC cancellations service.
 */
const cancellationsService = {
  /**
   * GET /cancellations/atc/v0/paginated
   */
  getPaginated: async (params: CancellationsParams): Promise<CancellationsResponse> => {
    const { data } = await apiClient.get<CancellationsResponse>(
      "/cancellations/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /cancellations/atc/v0/users
   */
  getUsers: async (): Promise<string[]> => {
    const { data } = await apiClient.get<CancellationUsersResponse>(
      "/cancellations/atc/v0/users"
    );
    return data.users ?? [];
  },

  /**
   * GET /cancellations/atc/v0/reasons
   */
  getReasons: async (): Promise<string[]> => {
    const { data } = await apiClient.get<CancellationReasonsResponse>(
      "/cancellations/atc/v0/reasons"
    );
    return data.reasons ?? [];
  },

  /**
   * GET /cancellations/atc/v0/{salesOrderId}
   */
  getById: async (salesOrderId: number | string): Promise<CancellationDetail> => {
    const { data } = await apiClient.get<CancellationDetail>(
      `/cancellations/atc/v0/${salesOrderId}`
    );
    return data;
  },

  /**
   * POST /cancellations/atc/v0 — submit a new (total or partial) order cancellation.
   */
  submit: async (payload: CreateCancellationPayload): Promise<CreateCancellationResult> => {
    const { data } = await apiClient.post<CreateCancellationResult>(
      "/cancellations/atc/v0",
      payload
    );
    return data;
  },
};

export default cancellationsService;
