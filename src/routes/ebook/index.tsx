import { createFileRoute } from "@tanstack/react-router";
import { InternalLink as Link } from "../../components/common/InternalLink";

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
    { num: "01", title: "Why AI Changes Infrastructure", pages: "pp. 5–6" },
    { num: "02", title: "The Seven-Layer Operational Stack", pages: "pp. 7–8" },
    { num: "03", title: "What ‘AI-Ready’ Really Means", pages: "pp. 9–10" },
    { num: "04", title: "Energy: The Closed Loop", pages: "pp. 11–13" },
    { num: "05", title: "Intelligent Automation", pages: "pp. 14–15" },
    { num: "06", title: "Six Enterprise Use Cases", pages: "pp. 16–18" },
    { num: "07", title: "A Distributed Regional Model for South India", pages: "pp. 19–22" },
    { num: "08", title: "Sustainability Without the Spin", pages: "pp. 23–24" },
    { num: "09", title: "The GreenNext Methodology", pages: "pp. 25–26" },
    { num: "10", title: "Your Planning Checklist and FAQ", pages: "pp. 27–28" },
  ];

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
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

          <div className="border-t border-[#1E293B] pt-4 text-xs text-[#94A3B8]">
            <span className="font-semibold text-white">Publication appendices:</span> Glossary (p. 29) · Start a technical conversation (p. 30)
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
