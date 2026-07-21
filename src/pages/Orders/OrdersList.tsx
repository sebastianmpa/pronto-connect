import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import OrdersTable from "../../components/orders/OrdersTable";

export default function OrdersList() {
  return (
    <>
      <PageMeta
        title="Orders | TailAdmin"
        description="Customer orders list"
      />
      <PageBreadcrumb pageTitle="Orders" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Customer Orders">
          <OrdersTable />
        </ComponentCard>
      </div>
    </>
  );
}
