import apiClient from "../apiClient";
import type {
  OrdersSearchParams,
  OrdersResponse,
  OrderDetail,
  RevertCancellationPayload,
  RevertCancellationResponse,
  AddOrderNoteResponse,
} from "./types";

/**
 * Orders module — ATC customer orders service.
 */
const ordersService = {
  /**
   * GET /customer-orders/atc/v0/orders/search-by-date-range
   */
  searchByDateRange: async (
    params: OrdersSearchParams
  ): Promise<OrdersResponse> => {
    const { data } = await apiClient.get<OrdersResponse>(
      "/customer-orders/atc/v0/orders/search-by-date-range",
      { params }
    );
    return data;
  },

  /**
   * GET /customer-orders/atc/v0/order/{orderNumber}?origin=Pronto Connect
   */
  getOrderDetail: async (orderNumber: string): Promise<OrderDetail> => {
    const { data } = await apiClient.get<OrderDetail>(
      `/customer-orders/atc/v0/order/${orderNumber}`,
      { params: { origin: "Pronto Connect" } }
    );
    return data;
  },

  /**
   * POST /customer-orders/atc/v0/order/{orderNumber}/revert-cancellation
   *
   * Total cancellation:
   *   { type: "Total" }
   *
   * Partial/item cancellation:
   *   { type: "Partial", brand, mpn }
   */
  revertCancellation: async (
    orderNumber: string,
    payload: RevertCancellationPayload,
  ): Promise<RevertCancellationResponse> => {
    const { data } = await apiClient.post<RevertCancellationResponse>(
      `/customer-orders/atc/v0/order/${encodeURIComponent(orderNumber)}/revert-cancellation`,
      payload,
    );
    return data;
  },

  /**
   * POST /customer-orders/atc/v0/order/{orderNumber}/notes
   * Appends text to the current IDEAL order note.
   */
  addOrderNote: async (
    orderNumber: string,
    note: string,
  ): Promise<AddOrderNoteResponse> => {
    const { data } = await apiClient.post<AddOrderNoteResponse>(
      `/customer-orders/atc/v0/order/${encodeURIComponent(orderNumber)}/notes`,
      { note },
    );
    return data;
  },
};

export default ordersService;
