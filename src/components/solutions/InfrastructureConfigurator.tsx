import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Cpu, Network, Snowflake, Zap } from "../icons";
import { REGIONS_DATA } from "../../data/regions";
import { trackEvent } from "../../lib/analytics";

type Workload = "AI Training" | "AI Inference" | "Cloud" | "Analytics" | "Enterprise";
type Scale = "Small" | "Medium" | "Large";
type Priority = "Performance" | "Energy Efficiency" | "Cost" | "Scalability";

const WORKLOADS: Workload[] = ["AI Training", "AI Inference", "Cloud", "Analytics", "Enterprise"];
const SCALES: Scale[] = ["Small", "Medium", "Large"];
const PRIORITIES: Priority[] = ["Performance", "Energy Efficiency", "Cost", "Scalability"];

const GUIDANCE: Record<Workload, { compute: string; network: string; storage: string }> = {
  "AI Training": {
    compute: "Accelerated, high-density compute for sustained utilization.",
    network: "Low-latency east-west fabric for distributed training and checkpoints.",
    storage: "High-throughput shared storage for datasets and checkpoints.",
  },
  "AI Inference": {
    compute: "Right-sized accelerator or CPU pools for predictable response capacity.",
    network: "Low-latency north-south connectivity with resilient service paths.",
    storage: "Fast model-serving storage with a durable artifact tier.",
  },
  Cloud: {
    compute: "Flexible pooled compute with capacity boundaries that can scale by demand.",
    network: "Resilient multi-tenant connectivity with clear traffic segmentation.",
    storage: "Tiered storage balancing access performance, durability, and cost.",
  },
  Analytics: {
    compute: "Balanced compute for scheduled processing and interactive analysis.",
    network: "Reliable data movement between ingestion, processing, and reporting layers.",
    storage: "Scalable data storage with an efficient historical and working-data split.",
  },
  Enterprise: {
    compute: "Predictable general-purpose capacity with workload isolation where needed.",
    network: "Highly available connectivity aligned with business-critical service paths.",
    storage: "Resilient storage with clear recovery and retention considerations.",
  },
};

function getRecommendation(workload: Workload, scale: Scale, priority: Priority) {
  const base = GUIDANCE[workload];
  const regionId =
    workload === "AI Training" && priority === "Performance"
      ? "coimbatore"
      : workload === "AI Inference" || priority === "Scalability"
        ? "mangalore"
        : priority === "Energy Efficiency"
          ? "madurai"
          : "trichy";
  const region = REGIONS_DATA[regionId]!;
  return {
    compute:
      scale === "Large"
        ? `${base.compute} Plan for segmented pools and expansion headroom.`
        : scale === "Small"
          ? `${base.compute} Start with a contained pool and validate utilization before expanding.`
          : `${base.compute} Use a modular pool that can grow without redesigning the full stack.`,
    network: base.network,
    storage: base.storage,
    cooling:
      priority === "Energy Efficiency"
        ? "Instrumented thermal management with workload-aware calibration as a design goal."
        : "Design cooling around expected heat density, operating profile, and resilient thermal paths.",
    energy:
      priority === "Cost" || priority === "Energy Efficiency"
        ? "Prioritize measurement, right-sizing, and workload-aware operating windows."
        : "Prioritize energy visibility so performance decisions remain aware of power and thermal headroom.",
    region,
  };
}

export function InfrastructureConfigurator() {
  const [workload, setWorkload] = useState<Workload>("AI Training");
  const [scale, setScale] = useState<Scale>("Medium");
  const [priority, setPriority] = useState<Priority>("Performance");
  const recommendation = useMemo(
    () => getRecommendation(workload, scale, priority),
    [workload, scale, priority],
  );
  const choose = (label: string, value: string) => {
    if (label === "Workload") setWorkload(value as Workload);
    if (label === "Scale") setScale(value as Scale);
    if (label === "Priority") setPriority(value as Priority);
    trackEvent({
      tab: "Solutions",
      event: "configurator_option_select",
      value: `${label}: ${value}`,
    });
  };
  const cards = [
    { label: "Compute", value: recommendation.compute, icon: Cpu, color: "#06B6D4" },
    { label: "Network", value: recommendation.network, icon: Network, color: "#38BDF8" },
    { label: "Storage", value: recommendation.storage, icon: CheckCircle2, color: "#10B981" },
    { label: "Cooling", value: recommendation.cooling, icon: Snowflake, color: "#38BDF8" },
    { label: "Energy approach", value: recommendation.energy, icon: Zap, color: "#F59E0B" },
  ];

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 flex flex-col gap-3 border-b border-[#1E293B] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
            Configuration guidance
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Shape an infrastructure starting point
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
            Select a workload profile and planning priority. GreenNext returns an illustrative
            recommendation to support an early architecture conversation.
          </p>
        </div>
        <span className="rounded border border-[#334155] bg-[#121824] px-2.5 py-1 font-mono text-[10px] uppercase text-[#94A3B8]">
          Rule-based guidance
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          {(
            [
              ["Workload", WORKLOADS, workload],
              ["Scale", SCALES, scale],
              ["Priority", PRIORITIES, priority],
            ] as const
          ).map(([label, options, selected]) => (
            <fieldset key={label}>
              <legend className="label">{label}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {options.map((option) => {
                  const active = selected === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => choose(label, option)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${active ? "border-[#10B981] bg-[#10B981]/10 text-[#34D399]" : "border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:border-[#334155] hover:text-white"}`}
                      aria-pressed={active}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.04] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                Illustrative recommendation
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">
                {workload} · {scale} · {priority}
              </h3>
            </div>
            <div className="rounded-lg border border-[#10B981]/30 bg-[#0B0F17] px-3 py-2 text-right">
              <span className="block font-mono text-[9px] uppercase text-[#64748B]">
                Suggested focus region
              </span>
              <span className="font-mono text-sm font-bold text-[#10B981]">
                {recommendation.region.code}
              </span>
              <span className="ml-1 text-xs text-white">{recommendation.region.name}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg border border-[#1E293B] bg-[#121824] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={15} style={{ color }} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#CBD5E1]">
                    {label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#94A3B8]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1E293B] pt-4">
            <p className="max-w-xl text-[11px] leading-relaxed text-[#64748B]">
              This is configuration guidance, not a facility design, capacity guarantee, or live
              regional measurement. Validate assumptions with site, workload, and power data.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#34D399]"
            >
              Discuss requirements <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
