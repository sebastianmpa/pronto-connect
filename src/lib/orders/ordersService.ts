import apiClient from "../apiClient";
import type { OrdersSearchParams, OrdersResponse, OrderDetail } from "./types";

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
};

export default ordersService;
