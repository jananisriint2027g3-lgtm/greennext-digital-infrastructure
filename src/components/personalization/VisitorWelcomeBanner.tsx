import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import leafEmblemUrl from "../../../Tech-Eco Network Leaf Emblem.png";
import { ArrowRight, X } from "../icons";
import { getCurrentPage, getSessionId, trackEvent } from "../../lib/analytics";
import {
  getPersonalizationRecommendation,
  type PersonalizationRecommendation,
} from "../../lib/action-layer";
import {
  getWebsiteGreeting,
  dismissWebsiteGreeting,
  type WebsiteGreetingResult,
} from "../../lib/visitor-greetings";

export function VisitorWelcomeBanner() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [greeting, setGreeting] = useState<WebsiteGreetingResult | null>(null);
  const [recommendation, setRecommendation] = useState<PersonalizationRecommendation | null>(null);

  useEffect(() => {
    const result = getWebsiteGreeting();
    setGreeting(result);
    setRecommendation(
      result.isReturning ? getPersonalizationRecommendation(pathname, getSessionId()) : null,
    );

    if (!result.isDismissed) {
      trackEvent({
        tab: "CTA Interactions",
        event: result.isReturning
          ? "returning_visitor_welcome_impression"
          : "first_visit_welcome_impression",
        value: result.text.substring(0, 40),
        page: getCurrentPage(),
      });
    }
  }, [pathname]);

  if (!greeting || greeting.isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    dismissWebsiteGreeting();
    setGreeting((prev) => (prev ? { ...prev, isDismissed: true } : null));
    trackEvent({
      tab: "CTA Interactions",
      event: "welcome_banner_dismiss",
      value: greeting.isReturning ? "returning_visitor" : "first_visit",
      page: getCurrentPage(),
    });
  };

  const actionHref = recommendation?.show
    ? recommendation.primaryHref
    : greeting.isReturning
      ? "/infrastructure"
      : "/solutions";
  const actionLabel = recommendation?.show
    ? recommendation.primaryLabel
    : greeting.isReturning
      ? "Explore Smarter Infrastructure"
      : "Explore Solutions";

  return (
    <aside
      className="relative z-30 border-b border-[#1E293B] bg-gradient-to-r from-[#09111C] via-[#0E1B2A] to-[#09111C] shadow-inner"
      aria-label="GreenNext visitor welcome"
    >
      <div className="mx-auto flex w-full max-w-[1340px] flex-wrap items-start justify-between gap-2 px-4 py-2.5 sm:items-center sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
              greeting.isReturning
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            }`}
            aria-hidden="true"
          >
            <img
              src={leafEmblemUrl}
              alt=""
              className="h-5 w-5 object-contain"
              width={20}
              height={20}
              aria-hidden="true"
            />
          </span>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                greeting.isReturning
                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              }`}
            >
              {greeting.isReturning ? "Welcome Back" : "Welcome"}
            </span>

            <div className="min-w-0">
              <p className="line-clamp-2 text-xs font-normal text-[#E2E8F0] sm:truncate sm:text-sm">
                {greeting.text}
              </p>
              {recommendation?.show && (
                <p className="line-clamp-2 text-[11px] text-[#94A3B8] sm:truncate sm:text-xs">
                  {recommendation.body}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={actionHref}
            onClick={() => {
              trackEvent({
                tab: "CTA Interactions",
                event: "welcome_banner_action_click",
                value: actionHref,
                page: getCurrentPage(),
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>

          {recommendation?.show && (
            <Link
              to={recommendation.secondaryHref}
              onClick={() => {
                trackEvent({
                  tab: "CTA Interactions",
                  event: "personalized_recommendation_alt_click",
                  value: recommendation.secondaryHref,
                  page: getCurrentPage(),
                });
              }}
              className="hidden rounded-md px-2 py-1.5 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:inline-flex"
            >
              Explore Another Area
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss welcome message"
            title="Dismiss welcome message"
            className="rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
