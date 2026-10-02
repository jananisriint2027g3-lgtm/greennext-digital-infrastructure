import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

let source = fs.readFileSync(new URL("../src/lib/analytics-enrichment.server.ts", import.meta.url), "utf8");
source = source.replace(
  'import { normalizeGeoEnrichment, normalizeNetworkEnrichment } from "./layer2-intelligence";\n',
  `const normalizeGeoEnrichment = (input) => {\n    const value = input && typeof input === "object" ? input : {};\n    const text = (value) => typeof value === "string" ? value.trim() : "";\n    return { country: text(value.country ?? value.country_code), region: text(value.region ?? value.region_name), city: text(value.city), confidence: typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1 ? String(value.confidence) : "", source: text(value.source ?? value.provider) };\n  };\n  const normalizeNetworkEnrichment = (input) => {\n    const value = input && typeof input === "object" ? input : {};\n    const text = (value) => typeof value === "string" ? value.trim() : "";\n    return { networkType: text(value.networkType ?? value.network_type), isp: text(value.isp), organization: text(value.organization ?? value.org), asn: text(value.asn), confidence: typeof value.confidence === "number" && value.confidence >= 0 && value.confidence <= 1 ? String(value.confidence) : "", source: text(value.source ?? value.provider) };\n  };\n`,
);
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

test("provider failure preserves the canonical payload and does not expose IP", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("provider timeout"); };
  try {
    const result = await adapter.enrichCanonicalAnalyticsPayload(basePayload, new Request("https://example.com/api/analytics", { method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10" } }), {
      GEO_PROVIDER_URL: "https://geo.example.test/lookup",
      GEO_PROVIDER_API_KEY: "secret-not-logged",
      NETWORK_PROVIDER_URL: "https://network.example.test/lookup",
      NETWORK_PROVIDER_API_KEY: "secret-not-logged",
    });
    assert.deepEqual(result, basePayload);
    assert.equal(JSON.stringify(result).includes("203.0.113.10"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("valid enrichment forwards canonical fields without raw IP", async () => {
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
    assert.equal(typeof enriched["enrichmentSignature"], "string");
    assert.equal(JSON.stringify(enriched).includes("203.0.113.10"), false);
    assert.deepEqual(calls.sort(), ["https://geo.example.test/lookup", "https://network.example.test/lookup"]);
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
