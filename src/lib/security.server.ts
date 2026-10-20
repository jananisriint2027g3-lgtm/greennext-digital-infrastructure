import crypto from "node:crypto";

/**
 * GreenNext Enterprise Security Controller
 *
 * Architectural Boundary:
 *  - Responsible exclusively for security analysis, cryptographic verification,
 *    credential lifecycle evaluation, pattern analysis, and severity classification.
 *  - Dispatches security alert events through an abstracted notification interface.
 *  - NEVER contains email composition, SMTP logic, or mail transports.
 */

export type CredentialType = "password" | "static_api_key" | "dynamic_api_key";

export type SecuritySeverityLevel =
  | "LEVEL_1_BREACHED"
  | "LEVEL_2_COMPROMISED"
  | "LEVEL_3_OPERATIONAL_DEVIATION"
  | "LEVEL_4_INFORMATIONAL";

export interface SecurityFinding {
  code: string;
  severity: SecuritySeverityLevel;
  title: string;
  description: string;
  remediation: string;
  metadata?: Record<string, unknown>;
}

export interface CredentialEvaluationResult {
  isValid: boolean;
  type: CredentialType;
  entropyBits: number;
  findings: SecurityFinding[];
  recommendedSeverity: SecuritySeverityLevel;
  sanitizedIdentifier: string;
}

export interface DynamicKeyDescriptor {
  keyId: string;
  keySecret: string;
  issuedAt: number; // Unix ms
  expiresAt: number; // Unix ms
  scopes: string[];
  isRevoked?: boolean;
}

export interface SecurityAlertEvent {
  eventId: string;
  timestamp: string;
  severity: SecuritySeverityLevel;
  component: string;
  summary: string;
  findings: SecurityFinding[];
  sanitizedContext: Record<string, unknown>;
}

export interface SecurityNotifier {
  notify(alert: SecurityAlertEvent): Promise<{ accepted: boolean; messageId?: string }>;
}

/**
 * Standard known credential patterns for pattern analysis.
 * Values are strictly patterns/regexes; secrets are NEVER stored here.
 */
const KNOWN_KEY_PATTERNS = [
  { name: "GreenNext Live API Key", regex: /^gn_live_[a-zA-Z0-9]{32,64}$/ },
  { name: "GreenNext Test API Key", regex: /^gn_test_[a-zA-Z0-9]{32,64}$/ },
  { name: "Atlassian / Jira Token", regex: /^ATATT3[a-zA-Z0-9_-]{30,120}$/ },
  { name: "AWS Access Key ID", regex: /^(AKIA|ASIA|AROA)[A-Z0-9]{16}$/ },
  { name: "GitHub Personal Access Token", regex: /^(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}$/ },
  { name: "Generic High-Entropy Hex Key", regex: /^[a-fA-F0-9]{32,128}$/ },
  { name: "Generic Base64 Token", regex: /^[a-zA-Z0-9+/=]{40,128}$/ },
];

export class SecurityController {
  private notifier?: SecurityNotifier | undefined;

  constructor(notifier?: SecurityNotifier | undefined) {
    this.notifier = notifier;
  }

  /**
   * Sets or updates the notification delegate across the decoupled interface.
   */
  public setNotifier(notifier: SecurityNotifier): void {
    this.notifier = notifier;
  }

  // ------------------------------------------------------------------------
  // 1. CONSTANT-TIME HASHED API KEY VERIFICATION
  // ------------------------------------------------------------------------

  /**
   * Securely verifies a provided raw API key against a stored HMAC-SHA256 hex string.
   * Uses crypto.timingSafeEqual with strictly matched buffer lengths to prevent timing attacks.
   */
  public verifyHashedApiKey(providedKey: string, storedHmacHex: string, secretSalt: string): boolean {
    if (!providedKey || !storedHmacHex || !secretSalt) {
      return false;
    }

    try {
      // Calculate HMAC of provided key using the institutional secret salt
      const computedHmac = crypto.createHmac("sha256", secretSalt).update(providedKey.trim()).digest();
      const storedBuffer = Buffer.from(storedHmacHex.trim(), "hex");

      // timingSafeEqual requires buffers of identical length. If length differs, reject safely.
      if (computedHmac.length !== storedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(computedHmac, storedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Generates a secure HMAC-SHA256 representation of an API key for safe database storage.
   * One-way cryptographic hash: cannot be reversed back to original key.
   */
  public hashApiKey(rawKey: string, secretSalt: string): string {
    return crypto.createHmac("sha256", secretSalt).update(rawKey.trim()).digest("hex");
  }

  // ------------------------------------------------------------------------
  // 2. SHANNON ENTROPY & PATTERN ANALYSIS
  // ------------------------------------------------------------------------

  /**
   * Computes the Shannon entropy of a given string in bits per character.
   * High entropy (> 3.5 for hex, > 4.5 for alphanumeric) indicates cryptographic randomness.
   */
  public calculateShannonEntropy(value: string): number {
    if (!value || value.length === 0) return 0;

    const charFrequencies: Record<string, number> = {};
    for (const char of value) {
      charFrequencies[char] = (charFrequencies[char] || 0) + 1;
    }

    let entropy = 0;
    const len = value.length;

    for (const count of Object.values(charFrequencies)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return Math.round(entropy * 100) / 100;
  }

  /**
   * Sanitizes and masks a key, preserving only the prefix and suffix for safe logging.
   */
  public maskCredential(key: string): string {
    if (!key) return "[EMPTY]";
    if (key.length <= 8) return "********";
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}****${suffix}`;
  }

  /**
   * Evaluates key format against known industry patterns and entropy standards.
   */
  public analyzeKeyPattern(key: string): {
    matchedPattern: string;
    entropy: number;
    isHighEntropy: boolean;
    maskedValue: string;
  } {
    const trimmed = key.trim();
    const entropy = this.calculateShannonEntropy(trimmed);
    let matchedPattern = "Unrecognized Format";

    for (const item of KNOWN_KEY_PATTERNS) {
      if (item.regex.test(trimmed)) {
        matchedPattern = item.name;
        break;
      }
    }

    return {
      matchedPattern,
      entropy,
      isHighEntropy: entropy >= 3.2,
      maskedValue: this.maskCredential(trimmed),
    };
  }

  // ------------------------------------------------------------------------
  // 3. DYNAMIC / ROTATING API KEY LIFECYCLE
  // ------------------------------------------------------------------------

  /**
   * Verifies a dynamic rotating API key against validity window, revocation, and scope.
   */
  public verifyDynamicApiKey(
    descriptor: DynamicKeyDescriptor,
    requiredScope?: string,
    currentTimeMs = Date.now(),
  ): {
    isValid: boolean;
    reason: string;
    findings: SecurityFinding[];
  } {
    const findings: SecurityFinding[] = [];

    if (descriptor.isRevoked) {
      findings.push({
        code: "REVOKED_DYNAMIC_KEY",
        severity: "LEVEL_1_BREACHED",
        title: "Revoked Dynamic Key Presented",
        description: `Key ${descriptor.keyId} was explicitly revoked. Immediate investigation recommended.`,
        remediation: "Audit access logs and confirm unauthorized attempt origin.",
      });
      return { isValid: false, reason: "Key has been revoked", findings };
    }

    if (currentTimeMs > descriptor.expiresAt) {
      findings.push({
        code: "EXPIRED_DYNAMIC_KEY",
        severity: "LEVEL_3_OPERATIONAL_DEVIATION",
        title: "Dynamic Key Expired",
        description: `Key ${descriptor.keyId} expired at ${new Date(descriptor.expiresAt).toISOString()}.`,
        remediation: "Rotate credential and request a fresh ephemeral token.",
      });
      return { isValid: false, reason: "Key has expired", findings };
    }

    if (currentTimeMs < descriptor.issuedAt) {
      findings.push({
        code: "FUTURE_DATED_KEY",
        severity: "LEVEL_2_COMPROMISED",
        title: "Dynamic Key Issued in Future",
        description: `Key ${descriptor.keyId} indicates clock skew or synthetic fabrication.`,
        remediation: "Synchronize NTP clocks and investigate token issuer.",
      });
      return { isValid: false, reason: "Key issue timestamp is in future", findings };
    }

    if (requiredScope && !descriptor.scopes.includes(requiredScope) && !descriptor.scopes.includes("*")) {
      findings.push({
        code: "INSUFFICIENT_SCOPE",
        severity: "LEVEL_3_OPERATIONAL_DEVIATION",
        title: "Scope Enforcement Failure",
        description: `Key ${descriptor.keyId} lacks required scope: ${requiredScope}.`,
        remediation: "Assign minimal required permissions according to least privilege.",
      });
      return { isValid: false, reason: "Insufficient scope", findings };
    }

    return { isValid: true, reason: "Valid dynamic key", findings };
  }

  // ------------------------------------------------------------------------
  // 4. COMPREHENSIVE CREDENTIAL EVALUATION & SEVERITY CLASSIFICATION
  // ------------------------------------------------------------------------

  /**
   * Evaluates any credential according to the supervisor's 6 security dimensions:
   *  - User ID and Password
   *  - Static API Keys
   *  - Dynamic / Rotating API Keys
   *  - Hashed API Key Verification
   *  - Breached Credentials and Severity Levels
   *  - Pattern and Dynamic-Key Analysis
   */
  public evaluateCredentialSecurity(input: {
    type: CredentialType;
    value: string;
    keyAgeDays?: number;
    isPubliclyExposed?: boolean;
    isBreachedDumpMatch?: boolean;
  }): CredentialEvaluationResult {
    const { type, value, keyAgeDays = 0, isPubliclyExposed = false, isBreachedDumpMatch = false } = input;
    const findings: SecurityFinding[] = [];
    const entropy = this.calculateShannonEntropy(value);
    const masked = this.maskCredential(value);

    // LEVEL 1: Breached checks
    if (isBreachedDumpMatch || isPubliclyExposed) {
      findings.push({
        code: "ACTIVE_CREDENTIAL_BREACH",
        severity: "LEVEL_1_BREACHED",
        title: "Level 1 — Breached Credential (Active Compromise)",
        description: `Credential ${masked} was identified in a public code repository or active breach feed.`,
        remediation: "Execute emergency rotation immediately. Invalidate all active sessions and audit access logs.",
      });
    }

    // Dimension 1: Password handling
    if (type === "password") {
      if (value.length < 12) {
        findings.push({
          code: "PASSWORD_INSUFFICIENT_LENGTH",
          severity: "LEVEL_2_COMPROMISED",
          title: "Password Length Under Minimum Standard",
          description: "Password is shorter than 12 characters, making it vulnerable to brute-force attacks.",
          remediation: "Mandate at least 14 characters with mixed character classes or passphrase length.",
        });
      }
      if (entropy < 2.5) {
        findings.push({
          code: "PASSWORD_LOW_ENTROPY",
          severity: "LEVEL_3_OPERATIONAL_DEVIATION",
          title: "Password Predictability",
          description: "Password exhibits low Shannon entropy, indicating repeated or dictionary patterns.",
          remediation: "Use cryptographically generated passphrases or hardware security keys.",
        });
      }
    }

    // Dimension 2: Static API Keys
    if (type === "static_api_key") {
      if (keyAgeDays > 180) {
        findings.push({
          code: "STATIC_KEY_EXTREME_AGE",
          severity: "LEVEL_2_COMPROMISED",
          title: "Level 2 — Stale Static Key (> 180 Days)",
          description: `Static API key ${masked} has been active for ${keyAgeDays} days without rotation.`,
          remediation: "Rotate static key within 24 hours. Adopt automated dynamic key rotation.",
        });
      } else if (keyAgeDays > 90) {
        findings.push({
          code: "STATIC_KEY_NEEDS_ROTATION",
          severity: "LEVEL_3_OPERATIONAL_DEVIATION",
          title: "Level 3 — Unrotated Static Key (> 90 Days)",
          description: `Key ${masked} has exceeded the standard 90-day institutional rotation lifecycle.`,
          remediation: "Schedule credential rotation during next maintenance window.",
        });
      }

      if (entropy < 3.0) {
        findings.push({
          code: "STATIC_KEY_LOW_ENTROPY",
          severity: "LEVEL_2_COMPROMISED",
          title: "Insecure Static Key Entropy",
          description: "Static API key appears predictable or non-random, risking automated enumeration.",
          remediation: "Regenerate key using CSPRNG with minimum 256 bits of cryptographic entropy.",
        });
      }
    }

    // Dimension 3: Dynamic Keys
    if (type === "dynamic_api_key") {
      if (entropy < 3.2) {
        findings.push({
          code: "DYNAMIC_KEY_WEAK_RNG",
          severity: "LEVEL_3_OPERATIONAL_DEVIATION",
          title: "Dynamic Key Generator Entropy Concern",
          description: "Generated dynamic token does not meet cryptographic randomness baselines.",
          remediation: "Ensure the token generator uses crypto.randomBytes() or equivalent secure CSPRNG.",
        });
      }
    }

    // Determine highest severity
    let recommendedSeverity: SecuritySeverityLevel = "LEVEL_4_INFORMATIONAL";
    if (findings.some((f) => f.severity === "LEVEL_1_BREACHED")) {
      recommendedSeverity = "LEVEL_1_BREACHED";
    } else if (findings.some((f) => f.severity === "LEVEL_2_COMPROMISED")) {
      recommendedSeverity = "LEVEL_2_COMPROMISED";
    } else if (findings.some((f) => f.severity === "LEVEL_3_OPERATIONAL_DEVIATION")) {
      recommendedSeverity = "LEVEL_3_OPERATIONAL_DEVIATION";
    }

    return {
      isValid: findings.length === 0,
      type,
      entropyBits: entropy,
      findings,
      recommendedSeverity,
      sanitizedIdentifier: masked,
    };
  }

  // ------------------------------------------------------------------------
  // 5. DECOUPLED ALERT DISPATCH
  // ------------------------------------------------------------------------

  /**
   * Dispatches a security alert event to the configured notification service (MailController).
   * Does NOT send emails directly; communicates strictly via interface.
   */
  public async dispatchSecurityAlert(alert: {
    severity: SecuritySeverityLevel;
    component: string;
    summary: string;
    findings: SecurityFinding[];
    sanitizedContext?: Record<string, unknown>;
  }): Promise<{ dispatched: boolean; messageId?: string }> {
    if (!this.notifier) {
      return { dispatched: false };
    }

    const event: SecurityAlertEvent = {
      eventId: `sec_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      component: alert.component,
      summary: alert.summary,
      findings: alert.findings,
      sanitizedContext: alert.sanitizedContext || {},
    };

    try {
      const res = await this.notifier.notify(event);
      const ret: { dispatched: boolean; messageId?: string } = { dispatched: res.accepted };
      if (res.messageId !== undefined) {
        ret.messageId = res.messageId;
      }
      return ret;
    } catch {
      return { dispatched: false };
    }
  }
}
