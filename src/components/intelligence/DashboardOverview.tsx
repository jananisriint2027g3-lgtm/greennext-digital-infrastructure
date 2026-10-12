/**
 * GreenNext Website Intelligence Platform — Dashboard Overview Section
 *
 * High-level KPI cards and overview metrics for the intelligence workspace.
 */

import type { VisitorIntelligenceSummary, LiveSessionSnapshot, EngagementSnapshot } from "../../lib/dashboard-data";

interface KPICardProps {
  label: string;
  value: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
  quality: "live" | "inferred" | "simulated" | "unavailable";
}

function KPICard({ label, value, sublabel, color, icon, quality }: KPICardProps) {
  const qualityColors: Record<string, string> = {
    live: "#10B981",
    inferred: "#F59E0B",
    simulated: "#F59E0B",
    unavailable: "#475569",
  };
  const qualityLabels: Record<string, string> = {
    live: "Live",
    inferred: "Inferred",
    simulated: "Simulated",
    unavailable: "N/A",
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-5 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20"
        style={{ background: color }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}22` }}
            aria-hidden="true"
          >
            {icon}
          </div>
          <span
            className="text-[10px] font-medium"
            style={{ color: qualityColors[quality] }}
          >
            {qualityLabels[quality]}
          </span>
        </div>
        <p className="text-2xl font-bold text-[#F8FAFC] tabular-nums">{value}</p>
        <p className="text-xs font-medium text-[#94A3B8] mt-0.5">{label}</p>
        <p className="text-[11px] text-[#64748B] mt-1">{sublabel}</p>
      </div>
    </div>
  );
}

export function DashboardOverview({
  visitor,
  session,
  engagement,
}: {
  visitor: VisitorIntelligenceSummary;
  session: LiveSessionSnapshot;
  engagement: EngagementSnapshot;
}) {
  const engagementBandColors: Record<string, string> = {
    converted: "#10B981",
    high: "#10B981",
    medium: "#F59E0B",
    low: "#64748B",
  };
  const engagementColor = engagementBandColors[engagement.band] ?? "#64748B";

  const kpis: KPICardProps[] = [
    {
      label: "Session Count",
      value: String(visitor.sessionCount),
      sublabel: visitor.isReturning ? "Returning visitor (browser-level)" : "First session",
      color: "#10B981",
      quality: "live",
      icon: <span className="text-base" role="img" aria-label="sessions">🔁</span>,
    },
    {
      label: "Traffic Source",
      value: session.trafficSource.charAt(0).toUpperCase() + session.trafficSource.slice(1),
      sublabel: session.landingPage || "Direct arrival",
      color: "#06B6D4",
      quality: "live",
      icon: <span className="text-base" role="img" aria-label="traffic">📡</span>,
    },
    {
      label: "Engagement Band",
      value: engagement.band.charAt(0).toUpperCase() + engagement.band.slice(1),
      sublabel: `Score: ${engagement.score} (rules-based)`,
      color: engagementColor,
      quality: "live",
      icon: <span className="text-base" role="img" aria-label="engagement">⚡</span>,
    },
    {
      label: "Active Timezone",
      value: session.timezone || "Unknown",
      sublabel: `${session.activityDay}, ${session.activityLocalHour}:00 local`,
      color: "#8B5CF6",
      quality: "live",
      icon: <span className="text-base" role="img" aria-label="timezone">🕒</span>,
    },
    {
      label: "Top Interest",
      value: visitor.topSections[0]?.section
        ? visitor.topSections[0].section.charAt(0).toUpperCase() + visitor.topSections[0].section.slice(1)
        : "Not yet known",
      sublabel: visitor.topSections[0]
        ? `${visitor.topSections[0].visits} section visits`
        : "Visit more sections to build a profile",
      color: "#F59E0B",
      quality: "inferred",
      icon: <span className="text-base" role="img" aria-label="interest">🎯</span>,
    },
    {
      label: "Conversion Status",
      value: visitor.converted ? "Converted" : "Not converted",
      sublabel: visitor.converted
        ? `Inquiry types: ${visitor.inquiryTypes.join(", ") || "general"}`
        : "No inquiry submitted yet",
      color: visitor.converted ? "#10B981" : "#475569",
      quality: "live",
      icon: <span className="text-base" role="img" aria-label="conversion">✉️</span>,
    },
  ];

  return (
    <section aria-label="Analytics Overview">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-6 rounded bg-[#10B981]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[#F8FAFC]">Intelligence Overview</h2>
        </div>
        <p className="text-sm text-[#64748B] ml-5">
          Real-time metrics from this browser session. Data reflects first-party collection only.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Session Info Bar */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Session ID</span>
            <p className="text-xs font-mono text-[#94A3B8] mt-0.5">{session.sessionId.slice(0, 28)}…</p>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Session Kind</span>
            <p className="text-xs font-mono text-[#94A3B8] mt-0.5">
              {session.sessionKind.replace("_", " ")}
            </p>
          </div>
          {session.utmCampaign && (
            <div>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Campaign</span>
              <p className="text-xs font-mono text-[#94A3B8] mt-0.5">{session.utmCampaign}</p>
            </div>
          )}
          <div className="ml-auto">
            <span className="text-[10px] text-[#475569]">
              All data is anonymous and first-party. No cross-site tracking.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading intelligence data">
      <div className="h-8 w-48 bg-[#1A2234] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#0B0F17] border border-[#1E293B]" />
        ))}
      </div>
    </div>
  );
}

// ─── Three-Tier Architecture Banner ──────────────────────────────────────────

export function TierArchitectureBanner() {
  const tiers = [
    {
      number: "01",
      label: "Foundational Intelligence",
      description: "Session · Traffic · Geo · Time Zone · IP",
      layers: "Layers 1–5",
      color: "#06B6D4",
    },
    {
      number: "02",
      label: "Behavioral Intelligence",
      description: "Behavior · Repeat Visitor · Interest · Conversion · Engagement",
      layers: "Layers 6–10",
      color: "#8B5CF6",
    },
    {
      number: "03",
      label: "Strategic Intelligence",
      description: "Predictive · Retention · Cognitive",
      layers: "Layers 11–13",
      color: "#F59E0B",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {tiers.map((tier) => (
        <div
          key={tier.number}
          className="rounded-xl border p-4 relative overflow-hidden"
          style={{ borderColor: `${tier.color}33`, background: `${tier.color}08` }}
        >
          <div
            className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10"
            style={{ background: tier.color }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-black opacity-20" style={{ color: tier.color }}>{tier.number}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: tier.color }}>{tier.label}</p>
                <p className="text-[10px] text-[#64748B]">{tier.layers}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">{tier.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
