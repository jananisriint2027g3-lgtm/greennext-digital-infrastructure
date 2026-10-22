import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { AutomationWorkflow } from "../../components/home/AutomationWorkflow";
import { CapacityUtilizationModel } from "../../components/kpi/CapacityUtilizationModel";
import { AvailabilityCalculator } from "../../components/kpi/AvailabilityCalculator";
import { ReliabilityMetricsModel } from "../../components/kpi/ReliabilityMetricsModel";
import { MaintenanceComplianceWidget } from "../../components/kpi/MaintenanceComplianceWidget";

export const Route = createFileRoute("/automation/$slug")({
  head: ({ params }) => {
    const key = `automation/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Automation"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext intelligent automation." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!PAGES_CONTENT[`automation/${params.slug}`]) throw notFound();
  },
  component: AutomationSubmenuPage,
});

function AutomationSubmenuPage() {
  const { slug } = Route.useParams();
  const key = `automation/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    throw notFound();
  }

  return (
    <div>
      <PageTemplate data={page} />
      {slug === "capacity" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <CapacityUtilizationModel />
        </section>
      )}
      {slug === "reporting" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AvailabilityCalculator />
        </section>
      )}
      {slug === "operations" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
          <MaintenanceComplianceWidget />
          <ReliabilityMetricsModel />
        </section>
      )}
      {slug === "alerts" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <ReliabilityMetricsModel />
        </section>
      )}
      {slug === "monitoring" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AutomationWorkflow />
        </section>
      )}
    </div>
  );
}
