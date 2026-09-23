import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { RegionalExplorer } from "../../components/home/RegionalExplorer";
import { DashboardPreview } from "../../components/home/DashboardPreview";
import { LongFormCta } from "../../components/common/CtaBlock";

export const Route = createFileRoute("/regions/")({
  head: () => ({
    meta: [
      { title: "Regional Digital Infrastructure | South India | GreenNext" },
      {
        name: "description",
        content:
          "Distributed digital infrastructure network connecting Madurai, Coimbatore, Trichy, and Mangalore across South India.",
      },
    ],
  }),
  component: RegionsIndexPage,
});

function RegionsIndexPage() {
  const content = PAGES_CONTENT["regions"];
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
        <RegionalExplorer />
        <DashboardPreview />
        <LongFormCta
          eyebrow="Regional Capacity"
          title="Plan Secondary-City Digital Infrastructure"
          copy="Connect with our regional infrastructure planning team to explore facility deployments, connectivity corridors, and clean power availability across South India."
        />
      </section>
    </div>
  );
}
