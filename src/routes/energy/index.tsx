import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { EnergyFlowModel } from "../../components/home/EnergyFlowModel";
import { LongFormCta } from "../../components/common/CtaBlock";

export const Route = createFileRoute("/energy/")({
  head: () => ({
    meta: [
      { title: "Energy Efficiency | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Energy efficiency as an infrastructure discipline: workload-aware power management, thermal cooling optimization, and continuous telemetry.",
      },
    ],
  }),
  component: EnergyIndexPage,
});

function EnergyIndexPage() {
  const content = PAGES_CONTENT["energy"];
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <EnergyFlowModel />
        <LongFormCta
          eyebrow="Energy Modeling"
          title="Optimize Facility Energy & Thermal Headroom"
          copy="Connect with our engineering team to review power telemetry instrumentation, liquid cooling transitions, and ambient thermal adaptations."
        />
      </section>
    </div>
  );
}
