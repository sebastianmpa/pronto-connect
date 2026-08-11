import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import EmailLogsTable from "../../components/email-logs/EmailLogsTable";

export default function EmailLogsList() {
  return (
    <>
      <PageMeta
        title="Email Logs | Pronto Connect"
        description="Email logs list"
      />
      <PageBreadcrumb pageTitle="Email Logs" />

      <div className="space-y-5 sm:space-y-6">
        <ComponentCard
          title="Email Logs"
          desc="Search email activity using the filters supported by the email logs service."
        >
          <EmailLogsTable />
        </ComponentCard>
      </div>
    </>
  );
}
