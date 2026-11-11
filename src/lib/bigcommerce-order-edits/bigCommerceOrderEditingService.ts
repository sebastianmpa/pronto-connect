import apiClient from "../apiClient";
import type {
  BigCommerceEditableOrder,
  BigCommerceCatalogProductOption,
  BigCommerceCatalogCategory,
  BigCommerceOrderItemChange,
  BigCommerceOrderEditApproval,
  BigCommerceOrderEditAuditEntry,
  BigCommerceOrderEditReason,
  BigCommercePaymentLinkAccess,
  BigCommercePaymentLinkSummary,
} from "./bigCommerceOrderEditingTypes";

const orderPath = (orderNumber: string) => `/customer-orders/atc/v0/orders/${encodeURIComponent(orderNumber)}`;
const modulePath = "/customer-orders/atc/v0";

const bigCommerceOrderEditingService = {
  async getOrder(orderNumber: string) {
    const { data } = await apiClient.get<BigCommerceEditableOrder>(`${orderPath(orderNumber)}/edit`);
    return data;
  },
  async getReasons() {
    const { data } = await apiClient.get<BigCommerceOrderEditReason[]>(`${modulePath}/order-edit-reasons`);
    return data;
  },
  async createReason(name: string) {
    const { data } = await apiClient.post<BigCommerceOrderEditReason>(`${modulePath}/order-edit-reasons`, { name });
    return data;
  },
  async disableReason(reasonId: string) {
    await apiClient.delete(`${modulePath}/order-edit-reasons/${encodeURIComponent(reasonId)}`);
  },
  async getAudit(orderNumber: string) {
    const { data } = await apiClient.get<BigCommerceOrderEditAuditEntry[]>(`${orderPath(orderNumber)}/audit`);
    return data;
  },
  async acquireSession(orderNumber: string) {
    const { data } = await apiClient.post<{ expires_at: string }>(`${orderPath(orderNumber)}/edit-session`);
    return data;
  },
  async renewSession(orderNumber: string) {
    const { data } = await apiClient.put<{ expires_at: string }>(`${orderPath(orderNumber)}/edit-session`);
    return data;
  },
  async releaseSession(orderNumber: string) {
    await apiClient.delete(`${orderPath(orderNumber)}/edit-session`);
  },
  async searchProducts(orderNumber: string, query: string, categoryId?: number | null) {
    const { data } = await apiClient.get<BigCommerceCatalogProductOption[]>(`${orderPath(orderNumber)}/products/search`, { params: { ...(query ? { q: query } : {}), ...(categoryId ? { category_id: categoryId } : {}) } });
    return data;
  },
  async getProductCategories(orderNumber: string) {
    const { data } = await apiClient.get<BigCommerceCatalogCategory[]>(`${orderPath(orderNumber)}/products/categories`);
    return data;
  },
  async saveItems(orderNumber: string, reasonId: string, items: BigCommerceOrderItemChange[]) {
    const { data } = await apiClient.put(`${orderPath(orderNumber)}/items`, { reason_id: reasonId, items });
    return data;
  },
  async requestApproval(orderNumber: string, reasonId: string, items: BigCommerceOrderItemChange[]) {
    const { data } = await apiClient.post(`${orderPath(orderNumber)}/edit-approvals`, { reason_id: reasonId, items });
    return data;
  },
  async listApprovals() {
    const { data } = await apiClient.get<BigCommerceOrderEditApproval[]>(`${modulePath}/order-edit-approvals`, { params: { status: "pending" } });
    return data;
  },
  async decideApproval(id: string, decision: "approved" | "rejected", note?: string) {
    const { data } = await apiClient.post(`${modulePath}/order-edit-approvals/${encodeURIComponent(id)}/decision`, { decision, note });
    return data;
  },
  async createPaymentLink(orderNumber: string) {
    const { data } = await apiClient.post<BigCommercePaymentLinkSummary & { url: string }>(`${orderPath(orderNumber)}/payment-links`);
    return data;
  },
  async cancelPaymentLink(orderNumber: string, linkId: string) {
    await apiClient.delete(`${orderPath(orderNumber)}/payment-links/${encodeURIComponent(linkId)}`);
  },
  async getPublicPaymentLink(token: string) {
    const { data } = await apiClient.get<BigCommercePaymentLinkAccess>(`${modulePath}/customer-payment-links/${encodeURIComponent(token)}`);
    return data;
  },
};

export default bigCommerceOrderEditingService;
