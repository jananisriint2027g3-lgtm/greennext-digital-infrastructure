import crypto from 'node:crypto';
import { getRedisClient, isRedisConfigured } from './redis.server';

/**
 * GreenNext Enterprise Redis Session Controller
 * Server-only module for managing secure, high-entropy Redis-backed sessions.
 *
 * Requirements:
 * - Configurable expiration defaulting to 3,600 seconds (1 hour).
 * - Dedicated Redis key namespace prefix: 'greennext:session:'
 * - Cryptographically secure 256-bit random tokens (crypto.randomBytes(32)).
 * - Automatic TTL expiration using Redis EX.
 * - Safe handling of expired, absent, or malformed session entries.
 * - Minimum necessary payload; strict prohibition of password storage.
 */

export const DEFAULT_SESSION_TTL_SECONDS = 3600; // Exactly 1 hour
export const SESSION_KEY_PREFIX = 'greennext:session:';
export const SESSION_COOKIE_NAME = 'greennext_session';

export interface UserSessionData {
  userId: string;
  email?: string | undefined;
  role?: string | undefined;
  createdAt: number; // Unix timestamp ms
  lastAccessedAt: number; // Unix timestamp ms
  metadata?: Record<string, string | number | boolean> | undefined;
}

export type SessionErrorCode =
  | 'expired'
  | 'not_found'
  | 'invalid_token'
  | 'redis_unavailable';

export interface SessionValidationResult {
  valid: boolean;
  session?: UserSessionData | undefined;
  error?: SessionErrorCode | undefined;
}

/**
 * Resolves the effective session TTL in seconds from environment or defaults to 3600.
 */
export function getEffectiveSessionTtl(): number {
  const envTtlStr = process.env['REDIS_SESSION_TTL_SECONDS'];
  const envTtl = envTtlStr ? Number(envTtlStr) : NaN;
  if (Number.isFinite(envTtl) && envTtl > 0) {
    return Math.floor(envTtl);
  }
  return DEFAULT_SESSION_TTL_SECONDS;
}

/**
 * Generates a cryptographically strong, 256-bit hexadecimal session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Formats the full Redis storage key for a session token.
 */
export function formatSessionKey(token: string): string {
  return `${SESSION_KEY_PREFIX}${token.trim()}`;
}

/**
 * Validates token string integrity (must be a 64-char hex string).
 */
export function isValidTokenFormat(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-fA-F]{64}$/.test(token.trim());
}

/**
 * Creates a new session in Redis for an authenticated user identifier.
 *
 * @param userId - Unique user identifier (e.g. 'redis-test-user-01')
 * @param extraData - Optional non-sensitive user metadata (role, email, etc.)
 * @param ttlSeconds - Optional custom TTL override, defaults to 3600 seconds
 */
export async function createSession(
  userId: string,
  extraData?: {
    email?: string | undefined;
    role?: string | undefined;
    metadata?: Record<string, string | number | boolean> | undefined;
  },
  ttlSeconds: number = getEffectiveSessionTtl()
): Promise<{ token: string; session: UserSessionData }> {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('createSession: userId is required and cannot be empty.');
  }

  const token = generateSessionToken();
  const now = Date.now();

  const sessionRecord: UserSessionData = {
    userId: userId.trim(),
    createdAt: now,
    lastAccessedAt: now,
  };

  if (extraData?.email) {
    sessionRecord.email = extraData.email.trim();
  }
  if (extraData?.role) {
    sessionRecord.role = extraData.role.trim();
  } else {
    sessionRecord.role = 'user';
  }
  if (extraData?.metadata) {
    sessionRecord.metadata = extraData.metadata;
  }

  const client = await getRedisClient();
  const key = formatSessionKey(token);

  // Store serialised session with strict EX expiration
  await client.set(key, JSON.stringify(sessionRecord), {
    EX: ttlSeconds,
  });

  return { token, session: sessionRecord };
}

/**
 * Retrieves a session from Redis by token without validation checks.
 */
export async function getSession(token: string): Promise<UserSessionData | null> {
  if (!isValidTokenFormat(token)) {
    return null;
  }

  if (!isRedisConfigured()) {
    return null;
  }

  try {
    const client = await getRedisClient();
    const raw = await client.get(formatSessionKey(token));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserSessionData;
    if (!parsed || typeof parsed.userId !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates a session token, ensuring it exists, is structurally sound, and not expired.
 */
export async function validateSession(token: string): Promise<SessionValidationResult> {
  if (!isValidTokenFormat(token)) {
    return { valid: false, error: 'invalid_token' };
  }

  try {
    const client = await getRedisClient();
    const key = formatSessionKey(token);
    const raw = await client.get(key);

    if (!raw) {
      return { valid: false, error: 'not_found' };
    }

    let parsed: UserSessionData;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { valid: false, error: 'invalid_token' };
    }

    if (!parsed || typeof parsed.userId !== 'string') {
      return { valid: false, error: 'invalid_token' };
    }

    // Refresh lastAccessedAt asynchronously to track session activity
    parsed.lastAccessedAt = Date.now();
    return {
      valid: true,
      session: parsed,
    };
  } catch (err) {
    console.error('[Session Validation Error]', err instanceof Error ? err.message : 'Unknown');
    return { valid: false, error: 'redis_unavailable' };
  }
}

/**
 * Deletes an active session from Redis (logout).
 */
export async function deleteSession(token: string): Promise<boolean> {
  if (!isValidTokenFormat(token)) {
    return false;
  }

  try {
    const client = await getRedisClient();
    const key = formatSessionKey(token);
    const deletedCount = await client.del(key);
    return deletedCount > 0;
  } catch (err) {
    console.error('[Session Deletion Error]', err instanceof Error ? err.message : 'Unknown');
    return false;
  }
}

/**
 * Refreshes / extends the session expiration TTL in Redis.
 */
export async function touchSession(
  token: string,
  extensionSeconds: number = getEffectiveSessionTtl()
): Promise<boolean> {
  if (!isValidTokenFormat(token)) {
    return false;
  }

  try {
    const client = await getRedisClient();
    const key = formatSessionKey(token);
    const result = await client.expire(key, extensionSeconds);
    return Boolean(result);
  } catch {
    return false;
  }
}

/**
 * Generates an HTTP-only Set-Cookie header value for a session.
 */
export function serializeSessionCookie(
  token: string,
  maxAgeSeconds: number = getEffectiveSessionTtl(),
  isProduction: boolean = process.env['NODE_ENV'] === 'production'
): string {
  const secureFlag = isProduction ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secureFlag}SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/**
 * Generates a cookie-clearing header value for logout.
 */
export function serializeSessionClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Extracts the session token from a standard Cookie header string.
 */
export function parseSessionTokenFromCookies(cookieHeader?: string | null): string | null {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null;
  }

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...valParts] = part.trim().split('=');
    if (rawKey === SESSION_COOKIE_NAME) {
      const val = valParts.join('=').trim();
      return isValidTokenFormat(val) ? val : null;
    }
  }
  return null;
}
