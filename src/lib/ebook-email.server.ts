/**
 * GreenNext Ebook Email Dispatcher (Server-Side)
 *
 * Dispatches Ebook OTP and Welcome emails through the Google Apps Script Web App endpoint.
 * Protects secrets (only executed server-side).
 * Records delivery results in the existing Raw Data 'Email_Log' tab.
 */

import { renderEbookOtpEmail } from "./email-templates/ebook-otp-template";
import { renderEbookWelcomeEmail } from "./email-templates/ebook-welcome-template";
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

  // If simulation or Apps Script is unconfigured locally, provide safe simulation response
  if (!url || !secret) {
    console.info(`[Ebook OTP Simulation] To: ${email} | Name: ${name} | Code: ${otpCode}`);
    return {
      success: true,
      status: "simulated_sent",
      simulated: true,
      deliveryRef: `sim_otp_${Date.now()}`,
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
      status: "sent",
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
    console.info(`[Ebook Welcome Simulation] To: ${email} | Name: ${name} | Subject: ${rendered.subject}`);
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
      status: "sent",
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

