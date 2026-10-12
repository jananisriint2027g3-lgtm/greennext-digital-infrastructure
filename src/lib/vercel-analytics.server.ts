/**
 * Vercel Web Analytics Adapter (Server-Side)
 *
 * Secure server-side client for fetching aggregate metrics from Vercel's Web Analytics API.
 * Never exposes tokens to client bundles. Gracefully handles missing credentials,
 * rate limits, or plan-level unavailability by returning explicit "unavailable" status.
 */

export interface VercelAnalyticsMetricSummary {
  status: "configured" | "unconfigured" | "unavailable";
  totalVisitors: number | null;
  totalPageviews: number | null;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ referrer: string; views: number }>;
  topCountries: Array<{ country: string; views: number }>;
  topDevices: Array<{ device: string; views: number }>;
  trend: Array<{ date: string; pageviews: number; visitors: number }>;
  dataQuality: "live" | "unavailable";
  reportingPeriod: { from: string; to: string };
  note: string;
}

export interface VercelApiCredentials {
  token: string;
  projectId: string;
  teamId?: string;
}

function getServerEnv(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key]?.trim();
}

export function getVercelAnalyticsCredentials(): VercelApiCredentials | null {
  const token = getServerEnv("VERCEL_API_TOKEN") || getServerEnv("VERCEL_TOKEN");
  const projectId = getServerEnv("VERCEL_PROJECT_ID");
  const teamId = getServerEnv("VERCEL_TEAM_ID");

  if (!token || !projectId) {
    return null;
  }

  return { token, projectId, ...(teamId ? { teamId } : {}) };
}

const VERCEL_API_BASE = "https://api.vercel.com/v1/query/web-analytics";

interface FetchParams {
  endpoint: string;
  since: number; // millisecond timestamp
  until: number; // millisecond timestamp
  by?: string;
  limit?: number;
}

async function callVercelAnalyticsApi<T>(
  creds: VercelApiCredentials,
  params: FetchParams,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const url = new URL(`${VERCEL_API_BASE}/${params.endpoint}`);
  url.searchParams.set("projectId", creds.projectId);
  if (creds.teamId) {
    url.searchParams.set("teamId", creds.teamId);
  }
  url.searchParams.set("since", String(params.since));
  url.searchParams.set("until", String(params.until));
  if (params.by) {
    url.searchParams.append("by", params.by);
  }
  if (params.limit) {
    url.searchParams.set("limit", String(params.limit));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        message: `Vercel API returned status ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Network error contacting Vercel API";
    return { ok: false, status: 0, message: msg };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Retrieves aggregate website analytics for a given time window (default: last 7 days).
 */
export async function fetchVercelAnalyticsMetrics(
  days = 7,
): Promise<VercelAnalyticsMetricSummary> {
  const creds = getVercelAnalyticsCredentials();
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const since = past.getTime();
  const until = now.getTime();
  const from = past.toISOString();
  const to = now.toISOString();

  if (!creds) {
    return {
      status: "unconfigured",
      totalVisitors: null,
      totalPageviews: null,
      topPages: [],
      topReferrers: [],
      topCountries: [],
      topDevices: [],
      trend: [],
      dataQuality: "unavailable",
      reportingPeriod: { from, to },
      note: "Vercel Web Analytics API credentials (VERCEL_API_TOKEN, VERCEL_PROJECT_ID) are not configured. Metrics remain unavailable until credentials are provided.",
    };
  }

  try {
    // 1. Fetch total visitors and page views: /visits/count returns { data: { pageviews: number, visitors: number } }
    const countRes = await callVercelAnalyticsApi<{
      data?: {
        pageviews?: number;
        visitors?: number;
        pageViews?: number;
      };
      pageviews?: number;
      visitors?: number;
    }>(creds, {
      endpoint: "visits/count",
      since,
      until,
    });

    if (!countRes.ok) {
      return {
        status: "unavailable",
        totalVisitors: null,
        totalPageviews: null,
        topPages: [],
        topReferrers: [],
        topCountries: [],
        topDevices: [],
        trend: [],
        dataQuality: "unavailable",
        reportingPeriod: { from, to },
        note: `Vercel Analytics API request failed (${countRes.status}). Web Analytics API may require Pro/Enterprise plan or updated scope.`,
      };
    }

    const totalVisitors =
      countRes.data?.data?.visitors ?? countRes.data?.visitors ?? null;
    const totalPageviews =
      countRes.data?.data?.pageviews ??
      countRes.data?.data?.pageViews ??
      countRes.data?.pageviews ??
      null;

    // 2. Fetch top pages by requestPath: /visits/aggregate?by=requestPath
    const pagesRes = await callVercelAnalyticsApi<{
      data?: Array<{
        requestPath?: string;
        route?: string;
        pageviews?: number;
        visitors?: number;
      }>;
    }>(creds, {
      endpoint: "visits/aggregate",
      since,
      until,
      by: "requestPath",
      limit: 10,
    });

    const topPages: Array<{ path: string; views: number }> = (pagesRes.ok && pagesRes.data?.data
      ? pagesRes.data.data.map((item) => ({
          path: item.requestPath || item.route || "/",
          views: item.pageviews || item.visitors || 0,
        }))
      : []
    ).filter((p) => p.views > 0);

    // 3. Fetch top referrers by referrerHostname: /visits/aggregate?by=referrerHostname
    const referrersRes = await callVercelAnalyticsApi<{
      data?: Array<{
        referrerHostname?: string;
        pageviews?: number;
        visitors?: number;
      }>;
    }>(creds, {
      endpoint: "visits/aggregate",
      since,
      until,
      by: "referrerHostname",
      limit: 10,
    });

    const topReferrers: Array<{ referrer: string; views: number }> = (referrersRes.ok && referrersRes.data?.data
      ? referrersRes.data.data.map((item) => ({
          referrer: item.referrerHostname || "Direct",
          views: item.pageviews || item.visitors || 0,
        }))
      : []
    ).filter((r) => r.views > 0);

    return {
      status: "configured",
      totalVisitors,
      totalPageviews,
      topPages,
      topReferrers,
      topCountries: [],
      topDevices: [],
      trend: [],
      dataQuality: "live",
      reportingPeriod: { from, to },
      note: "Live production measurements fetched securely via Vercel Web Analytics API.",
    };
  } catch (error) {
    return {
      status: "unavailable",
      totalVisitors: null,
      totalPageviews: null,
      topPages: [],
      topReferrers: [],
      topCountries: [],
      topDevices: [],
      trend: [],
      dataQuality: "unavailable",
      reportingPeriod: { from, to },
      note: `Unexpected error contacting Vercel Analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
