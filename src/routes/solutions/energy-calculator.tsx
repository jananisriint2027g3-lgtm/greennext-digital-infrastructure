import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "../../components/common/PageHero";
import { EnergyImpactCalculator } from "../../components/solutions/EnergyImpactCalculator";

export const Route = createFileRoute("/solutions/energy-calculator")({
  head: () => ({
    meta: [
      { title: "Energy Impact Calculator | GreenNext" },
      {
        name: "description",
        content:
          "Build an illustrative energy and workload estimate from transparent planning assumptions.",
      },
    ],
  }),
  component: EnergyCalculatorPage,
});

function EnergyCalculatorPage() {
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[
          { label: "Solutions", path: "/solutions" },
          { label: "Energy Impact Calculator" },
        ]}
        eyebrow="Illustrative Planning Tool"
        h1="Estimate workload energy impact"
        intro="Adjust a few workload assumptions to understand the directional relationship between compute, operating time, energy, and cooling demand."
        isConceptual
        cta={{ label: "Explore Energy Planning →", path: "/energy" }}
      />
      <main className="mx-auto max-w-[1340px] space-y-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <EnergyImpactCalculator />
      </main>
    </div>
  );
}
