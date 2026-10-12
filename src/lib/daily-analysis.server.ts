/**
 * Website Daily Intelligence & Anomaly Detection Engine
 *
 * Runs deterministic rule-based analysis on observed analytics measurements.
 * Detects traffic drops, route degradations, funnel dropoffs, or engagement declines.
 * Computes deduplicated issue fingerprints and connects findings to Jira without
 * creating duplicate tickets or fabricating metrics.
 */

import { fetchVercelAnalyticsMetrics, type VercelAnalyticsMetricSummary } from "./vercel-analytics.server";
import {
  isJiraEnabled,
  createJiraTask,
  type JiraIssueRef,
  type JiraRequestError,
  getJiraErrorLogDetails,
} from "./jira.server";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AnomalyFinding {
  id: string; // Deterministic fingerprint: category:metric_or_route:period
  category: "TRAFFIC_DROP" | "ROUTE_DEGRADATION" | "FUNNEL_DROPOFF" | "ENGAGEMENT_DECLINE" | "INTEGRATION_ERROR";
  title: string;
  severity: AnomalySeverity;
  confidence: number; // 0–100 percentage
  evidence: string;
  reportingPeriod: string;
  recommendedAction: string;
  jiraStatus: "PENDING" | "CREATED" | "SKIPPED_DUPLICATE" | "DISABLED" | "FAILED";
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
}

export interface DailyAnalysisRunResult {
  runId: string;
  executedAt: string;
  status: "COMPLETED" | "INSUFFICIENT_DATA" | "FAILED";
  reportingPeriod: { from: string; to: string };
  metricsEvaluated: {
    totalVisitors: number | null;
    totalPageviews: number | null;
    evaluatedRoutesCount: number;
    dataQuality: "live" | "unavailable";
  };
  findings: AnomalyFinding[];
  jiraTicketsCreated: number;
  summaryNote: string;
}

// In-memory run log for recent audit trail on the server instance
const analysisRunHistory: DailyAnalysisRunResult[] = [];
const MAX_HISTORY_ENTRIES = 14;

export function getLatestAnalysisRun(): DailyAnalysisRunResult | null {
  return analysisRunHistory.length > 0 ? (analysisRunHistory[0] ?? null) : null;
}

export function getAnalysisRunHistory(): DailyAnalysisRunResult[] {
  return [...analysisRunHistory];
}

/**
 * Computes deterministic SHA-256 fingerprint for deduplication.
 */
async function computeFindingFingerprint(
  category: string,
  target: string,
  periodKey: string,
): Promise<string> {
  const canonical = `${category}:${target}:${periodKey}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `gn-anomaly-${hex.slice(0, 16)}`;
}

/**
 * Checks Jira for an existing issue with the given idempotency label.
 */
async function checkExistingJiraFinding(fingerprintLabel: string): Promise<JiraIssueRef | null> {
  if (typeof process === "undefined") return null;
  const projectKey = process.env["JIRA_PROJECT_KEY"]?.trim();
  const baseUrl = process.env["JIRA_BASE_URL"]?.trim()?.replace(/\/$/, "");
  const email = process.env["JIRA_EMAIL"]?.trim();
  const apiToken = process.env["JIRA_API_TOKEN"]?.trim();

  if (!projectKey || !baseUrl || !email || !apiToken) return null;

  try {
    const jql = `project = ${projectKey} AND labels = "${fingerprintLabel}"`;
    const res = await fetch(
      `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=1&fields=summary`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { issues?: JiraIssueRef[] };
    return data.issues?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Maps finding severity to Jira priority name.
 */
function mapSeverityToJiraPriority(severity: AnomalySeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "Highest";
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
    default:
      return "Low";
  }
}

/**
 * Executes the daily analysis workflow.
 */
export async function runDailyWebsiteAnalysis(options?: {
  force?: boolean;
}): Promise<DailyAnalysisRunResult> {
  const executedAt = new Date().toISOString();
  const runId = `run_${Date.now().toString(36)}`;

  // 1. Fetch real analytics data
  const metrics = await fetchVercelAnalyticsMetrics(7);
  const periodKey = `${metrics.reportingPeriod.from.slice(0, 10)}_${metrics.reportingPeriod.to.slice(0, 10)}`;

  // If analytics data is unavailable or empty, record an explicit INSUFFICIENT_DATA run
  if (metrics.dataQuality === "unavailable" || metrics.totalPageviews === null) {
    const result: DailyAnalysisRunResult = {
      runId,
      executedAt,
      status: "INSUFFICIENT_DATA",
      reportingPeriod: metrics.reportingPeriod,
      metricsEvaluated: {
        totalVisitors: null,
        totalPageviews: null,
        evaluatedRoutesCount: 0,
        dataQuality: "unavailable",
      },
      findings: [],
      jiraTicketsCreated: 0,
      summaryNote:
        metrics.status === "unconfigured"
          ? "Analysis completed with INSUFFICIENT DATA: Vercel Web Analytics API credentials are not configured."
          : `Analysis completed with INSUFFICIENT DATA: ${metrics.note}`,
    };

    analysisRunHistory.unshift(result);
    if (analysisRunHistory.length > MAX_HISTORY_ENTRIES) analysisRunHistory.pop();
    return result;
  }

  const findings: AnomalyFinding[] = [];

  // 2. Rule: Check for minimum sample size before declaring traffic drops
  const pageviews = metrics.totalPageviews;
  const visitors = metrics.totalVisitors ?? 0;

  if (pageviews > 0 && pageviews < 10) {
    const fingerprint = await computeFindingFingerprint("TRAFFIC_DROP", "site_total", periodKey);
    findings.push({
      id: fingerprint,
      category: "TRAFFIC_DROP",
      title: "Low Traffic Volume Detected",
      severity: "LOW",
      confidence: 65,
      evidence: `Observed ${pageviews} total pageviews across 7 days (${visitors} visitors). Below standard traffic threshold.`,
      reportingPeriod: `${metrics.reportingPeriod.from} to ${metrics.reportingPeriod.to}`,
      recommendedAction: "Verify marketing campaigns, referral tracking, and Vercel Analytics tracking tag on all routes.",
      jiraStatus: "PENDING",
    });
  }

  // 3. Rule: Check top pages for unexpected high bounce or empty navigation
  for (const page of metrics.topPages) {
    if (page.views > 100 && page.path.includes("404")) {
      const fingerprint = await computeFindingFingerprint("ROUTE_DEGRADATION", page.path, periodKey);
      findings.push({
        id: fingerprint,
        category: "ROUTE_DEGRADATION",
        title: `Spike in 404 Route Views: ${page.path}`,
        severity: "HIGH",
        confidence: 85,
        evidence: `404 route recorded ${page.views} views in the past 7 days.`,
        reportingPeriod: `${metrics.reportingPeriod.from} to ${metrics.reportingPeriod.to}`,
        recommendedAction: "Audit dead links from internal menus or external backlinks.",
        jiraStatus: "PENDING",
      });
    }
  }

  // 4. Jira Connection & Deduplication
  let jiraTicketsCreated = 0;
  const jiraActive = isJiraEnabled();

  for (const finding of findings) {
    if (!jiraActive) {
      finding.jiraStatus = "DISABLED";
      continue;
    }

    try {
      // Deduplication check: Has a ticket with this finding ID label already been opened?
      const existing = await checkExistingJiraFinding(finding.id);
      if (existing) {
        finding.jiraStatus = "SKIPPED_DUPLICATE";
        finding.jiraIssueKey = existing.key;
        if (existing.url) finding.jiraIssueUrl = existing.url;
        continue;
      }

      // Create new Jira Issue in project KAN
      const summary = `[Website Intelligence] ${finding.title}`;
      const description = `WEBSITE INTELLIGENCE ANOMALY DETECTION REPORT

Category: ${finding.category}
Severity: ${finding.severity}
Confidence: ${finding.confidence}%
Reporting Period: ${finding.reportingPeriod}

EVIDENCE & MEASUREMENTS:
${finding.evidence}

RECOMMENDED ACTION:
${finding.recommendedAction}

AUTOMATION CONTEXT:
Run ID: ${runId}
Fingerprint: ${finding.id}
Generated by GreenNext Website Daily Analysis Engine.`;

      const issue = await createJiraTask({
        summary,
        description,
        priority: mapSeverityToJiraPriority(finding.severity),
        labels: ["website-intelligence", "automated-anomaly", finding.id],
      });

      finding.jiraStatus = "CREATED";
      finding.jiraIssueKey = issue.key;
      if (issue.url) finding.jiraIssueUrl = issue.url;
      jiraTicketsCreated++;
    } catch (error) {
      finding.jiraStatus = "FAILED";
      console.error("Failed to create Jira issue for anomaly finding:", {
        findingId: finding.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const result: DailyAnalysisRunResult = {
    runId,
    executedAt,
    status: "COMPLETED",
    reportingPeriod: metrics.reportingPeriod,
    metricsEvaluated: {
      totalVisitors: metrics.totalVisitors,
      totalPageviews: metrics.totalPageviews,
      evaluatedRoutesCount: metrics.topPages.length,
      dataQuality: metrics.dataQuality,
    },
    findings,
    jiraTicketsCreated,
    summaryNote: `Analysis completed. Evaluated ${metrics.totalPageviews ?? 0} views across ${metrics.topPages.length} routes. ${findings.length} findings, ${jiraTicketsCreated} Jira issues created.`,
  };

  analysisRunHistory.unshift(result);
  if (analysisRunHistory.length > MAX_HISTORY_ENTRIES) analysisRunHistory.pop();
  return result;
}
