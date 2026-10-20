import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import ts from "typescript";

function loadTsModule(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const securityModule = await loadTsModule("../src/lib/security.server.ts");
const mailModule = await loadTsModule("../src/lib/mail-controller.server.ts");

const { SecurityController } = securityModule;
const { MailController } = mailModule;

test("SecurityController: Constant-time Hashed API Key Verification", () => {
  const security = new SecurityController();
  const secretSalt = "gn_institutional_salt_test_2026";
  const validKey = "gn_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d";
  const invalidKey = "gn_live_00000000000000000000000000000000";

  const hashedKey = security.hashApiKey(validKey, secretSalt);

  // 1. Valid key must verify successfully
  assert.equal(security.verifyHashedApiKey(validKey, hashedKey, secretSalt), true);

  // 2. Tampered / invalid key must be rejected
  assert.equal(security.verifyHashedApiKey(invalidKey, hashedKey, secretSalt), false);

  // 3. Wrong salt must be rejected
  assert.equal(security.verifyHashedApiKey(validKey, hashedKey, "wrong_salt"), false);

  // 4. Empty or malformed inputs must return false safely without throwing
  assert.equal(security.verifyHashedApiKey("", hashedKey, secretSalt), false);
  assert.equal(security.verifyHashedApiKey(validKey, "", secretSalt), false);
  assert.equal(security.verifyHashedApiKey(validKey, "not_hex", secretSalt), false);
});

test("SecurityController: Shannon Entropy & Pattern Analysis", () => {
  const security = new SecurityController();

  // Low entropy repeated string
  const lowEntropy = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const lowEntBits = security.calculateShannonEntropy(lowEntropy);
  assert.equal(lowEntBits, 0);

  // High entropy random token
  const highEntropy = crypto.randomBytes(24).toString("hex");
  const highEntBits = security.calculateShannonEntropy(highEntropy);
  assert.ok(highEntBits >= 3.5, `Expected high entropy >= 3.5, got ${highEntBits}`);

  // Pattern detection: GreenNext live key
  const gnLiveKey = "gn_live_abcdef1234567890abcdef1234567890";
  const gnAnalysis = security.analyzeKeyPattern(gnLiveKey);
  assert.equal(gnAnalysis.matchedPattern, "GreenNext Live API Key");
  assert.equal(gnAnalysis.isHighEntropy, true);
  assert.ok(gnAnalysis.maskedValue.startsWith("gn_l****"));

  // Pattern detection: AWS Key ID
  const awsKey = "AKIAIOSFODNN7EXAMPLE";
  const awsAnalysis = security.analyzeKeyPattern(awsKey);
  assert.equal(awsAnalysis.matchedPattern, "AWS Access Key ID");

  // Pattern detection: Atlassian Jira token
  const jiraToken = "ATATT3xFfGF0123456789abcdefghijklmnopqrstuvwxyz";
  const jiraAnalysis = security.analyzeKeyPattern(jiraToken);
  assert.equal(jiraAnalysis.matchedPattern, "Atlassian / Jira Token");
});

test("SecurityController: Dynamic Key Verification Lifecycle", () => {
  const security = new SecurityController();
  const now = Date.now();

  const validKeyDescriptor = {
    keyId: "dyn_k_101",
    keySecret: "secret_val",
    issuedAt: now - 60000, // 1 min ago
    expiresAt: now + 3600000, // in 1 hour
    scopes: ["read:infrastructure", "write:telemetry"],
  };

  // 1. Normal active key
  const validCheck = security.verifyDynamicApiKey(validKeyDescriptor, "read:infrastructure", now);
  assert.equal(validCheck.isValid, true);

  // 2. Expired key
  const expiredCheck = security.verifyDynamicApiKey(validKeyDescriptor, "read:infrastructure", now + 4000000);
  assert.equal(expiredCheck.isValid, false);
  assert.equal(expiredCheck.findings[0]?.severity, "LEVEL_3_OPERATIONAL_DEVIATION");

  // 3. Revoked key (Level 1)
  const revokedCheck = security.verifyDynamicApiKey({ ...validKeyDescriptor, isRevoked: true }, "read:infrastructure", now);
  assert.equal(revokedCheck.isValid, false);
  assert.equal(revokedCheck.findings[0]?.severity, "LEVEL_1_BREACHED");

  // 4. Insufficient scope
  const scopeCheck = security.verifyDynamicApiKey(validKeyDescriptor, "admin:delete", now);
  assert.equal(scopeCheck.isValid, false);
  assert.equal(scopeCheck.findings[0]?.severity, "LEVEL_3_OPERATIONAL_DEVIATION");
});

test("SecurityController: Supervisor Severity Classification (Levels 1 to 4)", () => {
  const security = new SecurityController();

  // Level 1: Breached / Publicly Exposed
  const level1 = security.evaluateCredentialSecurity({
    type: "static_api_key",
    value: "gn_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    isPubliclyExposed: true,
  });
  assert.equal(level1.recommendedSeverity, "LEVEL_1_BREACHED");
  assert.equal(level1.isValid, false);

  // Level 2: Stale key > 180 days
  const level2 = security.evaluateCredentialSecurity({
    type: "static_api_key",
    value: "gn_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    keyAgeDays: 200,
  });
  assert.equal(level2.recommendedSeverity, "LEVEL_2_COMPROMISED");

  // Level 3: Unrotated key > 90 days
  const level3 = security.evaluateCredentialSecurity({
    type: "static_api_key",
    value: "gn_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    keyAgeDays: 100,
  });
  assert.equal(level3.recommendedSeverity, "LEVEL_3_OPERATIONAL_DEVIATION");

  // Level 4: Clean fresh high-entropy key
  const level4 = security.evaluateCredentialSecurity({
    type: "static_api_key",
    value: "gn_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
    keyAgeDays: 20,
  });
  assert.equal(level4.recommendedSeverity, "LEVEL_4_INFORMATIONAL");
  assert.equal(level4.isValid, true);
});

test("SecurityController & MailController Decoupled Event Boundary", async () => {
  let dispatchedMail = null;

  const mockTransport = {
    send: async (options) => {
      dispatchedMail = options;
      return { success: true, messageId: "mock_test_msg_123" };
    },
  };

  const mailController = new MailController(mockTransport);
  const securityController = new SecurityController(mailController);

  const rawKey = "gn_live_critical_secret_should_not_leak_99999";

  const alertResult = await securityController.dispatchSecurityAlert({
    severity: "LEVEL_1_BREACHED",
    component: "Jira-Webhook-Listener",
    summary: "Active API Key leak detected in public repository commit",
    findings: [
      {
        code: "ACTIVE_LEAK",
        severity: "LEVEL_1_BREACHED",
        title: "Leaked Credential Detected",
        description: `Key ${securityController.maskCredential(rawKey)} was discovered publicly.`,
        remediation: "Revoke key immediately and rotate secrets.",
      },
    ],
  });

  assert.equal(alertResult.dispatched, true);
  assert.ok(dispatchedMail, "MailController should receive composed email payload");
  assert.ok(dispatchedMail.subject.includes("[GreenNext Security LEVEL_1_BREACHED]"));

  // Verify STRICT SECRECY: raw key must NEVER appear in email body or subject
  assert.equal(dispatchedMail.htmlBody.includes(rawKey), false, "Raw secret leaked in HTML body!");
  assert.equal(dispatchedMail.plainTextBody.includes(rawKey), false, "Raw secret leaked in PlainText body!");
  assert.equal(dispatchedMail.subject.includes(rawKey), false, "Raw secret leaked in Subject!");

  // Masked string is present
  assert.ok(dispatchedMail.htmlBody.includes("gn_l****9999"));
});
