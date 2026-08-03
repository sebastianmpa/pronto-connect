import apiClient from "../apiClient";
import type {
  SmsTemplatesParams,
  SmsTemplatesResponse,
  SmsTemplateItem,
  CreateSmsTemplatePayload,
  UpdateSmsTemplatePayload,
} from "./types";

/**
 * SMS Templates module — ATC sms-templates service.
 */
const smsTemplatesService = {
  /**
   * GET /sms-templates/atc/v0/paginated
   */
  getPaginated: async (params: SmsTemplatesParams): Promise<SmsTemplatesResponse> => {
    const { data } = await apiClient.get<SmsTemplatesResponse>(
      "/sms-templates/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /sms-templates/atc/v0/{id}
   */
  getById: async (id: string): Promise<SmsTemplateItem> => {
    const { data } = await apiClient.get<SmsTemplateItem>(
      `/sms-templates/atc/v0/${id}`
    );
    return data;
  },

  /**
   * POST /sms-templates/atc/v0
   */
  create: async (payload: CreateSmsTemplatePayload): Promise<SmsTemplateItem> => {
    const { data } = await apiClient.post<SmsTemplateItem>(
      "/sms-templates/atc/v0",
      payload
    );
    return data;
  },

  /**
   * PUT /sms-templates/atc/v0/{id}
   */
  update: async (
    id: string,
    payload: UpdateSmsTemplatePayload
  ): Promise<SmsTemplateItem> => {
    const { data } = await apiClient.put<SmsTemplateItem>(
      `/sms-templates/atc/v0/${id}`,
      payload
    );
    return data;
  },

  /**
   * PUT /sms-templates/atc/v0/{id} — convenience helper for the active toggle.
   */
  setActive: async (id: string, active: boolean): Promise<SmsTemplateItem> => {
    const { data } = await apiClient.put<SmsTemplateItem>(
      `/sms-templates/atc/v0/${id}`,
      { active: active ? "yes" : "no" }
    );
    return data;
  },
};

export default smsTemplatesService;
