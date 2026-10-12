import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchVercelAnalyticsMetrics, type VercelAnalyticsMetricSummary } from "./vercel-analytics.server";
import {
  runDailyWebsiteAnalysis,
  getLatestAnalysisRun,
  getAnalysisRunHistory,
  type DailyAnalysisRunResult,
} from "./daily-analysis.server";

export interface DashboardIntelligenceServerData {
  vercelMetrics: VercelAnalyticsMetricSummary;
  latestRun: DailyAnalysisRunResult | null;
  runHistory: DailyAnalysisRunResult[];
}

/**
 * Server function to fetch real Vercel metrics and latest analysis state for the dashboard.
 */
export const getDashboardIntelligenceData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardIntelligenceServerData> => {
    try {
      const vercelMetrics = await fetchVercelAnalyticsMetrics(7);
      const latestRun = getLatestAnalysisRun();
      const runHistory = getAnalysisRunHistory();

      return {
        vercelMetrics,
        latestRun,
        runHistory,
      };
    } catch (error) {
      console.error("Failed to fetch dashboard intelligence server data:", error);
      return {
        vercelMetrics: {
          status: "unavailable",
          totalVisitors: null,
          totalPageviews: null,
          topPages: [],
          topReferrers: [],
          topCountries: [],
          topDevices: [],
          trend: [],
          dataQuality: "unavailable",
          reportingPeriod: { from: new Date().toISOString(), to: new Date().toISOString() },
          note: "Server error occurred while loading server intelligence data.",
        },
        latestRun: null,
        runHistory: [],
      };
    }
  },
);

const MANUAL_TRIGGER_COOLDOWN_MS = 60 * 1000; // 60s cooldown per server instance
let lastManualTriggerTime = 0;

function getAdminSecret(): string {
  if (typeof process === "undefined") return "";
  return (
    process.env["INTELLIGENCE_ADMIN_KEY"]?.trim() ||
    process.env["CRON_SECRET"]?.trim() ||
    ""
  );
}

/**
 * Server function allowing an authorized administrator to manually trigger an intelligence analysis run.
 * Protected by cooldown rate limiting and optional admin secret validation.
 */
export const triggerManualIntelligenceRun = createServerFn({ method: "POST" })
  .validator(
    z.object({
      adminKey: z.string().optional(),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }): Promise<DailyAnalysisRunResult> => {
    const requiredSecret = getAdminSecret();

    // If a secret is configured on the server, require matching key
    if (requiredSecret) {
      if (!data.adminKey || data.adminKey.trim() !== requiredSecret) {
        throw new Error("Unauthorized: Invalid administrator key.");
      }
    } else {
      // If no admin secret is configured in environment, enforce strict 60s cooldown
      // to prevent resource exhaustion and Jira spam from unauthenticated visitors
      const now = Date.now();
      if (now - lastManualTriggerTime < MANUAL_TRIGGER_COOLDOWN_MS) {
        const remainingSec = Math.ceil((MANUAL_TRIGGER_COOLDOWN_MS - (now - lastManualTriggerTime)) / 1000);
        throw new Error(`Rate limited: Please wait ${remainingSec}s before triggering another analysis run.`);
      }
      lastManualTriggerTime = now;
    }

    return await runDailyWebsiteAnalysis(data.force !== undefined ? { force: data.force } : undefined);
  });
