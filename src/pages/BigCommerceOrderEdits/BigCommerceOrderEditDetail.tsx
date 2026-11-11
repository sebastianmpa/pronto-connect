import { Link, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BigCommerceOrderEditingWorkspace from "../../components/bigcommerce-order-edits/BigCommerceOrderEditingWorkspace";

export default function BigCommerceOrderEditDetail() {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();

  return <>
    <PageMeta title={`BigCommerce Order #${orderNumber} | Pronto Connect`} description="Review and edit a BigCommerce order" />
    <PageBreadcrumb pageTitle="BigCommerce Order Detail" />
    <main className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <Link to="/bigcommerce-order-edits" className="mb-5 inline-flex text-sm text-brand-500 hover:underline">← Back to BigCommerce orders</Link>
      {orderNumber && <BigCommerceOrderEditingWorkspace orderNumber={orderNumber} />}
    </main>
  </>;
}
