import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// ─── Module Compilation Helper ──────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const scratchDir = path.resolve(repoRoot, 'scratch', 'test-build');

if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

function compileTsModule(relSource, relDest) {
  const srcPath = path.resolve(repoRoot, relSource);
  const destPath = path.resolve(scratchDir, relDest);
  const code = fs.readFileSync(srcPath, 'utf8');

  let transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  transpiled = transpiled.replace(/from\s+['"]\.\/redis\.server['"]/g, "from './redis.server.mjs'");
  transpiled = transpiled.replace(/from\s+['"]\.\/session\.server['"]/g, "from './session.server.mjs'");
  fs.writeFileSync(destPath, transpiled, 'utf8');
  return destPath;
}

const redisPath = compileTsModule('src/lib/redis.server.ts', 'redis.server.mjs');
const sessionPath = compileTsModule('src/lib/session.server.ts', 'session.server.mjs');
const sessionFnPath = compileTsModule('src/lib/session.server-fn.ts', 'session.server-fn.mjs');

const {
  isRedisConfigured,
  getSanitizedRedisStatus,
  getRedisClient,
  pingRedis,
  closeRedisClient,
} = await import(`file://${redisPath.replace(/\\/g, '/')}`);

const {
  DEFAULT_SESSION_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_KEY_PREFIX,
  getEffectiveSessionTtl,
  generateSessionToken,
  formatSessionKey,
  isValidTokenFormat,
  createSession,
  getSession,
  validateSession,
  deleteSession,
  touchSession,
  serializeSessionCookie,
  serializeSessionClearCookie,
  parseSessionTokenFromCookies,
} = await import(`file://${sessionPath.replace(/\\/g, '/')}`);

const {
  executeRedisPing,
  executeRedisDemoSessions,
} = await import(`file://${sessionFnPath.replace(/\\/g, '/')}`);

// ─── 1. Token Security & Generation Tests ────────────────────────────────────

test('Session: Generates cryptographically secure 256-bit hex tokens', () => {
  const token = generateSessionToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64, 'Token must be 64 hexadecimal characters');
  assert.match(token, /^[0-9a-f]{64}$/, 'Token must be lowercase hexadecimal');

  // Verify entropy / uniqueness across 50 iterations
  const set = new Set();
  for (let i = 0; i < 50; i++) {
    const t = generateSessionToken();
    assert.equal(set.has(t), false, 'Generated token collision detected');
    set.add(t);
  }
});

test('Session: Validates token format and rejects invalid or hostile strings', () => {
  const validToken = generateSessionToken();
  assert.equal(isValidTokenFormat(validToken), true);

  // Hostile / malformed values
  assert.equal(isValidTokenFormat(''), false);
  assert.equal(isValidTokenFormat(null), false);
  assert.equal(isValidTokenFormat(undefined), false);
  assert.equal(isValidTokenFormat('short-token'), false);
  assert.equal(isValidTokenFormat('a'.repeat(63)), false);
  assert.equal(isValidTokenFormat('a'.repeat(65)), false);
  assert.equal(isValidTokenFormat('xyz' + '0'.repeat(61)), false);
  assert.equal(isValidTokenFormat(`${validToken}; DROP TABLE sessions;`), false);
  assert.equal(isValidTokenFormat(`../../${validToken}`), false);
});

test('Session: Dedicated Redis key namespace prefix is enforced', () => {
  const token = 'a'.repeat(64);
  const key = formatSessionKey(token);
  assert.equal(key, `${SESSION_KEY_PREFIX}${token}`);
  assert.equal(key.startsWith('greennext:session:'), true);
});

// ─── 2. TTL & Expiration Defaults ───────────────────────────────────────────

test('Session: Expiration defaults to exactly 3,600 seconds (1 hour)', () => {
  assert.equal(DEFAULT_SESSION_TTL_SECONDS, 3600);
  const ttl = getEffectiveSessionTtl();
  assert.equal(ttl, 3600);
});

// ─── 3. Cookie Management & Parsing ─────────────────────────────────────────

test('Session: Serializes HTTP-only secure cookie with Lax same-site and 1-hour max-age', () => {
  const token = generateSessionToken();
  const prodCookie = serializeSessionCookie(token, 3600, true);

  assert.match(prodCookie, new RegExp(`^${SESSION_COOKIE_NAME}=${token};`));
  assert.match(prodCookie, /HttpOnly/);
  assert.match(prodCookie, /Secure/);
  assert.match(prodCookie, /SameSite=Lax/);
  assert.match(prodCookie, /Max-Age=3600/);
  assert.match(prodCookie, /Path=\//);

  const devCookie = serializeSessionCookie(token, 3600, false);
  assert.equal(devCookie.includes('Secure;'), false, 'Non-production cookies should omit Secure flag');
});

test('Session: Serializes cookie-clearing header with Max-Age 0 and epoch expiry', () => {
  const clearCookie = serializeSessionClearCookie();
  assert.match(clearCookie, new RegExp(`^${SESSION_COOKIE_NAME}=;`));
  assert.match(clearCookie, /Max-Age=0/);
  assert.match(clearCookie, /Expires=Thu, 01 Jan 1970/);
});

test('Session: Extracts session token from compound cookie headers and rejects tampering', () => {
  const token = generateSessionToken();

  // Single cookie
  assert.equal(parseSessionTokenFromCookies(`${SESSION_COOKIE_NAME}=${token}`), token);

  // Compound cookies
  const header = `theme=dark; ${SESSION_COOKIE_NAME}=${token}; analytics_id=xyz`;
  assert.equal(parseSessionTokenFromCookies(header), token);

  // Invalid tokens in cookie
  assert.equal(parseSessionTokenFromCookies(`${SESSION_COOKIE_NAME}=invalid_len`), null);
  assert.equal(parseSessionTokenFromCookies('other_cookie=123'), null);
  assert.equal(parseSessionTokenFromCookies(null), null);
  assert.equal(parseSessionTokenFromCookies(''), null);
});

// ─── 4. Sanitized Diagnostics ───────────────────────────────────────────────

test('Redis: Sanitized diagnostic status reports configuration without leaking credentials', () => {
  const status = getSanitizedRedisStatus();
  assert.equal(typeof status.configured, 'boolean');
  assert.equal(typeof status.hasAuth, 'boolean');
  assert.equal(typeof status.tlsEnabled, 'boolean');
  // Verify passwords or tokens never appear anywhere in the object
  const serialized = JSON.stringify(status);
  assert.equal(serialized.includes(process.env.REDIS_PASSWORD || 'SUPER_SECRET_NEVER_FOUND'), false);
});

// ─── 5. Live Redis Integration Lifecycle (when configured) ───────────────────

test('Redis & Session: Live End-to-End Lifecycle Verification', async (t) => {
  if (!isRedisConfigured()) {
    t.skip('Skipping live Redis lifecycle test: REDIS_URL or REDIS_HOST not configured in environment.');
    return;
  }

  // 1. Connectivity Check
  const pong = await pingRedis();
  assert.equal(pong, 'PONG', 'Redis server must respond to PING with PONG');

  // 2. Session Creation
  const testUser = 'redis-test-e2e-user';
  const { token, session } = await createSession(testUser, {
    email: 'test@greennext.io',
    role: 'tester',
  });

  assert.equal(session.userId, testUser);
  assert.equal(session.role, 'tester');
  assert.equal(isValidTokenFormat(token), true);

  // 3. TTL Verification in Redis
  const client = await getRedisClient();
  const ttl = await client.ttl(formatSessionKey(token));
  assert.ok(ttl > 0 && ttl <= 3600, `Session TTL must be positive and <= 3600, got: ${ttl}`);

  // 4. Session Retrieval
  const fetched = await getSession(token);
  assert.ok(fetched, 'Session record must be retrievable from Redis');
  assert.equal(fetched.userId, testUser);

  // 5. Session Validation
  const validation = await validateSession(token);
  assert.equal(validation.valid, true);
  assert.equal(validation.session?.userId, testUser);

  // 6. Session Touch
  const touched = await touchSession(token, 1800);
  assert.equal(touched, true);
  const newTtl = await client.ttl(formatSessionKey(token));
  assert.ok(newTtl > 0 && newTtl <= 1800, 'Touched TTL must be updated');

  // 7. Session Deletion (Logout)
  const deleted = await deleteSession(token);
  assert.equal(deleted, true);

  // 8. Confirm Absence
  const afterDelete = await validateSession(token);
  assert.equal(afterDelete.valid, false);
  assert.equal(afterDelete.error, 'not_found');

  // Cleanup client connection
  await closeRedisClient();
});

// ─── 6. Server Functions E2E (Demo Pipeline) ─────────────────────────────────

test('Redis Demo Server Functions: Live Ping and 10-Session Pipeline Verification', async (t) => {
  if (!isRedisConfigured()) {
    t.skip('Skipping live Redis server functions test: Redis unconfigured.');
    return;
  }

  // Test Ping Server Function
  const pingRes = await executeRedisPing();
  assert.equal(pingRes.success, true);
  assert.equal(pingRes.pong, 'PONG');
  assert.ok(typeof pingRes.latencyMs === 'number' && pingRes.latencyMs >= 0);

  // Test 10-Session Demonstration Server Function with auto-cleanup
  const demoRes = await executeRedisDemoSessions({
    cleanupAfterVerification: true,
  });

  assert.equal(demoRes.success, true);
  assert.equal(demoRes.totalUsers, 10);
  assert.equal(demoRes.createdCount, 10);
  assert.equal(demoRes.verifiedCount, 10);
  assert.equal(demoRes.failedCount, 0);
  assert.equal(demoRes.allPassed, true);
  assert.equal(demoRes.items.length, 10);
  assert.equal(demoRes.cleanedUp, true);

  // Verify item properties without leaking tokens
  for (const item of demoRes.items) {
    assert.match(item.userId, /^redis-test-user-\d{2}$/);
    assert.equal(item.sessionCreated, true);
    assert.equal(item.userVerified, true);
    assert.equal(item.ttlValid, true);
    assert.equal(item.passed, true);
    assert.match(item.maskedKey, /^greennext:session:[0-9a-f]{6}\.\.\.\[hidden\]\.\.\.[0-9a-f]{6}$/);
  }

  await closeRedisClient();
});
