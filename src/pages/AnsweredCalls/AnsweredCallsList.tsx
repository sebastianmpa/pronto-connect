import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import AnsweredCallsTable from "../../components/answered-calls/AnsweredCallsTable";

export default function AnsweredCallsList() {
  return (
    <>
      <PageMeta title="Answered Calls | Pronto Connect" description="Answered call history" />
      <PageBreadcrumb pageTitle="Answered Calls" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Answered Calls">
          <AnsweredCallsTable />
        </ComponentCard>
      </div>
    </>
  );
}
