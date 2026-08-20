import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

export default function PartsCompatibilityChat() {
  return (
    <>
      <PageMeta title="Parts Compatibility Chat | Pronto Connect" description="Parts compatibility chat" />
      <PageBreadcrumb pageTitle="Parts Compatibility Chat" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Parts Compatibility Chat">
          <p className="py-10 text-center text-sm text-gray-400">
            This module is coming soon.
          </p>
        </ComponentCard>
      </div>
    </>
  );
}
