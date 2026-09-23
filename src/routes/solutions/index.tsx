import { createFileRoute, Link } from "@tanstack/react-router";
import { SOLUTIONS_DATA } from "../../data/solutions";
import { PageHero } from "../../components/common/PageHero";
import { LongFormCta } from "../../components/common/CtaBlock";
import { ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/solutions/")({
  head: () => ({
    meta: [
      { title: "Solutions & Use Cases | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Approved operational scenarios and use cases for AI-era data centers: energy monitoring, cooling optimization, workload management, and automated alerts.",
      },
    ],
  }),
  component: SolutionsIndexPage,
});

function SolutionsIndexPage() {
  const solutions = Object.values(SOLUTIONS_DATA);

  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[{ label: "Solutions" }]}
        eyebrow="Infrastructure Use Cases"
        h1="Operational Scenarios GreenNext Is Designed to Address"
        intro="The following use cases represent the operational problems GreenNext's infrastructure intelligence and automation approach is designed to help address. These are illustrative scenarios informed by common data center operational challenges."
        isConceptual={true}
        cta={{
          label: "Discuss Infrastructure Requirements →",
          path: "/contact",
        }}
      />

      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {solutions.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-7 flex flex-col justify-between hover:border-[#334155] hover:bg-[#121824] transition-all group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
                  <span className="font-mono text-xs text-[#10B981] font-semibold">
                    {item.code}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8]">
                    USE CASE
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#10B981] transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3 mb-6">
                  {item.problem}
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Problem ➔ Approach ➔ Value
                  </span>
                  <Link
                    to={`/solutions/${item.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] group-hover:text-[#34D399] transition-colors"
                  >
                    <span>View Solution</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <LongFormCta
          eyebrow="Enterprise Engagement"
          title="Ready to Explore Operational Scenarios for Your Facilities?"
          copy="Connect with our technical team to discuss how continuous power telemetry, AI workload orchestration, and automated anomaly detection can be calibrated for your operational requirements."
        />
      </main>
    </div>
  );
}
