import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

let source = fs.readFileSync(new URL("../src/lib/analytics-enrichment.server.ts", import.meta.url), "utf8");
source = source.replace(
  'import { normalizeGeoEnrichment, normalizeNetworkEnrichment } from "./layer2-intelligence";\n',
  `const normalizeGeoEnrichment = (input) => {\n    const value = input && typeof input === "object" ? input : {};\n    const text = (value) => typeof value === "string" ? value.trim() : "";\n    return { country: text(value.country ?? value.country_name ?? value.country_code), region: text(value.region ?? value.region_name), city: text(value.city ?? value.city_name), confidence: typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1 ? String(value.confidence) : "", source: text(value.source ?? value.provider) };\n  };\n  const normalizeNetworkEnrichment = (input) => {\n    const value = input && typeof input === "object" ? input : {};\n    const text = (value) => typeof value === "string" ? value.trim() : "";\n    return { networkType: text(value.networkType ?? value.network_type), isp: text(value.isp), organization: text(value.organization ?? value.org ?? value.as_name), asn: text(value.asn), confidence: typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1 ? String(value.confidence) : "", source: text(value.source ?? value.provider) };\n  };\n`,
);
source = source.replace("value.country ?? value.country_name ?? value.country_code", "value.country ?? value.country_name ?? value.country_code2 ?? value.country_code");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const adapter = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const basePayload = {
  eventId: "event_123456",
  sheet: "CTA Interactions",
  event: "page_view",
  value: "/",
  page: "/",
  sessionId: "session-1",
  sessionKind: "new_session",
  timestamp: "2026-10-02T00:00:00.000Z",
};

test("trusted Cloudflare IP extraction ignores browser-supplied alternatives", () => {
  assert.equal(adapter.extractTrustedClientIp(new Headers({ "CF-Connecting-IP": "203.0.113.10", "X-Forwarded-For": "198.51.100.10" })), "203.0.113.10");
  assert.equal(adapter.extractTrustedClientIp(new Headers({ "X-Forwarded-For": "198.51.100.10" })), "");
});

test("trusted Vercel proxy headers support server-side enrichment", () => {
  assert.equal(adapter.extractTrustedClientIp(new Headers({ "X-Real-IP": "203.0.113.11" })), "203.0.113.11");
  assert.equal(adapter.extractTrustedClientIp(new Headers({ "X-Vercel-ID": "iad1::test", "X-Forwarded-For": "203.0.113.12, 198.51.100.4" })), "203.0.113.12");
  assert.equal(adapter.extractTrustedClientIp(new Headers({ "X-Forwarded-For": "203.0.113.13" })), "");
});

test("valid and invalid provider responses normalize safely", () => {
  assert.deepEqual(adapter.normalizeTrustedGeo({ country_code: "IN", region_name: "Tamil Nadu", city: "Chennai", confidence: 0.9, provider: "geo-test" }), {
    country: "IN", region: "Tamil Nadu", city: "Chennai", confidence: "0.9", source: "geo-test",
  });
  assert.deepEqual(adapter.normalizeTrustedNetwork({ network_type: "corporate", isp: "ISP", org: "Org", asn: "AS64500", confidence: 0.8, provider: "network-test" }), {
    networkType: "corporate", isp: "ISP", organization: "Org", asn: "AS64500", confidence: "0.8", source: "network-test",
  });
  assert.equal(adapter.normalizeTrustedGeo({ country: 123 }).country, "");
  assert.equal(adapter.normalizeTrustedNetwork({ asn: 123 }).asn, "");
});

test("IPLocation-style field names normalize into trusted Geo and network fields", () => {
  const providerResponse = {
    country_name: "India",
    country_code2: "IN",
    region_name: "Tamil Nadu",
    city_name: "Chennai",
    as_name: "Example ISP",
    asn: "AS64500",
    network_type: "corporate",
    provider: "iplocation.net",
  };
  assert.equal(adapter.normalizeTrustedGeo(providerResponse).country, "India");
  assert.equal(adapter.normalizeTrustedGeo(providerResponse).region, "Tamil Nadu");
  assert.equal(adapter.normalizeTrustedGeo(providerResponse).city, "Chennai");
  assert.equal(adapter.normalizeTrustedNetwork(providerResponse).organization, "Example ISP");
  assert.equal(adapter.normalizeTrustedNetwork(providerResponse).asn, "AS64500");
  assert.equal(adapter.normalizeTrustedNetwork(providerResponse).networkType, "corporate");
});

test("provider failure preserves the canonical payload and keeps the server-derived IP", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("provider timeout"); };
  try {
    const result = await adapter.enrichCanonicalAnalyticsPayload(basePayload, new Request("https://example.com/api/analytics", { method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10" } }), {
      GEO_PROVIDER_URL: "https://geo.example.test/lookup",
      GEO_PROVIDER_API_KEY: "secret-not-logged",
      NETWORK_PROVIDER_URL: "https://network.example.test/lookup",
      NETWORK_PROVIDER_API_KEY: "secret-not-logged",
    });
    assert.deepEqual(result, { ...basePayload, clientIp: "203.0.113.10" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("valid enrichment forwards canonical fields with the server-derived IP", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(String(url).includes("geo")
      ? { country: "IN", region: "Tamil Nadu", city: "Chennai", confidence: 0.9, provider: "geo-test" }
      : { network_type: "corporate", isp: "ISP", organization: "Org", asn: "AS64500", confidence: 0.8, provider: "network-test" }), { status: 200 });
  };
  try {
    const enriched = await adapter.enrichCanonicalAnalyticsPayload(basePayload, new Request("https://example.com/api/analytics", { method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10" } }), {
      GEO_PROVIDER_URL: "https://geo.example.test/lookup",
      GEO_PROVIDER_API_KEY: "geo-key",
      NETWORK_PROVIDER_URL: "https://network.example.test/lookup",
      NETWORK_PROVIDER_API_KEY: "network-key",
      ANALYTICS_ENRICHMENT_SECRET: "shared-secret",
    });
    assert.equal(enriched["sessionId"], basePayload.sessionId);
    assert.equal(enriched["geoCountry"], "IN");
    assert.equal(enriched["networkType"], "corporate");
    assert.equal(enriched["clientIp"], "203.0.113.10");
    assert.equal(typeof enriched["enrichmentSignature"], "string");
    assert.equal(JSON.stringify(enriched).includes("203.0.113.10"), true);
    assert.deepEqual(calls.sort(), ["https://geo.example.test/lookup", "https://network.example.test/lookup"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IPLocation.net response supplies Geo and supported network fields with one lookup", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({
      country_name: "India",
      country_code2: "IN",
      region_name: "Tamil Nadu",
      city_name: "Chennai",
      as_name: "Example ISP",
      asn: "AS64500",
      network_type: "corporate",
      provider: "iplocation.net",
    }), { status: 200 });
  };
  try {
    const enriched = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.17" } }),
      {
        GEO_PROVIDER_URL: "https://api.iplocation.net/v2/ip-location",
        GEO_PROVIDER_API_KEY: "geo-key",
        ANALYTICS_ENRICHMENT_SECRET: "shared-secret",
      },
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.iplocation.net/v2/ip-location");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].init.headers.Authorization, "Bearer geo-key");
    assert.deepEqual(JSON.parse(calls[0].init.body), { ip: "203.0.113.17" });
    assert.equal(enriched.geoCountry, "India");
    assert.equal(enriched.geoRegion, "Tamil Nadu");
    assert.equal(enriched.geoCity, "Chennai");
    assert.equal(enriched.organization, "Example ISP");
    assert.equal(enriched.asn, "AS64500");
    assert.equal(enriched.networkType, "corporate");
    assert.equal(enriched.clientIp, "203.0.113.17");
    assert.equal(JSON.stringify(enriched).includes("203.0.113.17"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IPLocation result response is unwrapped before normalization", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    result: {
      country_name: "India",
      country_code2: "IN",
      region_name: "Tamil Nadu",
      city_name: "Chennai",
      isp: "Example ISP",
      asn: "AS64500",
      as_name: "Example ISP",
      network_type: "corporate",
    },
    response_code: "200",
    response_message: "Success",
  }), { status: 200 });
  try {
    const enriched = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.25" } }),
      { GEO_PROVIDER_URL: "https://api.iplocation.net/v2/ip-location", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.equal(enriched.clientIp, "203.0.113.25");
    assert.equal(enriched.geoCountry, "India");
    assert.equal(enriched.geoRegion, "Tamil Nadu");
    assert.equal(enriched.geoCity, "Chennai");
    assert.equal(enriched.networkType, "corporate");
    assert.equal(enriched.isp, "Example ISP");
    assert.equal(enriched.organization, "Example ISP");
    assert.equal(enriched.asn, "AS64500");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serialized IPLocation result response is parsed before normalization", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    result: JSON.stringify({
      country_name: "India",
      country_code2: "IN",
      region_name: "Tamil Nadu",
      city_name: "Chennai",
      isp: "Example ISP",
      asn: "AS64500",
      as_name: "Example ISP",
      network_type: "corporate",
    }),
    response_code: "200",
    response_message: "Success",
  }), { status: 200 });
  try {
    const enriched = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.28" } }),
      { GEO_PROVIDER_URL: "https://api.iplocation.net/v2/ip-location", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.equal(enriched.geoCountry, "India");
    assert.equal(enriched.geoRegion, "Tamil Nadu");
    assert.equal(enriched.geoCity, "Chennai");
    assert.equal(enriched.networkType, "corporate");
    assert.equal(enriched.organization, "Example ISP");
    assert.equal(enriched.asn, "AS64500");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid or missing provider result falls back safely", async () => {
  const originalFetch = globalThis.fetch;
  const responses = new Map([
    ["203.0.113.26", { result: null, country: "India", region: "Tamil Nadu" }],
    ["203.0.113.27", { response_code: "200", response_message: "No result" }],
  ]);
  globalThis.fetch = async (_url, init) => new Response(JSON.stringify(responses.get(JSON.parse(init.body).ip)), { status: 200 });
  try {
    const flatFallback = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.26" } }),
      { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.equal(flatFallback.geoCountry, "India");
    assert.equal(flatFallback.geoRegion, "Tamil Nadu");

    const missingResult = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.27" } }),
      { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.equal(missingResult.clientIp, "203.0.113.27");
    assert.equal("geoCountry" in missingResult, false);
    assert.equal("networkType" in missingResult, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("missing geo fields remain unavailable without fabricating location", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ country: "IN" }), { status: 200 });
  try {
    const enriched = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.14" } }),
      { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.equal(enriched.geoCountry, "IN");
    assert.equal(enriched.geoRegion, "");
    assert.equal(enriched.geoCity, "");
    assert.equal(enriched.clientIp, "203.0.113.14");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("provider HTTP errors preserve analytics and invalid responses stay empty", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("upstream failure", { status: 503 });
  try {
    const failed = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.15" } }),
      { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.deepEqual(failed, { ...basePayload, clientIp: "203.0.113.15" });

    globalThis.fetch = async () => new Response(JSON.stringify({ country: 123, region_name: {}, city: [] }), { status: 200 });
    const invalid = await adapter.enrichCanonicalAnalyticsPayload(
      basePayload,
      new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": "203.0.113.16" } }),
      { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
    );
    assert.deepEqual(invalid, { ...basePayload, clientIp: "203.0.113.16" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("provider auth, rate-limit, server, and malformed responses remain non-fatal", async () => {
  const originalFetch = globalThis.fetch;
  const responses = new Map([
    ["203.0.113.20", new Response("unauthorized", { status: 401 })],
    ["203.0.113.21", new Response("forbidden", { status: 403 })],
    ["203.0.113.22", new Response("rate limited", { status: 429 })],
    ["203.0.113.23", new Response("server failure", { status: 500 })],
    ["203.0.113.24", new Response("{malformed", { status: 200 })],
  ]);
  globalThis.fetch = async (_url, init) => {
    const request = JSON.parse(init.body);
    return responses.get(request.ip);
  };
  try {
    for (const ip of responses.keys()) {
      const result = await adapter.enrichCanonicalAnalyticsPayload(
        basePayload,
        new Request("https://example.com/api/analytics", { method: "POST", headers: { "X-Real-IP": ip } }),
        { GEO_PROVIDER_URL: "https://geo.example.test/lookup", GEO_PROVIDER_API_KEY: "geo-key" },
      );
      assert.deepEqual(result, { ...basePayload, clientIp: ip });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwarding preserves the canonical event and performs one forward", async () => {
  const originalFetch = globalThis.fetch;
  const forwarded = [];
  globalThis.fetch = async (_url, init) => {
    forwarded.push(JSON.parse(init.body));
    return new Response("ok", { status: 200 });
  };
  try {
    const response = await adapter.forwardCanonicalAnalyticsEvent(basePayload, { ANALYTICS_APPS_SCRIPT_URL: "https://script.google.com/macros/s/test/exec" });
    assert.equal(response.status, 204);
    assert.equal(forwarded.length, 1);
    assert.equal(forwarded[0].eventId, basePayload.eventId);
    assert.equal(forwarded[0].sessionId, basePayload.sessionId);
    assert.equal("ip" in forwarded[0], false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
