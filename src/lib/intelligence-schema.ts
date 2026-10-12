/**
 * GreenNext Website Intelligence Platform — Common Event Schema (v1)
 *
 * This module defines the versioned, typed event schema used across all 13
 * intelligence layers. It intentionally avoids personal data and exposes
 * only the fields needed for behavioral and engagement analytics.
 *
 * Schema version: 1.0.0
 */

export const SCHEMA_VERSION = "1.0.0";

export type ConsentStatus = "granted" | "denied" | "pending" | "not_required";

export type DataQuality = "live" | "delayed" | "inferred" | "simulated" | "unavailable";

export type IntelligenceTier = "foundational" | "behavioral" | "strategic";

export type IntelligenceLayerId =
  | "session"
  | "traffic"
  | "geo"
  | "timezone"
  | "ip"
  | "behavior"
  | "repeat_visitor"
  | "interest"
  | "conversion"
  | "engagement"
  | "predictive"
  | "retention"
  | "cognitive";

/** Canonical analytics event — all 13 layers share this base structure. */
export interface AnalyticsEvent {
  /** Unique event identifier (UUID or time-based fallback). */
  eventId: string;
  /** Semantic name for the event, e.g. "page_view" or "form_submit". */
  eventName: string;
  /** UTC ISO-8601 timestamp of the event. */
  timestamp: string;
  /** Schema version string for forward-compatibility validation. */
  schemaVersion: string;

  // --- Subject identification (anonymous by default) ---
  /** Anonymous browser-scoped session identifier (from sessionStorage). */
  sessionId?: string;
  /** Anonymous browser-level visitor identifier (from localStorage). */
  visitorId?: string;

  // --- Page context ---
  /** Current page path at the time of the event. */
  pagePath: string;
  /** Canonical landing page for this session. */
  landingPage?: string;

  // --- Traffic attribution ---
  /** Classified traffic source. */
  trafficSource?: string;
  /** Raw referrer URL (stripped of sensitive query params). */
  referrerCategory?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // --- Time-zone context ---
  /** Browser-reported IANA time-zone string. */
  timezone?: string;
  /** UTC offset in minutes. */
  utcOffset?: string;
  /** Local hour at the time of the event (0–23). */
  activityLocalHour?: string;
  /** Local day of week at the time of the event. */
  activityDay?: string;

  // --- Event-specific properties ---
  /** Free-form typed event properties. */
  properties?: Record<string, string | number | boolean>;

  // --- Consent and collection status ---
  consentStatus?: ConsentStatus;

  // --- Session kind ---
  sessionKind?: "new_session" | "returning_session";

  // --- Source metadata ---
  /** Which analytics tab / category generated this event. */
  sourceTab?: string;
  /** Human-readable event value, e.g. destination URL or CTA label. */
  eventValue?: string;
}

/** Validate an event against the schema. Returns an array of error messages. */
export function validateEvent(raw: unknown): string[] {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return ["Event must be a non-null object"];
  }
  const event = raw as Record<string, unknown>;

  if (typeof event["eventId"] !== "string" || !event["eventId"]) {
    errors.push("eventId is required and must be a non-empty string");
  }
  if (typeof event["eventName"] !== "string" || !event["eventName"]) {
    errors.push("eventName is required and must be a non-empty string");
  }
  if (typeof event["timestamp"] !== "string" || !event["timestamp"] || Number.isNaN(Date.parse(event["timestamp"] as string))) {
    errors.push("timestamp must be a valid ISO-8601 date string");
  }
  if (typeof event["pagePath"] !== "string") {
    errors.push("pagePath must be a string");
  }
  if (typeof event["schemaVersion"] !== "string" || !event["schemaVersion"]) {
    errors.push("schemaVersion is required");
  }

  return errors;
}

/** Enrich a raw analytics payload with schema version and validated defaults. */
export function normalizeEvent(raw: Record<string, unknown>): AnalyticsEvent {
  const event: AnalyticsEvent = {
    eventId: String(raw["eventId"] ?? raw["id"] ?? ""),
    eventName: String(raw["eventName"] ?? raw["event"] ?? ""),
    timestamp: String(raw["timestamp"] ?? new Date().toISOString()),
    schemaVersion: String(raw["schemaVersion"] ?? SCHEMA_VERSION),
    pagePath: String(raw["pagePath"] ?? raw["page"] ?? "/"),
  };

  if (raw["sessionId"]) event.sessionId = String(raw["sessionId"]);
  if (raw["visitorId"]) event.visitorId = String(raw["visitorId"]);
  if (raw["landingPage"]) event.landingPage = String(raw["landingPage"]);
  if (raw["trafficSource"]) event.trafficSource = String(raw["trafficSource"]);
  if (raw["referrerCategory"] || raw["referrerUrl"]) {
    event.referrerCategory = String(raw["referrerCategory"] ?? raw["referrerUrl"]);
  }
  if (raw["utmSource"]) event.utmSource = String(raw["utmSource"]);
  if (raw["utmMedium"]) event.utmMedium = String(raw["utmMedium"]);
  if (raw["utmCampaign"]) event.utmCampaign = String(raw["utmCampaign"]);
  if (raw["utmTerm"]) event.utmTerm = String(raw["utmTerm"]);
  if (raw["utmContent"]) event.utmContent = String(raw["utmContent"]);
  if (raw["timezone"]) event.timezone = String(raw["timezone"]);
  if (raw["utcOffset"]) event.utcOffset = String(raw["utcOffset"]);
  if (raw["activityLocalHour"]) event.activityLocalHour = String(raw["activityLocalHour"]);
  if (raw["activityDay"]) event.activityDay = String(raw["activityDay"]);
  if (raw["sessionKind"] === "returning_session") {
    event.sessionKind = "returning_session";
  } else if (raw["sessionKind"] === "new_session") {
    event.sessionKind = "new_session";
  }
  if (raw["sourceTab"]) event.sourceTab = String(raw["sourceTab"]);
  if (raw["eventValue"] ?? raw["value"]) {
    event.eventValue = String(raw["eventValue"] ?? raw["value"]);
  }

  return event;
}

// ─── Intelligence Layer Metadata ────────────────────────────────────────────

export interface LayerMeta {
  id: IntelligenceLayerId;
  tier: IntelligenceTier;
  layerNumber: number;
  name: string;
  description: string;
  dataQuality: DataQuality;
  requiresProvider: boolean;
  providerName?: string;
}

export const INTELLIGENCE_LAYERS: LayerMeta[] = [
  // Tier 1 — Foundational Intelligence
  {
    id: "session",
    tier: "foundational",
    layerNumber: 1,
    name: "Session Intelligence",
    description: "Session lifecycle, page flow, dwell times, bounce, and engagement signals.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "traffic",
    tier: "foundational",
    layerNumber: 2,
    name: "Traffic Intelligence",
    description: "Traffic source classification, UTM attribution, and referrer analysis.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "geo",
    tier: "foundational",
    layerNumber: 3,
    name: "Geo Intelligence",
    description: "Country, region, and city enrichment via server-side IP geolocation.",
    dataQuality: "inferred",
    requiresProvider: true,
    providerName: "GEO_PROVIDER_URL",
  },
  {
    id: "timezone",
    tier: "foundational",
    layerNumber: 4,
    name: "Time Zone Intelligence",
    description: "UTC event timestamps, browser timezone, hour-of-day, and day-of-week patterns.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "ip",
    tier: "foundational",
    layerNumber: 5,
    name: "IP Intelligence",
    description: "Network type, ISP, and ASN enrichment via server-side IP lookup.",
    dataQuality: "inferred",
    requiresProvider: true,
    providerName: "NETWORK_PROVIDER_URL",
  },

  // Tier 2 — Behavioral Intelligence
  {
    id: "behavior",
    tier: "behavioral",
    layerNumber: 6,
    name: "User Behavior Intelligence",
    description: "Scroll depth, page interactions, CTA clicks, and engagement milestones.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "repeat_visitor",
    tier: "behavioral",
    layerNumber: 7,
    name: "Repeat Visitor Intelligence",
    description: "Session count, recency, visit frequency, and first-party retention signals.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "interest",
    tier: "behavioral",
    layerNumber: 8,
    name: "Interest Area Intelligence",
    description: "Section visits, topic affinity, and content engagement patterns.",
    dataQuality: "inferred",
    requiresProvider: false,
  },
  {
    id: "conversion",
    tier: "behavioral",
    layerNumber: 9,
    name: "Conversion Intelligence",
    description: "Form funnel stages, submission confirmation, and abandonment rates.",
    dataQuality: "live",
    requiresProvider: false,
  },
  {
    id: "engagement",
    tier: "behavioral",
    layerNumber: 10,
    name: "Engagement Intelligence",
    description: "Meaningful micro-conversions, CTA interactions, and engagement scoring.",
    dataQuality: "live",
    requiresProvider: false,
  },

  // Tier 3 — Strategic Intelligence
  {
    id: "predictive",
    tier: "strategic",
    layerNumber: 11,
    name: "Predictive Intelligence",
    description: "Rules-based conversion propensity scoring and next-action likelihood.",
    dataQuality: "simulated",
    requiresProvider: false,
  },
  {
    id: "retention",
    tier: "strategic",
    layerNumber: 12,
    name: "Retention Intelligence",
    description: "Cohort trends, repeat-visit rates, and return engagement indicators.",
    dataQuality: "inferred",
    requiresProvider: false,
  },
  {
    id: "cognitive",
    tier: "strategic",
    layerNumber: 13,
    name: "Cognitive Intelligence",
    description: "Human-supervised experiment definitions, variant tracking, and audit log.",
    dataQuality: "simulated",
    requiresProvider: false,
  },
];

// ─── Engagement Score Weights ────────────────────────────────────────────────
// Documented scoring system — weights can be adjusted without changing core logic.
export const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  page_view: 1,
  scroll_25: 1,
  scroll_50: 2,
  scroll_75: 3,
  scroll_90: 4,
  scroll_100: 5,
  engagement_30s: 3,
  engagement_60s: 6,
  engagement_120s: 12,
  form_open: 5,
  form_start: 8,
  form_submit: 20,
  lead_conversion: 30,
  cta_click: 4,
  document_selected: 6,
  ai_chat: 4,
  whatsapp_click: 8,
};

export function calculateEngagementScore(events: Array<{ event: string }>): number {
  return events.reduce((score, ev) => {
    const weight = ENGAGEMENT_WEIGHTS[ev.event] ?? 0;
    return score + weight;
  }, 0);
}

// ─── Propensity Scoring (rules-based baseline) ───────────────────────────────
export type PropensityBand = "low" | "medium" | "high";

export interface PropensityScore {
  band: PropensityBand;
  score: number; // 0–100, rule-derived
  factors: string[];
  isSimulated: boolean; // Always true until ML model is trained
  recommendation: string;
}

export function calculatePropensity(profile: {
  sessionCount: number;
  converted: boolean;
  engagementScore: number;
  pagesVisited: number;
  hasFormInteraction: boolean;
  isReturning: boolean;
}): PropensityScore {
  const factors: string[] = [];
  let score = 0;

  if (profile.converted) {
    return {
      band: "high",
      score: 100,
      factors: ["confirmed_conversion"],
      isSimulated: true,
      recommendation: "Follow up with inquiry response",
    };
  }

  if (profile.isReturning) { score += 20; factors.push("returning_visitor"); }
  if (profile.sessionCount > 2) { score += 10; factors.push("multi_session"); }
  if (profile.pagesVisited >= 4) { score += 15; factors.push("deep_navigation"); }
  if (profile.hasFormInteraction) { score += 25; factors.push("form_interaction"); }
  if (profile.engagementScore >= 30) { score += 20; factors.push("high_engagement_score"); }
  else if (profile.engagementScore >= 15) { score += 10; factors.push("medium_engagement_score"); }

  const band: PropensityBand = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  const recommendations: Record<PropensityBand, string> = {
    high: "Personalize CTA with direct contact offer",
    medium: "Surface relevant case studies and region info",
    low: "Provide top-of-funnel educational content",
  };

  return { band, score: Math.min(score, 99), factors, isSimulated: true, recommendation: recommendations[band] };
}
