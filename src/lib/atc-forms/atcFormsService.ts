import apiClient from "../apiClient";
import type {
  AtcFormItem,
  AtcFormTicketResponse,
  AtcFormsParams,
  AtcFormsResponse,
  AtcFormTypesResponse,
  AtcFormSubmissionResponse,
  AtcFormSubmissionType,
  Fac005ClaimConversionResponse,
  Fac005ClaimDetailsResponse,
  Fac005ImageRetryResponse,
} from "./types";

/**
 * Client Requests module — ATC "atc-forms" service (claims, returns, feedback, cancellations).
 */
const atcFormsService = {
  getTicket: async (id: number, from = 0): Promise<AtcFormTicketResponse> => {
    const { data } = await apiClient.get<AtcFormTicketResponse>(
      `/atc-forms/atc/v0/${id}/ticket`,
      { params: { from, limit: 10 } },
    );
    return data;
  },

  getTicketAttachment: async (formId: number, threadId: string | null, attachmentId: string): Promise<Blob> => {
    const path = threadId
      ? `/atc-forms/atc/v0/${formId}/ticket/threads/${threadId}/attachments/${attachmentId}`
      : `/atc-forms/atc/v0/${formId}/ticket/attachments/${attachmentId}`;
    const { data } = await apiClient.get<Blob>(
      path,
      { responseType: "blob" },
    );
    return data;
  },

  replyToTicket: async (id: number, content: string): Promise<{ replyId: string; atcFormStatus: string; statusUpdateFailed: boolean }> => {
    const { data } = await apiClient.post<{ replyId: string; atcFormStatus: string; statusUpdateFailed: boolean }>(
      `/atc-forms/atc/v0/${id}/ticket/reply`,
      { content },
    );
    return data;
  },

  closeTicket: async (id: number): Promise<{ status: string; statusType: string; atcFormStatus: string; statusUpdateFailed: boolean }> => {
    const { data } = await apiClient.post<{ status: string; statusType: string; atcFormStatus: string; statusUpdateFailed: boolean }>(
      `/atc-forms/atc/v0/${id}/ticket/close`,
    );
    return data;
  },

  reopenTicket: async (id: number): Promise<{ status: string; statusType: string; atcFormStatus: string; statusUpdateFailed: boolean }> => {
    const { data } = await apiClient.post<{ status: string; statusType: string; atcFormStatus: string; statusUpdateFailed: boolean }>(
      `/atc-forms/atc/v0/${id}/ticket/reopen`,
    );
    return data;
  },
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

  /** Returns the FAC005 case, its image-sync summary, and attachment links. */
  getFac005ClaimDetails: async (id: number): Promise<Fac005ClaimDetailsResponse> => {
    const { data } = await apiClient.get<Fac005ClaimDetailsResponse>(
      `/atc-forms/atc/v0/${id}/fac005-claim`,
    );
    return data;
  },

  /** Retries only the original Claim-form images that are not yet synchronized. */
  retryFac005ClaimImages: async (id: number): Promise<Fac005ImageRetryResponse> => {
    const { data } = await apiClient.post<Fac005ImageRetryResponse>(
      `/atc-forms/atc/v0/${id}/fac005-claim/images/retry`,
    );
    return data;
  },
};

export default atcFormsService;
