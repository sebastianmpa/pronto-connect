import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import DiagramsSearch from "../../components/product-parts/DiagramsSearch";

export default function PartsDiagrams() {
  return (
    <>
      <PageMeta title="Diagrams | Pronto Connect" description="Look up product diagrams and manuals by brand and model" />
      <PageBreadcrumb pageTitle="Diagrams" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Diagrams by Brand">
          <DiagramsSearch />
        </ComponentCard>
      </div>
    </>
  );
}
