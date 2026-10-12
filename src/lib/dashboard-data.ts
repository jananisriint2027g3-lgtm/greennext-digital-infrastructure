/**
 * GreenNext Intelligence Dashboard — Client-Side Data Layer
 *
 * Reads from the existing first-party browser storage (sessionStorage /
 * localStorage) that the core analytics system already populates.
 * Does not introduce new personal data collection or covert tracking.
 */

import { getVisitorProfile, getVisitorActionContext, type VisitorProfile } from "./action-layer";
import { getSessionId, getSessionKind, getCurrentPage } from "./analytics";
import { readClientContext } from "./layer2-intelligence";
import {
  calculateEngagementScore,
  calculatePropensity,
  INTELLIGENCE_LAYERS,
  type IntelligenceLayerId,
  type LayerMeta,
  type DataQuality,
} from "./intelligence-schema";

// ─── Live Session Snapshot ───────────────────────────────────────────────────

export interface LiveSessionSnapshot {
  sessionId: string;
  sessionKind: "new_session" | "returning_session";
  currentPage: string;
  landingPage: string;
  trafficSource: string;
  timezone: string;
  utcOffset: string;
  activityLocalHour: string;
  activityDay: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

export function getLiveSessionSnapshot(): LiveSessionSnapshot {
  const sessionId = getSessionId();
  const sessionKind = getSessionKind();
  const page = getCurrentPage();
  const ctx = readClientContext(page);
  return {
    sessionId,
    sessionKind,
    currentPage: page,
    landingPage: ctx.landingPage,
    trafficSource: ctx.trafficSource,
    timezone: ctx.timezone,
    utcOffset: ctx.utcOffset,
    activityLocalHour: ctx.activityLocalHour,
    activityDay: ctx.activityDay,
    utmSource: ctx.utmSource,
    utmMedium: ctx.utmMedium,
    utmCampaign: ctx.utmCampaign,
  };
}

// ─── Visitor Intelligence Summary ───────────────────────────────────────────

export interface VisitorIntelligenceSummary {
  visitorId: string;
  sessionCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  isReturning: boolean;
  converted: boolean;
  recentPages: string[];
  topSections: Array<{ section: string; visits: number }>;
  engagedSections: Array<{ section: string; engagements: number }>;
  interests: string[];
  inquiryTypes: string[];
}

export function getVisitorIntelligenceSummary(): VisitorIntelligenceSummary {
  if (typeof window === "undefined") {
    return {
      visitorId: "server",
      sessionCount: 0,
      firstSeenAt: "",
      lastSeenAt: "",
      isReturning: false,
      converted: false,
      recentPages: [],
      topSections: [],
      engagedSections: [],
      interests: [],
      inquiryTypes: [],
    };
  }
  const profile: VisitorProfile = getVisitorProfile();
  const topSections = Object.entries(profile.sectionVisits)
    .sort((a, b) => b[1] - a[1])
    .map(([section, visits]) => ({ section, visits }));
  const engagedSections = Object.entries(profile.engagedSections)
    .sort((a, b) => b[1] - a[1])
    .map(([section, engagements]) => ({ section, engagements }));

  return {
    visitorId: profile.visitorId,
    sessionCount: profile.sessionCount,
    firstSeenAt: profile.firstSeenAt,
    lastSeenAt: profile.lastSeenAt,
    isReturning: profile.sessionCount > 1,
    converted: profile.converted,
    recentPages: profile.recentPages,
    topSections,
    engagedSections,
    interests: profile.interests,
    inquiryTypes: profile.inquiryTypes,
  };
}

// ─── Engagement Score ────────────────────────────────────────────────────────

export interface EngagementSnapshot {
  score: number;
  band: "low" | "medium" | "high" | "converted";
  factors: string[];
}

export function getEngagementSnapshot(): EngagementSnapshot {
  const profile = getVisitorProfile();
  const ctx = getVisitorActionContext(getCurrentPage(), getSessionId());

  // Build a synthetic event list from the profile
  const syntheticEvents: Array<{ event: string }> = [];
  if (profile.converted) syntheticEvents.push({ event: "lead_conversion" });
  if (profile.meaningfulCtas.length > 0) syntheticEvents.push({ event: "cta_click" });
  if (profile.sessionCount > 1) syntheticEvents.push({ event: "engagement_30s" });
  if (profile.sessionCount > 3) syntheticEvents.push({ event: "engagement_60s" });

  const score = calculateEngagementScore(syntheticEvents);
  const band: "low" | "medium" | "high" | "converted" =
    profile.converted ? "converted" :
    score >= 30 ? "high" :
    score >= 10 ? "medium" : "low";

  const factors: string[] = [];
  if (ctx.returningVisitor) factors.push("returning_visitor");
  if (ctx.converted) factors.push("converted");
  if (ctx.engagedSections.length > 0) factors.push(`interested_in:${ctx.dominantInterest}`);

  return { score, band, factors };
}

// ─── Propensity Snapshot ─────────────────────────────────────────────────────

export function getPropensitySnapshot() {
  const profile = getVisitorProfile();
  const engagement = getEngagementSnapshot();
  return calculatePropensity({
    sessionCount: profile.sessionCount,
    converted: profile.converted,
    engagementScore: engagement.score,
    pagesVisited: profile.recentPages.length,
    hasFormInteraction: profile.inquiryTypes.length > 0,
    isReturning: profile.sessionCount > 1,
  });
}

// ─── Layer Status ────────────────────────────────────────────────────────────

export interface LayerStatus extends LayerMeta {
  isActive: boolean;
  dataQuality: DataQuality;
  statusNote: string;
}

export function getLayerStatuses(): LayerStatus[] {
  return INTELLIGENCE_LAYERS.map((layer) => {
    const isClientSide = typeof window !== "undefined";
    const providerConfigured = checkProviderConfigured(layer.id);

    if (layer.requiresProvider) {
      return {
        ...layer,
        isActive: providerConfigured,
        dataQuality: providerConfigured ? layer.dataQuality : "unavailable",
        statusNote: providerConfigured
          ? "Provider configured"
          : `Requires ${layer.providerName} environment variable`,
      };
    }

    return {
      ...layer,
      isActive: isClientSide,
      dataQuality: layer.dataQuality,
      statusNote: layer.dataQuality === "simulated"
        ? "Rules-based baseline — labeled as simulated"
        : "Active — collecting first-party data",
    };
  });
}

function checkProviderConfigured(layerId: IntelligenceLayerId): boolean {
  // Provider config lives server-side; we can only check if the layer
  // has returned enriched data in past events.
  // We cannot expose env vars to the browser — always report as unavailable.
  void layerId;
  return false;
}

// ─── Integration Health ──────────────────────────────────────────────────────

export type IntegrationStatus = "configured" | "unconfigured" | "optional" | "unavailable";

export interface IntegrationHealth {
  name: string;
  description: string;
  status: IntegrationStatus;
  dataQuality: DataQuality;
  note: string;
  docLink?: string;
}

export function getIntegrationHealth(): IntegrationHealth[] {
  return [
    {
      name: "Google Apps Script",
      description: "Primary analytics event forwarding to Google Sheets",
      status: "configured",
      dataQuality: "live",
      note: "Default endpoint active. Override with ANALYTICS_APPS_SCRIPT_URL.",
    },
    {
      name: "Analytics Enrichment API",
      description: "/api/analytics endpoint — server-side IP enrichment and forwarding",
      status: "configured",
      dataQuality: "live",
      note: "Running at /api/analytics. Enriches events with geo/network data when providers are configured.",
    },
    {
      name: "Airtable Analytics",
      description: "Optional behavior event store (POC)",
      status: "optional",
      dataQuality: "delayed",
      note: "Active when AIRTABLE_PAT is set. Optional — analytics continue without it.",
    },
    {
      name: "Microsoft Clarity",
      description: "Session recording and heatmap analytics",
      status: "configured",
      dataQuality: "delayed",
      note: "Tag yryfxrhkse is embedded in the root layout.",
      docLink: "https://clarity.microsoft.com",
    },
    {
      name: "Jira",
      description: "Inquiry and issue creation workflow",
      status: "optional",
      dataQuality: "live",
      note: "Active when JIRA_ENABLED=true and JIRA_API_TOKEN is set.",
    },
    {
      name: "WhatsApp CTA",
      description: "WhatsApp contact channel",
      status: "configured",
      dataQuality: "live",
      note: "Configured via VITE_WHATSAPP_PHONE environment variable.",
    },
    {
      name: "Geo Provider",
      description: "Server-side IP geolocation (country, region, city)",
      status: "optional",
      dataQuality: "unavailable",
      note: "Configure GEO_PROVIDER_URL and GEO_PROVIDER_API_KEY to enable. Compatible with iplocation.net.",
    },
    {
      name: "Network Provider",
      description: "Server-side IP network/ISP enrichment",
      status: "optional",
      dataQuality: "unavailable",
      note: "Configure NETWORK_PROVIDER_URL and NETWORK_PROVIDER_API_KEY (or reuse geo provider).",
    },
  ];
}

// ─── Funnel Data ─────────────────────────────────────────────────────────────

export interface FunnelStage {
  name: string;
  description: string;
  eventName: string;
  count: number;
  conversionRate: number | null; // null = no prior stage
  dropOffRate: number | null;
}

export interface FunnelAnalysis {
  stages: FunnelStage[];
  totalEntries: number;
  totalConversions: number;
  overallConversionRate: number;
  dataQuality: DataQuality;
  note: string;
}

/**
 * Build a funnel from a flat event list.
 * Uses only confirmed first-party event counts — never fabricates data.
 */
export function buildConversionFunnel(
  events: Array<{ event: string; sessionId?: string }>
): FunnelAnalysis {
  const stageDefinitions: Array<{ name: string; description: string; eventName: string }> = [
    { name: "Page Visit", description: "Session with at least one page view", eventName: "page_view" },
    { name: "Engaged", description: "Scroll 50%+ or 30s+ on page", eventName: "engagement_30s" },
    { name: "Form Opened", description: "Contact or inquiry form opened", eventName: "form_open" },
    { name: "Form Started", description: "User began filling the form", eventName: "form_start" },
    { name: "Inquiry Submitted", description: "Form successfully submitted", eventName: "form_submit" },
  ];

  // Deduplicate by session
  const sessionEventSets = new Map<string, Set<string>>();
  events.forEach((ev) => {
    const sid = ev.sessionId ?? "unknown";
    if (!sessionEventSets.has(sid)) sessionEventSets.set(sid, new Set());
    sessionEventSets.get(sid)!.add(ev.event);
  });

  let prevCount: number | null = null;
  const stages: FunnelStage[] = stageDefinitions.map((def) => {
    const count = [...sessionEventSets.values()].filter((evSet) => evSet.has(def.eventName)).length;
    const conversionRate = prevCount === null ? null : prevCount > 0 ? (count / prevCount) * 100 : 0;
    const dropOffRate = conversionRate === null ? null : 100 - conversionRate;
    prevCount = count;
    return { ...def, count, conversionRate, dropOffRate };
  });

  const totalEntries = stages[0]?.count ?? 0;
  const totalConversions = stages[stages.length - 1]?.count ?? 0;
  const overallConversionRate = totalEntries > 0 ? (totalConversions / totalEntries) * 100 : 0;

  return {
    stages,
    totalEntries,
    totalConversions,
    overallConversionRate,
    dataQuality: totalEntries > 0 ? "live" : "unavailable",
    note: totalEntries === 0
      ? "No events recorded. Data will appear as visitors interact with the site."
      : "Based on observed first-party events in this browser session.",
  };
}

// ─── Analytics Maturity Model ────────────────────────────────────────────────

export type MaturityStage = "descriptive" | "behavioral" | "predictive" | "self_optimizing";

export interface MaturityAssessment {
  currentStage: MaturityStage;
  stages: Array<{
    id: MaturityStage;
    label: string;
    description: string;
    achieved: boolean;
    score: number; // 0–100
    capabilities: Array<{ name: string; implemented: boolean }>;
  }>;
  overallScore: number;
  nextRecommendation: string;
}

export function getMaturityAssessment(): MaturityAssessment {
  const stages: MaturityAssessment["stages"] = [
    {
      id: "descriptive",
      label: "Descriptive Analytics",
      description: "What happened? Track page views, sessions, and basic engagement.",
      achieved: true,
      score: 85,
      capabilities: [
        { name: "Page view tracking", implemented: true },
        { name: "Session identification", implemented: true },
        { name: "Traffic source attribution", implemented: true },
        { name: "Scroll depth tracking", implemented: true },
        { name: "Event forwarding to Google Sheets", implemented: true },
      ],
    },
    {
      id: "behavioral",
      label: "Behavioral Analytics",
      description: "Why did it happen? Understand user behavior patterns.",
      achieved: true,
      score: 70,
      capabilities: [
        { name: "Repeat visitor detection", implemented: true },
        { name: "Interest area tracking", implemented: true },
        { name: "Engagement scoring", implemented: true },
        { name: "Conversion funnel tracking", implemented: true },
        { name: "Geo/network enrichment", implemented: false },
      ],
    },
    {
      id: "predictive",
      label: "Predictive Analytics",
      description: "What will happen? Propensity and retention forecasting.",
      achieved: false,
      score: 25,
      capabilities: [
        { name: "Rules-based propensity scoring (baseline)", implemented: true },
        { name: "Retention cohort analysis", implemented: false },
        { name: "ML-based conversion model", implemented: false },
        { name: "Churn risk indicators", implemented: false },
      ],
    },
    {
      id: "self_optimizing",
      label: "Self-Optimizing",
      description: "Make it happen. Human-supervised experiments and optimization.",
      achieved: false,
      score: 10,
      capabilities: [
        { name: "Experiment framework (definition)", implemented: false },
        { name: "A/B variant tracking", implemented: false },
        { name: "Autonomous recommendations (supervised)", implemented: false },
        { name: "Audit trail", implemented: false },
      ],
    },
  ];

  const overallScore = Math.round(stages.reduce((sum, s) => sum + s.score, 0) / stages.length);
  const currentStage: MaturityStage = stages[1]!.achieved ? "behavioral" : "descriptive";

  return {
    currentStage,
    stages,
    overallScore,
    nextRecommendation: "Configure GEO_PROVIDER_URL for geo enrichment, then implement cohort retention analysis.",
  };
}

// ─── Attribution Models ──────────────────────────────────────────────────────

export type AttributionModel = "first_touch" | "last_touch" | "linear";

export interface AttributionResult {
  model: AttributionModel;
  label: string;
  channels: Array<{ channel: string; credit: number; percentage: number }>;
  note: string;
}

export function calculateAttribution(
  events: Array<{ event: string; trafficSource?: string; sessionId?: string }>,
  model: AttributionModel = "last_touch"
): AttributionResult {
  // Group events by session, capturing traffic sources
  const sessionSources = new Map<string, string[]>();
  events.forEach((ev) => {
    const sid = ev.sessionId ?? "unknown";
    const source = ev.trafficSource ?? "unknown";
    if (!sessionSources.has(sid)) sessionSources.set(sid, []);
    sessionSources.get(sid)!.push(source);
  });

  const channelCredits: Record<string, number> = {};
  const total = sessionSources.size;

  sessionSources.forEach((sources) => {
    if (sources.length === 0) return;
    if (model === "first_touch") {
      const ch = sources[0] ?? "unknown";
      channelCredits[ch] = (channelCredits[ch] ?? 0) + 1;
    } else if (model === "last_touch") {
      const ch = sources[sources.length - 1] ?? "unknown";
      channelCredits[ch] = (channelCredits[ch] ?? 0) + 1;
    } else {
      // linear: equal credit to all channels
      const credit = 1 / sources.length;
      sources.forEach((ch) => {
        channelCredits[ch] = (channelCredits[ch] ?? 0) + credit;
      });
    }
  });

  const channels = Object.entries(channelCredits)
    .sort((a, b) => b[1] - a[1])
    .map(([channel, credit]) => ({
      channel,
      credit: Math.round(credit * 10) / 10,
      percentage: total > 0 ? Math.round((credit / total) * 1000) / 10 : 0,
    }));

  const modelLabels: Record<AttributionModel, string> = {
    first_touch: "First Touch",
    last_touch: "Last Touch",
    linear: "Linear",
  };

  return {
    model,
    label: modelLabels[model],
    channels,
    note: total === 0
      ? "No session data available yet."
      : `Based on ${total} observed sessions. Data-driven attribution requires more historical data.`,
  };
}
