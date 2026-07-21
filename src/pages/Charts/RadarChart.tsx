import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import RadarChartOne from "../../components/charts/radar/RadarChartOne";
import RadarChartTwo from "../../components/charts/radar/RadarChartTwo";
import RadarChartThree from "../../components/charts/radar/RadarChartThree";

export default function RadarChart() {
  return (
    <>
      <PageMeta
        title="React.js Radar Chart | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Radar Chart page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Radar Chart" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentCard title="Radar Chart 1">
          <RadarChartOne />
        </ComponentCard>
        <ComponentCard title="Radar Chart 2">
          <RadarChartTwo />
        </ComponentCard>
        <ComponentCard title="Radar Chart 3">
          <RadarChartThree />
        </ComponentCard>
      </div>
    </>
  );
}
