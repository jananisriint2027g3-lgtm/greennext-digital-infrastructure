import { useState } from "react";
import {
  REGIONAL_PORTFOLIO,
  REGIONAL_PORTFOLIO_DISCLAIMER,
  PortfolioField,
} from "../../data/regionalPortfolio";
import {
  Building2,
  ChevronDown,
  Globe2,
  ArrowRight,
  Network,
  ShieldAlert,
  Snowflake,
  Users,
  Zap,
} from "../icons";

const STATUS_STYLES: Record<string, string> = {
  "Source-reported": "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Proposed: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "To be confirmed": "border-slate-500/40 bg-slate-500/10 text-slate-300",
  Unavailable: "border-slate-500/40 bg-slate-500/10 text-slate-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES["To be confirmed"]}`}
    >
      {status}
    </span>
  );
}

function Spec({ field }: { field: PortfolioField }) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-mono uppercase tracking-wide text-[#64748B]">
          {field.label}
        </span>
        <StatusBadge status={field.status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#E2E8F0]">{field.value}</p>
    </div>
  );
}

export function RegionalPortfolio() {
  const [selectedId, setSelectedId] = useState(REGIONAL_PORTFOLIO[0]!.id);
  const selected =
    REGIONAL_PORTFOLIO.find((location) => location.id === selectedId) ?? REGIONAL_PORTFOLIO[0]!;

  return (
    <section
      id="regional-portfolio"
      aria-labelledby="regional-portfolio-heading"
      className="rounded-2xl border border-[#1E293B] bg-[#0D1520] p-5 sm:p-6 lg:p-8 shadow-2xl"
    >
      <div className="flex flex-col gap-5 border-b border-[#1E293B] pb-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3 text-[#10B981]">
            <Globe2 size={21} />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
              REGIONAL INFRASTRUCTURE INTELLIGENCE
            </span>
            <h2
              id="regional-portfolio-heading"
              className="mt-1 text-2xl sm:text-3xl font-bold text-white"
            >
              South India Data Centre Portfolio
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">
              Explore seven regional opportunities across Tamil Nadu, Puducherry, and coastal
              Karnataka. Every figure is separated by infrastructure domain and labelled so site
              power is not confused with data-centre IT load.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Portfolio summary">
          <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4">
            <span className="text-2xl font-bold text-white">7</span>
            <span className="ml-2 text-xs text-[#94A3B8]">regional locations</span>
          </div>
          <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4">
            <span className="text-2xl font-bold text-[#FBBF24]">0</span>
            <span className="ml-2 text-xs text-[#94A3B8]">operating facilities verified here</span>
          </div>
          <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4">
            <span className="text-2xl font-bold text-[#CBD5E1]">N/A</span>
            <span className="ml-2 text-xs text-[#94A3B8]">verified IT-load figures</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REGIONAL_PORTFOLIO.map((location) => {
          const active = location.id === selected.id;
          return (
            <div
              key={location.id}
              className={`rounded-2xl border p-5 transition-all ${active ? "border-[#10B981]/60 bg-[#10261F] shadow-lg shadow-[#10B981]/5" : "border-[#1E293B] bg-[#0B0F17] hover:border-[#334155] hover:bg-[#101923]"}`}
            >
              <button
                type="button"
                aria-expanded={active}
                aria-controls="regional-portfolio-detail"
                onClick={() => setSelectedId(location.id)}
                className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">
                      {location.area}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-white">{location.name}</h3>
                  </div>
                  <ChevronDown
                    size={17}
                    className={`mt-1 text-[#94A3B8] transition-transform ${active ? "rotate-180 text-[#10B981]" : ""}`}
                  />
                </div>
                <p className="mt-3 min-h-[42px] text-xs leading-relaxed text-[#94A3B8]">
                  {location.tagline}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={location.status} />
                  <span className="rounded-full border border-[#334155] px-2 py-1 text-[10px] text-[#CBD5E1]">
                    {location.facilityType.split(",")[0]}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#1E293B] pt-4">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-[#64748B]">
                      Land
                    </span>
                    <span className="mt-1 block break-words text-sm text-[#E2E8F0]">
                      {location.land.value}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-[#64748B]">
                      Site power
                    </span>
                    <span className="mt-1 block text-sm text-[#E2E8F0]">
                      {location.sitePower.value}
                    </span>
                  </div>
                </div>
              </button>
              <a
                href={`/regions/${location.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#34D399]"
              >
                Open regional dossier <ArrowRight size={13} />
              </a>
            </div>
          );
        })}
      </div>

      <div
        id="regional-portfolio-detail"
        className="mt-8 rounded-2xl border border-[#10B981]/25 bg-[#0B0F17] p-5 sm:p-7"
        aria-live="polite"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 border-b border-[#1E293B] pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
              FULL PROFILE // {selected.state}
            </span>
            <h3 className="mt-1 text-2xl font-bold text-white">{selected.name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#94A3B8]">
              {selected.overview}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShieldAlert size={17} className="text-amber-300" />
            <StatusBadge status={selected.status} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Building2 size={16} className="text-[#10B981]" /> Site and facility
            </h4>
            <div className="mt-3 space-y-3">
              <Spec field={selected.land} />
              <Spec field={selected.buildingArea} />
              <Spec
                field={{
                  label: "Facility type",
                  value: selected.facilityType,
                  status: selected.status,
                }}
              />
              <Spec field={selected.zoning} />
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Zap size={16} className="text-[#10B981]" /> Power and compute
            </h4>
            <div className="mt-3 space-y-3">
              <Spec field={selected.sitePower} />
              <Spec field={selected.itLoad} />
              <Spec field={selected.substation} />
              <Spec field={selected.renewable} />
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Snowflake size={16} className="text-[#10B981]" /> Cooling and water
            </h4>
            <div className="mt-3 space-y-3">
              <Spec field={selected.water} />
              <Spec field={selected.cooling} />
              <Spec field={selected.pue} />
            </div>
          </div>
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Network size={16} className="text-[#10B981]" /> Connectivity and ecosystem
            </h4>
            <div className="mt-3 space-y-3">
              <Spec field={selected.connectivity} />
              <Spec field={selected.travel} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.ecosystems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#334155] bg-[#121824] px-3 py-1.5 text-[11px] text-[#CBD5E1]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1E293B] pt-6">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Users size={16} className="text-[#10B981]" /> Regional infrastructure focus
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-[#CBD5E1]">
              {selected.focus.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[#10B981]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-xs leading-relaxed text-[#CBD5E1]">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
        <span>{REGIONAL_PORTFOLIO_DISCLAIMER}</span>
      </div>
    </section>
  );
}
