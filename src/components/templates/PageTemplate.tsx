import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { DedicatedPageData } from "../../data/pagesContent";
import { PageHero } from "../common/PageHero";
import { LongFormCta, ShortFormCta } from "../common/CtaBlock";
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles, Layers } from "../icons";
import { trackEvent } from "../../lib/analytics";
import datacenterExteriorImg from "../../assets/datacenter-facility-exterior.jpg";
import aiComputeImg from "../../assets/ai-compute-cluster.jpg";
import coolingImg from "../../assets/cooling-systems.jpg";
import powerImg from "../../assets/power-distribution.jpg";
import nocImg from "../../assets/operations-noc.jpg";

function getPageFeaturedImage(data: DedicatedPageData) {
  if (data.route?.startsWith("/about") || data.category === "About") {
    return {
      src: datacenterExteriorImg,
      alt: "Contemporary enterprise data center facility exterior with sustainable landscaping",
      caption: "ENTERPRISE DIGITAL INFRASTRUCTURE FACILITY (ILLUSTRATIVE)",
      tag: "FACILITY ARCHITECTURE",
    };
  }
  if (data.slug === "cooling" || data.slug === "efficient-cooling") {
    return {
      src: coolingImg,
      alt: "Industrial data center mechanical chiller plant with heavy insulated piping and pumps",
      caption: "CHILLED WATER COOLING & THERMAL DISSIPATION (ILLUSTRATIVE)",
      tag: "COOLING INFRASTRUCTURE",
    };
  }
  if (data.slug === "ai-ready" || data.slug === "infrastructure") {
    return {
      src: aiComputeImg,
      alt: "High-density enterprise server racks with organized structured cabling in data center",
      caption: "HIGH-DENSITY AI COMPUTE CLUSTERS (ILLUSTRATIVE)",
      tag: "AI COMPUTE RACKS",
    };
  }
  if (data.route?.startsWith("/energy") || data.category === "Energy") {
    return {
      src: powerImg,
      alt: "Industrial data center electrical power distribution room with switchgear and busways",
      caption: "ELECTRICAL POWER DISTRIBUTION & UPS INFRASTRUCTURE (ILLUSTRATIVE)",
      tag: "POWER INFRASTRUCTURE",
    };
  }
  if (data.route?.startsWith("/automation") || data.category === "Automation") {
    return {
      src: nocImg,
      alt: "Enterprise data center network operations center with telemetry monitoring workstations",
      caption: "NETWORK OPERATIONS CENTER & TELEMETRY MONITORING (ILLUSTRATIVE)",
      tag: "NOC OPERATIONS",
    };
  }
  return null;
}

export function PageTemplate({
  data,
  showCta = true,
}: {
  data: DedicatedPageData;
  showCta?: boolean;
}) {
  useEffect(() => {
    if (data.route?.startsWith("/infrastructure") || data.category === "Infrastructure") {
      trackEvent({
        tab: "Infrastructure",
        event: "infra_capability_view",
        value: data.slug || data.title,
        page: data.route,
      });
    } else if (data.route?.startsWith("/energy") || data.category === "Energy") {
      trackEvent({
        tab: "Energy",
        event: "energy_topic_view",
        value: data.slug || data.title,
        page: data.route,
      });
    }
  }, [data.route, data.category, data.slug, data.title]);

  const breadcrumbs = [{ label: data.category, path: data.parentPath }, { label: data.title }];
  const featuredImage = getPageFeaturedImage(data);

  return (
    <div className="w-full bg-[#070A0E] text-white">
      {/* Page Hero */}
      <PageHero
        breadcrumbs={breadcrumbs}
        eyebrow={data.eyebrow}
        h1={data.h1}
        intro={data.intro}
        isConceptual={data.isConceptual}
        cta={data.cta}
      />

      {/* Main Content Body */}
      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Primary Content Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* Contextual Enterprise Infrastructure Photography */}
            {featuredImage && (
              <div className="rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0B0F17] shadow-xl group">
                <div className="aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden bg-[#070A0E]">
                  <img
                    src={featuredImage.src}
                    alt={featuredImage.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-4 py-2.5 bg-[#121824] border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                  <span>{featuredImage.caption}</span>
                  <span className="text-[#10B981]">{featuredImage.tag}</span>
                </div>
              </div>
            )}
            {data.sections.map((section, idx) => (
              <section
                key={section.title}
                className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-xs text-[#10B981] font-semibold">
                    0{idx + 1} //
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {section.title}
                  </h2>
                </div>

                {/* Paragraphs */}
                <div className="space-y-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6">
                  {section.body.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {/* Optional Callout Box */}
                {section.callout && (
                  <div className="my-6 p-4 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 text-sm text-[#CBD5E1] border-l-4 border-l-[#10B981]">
                    {section.callout}
                  </div>
                )}

                {/* Optional Cards Grid */}
                {section.cards && section.cards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {section.cards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-xl border border-[#1E293B] bg-[#121824] p-5 flex flex-col justify-between"
                      >
                        <div>
                          {card.meta && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] block mb-1">
                              {card.meta}
                            </span>
                          )}
                          <h4 className="text-sm font-semibold text-white mb-2">{card.title}</h4>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Bulleted List */}
                {section.list && section.list.length > 0 && (
                  <div className="space-y-2.5 mt-6 pt-4 border-t border-[#1E293B]">
                    {section.list.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-[#CBD5E1]"
                      >
                        <CheckCircle2 size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {/* In-Page Action Banner */}
            <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#121824] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[#10B981] uppercase tracking-wider block mb-1">
                  Next Step in Lifecycle
                </span>
                <h4 className="text-base font-bold text-white">
                  Continue Exploring {data.category}
                </h4>
              </div>
              <Link
                to={data.cta.path}
                className="px-5 py-2.5 rounded-lg bg-[#10B981] text-[#070A0E] text-xs font-semibold hover:bg-[#34D399] transition-all flex items-center gap-2 flex-shrink-0"
              >
                <span>{data.cta.label}</span>
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar Navigation (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Related Pages Widget */}
            <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-xl sticky top-28">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#1E293B]">
                <Layers size={16} className="text-[#10B981]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Related Architecture Pages
                </h3>
              </div>

              <div className="space-y-2 mb-6">
                {data.relatedPages.map((rel) => (
                  <Link
                    key={rel.title}
                    to={rel.path}
                    className="p-3 rounded-lg border border-[#1E293B] bg-[#121824] hover:bg-[#1A2234] hover:border-[#334155] text-xs font-medium text-white transition-all flex items-center justify-between group"
                  >
                    <span className="group-hover:text-[#10B981] transition-colors">
                      {rel.title}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-[#64748B] group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                ))}
              </div>

              {/* Factual Disclaimer Card */}
              <div className="p-4 rounded-xl border border-[#1E293B] bg-[#070A0E] text-[11px] text-[#64748B] leading-relaxed">
                <p>
                  <strong>Note on Specifications:</strong> GreenNext operates as an infrastructure
                  initiative. Technical models and workflows presented reflect architecture planning
                  specifications rather than claims of currently deployed production data centers.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Global Long-Form Conversion CTA */}
        {showCta && <LongFormCta />}
      </main>
    </div>
  );
}
