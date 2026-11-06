/**
 * GreenNext Ebook Email Dispatcher (Server-Side)
 *
 * Dispatches Ebook OTP and Welcome emails through the Google Apps Script Web App endpoint.
 * Protects secrets (only executed server-side).
 * Records delivery results in the existing Raw Data 'Email_Log' tab.
 */

import { renderEbookOtpEmail } from "./email-templates/ebook-otp-template";
import { renderEbookWelcomeEmail } from "./email-templates/ebook-welcome-template";
import { renderEbookDownloadEmail } from "./email-templates/ebook-download-template";
import { resolveAppsScriptEmailConfig } from "./visitor-email-apps-script.server";

export interface EbookEmailResult {
  success: boolean;
  status: string;
  error?: string;
  deliveryRef?: string;
  simulated?: boolean;
}

/**
 * Dispatches a 6-digit numeric OTP to the reader via Apps Script.
 */
export async function sendEbookOtpEmail(
  name: string,
  email: string,
  otpCode: string,
): Promise<EbookEmailResult> {
  const { url, secret } = resolveAppsScriptEmailConfig();
  const rendered = renderEbookOtpEmail({
    recipientName: name,
    recipientEmail: email,
    otpCode,
  });

  // Ebook OTP delivery must never be reported as successful without a real
  // Apps Script endpoint and matching shared secret. This is intentionally
  // separate from simulation behavior used by unrelated report/analytics flows.
  if (!url || !secret) {
    return {
      success: false,
      status: "not_configured",
      error: "Ebook email delivery is not configured. Set the Apps Script URL and matching shared secret before sending verification codes.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ebook_dispatch_email",
        subAction: "otp",
        secret,
        email: email.trim(),
        name: name.trim(),
        otpCode,
        subject: rendered.subject,
        htmlBody: rendered.html,
        plainText: rendered.plainText,
        requestId: `gn_otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return { success: false, status: "failed", error: `Apps Script HTTP ${response.status}` };
    }

    const data = await response.json().catch(() => null);
    if (!data || !data.success) {
      return {
        success: false,
        status: data?.status || "failed",
        error: data?.error || data?.message || "Apps Script rejected OTP email dispatch",
      };
    }

    return {
      success: true,
      status: typeof data.status === "string" ? data.status : "sent",
      deliveryRef: data.deliveryRef,
    };
  } catch (err) {
    return {
      success: false,
      status: "network_error",
      error: err instanceof Error ? err.message : "Failed to reach Apps Script mail service",
    };
  }
}

/**
 * Dispatches the branded Ebook Welcome Email upon verified registration.
 * Ensures the welcome email is sent exactly once per reader.
 */
export async function sendEbookWelcomeEmail(
  name: string,
  email: string,
): Promise<EbookEmailResult> {
  const { url, secret } = resolveAppsScriptEmailConfig();
  const rendered = renderEbookWelcomeEmail({
    recipientName: name,
    recipientEmail: email,
  });

  if (!url || !secret) {
    if (process.env["NODE_ENV"] === "production") {
      return {
        success: false,
        status: "not_configured",
        error: "Ebook email delivery is not configured on the server. Set VISITOR_EMAIL_APPS_SCRIPT_URL (or REPORT_APPS_SCRIPT_URL) and the matching shared secret.",
      };
    }
    if (process.env["REPORT_TRIGGER_SIMULATION"] !== "true") {
      return {
        success: false,
        status: "not_configured",
        error: "Ebook email delivery is not configured. Set the Apps Script URL and shared secret, or explicitly enable local simulation.",
      };
    }
    return {
      success: true,
      status: "simulated_sent",
      simulated: true,
      deliveryRef: `sim_welcome_${Date.now()}`,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ebook_dispatch_email",
        subAction: "welcome",
        secret,
        email: email.trim(),
        name: name.trim(),
        subject: rendered.subject,
        htmlBody: rendered.html,
        plainText: rendered.plainText,
        requestId: `gn_wel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return { success: false, status: "failed", error: `Apps Script HTTP ${response.status}` };
    }

    const data = await response.json().catch(() => null);
    if (!data || !data.success) {
      return {
        success: false,
        status: data?.status || "failed",
        error: data?.error || data?.message || "Apps Script rejected Welcome email dispatch",
      };
    }

    return {
      success: true,
      status: typeof data.status === "string" ? data.status : "sent",
      deliveryRef: data.deliveryRef,
    };
  } catch (err) {
    return {
      success: false,
      status: "network_error",
      error: err instanceof Error ? err.message : "Failed to reach Apps Script mail service",
    };
  }
}

/** Dispatches the protected PDF download confirmation after a successful download request. */
export async function sendEbookDownloadConfirmationEmail(
  name: string,
  email: string,
): Promise<EbookEmailResult> {
  const { url, secret } = resolveAppsScriptEmailConfig();
  const rendered = renderEbookDownloadEmail({ recipientName: name, recipientEmail: email });

  if (!url || !secret) {
    return {
      success: false,
      status: "not_configured",
      error: "Ebook download confirmation email is not configured on the server.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ebook_dispatch_email",
        subAction: "download",
        secret,
        email: email.trim(),
        name: name.trim(),
        subject: rendered.subject,
        htmlBody: rendered.html,
        plainText: rendered.plainText,
        requestId: `gn_dwl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) return { success: false, status: "failed", error: `Apps Script HTTP ${response.status}` };
    const data = await response.json().catch(() => null);
    if (!data || !data.success) {
      return { success: false, status: data?.status || "failed", error: data?.error || data?.message || "Apps Script rejected download confirmation dispatch" };
    }
    return {
      success: true,
      status: typeof data.status === "string" ? data.status : "sent",
      deliveryRef: data.deliveryRef,
    };
  } catch (err) {
    return { success: false, status: "network_error", error: err instanceof Error ? err.message : "Failed to reach Apps Script mail service" };
  }
}

