import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/unified-intelligence.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const unified = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const baseSession = (overrides = {}) => ({
  session_id: "s1",
  session_type: "new_session",
  pages_count: 2,
  total_session_duration: 60000,
  engaged: true,
  bounce: false,
  total_events: 5,
  cta_interactions: 1,
  form_interactions: 1,
  lead_conversion: false,
  page_dwell_times: { "/": { active_time: 30000 } },
  ...overrides,
});

test("same session ID produces one unified record", () => {
  const records = unified.unifySessions([baseSession(), baseSession({ entry_page: "/about" })]);
  assert.equal(records.length, 1);
});

test("missing geo and network enrichment remains valid", () => {
  const [record] = unified.unifySessions([baseSession({ geo_country: "", network_type: "unavailable" })]);
  assert.equal(record.geo_country, "");
  assert.equal(record.network_type, "unavailable");
});

test("geo and timezone context remain joined at session level", () => {
  const [record] = unified.unifySessions([baseSession({
    geo_country: "IN",
    geo_region: "Tamil Nadu",
    geo_city: "Chennai",
    geo_source: "trusted-geo",
    timezone: "Asia/Kolkata",
    activity_day: "Thursday",
    activity_local_hour: "05",
  })]);
  assert.equal(record.geo_country, "IN");
  assert.equal(record.geo_source, "trusted-geo");
  assert.equal(record.timezone, "Asia/Kolkata");
  assert.equal(record.activity_day, "Thursday");
  assert.equal(record.activity_local_hour, "05");
});

test("network and traffic context aggregate together", () => {
  const records = unified.unifySessions([baseSession({ traffic_source: "referral", network_type: "corporate", isp: "Example ISP", asn: "AS64500", suspicious_traffic: true })]);
  const groups = unified.aggregateBy(records, (record) => `${record.network_type} / ${record.traffic_source}`);
  assert.equal(groups["corporate / referral"].sessions, 1);
  assert.equal(records[0].suspicious_traffic, true);
});

test("converted traffic aggregates correctly", () => {
  const records = unified.unifySessions([
    baseSession({ traffic_source: "paid", lead_conversion: true }),
    baseSession({ session_id: "s2", traffic_source: "paid", lead_conversion: false }),
  ]);
  const groups = unified.aggregateBy(records, (record) => record.traffic_source);
  assert.equal(groups.paid.sessions, 2);
  assert.equal(groups.paid.conversions, 1);
});

test("funnel-related behavior is represented", () => {
  const [record] = unified.unifySessions([baseSession({ lead_conversion: true })]);
  assert.equal(record.behavior_patterns.includes("cta_driven"), true);
  assert.equal(record.behavior_patterns.includes("form_driven"), true);
  assert.equal(record.behavior_patterns.includes("converted"), true);
  assert.equal(record.engagement_segment, "converted");
});

test("bounce and engagement segments remain consistent", () => {
  const [record] = unified.unifySessions([baseSession({ pages_count: 1, engaged: false, bounce: true, total_events: 1, cta_interactions: 0, form_interactions: 0 })]);
  assert.equal(record.engagement_segment, "low");
  assert.equal(record.behavior_patterns.includes("single_page"), true);
});

test("navigation paths can be grouped and zero denominators are safe", () => {
  const records = unified.unifySessions([baseSession({ navigation_flow: "/ → /about" }), baseSession({ session_id: "s2", navigation_flow: "/ → /about" })]);
  const paths = unified.aggregateBy(records, (record) => record.navigation_flow);
  assert.equal(paths["/ → /about"].sessions, 2);
  assert.equal(unified.conversionRate(0, 0), "N/A");
});
