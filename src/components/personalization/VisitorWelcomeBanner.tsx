import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, X } from "../icons";
import { getCurrentPage, trackEvent } from "../../lib/analytics";
import {
  getWebsiteGreeting,
  dismissWebsiteGreeting,
  type WebsiteGreetingResult,
} from "../../lib/visitor-greetings";

export function VisitorWelcomeBanner() {
  const [greeting, setGreeting] = useState<WebsiteGreetingResult | null>(null);

  useEffect(() => {
    const result = getWebsiteGreeting();
    setGreeting(result);

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
  }, []);

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

  const actionHref = greeting.isReturning ? "/infrastructure" : "/solutions";
  const actionLabel = greeting.isReturning ? "Explore Smarter Infrastructure" : "Explore Solutions";

  return (
    <aside
      className="relative z-30 border-b border-[#1E293B] bg-gradient-to-r from-[#09111C] via-[#0E1B2A] to-[#09111C] shadow-inner"
      aria-label="GreenNext visitor welcome"
    >
      <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
              greeting.isReturning
                ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]"
                : "border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399]"
            }`}
            aria-hidden="true"
          >
            <Sparkles size={15} />
          </span>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                greeting.isReturning
                  ? "border border-[#38BDF8]/30 bg-[#38BDF8]/15 text-[#38BDF8]"
                  : "border border-[#10B981]/30 bg-[#10B981]/15 text-[#34D399]"
              }`}
            >
              {greeting.isReturning ? "Welcome Back" : "Welcome"}
            </span>

            <p className="truncate text-xs font-normal text-[#E2E8F0] sm:text-sm">
              {greeting.text}
            </p>
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
            className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/50 bg-[#10B981]/10 px-3 py-1.5 text-xs font-medium text-[#34D399] transition-colors hover:bg-[#10B981]/20 hover:text-[#6EE7B7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss welcome message"
            title="Dismiss welcome message"
            className="rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
