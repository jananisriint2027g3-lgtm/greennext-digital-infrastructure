export type TrafficSource = "direct" | "organic" | "paid" | "referral" | "social" | "campaign" | "unknown";

export interface TrafficInput {
  referrerUrl?: string;
  currentHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ClientContext {
  siteHost: string;
  trafficSource: TrafficSource;
  referrerUrl: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  timezone: string;
  utcOffset: string;
  activityLocalHour: string;
  activityDay: string;
}

export interface GeoEnrichment {
  country: string;
  region: string;
  city: string;
  confidence: string;
  source: string;
}

export interface NetworkEnrichment {
  networkType: string;
  isp: string;
  organization: string;
  asn: string;
  confidence: string;
  source: string;
}

const SOCIAL_HOSTS = new Set(["facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "youtube.com", "tiktok.com"]);
const ORGANIC_HOSTS = new Set(["google.com", "bing.com", "yahoo.com", "duckduckgo.com", "baidu.com"]);

function hostOf(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function classifyTraffic(input: TrafficInput): TrafficSource {
  const source = input.utmSource?.trim().toLowerCase() || "";
  const medium = input.utmMedium?.trim().toLowerCase() || "";
  const referrerHost = hostOf(input.referrerUrl || "");
  const currentHost = (input.currentHost || "").toLowerCase().replace(/^www\./, "");

  if (["cpc", "ppc", "paid", "paid_social", "display", "programmatic"].includes(medium)) return "paid";
  if (medium === "social" || SOCIAL_HOSTS.has(source) || SOCIAL_HOSTS.has(referrerHost)) return "social";
  if (medium === "organic" || ORGANIC_HOSTS.has(source) || ORGANIC_HOSTS.has(referrerHost)) return "organic";
  if (source || medium || input.utmCampaign) return input.utmCampaign || source || medium ? "campaign" : "unknown";
  if (!input.referrerUrl) return "direct";
  if (referrerHost && currentHost && referrerHost === currentHost) return "direct";
  return referrerHost ? "referral" : "unknown";
}

export function readClientContext(page: string, now = new Date()): ClientContext {
  const location = typeof window !== "undefined" ? window.location : undefined;
  const params = new URLSearchParams(location?.search || "");
  const sessionKey = "gn_analytics_context";
  let stored: Partial<ClientContext> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(sessionKey) || "{}") as Partial<ClientContext>;
  } catch {
    stored = {};
  }
  const firstVisit = !stored.landingPage;
  const referrerUrl = stored.referrerUrl || (firstVisit && typeof document !== "undefined" ? document.referrer : "");
  const landingPage = stored.landingPage || page || "/";
  const utm = (name: string) => stored[`utm${name.charAt(0).toUpperCase()}${name.slice(1)}` as keyof ClientContext] || (firstVisit ? params.get(name) || "" : "");
  const timezone = stored.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "" : "");
  const utcOffset = stored.utcOffset || String(-now.getTimezoneOffset());
  const context: ClientContext = {
    siteHost: location?.hostname || "",
    trafficSource: classifyTraffic({
      referrerUrl,
      currentHost: location?.hostname || "",
      utmSource: utm("source"),
      utmMedium: utm("medium"),
      utmCampaign: utm("campaign"),
    }),
    referrerUrl,
    landingPage,
    utmSource: utm("source"),
    utmMedium: utm("medium"),
    utmCampaign: utm("campaign"),
    utmTerm: utm("term"),
    utmContent: utm("content"),
    timezone,
    utcOffset,
    activityLocalHour: String(now.getHours()),
    activityDay: normalizeActivityDay(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()] || "Unknown"),
  };
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(context));
  } catch {
    // Storage may be unavailable; the current event still carries the context.
  }
  return context;
}

function providerString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function providerConfidence(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) return String(value);
  if (typeof value === "string" && /^(0|1|0?\.\d+)$/.test(value.trim())) return value.trim();
  return "";
}

export function normalizeGeoEnrichment(input: unknown): GeoEnrichment {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    country: providerString(value["country"] ?? value["country_code"], 100),
    region: providerString(value["region"] ?? value["region_name"], 150),
    city: providerString(value["city"], 150),
    confidence: providerConfidence(value["confidence"]),
    source: providerString(value["source"] ?? value["provider"], 100),
  };
}

export function normalizeNetworkEnrichment(input: unknown): NetworkEnrichment {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    networkType: providerString(value["networkType"] ?? value["network_type"], 100),
    isp: providerString(value["isp"], 200),
    organization: providerString(value["organization"] ?? value["org"], 200),
    asn: providerString(value["asn"], 100),
    confidence: providerConfidence(value["confidence"]),
    source: providerString(value["source"] ?? value["provider"], 100),
  };
}

export function detectSuspiciousTraffic(
  timestamps: number[],
  pageViewCount: number,
  eventCount = timestamps.length,
  sessionDurationMs = 0,
): { suspicious: boolean; reason: string } {
  const ordered = timestamps.filter(Number.isFinite).sort((a, b) => a - b);
  const burst = ordered.some((time, index) => ordered[index + 20] !== undefined && ordered[index + 20]! - time <= 10_000);
  if (eventCount > 120) return { suspicious: true, reason: "high_event_volume" };
  if (pageViewCount > 30) return { suspicious: true, reason: "high_page_view_volume" };
  if (burst) return { suspicious: true, reason: "large_event_burst" };
  if (eventCount >= 40 && sessionDurationMs > 0 && sessionDurationMs <= 60_000) {
    return { suspicious: true, reason: "abnormal_activity_density" };
  }
  return { suspicious: false, reason: "" };
}

export function deriveLocalActivity(timezone: string, now = new Date()): { hour: string; day: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
      weekday: "long",
    }).formatToParts(now);
    return {
      hour: parts.find((part) => part.type === "hour")?.value || "",
      day: parts.find((part) => part.type === "weekday")?.value || "",
    };
  } catch {
    return { hour: String(now.getHours()), day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()] || "Unknown" };
  }
}

export function normalizeActivityDay(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
