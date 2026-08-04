import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import RolesTable from "../../components/roles/RolesTable";

export default function RolesList() {
  return (
    <>
      <PageMeta title="Roles | Pronto Connect" description="Role management" />
      <PageBreadcrumb pageTitle="Roles" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Roles">
          <RolesTable />
        </ComponentCard>
      </div>
    </>
  );
}
