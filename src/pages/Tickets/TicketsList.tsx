import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import TicketsTable from "../../components/tickets/TicketsTable";

export default function TicketsList() {
  return (
    <>
      <PageMeta title="Tickets | Pronto Connect" description="Support ticket search" />
      <PageBreadcrumb pageTitle="Tickets" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Ticket Search">
          <TicketsTable />
        </ComponentCard>
      </div>
    </>
  );
}
