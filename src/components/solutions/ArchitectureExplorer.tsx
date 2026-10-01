import { useState } from "react";
import { ArrowDown, CheckCircle2, Cpu, Network, Snowflake, Server, Zap } from "../icons";
import { trackEvent } from "../../lib/analytics";

const LAYERS = [
  {
    id: "compute",
    label: "Compute",
    icon: Cpu,
    color: "#06B6D4",
    summary: "Workload execution and accelerator capacity.",
    detail:
      "Compute planning considers workload shape, density, scheduling boundaries, and expansion headroom. The right profile depends on whether the work is sustained training, latency-sensitive inference, or general enterprise processing.",
  },
  {
    id: "network",
    label: "Network",
    icon: Network,
    color: "#38BDF8",
    summary: "Connectivity between users, services, and systems.",
    detail:
      "Network architecture connects compute, storage, users, and regional nodes. Resilience, traffic patterns, segmentation, and east-west data movement should be considered together.",
  },
  {
    id: "storage",
    label: "Storage",
    icon: Server,
    color: "#10B981",
    summary: "Durable data, models, and operational artifacts.",
    detail:
      "Storage planning separates high-throughput working data from durable datasets, model artifacts, checkpoints, and recovery copies. Capacity and access patterns matter as much as raw volume.",
  },
  {
    id: "cooling",
    label: "Cooling",
    icon: Snowflake,
    color: "#38BDF8",
    summary: "Thermal management aligned to actual design loads.",
    detail:
      "Cooling should be designed around expected heat density, environmental conditions, redundancy, and operating ranges. GreenNext presents workload-aware calibration as a planning principle, not a live control system.",
  },
  {
    id: "power",
    label: "Power",
    icon: Zap,
    color: "#F59E0B",
    summary: "Power visibility and electrical resilience.",
    detail:
      "Power planning connects incoming supply, distribution, backup, rack density, and energy visibility. Actual optimization requires measured facility data that is not connected to this prototype.",
  },
] as const;

export function ArchitectureExplorer() {
  const [activeId, setActiveId] = useState<(typeof LAYERS)[number]["id"]>("compute");
  const active = LAYERS.find((layer) => layer.id === activeId) ?? LAYERS[0];
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 border-b border-[#1E293B] pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
          Interactive architecture
        </span>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Explore the connected infrastructure layers
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
          Select a layer to understand its role in the GreenNext planning model.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-2">
          {LAYERS.map((layer, index) => {
            const Icon = layer.icon;
            const activeLayer = layer.id === activeId;
            return (
              <div key={layer.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(layer.id);
                    trackEvent({
                      tab: "Infrastructure",
                      event: "architecture_layer_select",
                      value: layer.label,
                    });
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${activeLayer ? "border-[#10B981]/60 bg-[#10B981]/10" : "border-[#1E293B] bg-[#121824] hover:border-[#334155]"}`}
                  aria-pressed={activeLayer}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#334155] bg-[#070A0E]"
                    style={{ color: layer.color }}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{layer.label}</span>
                    <span className="mt-0.5 block text-[11px] text-[#64748B]">{layer.summary}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B]">0{index + 1}</span>
                </button>
                {index < LAYERS.length - 1 && (
                  <ArrowDown size={14} className="mx-auto my-1 text-[#334155]" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-[#1E293B] bg-[#121824] p-5 sm:p-7">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <active.icon size={22} style={{ color: active.color }} />
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  Selected layer
                </span>
                <h3 className="text-xl font-bold text-white">{active.label}</h3>
              </div>
            </div>
            <p className="text-sm leading-7 text-[#CBD5E1]">{active.detail}</p>
          </div>
          <div className="mt-8 border-t border-[#1E293B] pt-5">
            <div className="flex items-start gap-2 text-xs text-[#94A3B8]">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#10B981]" />
              <span>
                Architecture guidance is illustrative and intended for early planning conversations.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
