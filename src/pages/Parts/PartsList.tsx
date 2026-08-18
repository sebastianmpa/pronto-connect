import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PartsTable from "../../components/parts/PartsTable";

export default function PartsList() {
  return (
    <>
      <PageMeta title="Parts | Pronto Connect" description="Part search and lookup" />
      <PageBreadcrumb pageTitle="Parts" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Part Search">
          <PartsTable />
        </ComponentCard>
      </div>
    </>
  );
}
