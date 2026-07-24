import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CustomersTable from "../../components/customers/CustomersTable";

export default function CustomersList() {
  return (
    <>
      <PageMeta title="Customers | Pronto Connect" description="Customer search" />
      <PageBreadcrumb pageTitle="Customers" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Customer Search">
          <CustomersTable />
        </ComponentCard>
      </div>
    </>
  );
}
