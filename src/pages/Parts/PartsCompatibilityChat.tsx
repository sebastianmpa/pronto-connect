import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PartsCompatChat from "../../components/parts-compat-chat/PartsCompatChat";

export default function PartsCompatibilityChat() {
  return (
    <>
      <PageMeta title="Parts Compatibility Chat | Pronto Connect" description="Parts compatibility chat" />
      <PageBreadcrumb pageTitle="Parts Compatibility Chat" />
      <div className="space-y-5 sm:space-y-6">
        <PartsCompatChat />
      </div>
    </>
  );
}
