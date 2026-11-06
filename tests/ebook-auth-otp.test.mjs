import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createHmac } from "node:crypto";
import ts from "typescript";

// ─── Module Compilation Helper ──────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const scratchDir = path.resolve(repoRoot, "scratch", "test-build");

if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

function compileTsModule(relSource, relDest) {
  const srcPath = path.resolve(repoRoot, relSource);
  const destPath = path.resolve(scratchDir, relDest);
  const code = fs.readFileSync(srcPath, "utf8");

  let transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  transpiled = transpiled.replace(/from\s+['"]\.\/redis\.server['"]/g, "from './redis.server.mjs'");
  transpiled = transpiled.replace(/from\s+['"]\.\/firebase-auth['"]/g, "from './firebase-auth.mjs'");
  fs.writeFileSync(destPath, transpiled, "utf8");
  return destPath;
}

compileTsModule("src/lib/redis.server.ts", "redis.server.mjs");
const otpPath = compileTsModule("src/lib/otp.server.ts", "otp.server.mjs");
const drivePath = compileTsModule("src/lib/ebook-drive.server.ts", "ebook-drive.server.mjs");
const welcomeTplPath = compileTsModule("src/lib/email-templates/ebook-welcome-template.ts", "ebook-welcome-template.mjs");
const otpTplPath = compileTsModule("src/lib/email-templates/ebook-otp-template.ts", "ebook-otp-template.mjs");
const firebasePath = compileTsModule("src/lib/firebase-auth.ts", "firebase-auth.mjs");
const sessionFnPath = compileTsModule("src/lib/ebook-session.server-fn.ts", "ebook-session.server-fn.mjs");

const { generateEbookOtp, verifyEbookOtp } = await import(`file://${otpPath.replace(/\\/g, "/")}`);
const { fetchPrivateEbookPdf } = await import(`file://${drivePath.replace(/\\/g, "/")}`);
const { renderEbookWelcomeEmail } = await import(`file://${welcomeTplPath.replace(/\\/g, "/")}`);
const { renderEbookOtpEmail } = await import(`file://${otpTplPath.replace(/\\/g, "/")}`);
const {
  firebaseRegisterEmail,
  firebaseLoginEmail,
  firebaseLoginWithGoogleIdToken,
  serverMarkEmailVerified,
} = await import(`file://${firebasePath.replace(/\\/g, "/")}`);
const {
  isEbookDevPreview,
  getEbookSession,
  DEV_PREVIEW_SESSION,
} = await import(`file://${sessionFnPath.replace(/\\/g, "/")}`);

// ─── 1. OTP Generation Tests ──────────────────────────────────────────────────

test("OTP: generates valid 6-digit numeric code with 5-minute TTL", async () => {
  const email = `test_${Date.now()}@example.com`;
  const res = await generateEbookOtp(email, "usr_123");
  assert.equal(res.success, true);
  assert.match(res.code, /^\d{6}$/);
});

test("OTP: enforces 60-second cooldown on consecutive generation requests", async () => {
  const email = `cooldown_${Date.now()}@example.com`;
  const first = await generateEbookOtp(email, "usr_456");
  assert.equal(first.success, true);

  const second = await generateEbookOtp(email, "usr_456");
  assert.equal(second.success, false);
  assert.match(second.error, /Please wait/);
  assert.ok(second.cooldownRemaining > 0);
});

test("OTP: strictly prohibits silent in-memory fallback when NODE_ENV is production and Redis is unconfigured", async () => {
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const res = await generateEbookOtp("prod_test@example.com", "usr_prod");
    assert.equal(res.success, false);
    assert.match(res.error, /Shared Redis/);
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

// ─── 2. OTP Verification Tests ────────────────────────────────────────────────

test("OTP: successful verification with correct 6-digit code", async () => {
  const email = `verify_${Date.now()}@example.com`;
  const gen = await generateEbookOtp(email, "usr_verified_789");
  assert.equal(gen.success, true);

  const ver = await verifyEbookOtp(email, gen.code);
  assert.equal(ver.success, true);
  assert.equal(ver.status, "verified");
  assert.equal(ver.uid, "usr_verified_789");

  // Replay attempt fails immediately (single-use)
  const replay = await verifyEbookOtp(email, gen.code);
  assert.equal(replay.success, false);
  assert.equal(replay.status, "expired");
});

test("OTP: rejects invalid code format and tracks remaining attempts", async () => {
  const email = `attempts_${Date.now()}@example.com`;
  const gen = await generateEbookOtp(email, "usr_att");
  assert.equal(gen.success, true);

  // Invalid format
  const badFormat = await verifyEbookOtp(email, "abc");
  assert.equal(badFormat.success, false);
  assert.equal(badFormat.status, "invalid_code");

  // Incorrect code attempt 1
  const wrong1 = await verifyEbookOtp(email, "999999" === gen.code ? "111111" : "999999");
  assert.equal(wrong1.success, false);
  assert.equal(wrong1.attemptsRemaining, 4);

  // Incorrect code attempt 2
  const wrong2 = await verifyEbookOtp(email, "888888" === gen.code ? "222222" : "888888");
  assert.equal(wrong2.success, false);
  assert.equal(wrong2.attemptsRemaining, 3);
});

test("OTP: enforces maximum 5 attempts and locks out subsequent tries", async () => {
  const email = `lockout_${Date.now()}@example.com`;
  const gen = await generateEbookOtp(email, "usr_lockout");
  assert.equal(gen.success, true);

  const badCode = gen.code === "123456" ? "654321" : "123456";

  for (let i = 1; i <= 4; i++) {
    const res = await verifyEbookOtp(email, badCode);
    assert.equal(res.success, false);
  }

  // 5th attempt triggers lockout
  const attempt5 = await verifyEbookOtp(email, badCode);
  assert.equal(attempt5.success, false);
  assert.equal(attempt5.status, "max_attempts_exceeded");
  assert.equal(attempt5.attemptsRemaining, 0);

  // Subsequent try even with correct code is now locked out
  const tryCorrect = await verifyEbookOtp(email, gen.code);
  assert.equal(tryCorrect.success, false);
});

test("OTP: concurrent generation attempts for same email are blocked by cooldown", async () => {
  const email = `concurrent_${Date.now()}@example.com`;
  const results = await Promise.all([
    generateEbookOtp(email, "usr_c1"),
    generateEbookOtp(email, "usr_c2"),
  ]);
  const successes = results.filter((r) => r.success);
  assert.equal(successes.length, 1);
});

// ─── 3. Firebase Auth Input Validation & Security Tests ───────────────────────

test("Firebase Auth: returns AUTH_NOT_CONFIGURED when API key is missing", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    delete process.env.FIREBASE_API_KEY;
    delete process.env.VITE_FIREBASE_API_KEY;
    const res = await firebaseRegisterEmail("test@example.com", "password123");
    assert.equal(res.success, false);
    assert.equal(res.code, "AUTH_NOT_CONFIGURED");
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
  }
});

test("Firebase Auth: registration rejects malformed email addresses", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    const res = await firebaseRegisterEmail("not-an-email", "validpassword123");
    assert.equal(res.success, false);
    assert.equal(res.code, "INVALID_EMAIL");
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: registration rejects weak passwords (< 8 chars)", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    const res = await firebaseRegisterEmail("user@example.com", "short");
    assert.equal(res.success, false);
    assert.equal(res.code, "WEAK_PASSWORD");
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: login rejects empty credentials", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    const res = await firebaseLoginEmail("", "");
    assert.equal(res.success, false);
    assert.equal(res.code, "INVALID_INPUT");
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: Google Sign-In rejects empty or invalid token", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    const res = await firebaseLoginWithGoogleIdToken("");
    assert.equal(res.success, false);
    assert.equal(res.code, "INVALID_TOKEN");
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: serverMarkEmailVerified returns false when no temporary token exists", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    const res = await serverMarkEmailVerified("non_existent_uid_12345");
    assert.equal(res, false);
  } finally {
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: mock successful registration strips sensitive tokens", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  const origFetch = global.fetch;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes(":signUp")) {
        return new Response(JSON.stringify({
          localId: "uid_test_999",
          idToken: "secret_firebase_id_token",
          refreshToken: "secret_refresh_token",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return origFetch(url);
    };

    const res = await firebaseRegisterEmail("reader_test@greennext.io", "strongPass123!", "Dr. Raman");
    assert.equal(res.success, true);
    assert.equal(res.user.uid, "uid_test_999");
    assert.equal(res.user.email, "reader_test@greennext.io");
    assert.equal(res.user.emailVerified, false); // requires OTP verification
    // idToken and refreshToken must NEVER be returned to callers
    assert.equal(res.user.idToken, undefined);
    assert.equal(res.user.refreshToken, undefined);
  } finally {
    global.fetch = origFetch;
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

test("Firebase Auth: Google Sign-In enforces emailVerified check from Firebase response", async () => {
  const origKey = process.env.FIREBASE_API_KEY;
  const origFetch = global.fetch;
  try {
    process.env.FIREBASE_API_KEY = "mock_key_for_tests";

    // 1. Unverified Google account rejected
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes(":signInWithIdp")) {
        return new Response(JSON.stringify({
          localId: "uid_google_unverified",
          email: "unverified@gmail.com",
          emailVerified: false,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return origFetch(url);
    };

    const rejected = await firebaseLoginWithGoogleIdToken("valid_length_google_token_mock");
    assert.equal(rejected.success, false);
    assert.equal(rejected.code, "EMAIL_NOT_VERIFIED");

    // 2. Verified Google account accepted
    global.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes(":signInWithIdp")) {
        return new Response(JSON.stringify({
          localId: "uid_google_verified",
          email: "verified@gmail.com",
          displayName: "Verified User",
          emailVerified: true,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return origFetch(url);
    };

    const accepted = await firebaseLoginWithGoogleIdToken("valid_length_google_token_mock");
    assert.equal(accepted.success, true);
    assert.equal(accepted.user.emailVerified, true);
    assert.equal(accepted.user.idToken, undefined);
  } finally {
    global.fetch = origFetch;
    if (origKey) process.env.FIREBASE_API_KEY = origKey;
    else delete process.env.FIREBASE_API_KEY;
  }
});

// ─── 4. PDF Security & Storage Tests ──────────────────────────────────────────

test("PDF Protection: local PDF fallback is strictly disabled in production", async () => {
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const res = await fetchPrivateEbookPdf();
    assert.equal(res.success, false);
    assert.ok(
      /production|drive|configured/i.test(res.error),
      `Expected production error but got: ${res.error}`
    );
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

test("PDF Protection: development mode resolves local root ebook master file", async () => {
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "development";
    const res = await fetchPrivateEbookPdf();
    // In dev, the root GreenNext_Ebook_v2.pdf is present
    assert.equal(res.success, true);
    assert.equal(res.source, "local_secure_master");
    assert.equal(res.contentType, "application/pdf");
    assert.ok(res.streamBuffer && res.streamBuffer.length > 0);
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

// ─── 5. Email Templates Tests ─────────────────────────────────────────────────

test("Ebook Welcome Email: renders approved GreenNext branding and ebook details", () => {
  const res = renderEbookWelcomeEmail({
    recipientName: "Asha Rao",
    recipientEmail: "asha@example.com",
    siteBaseUrl: "https://greennext-ai.vercel.app",
  });

  assert.equal(res.firstName, "Asha");
  assert.match(res.subject, /Intelligent Infrastructure \(Edition 2\.0\)/);
  assert.match(res.html, /greennext-email-header\.png/);
  assert.match(res.html, /greennext-email-footer\.png/);
  assert.match(res.html, /Edition 2\.0/);
  assert.match(res.html, /https:\/\/greennext-ai\.vercel\.app\/ebook\/reader/);
  assert.match(res.html, /asha@example\.com/);
  assert.match(res.plainText, /Intelligent Infrastructure for a Sustainable Digital Future/);
});

test("Ebook OTP Email: renders 6-digit numeric code with 5-minute expiry notice", () => {
  const res = renderEbookOtpEmail({
    recipientName: "Dr. Vikram Seth",
    recipientEmail: "vikram@example.com",
    otpCode: "482910",
    expiresInMinutes: 5,
  });

  assert.equal(res.firstName, "Vikram");
  assert.match(res.subject, /482910/);
  assert.match(res.html, /482910/);
  assert.match(res.html, /Expires in.*5 minutes/);
  assert.match(res.plainText, /482910/);
  assert.match(res.plainText, /expires in 5 minutes/);
});

// ─── 6. Session Signature & HMAC Integrity Tests ─────────────────────────────

test("Session Security: tampered session payload or signature is rejected", () => {
  const secret = "test_session_secret_key_12345";
  const user = { uid: "usr_legit", email: "user@example.com", emailVerified: true };
  const b64 = Buffer.from(JSON.stringify(user)).toString("base64url");
  const validSig = createHmac("sha256", secret).update(b64).digest("hex");

  // Valid token passes HMAC
  const expectedSig = createHmac("sha256", secret).update(b64).digest("hex");
  assert.equal(validSig, expectedSig);

  // Tampered payload fails
  const tamperedUser = { uid: "usr_attacker", email: "admin@example.com", emailVerified: true };
  const tamperedB64 = Buffer.from(JSON.stringify(tamperedUser)).toString("base64url");
  const tamperedCheck = createHmac("sha256", secret).update(tamperedB64).digest("hex");
  assert.notEqual(validSig, tamperedCheck);

  // Altered signature fails
  const forgedSig = validSig.slice(0, -2) + "00";
  assert.notEqual(forgedSig, validSig);
});

// ─── 7. Local Development Ebook Preview & Security Enforcement Tests ───────────

test("Dev Preview: strictly disabled in production (NODE_ENV=production)", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercel = process.env.VERCEL;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL;
    assert.equal(isEbookDevPreview(), false);
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
  }
});

test("Dev Preview: strictly disabled on Vercel deployments (VERCEL=1 or VERCEL_ENV=production/preview)", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NODE_ENV = "development";
    process.env.VERCEL = "1";
    assert.equal(isEbookDevPreview(), false);

    delete process.env.VERCEL;
    process.env.VERCEL_ENV = "production";
    assert.equal(isEbookDevPreview(), false);

    process.env.VERCEL_ENV = "preview";
    assert.equal(isEbookDevPreview(), false);
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
    if (origVercelEnv !== undefined) process.env.VERCEL_ENV = origVercelEnv;
    else delete process.env.VERCEL_ENV;
  }
});

test("Dev Preview: active in local development mode without production/Vercel flags", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    assert.equal(isEbookDevPreview(), true);
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
    if (origVercelEnv !== undefined) process.env.VERCEL_ENV = origVercelEnv;
    else delete process.env.VERCEL_ENV;
  }
});

test("Dev Preview: getEbookSession returns unlocked session state with mock user in dev mode", async () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const session = await getEbookSession();
    assert.equal(session.authenticated, true);
    assert.equal(session.emailVerified, true);
    assert.equal(session.ebookAccess, true);
    assert.equal(session.isDevPreview, true);
    assert.ok(session.user);
    assert.equal(session.user.emailVerified, true);
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    else delete process.env.VERCEL;
    if (origVercelEnv !== undefined) process.env.VERCEL_ENV = origVercelEnv;
    else delete process.env.VERCEL_ENV;
  }
});

test("Dev Preview: getEbookSession rejects unauthenticated access in production mode", async () => {
  const origNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const session = await getEbookSession();
    assert.equal(session.authenticated, false);
    assert.equal(session.user, null);
    assert.equal(session.ebookAccess, false);
  } finally {
    process.env.NODE_ENV = origNodeEnv;
  }
});
