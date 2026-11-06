import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  ANALYTICS_ENRICHMENT_PATH,
  handleAnalyticsRequest,
} from "./lib/analytics-enrichment.server";
import {
  CRON_DAILY_ANALYSIS_PATH,
  handleCronDailyAnalysisRequest,
} from "./lib/cron-handler.server";
import { JIRA_WEBHOOK_PATH, handleJiraWebhookRequest } from "./lib/jira-webhook.server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { handleLinkedInApprovalRequest } from "./lib/linkedin-approval.server";
import { handleReportCronRequest, isReportCronPath } from "./lib/report-trigger.server";
import { fetchPrivateEbookPdf } from "./lib/ebook-drive.server";
import { logEbookActivity, syncEbookUser } from "./lib/ebook-sheets.server";
import {
  firebaseLoginEmail,
  firebaseRegisterEmail,
  firebaseLoginWithGoogleIdToken,
  serverMarkEmailVerified,
} from "./lib/firebase-auth";
import { generateEbookOtp, verifyEbookOtp } from "./lib/otp.server";
import { sendEbookOtpEmail, sendEbookWelcomeEmail } from "./lib/ebook-email.server";
import {
  createEbookSessionEnvelope,
  isEbookSessionEnvelopeFresh,
} from "./lib/ebook-session";

interface EbookSessionUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  providerId: string;
}

/** Safe user object stripped of any sensitive tokens for JSON responses */
function sanitizeUserForResponse(user: EbookSessionUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    providerId: user.providerId,
  };
}

function getEbookSessionSecret(): string {
  const secret =
    process.env["SESSION_SECRET"] ||
    process.env["REPORT_TRIGGER_SECRET"] ||
    process.env["OTP_SECRET_SALT"];
  if (!secret && process.env["NODE_ENV"] === "production") {
    // Fail closed in production — refuse to sign cookies without a configured secret
    throw new Error("[EbookSession] SESSION_SECRET or REPORT_TRIGGER_SECRET must be configured in production.");
  }
  // Development fallback — clearly insecure, only used when NODE_ENV !== production
  return secret || "dev_only_insecure_session_secret_do_not_use_in_prod";
}

/**
 * Determines whether development-only ebook preview is active.
 *
 * Strict security constraints:
 * - NEVER active when NODE_ENV === "production"
 * - NEVER active on Vercel deployments (VERCEL === "1", VERCEL_ENV === "production" | "preview")
 * - Active only in local development mode
 */
function isEbookDevPreview(): boolean {
  if (process.env["NODE_ENV"] === "production") return false;
  if (
    process.env["VERCEL"] === "1" ||
    process.env["VERCEL_ENV"] === "production" ||
    process.env["VERCEL_ENV"] === "preview"
  ) {
    return false;
  }
  return true;
}

function signEbookSessionPayload(payloadObj: unknown): string {
  const jsonStr = JSON.stringify(payloadObj);
  const b64 = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const hmac = createHmac("sha256", getEbookSessionSecret()).update(b64).digest("hex");
  return `${b64}.${hmac}`;
}

function createEbookSessionCookie(user: EbookSessionUser, now = Date.now()): string {
  const tokenPayload = signEbookSessionPayload(createEbookSessionEnvelope(user, now));
  const isProd = process.env["NODE_ENV"] === "production";
  return `__gn_ebook_session=${encodeURIComponent(tokenPayload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${isProd ? "; Secure" : ""}`;
}

function verifyEbookSessionToken(rawToken: string): string | null {
  const dotIdx = rawToken.lastIndexOf(".");
  if (dotIdx === -1) return null;

  const b64 = rawToken.slice(0, dotIdx);
  const signature = rawToken.slice(dotIdx + 1);
  if (!b64 || !signature) return null;

  let expectedHmac: string;
  try {
    expectedHmac = createHmac("sha256", getEbookSessionSecret()).update(b64).digest("hex");
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expectedHmac, "hex");
  if (sigBuf.length === 0 || sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return b64;
}

function isExpiredEbookSession(request: Request): boolean {
  const match = (request.headers.get("cookie") || "").match(/__gn_ebook_session=([^;]+)/);
  if (!match) return false;
  const encodedToken = match[1];
  if (!encodedToken) return false;
  try {
    const rawToken = decodeURIComponent(encodedToken);
    const b64 = verifyEbookSessionToken(rawToken);
    if (!b64) return false;
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    return !isEbookSessionEnvelopeFresh(payload);
  } catch {
    return false;
  }
}

function extractVerifiedEbookSession(request: Request): EbookSessionUser | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/__gn_ebook_session=([^;]+)/);
  if (!match) return null;
  const encodedToken = match[1];
  if (!encodedToken) return null;

  const rawToken = decodeURIComponent(encodedToken);
  const b64 = verifyEbookSessionToken(rawToken);
  if (!b64) return null;

  try {
    const envelope = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    if (!isEbookSessionEnvelopeFresh(envelope)) return null;
    return envelope.user as EbookSessionUser;
  } catch {
    return null;
  }
}

/** Validates that a string field is present and within a maximum byte length */
function requireString(value: unknown, maxLen = 512): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isCsrfOriginValid(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const reqHost = new URL(request.url).host.toLowerCase();
      if (originHost === reqHost) return true;
      const siteUrl = process.env["SITE_URL"];
      if (siteUrl && new URL(siteUrl).host.toLowerCase() === originHost) return true;
      return false;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refHost = new URL(referer).host.toLowerCase();
      const reqHost = new URL(request.url).host.toLowerCase();
      if (refHost === reqHost) return true;
      const siteUrl = process.env["SITE_URL"];
      if (siteUrl && new URL(siteUrl).host.toLowerCase() === refHost) return true;
      return false;
    } catch {
      return false;
    }
  }
  return true;
}

const _ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkIpRateLimit(request: Request, maxRequests = 30, windowMs = 60000): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  const now = Date.now();
  const entry = _ipRateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    _ipRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

async function handleEbookAuthApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!isCsrfOriginValid(request)) {
    return jsonError("Cross-origin request rejected.", 403);
  }

  if (request.method === "POST" && !checkIpRateLimit(request)) {
    return jsonError("Too many authentication requests from this IP. Please wait a moment.", 429);
  }

  // ── GET /api/ebook/session ──────────────────────────────────────────────────
  if (pathname === "/api/ebook/session" && request.method === "GET") {
    const user = extractVerifiedEbookSession(request);
    if (!user) {
      if (!isEbookDevPreview() && isExpiredEbookSession(request)) {
        return new Response(JSON.stringify({ authenticated: false, user: null, emailVerified: false, ebookAccess: false, sessionExpired: true }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (isEbookDevPreview()) {
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              uid: "local-dev-preview-reader",
              email: "developer.preview@greennext.local",
              displayName: "Local Preview (Dev)",
              emailVerified: true,
              providerId: "local-preview",
            },
            emailVerified: true,
            ebookAccess: true,
            isDevPreview: true,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ authenticated: false, user: null, emailVerified: false, ebookAccess: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      authenticated: true,
      user: sanitizeUserForResponse(user),
      emailVerified: Boolean(user.emailVerified),
      ebookAccess: Boolean(user.emailVerified),
      isDevPreview: false,
    }), { headers: { "Content-Type": "application/json", "Set-Cookie": createEbookSessionCookie(user) } });
  }

  // ── POST /api/ebook/login ───────────────────────────────────────────────────
  if (pathname === "/api/ebook/login" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = requireString(body.email, 254);
    const password = requireString(body.password, 256);
    if (!email || !password) return jsonError("Email and password are required.");

    const res = await firebaseLoginEmail(email, password);
    if (!res.success || !res.user) {
      void logEbookActivity({ uid: "anonymous", eventType: "login_failed", status: "FAILED", metadata: { email } });
      return jsonError(res.error || "Authentication failed.");
    }

    const sessionUser: EbookSessionUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || "",
      emailVerified: res.user.emailVerified,
      providerId: res.user.providerId,
    };
    void syncEbookUser({ uid: sessionUser.uid, email: sessionUser.email, name: sessionUser.displayName, authMethod: "password", emailVerified: sessionUser.emailVerified });
    void logEbookActivity({ uid: sessionUser.uid, eventType: "login_success", status: "SUCCESS" });
    const cookie = createEbookSessionCookie(sessionUser);
    return new Response(JSON.stringify({ success: true, user: sanitizeUserForResponse(sessionUser), emailVerified: sessionUser.emailVerified }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  }

  // ── POST /api/ebook/register ────────────────────────────────────────────────
  if (pathname === "/api/ebook/register" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const email = requireString(body.email, 254);
    const password = requireString(body.password, 256);
    const name = requireString(body.name, 128) || "Reader";
    if (!email || !password) return jsonError("Email and password are required.");

    const res = await firebaseRegisterEmail(email, password, name);
    if (!res.success || !res.user) {
      return jsonError(res.error || "Registration failed.");
    }

    const sessionUser: EbookSessionUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || name,
      emailVerified: false, // must remain false until OTP verified
      providerId: "password",
    };
    const cookie = createEbookSessionCookie(sessionUser);
    void syncEbookUser({ uid: sessionUser.uid, email: sessionUser.email, name, authMethod: "password", emailVerified: false });
    void logEbookActivity({ uid: sessionUser.uid, eventType: "register", status: "SUCCESS" });

    // Generate & dispatch OTP — keyed to Firebase UID + normalized email
    const otpRes = await generateEbookOtp(sessionUser.email, sessionUser.uid);
    if (!otpRes.success || !otpRes.code) {
      return new Response(JSON.stringify({ success: false, error: otpRes.error || "Could not create a verification code.", otpSent: false }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
      });
    }
    if (otpRes.code) {
      const emailRes = await sendEbookOtpEmail(name, sessionUser.email, otpRes.code);
      if (!emailRes.success) {
        void logEbookActivity({ uid: sessionUser.uid, eventType: "otp_sent", status: "FAILED", metadata: { status: emailRes.status } });
        return new Response(JSON.stringify({
          success: false,
          error: emailRes.error || "Your account was created, but the verification email could not be sent. Please sign in and try again.",
          otpSent: false,
        }), { status: 502, headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
      }
      void logEbookActivity({ uid: sessionUser.uid, eventType: "otp_sent", status: "SUCCESS", metadata: { status: emailRes.status } });
    }

    // Never include otpRes.code in the response body
    return new Response(JSON.stringify({ success: true, user: sanitizeUserForResponse(sessionUser), otpSent: otpRes.success }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  }

  // ── POST /api/ebook/login-google ────────────────────────────────────────────
  if (pathname === "/api/ebook/login-google" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const googleIdToken = requireString(body.googleIdToken, 4096);
    if (!googleIdToken) return jsonError("A Google identity token is required.");

    const res = await firebaseLoginWithGoogleIdToken(googleIdToken);
    if (!res.success || !res.user) {
      return jsonError(res.error || "Google authentication failed.");
    }

    // emailVerified comes from Firebase's trusted response, never hardcoded
    if (!res.user.emailVerified) {
      return jsonError("Google account email is not verified. Please verify your Google account first.", 403);
    }

    const sessionUser: EbookSessionUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || "",
      emailVerified: true,
      providerId: "google.com",
    };
    const syncRes = await syncEbookUser({ uid: sessionUser.uid, email: sessionUser.email, name: sessionUser.displayName, authMethod: "google", emailVerified: true });
    if (syncRes.isNew) {
      void sendEbookWelcomeEmail(sessionUser.displayName || "Reader", sessionUser.email);
      void syncEbookUser({ uid: sessionUser.uid, email: sessionUser.email, authMethod: "google", emailVerified: true, welcomeEmailSent: true });
    }
    void logEbookActivity({ uid: sessionUser.uid, eventType: "login_success", status: "SUCCESS", metadata: { method: "google" } });

    const cookie = createEbookSessionCookie(sessionUser);
    return new Response(JSON.stringify({ success: true, user: sanitizeUserForResponse(sessionUser), emailVerified: true }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  }

  // ── POST /api/ebook/request-otp ─────────────────────────────────────────────
  // OTP resend for unverified accounts. Email must match the authenticated session.
  if (pathname === "/api/ebook/request-otp" && request.method === "POST") {
    // Require an existing authenticated session — prevents OTP generation for arbitrary emails
    const currentUser = extractVerifiedEbookSession(request);
    if (!currentUser) {
      return jsonError("Authentication required to request a verification code.", 401);
    }
    // Ignore email from request body — always use the session-bound email
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = (typeof body.name === "string" ? body.name.trim() : "") || currentUser.displayName || "Reader";
    const sessionEmail = currentUser.email;

    const otpRes = await generateEbookOtp(sessionEmail, currentUser.uid);
    if (!otpRes.success) {
      return new Response(JSON.stringify({ success: false, error: otpRes.error, cooldownRemaining: otpRes.cooldownRemaining }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Set-Cookie": createEbookSessionCookie(currentUser) },
      });
    }
    if (otpRes.code) {
      const emailRes = await sendEbookOtpEmail(name, sessionEmail, otpRes.code);
      if (!emailRes.success) {
        void logEbookActivity({ uid: currentUser.uid, eventType: "otp_sent", status: "FAILED", metadata: { status: emailRes.status } });
        return new Response(JSON.stringify({ success: false, error: emailRes.error || "The verification email could not be sent. Please try again.", cooldownRemaining: 60 }), {
          status: 502,
          headers: { "Content-Type": "application/json", "Set-Cookie": createEbookSessionCookie(currentUser) },
        });
      }
      void logEbookActivity({ uid: currentUser.uid, eventType: "otp_sent", status: "SUCCESS", metadata: { status: emailRes.status } });
    }
    return new Response(JSON.stringify({ success: true, cooldownRemaining: 60 }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": createEbookSessionCookie(currentUser) },
    });
  }

  // ── POST /api/ebook/verify-otp ───────────────────────────────────────────────
  // OTP verification. Email and UID must come from the authenticated session — never from the request body.
  if (pathname === "/api/ebook/verify-otp" && request.method === "POST") {
    // Require an existing authenticated session
    const currentUser = extractVerifiedEbookSession(request);
    if (!currentUser) {
      return jsonError("Authentication required to verify a code.", 401);
    }
    if (currentUser.emailVerified) {
      return jsonError("Your email is already verified.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const otpCode = requireString(body.otpCode, 6);
    if (!otpCode) return jsonError("A 6-digit verification code is required.");

    // Always verify against the session-bound email and UID — not client-supplied values
    const sessionEmail = currentUser.email;
    const sessionUid = currentUser.uid;

    const verifyRes = await verifyEbookOtp(sessionEmail, otpCode);
    if (!verifyRes.success) {
      void logEbookActivity({ uid: sessionUid, eventType: "otp_failed", status: "FAILED", metadata: { status: verifyRes.status } });
      return new Response(JSON.stringify({ success: false, error: verifyRes.error, attemptsRemaining: verifyRes.attemptsRemaining }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Confirm that the OTP record was bound to this UID (prevents cross-account verification)
    if (verifyRes.uid && verifyRes.uid !== sessionUid) {
      void logEbookActivity({ uid: sessionUid, eventType: "otp_failed", status: "FAILED", metadata: { reason: "uid_mismatch" } });
      return jsonError("Verification failed. Please sign in again.", 403);
    }

    // Mark email verified in Firebase Authentication
    const markedInFirebase = await serverMarkEmailVerified(sessionUid);
    if (!markedInFirebase) {
      // Log but do not block — Firebase mark may fail if idToken expired
      console.warn(`[Ebook OTP] Firebase emailVerified mark failed for uid=${sessionUid}. Proceeding with session update.`);
    }

    const name = currentUser.displayName || "Reader";
    const updatedUser: EbookSessionUser = {
      uid: sessionUid,
      email: sessionEmail,
      displayName: name,
      emailVerified: true,
      providerId: "password",
    };

    void syncEbookUser({ uid: sessionUid, email: sessionEmail, name, authMethod: "password", emailVerified: true });
    void sendEbookWelcomeEmail(name, sessionEmail);
    void syncEbookUser({ uid: sessionUid, email: sessionEmail, authMethod: "password", emailVerified: true, welcomeEmailSent: true });
    void logEbookActivity({ uid: sessionUid, eventType: "otp_verified", status: "SUCCESS" });

    const cookie = createEbookSessionCookie(updatedUser);
    return new Response(JSON.stringify({ success: true, user: sanitizeUserForResponse(updatedUser), emailVerified: true }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  }

  // ── POST /api/ebook/logout ───────────────────────────────────────────────────
  if (pathname === "/api/ebook/logout" && request.method === "POST") {
    const currentUser = extractVerifiedEbookSession(request);
    if (currentUser) {
      void logEbookActivity({ uid: currentUser.uid, eventType: "logout", status: "SUCCESS" });
    }
    const cookie = `__gn_ebook_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}

async function handleEbookPdfRequest(request: Request, isDownload: boolean): Promise<Response> {
  const user = extractVerifiedEbookSession(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required to access the GreenNext Ebook." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user.emailVerified) {
    return new Response(JSON.stringify({ error: "Email verification required before accessing the GreenNext Ebook." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pdfRes = await fetchPrivateEbookPdf();
  if (!pdfRes.success || !pdfRes.streamBuffer) {
    return new Response(JSON.stringify({ error: pdfRes.error || "Ebook resource unavailable." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Audit activity asynchronously
  const auditUid = user?.uid || (isEbookDevPreview() ? "dev-preview-reader" : "anonymous");
  void logEbookActivity({
    uid: auditUid,
    eventType: isDownload ? "ebook_download" : "ebook_view",
    status: "SUCCESS",
    metadata: { source: pdfRes.source },
  });

  const disposition = isDownload
    ? 'attachment; filename="GreenNext_Ebook_Edition_2.0.pdf"'
    : 'inline; filename="GreenNext_Ebook_Edition_2.0.pdf"';

  return new Response(pdfRes.streamBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfRes.contentLength || pdfRes.streamBuffer.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "Pragma": "no-cache",
      ...(user ? { "Set-Cookie": createEbookSessionCookie(user) } : {}),
    },
  });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname === ANALYTICS_ENRICHMENT_PATH) {
        return await handleAnalyticsRequest(request, env);
      }
      if (pathname === CRON_DAILY_ANALYSIS_PATH) {
        return await handleCronDailyAnalysisRequest(request, env);
      }
      if (pathname === JIRA_WEBHOOK_PATH) {
        return await handleJiraWebhookRequest(request, env);
      }
      if (
        pathname.startsWith("/linkedin/approvals/") ||
        pathname.startsWith("/api/linkedin/proposals/")
      ) {
        return await handleLinkedInApprovalRequest(request, env);
      }
      if (isReportCronPath(pathname)) {
        return await handleReportCronRequest(request, env);
      }
      if (pathname === "/api/ebook/stream") {
        return await handleEbookPdfRequest(request, false);
      }
      if (pathname === "/api/ebook/download") {
        return await handleEbookPdfRequest(request, true);
      }
      if (pathname.startsWith("/api/ebook/")) {
        return await handleEbookAuthApiRequest(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
