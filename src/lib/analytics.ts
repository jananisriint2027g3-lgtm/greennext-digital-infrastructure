/**
 * GreenNext Centralized Analytics & Behavioral Tracking Utility
 *
 * Sends user interaction telemetry directly to the designated Google Apps Script Web App endpoint.
 * Schema matches the 10 fixed Google Sheets tabs exactly:
 *
 * Behavioral tabs use: Timestamp | Event | Value | Page | Session ID | Session Kind.
 * Historical rows may still use the original five-column format.
 */

import { submitAirtableBehaviorEvent } from "./airtable-analytics.server-fn";
import { readClientContext } from "./layer2-intelligence";
import { recordActionEvent } from "./action-layer";

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzP-MhwkC997UhXNzrORh9u3KQFw9Sf66RW9n4Ut7ZhK0HiFeRtjdX1tBRbM7pUIGsY/exec";
const ANALYTICS_ENRICHMENT_ENDPOINT = "/api/analytics";

function isPublicAppsScriptEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "script.google.com" &&
      /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

const configuredAnalyticsEndpoint =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env["VITE_ANALYTICS_ENDPOINT"]?.trim()
    : undefined;

// Only the public /macros/s/.../exec form is accepted. Legacy account-scoped values
// from stale deployment configuration are rejected and cannot override the current endpoint.
export const ANALYTICS_ENDPOINT: string =
  configuredAnalyticsEndpoint && isPublicAppsScriptEndpoint(configuredAnalyticsEndpoint)
    ? configuredAnalyticsEndpoint
    : DEFAULT_APPS_SCRIPT_URL;

function createAnalyticsEventId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // Fall through to a non-identifying time/random value.
  }
  return `gn_evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function sendAnalyticsBody(body: string): void {
  const fallback = () => {
    fetch(ANALYTICS_ENDPOINT, { method: "POST", mode: "no-cors", body }).catch(() => {
      // Analytics failure must never interrupt the visitor experience.
    });
  };

  fetch(ANALYTICS_ENRICHMENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).then((response) => {
    if (!response.ok) fallback();
  }).catch(fallback);
}

export type AnalyticsTab =
  | "Navigation"
  | "Regions"
  | "Infrastructure"
  | "Energy"
  | "Automation"
  | "Solutions"
  | "Industries"
  | "Locations"
  | "AI Assistant"
  | "CTA Interactions";

export interface AnalyticsPayload {
  tab: AnalyticsTab;
  event: string;
  value: string;
  page?: string;
}

const SESSION_KEY = "gn_analytics_session_id";
const SESSION_SEEN_KEY = "gn_analytics_session_seen";
const SESSION_KIND_KEY = "gn_analytics_session_kind";
let lastPageViewKey = "";
let lastPageViewAt = 0;
let lastFormOpenKey = "";
let lastFormOpenAt = 0;

export type SessionKind = "new_session" | "returning_session";

/**
 * Retrieves or initializes an anonymous persistent session ID for the current browser session.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = "gn_s_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "session_fallback";
  }
}

/** Returns an anonymous browser-local session classification without identifying a person. */
export function getSessionKind(): SessionKind {
  if (typeof window === "undefined") return "new_session";
  try {
    const currentSessionId = getSessionId();
    const existingKind = sessionStorage.getItem(SESSION_KIND_KEY);
    if (existingKind === "new_session" || existingKind === "returning_session") {
      return existingKind;
    }
    const kind: SessionKind = localStorage.getItem(SESSION_SEEN_KEY)
      ? "returning_session"
      : "new_session";
    localStorage.setItem(SESSION_SEEN_KEY, currentSessionId);
    sessionStorage.setItem(SESSION_KIND_KEY, kind);
    return kind;
  } catch {
    return "new_session";
  }
}

/**
 * Returns current route pathname safely.
 */
export function getCurrentPage(): string {
  if (typeof window === "undefined") return "/";
  try {
    return window.location.pathname || "/";
  } catch {
    return "/";
  }
}

/**
 * Sanitizes chat messages to concise behavioral topics/intents without storing private raw text.
 */
export function sanitizeChatTopic(rawMessage: string): string {
  const q = rawMessage.toLowerCase().trim();
  if (!q) return "general_inquiry";

  if (q.includes("madurai") || q.includes("mdu")) return "region:madurai";
  if (q.includes("coimbatore") || q.includes("cjb")) return "region:coimbatore";
  if (q.includes("trichy") || q.includes("trz") || q.includes("tiruchirappalli"))
    return "region:trichy";
  if (q.includes("mangalore") || q.includes("ixe") || q.includes("mangaluru"))
    return "region:mangalore";
  if (q.includes("region") || q.includes("location") || q.includes("south india"))
    return "topic:regional_network";
  if (q.includes("ai") || q.includes("compute") || q.includes("gpu") || q.includes("density"))
    return "topic:ai_compute_infrastructure";
  if (q.includes("power") || q.includes("energy") || q.includes("cooling") || q.includes("thermal"))
    return "topic:energy_and_cooling";
  if (q.includes("automation") || q.includes("workflow") || q.includes("anomaly") || q.includes("alert"))
    return "topic:intelligent_automation";
  if (q.includes("contact") || q.includes("talk") || q.includes("phone") || q.includes("email"))
    return "intent:contact_inquiry";
  if (q.includes("what is") || q.includes("about") || q.includes("greennext"))
    return "topic:about_greennext";

  // Truncate to maximum 40 alphanumeric characters to avoid sensitive data leakage
  return "query:" + q.replace(/[^a-z0-9\s_-]/gi, "").substring(0, 40).trim();
}

/**
 * Central event tracking dispatcher.
 * Maps the target tab and entity value to the exact column headers expected by the Google Sheet.
 */
export function trackEvent({ tab, event, value, page }: AnalyticsPayload): void {
  if (typeof window === "undefined") return;

  const pagePath = page || getCurrentPage();
  const sessionId = getSessionId();
  const sessionKind = getSessionKind();
  const context = readClientContext(pagePath);

  // Keep the payload flat so it can be handled directly by the Apps Script web app.
  const payload: Record<string, string> = {
    eventId: createAnalyticsEventId(),
    sheet: tab,
    event,
    page: pagePath,
    sessionId,
    sessionKind,
    timestamp: new Date().toISOString(),
    siteHost: context.siteHost,
    trafficSource: context.trafficSource,
    referrerUrl: context.referrerUrl,
    landingPage: context.landingPage,
    utmSource: context.utmSource,
    utmMedium: context.utmMedium,
    utmCampaign: context.utmCampaign,
    utmTerm: context.utmTerm,
    utmContent: context.utmContent,
    timezone: context.timezone,
    utcOffset: context.utcOffset,
    activityLocalHour: context.activityLocalHour,
    activityDay: context.activityDay,
  };

  switch (tab) {
    case "Navigation":
      payload["destination"] = value;
      break;
    case "Regions":
      payload["region"] = value;
      break;
    case "Infrastructure":
      payload["capability"] = value;
      break;
    case "Energy":
      payload["topic"] = value;
      break;
    case "Automation":
      payload["feature"] = value;
      break;
    case "Solutions":
      payload["solution"] = value;
      break;
    case "Industries":
      payload["industry"] = value;
      break;
    case "Locations":
      payload["location"] = value;
      break;
    case "AI Assistant":
      payload["inputSelection"] = value;
      break;
    case "CTA Interactions":
      payload["cta"] = value;
      break;
  }

  // The action layer maintains only a local, anonymous first-party profile.
  // It reuses this canonical event stream and never adds visitor identity to it.
  recordActionEvent({
    event,
    page: pagePath,
    value,
    sourceTab: tab,
    sessionId,
    sessionKind,
  });

  try {
    const body = JSON.stringify(payload);

    sendAnalyticsBody(body);
  } catch {
    // Graceful error suppression
  }

  void submitAirtableBehaviorEvent({
    data: {
      sessionId,
      sessionKind: getSessionKind(),
      page: pagePath,
      event,
      value,
      sourceTab: tab,
    },
  }).catch(() => {
    // Airtable is an optional POC destination and must never affect analytics.
  });
}

/** PII-free page-view signal. One call should be made per actual route visit. */
export function trackPageView(page = getCurrentPage()): void {
  const now = Date.now();
  if (lastPageViewKey === page && now - lastPageViewAt < 500) return;
  lastPageViewKey = page;
  lastPageViewAt = now;
  trackEvent({ tab: "CTA Interactions", event: "page_view", value: page, page });
}

export function trackScrollDepth(depth: 25 | 50 | 75 | 90 | 100, page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: `scroll_${depth}`, value: `${depth}%`, page });
}

export function trackEngagement(seconds: 30 | 60 | 120, page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: `engagement_${seconds}s`, value: `${seconds}s`, page });
}

/** Records active foreground time for the current page without treating hidden time as engagement. */
export function trackPageDwell(activeMs: number, page = getCurrentPage()): void {
  const safeActiveMs = Math.max(0, Math.round(activeMs));
  if (safeActiveMs <= 0) return;
  trackEvent({ tab: "CTA Interactions", event: "time_on_page", value: String(safeActiveMs), page });
}

/** Best-effort lifecycle signal used only when the browser is actually leaving the document. */
export function trackSessionEnd(page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: "session_end", value: "observed", page });
}

export function trackFormOpen(formType: string, page = getCurrentPage()): void {
  const key = `${page}|${formType}`;
  const now = Date.now();
  if (lastFormOpenKey === key && now - lastFormOpenAt < 500) return;
  lastFormOpenKey = key;
  lastFormOpenAt = now;
  trackEvent({ tab: "CTA Interactions", event: "form_open", value: formType, page });
}

export function trackFormStart(formType: string, page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: "form_start", value: formType, page });
}

export function trackDocumentSelected(formType: string, page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: "document_selected", value: formType, page });
}

export function trackFormAbandon(formType: string, page = getCurrentPage()): void {
  trackEvent({ tab: "CTA Interactions", event: "form_abandon", value: formType, page });
}
