import { createFileRoute } from "@tanstack/react-router";
import { PAGES_CONTENT } from "../../data/pagesContent";
import { PageTemplate } from "../../components/templates/PageTemplate";
import { AutomationWorkflow } from "../../components/home/AutomationWorkflow";
import { LongFormCta } from "../../components/common/CtaBlock";

export const Route = createFileRoute("/automation/")({
  head: () => ({
    meta: [
      { title: "Intelligent Automation | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Intelligent automation workflows: continuous monitoring, anomaly detection, structured alerts, and operational reporting.",
      },
    ],
  }),
  component: AutomationIndexPage,
});

function AutomationIndexPage() {
  const content = PAGES_CONTENT["automation"];
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageTemplate data={content} showCta={false} />
      <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        <AutomationWorkflow />
        <LongFormCta
          eyebrow="Automation Architecture"
          title="Implement Closed-Loop Infrastructure Telemetry"
          copy="Discuss automated environmental pacing, threshold monitoring, and incident detection models tailored for your data center facilities."
        />
      </section>
    </div>
  );
}
