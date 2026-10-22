import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { EnergyFlowModel } from "../../components/home/EnergyFlowModel";
import { PueCalculator } from "../../components/kpi/PueCalculator";
import { CoolingEfficiencyCalculator } from "../../components/kpi/CoolingEfficiencyCalculator";

export const Route = createFileRoute("/energy/$slug")({
  head: ({ params }) => {
    const key = `energy/${params.slug}`;
    const page = PAGES_CONTENT[key];
    return {
      meta: [
        { title: `${page?.title || "Energy"} | GreenNext` },
        { name: "description", content: page?.intro || "GreenNext energy efficiency." },
      ],
    };
  },
  loader: ({ params }) => {
    if (!PAGES_CONTENT[`energy/${params.slug}`]) throw notFound();
  },
  component: EnergySubmenuPage,
});

function EnergySubmenuPage() {
  const { slug } = Route.useParams();
  const key = `energy/${slug}`;
  const page = PAGES_CONTENT[key];

  if (!page) {
    throw notFound();
  }

  return (
    <div>
      <PageTemplate data={page} />
      {slug === "monitoring" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <PueCalculator />
        </section>
      )}
      {slug === "cooling" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <CoolingEfficiencyCalculator />
        </section>
      )}
      {slug === "optimization" && (
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <EnergyFlowModel />
        </section>
      )}
    </div>
  );
}
