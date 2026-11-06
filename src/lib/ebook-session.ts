export const EBOOK_SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

export interface EbookSessionEnvelope<T> {
  user: T;
  issuedAt: number;
  lastActivityAt: number;
}

export function createEbookSessionEnvelope<T>(user: T, now = Date.now()): EbookSessionEnvelope<T> {
  return { user, issuedAt: now, lastActivityAt: now };
}

export function isEbookSessionEnvelopeFresh(
  value: unknown,
  now = Date.now(),
): value is EbookSessionEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<EbookSessionEnvelope<unknown>>;
  if (!envelope.user || typeof envelope.user !== "object") return false;
  const issuedAt = envelope.issuedAt;
  const lastActivityAt = envelope.lastActivityAt;
  if (typeof issuedAt !== "number" || typeof lastActivityAt !== "number") return false;
  if (!Number.isFinite(issuedAt) || !Number.isFinite(lastActivityAt)) return false;
  if (lastActivityAt > now) return false;
  return now - lastActivityAt < EBOOK_SESSION_IDLE_TIMEOUT_MS;
}
