import apiClient from "../apiClient";
import type {
  CustomerContactsParams,
  CustomerContactDetail,
  CustomerContactsResponse,
  MarkCustomerContactPayload,
  MarkCustomerContactResponse,
  SaveCustomerContactRequestPayload,
  SaveCustomerContactRequestResponse,
} from "./types";

let onHoldReasonOptionsCache: string[] | null = null;
let onHoldReasonOptionsRequest: Promise<string[]> | null = null;
const customerContactsRequests = new Map<
  string,
  Promise<CustomerContactsResponse>
>();

function buildQueryParams(params: CustomerContactsParams) {
  return {
    limit: params.limit,
    offset: params.offset,
    ...(params.since ? { since: params.since } : {}),
    ...(params.until ? { until: params.until } : {}),
    ...(params.customer_id ? { customer_id: params.customer_id } : {}),
    ...(params.order_id ? { order_id: params.order_id } : {}),
    ...(params.reason_id ? { reason_id: params.reason_id } : {}),
  };
}

function fetchCustomerContacts(
  params: CustomerContactsParams
): Promise<CustomerContactsResponse> {
  const queryParams = buildQueryParams(params);
  const requestKey = JSON.stringify(queryParams);
  const existingRequest = customerContactsRequests.get(requestKey);

  if (existingRequest) return existingRequest;

  const request = apiClient
    .get<CustomerContactsResponse>("/contact-requests/atc/v0", {
      params: queryParams,
    })
    .then(({ data }) => data)
    .finally(() => {
      customerContactsRequests.delete(requestKey);
    });

  customerContactsRequests.set(requestKey, request);
  return request;
}


const customerContactsService = {
  /** GET /contact-requests/atc/v0 */
  getAll: async (
    params: CustomerContactsParams
  ): Promise<CustomerContactsResponse> => fetchCustomerContacts(params),

  /** GET /contact-requests/atc/v0/reasons */
  getOnHoldReasonOptions: async (): Promise<string[]> => {
    if (onHoldReasonOptionsCache) return onHoldReasonOptionsCache;

    if (!onHoldReasonOptionsRequest) {
      onHoldReasonOptionsRequest = apiClient
        .get<{ items: string[] }>("/contact-requests/atc/v0/reasons")
        .then(({ data }) => {
          onHoldReasonOptionsCache = Array.isArray(data.items) ? data.items : [];
          return onHoldReasonOptionsCache;
        })
        .finally(() => {
          onHoldReasonOptionsRequest = null;
        });
    }

    return onHoldReasonOptionsRequest;
  },

  /** GET /contact-requests/atc/v0/:contactRequestId */
  getById: async (
    contactRequestId: string | number
  ): Promise<CustomerContactDetail> => {
    const encodedId = encodeURIComponent(String(contactRequestId));
    const { data } = await apiClient.get<CustomerContactDetail>(
      `/contact-requests/atc/v0/${encodedId}`
    );

    return data;
  },

  /**
   * POST /contact-requests/atc/v0
   *
   * CREATE:
   *   order_id = listing.order_id
   *   no contact_request_id
   *
   * EDIT:
   *   order_id = detail.order_id
   *   contact_request_id = listing/detail contact_request_id
   */
  saveContactRequest: async (
    payload: SaveCustomerContactRequestPayload
  ): Promise<SaveCustomerContactRequestResponse> => {
    const { data } = await apiClient.post<SaveCustomerContactRequestResponse>(
      "/contact-requests/atc/v0",
      payload
    );

    return data;
  },

  /** POST /customer-orders/atc/v0/:orderId/contact */
  markAsContacted: async (
    orderId: string | number,
    payload: MarkCustomerContactPayload
  ): Promise<MarkCustomerContactResponse> => {
    const encodedOrderId = encodeURIComponent(String(orderId));
    const { data } = await apiClient.post<MarkCustomerContactResponse>(
      `/customer-orders/atc/v0/${encodedOrderId}/contact`,
      payload
    );

    return data;
  },
};

export default customerContactsService;
