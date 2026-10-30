/**
 * Server-only proposal and approval workflow for future LinkedIn publishing.
 *
 * This module records human consent only. It deliberately contains no
 * LinkedIn API client and never publishes or modifies JIRA.
 */

import type { NormalizedJiraWebhookEvent } from "./jira-webhook.server";
import type { UserSessionData } from "./session.server";

export const LINKEDIN_APPROVAL_PREVIEW_PREFIX = "/linkedin/approvals/";
export const LINKEDIN_APPROVAL_API_PREFIX = "/api/linkedin/proposals/";
const DEFAULT_PROPOSAL_TTL_SECONDS = 48 * 60 * 60;
const PROPOSAL_KEY_PREFIX = "greennext:linkedin-proposal:";
const EVENT_KEY_PREFIX = "greennext:linkedin-proposal-event:";

export type LinkedInProposalStatus = "pending" | "approved" | "rejected" | "expired";

export interface LinkedInProposal {
  id: string;
  jiraIssueKey: string;
  jiraIssueUrl?: string;
  proposedText: string;
  sourceSummary: string;
  sourceDescription: string;
  labels: string[];
  attachments: NormalizedJiraWebhookEvent["attachments"];
  status: LinkedInProposalStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approverId?: string;
}

export interface ProposalStore {
  createProposal(
    event: NormalizedJiraWebhookEvent,
    ttlSeconds: number,
  ): Promise<{ proposal: LinkedInProposal; duplicate: boolean }>;
  getProposal(id: string): Promise<LinkedInProposal | null>;
  transitionProposal(
    id: string,
    action: "approve" | "reject",
    approverId: string,
    now: Date,
  ): Promise<
    | { kind: "updated"; proposal: LinkedInProposal }
    | { kind: "already_processed"; proposal: LinkedInProposal }
    | { kind: "expired"; proposal: LinkedInProposal }
    | { kind: "not_found" }
  >;
}

export interface ApprovalPrincipal {
  userId: string;
  role: string;
}

/**
 * Applies the approval allow-list to an already validated GreenNext session.
 *
 * This is deliberately separate from session validation: a valid session is
 * not automatically an approver. Production callers must first obtain the
 * session through the server-side session module and then apply this check.
 */
export function isAuthorizedApproverSession(
  session: UserSessionData | null | undefined,
  env?: unknown,
): ApprovalPrincipal | null {
  const allowedIds = runtimeEnv(env, "LINKEDIN_APPROVER_USER_IDS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (allowedIds.length === 0) return null;

  const allowedRoles = new Set(
    (runtimeEnv(env, "LINKEDIN_APPROVER_ROLES") || "approver,admin")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  if (
    !session ||
    !allowedIds.includes(session.userId) ||
    !session.role ||
    !allowedRoles.has(session.role)
  ) {
    return null;
  }
  return { userId: session.userId, role: session.role };
}

type RuntimeEnv = Record<string, unknown>;

interface RedisProposalMulti {
  set(key: string, value: string, options: Record<string, boolean>): RedisProposalMulti;
  exec(): Promise<unknown[] | null>;
}

interface RedisProposalClient {
  set(
    key: string,
    value: string,
    options: Record<string, boolean | number>,
  ): Promise<string | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  watch(key: string): Promise<unknown>;
  unwatch(): Promise<unknown>;
  multi(): RedisProposalMulti;
}

function runtimeEnv(env: unknown, name: string): string {
  const fromRuntime = env && typeof env === "object" ? (env as RuntimeEnv)[name] : undefined;
  if (typeof fromRuntime === "string" && fromRuntime.trim()) return fromRuntime.trim();
  if (typeof process !== "undefined" && typeof process.env?.[name] === "string") {
    return process.env[name]!.trim();
  }
  return "";
}

function proposalTtlSeconds(env: unknown): number {
  const configured = Number.parseInt(runtimeEnv(env, "LINKEDIN_PROPOSAL_TTL_SECONDS"), 10);
  return Number.isSafeInteger(configured) && configured >= 300 && configured <= 30 * 24 * 60 * 60
    ? configured
    : DEFAULT_PROPOSAL_TTL_SECONDS;
}

function proposalKey(id: string): string {
  return `${PROPOSAL_KEY_PREFIX}${id}`;
}

function eventKey(eventId: string): string {
  return `${EVENT_KEY_PREFIX}${eventId}`;
}

function makeProposedText(event: NormalizedJiraWebhookEvent): string {
  return `${event.summary}\n\n${event.description}`.trim().slice(0, 3000);
}

function createProposal(event: NormalizedJiraWebhookEvent, ttlSeconds: number): LinkedInProposal {
  const createdAt = new Date();
  const proposal: LinkedInProposal = {
    id: crypto.randomUUID(),
    jiraIssueKey: event.issueKey,
    proposedText: makeProposedText(event),
    sourceSummary: event.summary,
    sourceDescription: event.description,
    labels: [...event.labels],
    attachments: event.attachments.map((attachment) => ({ ...attachment })),
    status: "pending",
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + ttlSeconds * 1000).toISOString(),
  };
  if (event.issueUrl) proposal.jiraIssueUrl = event.issueUrl;
  return proposal;
}

function isProposal(value: unknown): value is LinkedInProposal {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["id"] === "string" &&
    typeof record["jiraIssueKey"] === "string" &&
    typeof record["proposedText"] === "string" &&
    typeof record["status"] === "string" &&
    typeof record["createdAt"] === "string" &&
    typeof record["expiresAt"] === "string"
  );
}

function parseProposal(raw: string | null): LinkedInProposal | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isProposal(value) ? value : null;
  } catch {
    return null;
  }
}

async function stableEventId(event: NormalizedJiraWebhookEvent): Promise<string> {
  const material = `${event.eventId}\u001f${event.issueKey}\u001f${event.issueId}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Creates a Redis-backed proposal store using the repository's existing client. */
export function createRedisProposalStore(getClient: () => Promise<unknown>): ProposalStore {
  return {
    async createProposal(event, ttlSeconds) {
      const client = (await getClient()) as RedisProposalClient;
      const eventStorageKey = eventKey(await stableEventId(event));
      const proposal = createProposal(event, ttlSeconds);
      const claimed = await client.set(eventStorageKey, proposal.id, { NX: true, EX: ttlSeconds });

      if (claimed !== "OK") {
        const existingId = await client.get(eventStorageKey);
        const existing = existingId
          ? parseProposal(await client.get(proposalKey(existingId)))
          : null;
        if (!existing) throw new Error("Proposal deduplication record is inconsistent.");
        return { proposal: existing, duplicate: true };
      }

      try {
        await client.set(proposalKey(proposal.id), JSON.stringify(proposal), { EX: ttlSeconds });
        return { proposal, duplicate: false };
      } catch (error) {
        await client.del(eventStorageKey);
        throw error;
      }
    },

    async getProposal(id) {
      if (!/^[0-9a-f-]{36}$/.test(id)) return null;
      const client = (await getClient()) as RedisProposalClient;
      return parseProposal(await client.get(proposalKey(id)));
    },

    async transitionProposal(id, action, approverId, now) {
      if (!/^[0-9a-f-]{36}$/.test(id)) return { kind: "not_found" };
      const key = proposalKey(id);

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const client = (await getClient()) as RedisProposalClient;
        await client.watch(key);
        const current = parseProposal(await client.get(key));
        if (!current) {
          await client.unwatch();
          return { kind: "not_found" };
        }

        if (Date.parse(current.expiresAt) <= now.getTime() && current.status === "pending") {
          const expired = { ...current, status: "expired" as const };
          const result = await client
            .multi()
            .set(key, JSON.stringify(expired), { KEEPTTL: true })
            .exec();
          if (result) return { kind: "expired", proposal: expired };
          continue;
        }
        if (current.status !== "pending") {
          await client.unwatch();
          return { kind: "already_processed", proposal: current };
        }

        const updated: LinkedInProposal = {
          ...current,
          status: action === "approve" ? "approved" : "rejected",
          approverId,
          ...(action === "approve"
            ? { approvedAt: now.toISOString() }
            : { rejectedAt: now.toISOString() }),
        };
        const result = await client
          .multi()
          .set(key, JSON.stringify(updated), { KEEPTTL: true })
          .exec();
        if (result) return { kind: "updated", proposal: updated };
      }
      throw new Error("Proposal changed during approval; retry safely.");
    },
  };
}

export function createInMemoryProposalStore(): ProposalStore {
  const proposals = new Map<string, LinkedInProposal>();
  const eventIndex = new Map<string, string>();
  return {
    async createProposal(event, ttlSeconds) {
      const index = await stableEventId(event);
      const existingId = eventIndex.get(index);
      if (existingId) {
        const existing = proposals.get(existingId);
        if (existing) return { proposal: existing, duplicate: true };
      }
      const proposal = createProposal(event, ttlSeconds);
      eventIndex.set(index, proposal.id);
      proposals.set(proposal.id, proposal);
      return { proposal, duplicate: false };
    },
    async getProposal(id) {
      return proposals.get(id) || null;
    },
    async transitionProposal(id, action, approverId, now) {
      const current = proposals.get(id);
      if (!current) return { kind: "not_found" };
      if (Date.parse(current.expiresAt) <= now.getTime() && current.status === "pending") {
        const expired = { ...current, status: "expired" as const };
        proposals.set(id, expired);
        return { kind: "expired", proposal: expired };
      }
      if (current.status !== "pending") return { kind: "already_processed", proposal: current };
      const updated: LinkedInProposal = {
        ...current,
        status: action === "approve" ? "approved" : "rejected",
        approverId,
        ...(action === "approve"
          ? { approvedAt: now.toISOString() }
          : { rejectedAt: now.toISOString() }),
      };
      proposals.set(id, updated);
      return { kind: "updated", proposal: updated };
    },
  };
}

export async function createProposalFromJiraEvent(
  event: NormalizedJiraWebhookEvent,
  env?: unknown,
  store?: ProposalStore,
): Promise<{ proposal: LinkedInProposal; duplicate: boolean }> {
  const effectiveStore =
    store ||
    createRedisProposalStore(async () => {
      const { getRedisClient } = await import("./redis.server");
      return getRedisClient();
    });
  return effectiveStore.createProposal(event, proposalTtlSeconds(env));
}

async function authenticateApprover(
  request: Request,
  env?: unknown,
): Promise<ApprovalPrincipal | null> {
  const { parseSessionTokenFromCookies, validateSession } = await import("./session.server");
  const token = parseSessionTokenFromCookies(request.headers.get("cookie"));
  if (!token) return null;
  const validation = await validateSession(token);
  const session = validation.valid ? validation.session : undefined;
  return isAuthorizedApproverSession(session, env);
}

function htmlEscape(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] || character;
  });
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function previewHtml(proposal: LinkedInProposal): string {
  const attachmentMarkup = proposal.attachments.length
    ? `<ul>${proposal.attachments
        .map(
          (attachment) =>
            `<li>${htmlEscape(attachment.fileName)}${attachment.mimeType ? ` (${htmlEscape(attachment.mimeType)})` : ""}${attachment.sizeBytes !== undefined ? ` — ${attachment.sizeBytes} bytes` : ""}</li>`,
        )
        .join("")}</ul>`
    : "<p>No attachments.</p>";
  const disabled = proposal.status !== "pending" ? " disabled" : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>LinkedIn approval preview</title></head><body>
    <main><h1>LinkedIn post proposal</h1>
    <p><strong>Source JIRA issue:</strong> ${htmlEscape(proposal.jiraIssueKey)}</p>
    <p><strong>Status:</strong> ${htmlEscape(proposal.status)}</p>
    <p><strong>Expires:</strong> ${htmlEscape(proposal.expiresAt)}</p>
    <h2>Proposed text</h2><pre>${htmlEscape(proposal.proposedText)}</pre>
    <h2>Attachments</h2>${attachmentMarkup}
    <form method="post"><button name="action" value="approve"${disabled}>Approve</button>
    <button name="action" value="reject"${disabled}>Reject</button></form></main></body></html>`;
}

function requestIsSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function handleLinkedInApprovalRequest(
  request: Request,
  env?: unknown,
  store?: ProposalStore,
  authenticate: (
    request: Request,
    env?: unknown,
  ) => Promise<ApprovalPrincipal | null> = authenticateApprover,
): Promise<Response> {
  const url = new URL(request.url);
  const previewMatch = url.pathname.match(/^\/linkedin\/approvals\/([^/]+)$/);
  const apiMatch = url.pathname.match(/^\/api\/linkedin\/proposals\/([^/]+)$/);
  const proposalId = previewMatch?.[1] || apiMatch?.[1];
  if (!proposalId) return jsonResponse({ error: "Not Found" }, 404);

  const principal = await authenticate(request, env);
  if (!principal) return jsonResponse({ error: "Unauthorized" }, 401);

  const effectiveStore =
    store ||
    createRedisProposalStore(async () => {
      const { getRedisClient } = await import("./redis.server");
      return getRedisClient();
    });
  if (request.method === "GET") {
    let proposal: LinkedInProposal | null;
    try {
      proposal = await effectiveStore.getProposal(proposalId);
    } catch (error) {
      console.error("LinkedIn approval storage unavailable", {
        error: error instanceof Error ? error.message : "unknown error",
      });
      return jsonResponse({ error: "Approval temporarily unavailable" }, 503);
    }
    if (!proposal) return jsonResponse({ error: "Proposal not found" }, 404);
    if (Date.parse(proposal.expiresAt) <= Date.now() && proposal.status === "pending") {
      return jsonResponse({ error: "Proposal expired" }, 410);
    }
    return previewMatch
      ? htmlResponse(previewHtml(proposal), 200)
      : jsonResponse({ proposal }, 200);
  }

  if (request.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, 405);
  if (!requestIsSameOrigin(request)) return jsonResponse({ error: "Forbidden" }, 403);

  let action = "";
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    action = new URLSearchParams(await request.text()).get("action") || "";
  } else if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as { action?: unknown };
      action = typeof body.action === "string" ? body.action : "";
    } catch {
      return jsonResponse({ error: "Malformed request" }, 400);
    }
  }
  if (action !== "approve" && action !== "reject") {
    return jsonResponse({ error: "Invalid action" }, 400);
  }

  let result: Awaited<ReturnType<ProposalStore["transitionProposal"]>>;
  try {
    result = await effectiveStore.transitionProposal(
      proposalId,
      action,
      principal.userId,
      new Date(),
    );
  } catch (error) {
    console.error("LinkedIn approval storage unavailable", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return jsonResponse({ error: "Approval temporarily unavailable" }, 503);
  }
  if (result.kind === "not_found") return jsonResponse({ error: "Proposal not found" }, 404);
  if (result.kind === "expired") return jsonResponse({ error: "Proposal expired" }, 410);
  if (result.kind === "already_processed") {
    return jsonResponse(
      { error: "Proposal already processed", status: result.proposal.status },
      409,
    );
  }
  return jsonResponse({ status: result.proposal.status, proposalId: result.proposal.id }, 200);
}
