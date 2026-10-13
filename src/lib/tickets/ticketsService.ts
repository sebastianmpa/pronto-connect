import apiClient from "../apiClient";
import type { TicketsParams, TicketsResponse, TicketDetail, TicketDepartmentOption, TicketAgentOption } from "./types";

/**
 * Tickets module — ATC Zoho tickets service.
 */
const ticketsService = {
  /**
   * GET /tickets/atc/v0/paginated
   */
  getPaginated: async (params: TicketsParams): Promise<TicketsResponse> => {
    const { data } = await apiClient.get<TicketsResponse>(
      "/tickets/atc/v0/paginated",
      { params }
    );
    return data;
  },

  /**
   * GET /tickets/atc/v0/{id}
   */
  getDepartments: async (): Promise<TicketDepartmentOption[]> => {
    const { data } = await apiClient.get<TicketDepartmentOption[]>("/tickets/atc/v0/departments");
    return data;
  },

  getAgents: async (departmentId?: string): Promise<TicketAgentOption[]> => {
    const { data } = await apiClient.get<TicketAgentOption[]>("/tickets/atc/v0/agents", {
      params: departmentId ? { department_id: departmentId } : {},
    });
    return data;
  },

  getById: async (id: string): Promise<TicketDetail> => {
    const { data } = await apiClient.get<TicketDetail>(`/tickets/atc/v0/${id}`);
    return data;
  },
};

export default ticketsService;
