import { Activity, ArrowRight, Gauge, Layers } from "../icons";
import { InternalLink as Link } from "../common/InternalLink";
import { NAVIGATION_STRUCTURE, type NavigationItem } from "../../data/navigation";

const GROUPS = [
  {
    label: "Monitor & respond",
    description: "Operational use cases for visibility, detection, and bounded response planning.",
    ids: [
      "energy-monitoring",
      "health-monitoring",
      "ai-workload-management",
      "cooling-optimization",
      "capacity-planning",
      "anomaly-detection",
      "automated-alerts",
    ],
    icon: Activity,
    accent: "#06B6D4",
  },
  {
    label: "Design & explore",
    description: "Early-stage architecture tools for framing requirements and trade-offs.",
    ids: ["configurator", "architecture-explorer"],
    icon: Layers,
    accent: "#10B981",
  },
  {
    label: "Model & benchmark",
    description: "Transparent calculators and structured reference data for planning discussions.",
    ids: ["energy-calculator", "infrastructure-index"],
    icon: Gauge,
    accent: "#F59E0B",
  },
] as const;

const offerings = NAVIGATION_STRUCTURE.find((category) => category.id === "offerings")?.items ?? [];

function getOffering(id: string): NavigationItem | undefined {
  return offerings.find((item) => item.id === id);
}

export function OfferingCoverageMap() {
  return (
    <section
      aria-labelledby="offering-coverage-title"
      className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-2xl sm:p-8"
    >
      <div className="mb-8 flex flex-col gap-3 border-b border-[#1E293B] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
            Offering coverage graph
          </span>
          <h2 id="offering-coverage-title" className="mt-2 text-2xl font-bold text-white">
            From operational question to planning tool
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">
            The 11 offerings are grouped by the decision they support. This is a coverage map based
            on GreenNext navigation metadata, not a ranking of deployed services or customer demand.
          </p>
        </div>
        <Gauge className="hidden text-[#10B981] sm:block" size={24} aria-hidden="true" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.label} className="rounded-xl border border-[#1E293B] bg-[#121824] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border"
                    style={{
                      color: group.accent,
                      borderColor: `${group.accent}40`,
                      backgroundColor: `${group.accent}12`,
                    }}
                  >
                    <Icon size={17} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-white">{group.label}</h3>
                </div>
                <span className="font-mono text-2xl font-bold" style={{ color: group.accent }}>
                  {group.ids.length.toString().padStart(2, "0")}
                </span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#94A3B8]">{group.description}</p>
              <div className="space-y-2">
                {group.ids.map((id) => {
                  const item = getOffering(id);
                  if (!item) return null;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#1E293B] bg-[#0B0F17] px-3 py-2 text-xs text-[#CBD5E1] transition-colors hover:border-[#334155] hover:text-white"
                    >
                      <span>{item.label}</span>
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-[#64748B]"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-[#64748B]">
        Accessibility note: the graph is represented as headings, counts, and keyboard-accessible
        links; no meaning depends on color alone. All offering entries retain their existing
        conceptual or reference-data labels.
      </p>
    </section>
  );
}
