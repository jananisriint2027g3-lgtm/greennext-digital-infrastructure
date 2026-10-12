/**
 * GreenNext Intelligence Schema Tests
 *
 * Tests for: event schema validation, engagement scoring,
 * propensity calculation, funnel building, attribution models,
 * and time-zone-aware intelligence layer metadata.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

// ─── Compile and load intelligence-schema.ts ─────────────────────────────────

const schemaSource = fs.readFileSync(
  new URL("../src/lib/intelligence-schema.ts", import.meta.url),
  "utf8"
);
const schemaCompiled = ts.transpileModule(schemaSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const schema = await import(
  `data:text/javascript;base64,${Buffer.from(schemaCompiled).toString("base64")}`
);

// ─── Event Validation ─────────────────────────────────────────────────────────

test("validateEvent rejects null, arrays, and non-objects", () => {
  assert.ok(schema.validateEvent(null).length > 0, "null should fail");
  assert.ok(schema.validateEvent([]).length > 0, "array should fail");
  assert.ok(schema.validateEvent("string").length > 0, "string should fail");
});

test("validateEvent rejects events missing required fields", () => {
  assert.ok(schema.validateEvent({}).length >= 4, "empty object should fail with multiple errors");
  assert.ok(
    schema.validateEvent({ eventId: "id", eventName: "page_view" }).length > 0,
    "missing timestamp and pagePath should fail"
  );
});

test("validateEvent accepts a minimal valid event", () => {
  const errors = schema.validateEvent({
    eventId: "evt_123",
    eventName: "page_view",
    timestamp: "2026-10-12T10:00:00.000Z",
    pagePath: "/",
    schemaVersion: "1.0.0",
  });
  assert.equal(errors.length, 0, `Expected no errors, got: ${errors.join(", ")}`);
});

test("validateEvent rejects malformed timestamps", () => {
  const errors = schema.validateEvent({
    eventId: "evt_123",
    eventName: "page_view",
    timestamp: "not-a-date",
    pagePath: "/",
    schemaVersion: "1.0.0",
  });
  assert.ok(errors.some((e) => e.includes("timestamp")), "should report timestamp error");
});

// ─── normalizeEvent ───────────────────────────────────────────────────────────

test("normalizeEvent maps legacy payload fields to schema fields", () => {
  const raw = {
    id: "evt_legacy",
    event: "page_view",
    timestamp: "2026-10-12T10:00:00.000Z",
    page: "/about",
    sessionId: "gn_s_abc",
    sessionKind: "returning_session",
    trafficSource: "organic",
    timezone: "Asia/Kolkata",
  };
  const normalized = schema.normalizeEvent(raw);
  assert.equal(normalized.eventId, "evt_legacy");
  assert.equal(normalized.eventName, "page_view");
  assert.equal(normalized.pagePath, "/about");
  assert.equal(normalized.sessionKind, "returning_session");
  assert.equal(normalized.trafficSource, "organic");
  assert.equal(normalized.timezone, "Asia/Kolkata");
});

test("normalizeEvent defaults pagePath to '/' when missing", () => {
  const normalized = schema.normalizeEvent({ eventId: "x", eventName: "test", timestamp: "2026-10-12T10:00:00.000Z" });
  assert.equal(normalized.pagePath, "/");
});

test("normalizeEvent enforces sessionKind enum", () => {
  assert.equal(schema.normalizeEvent({ sessionKind: "new_session" }).sessionKind, "new_session");
  assert.equal(schema.normalizeEvent({ sessionKind: "returning_session" }).sessionKind, "returning_session");
  assert.equal(schema.normalizeEvent({ sessionKind: "invalid_value" }).sessionKind, undefined);
});

// ─── INTELLIGENCE_LAYERS metadata ────────────────────────────────────────────

test("INTELLIGENCE_LAYERS contains exactly 13 layers", () => {
  assert.equal(schema.INTELLIGENCE_LAYERS.length, 13);
});

test("INTELLIGENCE_LAYERS layer numbers are 1–13 without gaps", () => {
  const numbers = schema.INTELLIGENCE_LAYERS.map((l) => l.layerNumber).sort((a, b) => a - b);
  for (let i = 0; i < 13; i++) {
    assert.equal(numbers[i], i + 1, `Layer ${i + 1} is missing`);
  }
});

test("INTELLIGENCE_LAYERS tiers are correctly distributed", () => {
  const foundational = schema.INTELLIGENCE_LAYERS.filter((l) => l.tier === "foundational");
  const behavioral = schema.INTELLIGENCE_LAYERS.filter((l) => l.tier === "behavioral");
  const strategic = schema.INTELLIGENCE_LAYERS.filter((l) => l.tier === "strategic");
  assert.equal(foundational.length, 5, "5 foundational layers (1–5)");
  assert.equal(behavioral.length, 5, "5 behavioral layers (6–10)");
  assert.equal(strategic.length, 3, "3 strategic layers (11–13)");
});

test("provider-required layers have providerName defined", () => {
  const providerLayers = schema.INTELLIGENCE_LAYERS.filter((l) => l.requiresProvider);
  assert.ok(providerLayers.length >= 2, "at least geo and ip layers need providers");
  providerLayers.forEach((layer) => {
    assert.ok(
      typeof layer.providerName === "string" && layer.providerName.length > 0,
      `Layer ${layer.id} needs providerName`
    );
  });
});

// ─── Engagement Scoring ───────────────────────────────────────────────────────

test("calculateEngagementScore returns 0 for empty events", () => {
  assert.equal(schema.calculateEngagementScore([]), 0);
});

test("calculateEngagementScore sums weights correctly", () => {
  const events = [
    { event: "page_view" },     // weight: 1
    { event: "scroll_50" },     // weight: 2
    { event: "form_open" },     // weight: 5
    { event: "lead_conversion" }, // weight: 30
  ];
  const score = schema.calculateEngagementScore(events);
  assert.equal(score, 38, "1 + 2 + 5 + 30 = 38");
});

test("calculateEngagementScore handles unknown event names with 0 weight", () => {
  const score = schema.calculateEngagementScore([{ event: "unknown_event_xyz" }]);
  assert.equal(score, 0);
});

test("engagement weights reward form submissions more than page views", () => {
  const submitScore = schema.ENGAGEMENT_WEIGHTS["form_submit"] ?? 0;
  const pageViewScore = schema.ENGAGEMENT_WEIGHTS["page_view"] ?? 0;
  assert.ok(submitScore > pageViewScore, "form_submit should be weighted higher than page_view");
});

// ─── Propensity Scoring ───────────────────────────────────────────────────────

test("calculatePropensity returns high band for converted visitor", () => {
  const result = schema.calculatePropensity({
    sessionCount: 1,
    converted: true,
    engagementScore: 0,
    pagesVisited: 1,
    hasFormInteraction: false,
    isReturning: false,
  });
  assert.equal(result.band, "high");
  assert.equal(result.score, 100);
  assert.ok(result.factors.includes("confirmed_conversion"));
  assert.equal(result.isSimulated, true);
});

test("calculatePropensity returns low band for new non-engaged visitor", () => {
  const result = schema.calculatePropensity({
    sessionCount: 1,
    converted: false,
    engagementScore: 0,
    pagesVisited: 1,
    hasFormInteraction: false,
    isReturning: false,
  });
  assert.equal(result.band, "low");
  assert.ok(result.score < 30);
});

test("calculatePropensity increases score for form interaction", () => {
  const without = schema.calculatePropensity({
    sessionCount: 1, converted: false, engagementScore: 0,
    pagesVisited: 1, hasFormInteraction: false, isReturning: false,
  });
  const with_ = schema.calculatePropensity({
    sessionCount: 1, converted: false, engagementScore: 0,
    pagesVisited: 1, hasFormInteraction: true, isReturning: false,
  });
  assert.ok(with_.score > without.score, "form interaction should increase propensity");
  assert.ok(with_.factors.includes("form_interaction"));
});

test("calculatePropensity caps score below 100 for non-converted visitors", () => {
  const result = schema.calculatePropensity({
    sessionCount: 10, converted: false, engagementScore: 100,
    pagesVisited: 20, hasFormInteraction: true, isReturning: true,
  });
  assert.ok(result.score < 100, "non-converted score should be < 100");
  assert.ok(result.score >= 60, "all positive signals should yield high band");
  assert.equal(result.band, "high");
});

test("calculatePropensity.isSimulated is always true", () => {
  const profiles = [
    { sessionCount: 1, converted: false, engagementScore: 0, pagesVisited: 1, hasFormInteraction: false, isReturning: false },
    { sessionCount: 5, converted: false, engagementScore: 50, pagesVisited: 10, hasFormInteraction: true, isReturning: true },
    { sessionCount: 1, converted: true, engagementScore: 30, pagesVisited: 3, hasFormInteraction: true, isReturning: false },
  ];
  profiles.forEach((p) => {
    assert.equal(schema.calculatePropensity(p).isSimulated, true);
  });
});

// ─── Schema Version ───────────────────────────────────────────────────────────

test("SCHEMA_VERSION is a valid semver string", () => {
  assert.match(schema.SCHEMA_VERSION, /^\d+\.\d+\.\d+$/);
});
