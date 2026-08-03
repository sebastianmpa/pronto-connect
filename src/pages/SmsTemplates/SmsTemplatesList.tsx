import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import SmsTemplatesTable from "../../components/sms-templates/SmsTemplatesTable";

export default function SmsTemplatesList() {
  return (
    <>
      <PageMeta title="SMS Templates | Pronto Connect" description="SMS template management" />
      <PageBreadcrumb pageTitle="SMS Templates" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="SMS Templates">
          <SmsTemplatesTable />
        </ComponentCard>
      </div>
    </>
  );
}
