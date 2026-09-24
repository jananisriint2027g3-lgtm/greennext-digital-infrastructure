/**
 * GreenNext Centralized Analytics & Behavioral Tracking Utility
 *
 * Sends user interaction telemetry directly to the designated Google Apps Script Web App endpoint.
 * Schema matches the 10 fixed Google Sheets tabs exactly:
 *
 * 1. Navigation:      Timestamp | Event | Page | Destination | Session ID
 * 2. Regions:         Timestamp | Event | Region | Page | Session ID
 * 3. Infrastructure:  Timestamp | Event | Capability | Page | Session ID
 * 4. Energy:          Timestamp | Event | Topic | Page | Session ID
 * 5. Automation:      Timestamp | Event | Feature | Page | Session ID
 * 6. Solutions:       Timestamp | Event | Solution | Page | Session ID
 * 7. Industries:      Timestamp | Event | Industry | Page | Session ID
 * 8. Locations:       Timestamp | Event | Location | Page | Session ID
 * 9. AI Assistant:    Timestamp | Event | Input / Selection | Page | Session ID
 * 10. CTA Interactions: Timestamp | Event | CTA | Page | Session ID
 */

const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzk_tlffmviPdB8wpH4eg5Yb5bqDBvGKhOVF1lh1B9JEZnOgq6CLZxPU5dAlyTXTz4/exec";

export const ANALYTICS_ENDPOINT: string =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_ANALYTICS_ENDPOINT) ||
  DEFAULT_APPS_SCRIPT_URL;

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

  // Keep the payload flat so it can be handled directly by the Apps Script web app.
  const payload: Record<string, string> = {
    sheet: tab,
    event,
    page: pagePath,
    sessionId,
  };

  switch (tab) {
    case "Navigation":
      payload.destination = value;
      break;
    case "Regions":
      payload.region = value;
      break;
    case "Infrastructure":
      payload.capability = value;
      break;
    case "Energy":
      payload.topic = value;
      break;
    case "Automation":
      payload.feature = value;
      break;
    case "Solutions":
      payload.solution = value;
      break;
    case "Industries":
      payload.industry = value;
      break;
    case "Locations":
      payload.location = value;
      break;
    case "AI Assistant":
      payload.inputSelection = value;
      break;
    case "CTA Interactions":
      payload.cta = value;
      break;
  }

  try {
    const body = JSON.stringify(payload);

    // Prefer navigator.sendBeacon for fast, non-blocking telemetry
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
      if (sent) return;
    }

    // Use a simple request to avoid a CORS preflight on the Apps Script endpoint.
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body,
    }).catch(() => {
      // Graceful silence: analytics should never break user interactions
    });
  } catch {
    // Graceful error suppression
  }
}
