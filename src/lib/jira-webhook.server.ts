/**
 * JIRA -> GreenNext webhook intake foundation.
 *
 * This module intentionally stops after authenticated validation and durable
 * duplicate detection. It does not publish to LinkedIn or modify JIRA.
 *
 * The current delivery contract uses a dedicated Authorization bearer secret.
 * HMAC verification is not assumed because no HMAC-capable JIRA delivery
 * configuration is present in this repository.
 */

export const JIRA_WEBHOOK_PATH = "/api/webhooks/jira";
const DEFAULT_DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_BODY_BYTES = 256 * 1024;

export interface JiraWebhookAttachment {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  contentUrl?: string;
}

export interface NormalizedJiraWebhookEvent {
  eventId: string;
  issueId: string;
  issueKey: string;
  status: "Done";
  summary: string;
  description: string;
  labels: string[];
  attachments: JiraWebhookAttachment[];
  issueUrl?: string;
  receivedAt: string;
}

export interface JiraWebhookDedupeStore {
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  createProposal?: (
    event: NormalizedJiraWebhookEvent,
    ttlSeconds: number,
  ) => Promise<{ proposalId: string; duplicate: boolean }>;
}

type RuntimeEnv = Record<string, unknown>;

function runtimeEnv(env: unknown, name: string): string {
  const fromRuntime = env && typeof env === "object" ? (env as RuntimeEnv)[name] : undefined;
  if (typeof fromRuntime === "string" && fromRuntime.trim()) return fromRuntime.trim();
  if (typeof process !== "undefined" && typeof process.env?.[name] === "string") {
    return process.env[name]!.trim();
  }
  return "";
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record["text"] === "string") return record["text"];
  const content = record["content"];
  if (!Array.isArray(content)) return "";
  return content.map(textValue).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function boundedString(value: unknown, maxLength: number): string {
  return textValue(value).slice(0, maxLength);
}

function issueRecord(payload: Record<string, unknown>): Record<string, unknown> | undefined {
  return payload["issue"] && typeof payload["issue"] === "object"
    ? (payload["issue"] as Record<string, unknown>)
    : undefined;
}

function fieldsRecord(issue: Record<string, unknown>): Record<string, unknown> {
  return issue["fields"] && typeof issue["fields"] === "object"
    ? (issue["fields"] as Record<string, unknown>)
    : {};
}

function statusName(fields: Record<string, unknown>): string {
  const status = fields["status"];
  if (typeof status === "string") return status.trim();
  if (status && typeof status === "object") {
    const name = (status as Record<string, unknown>)["name"];
    return typeof name === "string" ? name.trim() : "";
  }
  return "";
}

function transitionTarget(payload: Record<string, unknown>): string | undefined {
  const changelog = payload["changelog"];
  if (!changelog || typeof changelog !== "object") return undefined;
  const items = (changelog as Record<string, unknown>)["items"];
  if (!Array.isArray(items)) return undefined;
  const statusChange = items.find((item): item is Record<string, unknown> =>
    Boolean(
      item && typeof item === "object" && (item as Record<string, unknown>)["field"] === "status",
    ),
  );
  if (!statusChange) return undefined;
  const target = statusChange["toString"] ?? statusChange["toStatus"];
  return typeof target === "string" ? target.trim() : "";
}

function normalizeAttachments(fields: Record<string, unknown>): JiraWebhookAttachment[] {
  if (!Array.isArray(fields["attachment"])) return [];
  return fields["attachment"]
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const result: JiraWebhookAttachment = {
        id: boundedString(item["id"], 200),
        fileName: boundedString(item["filename"] ?? item["fileName"], 500),
      };
      const mimeType = boundedString(item["mimeType"], 200);
      const contentUrl = boundedString(item["content"], 2000);
      if (mimeType) result.mimeType = mimeType;
      if (
        typeof item["size"] === "number" &&
        Number.isSafeInteger(item["size"]) &&
        item["size"] >= 0
      ) {
        result.sizeBytes = item["size"];
      }
      if (contentUrl) result.contentUrl = contentUrl;
      return result;
    })
    .filter((item) => item.id && item.fileName);
}

function issueUrl(issue: Record<string, unknown>): string | undefined {
  const self = issue["self"];
  if (typeof self === "string" && self.startsWith("https://")) return self.slice(0, 2000);
  const fields = fieldsRecord(issue);
  const url = fields["url"];
  return typeof url === "string" && url.startsWith("https://") ? url.slice(0, 2000) : undefined;
}

function candidateEventId(payload: Record<string, unknown>): string {
  for (const key of ["eventId", "id", "webhookEventId"]) {
    const value = payload[key];
    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      if (normalized) return normalized.slice(0, 300);
    }
  }
  return "";
}

export function normalizeJiraWebhookPayload(
  payload: unknown,
  receivedAt = new Date().toISOString(),
): { event?: NormalizedJiraWebhookEvent; reason?: "malformed" | "unsupported_status" } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { reason: "malformed" };
  }
  const root = payload as Record<string, unknown>;
  const issue = issueRecord(root);
  if (!issue) return { reason: "malformed" };
  const fields = fieldsRecord(issue);
  const issueKey = boundedString(issue["key"], 100).toUpperCase();
  const issueId = boundedString(issue["id"], 200);
  const summary = boundedString(fields["summary"], 1000);
  const description = boundedString(fields["description"], 20000);
  const labels = Array.isArray(fields["labels"])
    ? fields["labels"]
        .filter((label): label is string => typeof label === "string")
        .map((label) => label.trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 100)
    : [];

  if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(issueKey) || !issueId || !summary) {
    return { reason: "malformed" };
  }
  const explicitTransitionTarget = transitionTarget(root);
  if (
    statusName(fields) !== "Done" ||
    (explicitTransitionTarget !== undefined && explicitTransitionTarget !== "Done")
  ) {
    return { reason: "unsupported_status" };
  }

  const eventId = candidateEventId(root);
  const event: NormalizedJiraWebhookEvent = {
    eventId: eventId || `${issueKey}:${boundedString(fields["updated"] ?? root["timestamp"], 100)}`,
    issueId,
    issueKey,
    status: "Done",
    summary,
    description,
    labels,
    attachments: normalizeAttachments(fields),
    receivedAt,
  };
  const url = issueUrl(issue);
  if (url) event.issueUrl = url;
  if (!event.eventId || event.eventId === `${issueKey}:`) return { reason: "malformed" };
  return { event };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secretsMatch(actual: string, expected: string): Promise<boolean> {
  if (!actual || !expected) return false;
  const [actualDigest, expectedDigest] = await Promise.all([
    sha256Hex(actual),
    sha256Hex(expected),
  ]);
  let difference = actualDigest.length ^ expectedDigest.length;
  for (let index = 0; index < Math.max(actualDigest.length, expectedDigest.length); index += 1) {
    difference |= (actualDigest.charCodeAt(index) || 0) ^ (expectedDigest.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function dedupeTtlSeconds(env: unknown): number {
  const configured = Number.parseInt(runtimeEnv(env, "JIRA_WEBHOOK_DEDUPE_TTL_SECONDS"), 10);
  return Number.isSafeInteger(configured) && configured >= 60 && configured <= 90 * 24 * 60 * 60
    ? configured
    : DEFAULT_DEDUPE_TTL_SECONDS;
}

async function defaultDedupeStore(): Promise<JiraWebhookDedupeStore> {
  const { getRedisClient } = await import("./redis.server");
  const { createRedisProposalStore } = await import("./linkedin-approval.server");
  const proposalStore = createRedisProposalStore(getRedisClient);
  return {
    async claim(key, ttlSeconds) {
      const client = await getRedisClient();
      const result = await client.set(key, "1", { NX: true, EX: ttlSeconds });
      return result === "OK";
    },
    async createProposal(event, ttlSeconds) {
      const result = await proposalStore.createProposal(event, ttlSeconds);
      return { proposalId: result.proposal.id, duplicate: result.duplicate };
    },
  };
}

async function requestBody(request: Request): Promise<unknown> {
  const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error("too_large");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error("too_large");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("invalid_json");
  }
}

export async function handleJiraWebhookRequest(
  request: Request,
  env?: unknown,
  store?: JiraWebhookDedupeStore,
): Promise<Response> {
  if (request.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, 405);

  const secret = runtimeEnv(env, "JIRA_WEBHOOK_SECRET");
  if (!secret) return jsonResponse({ error: "Webhook is not configured" }, 503);
  const authorization = request.headers.get("authorization")?.trim() || "";
  if (
    !authorization.startsWith("Bearer ") ||
    !(await secretsMatch(authorization.slice(7), secret))
  ) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: unknown;
  try {
    payload = await requestBody(request);
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error && error.message === "too_large"
            ? "Payload too large"
            : "Malformed JSON",
      },
      400,
    );
  }

  const normalized = normalizeJiraWebhookPayload(payload);
  if (normalized.reason === "unsupported_status") {
    return jsonResponse({ status: "ignored", reason: "unsupported_status" }, 202);
  }
  if (!normalized.event) return jsonResponse({ error: "Malformed JIRA payload" }, 400);

  // Receipt time is intentionally excluded: retried deliveries must map to
  // the same durable key even when they arrive seconds apart.
  const { receivedAt: _receivedAt, ...dedupeMaterial } = normalized.event;
  const fingerprint = await sha256Hex(JSON.stringify(dedupeMaterial));
  const dedupeKey = `greennext:jira-webhook:v1:${fingerprint}`;
  try {
    const effectiveStore = store || (await defaultDedupeStore());
    if (effectiveStore.createProposal) {
      const result = await effectiveStore.createProposal(normalized.event, dedupeTtlSeconds(env));
      if (result.duplicate) return jsonResponse({ status: "duplicate" }, 200);
      return jsonResponse(
        { status: "accepted", issueKey: normalized.event.issueKey, proposalId: result.proposalId },
        202,
      );
    }
    const claimed = await effectiveStore.claim(dedupeKey, dedupeTtlSeconds(env));
    if (!claimed) return jsonResponse({ status: "duplicate" }, 200);
  } catch (error) {
    console.error("JIRA webhook storage unavailable", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return jsonResponse({ error: "Webhook temporarily unavailable" }, 503);
  }

  return jsonResponse({ status: "accepted", issueKey: normalized.event.issueKey }, 202);
}
