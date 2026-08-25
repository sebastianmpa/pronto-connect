import { isAxiosError } from "axios";
import apiClient from "../apiClient";

export type CustomerAddressType = "shipping" | "billing";

export interface UpdateCustomerInfoPayload {
  address_type: CustomerAddressType;
  email?: string;
  phone?: string;
  street_1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface UpdateCustomerInfoResponse {
  success: boolean;
  order_number?: string;
  order_id?: number;
  address_type?: CustomerAddressType;
  shipping_address_id?: number;
  shipping_address?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
  shipping_cost_and_tax_recalculated?: boolean;
  shipworks?: {
    order_found?: boolean;
    updated?: boolean;
  };
  message?: string;
  code?: string;
}

export function getCustomerInfoUpdateError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | {
          message?: string;
          code?: string;
          errors?: string[] | Record<string, unknown>;
        }
      | undefined;

    if (status === 401) {
      return "Your session is not authorized to update the order. Please sign in again.";
    }

    if (status === 403) {
      return "Your user does not have permission to update customer information.";
    }

    if (status === 404) {
      return data?.message || "The order or requested address was not found.";
    }

    if (status === 409) {
      if (data?.code === "MULTIPLE_SHIPPING_ADDRESSES") {
        return "This order has multiple shipping addresses and cannot be updated automatically.";
      }

      if (data?.code === "SHIPPING_ADDRESS_ALREADY_SHIPPED") {
        return "The shipping address cannot be changed because items from this order have already been shipped.";
      }

      return data?.message || "The order cannot be updated in its current state.";
    }

    if (status === 503) {
      return data?.message || "BigCommerce is currently unavailable. Please try again.";
    }

    if (Array.isArray(data?.errors)) {
      const messages = data.errors.filter(
        (item): item is string => typeof item === "string" && item.trim() !== "",
      );

      if (messages.length > 0) return messages.join(" ");
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Customer information could not be updated.";
}

const orderCustomerInfoService = {
  async updateCustomerInfo(
    orderNumber: string,
    payload: UpdateCustomerInfoPayload,
  ): Promise<UpdateCustomerInfoResponse> {
    const response = await apiClient.put<UpdateCustomerInfoResponse>(
      `/customer-orders/atc/v0/order/${encodeURIComponent(orderNumber)}/shipping-address`,
      payload,
    );

    return response.data;
  },
};

export default orderCustomerInfoService;
