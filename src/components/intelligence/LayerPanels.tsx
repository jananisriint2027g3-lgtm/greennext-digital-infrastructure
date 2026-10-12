/**
 * GreenNext Website Intelligence Platform — Layer Panel Components
 *
 * Individual panel components for each intelligence layer (1–13).
 * Each panel shows its data quality, status, and collected signals.
 */

import type { LiveSessionSnapshot, VisitorIntelligenceSummary, LayerStatus } from "../../lib/dashboard-data";

const DATA_QUALITY_CONFIG: Record<string, { label: string; color: string }> = {
  live: { label: "Live", color: "#10B981" },
  delayed: { label: "Delayed", color: "#06B6D4" },
  inferred: { label: "Inferred", color: "#F59E0B" },
  simulated: { label: "Simulated", color: "#F59E0B" },
  unavailable: { label: "Unavailable", color: "#475569" },
};

function LayerBadge({ quality }: { quality: string }) {
  const cfg = DATA_QUALITY_CONFIG[quality] ?? DATA_QUALITY_CONFIG["unavailable"]!;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
      style={{ borderColor: `${cfg.color}44`, color: cfg.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}

function MetricRow({ label, value, note }: { label: string; value: string | undefined | null; note?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#1E293B] last:border-0">
      <div>
        <span className="text-xs text-[#94A3B8]">{label}</span>
        {note && <p className="text-[10px] text-[#475569] mt-0.5">{note}</p>}
      </div>
      <span className="text-xs font-mono text-[#F8FAFC] ml-4 text-right max-w-[140px] break-all">
        {value || <span className="text-[#475569]">—</span>}
      </span>
    </div>
  );
}

function LayerCard({
  layerNumber,
  name,
  tier,
  dataQuality,
  statusNote,
  isActive,
  children,
}: {
  layerNumber: number;
  name: string;
  tier: string;
  dataQuality: string;
  statusNote: string;
  isActive: boolean;
  children?: React.ReactNode;
}) {
  const tierColors: Record<string, string> = {
    foundational: "#06B6D4",
    behavioral: "#8B5CF6",
    strategic: "#F59E0B",
  };
  const tierColor = tierColors[tier] ?? "#94A3B8";

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isActive ? "border-[#1E293B]" : "border-[#1E293B] opacity-75"} bg-[#0B0F17]`}>
      <div className="p-4 border-b border-[#1E293B]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
              style={{ background: `${tierColor}22`, color: tierColor }}
              aria-label={`Layer ${layerNumber}`}
            >
              {layerNumber}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">{name}</h4>
              <p className="text-[11px] mt-0.5" style={{ color: tierColor }}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Intelligence
              </p>
            </div>
          </div>
          <LayerBadge quality={dataQuality} />
        </div>
        <p className="mt-2 text-[11px] text-[#64748B] pl-10">{statusNote}</p>
      </div>
      {children && <div className="p-4">{children}</div>}
    </div>
  );
}

// ─── Tier 1 Panels ───────────────────────────────────────────────────────────

export function SessionIntelligencePanel({
  session,
  status,
}: {
  session: LiveSessionSnapshot;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Session ID" value={session.sessionId.slice(0, 20) + "…"} note="Anonymous browser-scoped identifier" />
      <MetricRow label="Session Kind" value={session.sessionKind.replace("_", " ")} />
      <MetricRow label="Current Page" value={session.currentPage} />
      <MetricRow label="Landing Page" value={session.landingPage} note="First page of this session" />
    </LayerCard>
  );
}

export function TrafficIntelligencePanel({
  session,
  status,
}: {
  session: LiveSessionSnapshot;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Traffic Source" value={session.trafficSource} />
      <MetricRow label="UTM Source" value={session.utmSource || undefined} />
      <MetricRow label="UTM Medium" value={session.utmMedium || undefined} />
      <MetricRow label="UTM Campaign" value={session.utmCampaign || undefined} />
      {!session.utmSource && !session.utmMedium && (
        <p className="text-[11px] text-[#475569] mt-2">
          No UTM parameters detected in this session.
        </p>
      )}
    </LayerCard>
  );
}

export function GeoIntelligencePanel({ status }: { status: LayerStatus }) {
  return (
    <LayerCard {...status}>
      <div className="p-3 rounded bg-[#1A2234] border border-[#1E293B]">
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          Geo enrichment requires <code className="text-[#06B6D4] text-[10px]">GEO_PROVIDER_URL</code> and{" "}
          <code className="text-[#06B6D4] text-[10px]">GEO_PROVIDER_API_KEY</code> to be configured
          server-side. Compatible with{" "}
          <a
            href="https://iplocation.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#10B981] underline"
          >
            iplocation.net
          </a>
          . Country, region, and city are resolved via trusted server-side headers only.
        </p>
      </div>
    </LayerCard>
  );
}

export function TimezoneIntelligencePanel({
  session,
  status,
}: {
  session: LiveSessionSnapshot;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Browser Timezone" value={session.timezone} note="IANA timezone from browser API" />
      <MetricRow label="UTC Offset (min)" value={session.utcOffset} />
      <MetricRow label="Local Hour" value={session.activityLocalHour} note="Hour of event (local time)" />
      <MetricRow label="Day of Week" value={session.activityDay} />
      <p className="text-[11px] text-[#475569] mt-2">
        Timestamps are stored in UTC. Local time is derived from browser-reported timezone.
      </p>
    </LayerCard>
  );
}

export function IPIntelligencePanel({ status }: { status: LayerStatus }) {
  return (
    <LayerCard {...status}>
      <div className="p-3 rounded bg-[#1A2234] border border-[#1E293B]">
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          Network enrichment (ISP, ASN, network type) is processed server-side only.
          Raw IP addresses are never stored in analytics payloads or displayed here.
          Configure <code className="text-[#06B6D4] text-[10px]">NETWORK_PROVIDER_URL</code> to enable.
          If not configured, the geo provider's network fields are used where available.
        </p>
      </div>
    </LayerCard>
  );
}

// ─── Tier 2 Panels ───────────────────────────────────────────────────────────

export function BehaviorIntelligencePanel({
  visitor,
  status,
}: {
  visitor: VisitorIntelligenceSummary;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Recent Pages" value={visitor.recentPages.length > 0 ? `${visitor.recentPages.length} pages tracked` : undefined} />
      {visitor.recentPages.length > 0 && (
        <div className="mt-2 space-y-1">
          {visitor.recentPages.slice(0, 4).map((page) => (
            <div key={page} className="flex items-center gap-2 text-[11px]">
              <span className="w-1 h-1 rounded-full bg-[#10B981]" />
              <span className="text-[#94A3B8] font-mono">{page}</span>
            </div>
          ))}
        </div>
      )}
      <MetricRow label="CTA Interactions" value={visitor.interests.length > 0 ? visitor.interests.join(", ") : undefined} note="Interest signals from navigation" />
      <p className="text-[11px] text-[#475569] mt-2">
        Scroll depth and engagement milestones are tracked via page behavior hooks.
        No session recordings are active.
      </p>
    </LayerCard>
  );
}

export function RepeatVisitorPanel({
  visitor,
  status,
}: {
  visitor: VisitorIntelligenceSummary;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Session Count" value={String(visitor.sessionCount)} note="Browser-local first-party count" />
      <MetricRow label="First Seen" value={visitor.firstSeenAt ? new Date(visitor.firstSeenAt).toLocaleDateString() : undefined} />
      <MetricRow label="Last Seen" value={visitor.lastSeenAt ? new Date(visitor.lastSeenAt).toLocaleDateString() : undefined} />
      <MetricRow label="Visitor Type" value={visitor.isReturning ? "Returning (browser-level)" : "New"} />
      <p className="text-[11px] text-[#475569] mt-2">
        Uses consented first-party localStorage. Cross-device identity is not tracked.
        These counts reflect anonymous browser-level data only.
      </p>
    </LayerCard>
  );
}

export function InterestIntelligencePanel({
  visitor,
  status,
}: {
  visitor: VisitorIntelligenceSummary;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      {visitor.topSections.length > 0 ? (
        <div className="space-y-2">
          {visitor.topSections.slice(0, 5).map(({ section, visits }) => (
            <div key={section} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] text-[#94A3B8] capitalize">{section}</span>
                  <span className="text-[11px] font-mono text-[#64748B]">{visits} visits</span>
                </div>
                <div className="h-1 rounded bg-[#1A2234] overflow-hidden">
                  <div
                    className="h-full rounded bg-[#10B981]"
                    style={{ width: `${Math.min((visits / (visitor.topSections[0]?.visits ?? 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#475569]">No section visit data yet. Interests are inferred from page navigation.</p>
      )}
      <p className="text-[11px] text-[#64748B] mt-3">
        Interests are inferred from section visits only. Not presented as established facts.
      </p>
    </LayerCard>
  );
}

export function ConversionIntelligencePanel({
  visitor,
  status,
}: {
  visitor: VisitorIntelligenceSummary;
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <MetricRow label="Converted" value={visitor.converted ? "Yes — inquiry submitted" : "No"} />
      <MetricRow label="Inquiry Types" value={visitor.inquiryTypes.length > 0 ? visitor.inquiryTypes.join(", ") : undefined} />
      <p className="text-[11px] text-[#475569] mt-2">
        Conversion is confirmed only on successful form submission. Form attempts are
        distinguished from delivered submissions. Jira ticket creation is a secondary signal.
      </p>
    </LayerCard>
  );
}

export function EngagementIntelligencePanel({
  visitor,
  status,
  engagementScore,
}: {
  visitor: VisitorIntelligenceSummary;
  status: LayerStatus;
  engagementScore: { score: number; band: string; factors: string[] };
}) {
  const bandColors: Record<string, string> = {
    converted: "#10B981",
    high: "#10B981",
    medium: "#F59E0B",
    low: "#64748B",
  };
  const bandColor = bandColors[engagementScore.band] ?? "#64748B";

  return (
    <LayerCard {...status}>
      <div className="flex items-center gap-4 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2"
          style={{ borderColor: bandColor, color: bandColor }}
          aria-label={`Engagement score ${engagementScore.score}`}
        >
          {engagementScore.score}
        </div>
        <div>
          <p className="text-xs font-semibold capitalize" style={{ color: bandColor }}>
            {engagementScore.band} engagement
          </p>
          <p className="text-[11px] text-[#64748B]">Browser-session score</p>
        </div>
      </div>
      {engagementScore.factors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {engagementScore.factors.map((f) => (
            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2234] text-[#94A3B8] border border-[#1E293B]">
              {f.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </LayerCard>
  );
}

// ─── Tier 3 Panels ───────────────────────────────────────────────────────────

export function PredictiveIntelligencePanel({
  propensity,
  status,
}: {
  propensity: { band: string; score: number; recommendation: string; isSimulated: boolean };
  status: LayerStatus;
}) {
  return (
    <LayerCard {...status}>
      <div className="p-3 rounded bg-[#1A2234] border border-[#F59E0B33] mb-3">
        <p className="text-[11px] text-[#F59E0B]">
          ⚠ Rules-based baseline only. This is not a trained ML model.
          Labels reflect rule-based thresholds, not statistical predictions.
        </p>
      </div>
      <MetricRow label="Propensity Band" value={propensity.band.charAt(0).toUpperCase() + propensity.band.slice(1)} />
      <MetricRow label="Score (rules-based)" value={`${propensity.score} / 99`} />
      <MetricRow label="Recommendation" value={propensity.recommendation} />
    </LayerCard>
  );
}

export function RetentionIntelligencePanel({ status }: { status: LayerStatus }) {
  return (
    <LayerCard {...status}>
      <div className="p-3 rounded bg-[#1A2234] border border-[#1E293B]">
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          Cohort retention analysis requires a persistent server-side event store.
          Browser-level return visits are counted but cannot be cohorted across
          anonymous sessions without a stable identifier strategy.
          Connect a backend event database to enable full retention analytics.
        </p>
      </div>
      <div className="mt-3 p-3 rounded bg-[#0B1629] border border-[#06B6D433]">
        <p className="text-[11px] text-[#06B6D4] font-medium mb-1">What's needed:</p>
        <ul className="space-y-1">
          {["Persistent event store (e.g. Supabase, PlanetScale)", "Stable anonymous visitor ID persistence", "Cohort definition by first-visit week", "Minimum 4 weeks of data for meaningful analysis"].map((item) => (
            <li key={item} className="text-[11px] text-[#64748B] flex items-start gap-1.5">
              <span className="text-[#475569] mt-0.5">·</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </LayerCard>
  );
}

export function CognitiveIntelligencePanel({ status }: { status: LayerStatus }) {
  return (
    <LayerCard {...status}>
      <div className="p-3 rounded bg-[#1A2234] border border-[#F59E0B33] mb-3">
        <p className="text-[11px] text-[#F59E0B]">
          ⚠ Self-optimizing experiments are not active. No production pages are modified
          autonomously. Human approval is required for all recommendations.
        </p>
      </div>
      <div className="space-y-2">
        {[
          { name: "Experiment Framework", status: "Planned" },
          { name: "A/B Variant Tracking", status: "Planned" },
          { name: "Recommendation Engine", status: "Planned" },
          { name: "Human Approval Workflow", status: "Planned" },
          { name: "Audit Trail", status: "Planned" },
        ].map((item) => (
          <div key={item.name} className="flex justify-between items-center py-1.5 border-b border-[#1E293B] last:border-0">
            <span className="text-xs text-[#94A3B8]">{item.name}</span>
            <span className="text-[10px] text-[#475569]">{item.status}</span>
          </div>
        ))}
      </div>
    </LayerCard>
  );
}
