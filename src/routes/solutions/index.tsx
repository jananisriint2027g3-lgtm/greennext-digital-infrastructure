import { createFileRoute } from "@tanstack/react-router";
import { InternalLink as Link } from "../../components/common/InternalLink";
import { NAVIGATION_STRUCTURE, type NavigationItem } from "../../data/navigation";
import { PageHero } from "../../components/common/PageHero";
import { LongFormCta } from "../../components/common/CtaBlock";
import { ArrowRight } from "../../components/icons";
import { OfferingCoverageMap } from "../../components/solutions/OfferingCoverageMap";

const OFFERING_GROUPS: Array<{ title: string; description: string; ids: string[] }> = [
  {
    title: "Monitoring & Operational Use Cases",
    description: "Conceptual operating scenarios for teams evaluating infrastructure visibility and response workflows.",
    ids: [
      "energy-monitoring",
      "health-monitoring",
      "ai-workload-management",
      "cooling-optimization",
      "capacity-planning",
      "anomaly-detection",
      "automated-alerts",
    ],
  },
  {
    title: "Planning & Architecture Tools",
    description: "Interactive prototypes for early architecture conversations and requirement framing.",
    ids: ["configurator", "architecture-explorer"],
  },
  {
    title: "Energy & Infrastructure Analysis",
    description: "Illustrative calculators and structured reference data for planning discussions.",
    ids: ["energy-calculator", "infrastructure-index"],
  },
];

const OFFERINGS =
  NAVIGATION_STRUCTURE.find((category) => category.id === "offerings")?.items ?? [];

function getOffering(id: string): NavigationItem {
  return OFFERINGS.find((item) => item.id === id)!;
}

export const Route = createFileRoute("/solutions/")({
  head: () => ({
    meta: [
      { title: "Offerings & Planning Tools | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "GreenNext conceptual offerings and planning tools for AI-era infrastructure: energy monitoring, cooling optimization, workload management, and operational analysis.",
      },
    ],
  }),
  component: SolutionsIndexPage,
});

function SolutionsIndexPage() {
  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={[{ label: "Solutions" }]}
        eyebrow="Infrastructure Offerings"
        h1="Plan the infrastructure decisions behind AI-era workloads"
        intro="Explore GreenNext's conceptual use cases, planning tools, and structured reference data. Each entry supports an early infrastructure conversation; it does not imply a deployed facility, live telemetry integration, or guaranteed operational outcome."
        isConceptual={true}
        cta={{
          label: "Discuss Infrastructure Requirements →",
          path: "/contact",
        }}
      />

      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <OfferingCoverageMap />
        </div>
        <div className="space-y-12 mb-16">
          {OFFERING_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={group.title.replaceAll(" ", "-").toLowerCase()}>
              <div className="mb-5 max-w-3xl">
                <h2 id={group.title.replaceAll(" ", "-").toLowerCase()} className="text-xl sm:text-2xl font-bold text-white">
                  {group.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.ids.map((id) => {
                  const item = getOffering(id);
                  return (
            <div
              key={item.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-7 flex flex-col justify-between hover:border-[#334155] hover:bg-[#121824] transition-all group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#10B981] font-semibold uppercase tracking-wider">
                    {group.title.startsWith("Monitoring")
                      ? "USE CASE"
                      : id === "infrastructure-index"
                        ? "REFERENCE DATA"
                        : "PLANNING TOOL"}
                  </span>
                  {item.isConceptual && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8]">CONCEPTUAL</span>}
                </div>

                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#10B981] transition-colors">
                  {item.label}
                </h3>

                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-[#1E293B]">
                <Link to={item.path} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] group-hover:text-[#34D399] transition-colors">
                  <span>Explore {item.label}</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
                  );
                })}
              </div>
            </section>
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
