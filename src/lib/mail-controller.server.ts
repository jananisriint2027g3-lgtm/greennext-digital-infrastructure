import type { SecurityAlertEvent, SecurityNotifier } from "./security.server";

export interface MailDeliveryOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  from?: string | undefined;
  replyTo?: string | undefined;
  headers?: Record<string, string> | undefined;
}

export interface MailDispatchResult {
  success: boolean;
  messageId: string;
  dispatchedAt: string;
  error?: string | undefined;
  simulated?: boolean | undefined;
  duplicate?: boolean | undefined;
}

export interface MailTransport {
  readonly isSimulated: boolean;
  readonly name?: string;
  send(options: MailDeliveryOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Standard RFC-5322 compliant email validator.
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 320 || trimmed.length < 5) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * In-memory ledger tracking simulated dispatches for verification & testing.
 */
export interface SimulatedDispatchEntry {
  messageId: string;
  options: MailDeliveryOptions;
  dispatchedAt: string;
  requestId?: string | undefined;
}

/**
 * Simulated Mail Transport for dry-run testing and safe default local/preview/production operation.
 * NEVER makes outbound network requests or dispatches real emails.
 */
export class SimulatedMailTransport implements MailTransport {
  public readonly isSimulated = true;
  public readonly name = "simulated";
  private static ledger: SimulatedDispatchEntry[] = [];

  public static getLedger(): readonly SimulatedDispatchEntry[] {
    return this.ledger;
  }

  public static clearLedger(): void {
    this.ledger = [];
  }

  public async send(options: MailDeliveryOptions): Promise<{ success: boolean; messageId: string }> {
    const messageId = `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: SimulatedDispatchEntry = {
      messageId,
      options,
      dispatchedAt: new Date().toISOString(),
    };
    SimulatedMailTransport.ledger.push(entry);

    if (SimulatedMailTransport.ledger.length > 200) {
      SimulatedMailTransport.ledger.shift();
    }

    return {
      success: true,
      messageId,
    };
  }
}

/**
 * Apps Script Mail Transport dispatching to Google Apps Script backend Web App.
 * Note: Intended for internal notifications only; lacks visitor deliverability headers.
 */
export class AppsScriptMailTransport implements MailTransport {
  public readonly isSimulated = false;
  public readonly name = "apps_script";
  private endpointUrl: string;
  private secretToken: string;

  constructor(endpointUrl?: string, secretToken?: string) {
    this.endpointUrl = endpointUrl || process.env["REPORT_APPS_SCRIPT_URL"] || "";
    this.secretToken = secretToken || process.env["REPORT_TRIGGER_SECRET"] || "";
  }

  public async send(options: MailDeliveryOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.endpointUrl) {
      return {
        success: true,
        messageId: `sim_${Date.now().toString(36)}`,
      };
    }

    try {
      const response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretToken}`,
        },
        body: JSON.stringify({
          action: "dispatch_email",
          payload: options,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const json = (await response.json()) as { success?: boolean; messageId?: string; error?: string };
      const ret: { success: boolean; messageId?: string; error?: string } = {
        success: Boolean(json.success),
        messageId: json.messageId || `gas_${Date.now().toString(36)}`,
      };
      if (json.error !== undefined) {
        ret.error = json.error;
      }
      return ret;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/**
 * Resolves the active mail transport.
 * Rule: EMAIL_SIMULATION_MODE=true is ALWAYS the effective default in development,
 * preview, and production unless EMAIL_SIMULATION_MODE is explicitly set to "false".
 */
/**
 * Resend Transactional Mail Transport.
 * Direct REST API integration with https://api.resend.com/emails.
 * Server-only execution; API keys must never be exposed to the client.
 */
export class ResendMailTransport implements MailTransport {
  public readonly isSimulated = false;
  public readonly name = "resend";
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey?: string, defaultFrom?: string) {
    this.apiKey = (apiKey || process.env["RESEND_API_KEY"] || "").trim();
    this.defaultFrom = (
      defaultFrom ||
      process.env["EMAIL_FROM"] ||
      process.env["RESEND_FROM"] ||
      "GreenNext <onboarding@resend.dev>"
    ).trim();
  }

  public async send(options: MailDeliveryOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: "Resend configuration missing: RESEND_API_KEY environment variable is required for live email delivery.",
      };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const email of recipients) {
      if (!isValidEmailAddress(email)) {
        return {
          success: false,
          error: `Invalid recipient address syntax: ${email}`,
        };
      }
    }

    const from = (options.from || this.defaultFrom).trim();
    if (!from) {
      return {
        success: false,
        error: "Resend configuration missing: EMAIL_FROM (or options.from) is required.",
      };
    }

    const payload: Record<string, unknown> = {
      from,
      to: recipients,
      subject: options.subject,
      html: options.htmlBody,
      text: options.plainTextBody,
    };

    if (options.replyTo) {
      payload["reply_to"] = options.replyTo;
    }

    if (options.headers) {
      payload["headers"] = options.headers;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "GreenNext-MailController/1.0",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(responseText);
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        let errorMsg: string =
          resJson?.message ||
          resJson?.error ||
          `Resend API error (HTTP ${response.status}): ${responseText.slice(0, 200)}`;
        errorMsg = `Resend rejected the request (HTTP ${response.status}): ${errorMsg}`;
        if (response.status === 403 || /domain|verify|testing emails/i.test(errorMsg)) {
          errorMsg +=
            " | ACTION: verify the sender domain at https://resend.com/domains and set EMAIL_FROM to an address on that domain. " +
            "The onboarding@resend.dev sender can only deliver to the Resend account owner's own email.";
        } else if (response.status === 401) {
          errorMsg += " | ACTION: RESEND_API_KEY is invalid or revoked; create a new key in Resend.";
        }
        return {
          success: false,
          error: errorMsg,
        };
      }

      const rawId = resJson?.id ? String(resJson.id) : Date.now().toString(36);
      const messageId = rawId.startsWith("resend_") ? rawId : `resend_${rawId}`;

      return {
        success: true,
        messageId,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Network error dispatching to Resend: ${errorMsg}`,
      };
    }
  }
}

/**
 * Secret-free snapshot of the mail configuration, safe to log.
 * `warnings` lists misconfigurations that would silently prevent real delivery.
 */
export function describeMailConfig(): {
  mode: "simulated" | "resend" | "apps_script";
  simulationFlag: string;
  provider: string;
  hasResendKey: boolean;
  hasFrom: boolean;
  warnings: string[];
} {
  const simulationFlag = process.env["EMAIL_SIMULATION_MODE"] ?? "(unset)";
  const provider = (process.env["EMAIL_PROVIDER"] || "(unset)").toLowerCase().trim();
  const hasResendKey = Boolean((process.env["RESEND_API_KEY"] || "").trim());
  const hasFrom = Boolean((process.env["EMAIL_FROM"] || process.env["RESEND_FROM"] || "").trim());
  const transport = resolveMailTransport();
  const mode = transport.isSimulated
    ? "simulated"
    : (transport.name as "resend" | "apps_script") || "resend";
  const warnings: string[] = [];

  if (transport.isSimulated) {
    warnings.push(
      "SIMULATION ACTIVE: no real email will be sent. Set EMAIL_SIMULATION_MODE=false and EMAIL_PROVIDER=resend in the server environment.",
    );
  }
  if (!transport.isSimulated && provider === "resend") {
    if (!hasResendKey) warnings.push("RESEND_API_KEY is not set.");
    if (!hasFrom) {
      warnings.push(
        "EMAIL_FROM is not set: falling back to onboarding@resend.dev, which only delivers to the Resend account owner.",
      );
    }
  }
  if (!transport.isSimulated && provider !== "resend" && provider !== "apps_script") {
    warnings.push(`EMAIL_PROVIDER="${provider}" is not recognised.`);
  }
  return { mode, simulationFlag, provider, hasResendKey, hasFrom, warnings };
}

export function resolveMailTransport(): MailTransport {
  // Safe default: only if explicitly set to "false" do we check live providers
  const isSimulation = process.env["EMAIL_SIMULATION_MODE"] !== "false";

  if (isSimulation) {
    return new SimulatedMailTransport();
  }

  const provider = (process.env["EMAIL_PROVIDER"] || "simulated").toLowerCase().trim();

  if (provider === "resend") {
    return new ResendMailTransport();
  }

  if (provider === "apps_script" && process.env["REPORT_APPS_SCRIPT_URL"]) {
    return new AppsScriptMailTransport();
  }

  // Safe fallback if provider is unconfigured or unknown
  return new SimulatedMailTransport();
}

/**
 * In-memory Request Idempotency Tracker.
 * Architectural Boundary: Protects against fast duplicate retries and double-clicks
 * within the active server process. Non-durable across process restarts and distributed
 * serverless function cold instances.
 */
export class IdempotencyTracker {
  private static ledger = new Map<string, { messageId: string; timestamp: number }>();
  private static readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  public static check(requestId?: string): { isDuplicate: boolean; messageId?: string; timestamp?: number } {
    if (!requestId) return { isDuplicate: false };
    const existing = this.ledger.get(requestId);
    if (!existing) return { isDuplicate: false };
    if (Date.now() - existing.timestamp > this.TTL_MS) {
      this.ledger.delete(requestId);
      return { isDuplicate: false };
    }
    return { isDuplicate: true, messageId: existing.messageId, timestamp: existing.timestamp };
  }

  public static record(requestId: string, messageId: string): void {
    if (!requestId) return;
    this.ledger.set(requestId, { messageId, timestamp: Date.now() });
    if (this.ledger.size > 1000) {
      const oldestKey = this.ledger.keys().next().value;
      if (oldestKey) this.ledger.delete(oldestKey);
    }
  }

  public static clear(): void {
    this.ledger.clear();
  }
}

/**
 * In-memory Recipient Rate Limiter.
 * Prevents spam / mail-bombing abuse against arbitrary recipient addresses.
 * Max 3 emails per recipient per 10-minute window per process instance.
 */
export class RecipientRateLimiter {
  private static history = new Map<string, number[]>();
  private static readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_REQUESTS = 3;

  public static checkAndRecord(recipient: string): { allowed: boolean; remaining: number } {
    const key = recipient.toLowerCase().trim();
    const now = Date.now();
    const timestamps = (this.history.get(key) || []).filter((t) => now - t < this.WINDOW_MS);

    if (timestamps.length >= this.MAX_REQUESTS) {
      this.history.set(key, timestamps);
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    this.history.set(key, timestamps);
    return { allowed: true, remaining: this.MAX_REQUESTS - timestamps.length };
  }

  public static clear(): void {
    this.history.clear();
  }
}

/**
 * GreenNext Dedicated Mail Controller
 */
export class MailController implements SecurityNotifier {
  private transport: MailTransport;
  private alertCooldowns = new Map<string, number>();
  private readonly COOLDOWN_WINDOW_MS = 5 * 60 * 1000;

  constructor(transport?: MailTransport) {
    this.transport = transport || resolveMailTransport();
  }

  public get isSimulation(): boolean {
    return this.transport.isSimulated;
  }

  public get transportName(): string {
    return this.transport.name || (this.transport.isSimulated ? "simulated" : "unknown");
  }

  public async notify(alert: SecurityAlertEvent): Promise<{ accepted: boolean; messageId?: string }> {
    const cooldownKey = `${alert.severity}:${alert.component}`;
    const now = Date.now();
    const lastSent = this.alertCooldowns.get(cooldownKey);

    if (lastSent && now - lastSent < this.COOLDOWN_WINDOW_MS && alert.severity !== "LEVEL_1_BREACHED") {
      return { accepted: false, messageId: "rate_limited_duplicate" };
    }

    this.alertCooldowns.set(cooldownKey, now);

    const emailOptions = this.composeSecurityAlertEmail(alert);
    const result = await this.transport.send(emailOptions);

    const ret: { accepted: boolean; messageId?: string } = {
      accepted: result.success,
    };
    if (result.messageId !== undefined) {
      ret.messageId = result.messageId;
    }
    return ret;
  }

  public composeSecurityAlertEmail(alert: SecurityAlertEvent): MailDeliveryOptions {
    const severityColor =
      alert.severity === "LEVEL_1_BREACHED"
        ? "#EF4444"
        : alert.severity === "LEVEL_2_COMPROMISED"
        ? "#F97316"
        : alert.severity === "LEVEL_3_OPERATIONAL_DEVIATION"
        ? "#F59E0B"
        : "#3B82F6";

    const subject = `[GreenNext Security ${alert.severity}] Incident Alert: ${alert.component}`;

    const findingsHtml = alert.findings
      .map(
        (f) => `
        <div style="margin-bottom: 12px; padding: 12px; background: #0B0F17; border-left: 4px solid ${severityColor}; border-radius: 4px;">
          <strong style="color: #FFFFFF; font-size: 13px;">${f.title}</strong>
          <p style="color: #94A3B8; font-size: 12px; margin: 4px 0 8px 0;">${f.description}</p>
          <div style="color: #10B981; font-size: 11px; font-family: monospace;">
            <strong>Recommended Remediation:</strong> ${f.remediation}
          </div>
        </div>
      `,
      )
      .join("");

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070A0E; color: #FFFFFF; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #0E1522; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden;">
          <div style="background: #0B0F17; padding: 16px 24px; border-bottom: 1px solid #1E293B;">
            <h2 style="margin: 0; color: #FFFFFF; font-size: 16px;">GreenNext Security Operations Center (SOC)</h2>
            <span style="font-size: 11px; color: ${severityColor}; font-weight: bold; text-transform: uppercase;">
              ${alert.severity.replace(/_/g, " ")}
            </span>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #CBD5E1; margin-top: 0;">${alert.summary}</p>
            <div style="margin: 16px 0; font-size: 12px; color: #94A3B8;">
              <div><strong>Component:</strong> <span style="color: #FFFFFF;">${alert.component}</span></div>
              <div><strong>Timestamp:</strong> <span style="color: #FFFFFF;">${alert.timestamp}</span></div>
              <div><strong>Event ID:</strong> <span style="color: #FFFFFF; font-family: monospace;">${alert.eventId}</span></div>
            </div>
            <h3 style="font-size: 13px; color: #94A3B8; text-transform: uppercase; margin: 20px 0 10px 0;">Findings & Assessment</h3>
            ${findingsHtml}
          </div>
          <div style="background: #0B0F17; padding: 12px 24px; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B;">
            GreenNext Digital Infrastructure Initiative – Automated Security Dispatch
          </div>
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
[GreenNext Security Alert]
Severity: ${alert.severity}
Component: ${alert.component}
Event ID: ${alert.eventId}
Timestamp: ${alert.timestamp}

Summary: ${alert.summary}

Findings:
${alert.findings.map((f) => `- [${f.code}] ${f.title}\n  Description: ${f.description}\n  Remediation: ${f.remediation}`).join("\n\n")}
    `.trim();

    return {
      to: "security@greennext.internal",
      subject,
      htmlBody,
      plainTextBody,
    };
  }

  public async sendMail(options: MailDeliveryOptions): Promise<MailDispatchResult> {
    const res = await this.transport.send(options);
    const ret: MailDispatchResult = {
      success: res.success,
      messageId: res.messageId || `msg_${Date.now().toString(36)}`,
      dispatchedAt: new Date().toISOString(),
      simulated: this.transport.isSimulated,
    };
    if (res.error !== undefined) {
      ret.error = res.error;
    }
    return ret;
  }
}

export const defaultMailController = new MailController();
