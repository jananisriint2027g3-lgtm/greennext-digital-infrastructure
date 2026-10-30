import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { RegionalEvidenceProfile } from "../../components/sustainability/RegionalEvidenceProfile";

export const Route = createFileRoute("/sustainability/")({
  head: () => ({
    meta: [
      { title: "Sustainability | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Digital growth without ignoring resource efficiency. Energy-aware infrastructure, efficient cooling, and resource optimization across South India.",
      },
    ],
  }),
  component: SustainabilityIndexPage,
});

function SustainabilityIndexPage() {
  const content = PAGES_CONTENT["sustainability"]!;
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <main className="mx-auto max-w-[1340px] space-y-10 px-4 pb-16 sm:px-6 lg:px-8">
        <RegionalEvidenceProfile />
      </main>
    </div>
  );
}
