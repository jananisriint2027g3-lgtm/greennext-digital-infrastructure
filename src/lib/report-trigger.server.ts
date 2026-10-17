/**
 * Vercel-to-Google-Apps-Script Scheduled Reporting Integration Handler
 *
 * Configured for Vercel Free / Hobby & Production Compatibility:
 *   - Primary Cron Endpoint: /api/cron/reports (scheduled once daily at 08:00 IST -> 02:30 UTC)
 *   - Total Vercel Crons: Exactly 2 (/api/cron/daily-analysis and /api/cron/reports)
 *   - Dynamic Scheduler: Evaluates Asia/Kolkata date to determine the single report due today:
 *       • 2nd of Month: "monthly"
 *       • Mondays (except 2nd): "weekly"
 *       • Other calendar days: "daily"
 *   - Execution Safety: Enforces an 8.5-second timeout window to prevent abrupt Vercel Hobby 10s terminations.
 *   - Duplicate Protection: 2-minute cooldown per frequency.
 *   - Strict Secrecy: Never exposes CRON_SECRET or REPORT_TRIGGER_SECRET in logs or responses.
 */

export type ReportFrequency = "daily" | "weekly" | "monthly";

export const CRON_REPORT_DISPATCH_PATH = "/api/cron/reports";
export const CRON_REPORT_DISPATCH_ALIAS_PATH = "/api/cron/reports/dispatch";
export const CRON_REPORT_DAILY_PATH = "/api/cron/reports/daily";
export const CRON_REPORT_WEEKLY_PATH = "/api/cron/reports/weekly";
export const CRON_REPORT_MONTHLY_PATH = "/api/cron/reports/monthly";

const VALID_FREQUENCIES: readonly ReportFrequency[] = ["daily", "weekly", "monthly"] as const;

// 8.5-second internal timeout to safely abort and return a clean 504 before Vercel Hobby's 10-second hard limit
const HOBBY_TIMEOUT_MS = 8500;

// In-memory cooldown debounce to prevent rapid duplicate bursts
const lastTriggerTimes = new Map<ReportFrequency, number>();
const TRIGGER_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

type RuntimeEnv = Record<string, unknown>;

function runtimeSecret(env: unknown, name: string): string {
  const fromEnv = env && typeof env === "object" ? (env as RuntimeEnv)[name] : undefined;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  if (typeof process !== "undefined" && typeof process.env?.[name] === "string") {
    return process.env[name]!.trim();
  }
  return "";
}

export function isReportCronPath(pathname: string): boolean {
  return (
    pathname === CRON_REPORT_DISPATCH_PATH ||
    pathname === CRON_REPORT_DISPATCH_ALIAS_PATH ||
    pathname === CRON_REPORT_DAILY_PATH ||
    pathname === CRON_REPORT_WEEKLY_PATH ||
    pathname === CRON_REPORT_MONTHLY_PATH
  );
}

/**
 * Resolves the single scheduled report due today based on Asia/Kolkata calendar:
 *   1. 2nd of month -> monthly
 *   2. Monday -> weekly
 *   3. All other days -> daily
 */
export function resolveScheduledReportType(date = new Date()): {
  frequency: ReportFrequency;
  reason: string;
  kolkataDate: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const dayOfMonth = parseInt(getPart("day"), 10);
  const weekday = getPart("weekday"); // e.g. "Mon", "Tue"
  const month = getPart("month");
  const year = getPart("year");
  const kolkataDate = `${year}-${month.padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")} (${weekday})`;

  // Priority 1: Monthly report on the 2nd of each month
  if (dayOfMonth === 2) {
    return {
      frequency: "monthly",
      reason: "Monthly report is due today (day 2 of the month)",
      kolkataDate,
    };
  }

  // Priority 2: Weekly report on Mondays
  if (weekday === "Mon") {
    return {
      frequency: "weekly",
      reason: "Weekly report is due today (Monday)",
      kolkataDate,
    };
  }

  // Priority 3: Daily report on all other days
  return {
    frequency: "daily",
    reason: "Daily report is due today (standard calendar day)",
    kolkataDate,
  };
}

function getExpectedAppsScriptFunction(frequency: ReportFrequency): string {
  switch (frequency) {
    case "daily":
      return "runDailyReportAndEmail";
    case "weekly":
      return "runWeeklyReportAndEmail";
    case "monthly":
      return "runMonthlyReportAndEmail";
  }
}

/**
 * Handles incoming scheduled or manual requests to trigger Google Apps Script reports.
 */
export async function handleReportCronRequest(
  request: Request,
  env?: unknown,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Verify Method (GET standard for Vercel Cron, POST allowed for manual calls)
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Identify Report Frequency:
  // If hitting a specific subpath (/daily, /weekly, /monthly) or passing ?type=..., use that.
  // Otherwise, calculate the single due report in Asia/Kolkata for the dispatcher route.
  let frequency: ReportFrequency | null = null;
  let scheduleReason = "Explicitly requested report type";
  let kolkataDateStr = "";

  if (pathname === CRON_REPORT_DAILY_PATH) frequency = "daily";
  else if (pathname === CRON_REPORT_WEEKLY_PATH) frequency = "weekly";
  else if (pathname === CRON_REPORT_MONTHLY_PATH) frequency = "monthly";

  const queryType = url.searchParams.get("type")?.toLowerCase().trim() as ReportFrequency | undefined;
  if (queryType && VALID_FREQUENCIES.includes(queryType)) {
    frequency = queryType;
  }

  if (!frequency) {
    // Dynamic single-dispatcher route: evaluate today's schedule in Asia/Kolkata
    const resolved = resolveScheduledReportType();
    frequency = resolved.frequency;
    scheduleReason = resolved.reason;
    kolkataDateStr = resolved.kolkataDate;
  }

  // 3. Authorization Verification (Vercel Cron Bearer Token)
  const cronSecret = runtimeSecret(env, "CRON_SECRET");

  if (!cronSecret) {
    return new Response(
      JSON.stringify({
        error: "CRON_SECRET is not configured on the server. Scheduled execution is disabled.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const authHeader = request.headers.get("authorization")?.trim() || "";
  const expectedBearer = `Bearer ${cronSecret}`;

  if (authHeader !== expectedBearer) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Action Detection & Duplicate Execution Protection (Debounce Window)
  const actionParam = url.searchParams.get("action")?.toLowerCase().trim() || "trigger_report";
  const isStatusCheck = actionParam === "status" || url.searchParams.get("status") === "true";

  const now = Date.now();
  const lastTriggered = lastTriggerTimes.get(frequency) || 0;
  const elapsed = now - lastTriggered;

  if (!isStatusCheck && elapsed < TRIGGER_COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((TRIGGER_COOLDOWN_MS - elapsed) / 1000);
    return new Response(
      JSON.stringify({
        success: false,
        skipped: true,
        reportType: frequency,
        message: `Execution skipped: duplicate ${frequency} run detected within cooldown window. Try again in ${retryAfterSec} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
        },
      },
    );
  }

  // 5. Determine Simulation / Dry-Run Mode
  const isSimulationParam =
    url.searchParams.get("dryRun") === "true" ||
    request.headers.get("x-dry-run") === "true";
  const isSimulationEnv =
    runtimeSecret(env, "REPORT_TRIGGER_SIMULATION").toLowerCase() === "true";
  const appsScriptUrl = runtimeSecret(env, "REPORT_APPS_SCRIPT_URL");
  const reportTriggerSecret = runtimeSecret(env, "REPORT_TRIGGER_SECRET");

  const isDryRun = isSimulationParam || isSimulationEnv || !appsScriptUrl;

  if (isDryRun) {
    if (!isStatusCheck) {
      lastTriggerTimes.set(frequency, now);
    }

    return new Response(
      JSON.stringify({
        success: true,
        simulated: true,
        status: isStatusCheck ? "simulated_status" : "accepted",
        delivered: false,
        reportType: frequency,
        scheduleReason,
        kolkataDate: kolkataDateStr || new Date().toISOString(),
        dispatchedFunction: getExpectedAppsScriptFunction(frequency),
        message: isStatusCheck
          ? "Safe simulation: Checked report status. No external Apps Script call made."
          : "Safe simulation successful: Verified authentication, schedule routing, and single-dispatcher logic. No external request, sheet mutation, or email dispatch was performed.",
        triggeredAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 6. Upstream Configuration Validation
  if (!reportTriggerSecret) {
    return new Response(
      JSON.stringify({
        error: "REPORT_TRIGGER_SECRET is not configured on the server. Remote dispatch is disabled.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 7. Dispatch Authenticated Request to Google Apps Script Web App
  try {
    const payload = {
      action: isStatusCheck ? "report_status" : "trigger_report",
      reportType: frequency,
      secret: reportTriggerSecret,
      source: "vercel_cron_dispatcher",
      timestamp: new Date().toISOString(),
    };

    // Use an 8.5-second timeout window to prevent unhandled 504 kills on Vercel Hobby (10s limit)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HOBBY_TIMEOUT_MS);

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8", // Standard Apps Script CORS-friendly payload
      },
      body: JSON.stringify(payload),
      redirect: "follow", // Follow Apps Script 302 Found redirects
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Upstream Google Apps Script service returned an error status.",
          statusCode: upstreamResponse.status,
          reportType: frequency,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    interface UpstreamReportResult {
      success?: boolean;
      status?: "accepted" | "already_completed" | "in_progress" | "delivered" | "failed" | string;
      delivered?: boolean;
      skipped?: boolean;
      message?: string;
      reportType?: ReportFrequency;
      dispatchedFunction?: string;
      acceptedAt?: string;
      completedAt?: string;
      completedTodayAt?: string;
      lastDeliveredAt?: string;
      lastError?: string;
      error?: string;
    }

    const upstreamResult = (await upstreamResponse.json().catch(() => null)) as UpstreamReportResult | null;

    if (!upstreamResult || typeof upstreamResult !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Malformed upstream response received from Google Apps Script.",
          reportType: frequency,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ── Status Inspection Response Handling ──
    if (isStatusCheck) {
      return new Response(
        JSON.stringify({
          success: upstreamResult.success !== false,
          status: upstreamResult.status || "unknown",
          delivered: upstreamResult.delivered === true,
          reportType: frequency,
          message: upstreamResult.message || `Status check completed for ${frequency} report.`,
          completedTodayAt: upstreamResult.completedTodayAt || upstreamResult.completedAt || null,
          lastDeliveredAt: upstreamResult.lastDeliveredAt || null,
          lastError: upstreamResult.lastError || null,
        }),
        {
          status: upstreamResult.success !== false ? 200 : 422,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ── Rejection Handling ──
    if (upstreamResult.success !== true) {
      return new Response(
        JSON.stringify({
          success: false,
          status: upstreamResult.status || "rejected",
          delivered: false,
          error: upstreamResult.message || upstreamResult.error || "Report trigger was rejected by Google Apps Script.",
          reportType: frequency,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ── Idempotent Duplicate Completion (Already completed & emailed today) ──
    if (upstreamResult.status === "already_completed") {
      return new Response(
        JSON.stringify({
          success: true,
          status: "already_completed",
          delivered: true,
          skipped: true,
          reportType: frequency,
          scheduleReason,
          dispatchedFunction: getExpectedAppsScriptFunction(frequency),
          message: upstreamResult.message || `Report ${frequency} was already completed and emailed today. Duplicate delivery prevented.`,
          completedAt: upstreamResult.completedAt || upstreamResult.completedTodayAt || upstreamResult.lastDeliveredAt,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ── Active In-Progress Execution ──
    if (upstreamResult.status === "in_progress") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "in_progress",
          delivered: false,
          skipped: true,
          reportType: frequency,
          scheduleReason,
          message: upstreamResult.message || `Report ${frequency} is currently in progress. Duplicate execution prevented.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    // ── Successful Asynchronous Acceptance or Confirmed Immediate Delivery ──
    lastTriggerTimes.set(frequency, now);

    const isDelivered = upstreamResult.delivered === true;
    const finalStatus = upstreamResult.status || (isDelivered ? "delivered" : "accepted");

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        delivered: isDelivered,
        reportType: frequency,
        scheduleReason,
        dispatchedFunction: getExpectedAppsScriptFunction(frequency),
        message: upstreamResult.message || (isDelivered
          ? `Report ${frequency} processed and emailed successfully.`
          : `Report ${frequency} trigger accepted for asynchronous processing.`),
        ...(isDelivered
          ? { deliveredAt: upstreamResult.lastDeliveredAt || new Date().toISOString() }
          : { acceptedAt: upstreamResult.acceptedAt || new Date().toISOString() }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const isTimeout =
      (error instanceof Error && error.name === "AbortError") ||
      (typeof error === "object" && error !== null && "name" in error && (error as { name?: string }).name === "AbortError");

    const statusCode = isTimeout ? 504 : 502;
    const cleanError = isTimeout
      ? `Upstream Google Apps Script execution exceeded Vercel Hobby synchronous limit (${HOBBY_TIMEOUT_MS / 1000}s). The execution was triggered, but completion could not be verified.`
      : "Report trigger dispatch failed due to an upstream connection error.";

    console.error("Scheduled report trigger encountered an error:", cleanError, isTimeout ? "(Timeout)" : "");

    return new Response(
      JSON.stringify({
        success: false,
        timeout: isTimeout,
        error: cleanError,
        reportType: frequency,
        scheduleReason,
        recommendation: isTimeout
          ? "For zero-timeout execution on Vercel Hobby, native Apps Script time-driven triggers (setupReportingTriggers) are the recommended primary scheduler."
          : undefined,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
