import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";
import { ArrowRight, Sparkles } from "../icons";

interface PageHeroProps {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  h1: string;
  intro: string;
  isConceptual?: boolean;
  cta?: {
    label: string;
    path: string;
  };
  secondaryAction?: ReactNode;
}

export function PageHero({
  breadcrumbs,
  eyebrow,
  h1,
  intro,
  isConceptual,
  cta,
  secondaryAction,
}: PageHeroProps) {
  return (
    <div className="relative pt-12 pb-16 border-b border-[#1E293B] bg-gradient-to-b from-[#0B0F17] to-[#070A0E] overflow-hidden">
      {/* Subtle Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs items={breadcrumbs} />

        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
              {eyebrow}
            </span>

            {isConceptual && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-[#94A3B8] flex items-center gap-1">
                <Sparkles size={10} className="text-[#10B981]" />
                <span>Conceptual Specification</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
            {h1}
          </h1>

          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-3xl mb-8">
            {intro}
          </p>

          {(cta || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-4">
              {cta && (
                <Link
                  to={cta.path}
                  className="px-5 py-2.5 rounded-lg bg-[#10B981] text-[#070A0E] text-sm font-semibold hover:bg-[#34D399] transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30"
                >
                  <span>{cta.label}</span>
                  <ArrowRight size={15} />
                </Link>
              )}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
