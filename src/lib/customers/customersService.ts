import apiClient from "../apiClient";
import type {
  CustomersSearchParams,
  CustomersResponse,
  CustomerDetail,
} from "./types";

const customersService = {
  async search(params: CustomersSearchParams): Promise<CustomersResponse> {
    const p: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      // "ideal" isn't a real store URL — the API 404s if it's sent, so omit it.
      ...(params.store_url && params.store_url !== "ideal" && { store_url: params.store_url }),
      ...(params.name  && { name:  params.name }),
      ...(params.email && { email: params.email }),
      ...(params.phone && { phone: params.phone }),
    };
    const res = await apiClient.get<CustomersResponse>(
      "/customers/atc/v0/by-store",
      { params: p }
    );
    return res.data;
  },

  async getDetail(
    store: string,
    email: string,
    id: string
  ): Promise<CustomerDetail> {
    const res = await apiClient.get<CustomerDetail>(
      "/customers/atc/v0/by-store/details",
      { params: { store, email, id } }
    );
    return res.data;
  },
};

export default customersService;
