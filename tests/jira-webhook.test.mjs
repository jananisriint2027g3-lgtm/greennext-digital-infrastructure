import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  new URL("../src/lib/jira-webhook.server.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { handleJiraWebhookRequest, normalizeJiraWebhookPayload } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const secret = "test-only-jira-webhook-secret";

function payload(overrides = {}) {
  return {
    eventId: "jira-event-001",
    issue: {
      id: "10001",
      key: "DI-123",
      self: "https://example.atlassian.net/rest/api/3/issue/10001",
      fields: {
        status: { name: "Done" },
        summary: "Approved GreenNext launch",
        description: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Launch details" }] }],
        },
        labels: ["linkedin", "approved"],
        updated: "2026-10-26T12:00:00.000+0000",
        attachment: [{ id: "att-1", filename: "launch.png", mimeType: "image/png", size: 1234 }],
      },
    },
    ...overrides,
  };
}

function request(body, authorization = `Bearer ${secret}`) {
  return new Request("https://example.test/api/webhooks/jira", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function storeMock() {
  const keys = new Set();
  return {
    keys,
    async claim(key) {
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    },
  };
}

test("normalizes a Done JIRA event safely", () => {
  const result = normalizeJiraWebhookPayload(payload(), "2026-10-26T12:01:00.000Z");
  assert.ok(result.event);
  assert.equal(result.event.issueKey, "DI-123");
  assert.equal(result.event.status, "Done");
  assert.equal(result.event.description, "Launch details");
  assert.deepEqual(result.event.labels, ["linkedin", "approved"]);
  assert.deepEqual(result.event.attachments[0], {
    id: "att-1",
    fileName: "launch.png",
    mimeType: "image/png",
    sizeBytes: 1234,
  });
});

test("accepts an authenticated Done event and claims durable storage once", async () => {
  const store = storeMock();
  const response = await handleJiraWebhookRequest(
    request(payload()),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: "accepted", issueKey: "DI-123" });
  assert.equal(store.keys.size, 1);
});

test("rejects invalid authentication without parsing or storing the event", async () => {
  const store = storeMock();
  const response = await handleJiraWebhookRequest(
    request(payload(), "Bearer wrong"),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  assert.equal(response.status, 401);
  assert.equal(store.keys.size, 0);
});

test("rejects malformed JSON and malformed payloads", async () => {
  const malformedJson = await handleJiraWebhookRequest(
    new Request("https://example.test/api/webhooks/jira", {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: "{not-json",
    }),
    { JIRA_WEBHOOK_SECRET: secret },
    storeMock(),
  );
  assert.equal(malformedJson.status, 400);

  const malformedPayload = await handleJiraWebhookRequest(
    request({ issue: { key: "not-an-issue" } }),
    { JIRA_WEBHOOK_SECRET: secret },
    storeMock(),
  );
  assert.equal(malformedPayload.status, 400);
});

test("ignores transitions whose current status is not Done", async () => {
  const store = storeMock();
  const response = await handleJiraWebhookRequest(
    request({
      ...payload(),
      issue: {
        ...payload().issue,
        fields: { ...payload().issue.fields, status: { name: "In Progress" } },
      },
    }),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: "ignored", reason: "unsupported_status" });
  assert.equal(store.keys.size, 0);
});

test("ignores an explicit transition that does not target Done", async () => {
  const store = storeMock();
  const base = payload();
  const response = await handleJiraWebhookRequest(
    request({
      ...base,
      changelog: { items: [{ field: "status", fromString: "In Progress", toString: "Published" }] },
    }),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: "ignored", reason: "unsupported_status" });
  assert.equal(store.keys.size, 0);
});

test("does not accept duplicate deliveries", async () => {
  const store = storeMock();
  const first = await handleJiraWebhookRequest(
    request(payload()),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  const second = await handleJiraWebhookRequest(
    request(payload()),
    { JIRA_WEBHOOK_SECRET: secret },
    store,
  );
  assert.equal(first.status, 202);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), { status: "duplicate" });
  assert.equal(store.keys.size, 1);
});

test("fails closed when durable storage is unavailable", async () => {
  const unavailable = {
    claim: async () => {
      throw new Error("Redis unavailable");
    },
  };
  const response = await handleJiraWebhookRequest(
    request(payload()),
    { JIRA_WEBHOOK_SECRET: secret },
    unavailable,
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Webhook temporarily unavailable" });
});

test("fails closed when the webhook secret is not configured", async () => {
  const response = await handleJiraWebhookRequest(request(payload()), {}, storeMock());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Webhook is not configured" });
});
