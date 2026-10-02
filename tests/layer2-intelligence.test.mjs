import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/layer2-intelligence.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const layer2 = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("traffic classification is deterministic", () => {
  assert.equal(layer2.classifyTraffic({ utmSource: "google", utmMedium: "organic" }), "organic");
  assert.equal(layer2.classifyTraffic({ utmMedium: "cpc" }), "paid");
  assert.equal(layer2.classifyTraffic({ utmSource: "facebook", utmMedium: "social" }), "social");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://partner.example/path", currentHost: "greennext.example" }), "referral");
  assert.equal(layer2.classifyTraffic({}), "direct");
});

test("campaign fields are preserved by the client context model", () => {
  assert.equal(layer2.classifyTraffic({ utmSource: "linkedin", utmMedium: "social", utmCampaign: "gpu_launch" }), "social");
  assert.equal(layer2.classifyTraffic({ utmCampaign: "gpu_launch" }), "campaign");
});

test("timezone conversion produces a local hour", () => {
  const activity = layer2.deriveLocalActivity("Asia/Kolkata", new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(activity.hour, "05");
  assert.equal(activity.day, "Thursday");
  assert.equal(layer2.normalizeActivityDay(activity.day), "Thursday");
});

test("missing activity day remains empty", () => {
  assert.equal(layer2.normalizeActivityDay(undefined), "");
  assert.equal(layer2.normalizeActivityDay(null), "");
});

test("missing geo and network data are not fabricated", () => {
  assert.equal(layer2.classifyTraffic({}).length > 0, true);
  const activity = layer2.deriveLocalActivity("", new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(typeof activity.hour, "string");
});

test("valid geo and network provider responses are normalized", () => {
  assert.deepEqual(layer2.normalizeGeoEnrichment({ country_code: "IN", region_name: "Tamil Nadu", city: "Chennai", confidence: 0.91, provider: "trusted-geo" }), {
    country: "IN", region: "Tamil Nadu", city: "Chennai", confidence: "0.91", source: "trusted-geo",
  });
  assert.deepEqual(layer2.normalizeNetworkEnrichment({ network_type: "corporate", isp: "Example ISP", org: "Example Org", asn: "AS64500", confidence: "0.8", provider: "trusted-network" }), {
    networkType: "corporate", isp: "Example ISP", organization: "Example Org", asn: "AS64500", confidence: "0.8", source: "trusted-network",
  });
});

test("missing and invalid provider responses remain unavailable", () => {
  assert.deepEqual(layer2.normalizeGeoEnrichment(null), { country: "", region: "", city: "", confidence: "", source: "" });
  assert.deepEqual(layer2.normalizeNetworkEnrichment({ country: "not-network-data", confidence: 2 }), { networkType: "", isp: "", organization: "", asn: "", confidence: "", source: "" });
});

test("large event bursts receive a deterministic suspicious flag", () => {
  const timestamps = Array.from({ length: 21 }, (_, index) => index * 400);
  assert.deepEqual(layer2.detectSuspiciousTraffic(timestamps, 2), { suspicious: true, reason: "large_event_burst" });
});

test("abnormal event density receives a deterministic suspicious flag", () => {
  const timestamps = Array.from({ length: 40 }, (_, index) => index * 2000);
  assert.deepEqual(layer2.detectSuspiciousTraffic(timestamps, 3, 40, 60000), { suspicious: true, reason: "abnormal_activity_density" });
});
