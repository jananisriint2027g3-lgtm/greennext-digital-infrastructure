import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { SolutionItem } from "../../data/solutions";
import { PageHero } from "../common/PageHero";
import { LongFormCta } from "../common/CtaBlock";
import { AlertCircle, CheckCircle2, TrendingUp, ArrowRight, Layers } from "../icons";
import { trackEvent } from "../../lib/analytics";
import aiComputeImg from "../../assets/ai-compute-cluster.jpg";
import coolingImg from "../../assets/cooling-systems.jpg";
import powerImg from "../../assets/power-distribution.jpg";
import nocImg from "../../assets/operations-noc.jpg";
import regionalImg from "../../assets/regional-south-india.jpg";
import datacenterExteriorImg from "../../assets/datacenter-facility-exterior.jpg";

function getSolutionImage(solutionId: string) {
  switch (solutionId) {
    case "ai-workload-management":
      return {
        src: aiComputeImg,
        alt: "High-density enterprise server racks with organized structured cabling in data center",
        caption: "HIGH-DENSITY COMPUTE ARCHITECTURE (ILLUSTRATIVE)",
        tag: "AI WORKLOADS",
      };
    case "cooling-optimization":
      return {
        src: coolingImg,
        alt: "Industrial data center mechanical chiller plant with heavy insulated piping and pumps",
        caption: "PRECISION COOLING & THERMAL EXTRACTION (ILLUSTRATIVE)",
        tag: "COOLING SYSTEMS",
      };
    case "energy-monitoring":
      return {
        src: powerImg,
        alt: "Industrial data center electrical power distribution room with switchgear and busways",
        caption: "FACILITY POWER & SENSOR TELEMETRY (ILLUSTRATIVE)",
        tag: "POWER & TELEMETRY",
      };
    case "health-monitoring":
    case "anomaly-detection":
    case "automated-alerts":
      return {
        src: nocImg,
        alt: "Enterprise data center network operations center with telemetry monitoring workstations",
        caption: "CONTINUOUS TELEMETRY & OPERATIONS MONITORING (ILLUSTRATIVE)",
        tag: "NOC MONITORING",
      };
    case "capacity-planning":
    default:
      return {
        src: datacenterExteriorImg,
        alt: "Contemporary enterprise data center facility exterior with sustainable landscaping",
        caption: "SUSTAINABLE DIGITAL INFRASTRUCTURE PLANNING (ILLUSTRATIVE)",
        tag: "FACILITY PLANNING",
      };
  }
}

export function SolutionPageTemplate({ solution }: { solution: SolutionItem }) {
  useEffect(() => {
    trackEvent({
      tab: "Solutions",
      event: "solution_view",
      value: solution.title,
      page: `/solutions/${solution.id}`,
    });
  }, [solution.id, solution.title]);

  const breadcrumbs = [{ label: "Solutions", path: "/solutions" }, { label: solution.title }];
  const solutionImg = getSolutionImage(solution.id);

  return (
    <div className="min-h-screen bg-[#070A0E] text-white">
      <PageHero
        breadcrumbs={breadcrumbs}
        eyebrow={solution.eyebrow}
        h1={solution.title}
        intro={`An operational solution framework designed for data center operators and engineering teams managing demanding AI-era workloads.`}
        isConceptual={true}
        cta={solution.cta}
      />

      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Contextual Solution Infrastructure Photography */}
            <div className="rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0B0F17] shadow-xl group">
              <div className="aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden bg-[#070A0E]">
                <img
                  src={solutionImg.src}
                  alt={solutionImg.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="px-4 py-2.5 bg-[#121824] border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                <span>{solutionImg.caption}</span>
                <span className="text-[#10B981]">{solutionImg.tag}</span>
              </div>
            </div>
            {/* The Problem */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-[#F59E0B]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
                  The Operational Challenge
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">The Problem</h2>

              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                {solution.problem}
              </p>
            </section>

            {/* The GreenNext Approach */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className="text-[#10B981]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
                  Engineering Methodology
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                The GreenNext Approach
              </h2>

              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                {solution.approach}
              </p>
            </section>

            {/* Expected Operational Value */}
            <section className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-[#06B6D4]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4] font-semibold">
                  Intended Operational Outcome
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Expected Operational Value
              </h2>

              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                {solution.expectedValue}
              </p>

              <div className="mt-6 p-4 rounded-xl border border-[#1E293B] bg-[#121824] text-xs text-[#64748B]">
                <strong>Factual Boundary:</strong> Operational value statements reflect intended
                engineering outcomes. GreenNext does not publish speculative percentage savings or
                unverified case statistics.
              </div>
            </section>
          </div>

          {/* Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 shadow-xl sticky top-28">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#1E293B]">
                <Layers size={16} className="text-[#10B981]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Related Capabilities
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                {solution.relatedCapabilities.map((cap) => (
                  <Link
                    key={cap.label}
                    to={cap.path}
                    className="p-3 rounded-lg border border-[#1E293B] bg-[#121824] hover:bg-[#1A2234] hover:border-[#334155] text-xs font-medium text-white transition-all flex items-center justify-between group"
                  >
                    <span className="group-hover:text-[#10B981] transition-colors">
                      {cap.label}
                    </span>
                    <ArrowRight
                      size={13}
                      className="text-[#64748B] group-hover:text-[#10B981] transition-colors"
                    />
                  </Link>
                ))}
              </div>

              <Link
                to="/solutions"
                className="w-full py-2.5 rounded-lg border border-[#334155] bg-[#121824] hover:bg-[#10B981] hover:text-[#070A0E] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>View All 7 Use Cases</span>
              </Link>
            </div>
          </aside>
        </div>

        <LongFormCta
          eyebrow="Solution Inquiry"
          title={`Deploy ${solution.title}`}
          copy="Discuss your facility parameters and telemetry requirements with our engineering team to evaluate feasibility and implementation architecture."
        />
      </main>
    </div>
  );
}
