/**
 * GreenNext Website Intelligence Platform — Daily Analysis & Jira Findings Panel
 *
 * Displays:
 * 1. Daily analysis workflow status, execution timestamp, and trigger button.
 * 2. Vercel Web Analytics measurements (visitors, pageviews, top pages, referrers).
 * 3. Detected anomaly findings with severity, confidence, evidence, and Jira links.
 */

import { useState } from "react";
import type { VercelAnalyticsMetricSummary } from "../../lib/vercel-analytics.server";
import type { DailyAnalysisRunResult } from "../../lib/daily-analysis.server";

interface DailyAnalysisPanelProps {
  vercelMetrics: VercelAnalyticsMetricSummary;
  latestRun: DailyAnalysisRunResult | null;
  onTriggerRun?: () => Promise<void>;
  isLoading?: boolean;
}

const SEVERITY_BADGES = {
  CRITICAL: { bg: "bg-[#F43F5E]/15", border: "border-[#F43F5E]/30", text: "text-[#F43F5E]" },
  HIGH: { bg: "bg-[#F59E0B]/15", border: "border-[#F59E0B]/30", text: "text-[#F59E0B]" },
  MEDIUM: { bg: "bg-[#06B6D4]/15", border: "border-[#06B6D4]/30", text: "text-[#06B6D4]" },
  LOW: { bg: "bg-[#64748B]/15", border: "border-[#64748B]/30", text: "text-[#94A3B8]" },
};

export function DailyAnalysisPanel({
  vercelMetrics,
  latestRun,
  onTriggerRun,
  isLoading,
}: DailyAnalysisPanelProps) {
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const handleRun = async () => {
    if (!onTriggerRun) return;
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await onTriggerRun();
      setTriggerMsg("Analysis run completed successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis run failed.";
      setTriggerMsg(msg);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Summary & Controls ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                Daily Website Analysis & Jira Automation
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#64748B]">
              Automated 24h anomaly detection engine. Detects traffic degradation and syncs deduplicated issues directly to Jira project KAN.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onTriggerRun && (
              <button
                onClick={handleRun}
                disabled={triggering || isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-[#10B981] text-[#070A0E] text-xs font-semibold hover:bg-[#10B981]/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {triggering ? "Running..." : "Run Analysis Now"}
              </button>
            )}
          </div>
        </div>

        {triggerMsg && (
          <p className="mt-3 text-xs text-[#10B981] font-mono">{triggerMsg}</p>
        )}

        {/* Workflow Status Bar */}
        <div className="mt-4 pt-4 border-t border-[#1E293B] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Workflow Schedule</span>
            <span className="text-[#F8FAFC] font-medium">Daily at 02:00 UTC (Vercel Cron)</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Last Run Status</span>
            <span className="text-[#F8FAFC] font-medium">
              {latestRun ? (
                <span className={latestRun.status === "COMPLETED" ? "text-[#10B981]" : "text-[#F59E0B]"}>
                  {latestRun.status}
                </span>
              ) : (
                <span className="text-[#64748B]">Awaiting first scheduled run</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Last Executed At</span>
            <span className="text-[#94A3B8] font-mono text-[11px]">
              {latestRun?.executedAt ? new Date(latestRun.executedAt).toLocaleString() : "Never"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Jira Issues Created</span>
            <span className="text-[#10B981] font-semibold">
              {latestRun?.jiraTicketsCreated ?? 0} tickets
            </span>
          </div>
        </div>
      </div>

      {/* ── Measured Vercel Web Analytics Overview ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <span>Measured Production Traffic</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                {vercelMetrics.dataQuality === "live" ? "Live (Vercel API)" : "Data Awaiting API Config"}
              </span>
            </h4>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Aggregated measurements directly from Vercel Web Analytics API.
            </p>
          </div>
        </div>

        {vercelMetrics.dataQuality === "unavailable" ? (
          <div className="rounded-lg border border-[#1E293B] bg-[#121824] p-4 text-xs text-[#94A3B8]">
            <p className="font-medium text-[#F8FAFC] mb-1">Analytics API Configuration Notice</p>
            <p className="text-[#64748B] leading-relaxed">{vercelMetrics.note}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI Cards */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#121824] p-3.5 border border-[#1E293B]">
                  <span className="text-[11px] text-[#64748B]">Total Pageviews (7d)</span>
                  <p className="text-xl font-bold text-[#F8FAFC] mt-0.5">
                    {vercelMetrics.totalPageviews?.toLocaleString() ?? "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-[#121824] p-3.5 border border-[#1E293B]">
                  <span className="text-[11px] text-[#64748B]">Total Visitors (7d)</span>
                  <p className="text-xl font-bold text-[#F8FAFC] mt-0.5">
                    {vercelMetrics.totalVisitors?.toLocaleString() ?? "N/A"}
                  </p>
                </div>
              </div>

              {/* Top Referrers */}
              <div className="rounded-lg bg-[#121824] p-3.5 border border-[#1E293B]">
                <span className="text-[11px] text-[#64748B] block mb-2 font-medium">Top Traffic Sources</span>
                {vercelMetrics.topReferrers.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No referrer data recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {vercelMetrics.topReferrers.slice(0, 5).map((ref) => (
                      <div key={ref.referrer} className="flex justify-between text-xs">
                        <span className="text-[#94A3B8] truncate">{ref.referrer}</span>
                        <span className="text-[#F8FAFC] font-mono">{ref.views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Pages */}
            <div className="rounded-lg bg-[#121824] p-3.5 border border-[#1E293B]">
              <span className="text-[11px] text-[#64748B] block mb-2 font-medium">Top Visited Routes</span>
              {vercelMetrics.topPages.length === 0 ? (
                <p className="text-xs text-[#64748B]">No page view data recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {vercelMetrics.topPages.slice(0, 6).map((page) => (
                    <div key={page.path} className="flex justify-between items-center text-xs">
                      <span className="text-[#94A3B8] font-mono truncate max-w-[220px]">{page.path}</span>
                      <span className="text-[#F8FAFC] font-mono font-semibold">{page.views} views</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Detected Anomalies & Jira Sync ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5">
        <h4 className="text-sm font-semibold text-[#F8FAFC] mb-1">
          Automated Anomaly Findings & Jira Tickets
        </h4>
        <p className="text-[11px] text-[#64748B] mb-4">
          Each finding is evaluated with minimum-sample validation and SHA-256 fingerprinting to prevent duplicate tickets.
        </p>

        {!latestRun || latestRun.findings.length === 0 ? (
          <div className="rounded-lg border border-[#1E293B] bg-[#121824] p-4 text-center text-xs text-[#64748B]">
            {latestRun?.status === "INSUFFICIENT_DATA"
              ? "No anomalies generated: Analysis reported INSUFFICIENT DATA. Missing data is never treated as a site breakage."
              : "No active anomaly alerts detected for this reporting period. All measured parameters are within normal thresholds."}
          </div>
        ) : (
          <div className="space-y-3">
            {latestRun.findings.map((finding) => {
              const badge = SEVERITY_BADGES[finding.severity] || SEVERITY_BADGES.LOW;
              return (
                <div
                  key={finding.id}
                  className="rounded-lg border border-[#1E293B] bg-[#121824] p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text}`}
                      >
                        {finding.severity}
                      </span>
                      <h5 className="text-xs font-semibold text-[#F8FAFC]">{finding.title}</h5>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#64748B]">Confidence: {finding.confidence}%</span>
                      {finding.jiraIssueKey ? (
                        <a
                          href={finding.jiraIssueUrl || `https://greennext.atlassian.net/browse/${finding.jiraIssueKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] font-mono text-[10px] hover:underline"
                        >
                          Jira: {finding.jiraIssueKey} ↗
                        </a>
                      ) : (
                        <span className="text-[#64748B] text-[10px] font-mono">
                          [{finding.jiraStatus}]
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">{finding.evidence}</p>

                  <div className="pt-2 border-t border-[#1E293B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#64748B]">
                      <strong className="text-[#94A3B8]">Action:</strong> {finding.recommendedAction}
                    </span>
                    <span className="text-[#475569] font-mono text-[10px]">
                      Fingerprint: {finding.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
