import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "../../components/common/PageHero";
import { InfrastructureDataExplorer } from "../../components/mining/InfrastructureDataExplorer";

export const Route = createFileRoute("/solutions/infrastructure-index")({
  head: () => ({
    meta: [
      { title: "South India Digital Infrastructure & Clean Energy Index | GreenNext" },
      {
        name: "description",
        content:
          "Structured analytics and web-mined data tracking data center capacity, PUE, grid carbon intensity, and renewable blend across South India.",
      },
    ],
  }),
  component: InfrastructureIndexPage,
});

function InfrastructureIndexPage() {
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[
          { label: "Solutions", path: "/solutions" },
          { label: "Infrastructure & Grid Index" },
        ]}
        eyebrow="Structured Regional Intelligence"
        h1="South India Digital Infrastructure & Clean Energy Index"
        intro="A structured illustrative dataset for regional digital infrastructure and clean-energy planning."
        isConceptual={false}
        cta={{ label: "View Regional Network →", path: "/regions/overview" }}
      />
      <main className="mx-auto max-w-[1340px] space-y-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <InfrastructureDataExplorer />
      </main>
    </div>
  );
}
