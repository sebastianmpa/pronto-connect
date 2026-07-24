import type { CustomerDetail } from "../customers/types";
import type { OrderDetail } from "../orders/types";

export interface GlobalSearchCustomerResult {
  result_type: "customer";
  result: CustomerDetail;
}

export interface GlobalSearchOrderResult {
  result_type: "order";
  result: OrderDetail;
}

export type GlobalSearchResponse =
  | GlobalSearchCustomerResult
  | GlobalSearchOrderResult;
