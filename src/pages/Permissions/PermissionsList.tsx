import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PermissionsTable from "../../components/permissions/PermissionsTable";

export default function PermissionsList() {
  return (
    <>
      <PageMeta title="Permissions | Pronto Connect" description="Permission management" />
      <PageBreadcrumb pageTitle="Permissions" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Permissions">
          <PermissionsTable />
        </ComponentCard>
      </div>
    </>
  );
}
