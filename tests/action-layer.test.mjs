import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/action-layer.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const actionLayer = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const values = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  },
};

const event = (overrides = {}) => ({
  event: "page_view",
  page: "/infrastructure/ai-ready",
  value: "/infrastructure/ai-ready",
  sourceTab: "CTA Interactions",
  sessionId: "session-1",
  sessionKind: "new_session",
  ...overrides,
});

test("new and returning visitors are distinguished without login", () => {
  values.clear();
  const first = actionLayer.recordActionEvent(event());
  assert.equal(first.sessionCount, 1);
  assert.equal(actionLayer.getVisitorActionContext("/", "session-1").returningVisitor, false);

  actionLayer.recordActionEvent(event({ sessionId: "session-2", sessionKind: "returning_session", page: "/automation/monitoring" }));
  assert.equal(actionLayer.getVisitorActionContext("/", "session-2").returningVisitor, true);
});

test("visitor profile captures recent pages, interests, CTA, and conversion state", () => {
  values.clear();
  actionLayer.recordActionEvent(event({ page: "/infrastructure/ai-ready" }));
  actionLayer.recordActionEvent(event({ page: "/automation/monitoring", event: "automation_view", value: "monitoring" }));
  actionLayer.recordActionEvent(event({ event: "cta_click", value: "technical_consultation" }));
  const profile = actionLayer.recordActionEvent(event({ event: "lead_conversion", value: "Technical Infrastructure Inquiry" }));
  assert.deepEqual(profile.recentPages.slice(0, 2), ["/infrastructure/ai-ready", "/automation/monitoring"]);
  assert.equal(profile.sectionVisits.infrastructure > 0, true);
  assert.equal(profile.sectionVisits.automation > 0, true);
  assert.equal(profile.meaningfulCtas.includes("cta_click"), false);
  assert.equal(profile.converted, true);
  assert.equal(profile.inquiryTypes.includes("Technical Infrastructure Inquiry"), true);
  assert.equal(actionLayer.getVisitorActionContext("/", "session-unknown").currentSessionEngaged, false);
  assert.equal(actionLayer.getVisitorActionContext("/", profile.lastSessionId).currentSessionEngaged, true);
});

test("recommendations and assistant context use stored behavior", () => {
  values.clear();
  actionLayer.recordActionEvent(event({ sessionId: "session-1", page: "/infrastructure/ai-ready" }));
  actionLayer.recordActionEvent(event({ sessionId: "session-2", page: "/automation/monitoring", sessionKind: "returning_session", event: "automation_interest", value: "monitoring" }));
  const recommendation = actionLayer.getPersonalizationRecommendation("/", "session-2");
  assert.equal(recommendation.show, true);
  assert.equal(recommendation.primaryHref.length > 1, true);
  const context = actionLayer.getAssistantVisitorContext("/", "session-2");
  assert.equal(context.returningVisitor, true);
  assert.equal(context.recentPages.includes("/automation/monitoring"), true);
  assert.equal(context.dominantInterest.length > 0, true);
});

test("assistant context is privacy-safe and excludes identity/provider data", () => {
  values.clear();
  actionLayer.recordActionEvent(event({ sessionId: "session-1", page: "/regions/overview" }));
  const context = actionLayer.getAssistantVisitorContext("/regions/overview", "session-1");
  assert.equal("visitorId" in context, false);
  assert.equal("ip" in context, false);
  assert.equal("geo_country" in context, false);
  assert.equal(JSON.stringify(context).includes("203.0.113"), false);
});

test("corrupted visitor state recovers safely", () => {
  values.set("gn_visitor_profile", "{not-json");
  const profile = actionLayer.getVisitorProfile();
  assert.equal(profile.sessionCount, 0);
  assert.equal(typeof profile.visitorId, "string");
});
