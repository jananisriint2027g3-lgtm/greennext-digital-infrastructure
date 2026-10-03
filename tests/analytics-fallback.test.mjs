import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

let source = fs.readFileSync(new URL("../src/lib/analytics.ts", import.meta.url), "utf8");
source = source
  .replace('import { submitAirtableBehaviorEvent } from "./airtable-analytics.server-fn";\n', "const submitAirtableBehaviorEvent = () => {};\n")
  .replace('import { readClientContext } from "./layer2-intelligence";\n', "const readClientContext = () => ({});\n")
  .replace('import { recordActionEvent } from "./action-layer";\n', "const recordActionEvent = () => {};\n");

const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const adapter = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const waitForMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

test("non-OK analytics responses retry only the authoritative enrichment endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init.body, mode: init.mode });
    return new Response(null, { status: calls.length === 1 ? 502 : 204 });
  };
  try {
    adapter.sendAnalyticsBody(JSON.stringify({ eventId: "event-1", sessionId: "session-1" }));
    await waitForMicrotasks();
    await waitForMicrotasks();
    assert.equal(calls.length, 2);
    assert.deepEqual(calls.map((call) => call.url), ["/api/analytics", "/api/analytics"]);
    assert.equal(calls[0].mode, undefined);
    assert.equal(calls[0].body, calls[1].body);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("analytics network failure retries once without direct Apps Script fallback", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (calls.length === 1) throw new Error("network failure");
    return new Response(null, { status: 204 });
  };
  try {
    adapter.sendAnalyticsBody(JSON.stringify({ eventId: "event-2", sessionId: "session-2" }));
    await waitForMicrotasks();
    await waitForMicrotasks();
    assert.deepEqual(calls, ["/api/analytics", "/api/analytics"]);
    assert.equal(calls.some((url) => url.includes("script.google.com")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
