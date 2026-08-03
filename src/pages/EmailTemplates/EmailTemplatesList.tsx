import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import EmailTemplatesTable from "../../components/email-templates/EmailTemplatesTable";

export default function EmailTemplatesList() {
  return (
    <>
      <PageMeta title="Email Templates | Pronto Connect" description="Email template management" />
      <PageBreadcrumb pageTitle="Email Templates" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Email Templates">
          <EmailTemplatesTable />
        </ComponentCard>
      </div>
    </>
  );
}
