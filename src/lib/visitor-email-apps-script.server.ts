/**
 * Visitor confirmation email delivery via the GreenNext Google Apps Script web app.
 *
 * The website never sends HTML/subject/recipients-as-free-text to Apps Script. It sends only
 * { name, email, formType, leadType, category, requestId } plus a server-side shared secret.
 * Apps Script renders the approved template itself, verifies the request exists in Google
 * Sheets, de-duplicates by requestId and sends through MailApp.
 *
 * Server-only: the URL and secret never reach browser code.
 */

export const VISITOR_FORM_TYPES = ["quick_inquiry", "long_form_inquiry", "lead_inquiry"] as const;
export type VisitorFormType = (typeof VISITOR_FORM_TYPES)[number];

export interface VisitorEmailRequest {
  name: string;
  email: string;
  formType: VisitorFormType;
  leadType?: string | undefined;
  category?: string | undefined;
  requestId: string;
}

export interface AppsScriptEmailResult {
  success: boolean;
  /** "sent" | "duplicate" | "failed" | "not_configured" | "invalid" */
  status: string;
  duplicate: boolean;
  error?: string | undefined;
  /** Opaque delivery reference reported by Apps Script (MailApp exposes no message id). */
  deliveryRef?: string | undefined;
}

export interface AppsScriptEmailConfig {
  url?: string | undefined;
  secret?: string | undefined;
  timeoutMs?: number | undefined;
  fetchImpl?: typeof fetch | undefined;
}

const REQUEST_ID_RE = /^gn_req_[a-zA-Z0-9_-]{8,128}$/;
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const DEFAULT_EMAIL_TIMEOUT_MS = 25_000;

/** Returns an error string if the request is invalid, otherwise null. */
export function validateVisitorEmailRequest(input: VisitorEmailRequest): string | null {
  if (!input || typeof input !== "object") return "Invalid payload";
  if (!input.name || !input.name.trim() || input.name.length > 200) return "Invalid name";
  const email = (input.email || "").trim();
  if (email.length < 5 || email.length > 320 || !EMAIL_RE.test(email)) return "Invalid recipient email format";
  if (!VISITOR_FORM_TYPES.includes(input.formType)) return "Unsupported inquiry type";
  if (!REQUEST_ID_RE.test(input.requestId || "")) return "Invalid request identifier format";
  return null;
}

export function resolveAppsScriptEmailConfig(env: Record<string, string | undefined> = process.env) {
  const url = (env["VISITOR_EMAIL_APPS_SCRIPT_URL"] || env["REPORT_APPS_SCRIPT_URL"] || env["ANALYTICS_APPS_SCRIPT_URL"] || "").trim();
  const secret = (env["VISITOR_EMAIL_SECRET"] || env["REPORT_TRIGGER_SECRET"] || "").trim();
  return { url, secret };
}

/** Requests currently in flight in this server instance, to collapse concurrent duplicates. */
const inFlight = new Map<string, Promise<AppsScriptEmailResult>>();

/**
 * Calls the Apps Script `dispatch_email` action once. Never retries (a retry could send a
 * second copy if the first attempt actually succeeded but the response was lost).
 * Never throws; failures are returned as { success: false }.
 */
export function sendVisitorEmailViaAppsScript(
  input: VisitorEmailRequest,
  config: AppsScriptEmailConfig = {},
): Promise<AppsScriptEmailResult> {
  const existing = inFlight.get(input?.requestId);
  if (existing) return existing.then((r) => ({ ...r, duplicate: true }));
  const p = doSend(input, config).finally(() => {
    if (input?.requestId) inFlight.delete(input.requestId);
  });
  if (input?.requestId) inFlight.set(input.requestId, p);
  return p;
}

async function doSend(input: VisitorEmailRequest, config: AppsScriptEmailConfig): Promise<AppsScriptEmailResult> {
  const invalid = validateVisitorEmailRequest(input);
  if (invalid) return { success: false, status: "invalid", duplicate: false, error: invalid };

  const resolved = resolveAppsScriptEmailConfig();
  const url = (config.url ?? resolved.url).trim();
  const secret = (config.secret ?? resolved.secret).trim();
  if (!url || !secret) {
    return {
      success: false,
      status: "not_configured",
      duplicate: false,
      error: "Email delivery is not configured (Apps Script URL or secret missing on the server).",
    };
  }

  const doFetch = config.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_EMAIL_TIMEOUT_MS);
  try {
    const response = await doFetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      signal: controller.signal,
      body: JSON.stringify({
        action: "dispatch_email",
        secret,
        name: input.name.trim(),
        email: input.email.trim(),
        formType: input.formType,
        leadType: input.leadType || "",
        category: input.category || "",
        requestId: input.requestId,
      }),
    });

    if (!response.ok) {
      return { success: false, status: "failed", duplicate: false, error: `Apps Script HTTP ${response.status}` };
    }

    const text = await response.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // HTML sign-in / error page instead of JSON => deployment access problem.
    }
    if (!json) {
      return {
        success: false,
        status: "failed",
        duplicate: false,
        error: "Apps Script returned a non-JSON response (check web app deployment access and URL).",
      };
    }

    const status = typeof json["status"] === "string" ? (json["status"] as string) : json["success"] ? "sent" : "failed";
    const duplicate = json["duplicate"] === true || status === "duplicate";
    const result: AppsScriptEmailResult = {
      success: json["success"] === true,
      status,
      duplicate,
    };
    if (typeof json["deliveryRef"] === "string") result.deliveryRef = json["deliveryRef"] as string;
    if (!result.success) {
      result.error = String(json["message"] || json["error"] || "Apps Script rejected the email request").slice(0, 300);
    }
    return result;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      status: "failed",
      duplicate: false,
      error: aborted ? "Apps Script email request timed out" : "Network error calling Apps Script",
    };
  } finally {
    clearTimeout(timer);
  }
}
