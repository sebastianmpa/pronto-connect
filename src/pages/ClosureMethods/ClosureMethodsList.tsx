import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ClosureMethodsTable from "../../components/closure-methods/ClosureMethodsTable";

export default function ClosureMethodsList() {
  return (
    <>
      <PageMeta title="Closure Methods | Pronto Connect" description="Closure method management" />
      <PageBreadcrumb pageTitle="Closure Methods" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Closure Methods">
          <ClosureMethodsTable />
        </ComponentCard>
      </div>
    </>
  );
}
