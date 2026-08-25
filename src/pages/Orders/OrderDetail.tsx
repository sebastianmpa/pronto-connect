import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import OrderDetailView from "../../components/orders/OrderDetailView";
import ordersService from "../../lib/orders/ordersService";
import customersService from "../../lib/customers/customersService";
import type { OrderDetail as OrderDetailType } from "../../lib/orders/types";
import type { CustomerHistory } from "../../lib/customers/types";

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? "/orders";

  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<CustomerHistory | null>(null);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    ordersService
      .getOrderDetail(orderNumber)
      .then(setOrder)
      .catch(() => setError("Could not load order details. Please try again."))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    if (!order) {
      setPurchaseHistory(null);
      setPurchaseHistoryLoading(false);
      return;
    }

    const customerId = String(order.header?.customer_id ?? "").trim();
    const customerEmail = String(
      order.header?.billing_address?.email ??
        order.shipping_addresses?.[0]?.email ??
        "",
    ).trim();

    // Reuse the exact same customer-detail service/endpoint used by Customer Detail.
    // GET /customers/atc/v0/by-store/details?email=...&id=...
    if (!customerId) {
      setPurchaseHistory(null);
      setPurchaseHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setPurchaseHistoryLoading(true);

    customersService
      .getDetail(customerEmail, customerId)
      .then((detail) => {
        if (!cancelled) {
          setPurchaseHistory(detail.history ?? null);
        }
      })
      .catch(() => {
        // Purchase History must not block the order detail if the customer endpoint fails.
        if (!cancelled) {
          setPurchaseHistory(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPurchaseHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order]);

  const refetch = () => {
    if (!orderNumber) return;
    ordersService.getOrderDetail(orderNumber).then(setOrder).catch(() => {});
  };

  return (
    <>
      <PageMeta
        title={`Order #${orderNumber} | Pronto Connect`}
        description="Order detail"
      />
      <PageBreadcrumb pageTitle="Order Detail" />

      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-sm">
        {/* Back button */}
        <button
          onClick={() => navigate(backTo)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && order && (
          <OrderDetailView
            order={order}
            onCancelled={refetch}
            purchaseHistory={purchaseHistory}
            purchaseHistoryLoading={purchaseHistoryLoading}
          />
        )}
      </div>
    </>
  );
}
