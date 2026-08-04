import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import UsersTable from "../../components/users/UsersTable";

export default function UsersList() {
  return (
    <>
      <PageMeta title="Users | Pronto Connect" description="User management" />
      <PageBreadcrumb pageTitle="Users" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Users">
          <UsersTable />
        </ComponentCard>
      </div>
    </>
  );
}
