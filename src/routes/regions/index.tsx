import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { RegionalExplorer } from "../../components/home/RegionalExplorer";
import { DashboardPreview } from "../../components/home/DashboardPreview";
import { RegionalComparison } from "../../components/solutions/RegionalComparison";
import { LongFormCta } from "../../components/common/CtaBlock";
import { RegionalPortfolio } from "../../components/regional/RegionalPortfolio";

export const Route = createFileRoute("/regions/")({
  head: () => ({
    meta: [
      { title: "Regional Digital Infrastructure | South India | GreenNext" },
      {
        name: "description",
        content:
          "Regional infrastructure intelligence for seven locations across South India, with separate site power, IT-load, cooling, water, and connectivity fields.",
      },
    ],
  }),
  component: RegionsIndexPage,
});

function RegionsIndexPage() {
  const content = PAGES_CONTENT["regions"]!;
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pb-12">
        <RegionalExplorer />
        <RegionalPortfolio />
        <RegionalComparison />
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
