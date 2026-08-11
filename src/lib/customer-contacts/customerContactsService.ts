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

const REASON_OPTIONS_PAGE_SIZE = 100;

let onHoldReasonOptionsCache: string[] | null = null;
let onHoldReasonOptionsRequest: Promise<string[]> | null = null;

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

async function fetchCustomerContacts(
  params: CustomerContactsParams
): Promise<CustomerContactsResponse> {
  const { data } = await apiClient.get<CustomerContactsResponse>(
    "/contact-requests/atc/v0",
    { params: buildQueryParams(params) }
  );

  return data;
}

async function fetchAllOnHoldReasonOptions(): Promise<string[]> {
  const reasons = new Set<string>();
  let offset = 0;

  while (true) {
    const response = await fetchCustomerContacts({
      limit: REASON_OPTIONS_PAGE_SIZE,
      offset,
    });

    const items = Array.isArray(response.items) ? response.items : [];

    items.forEach((item) => {
      const reason = item.onhold_reason?.trim();
      if (reason) reasons.add(reason);
    });

    if (items.length === 0) break;

    offset += items.length;

    const total = Number(response.meta?.total);
    if (Number.isFinite(total) && offset >= total) break;

    if (!Number.isFinite(total) && items.length < REASON_OPTIONS_PAGE_SIZE) {
      break;
    }
  }

  return Array.from(reasons).sort((left, right) => left.localeCompare(right));
}

const customerContactsService = {
  /** GET /contact-requests/atc/v0 */
  getAll: async (
    params: CustomerContactsParams
  ): Promise<CustomerContactsResponse> => fetchCustomerContacts(params),

  /** Temporary source for the Reason filter until a catalog endpoint exists. */
  getOnHoldReasonOptions: async (): Promise<string[]> => {
    if (onHoldReasonOptionsCache) return onHoldReasonOptionsCache;

    if (!onHoldReasonOptionsRequest) {
      onHoldReasonOptionsRequest = fetchAllOnHoldReasonOptions()
        .then((options) => {
          onHoldReasonOptionsCache = options;
          return options;
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
