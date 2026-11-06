/**
 * GreenNext Ebook Session & Authentication Client & Server API
 *
 * Provides typed methods for:
 * - Session state retrieval
 * - Registration, Login, and Google Sign-In
 * - 6-Digit OTP request and verification
 * - Logout
 */

import { type FirebaseUserRecord } from "./firebase-auth";

export interface EbookSessionState {
  authenticated: boolean;
  user: FirebaseUserRecord | null;
  emailVerified: boolean;
  ebookAccess: boolean;
  isDevPreview?: boolean;
}

/**
 * Determines whether development-only ebook preview is active.
 *
 * Strict security constraints:
 * - NEVER active when NODE_ENV === "production"
 * - NEVER active on Vercel deployments (VERCEL === "1", VERCEL_ENV === "production" | "preview")
 * - Active only in local development mode (e.g. localhost / vite dev)
 */
export function isEbookDevPreview(): boolean {
  // 1. Strict production & Vercel guards (Node / SSR)
  if (typeof process !== "undefined" && process.env) {
    if (process.env["NODE_ENV"] === "production") return false;
    if (
      process.env["VERCEL"] === "1" ||
      process.env["VERCEL_ENV"] === "production" ||
      process.env["VERCEL_ENV"] === "preview"
    ) {
      return false;
    }
  }

  // 2. Vite client-side bundle guards
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.PROD) return false;
    if (import.meta.env.MODE === "production") return false;
    if (import.meta.env.DEV) return true;
  }

  // 3. Node environment fallback (development / test)
  if (typeof process !== "undefined" && process.env) {
    return process.env["NODE_ENV"] !== "production";
  }

  return false;
}

export const DEV_PREVIEW_USER: FirebaseUserRecord = {
  uid: "local-dev-preview-reader",
  email: "developer.preview@greennext.local",
  displayName: "Local Preview (Dev)",
  emailVerified: true,
  providerId: "local-dev-preview",
};

export const DEV_PREVIEW_SESSION: EbookSessionState = {
  authenticated: true,
  user: DEV_PREVIEW_USER,
  emailVerified: true,
  ebookAccess: true,
  isDevPreview: true,
};

export async function getEbookSession(): Promise<EbookSessionState> {
  try {
    const res = await fetch("/api/ebook/session", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as EbookSessionState;
      if (data && data.authenticated && data.user) {
        return data;
      }
    }
  } catch {
    // Network/fetch error (e.g. offline dev or client-side SSR hydration)
  }

  // Consistent fallback when in local development preview mode
  if (isEbookDevPreview()) {
    return DEV_PREVIEW_SESSION;
  }

  return { authenticated: false, user: null, emailVerified: false, ebookAccess: false, isDevPreview: false };
}

export async function loginEbookEmail(email: string, password: string): Promise<{ success: boolean; user?: FirebaseUserRecord; emailVerified?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/ebook/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Login failed" };
  }
}

export async function registerEbookEmail(email: string, password: string, name: string): Promise<{ success: boolean; user?: FirebaseUserRecord; error?: string; cooldownRemaining?: number }> {
  try {
    const res = await fetch("/api/ebook/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Registration failed" };
  }
}

export async function loginEbookGoogle(googleIdToken: string): Promise<{ success: boolean; user?: FirebaseUserRecord; error?: string }> {
  try {
    const res = await fetch("/api/ebook/login-google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleIdToken }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Google authentication failed" };
  }
}

export async function requestEbookOtp(): Promise<{ success: boolean; error?: string; cooldownRemaining?: number }> {
  try {
    const res = await fetch("/api/ebook/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to request code" };
  }
}

export async function verifyEbookOtp(otpCode: string): Promise<{ success: boolean; user?: FirebaseUserRecord; error?: string; attemptsRemaining?: number }> {
  try {
    const res = await fetch("/api/ebook/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otpCode }),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Verification error" };
  }
}

export async function logoutEbook(): Promise<{ success: boolean }> {
  try {
    const res = await fetch("/api/ebook/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { success: true };
  }
}
