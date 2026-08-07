import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import AtcFormsTable from "../../components/atc-forms/AtcFormsTable";

export default function ClientRequestsList() {
  return (
    <>
      <PageMeta title="Client Requests | Pronto Connect" description="Claims, returns, feedback and cancellation requests" />
      <PageBreadcrumb pageTitle="Client Requests" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Client Requests">
          <AtcFormsTable />
        </ComponentCard>
      </div>
    </>
  );
}
