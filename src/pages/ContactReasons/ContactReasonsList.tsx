import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import ContactReasonsTable from "../../components/contact-reasons/ContactReasonsTable";

export default function ContactReasonsList() {
  return (
    <>
      <PageMeta title="Contact Reasons | Pronto Connect" description="Contact reason management" />
      <PageBreadcrumb pageTitle="Contact Reasons" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Contact Reasons">
          <ContactReasonsTable />
        </ComponentCard>
      </div>
    </>
  );
}
