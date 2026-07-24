import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerDetailView from "../../components/customers/CustomerDetailView";
import customersService from "../../lib/customers/customersService";
import type { CustomerDetail as CustomerDetailType } from "../../lib/customers/types";

export default function CustomerDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const store = searchParams.get("store") ?? "";
  const email = searchParams.get("email") ?? "";
  const id = searchParams.get("id") ?? "";

  const [detail, setDetail] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!store || !id) return;
    setLoading(true);
    setError(null);
    customersService
      .getDetail(store, email, id)
      .then(setDetail)
      .catch(() => setError("Could not load customer details. Please try again."))
      .finally(() => setLoading(false));
  }, [store, email, id]);

  return (
    <>
      <PageMeta title={`Customer #${id} | Pronto Connect`} description="Customer detail" />
      <PageBreadcrumb pageTitle="Customer Detail" />

      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900 shadow-sm">
        {/* Back */}
        <button
          onClick={() => navigate("/customers")}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Customers
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

        {!loading && !error && detail && <CustomerDetailView detail={detail} />}
      </div>
    </>
  );
}
