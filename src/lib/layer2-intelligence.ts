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
  lastTrafficSource?: TrafficSource;
  lastReferrerUrl?: string;
  lastUtmSource?: string;
  lastUtmMedium?: string;
  lastUtmCampaign?: string;
  lastUtmTerm?: string;
  lastUtmContent?: string;
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

function hostOf(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "").split(":")[0] || "";
  } catch {
    return "";
  }
}

/**
 * Validates whether a hostname belongs to LinkedIn (including legitimate subdomains and shortener lnkd.in).
 * Rejects lookalike/phishing domains like linkedin-phishing.com or notlinkedin.com.
 */
export function isLinkedInHost(host: string): boolean {
  if (!host) return false;
  const h: string = host.toLowerCase().trim().replace(/^www\./, "").split(":")[0] || "";
  return (
    h === "linkedin.com" ||
    h.endsWith(".linkedin.com") ||
    h === "lnkd.in" ||
    h.endsWith(".lnkd.in")
  );
}

export function isSocialHost(host: string): boolean {
  if (!host) return false;
  const h: string = host.toLowerCase().trim().replace(/^www\./, "").split(":")[0] || "";
  if (isLinkedInHost(h)) return true;
  return (
    h === "facebook.com" || h.endsWith(".facebook.com") ||
    h === "instagram.com" || h.endsWith(".instagram.com") ||
    h === "twitter.com" || h.endsWith(".twitter.com") ||
    h === "x.com" || h.endsWith(".x.com") ||
    h === "youtube.com" || h.endsWith(".youtube.com") ||
    h === "tiktok.com" || h.endsWith(".tiktok.com")
  );
}

export function isOrganicHost(host: string): boolean {
  if (!host) return false;
  const h: string = host.toLowerCase().trim().replace(/^www\./, "").split(":")[0] || "";
  return (
    h === "google.com" || h.endsWith(".google.com") ||
    h === "bing.com" || h.endsWith(".bing.com") ||
    h === "yahoo.com" || h.endsWith(".yahoo.com") ||
    h === "duckduckgo.com" || h.endsWith(".duckduckgo.com") ||
    h === "baidu.com" || h.endsWith(".baidu.com")
  );
}

/**
 * Validates whether a UTM source represents legitimate LinkedIn traffic.
 * Handles campaign tags (e.g. linkedin_newsletter, linkedin-ads) and LinkedIn domains (linkedin.com, lnkd.in),
 * while rejecting lookalikes (notlinkedin.com, linkedin-phishing.com, fake-linkedin).
 */
export function isValidLinkedInSource(source: string): boolean {
  if (!source) return false;
  const s = source.toLowerCase().trim();
  if (s === "linkedin" || s === "lnkd.in") return true;
  if (s.includes(".")) return isLinkedInHost(s);
  return s.startsWith("linkedin_") || s.startsWith("linkedin-") || s.startsWith("linkedin/");
}

export function isLinkedInAttributed(context: {
  referrerUrl?: string;
  utmSource?: string;
  trafficSource?: string;
}): boolean {
  const source = (context.utmSource || "").trim();
  if (isValidLinkedInSource(source)) return true;
  if (context.referrerUrl) {
    const host = hostOf(context.referrerUrl);
    if (isLinkedInHost(host)) return true;
  }
  return false;
}

export function classifyTraffic(input: TrafficInput): TrafficSource {
  const source = input.utmSource?.trim().toLowerCase() || "";
  const medium = input.utmMedium?.trim().toLowerCase() || "";
  const referrerHost = hostOf(input.referrerUrl || "");
  const currentHost = (input.currentHost || "").toLowerCase().replace(/^www\./, "").split(":")[0];

  if (["cpc", "ppc", "paid", "paid_social", "display", "programmatic"].includes(medium)) return "paid";
  if (
    medium === "social" ||
    isSocialHost(source) ||
    source === "linkedin" ||
    isSocialHost(referrerHost)
  ) return "social";
  if (medium === "organic" || isOrganicHost(source) || isOrganicHost(referrerHost)) return "organic";
  if (source || medium || input.utmCampaign) return "campaign";
  if (!input.referrerUrl) return "direct";
  if (referrerHost && currentHost && referrerHost === currentHost) return "direct";
  return referrerHost ? "referral" : "unknown";
}

/**
 * Extracts query parameters checking standard utm_ prefix first, then unprefixed fallback.
 */
export function getUtmParam(params: URLSearchParams, name: string): string {
  const prefixed = params.get(`utm_${name}`);
  if (prefixed !== null && prefixed.trim() !== "") return prefixed.trim();
  const unprefixed = params.get(name);
  if (unprefixed !== null && unprefixed.trim() !== "") return unprefixed.trim();
  return "";
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
  const rawReferrer = firstVisit && typeof document !== "undefined" ? document.referrer : "";
  const referrerUrl = stored.referrerUrl || rawReferrer || "";
  const landingPage = stored.landingPage || page || "/";

  // Capture UTM parameters from URL if present
  const currentUtmSource = getUtmParam(params, "source");
  const currentUtmMedium = getUtmParam(params, "medium");
  const currentUtmCampaign = getUtmParam(params, "campaign");
  const currentUtmTerm = getUtmParam(params, "term");
  const currentUtmContent = getUtmParam(params, "content");

  // First-touch attribution: Never overwrite valid original attribution with empty values
  const utmSource = stored.utmSource || currentUtmSource || "";
  const utmMedium = stored.utmMedium || currentUtmMedium || "";
  const utmCampaign = stored.utmCampaign || currentUtmCampaign || "";
  const utmTerm = stored.utmTerm || currentUtmTerm || "";
  const utmContent = stored.utmContent || currentUtmContent || "";

  // Last-touch attribution: Track separately if new parameters arrive mid-session
  const hasNewAttribution = Boolean(
    currentUtmSource || currentUtmMedium || currentUtmCampaign || (!firstVisit && rawReferrer && rawReferrer !== referrerUrl)
  );
  const lastReferrerUrl = hasNewAttribution && rawReferrer ? rawReferrer : (stored.lastReferrerUrl || referrerUrl);
  const lastUtmSource = currentUtmSource || stored.lastUtmSource || utmSource;
  const lastUtmMedium = currentUtmMedium || stored.lastUtmMedium || utmMedium;
  const lastUtmCampaign = currentUtmCampaign || stored.lastUtmCampaign || utmCampaign;
  const lastUtmTerm = currentUtmTerm || stored.lastUtmTerm || utmTerm;
  const lastUtmContent = currentUtmContent || stored.lastUtmContent || utmContent;

  const timezone = stored.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "" : "");
  const utcOffset = stored.utcOffset || String(-now.getTimezoneOffset());
  const currentHost = location?.hostname || "";

  const trafficSource = stored.trafficSource && stored.trafficSource !== "unknown"
    ? stored.trafficSource
    : classifyTraffic({
        referrerUrl,
        currentHost,
        utmSource,
        utmMedium,
        utmCampaign,
      });

  const lastTrafficSource = hasNewAttribution
    ? classifyTraffic({
        referrerUrl: lastReferrerUrl,
        currentHost,
        utmSource: lastUtmSource,
        utmMedium: lastUtmMedium,
        utmCampaign: lastUtmCampaign,
      })
    : (stored.lastTrafficSource || trafficSource);

  const context: ClientContext = {
    siteHost: currentHost,
    trafficSource,
    referrerUrl,
    landingPage,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    lastTrafficSource,
    lastReferrerUrl,
    lastUtmSource,
    lastUtmMedium,
    lastUtmCampaign,
    lastUtmTerm,
    lastUtmContent,
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
    country: providerString(value["country"] ?? value["country_name"] ?? value["country_code2"] ?? value["country_code"], 100),
    region: providerString(value["region"] ?? value["region_name"], 150),
    city: providerString(value["city"] ?? value["city_name"], 150),
    confidence: providerConfidence(value["confidence"]),
    source: providerString(value["source"] ?? value["provider"], 100),
  };
}

export function normalizeNetworkEnrichment(input: unknown): NetworkEnrichment {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    networkType: providerString(value["networkType"] ?? value["network_type"], 100),
    isp: providerString(value["isp"], 200),
    organization: providerString(value["organization"] ?? value["org"] ?? value["as_name"], 200),
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
