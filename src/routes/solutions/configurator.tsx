import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "../../components/common/PageHero";
import { InfrastructureConfigurator } from "../../components/solutions/InfrastructureConfigurator";

export const Route = createFileRoute("/solutions/configurator")({
  head: () => ({
    meta: [
      { title: "Infrastructure Configurator | GreenNext" },
      {
        name: "description",
        content:
          "Illustrative infrastructure configuration guidance for AI, cloud, analytics, and enterprise workloads.",
      },
    ],
  }),
  component: ConfiguratorPage,
});

function ConfiguratorPage() {
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[
          { label: "Solutions", path: "/solutions" },
          { label: "Infrastructure Configurator" },
        ]}
        eyebrow="Configuration Guidance"
        h1="Start with an infrastructure profile"
        intro="Explore a transparent, rule-based recommendation for compute, network, storage, cooling, energy approach, and regional focus."
        isConceptual
        cta={{ label: "Discuss Requirements →", path: "/contact" }}
      />
      <main className="mx-auto max-w-[1340px] space-y-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <InfrastructureConfigurator />
      </main>
    </div>
  );
}
