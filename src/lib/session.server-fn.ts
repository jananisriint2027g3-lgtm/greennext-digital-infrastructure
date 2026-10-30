import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const DEFAULT_SESSION_TTL_SECONDS = 3600;

type RedisSanitizedStatus = {
  configured: boolean;
  connected: boolean;
  endpoint?: string | undefined;
  tlsEnabled?: boolean | undefined;
  hasAuth?: boolean | undefined;
};

export interface SerializableSessionResult {
  valid: boolean;
  userId?: string | undefined;
  email?: string | undefined;
  role?: string | undefined;
  createdAt?: number | undefined;
  lastAccessedAt?: number | undefined;
  error?: 'expired' | 'not_found' | 'invalid_token' | 'redis_unavailable' | undefined;
}

export interface RedisPingResult {
  success: boolean;
  configured: boolean;
  pong?: string | undefined;
  latencyMs?: number | undefined;
  endpoint?: string | undefined;
  tlsEnabled?: boolean | undefined;
  hasAuth?: boolean | undefined;
  error?: string | undefined;
}

export interface DemoSessionItemResult {
  userId: string;
  maskedKey: string;
  sessionCreated: boolean;
  userVerified: boolean;
  ttlSeconds: number;
  ttlValid: boolean;
  passed: boolean;
  error?: string | undefined;
}

export interface RedisDemoRunSummary {
  success: boolean;
  totalUsers: number;
  createdCount: number;
  verifiedCount: number;
  failedCount: number;
  defaultTtlSeconds: number;
  allPassed: boolean;
  items: DemoSessionItemResult[];
  cleanedUp: boolean;
  timestamp: number;
  statusMeta: RedisSanitizedStatus;
  error?: string | undefined;
}

/**
 * Validates if the demo execution is authorized in the current environment.
 * Development / preview environments are always permitted.
 * In production, requires ENABLE_REDIS_DEMO=true to prevent uncontrolled session churning.
 */
export function isDemoExecutionAuthorized(): boolean {
  if (process.env['NODE_ENV'] !== 'production') {
    return true;
  }
  return process.env['ENABLE_REDIS_DEMO'] === 'true';
}

export function maskKeyForDisplay(token: string): string {
  if (!token || token.length < 12) return 'greennext:session:***';
  return `greennext:session:${token.slice(0, 6)}...[hidden]...${token.slice(-6)}`;
}

/**
 * Core business logic to test Redis connectivity via PING.
 * Callable directly by tests or through TanStack Start server functions.
 */
export async function executeRedisPing(): Promise<RedisPingResult> {
  const { getSanitizedRedisStatus, isRedisConfigured, pingRedis } = await import('./redis.server');
  const configured = isRedisConfigured();
  const status = getSanitizedRedisStatus();

  if (!configured) {
    return {
      success: false,
      configured: false,
      error: 'Redis is not configured in environment variables (missing REDIS_URL or REDIS_HOST/REDIS_PORT).',
    };
  }

  try {
    const startTime = Date.now();
    const pong = await pingRedis();
    const latencyMs = Date.now() - startTime;

    return {
      success: pong === 'PONG',
      configured: true,
      pong,
      latencyMs,
      endpoint: status.endpoint,
      tlsEnabled: status.tlsEnabled,
      hasAuth: status.hasAuth,
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      endpoint: status.endpoint,
      tlsEnabled: status.tlsEnabled,
      hasAuth: status.hasAuth,
      error: err instanceof Error ? err.message : 'Redis connection failed',
    };
  }
}

/**
 * Core business logic to run the 10-session verification pipeline.
 * Creates 10 synthetic sessions, validates storage and TTLs, and formats safe results.
 */
export async function executeRedisDemoSessions(options?: {
  cleanupAfterVerification?: boolean | undefined;
}): Promise<RedisDemoRunSummary> {
  const [redis, session] = await Promise.all([
    import('./redis.server'),
    import('./session.server'),
  ]);
  const statusMeta = redis.getSanitizedRedisStatus();
  const defaultSummary: RedisDemoRunSummary = {
    success: false,
    totalUsers: 10,
    createdCount: 0,
    verifiedCount: 0,
    failedCount: 0,
    defaultTtlSeconds: DEFAULT_SESSION_TTL_SECONDS,
    allPassed: false,
    items: [],
    cleanedUp: false,
    timestamp: Date.now(),
    statusMeta,
  };

  if (!isDemoExecutionAuthorized()) {
    return {
      ...defaultSummary,
      error: 'Demonstration mode is disabled in production. Set ENABLE_REDIS_DEMO=true to enable.',
    };
  }

  if (!redis.isRedisConfigured()) {
    return {
      ...defaultSummary,
      error: 'Redis is not configured in environment variables.',
    };
  }

  const shouldCleanup = Boolean(options?.cleanupAfterVerification);
  const createdTokens: { token: string; userId: string }[] = [];
  const items: DemoSessionItemResult[] = [];
  let createdCount = 0;
  let verifiedCount = 0;
  let failedCount = 0;

  try {
    const client = await redis.getRedisClient();

    // Step 1: Create 10 synthetic sessions
    for (let i = 1; i <= 10; i++) {
      const padIndex = String(i).padStart(2, '0');
      const userId = `redis-test-user-${padIndex}`;

      try {
        const { token } = await session.createSession(
          userId,
          {
            role: 'synthetic-test-user',
            metadata: { synthetic: 'true', index: i },
          },
          DEFAULT_SESSION_TTL_SECONDS
        );

        createdTokens.push({ token, userId });
        createdCount++;
      } catch (err) {
        failedCount++;
        items.push({
          userId,
          maskedKey: 'greennext:session:failed-creation',
          sessionCreated: false,
          userVerified: false,
          ttlSeconds: 0,
          ttlValid: false,
          passed: false,
          error: err instanceof Error ? err.message : 'Creation failed',
        });
      }
    }

    // Step 2: Read back and verify each session
    for (const item of createdTokens) {
      const key = session.formatSessionKey(item.token);
      const maskedKey = maskKeyForDisplay(item.token);

      try {
        const fetched = await session.getSession(item.token);
        const validation = await session.validateSession(item.token);
        const ttl = await client.ttl(key);

        const userMatches = Boolean(fetched && fetched.userId === item.userId);
        const validationOk = validation.valid && validation.session?.userId === item.userId;
        const ttlOk = ttl > 0 && ttl <= DEFAULT_SESSION_TTL_SECONDS;
        const itemPassed = userMatches && validationOk && ttlOk;

        if (itemPassed) {
          verifiedCount++;
        } else {
          failedCount++;
        }

        items.push({
          userId: item.userId,
          maskedKey,
          sessionCreated: true,
          userVerified: userMatches && validationOk,
          ttlSeconds: ttl,
          ttlValid: ttlOk,
          passed: itemPassed,
        });
      } catch (err) {
        failedCount++;
        items.push({
          userId: item.userId,
          maskedKey,
          sessionCreated: true,
          userVerified: false,
          ttlSeconds: 0,
          ttlValid: false,
          passed: false,
          error: err instanceof Error ? err.message : 'Verification read failed',
        });
      }
    }

    const allPassed = verifiedCount === 10 && failedCount === 0;

    // Optional Cleanup
    if (shouldCleanup && createdTokens.length > 0) {
      for (const record of createdTokens) {
        await session.deleteSession(record.token).catch(() => {});
      }
    }

    return {
      success: allPassed,
      totalUsers: 10,
      createdCount,
      verifiedCount,
      failedCount,
      defaultTtlSeconds: DEFAULT_SESSION_TTL_SECONDS,
      allPassed,
      items,
      cleanedUp: shouldCleanup,
      timestamp: Date.now(),
      statusMeta,
    };
  } catch (err) {
    // Safe cleanup if exception occurred
    for (const record of createdTokens) {
      await session.deleteSession(record.token).catch(() => {});
    }

    return {
      ...defaultSummary,
      createdCount,
      verifiedCount,
      failedCount: 10 - verifiedCount,
      items,
      error: err instanceof Error ? err.message : 'Demonstration execution error',
    };
  }
}

/**
 * Validates the caller's session token.
 * Accepts optional token explicitly, or extracts it from cookie string.
 * Server-only execution pattern ensures credentials and Redis logic never leak to client bundle.
 */
export const validateSessionServerFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    return z
      .object({
        token: z.string().optional(),
        cookieHeader: z.string().optional(),
      })
      .parse(input);
  })
  .handler(async ({ data }): Promise<SerializableSessionResult> => {
    const { parseSessionTokenFromCookies, validateSession } = await import('./session.server');
    const token = data.token || parseSessionTokenFromCookies(data.cookieHeader);
    if (!token) {
      return { valid: false, error: 'invalid_token' };
    }
    const result = await validateSession(token);
    if (!result.valid || !result.session) {
      return { valid: false, error: result.error || 'not_found' };
    }
    return {
      valid: true,
      userId: result.session.userId,
      email: result.session.email,
      role: result.session.role,
      createdAt: result.session.createdAt,
      lastAccessedAt: result.session.lastAccessedAt,
    };
  });

/**
 * Server function to securely destroy a session (logout).
 */
export const logoutSessionServerFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    return z
      .object({
        token: z.string().optional(),
        cookieHeader: z.string().optional(),
      })
      .parse(input);
  })
  .handler(async ({ data }) => {
    const { deleteSession, parseSessionTokenFromCookies, serializeSessionClearCookie } =
      await import('./session.server');
    const token = data.token || parseSessionTokenFromCookies(data.cookieHeader);
    let success = false;
    if (token) {
      success = await deleteSession(token);
    }
    return {
      success,
      clearCookieHeader: serializeSessionClearCookie(),
    };
  });

/**
 * Server function to check Redis health without exposing secrets.
 */
export const checkRedisHealthServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getSanitizedRedisStatus } = await import('./redis.server');
  return getSanitizedRedisStatus();
});

/**
 * Tests live Redis connection via PING and returns latency and safe metadata.
 */
export const testRedisPingServerFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    return z.object({}).optional().parse(input);
  })
  .handler(async (): Promise<RedisPingResult> => {
    return await executeRedisPing();
  });

/**
 * Executes the controlled 10-session demonstration pipeline.
 * Creates 10 synthetic sessions, validates storage and TTLs, and formats safe results.
 */
export const runRedisDemoSessionsServerFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    return z
      .object({
        cleanupAfterVerification: z.boolean().optional(),
      })
      .optional()
      .parse(input);
  })
  .handler(async ({ data }): Promise<RedisDemoRunSummary> => {
    return await executeRedisDemoSessions(data);
  });
