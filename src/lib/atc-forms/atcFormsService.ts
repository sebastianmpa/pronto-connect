import apiClient from "../apiClient";
import type {
  AtcFormItem,
  AtcFormsParams,
  AtcFormsResponse,
  AtcFormTypesResponse,
  AtcFormSubmissionResponse,
  AtcFormSubmissionType,
  Fac005ClaimConversionResponse,
} from "./types";

/**
 * Client Requests module — ATC "atc-forms" service (claims, returns, feedback, cancellations).
 */
const atcFormsService = {
  /**
   * GET /atc-forms/atc/v0/paginated
   */
  getPaginated: async (params: AtcFormsParams): Promise<AtcFormsResponse> => {
    const { data } = await apiClient.get<AtcFormsResponse>(
      "/atc-forms/atc/v0/paginated",
      { params },
    );
    return data;
  },

  /**
   * GET /atc-forms/atc/v0/types
   * Returns the normalized distinct Client Request types available in the backend.
   */
  getTypes: async (): Promise<AtcFormTypesResponse> => {
    const { data } = await apiClient.get<AtcFormTypesResponse>(
      "/atc-forms/atc/v0/types",
    );

    return {
      form_types: Array.isArray(data?.form_types) ? data.form_types : [],
    };
  },

  /**
   * PUT /atc-forms/atc/v0/{id}/status
   *
   * IMPORTANT: id is the atc_forms record ID, not the order number.
   * The backend returns the updated ATC form directly.
   */
  updateStatus: async (id: number, status: string): Promise<AtcFormItem> => {
    const { data } = await apiClient.put<AtcFormItem>(
      `/atc-forms/atc/v0/${id}/status`,
      { status },
    );

    return data;
  },

  /**
   * Creates a Client Request from the ATC application. FormData preserves the
   * optional image attachments accepted by Claim and Return submissions.
   */
  submit: async (
    type: AtcFormSubmissionType,
    payload: FormData,
  ): Promise<AtcFormSubmissionResponse> => {
    const pathByType: Record<AtcFormSubmissionType, string> = {
      claim: "/claims/atc/v0/submit",
      return: "/returns/atc/v0/submit",
      cancellation: "/cancellations/atc/v0/submit",
    };
    const { data } = await apiClient.post<AtcFormSubmissionResponse>(
      pathByType[type],
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return data;
  },

  /** Converts a supported Claim Client Request into a FAC005 case. */
  convertClaimToFac005: async (
    id: number,
    responsibleArea: string,
    comments: string,
  ): Promise<Fac005ClaimConversionResponse> => {
    const { data } = await apiClient.post<Fac005ClaimConversionResponse>(
      `/atc-forms/atc/v0/${id}/fac005-claim`,
      { responsible_area: responsibleArea, comments },
    );
    return data;
  },
};

export default atcFormsService;
