import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  new URL("../src/lib/linkedin-approval.server.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const approval = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const principal = { userId: "approver-1", role: "approver" };
const event = {
  eventId: "jira-event-approval-1",
  issueId: "10001",
  issueKey: "DI-123",
  status: "Done",
  summary: "Approved launch",
  description: "Launch details for the proposed post.",
  labels: ["linkedin", "approved"],
  attachments: [{ id: "a1", fileName: "launch.png", mimeType: "image/png", sizeBytes: 100 }],
  receivedAt: "2026-10-26T12:00:00.000Z",
};

function auth() {
  return async () => principal;
}

function getRequest(id, accept = "application/json") {
  return new Request(`https://example.test/api/linkedin/proposals/${id}`, {
    method: "GET",
    headers: { accept },
  });
}

function postRequest(id, action, contentType = "application/json", headers = {}) {
  const body = contentType.includes("json") ? JSON.stringify({ action }) : `action=${action}`;
  return new Request(`https://example.test/api/linkedin/proposals/${id}`, {
    method: "POST",
    headers: { "content-type": contentType, ...headers },
    body,
  });
}

test("creates durable proposal content and deduplicates the source event", async () => {
  const store = approval.createInMemoryProposalStore();
  const first = await store.createProposal(event, 3600);
  const second = await store.createProposal(event, 3600);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  assert.equal(first.proposal.id, second.proposal.id);
  assert.equal(first.proposal.status, "pending");
  assert.match(first.proposal.proposedText, /Approved launch/);
  assert.equal(first.proposal.jiraIssueKey, "DI-123");
});

test("requires authorization for preview access", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const response = await approval.handleLinkedInApprovalRequest(
    getRequest(created.proposal.id),
    {},
    store,
    async () => null,
  );
  assert.equal(response.status, 401);
});

test("requires both an allow-listed user ID and an allowed role", () => {
  const session = {
    userId: "approver-1",
    role: "approver",
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
  const env = {
    LINKEDIN_APPROVER_USER_IDS: "approver-1",
    LINKEDIN_APPROVER_ROLES: "approver,admin",
  };
  assert.deepEqual(approval.isAuthorizedApproverSession(session, env), principal);
  assert.equal(
    approval.isAuthorizedApproverSession({ ...session, userId: "other-user" }, env),
    null,
  );
  assert.equal(approval.isAuthorizedApproverSession({ ...session, role: "user" }, env), null);
  assert.equal(approval.isAuthorizedApproverSession(session, {}), null);
});

test("an authenticated but unprovisioned user cannot preview or act", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const env = {
    LINKEDIN_APPROVER_USER_IDS: "approver-1",
    LINKEDIN_APPROVER_ROLES: "approver,admin",
  };
  const unprovisionedAuth = async (_request, runtimeEnv) =>
    approval.isAuthorizedApproverSession(
      {
        userId: "unprovisioned-user",
        role: "approver",
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      },
      runtimeEnv,
    );
  const preview = await approval.handleLinkedInApprovalRequest(
    getRequest(created.proposal.id),
    env,
    store,
    unprovisionedAuth,
  );
  const action = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve"),
    env,
    store,
    unprovisionedAuth,
  );
  assert.equal(preview.status, 401);
  assert.equal(action.status, 401);
});

test("authorized preview contains proposal text, source issue, and attachment metadata", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const response = await approval.handleLinkedInApprovalRequest(
    new Request(`https://example.test/linkedin/approvals/${created.proposal.id}`, {
      method: "GET",
    }),
    {},
    store,
    auth(),
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /DI-123/);
  assert.match(html, /Approved launch/);
  assert.match(html, /launch\.png/);
  assert.match(html, /Approve/);
  assert.match(html, /Reject/);
});

test("approval records consent server-side and rejects replay", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const first = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve"),
    {},
    store,
    auth(),
  );
  const replay = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve"),
    {},
    store,
    auth(),
  );
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { status: "approved", proposalId: created.proposal.id });
  assert.equal(replay.status, 409);
});

test("concurrent approval requests allow only one state transition", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const responses = await Promise.all([
    approval.handleLinkedInApprovalRequest(
      postRequest(created.proposal.id, "approve"),
      {},
      store,
      auth(),
    ),
    approval.handleLinkedInApprovalRequest(
      postRequest(created.proposal.id, "approve"),
      {},
      store,
      auth(),
    ),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
});

test("rejection is explicit and a later opposite action is blocked", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const rejected = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "reject"),
    {},
    store,
    auth(),
  );
  const approveAfterReject = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve"),
    {},
    store,
    auth(),
  );
  assert.equal(rejected.status, 200);
  assert.deepEqual(await rejected.json(), { status: "rejected", proposalId: created.proposal.id });
  assert.equal(approveAfterReject.status, 409);
});

test("expired proposals cannot be previewed or approved", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, -1);
  const preview = await approval.handleLinkedInApprovalRequest(
    getRequest(created.proposal.id),
    {},
    store,
    auth(),
  );
  const approve = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve"),
    {},
    store,
    auth(),
  );
  assert.equal(preview.status, 410);
  assert.equal(approve.status, 410);
});

test("cross-origin approval requests are rejected", async () => {
  const store = approval.createInMemoryProposalStore();
  const created = await store.createProposal(event, 3600);
  const response = await approval.handleLinkedInApprovalRequest(
    postRequest(created.proposal.id, "approve", "application/json", {
      origin: "https://evil.example",
    }),
    {},
    store,
    auth(),
  );
  assert.equal(response.status, 403);
});

test("storage failures do not become approval success", async () => {
  const unavailable = {
    createProposal: async () => {
      throw new Error("storage unavailable");
    },
    getProposal: async () => {
      throw new Error("storage unavailable");
    },
    transitionProposal: async () => {
      throw new Error("storage unavailable");
    },
  };
  const created = { id: "00000000-0000-0000-0000-000000000000" };
  const preview = await approval.handleLinkedInApprovalRequest(
    getRequest(created.id),
    {},
    unavailable,
    auth(),
  );
  const action = await approval.handleLinkedInApprovalRequest(
    postRequest(created.id, "approve"),
    {},
    unavailable,
    auth(),
  );
  assert.equal(preview.status, 503);
  assert.equal(action.status, 503);
});
