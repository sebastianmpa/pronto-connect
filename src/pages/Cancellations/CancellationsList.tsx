import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CancellationsTable from "../../components/cancellations/CancellationsTable";

export default function CancellationsList() {
  return (
    <>
      <PageMeta title="Cancellations | Pronto Connect" description="Order cancellations" />
      <PageBreadcrumb pageTitle="Cancellations" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Cancellation Search">
          <CancellationsTable />
        </ComponentCard>
      </div>
    </>
  );
}
