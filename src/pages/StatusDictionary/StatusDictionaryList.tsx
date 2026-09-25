import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CustomerMessagesDictionaryTable from "../../components/customer-messages-dictionary/CustomerMessagesDictionaryTable";

export default function StatusDictionaryList() {
  return (
    <>
      <PageMeta title="Status Dictionary | Pronto Connect" description="Order status customer messages" />
      <PageBreadcrumb pageTitle="Status Dictionary" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Status Dictionary">
          <CustomerMessagesDictionaryTable />
        </ComponentCard>
      </div>
    </>
  );
}
