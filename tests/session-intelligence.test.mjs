import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/session-intelligence.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sessionModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const event = (sessionId, eventName, page, timestamp, value = "", extra = {}) => ({
  sessionId,
  event: eventName,
  page,
  timestamp,
  value,
  sourceTab: "CTA Interactions",
  ...extra,
});

test("single-page visit is a bounce", () => {
  const record = sessionModule.reconstructSession([event("s1", "page_view", "/", 1000)]);
  assert.equal(record.pages_count, 1);
  assert.equal(record.bounce, true);
});

test("multi-page journey preserves entry, exit, and flow", () => {
  const record = sessionModule.reconstructSession([
    event("s2", "page_view", "/", 1000),
    event("s2", "page_view", "/about", 2000),
    event("s2", "page_view", "/energy", 3000),
  ]);
  assert.deepEqual(record.pages_visited, ["/", "/about", "/energy"]);
  assert.equal(record.entry_page, "/");
  assert.equal(record.exit_page, "/energy");
  assert.equal(record.bounce, false);
});

test("single-page CTA is engaged and not an ordinary bounce", () => {
  const record = sessionModule.reconstructSession([
    event("s3", "page_view", "/", 1000),
    event("s3", "cta_click", "/", 2000, "contact", { sourceTab: "CTA Interactions" }),
  ]);
  assert.equal(record.engaged, true);
  assert.equal(record.bounce, false);
});

test("dwell uses reported active time rather than elapsed hidden time", () => {
  const record = sessionModule.reconstructSession([
    event("s4", "page_view", "/", 1000),
    event("s4", "time_on_page", "/", 11000, "10000"),
    event("s4", "time_on_page", "/", 31000, "5000"),
  ]);
  assert.equal(record.page_dwell_times["/"].active_time, 15000);
});

test("returning session classification is retained", () => {
  const record = sessionModule.reconstructSession([
    event("s5", "page_view", "/", 1000, "", { sessionKind: "returning_session" }),
  ]);
  assert.equal(record.session_type, "returning_session");
});
