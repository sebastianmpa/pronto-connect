import apiClient from "../apiClient";
import type { TicketsParams, TicketsResponse, TicketDetail } from "./types";

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
  getById: async (id: string): Promise<TicketDetail> => {
    const { data } = await apiClient.get<TicketDetail>(`/tickets/atc/v0/${id}`);
    return data;
  },
};

export default ticketsService;
