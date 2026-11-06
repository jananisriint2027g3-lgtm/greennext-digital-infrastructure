/**
 * GreenNext Ebook Google Sheets Synchronization (Server-Side)
 *
 * Persists reader accounts to 'Ebook_Users' and reading telemetry to 'Ebook_Activity'.
 * Authenticates with Apps Script backend via server-side shared secret.
 */

import { resolveAppsScriptEmailConfig } from "./visitor-email-apps-script.server";

export interface EbookUserSyncInput {
  uid: string;
  email: string;
  name?: string;
  authMethod: "google" | "password";
  emailVerified: boolean;
  welcomeEmailSent?: boolean;
}

export interface EbookActivityLogInput {
  uid: string;
  eventType:
    | "register"
    | "login_success"
    | "login_failed"
    | "otp_sent"
    | "otp_verified"
    | "otp_failed"
    | "ebook_view"
    | "ebook_download"
    | "logout";
  status?: "SUCCESS" | "FAILED" | "RATE_LIMITED";
  metadata?: Record<string, unknown> | string;
}

export async function syncEbookUser(input: EbookUserSyncInput): Promise<{ success: boolean; isNew?: boolean; error?: string }> {
  const { url, secret } = resolveAppsScriptEmailConfig();
  if (!url || !secret) {
    // Graceful local dev fallback
    return { success: true, isNew: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ebook_sync_user",
        secret,
        uid: input.uid,
        email: input.email.trim(),
        name: input.name || "",
        authMethod: input.authMethod,
        emailVerified: input.emailVerified,
        welcomeEmailSent: Boolean(input.welcomeEmailSent),
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return { success: false, error: `Apps Script HTTP ${res.status}` };
    const data = await res.json().catch(() => null);
    return {
      success: data?.success === true,
      isNew: data?.isNew === true,
      error: data?.error,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Sync error" };
  }
}

export async function logEbookActivity(input: EbookActivityLogInput): Promise<{ success: boolean; error?: string }> {
  const { url, secret } = resolveAppsScriptEmailConfig();
  if (!url || !secret) {
    return { success: true };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ebook_log_activity",
        secret,
        uid: input.uid,
        eventType: input.eventType,
        status: input.status || "SUCCESS",
        metadata: input.metadata || {},
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return { success: false, error: `Apps Script HTTP ${res.status}` };
    const data = await res.json().catch(() => null);
    return { success: data?.success === true, error: data?.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Activity log error" };
  }
}

