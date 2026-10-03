import { normalizeGeoEnrichment, normalizeNetworkEnrichment } from "./layer2-intelligence";

export const ANALYTICS_ENRICHMENT_PATH = "/api/analytics";
export const DEFAULT_APPS_SCRIPT_FORWARD_URL =
  "https://script.google.com/macros/s/AKfycbzP-MhwkC997UhXNzrORh9u3KQFw9Sf66RW9n4Ut7ZhK0HiFeRtjdX1tBRbM7pUIGsY/exec";

const PROVIDER_TIMEOUT_MS = 1500;
const PROVIDER_CACHE_TTL_MS = 5 * 60 * 1000;
const PROVIDER_CACHE_MAX_ENTRIES = 1000;
const PROVIDER_RATE_LIMIT = 60;
const PROVIDER_RATE_WINDOW_MS = 60 * 1000;

type RuntimeEnv = Record<string, unknown>;

export interface EnrichmentRuntimeConfig {
  appsScriptUrl: string;
  geoUrl: string;
  geoApiKey: string;
  networkUrl: string;
  networkApiKey: string;
  enrichmentSecret: string;
}

interface ProviderCacheEntry {
  expiresAt: number;
  value: Record<string, unknown>;
}

const providerCache = new Map<string, ProviderCacheEntry>();
const providerCalls = new Map<string, number[]>();

function runtimeValue(env: unknown, name: string): string {
  const fromEnv = env && typeof env === "object" ? (env as RuntimeEnv)[name] : undefined;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  if (typeof process !== "undefined" && typeof process.env?.[name] === "string") return process.env[name].trim();
  return "";
}

function httpsUrl(value: string, fallback = ""): string {
  try {
    const url = new URL(value || fallback);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function getEnrichmentRuntimeConfig(env?: unknown): EnrichmentRuntimeConfig {
  return {
    appsScriptUrl: httpsUrl(runtimeValue(env, "ANALYTICS_APPS_SCRIPT_URL"), DEFAULT_APPS_SCRIPT_FORWARD_URL),
    geoUrl: httpsUrl(runtimeValue(env, "GEO_PROVIDER_URL")),
    geoApiKey: runtimeValue(env, "GEO_PROVIDER_API_KEY"),
    networkUrl: httpsUrl(runtimeValue(env, "NETWORK_PROVIDER_URL")),
    networkApiKey: runtimeValue(env, "NETWORK_PROVIDER_API_KEY"),
    enrichmentSecret: runtimeValue(env, "ANALYTICS_ENRICHMENT_SECRET"),
  };
}

/** Only platform-controlled headers are accepted. Browser JSON fields are ignored. */
export function extractTrustedClientIp(headers: Headers | Record<string, string | undefined>): string {
  const get = (name: string) => headers instanceof Headers ? headers.get(name) || "" : headers[name] || "";
  // Cloudflare and Vercel headers are accepted only from their deployment
  // proxy context. Do not use browser JSON fields or an untrusted forwarded
  // header chain as an identity source.
  const cloudflareIp = get("cf-connecting-ip").trim();
  if (isPlausibleIp(cloudflareIp)) return cloudflareIp;

  const vercelIp = get("x-real-ip").trim();
  if (isPlausibleIp(vercelIp)) return vercelIp;

  const vercelRequest = Boolean(get("x-vercel-id").trim());
  const forwardedIp = get("x-forwarded-for").split(",")[0]?.trim() || "";
  return vercelRequest && isPlausibleIp(forwardedIp) ? forwardedIp : "";
}

function isPlausibleIp(value: string): boolean {
  if (!value || value.length > 45 || /[\s,]/.test(value)) return false;
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[0-9a-f:]+$/i.test(value);
}

export function normalizeTrustedGeo(value: unknown): ReturnType<typeof normalizeGeoEnrichment> {
  return normalizeGeoEnrichment(value);
}

export function normalizeTrustedNetwork(value: unknown): ReturnType<typeof normalizeNetworkEnrichment> {
  return normalizeNetworkEnrichment(value);
}

function cacheKey(provider: string, ip: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${provider}:${ip}`)).then((bytes) => {
    return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  });
}

function underRateLimit(provider: string): boolean {
  const now = Date.now();
  const calls = (providerCalls.get(provider) || []).filter((time) => now - time < PROVIDER_RATE_WINDOW_MS);
  if (calls.length >= PROVIDER_RATE_LIMIT) {
    providerCalls.set(provider, calls);
    return false;
  }
  calls.push(now);
  providerCalls.set(provider, calls);
  return true;
}

async function callProvider(provider: "geo" | "network", url: string, apiKey: string, ip: string): Promise<Record<string, unknown>> {
  if (!url || !apiKey || !ip || !underRateLimit(provider)) return {};
  const key = await cacheKey(provider, ip);
  const cached = providerCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip }),
      signal: controller.signal,
    });
    if (!response.ok) return {};
    const body: unknown = await response.json();
    const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
    if (providerCache.size >= PROVIDER_CACHE_MAX_ENTRIES) providerCache.delete(providerCache.keys().next().value as string);
    providerCache.set(key, { expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS, value });
    return value;
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

function canonicalEnrichmentMessage(payload: Record<string, unknown>): string {
  return [
    payload["eventId"] || "",
    payload["sessionId"] || "",
    payload["timestamp"] || "",
    payload["geoCountry"] || "",
    payload["geoRegion"] || "",
    payload["geoCity"] || "",
    payload["geoConfidence"] || "",
    payload["geoSource"] || "",
    payload["networkType"] || "",
    payload["isp"] || "",
    payload["organization"] || "",
    payload["asn"] || "",
    payload["networkConfidence"] || "",
    payload["networkSource"] || "",
  ].join("|");
}

async function signEnrichment(payload: Record<string, unknown>, secret: string): Promise<string> {
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonicalEnrichmentMessage(payload)));
  let binary = "";
  new Uint8Array(signature).forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export async function enrichCanonicalAnalyticsPayload(payload: Record<string, unknown>, request: Request, env?: unknown): Promise<Record<string, unknown>> {
  const config = getEnrichmentRuntimeConfig(env);
  const ip = extractTrustedClientIp(request.headers);
  if (!ip) return payload;

  // The raw IP is scoped to these transient provider calls only. It is never
  // returned, logged, cached, signed, or forwarded to Apps Script.
  const geoRaw = await callProvider("geo", config.geoUrl, config.geoApiKey, ip);
  // IPLocation.net returns both location and supported network fields. Reuse
  // that single response unless a separate network provider is configured.
  const networkRaw = config.networkUrl && config.networkApiKey
    ? await callProvider("network", config.networkUrl, config.networkApiKey, ip)
    : geoRaw;
  const geo = normalizeTrustedGeo(geoRaw);
  const network = normalizeTrustedNetwork(networkRaw);
  const enriched = { ...payload };
  if (geo.country || geo.region || geo.city) {
    enriched["geoCountry"] = geo.country;
    enriched["geoRegion"] = geo.region;
    enriched["geoCity"] = geo.city;
    enriched["geoConfidence"] = geo.confidence;
    enriched["geoSource"] = geo.source;
  }
  if (network.networkType || network.isp || network.organization || network.asn) {
    enriched["networkType"] = network.networkType;
    enriched["isp"] = network.isp;
    enriched["organization"] = network.organization;
    enriched["asn"] = network.asn;
    enriched["networkConfidence"] = network.confidence;
    enriched["networkSource"] = network.source;
  }
  if (config.enrichmentSecret && (geo.country || geo.region || geo.city || network.networkType || network.isp || network.organization || network.asn)) {
    enriched["enrichmentSignature"] = await signEnrichment(enriched, config.enrichmentSecret);
  }
  return enriched;
}

export async function forwardCanonicalAnalyticsEvent(payload: Record<string, unknown>, env?: unknown): Promise<Response> {
  const config = getEnrichmentRuntimeConfig(env);
  if (!config.appsScriptUrl) return new Response("Analytics forwarding is not configured.", { status: 503 });
  try {
    const response = await fetch(config.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const category = response.status >= 500 ? "upstream_server_error" :
        response.status >= 400 ? "upstream_client_error" : "upstream_non_success";
      console.warn("Analytics forwarding failed", {
        stage: "apps_script_forward",
        status: response.status,
        category,
      });
      return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    const errorName = error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name || "")
      : "";
    console.warn("Analytics forwarding failed", {
      stage: "apps_script_forward",
      category: errorName === "AbortError" ? "timeout" : "network_error",
    });
    throw error;
  }
}

export async function handleAnalyticsRequest(request: Request, env?: unknown): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 64 * 1024) return new Response("Payload too large", { status: 413 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return new Response("Invalid analytics payload", { status: 400 });
    const enriched = await enrichCanonicalAnalyticsPayload(body as Record<string, unknown>, request, env);
    return await forwardCanonicalAnalyticsEvent(enriched, env);
  } catch {
    // The client may safely retry/fallback; no provider or payload details are logged.
    return new Response("Analytics unavailable", { status: 503 });
  }
}
