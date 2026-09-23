import { Link } from "@tanstack/react-router";
import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER, RegionInfo } from "../../data/regions";
import { PageHero } from "../common/PageHero";
import { LongFormCta } from "../common/CtaBlock";
import { CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Globe2 } from "lucide-react";
import maduraiImg from "../../assets/madurai-infrastructure.jpg";
import coimbatoreImg from "../../assets/coimbatore-infrastructure.jpg";
import trichyImg from "../../assets/trichy-infrastructure.jpg";
import mangaloreImg from "../../assets/mangalore-infrastructure.jpg";

const REGION_IMAGES: Record<string, { src: string; alt: string }> = {
  madurai: {
    src: maduraiImg,
    alt: "Madurai regional technology and infrastructure corridor — telecommunications and urban connectivity context in South India",
  },
  coimbatore: {
    src: coimbatoreImg,
    alt: "Coimbatore industrial technology park — manufacturing and engineering ecosystem in western Tamil Nadu",
  },
  trichy: {
    src: trichyImg,
    alt: "Tiruchirappalli central Tamil Nadu highway and rail connectivity junction — regional transit infrastructure corridor",
  },
  mangalore: {
    src: mangaloreImg,
    alt: "Mangalore coastal port infrastructure — maritime connectivity and cargo handling gateway in coastal Karnataka",
  },
};

export function RegionalPageTemplate({ region }: { region: RegionInfo }) {
  const otherRegions = Object.values(REGIONS_DATA).filter((r) => r.id !== region.id);
  const regionImg = REGION_IMAGES[region.id] ?? REGION_IMAGES.madurai;

  const breadcrumbs = [
    { label: "Regions", path: "/regions/overview" },
    { label: `${region.name} (${region.code})` },
  ];

  return (
    <div className="w-full bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={breadcrumbs}
        eyebrow={`Focus Region // ${region.code}`}
        h1={`${region.name} — ${region.tagline}`}
        intro={region.intro}
        isConceptual={true}
        cta={{
          label: "View in Regional Dashboard →",
          path: "/regions/overview#dashboard",
        }}
      />

      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Regional Context Photography Card (Illustrative) */}
            <div className="rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0B0F17] shadow-xl group">
              <div className="aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden bg-[#070A0E]">
                <img
                  src={regionImg.src}
                  alt={regionImg.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-4 py-2.5 bg-[#121824] border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                <span>REGIONAL CONTEXT // {region.name.toUpperCase()} (ILLUSTRATIVE)</span>
                <span className="text-[#10B981]">SOUTH INDIA CORRIDOR</span>
              </div>
            </div>

            {/* Section 1: Regional Infrastructure Relevance */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold block mb-2">
                01 // Regional Mandate
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Infrastructure Relevance
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6">
                {region.infrastructureRelevance}
              </p>

              <div className="p-4 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 text-xs text-[#CBD5E1]">
                <strong>Strategic Network Role:</strong> {region.networkRole}
              </div>
            </section>

            {/* Section 2: Technology & Industrial Ecosystem */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold block mb-2">
                02 // Local Capacity
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Technology & Engineering Ecosystem
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6">
                {region.ecosystem}
              </p>

              <h3 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-3">
                Connectivity & Logistics Assets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {region.transitInfo.map((transit) => (
                  <div
                    key={transit}
                    className="p-3 rounded-lg border border-[#1E293B] bg-[#121824] flex items-center gap-2.5 text-xs text-white"
                  >
                    <CheckCircle2 size={15} className="text-[#10B981] flex-shrink-0" />
                    <span>{transit}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Strategic Purpose & Regional Intent */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold block mb-2">
                03 // Strategic Intent
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Regional Focus & Next Steps
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6">
                {region.regionalIntent}
              </p>

              <div className="pt-4 border-t border-[#1E293B] flex items-center gap-2 text-xs text-[#64748B]">
                <ShieldCheck size={16} className="text-[#10B981] flex-shrink-0" />
                <span>{REGIONAL_NETWORK_DISCLAIMER}</span>
              </div>
            </section>
          </div>

          {/* Sidebar: Explore Sister Nodes (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-xl sticky top-28">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#1E293B]">
                <Globe2 size={16} className="text-[#10B981]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Complementary Regional Nodes
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                {otherRegions.map((other) => (
                  <Link
                    key={other.id}
                    to={`/regions/${other.id}`}
                    className="p-3 rounded-xl border border-[#1E293B] bg-[#121824] hover:bg-[#1A2234] hover:border-[#334155] transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-[#10B981] transition-colors">
                          {other.name}
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-[#070A0E] text-[#94A3B8]">
                          {other.code}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] block truncate max-w-[200px]">
                        {other.category}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[#64748B] group-hover:text-[#10B981] transition-colors"
                    />
                  </Link>
                ))}
              </div>

              <Link
                to="/regions/overview"
                className="w-full py-2.5 rounded-lg border border-[#334155] bg-[#121824] hover:bg-[#10B981] hover:text-[#070A0E] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>View Full Regional Topology</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </aside>
        </div>

        <LongFormCta
          title={`Discuss Infrastructure in ${region.name}`}
          copy={`Connect with our infrastructure team to evaluate local power feeds, connectivity routes, and deployment requirements across ${region.name} and surrounding districts.`}
        />
      </main>
    </div>
  );
}
