import apiClient from "../apiClient";
import type {
  EmailTemplatesParams,
  EmailTemplatesResponse,
  EmailTemplateItem,
  CreateEmailTemplatePayload,
  UpdateEmailTemplatePayload,
} from "./types";

/**
 * Email Templates module — ATC email-templates service.
 */
const emailTemplatesService = {
  /**
   * GET /email-templates/atc/v0/paginated
   */
  getPaginated: async (params: EmailTemplatesParams): Promise<EmailTemplatesResponse> => {
    const { data } = await apiClient.get<EmailTemplatesResponse>(
      "/email-templates/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /email-templates/atc/v0/{id}
   */
  getById: async (id: number): Promise<EmailTemplateItem> => {
    const { data } = await apiClient.get<EmailTemplateItem>(
      `/email-templates/atc/v0/${id}`
    );
    return data;
  },

  /**
   * POST /email-templates/atc/v0
   */
  create: async (payload: CreateEmailTemplatePayload): Promise<EmailTemplateItem> => {
    const { data } = await apiClient.post<EmailTemplateItem>(
      "/email-templates/atc/v0",
      payload
    );
    return data;
  },

  /**
   * PUT /email-templates/atc/v0/{id}
   */
  update: async (
    id: number,
    payload: UpdateEmailTemplatePayload
  ): Promise<EmailTemplateItem> => {
    const { data } = await apiClient.put<EmailTemplateItem>(
      `/email-templates/atc/v0/${id}`,
      payload
    );
    return data;
  },

  /**
   * PUT /email-templates/atc/v0/{id} — convenience helper for the active toggle.
   */
  setActive: async (id: number, active: boolean): Promise<EmailTemplateItem> => {
    const { data } = await apiClient.put<EmailTemplateItem>(
      `/email-templates/atc/v0/${id}`,
      { active: active ? "Y" : "N" }
    );
    return data;
  },
};

export default emailTemplatesService;
