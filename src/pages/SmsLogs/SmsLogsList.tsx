import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import SmsLogsTable from "../../components/sms-logs/SmsLogsTable";

export default function SmsLogsList() {
  return (
    <>
      <PageMeta title="SMS Logs | TailAdmin" description="SMS logs list" />
      <PageBreadcrumb pageTitle="SMS Logs" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="SMS Logs">
          <SmsLogsTable />
        </ComponentCard>
      </div>
    </>
  );
}
