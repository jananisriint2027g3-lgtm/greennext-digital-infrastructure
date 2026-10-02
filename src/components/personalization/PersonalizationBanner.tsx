import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, X } from "../icons";
import { getCurrentPage, getSessionId, trackEvent } from "../../lib/analytics";
import { getPersonalizationRecommendation, type PersonalizationRecommendation } from "../../lib/action-layer";

export function PersonalizationBanner() {
  const [recommendation, setRecommendation] = useState<PersonalizationRecommendation | null>(null);

  useEffect(() => {
    setRecommendation(getPersonalizationRecommendation(getCurrentPage(), getSessionId()));
  }, []);

  if (!recommendation?.show) return null;

  return (
    <aside className="border-b border-[#1E293B] bg-[#0D1520]" aria-label="Personalized GreenNext recommendation">
      <div className="mx-auto flex max-w-[1340px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Sparkles size={16} className="shrink-0 text-[#10B981]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white">{recommendation.title}</p>
          <p className="mt-0.5 text-xs text-[#94A3B8]">{recommendation.body}</p>
        </div>
        <Link
          to={recommendation.primaryHref}
          onClick={() => trackEvent({ tab: "CTA Interactions", event: "personalized_recommendation_click", value: recommendation.primaryHref, page: getCurrentPage() })}
          className="hidden shrink-0 items-center gap-1.5 rounded-md border border-[#10B981]/50 px-3 py-2 text-[11px] font-semibold text-[#34D399] transition-colors hover:bg-[#10B981]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] sm:inline-flex"
        >
          {recommendation.primaryLabel}
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
        <Link
          to={recommendation.secondaryHref}
          onClick={() => trackEvent({ tab: "CTA Interactions", event: "personalized_recommendation_alt_click", value: recommendation.secondaryHref, page: getCurrentPage() })}
          className="hidden shrink-0 text-[11px] font-medium text-[#64748B] hover:text-[#CBD5E1] sm:inline-flex"
        >
          {recommendation.secondaryLabel}
        </Link>
        <button
          type="button"
          aria-label="Dismiss personalized recommendation"
          onClick={() => setRecommendation(null)}
          className="shrink-0 rounded-md p-1 text-[#64748B] hover:bg-[#1E293B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
