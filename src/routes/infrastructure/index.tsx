import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { SevenLayerStack } from "../../components/home/SevenLayerStack";
import { LongFormCta } from "../../components/common/CtaBlock";

export const Route = createFileRoute("/infrastructure/")({
  head: () => ({
    meta: [
      { title: "Infrastructure | GreenNext AI-Driven Data Centers" },
      {
        name: "description",
        content:
          "Infrastructure built for the AI era: sustained compute density, integrated thermal management, and a 7-layer connected stack.",
      },
    ],
  }),
  component: InfrastructureIndexPage,
});

function InfrastructureIndexPage() {
  const content = PAGES_CONTENT["infrastructure"];
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
              Interactive Architectural Stack
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              7-Layer Connected Operational Infrastructure
            </h3>
          </div>
          <SevenLayerStack />
        </div>
        <LongFormCta
          eyebrow="Architecture Collaboration"
          title="Ready to Review High-Density Compute Specifications?"
          copy="Discuss power distribution, rack containment, and cooling architecture for your facilities with our engineering planning team."
        />
      </section>
    </div>
  );
}
