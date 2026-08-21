import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ManualsSearch from "../../components/product-parts/ManualsSearch";

export default function ManualsList() {
  return (
    <>
      <PageMeta title="Manuals | Pronto Connect" description="Look up product manuals by model name" />
      <PageBreadcrumb pageTitle="Manuals" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Manuals by Model">
          <ManualsSearch />
        </ComponentCard>
      </div>
    </>
  );
}
