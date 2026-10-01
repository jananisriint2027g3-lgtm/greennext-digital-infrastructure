import { useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "../icons";
import { DASHBOARD_METRICS } from "../../data/dashboard";
import { REGIONS_DATA } from "../../data/regions";
import { trackEvent } from "../../lib/analytics";

const REGION_IDS = ["madurai", "coimbatore", "trichy", "mangalore"] as const;

export function RegionalComparison() {
  const [leftId, setLeftId] = useState<(typeof REGION_IDS)[number]>("madurai");
  const [rightId, setRightId] = useState<(typeof REGION_IDS)[number]>("coimbatore");
  const left = REGIONS_DATA[leftId]!;
  const right = REGIONS_DATA[rightId]!;
  const select = (side: string, value: (typeof REGION_IDS)[number]) => {
    if (side === "left") setLeftId(value);
    else setRightId(value);
    trackEvent({ tab: "Regions", event: "regional_comparison_select", value: `${side}:${value}` });
  };

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 shadow-2xl sm:p-8">
      <div className="mb-7 border-b border-[#1E293B] pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#10B981]">
          Regional exploration
        </span>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Compare the four conceptual focus nodes
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">
          Compare the existing regional planning narratives side by side. No physical deployment or
          live regional performance is implied.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { side: "left", region: left, id: leftId },
          { side: "right", region: right, id: rightId },
        ].map(({ side, region, id }) => {
          const metrics = DASHBOARD_METRICS[id]!;
          return (
            <div key={side} className="rounded-xl border border-[#1E293B] bg-[#121824] p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-2xl font-bold text-white">{region.code}</span>
                  <h3 className="text-lg font-bold text-white">{region.name}</h3>
                </div>
                <select
                  aria-label={`${side} comparison region`}
                  value={id}
                  onChange={(event) =>
                    select(side, event.target.value as (typeof REGION_IDS)[number])
                  }
                  className="rounded-lg border border-[#334155] bg-[#0B0F17] px-3 py-2 text-xs text-white"
                >
                  {REGION_IDS.map((regionId) => (
                    <option key={regionId} value={regionId}>
                      {REGIONS_DATA[regionId]!.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#CBD5E1]">{region.role}</p>
              <div className="space-y-2 border-t border-[#1E293B] pt-4">
                {[region.category, region.connectivity, region.regionalIntent].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[#94A3B8]"
                  >
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#10B981]" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-[#334155] bg-[#0B0F17] p-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#64748B]">
                  Illustrative dashboard reference
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Compute", metrics.compute],
                    ["Power", metrics.power],
                    ["Network", metrics.network],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <strong className="block font-mono text-sm text-white">{value}%</strong>
                      <span className="text-[9px] text-[#64748B]">{label as string}</span>
                    </div>
                  ))}
                </div>
              </div>
              <a
                href={`/regions/${region.id}`}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#34D399]"
              >
                Open {region.name} dossier <ArrowRight size={13} />
              </a>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-start gap-2 border-t border-[#1E293B] pt-4 text-[11px] leading-relaxed text-[#64748B]">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#10B981]" />
        The percentage values reuse the existing dashboard’s explicitly illustrative/demo data.
        Regional narratives and codes come from the existing GreenNext data model.
      </div>
    </section>
  );
}
