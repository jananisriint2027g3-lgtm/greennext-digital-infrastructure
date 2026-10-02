import { useEffect } from "react";
import { getCurrentPage, trackEngagement, trackPageDwell, trackScrollDepth, trackSessionEnd } from "../lib/analytics";

const SCROLL_THRESHOLDS = [25, 50, 75, 90, 100] as const;
const ENGAGEMENT_MILESTONES = [30, 60, 120] as const;

/** Tracks lightweight, page-scoped engagement signals and resets on route changes. */
export function usePageBehaviorTracking(pathname: string): void {
  useEffect(() => {
    const page = pathname || getCurrentPage();
    const sentScroll = new Set<number>();
    const sentEngagement = new Set<number>();
    let frame: number | null = null;
    let activeSince = document.visibilityState === "visible" ? Date.now() : null;
    let accumulatedActiveMs = 0;
    let pageDwellSent = false;

    const checkScroll = () => {
      frame = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = (window.scrollY / scrollable) * 100;
      for (const threshold of SCROLL_THRESHOLDS) {
        if (percent >= threshold && !sentScroll.has(threshold)) {
          sentScroll.add(threshold);
          trackScrollDepth(threshold, page);
        }
      }
    };

    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(checkScroll);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (activeSince !== null) accumulatedActiveMs += Date.now() - activeSince;
        activeSince = null;
      } else if (activeSince === null) {
        activeSince = Date.now();
      }
    };

    const recordPageDwell = () => {
      if (activeSince !== null) accumulatedActiveMs += Date.now() - activeSince;
      activeSince = null;
      if (!pageDwellSent) {
        pageDwellSent = true;
        trackPageDwell(accumulatedActiveMs, page);
      }
    };

    const onPageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        recordPageDwell();
        trackSessionEnd(page);
      }
    };

    const engagementTimer = window.setInterval(() => {
      if (activeSince === null) return;
      const activeMs = accumulatedActiveMs + (Date.now() - activeSince);
      for (const milestone of ENGAGEMENT_MILESTONES) {
        if (activeMs >= milestone * 1000 && !sentEngagement.has(milestone)) {
          sentEngagement.add(milestone);
          trackEngagement(milestone, page);
        }
      }
    }, 1000);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    checkScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(engagementTimer);
      if (frame !== null) window.cancelAnimationFrame(frame);
      recordPageDwell();
    };
  }, [pathname]);
}
