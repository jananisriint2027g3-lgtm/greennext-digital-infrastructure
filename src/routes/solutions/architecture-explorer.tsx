import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "../../components/common/PageHero";
import { ArchitectureExplorer } from "../../components/solutions/ArchitectureExplorer";

export const Route = createFileRoute("/solutions/architecture-explorer")({
  head: () => ({
    meta: [
      { title: "Architecture Explorer | GreenNext" },
      {
        name: "description",
        content:
          "Explore the conceptual compute, network, storage, cooling, and power layers of GreenNext infrastructure planning.",
      },
    ],
  }),
  component: ArchitectureExplorerPage,
});

function ArchitectureExplorerPage() {
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[
          { label: "Solutions", path: "/solutions" },
          { label: "Architecture Explorer" },
        ]}
        eyebrow="Interactive Architecture"
        h1="Understand the layers behind AI-ready infrastructure"
        intro="Select a layer to explore how compute, network, storage, cooling, and power fit into one planning conversation."
        isConceptual
        cta={{ label: "Explore Infrastructure →", path: "/infrastructure" }}
      />
      <main className="mx-auto max-w-[1340px] space-y-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <ArchitectureExplorer />
      </main>
    </div>
  );
}
