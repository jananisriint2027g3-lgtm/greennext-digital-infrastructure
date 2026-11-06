import { createFileRoute } from "@tanstack/react-router";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  BookOpen,
  ArrowRight,
  Lock,
  Layers,
  Zap,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/ebook/")({
  head: () => ({
    meta: [
      { title: "Intelligent Infrastructure Ebook | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Official GreenNext publication: Intelligent Infrastructure for a Sustainable Digital Future (Edition 2.0). 30 pages and 10 chapters on regional AI compute, thermal dynamics, and power topologies.",
      },
    ],
  }),
  component: EbookLandingPage,
});

export function EbookLandingPage() {
  const chapters = [
    { num: "01", title: "The Macro Shift: Sovereign AI & Green Compute Imperative", pages: "pp. 1–3" },
    { num: "02", title: "Regional Network Topologies: South India Multi-Node Fabric", pages: "pp. 4–6" },
    { num: "03", title: "Intelligent Power Architectures: Substation Integration & Renewables", pages: "pp. 7–9" },
    { num: "04", title: "Advanced Thermal Dynamics: Liquid Cooling & Heat Reuse", pages: "pp. 10–12" },
    { num: "05", title: "The 7-Layer Intelligent Infrastructure Stack", pages: "pp. 13–15" },
    { num: "06", title: "Operational Telemetry & Closed-Loop Automation", pages: "pp. 16–18" },
    { num: "07", title: "Workload Orchestration & Compute Density Optimization", pages: "pp. 19–21" },
    { num: "08", title: "Regional Economic Impact: Decentralized Compute Corridors", pages: "pp. 22–24" },
    { num: "09", title: "Environmental Accounting: Real-Time Carbon & PUE Metrics", pages: "pp. 25–27" },
    { num: "10", title: "Strategic Roadmap: Transitioning from Legacy DC to AI Infrastructure", pages: "pp. 28–30" },
  ];

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="border border-[#1E293B] bg-[#0A0F1D]/90 backdrop-blur-md rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Official GreenNext Publication &bull; Edition 2.0
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
              Intelligent Infrastructure for a Sustainable Digital Future
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
              A comprehensive technical framework examining decentralized sovereign AI compute, high-density liquid cooling topologies, and renewable energy pairing across South Indian infrastructure corridors.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/ebook/reader"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#10B981] hover:bg-[#059669] text-[#070A0E] shadow-lg shadow-[#10B981]/25 transition-all text-sm"
              >
                Open Interactive Reader
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/ebook/auth"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] transition-all text-sm"
              >
                <Lock className="w-4 h-4 text-[#10B981]" />
                Sign In / Register
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#1E293B]/80 text-xs text-[#94A3B8]">
              <div>
                <span className="font-bold text-white block text-sm">30 Pages</span>
                Full Comprehensive Edition
              </div>
              <div>
                <span className="font-bold text-white block text-sm">10 Chapters</span>
                Multi-Disciplinary Research
              </div>
              <div>
                <span className="font-bold text-white block text-sm">South India</span>
                4 Focus Corridors
              </div>
              <div>
                <span className="font-bold text-white block text-sm">7-Layer Model</span>
                Full Architectural Stack
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Table of Contents */}
        <div className="border border-[#1E293B] bg-[#0B132B]/60 rounded-xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Table of Contents & Chapters</h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Explore the complete scope of Edition 2.0 research modules.
              </p>
            </div>
            <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded border border-[#10B981]/20">
              Edition 2.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((ch) => (
              <div
                key={ch.num}
                className="bg-[#0A0F1D] border border-[#1E293B] hover:border-[#10B981]/40 transition-all rounded-lg p-4 flex items-start gap-3.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1E293B] group-hover:bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-colors">
                  {ch.num}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#10B981] transition-colors leading-snug">
                    {ch.title}
                  </h3>
                  <div className="text-[11px] font-mono text-[#64748B]">{ch.pages}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <Link
              to="/ebook/reader"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#10B981] hover:text-[#34D399] transition-colors"
            >
              Start Reading in Interactive Viewer &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
