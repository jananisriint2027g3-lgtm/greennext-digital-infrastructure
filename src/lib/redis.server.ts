import { createClient, type RedisClientType } from 'redis';

/**
 * GreenNext Enterprise Redis Connection Controller
 * Server-only module for managing reusable Redis client instances.
 *
 * Supports:
 * - Direct connection string (REDIS_URL)
 * - Component environment variables (REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD)
 * - Automatic reconnection with exponential backoff
 * - Singleton connection pooling across warm serverless/SSR executions
 * - Safe sanitization preventing credential exposure in logs
 */

declare global {
  // eslint-disable-next-line no-var
  var __greennext_redis_client: RedisClientType | undefined;
  // eslint-disable-next-line no-var
  var __greennext_redis_promise: Promise<RedisClientType> | undefined;
}

export interface RedisSanitizedStatus {
  configured: boolean;
  connected: boolean;
  endpoint?: string | undefined;
  hasAuth: boolean;
  tlsEnabled: boolean;
}

/**
 * Checks if Redis configuration is present in environment variables.
 */
export function isRedisConfigured(): boolean {
  const redisUrl = process.env['REDIS_URL'];
  if (redisUrl && redisUrl.trim().length > 0) {
    return true;
  }
  const host = process.env['REDIS_HOST'];
  const port = process.env['REDIS_PORT'];
  return Boolean(host && host.trim().length > 0 && port);
}

/**
 * Returns safe diagnostic metadata about the current Redis configuration without leaking secrets.
 */
export function getSanitizedRedisStatus(): RedisSanitizedStatus {
  const configured = isRedisConfigured();
  const client = globalThis.__greennext_redis_client;
  const connected = Boolean(client && client.isOpen);

  if (!configured) {
    return {
      configured: false,
      connected: false,
      hasAuth: false,
      tlsEnabled: false,
    };
  }

  const redisUrl = process.env['REDIS_URL'];
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        configured: true,
        connected,
        endpoint: `${url.hostname}:${url.port || '6379'}`,
        hasAuth: Boolean(url.password),
        tlsEnabled: url.protocol === 'rediss:',
      };
    } catch {
      return {
        configured: true,
        connected,
        endpoint: '[custom url]',
        hasAuth: true,
        tlsEnabled: redisUrl.startsWith('rediss://'),
      };
    }
  }

  const host = process.env['REDIS_HOST']?.trim() || '127.0.0.1';
  const port = process.env['REDIS_PORT']?.trim() || '6379';
  const tls = process.env['REDIS_TLS'];
  const tlsEnabled = tls === 'true' || port === '6380';

  return {
    configured: true,
    connected,
    endpoint: `${host}:${port}`,
    hasAuth: Boolean(process.env['REDIS_PASSWORD']),
    tlsEnabled,
  };
}

/**
 * Builds Redis client options from environment variables.
 */
function buildClientOptions() {
  const reconnectStrategy = (retries: number) => {
    if (retries > 10) {
      return new Error('Redis reconnection attempt limit reached (10)');
    }
    return Math.min(retries * 150, 3000);
  };

  const redisUrl = process.env['REDIS_URL'];
  if (redisUrl && redisUrl.trim().length > 0) {
    return {
      url: redisUrl.trim(),
      socket: {
        reconnectStrategy,
      },
    };
  }

  const host = process.env['REDIS_HOST']?.trim() || '127.0.0.1';
  const port = Number(process.env['REDIS_PORT']) || 6379;
  const username = process.env['REDIS_USERNAME']?.trim();
  const password = process.env['REDIS_PASSWORD'];

  const tlsFlag = process.env['REDIS_TLS'];
  const tlsEnabled = tlsFlag === 'true' || tlsFlag === '1' || port === 6380;

  // With exactOptionalPropertyTypes, construct clean objects without undefined values
  const socketConfig: {
    host: string;
    port: number;
    reconnectStrategy: (retries: number) => number | Error;
    tls?: true;
  } = {
    host,
    port,
    reconnectStrategy,
  };

  if (tlsEnabled) {
    socketConfig.tls = true;
  }

  const clientOptions: {
    username?: string;
    password?: string;
    socket: typeof socketConfig;
  } = {
    socket: socketConfig,
  };

  if (username) {
    clientOptions.username = username;
  }
  if (password) {
    clientOptions.password = password;
  }

  return clientOptions;
}

/**
 * Retrieves or establishes the reusable Redis singleton client.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (globalThis.__greennext_redis_client && globalThis.__greennext_redis_client.isOpen) {
    return globalThis.__greennext_redis_client;
  }

  if (globalThis.__greennext_redis_promise) {
    return globalThis.__greennext_redis_promise;
  }

  if (!isRedisConfigured()) {
    throw new Error('Redis configuration missing. Set REDIS_URL or REDIS_HOST/REDIS_PORT in environment.');
  }

  globalThis.__greennext_redis_promise = (async () => {
    try {
      const options = buildClientOptions();
      const client = createClient(options) as RedisClientType;

      client.on('error', (err) => {
        // Log safe message without leaking connection string/tokens
        console.error('[Redis Client Error]', err?.message || 'Unknown Redis error');
      });

      await client.connect();
      globalThis.__greennext_redis_client = client;
      return client;
    } finally {
      globalThis.__greennext_redis_promise = undefined;
    }
  })();

  return globalThis.__greennext_redis_promise;
}

/**
 * Pings the Redis server and returns PONG or throws if unavailable.
 */
export async function pingRedis(): Promise<string> {
  const client = await getRedisClient();
  return await client.ping();
}

/**
 * Safely closes the active Redis singleton connection if open.
 */
export async function closeRedisClient(): Promise<void> {
  const client = globalThis.__greennext_redis_client;
  if (client && client.isOpen) {
    await client.quit();
  }
  globalThis.__greennext_redis_client = undefined;
  globalThis.__greennext_redis_promise = undefined;
}
