#!/usr/bin/env node
import crypto from 'node:crypto';
import { createClient } from 'redis';

/**
 * GreenNext Synthetic Redis Test Session Seeder & Verifier
 *
 * Verifies Redis connectivity, creates 10 synthetic sessions with a 1-hour expiration (3600s),
 * validates their retrieval and TTLs, and reports PASS/FAIL without leaking sensitive tokens.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-redis-test-sessions.mjs
 *   node --env-file=.env scripts/seed-redis-test-sessions.mjs --cleanup
 */

const SESSION_KEY_PREFIX = 'greennext:session:';
const DEFAULT_TTL_SECONDS = 3600;
const TEST_USER_COUNT = 10;
const shouldCleanupOnSuccess = process.argv.includes('--cleanup');

function maskToken(token) {
  if (!token || token.length < 12) return '***';
  return `${token.slice(0, 6)}...[hidden]...${token.slice(-6)}`;
}

function getClientOptions() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    return { url: redisUrl };
  }

  const host = process.env.REDIS_HOST?.trim() || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT) || 6379;
  const username = process.env.REDIS_USERNAME?.trim();
  const password = process.env.REDIS_PASSWORD;
  const tls = process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1' || port === 6380;

  const options = {
    socket: {
      host,
      port,
      tls: tls ? true : undefined,
      reconnectStrategy: (retries) => {
        if (retries > 3) return new Error('Retry limit reached');
        return 200;
      },
    },
  };

  if (username) options.username = username;
  if (password) options.password = password;

  return options;
}

async function run() {
  console.log('='.repeat(70));
  console.log('GreenNext Redis Test Session Seeder & Verification Suite');
  console.log('='.repeat(70));

  const hasConfig = Boolean(
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST && process.env.REDIS_PORT)
  );

  if (!hasConfig) {
    console.error('FAIL: Missing Redis configuration. Set REDIS_URL or REDIS_HOST/REDIS_PORT in .env');
    process.exit(1);
  }

  const clientOptions = getClientOptions();
  const client = createClient(clientOptions);

  client.on('error', (err) => {
    console.error('[Redis Client Warning]:', err?.message || 'Connection event');
  });

  const createdSessionKeys = [];
  const results = [];
  let allPassed = true;

  try {
    console.log('[1/4] Connecting to Redis...');
    await client.connect();

    console.log('[2/4] Verifying connectivity (PING)...');
    const pong = await client.ping();
    if (pong !== 'PONG') {
      throw new Error(`PING expected 'PONG' but received: '${pong}'`);
    }
    console.log('      Connectivity confirmed: PONG received successfully.');

    console.log(`[3/4] Creating ${TEST_USER_COUNT} synthetic user sessions (1-hour TTL = 3,600s)...`);
    const batchId = crypto.randomBytes(4).toString('hex');
    const now = Date.now();

    for (let i = 1; i <= TEST_USER_COUNT; i++) {
      const padIndex = String(i).padStart(2, '0');
      const userId = `redis-test-user-${padIndex}`;
      const token = crypto.randomBytes(32).toString('hex');
      const key = `${SESSION_KEY_PREFIX}${token}`;

      const sessionPayload = {
        userId,
        role: 'synthetic-test-user',
        createdAt: now,
        lastAccessedAt: now,
        metadata: {
          synthetic: true,
          batchId,
          testIndex: i,
        },
      };

      // Store with strict 3,600 second expiration
      await client.set(key, JSON.stringify(sessionPayload), { EX: DEFAULT_TTL_SECONDS });
      createdSessionKeys.push({ key, userId, token });
    }

    console.log('[4/4] Verifying session records, user identifiers, and TTLs...');
    for (const item of createdSessionKeys) {
      const raw = await client.get(item.key);
      const ttl = await client.ttl(item.key);

      let recordValid = false;
      let parsedUserId = null;

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          parsedUserId = parsed.userId;
          recordValid = parsedUserId === item.userId;
        } catch {
          recordValid = false;
        }
      }

      const ttlValid = ttl > 0 && ttl <= DEFAULT_TTL_SECONDS;
      const stepPassed = recordValid && ttlValid;

      if (!stepPassed) {
        allPassed = false;
      }

      results.push({
        userId: item.userId,
        maskedKey: `${SESSION_KEY_PREFIX}${maskToken(item.token)}`,
        recordFound: Boolean(raw),
        verifiedUserId: parsedUserId || 'NONE',
        ttlSeconds: ttl,
        ttlValid,
        passed: stepPassed,
      });
    }

    console.log('');
    console.log('Session Verification Summary:');
    console.log('-'.repeat(106));
    console.log(
      'User ID'.padEnd(22) +
      'Masked Key'.padEnd(52) +
      'Verified User'.padEnd(22) +
      'TTL (s)'.padEnd(10)
    );
    console.log('-'.repeat(106));

    for (const r of results) {
      const statusIcon = r.passed ? '✓' : '✗';
      console.log(
        `${statusIcon} ${r.userId.padEnd(20)}` +
        `${r.maskedKey.padEnd(52)}` +
        `${r.verifiedUserId.padEnd(22)}` +
        `${String(r.ttlSeconds).padEnd(10)}`
      );
    }
    console.log('-'.repeat(106));

    if (allPassed) {
      console.log('');
      console.log(`RESULT: PASS - All ${TEST_USER_COUNT} synthetic sessions verified successfully in Redis.`);
      console.log(`All session records have confirmed TTLs <= ${DEFAULT_TTL_SECONDS}s and correct user mappings.`);

      if (shouldCleanupOnSuccess) {
        console.log('');
        console.log('[Cleanup] Removing verified test sessions (--cleanup flag specified)...');
        for (const item of createdSessionKeys) {
          await client.del(item.key);
        }
        console.log(`[Cleanup] Deleted ${createdSessionKeys.length} test keys. No other keys touched.`);
      } else {
        console.log('');
        console.log('Note: Test sessions remain active in Redis until their 1-hour expiration.');
        console.log('To automatically clean them up immediately after testing, pass --cleanup flag.');
      }
    } else {
      console.error('');
      console.error('RESULT: FAIL - One or more sessions failed validation.');
      console.log('[Rollback] Cleaning up test sessions created during this failed run...');
      for (const item of createdSessionKeys) {
        await client.del(item.key).catch(() => {});
      }
      console.log('[Rollback] Test sessions removed. Database preserved.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('');
    console.error('RESULT: FAIL - Unexpected error during test execution:', err?.message || err);
    if (createdSessionKeys.length > 0) {
      console.log('[Rollback] Cleaning up created test keys after error...');
      for (const item of createdSessionKeys) {
        await client.del(item.key).catch(() => {});
      }
    }
    process.exitCode = 1;
  } finally {
    if (client.isOpen) {
      await client.quit();
    }
  }
}

run();
