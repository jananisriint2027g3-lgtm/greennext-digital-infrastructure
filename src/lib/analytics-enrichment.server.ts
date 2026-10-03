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

interface ProviderResult {
  value: Record<string, unknown>;
  status: number | null;
  category: string;
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

function logProviderDiagnostic(
  provider: "geo" | "network",
  url: string,
  apiKey: string,
  status: number | null,
  value: Record<string, unknown>,
  errorCategory: string,
): void {
  const keys = Object.keys(value).slice(0, 32);
  const geoFields = ["country", "country_name", "country_code2", "country_code", "region", "region_name", "city", "city_name"];
  const networkFields = ["network_type", "networkType", "isp", "organization", "org", "as_name", "asn"];
  const hasResult = Object.prototype.hasOwnProperty.call(value, "result");
  const resultValue = value["result"];
  const resultObject = resultValue && typeof resultValue === "object" && !Array.isArray(resultValue)
    ? resultValue as Record<string, unknown>
    : {};
  const resultType = resultValue === null ? "null" : Array.isArray(resultValue) ? "array" : typeof resultValue;
  console.warn("Analytics enrichment provider diagnostic", {
    provider,
    providerConfigured: Boolean(url && apiKey),
    providerUrlConfigured: Boolean(url),
    providerHttpStatus: status,
    providerResponseIsObject: Object.keys(value).length > 0,
    providerResponseKeys: keys,
    providerHasResult: hasResult,
    providerResultType: resultType,
    providerResultKeys: Object.keys(resultObject).slice(0, 32),
    geoFieldsFound: geoFields.filter((field) => Object.prototype.hasOwnProperty.call(value, field)),
    networkFieldsFound: networkFields.filter((field) => Object.prototype.hasOwnProperty.call(value, field)),
    resultGeoFieldsFound: geoFields.filter((field) => Object.prototype.hasOwnProperty.call(resultObject, field)),
    resultNetworkFieldsFound: networkFields.filter((field) => Object.prototype.hasOwnProperty.call(resultObject, field)),
    errorCategory,
  });
}

async function callProvider(provider: "geo" | "network", url: string, apiKey: string, ip: string): Promise<ProviderResult> {
  if (!url || !apiKey) {
    logProviderDiagnostic(provider, url, apiKey, null, {}, "provider_not_configured");
    return { value: {}, status: null, category: "provider_not_configured" };
  }
  if (!ip) {
    logProviderDiagnostic(provider, url, apiKey, null, {}, "no_trusted_ip");
    return { value: {}, status: null, category: "no_trusted_ip" };
  }
  if (!underRateLimit(provider)) {
    logProviderDiagnostic(provider, url, apiKey, 429, {}, "provider_rate_limited");
    return { value: {}, status: 429, category: "provider_rate_limited" };
  }
  const key = await cacheKey(provider, ip);
  const cached = providerCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    logProviderDiagnostic(provider, url, apiKey, 200, cached.value, "provider_cache_hit");
    return { value: cached.value, status: 200, category: "provider_cache_hit" };
  }

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
    if (!response.ok) {
      const category = response.status === 401 || response.status === 403 ? "provider_auth_failed" :
        response.status === 429 ? "provider_rate_limited" :
        response.status >= 500 ? "provider_server_error" : "provider_bad_request";
      logProviderDiagnostic(provider, url, apiKey, response.status, {}, category);
      return { value: {}, status: response.status, category };
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      logProviderDiagnostic(provider, url, apiKey, response.status, {}, "provider_invalid_response");
      return { value: {}, status: response.status, category: "provider_invalid_response" };
    }
    const value = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    if (!Object.keys(value).length) {
      logProviderDiagnostic(provider, url, apiKey, response.status, value, "provider_invalid_response");
      return { value: {}, status: response.status, category: "provider_invalid_response" };
    }
    if (providerCache.size >= PROVIDER_CACHE_MAX_ENTRIES) providerCache.delete(providerCache.keys().next().value as string);
    providerCache.set(key, { expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS, value });
    logProviderDiagnostic(provider, url, apiKey, response.status, value, "provider_success");
    return { value, status: response.status, category: "provider_success" };
  } catch (error) {
    const errorName = error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name || "")
      : "";
    const category = errorName === "AbortError" ? "provider_timeout" : "provider_network_error";
    logProviderDiagnostic(provider, url, apiKey, null, {}, category);
    return { value: {}, status: null, category };
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
    payload["clientIp"] || "",
  ].join("|");
}

function unwrapProviderResult(value: Record<string, unknown>): Record<string, unknown> {
  const result = value["result"];
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  if (typeof result === "string") {
    try {
      const parsed: unknown = JSON.parse(result);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Preserve the root-level fallback for invalid serialized results.
    }
  }
  return value;
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

  // The raw IP is scoped to the trusted server-side enrichment flow. It is
  // never supplied by the browser, logged, or used as a cache value. When the
  // enrichment secret is configured, it is forwarded only as a signed field.
  const geoRaw = (await callProvider("geo", config.geoUrl, config.geoApiKey, ip)).value;
  // IPLocation.net returns both location and supported network fields. Reuse
  // that single response unless a separate network provider is configured.
  const networkRaw = config.networkUrl && config.networkApiKey
    ? (await callProvider("network", config.networkUrl, config.networkApiKey, ip)).value
    : geoRaw;
  const geoProviderData = unwrapProviderResult(geoRaw);
  const networkProviderData = unwrapProviderResult(networkRaw);
  const geo = normalizeTrustedGeo(geoProviderData);
  const network = normalizeTrustedNetwork(networkProviderData);
  const enriched = { ...payload };
  if (ip) enriched["clientIp"] = ip;
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
  if (config.enrichmentSecret && (ip || geo.country || geo.region || geo.city || network.networkType || network.isp || network.organization || network.asn)) {
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
