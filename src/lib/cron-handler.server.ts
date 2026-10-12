/**
 * Cron Job / Scheduled Endpoint Handler: /api/cron/daily-analysis
 *
 * Secure endpoint invoked by Vercel Cron or an external scheduler once per day.
 * Protected by CRON_SECRET (Bearer <CRON_SECRET>).
 * Never exposes secrets in responses or logs. Returns appropriate status codes.
 */

import { runDailyWebsiteAnalysis } from "./daily-analysis.server";

export const CRON_DAILY_ANALYSIS_PATH = "/api/cron/daily-analysis";

type RuntimeEnv = Record<string, unknown>;

function runtimeSecret(env: unknown, name: string): string {
  const fromEnv = env && typeof env === "object" ? (env as RuntimeEnv)[name] : undefined;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  if (typeof process !== "undefined" && typeof process.env?.[name] === "string") {
    return process.env[name]!.trim();
  }
  return "";
}

/**
 * Handles incoming scheduled requests to /api/cron/daily-analysis.
 */
export async function handleCronDailyAnalysisRequest(
  request: Request,
  env?: unknown,
): Promise<Response> {
  // Only GET (Vercel standard) or POST are permitted
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Authorization Verification
  const cronSecret = runtimeSecret(env, "CRON_SECRET");

  if (!cronSecret) {
    // If CRON_SECRET is not configured on the server, reject with 503 Service Unavailable
    // and clear instructions, preventing public unauthenticated runs.
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

  // 2. Execute analysis workflow
  try {
    const result = await runDailyWebsiteAnalysis();

    return new Response(
      JSON.stringify({
        success: true,
        runId: result.runId,
        status: result.status,
        executedAt: result.executedAt,
        findingsCount: result.findings.length,
        jiraTicketsCreated: result.jiraTicketsCreated,
        summaryNote: result.summaryNote,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Scheduled daily analysis run encountered an error:", error);
    return new Response(
      JSON.stringify({
        error: "Analysis run failed",
        message: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
