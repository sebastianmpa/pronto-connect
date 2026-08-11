import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import CustomerContactsTable from "../../components/customer-contacts/CustomerContactsTable";

export default function CustomerContactsList() {
  return (
    <>
      <PageMeta
        title="Customer Contacts | Pronto Connect"
        description="Search and review customer contact requests"
      />
      <PageBreadcrumb pageTitle="Customer Contacts" />
      <div className="min-w-0 space-y-5 sm:space-y-6">
        <ComponentCard
          className="min-w-0 overflow-hidden"
          title="Customer Contacts"
          desc="Search contact requests using the filters supported by the service."
        >
          <CustomerContactsTable />
        </ComponentCard>
      </div>
    </>
  );
}
