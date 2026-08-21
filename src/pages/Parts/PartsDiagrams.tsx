import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

export default function PartsDiagrams() {
  return (
    <>
      <PageMeta title="Diagrams | Pronto Connect" description="Parts diagrams" />
      <PageBreadcrumb pageTitle="Diagrams" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Diagrams">
          <p className="py-10 text-center text-sm text-gray-400">
            This module is coming soon.
          </p>
        </ComponentCard>
      </div>
    </>
  );
}
