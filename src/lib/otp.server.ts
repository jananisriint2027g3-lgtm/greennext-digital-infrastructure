/**
 * GreenNext Ebook Registration OTP Engine
 *
 * Implements high-security single-use 6-digit numeric OTP:
 * - 6-digit numeric code (100000 - 999999)
 * - 5-minute TTL (300 seconds)
 * - 5 incorrect attempts max (atomic rate limiting)
 * - 60-second resend cooldown
 * - Stores only SHA-256 hashed OTPs
 * - Immediate invalidation upon successful verification
 * - Uses Redis with in-memory TTL fallback
 */

import { createHash, randomInt } from "node:crypto";
import { getRedisClient, isRedisConfigured } from "./redis.server";

export const OTP_TTL_SECONDS = 300; // 5 minutes
export const OTP_COOLDOWN_SECONDS = 60; // 60 seconds
export const OTP_MAX_ATTEMPTS = 5;

const OTP_KEY_PREFIX = "greennext:ebook:otp:";
const OTP_ATTEMPTS_PREFIX = "greennext:ebook:otp-attempts:";
const OTP_COOLDOWN_PREFIX = "greennext:ebook:otp-cooldown:";

export interface OtpRecord {
  hashedOtp: string;
  email: string;
  uid: string;
  createdAt: number;
  expiresAt: number;
}

export interface OtpGenerationResult {
  success: boolean;
  code?: string;
  error?: string;
  cooldownRemaining?: number;
}

export interface OtpVerificationResult {
  success: boolean;
  status: "verified" | "invalid_code" | "expired" | "max_attempts_exceeded" | "error";
  error?: string;
  attemptsRemaining?: number;
  uid?: string;
}

// In-memory fallback for local dev / unconfigured Redis
interface MemoryEntry<T> {
  value: T;
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryEntry<any>>();

function cleanMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

function normalizeEmailKey(email: string): string {
  const norm = email.trim().toLowerCase();
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

function hashOtpValue(code: string, salt: string): string {
  return createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

function getOtpSalt(): string {
  return process.env["OTP_SECRET_SALT"] || process.env["REPORT_TRIGGER_SECRET"] || "gn_default_secure_salt_ebook";
}

/**
 * Generates a fresh 6-digit numeric OTP and stores its hash in Redis (or in-memory fallback).
 */
export async function generateEbookOtp(email: string, uid: string): Promise<OtpGenerationResult> {
  cleanMemoryStore();
  const emailKey = normalizeEmailKey(email);
  const cooldownKey = `${OTP_COOLDOWN_PREFIX}${emailKey}`;
  const otpKey = `${OTP_KEY_PREFIX}${emailKey}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${emailKey}`;

  const salt = getOtpSalt();
  const now = Date.now();

  if (isRedisConfigured()) {
    try {
      const client = await getRedisClient();
      // Check cooldown
      const existingCooldown = await client.ttl(cooldownKey);
      if (existingCooldown > 0) {
        return {
          success: false,
          error: `Please wait ${existingCooldown}s before requesting a new verification code.`,
          cooldownRemaining: existingCooldown,
        };
      }

      // Generate 6-digit code
      const numericCode = randomInt(100000, 1000000).toString();
      const hashed = hashOtpValue(numericCode, salt);

      const record: OtpRecord = {
        hashedOtp: hashed,
        email: email.trim().toLowerCase(),
        uid,
        createdAt: now,
        expiresAt: now + OTP_TTL_SECONDS * 1000,
      };

      // Set OTP with 5 min TTL
      await client.set(otpKey, JSON.stringify(record), { EX: OTP_TTL_SECONDS });
      // Set Cooldown with 60s TTL
      await client.set(cooldownKey, "1", { EX: OTP_COOLDOWN_SECONDS });
      // Reset attempts counter with 5 min TTL
      await client.set(attemptsKey, "0", { EX: OTP_TTL_SECONDS });

      return {
        success: true,
        code: numericCode,
      };
    } catch (redisErr) {
      console.warn("[OTP] Redis unavailable:", redisErr instanceof Error ? redisErr.message : redisErr);
      if (process.env["NODE_ENV"] === "production") {
        return {
          success: false,
          error: "Shared Redis session store is unavailable in production. In-memory OTP storage is disabled in production.",
        };
      }
    }
  } else if (process.env["NODE_ENV"] === "production") {
    return {
      success: false,
      error: "Shared Redis session store is not configured. Production requires Upstash/Redis for multi-instance OTP verification.",
    };
  }

  // Memory Fallback
  const cooldownEntry = memoryStore.get(cooldownKey);
  if (cooldownEntry && cooldownEntry.expiresAt > now) {
    const remaining = Math.ceil((cooldownEntry.expiresAt - now) / 1000);
    return {
      success: false,
      error: `Please wait ${remaining}s before requesting a new verification code.`,
      cooldownRemaining: remaining,
    };
  }

  const numericCode = randomInt(100000, 1000000).toString();
  const hashed = hashOtpValue(numericCode, salt);

  const record: OtpRecord = {
    hashedOtp: hashed,
    email: email.trim().toLowerCase(),
    uid,
    createdAt: now,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
  };

  memoryStore.set(otpKey, { value: record, expiresAt: now + OTP_TTL_SECONDS * 1000 });
  memoryStore.set(cooldownKey, { value: "1", expiresAt: now + OTP_COOLDOWN_SECONDS * 1000 });
  memoryStore.set(attemptsKey, { value: 0, expiresAt: now + OTP_TTL_SECONDS * 1000 });

  return {
    success: true,
    code: numericCode,
  };
}

/**
 * Validates the provided 6-digit OTP against the stored hash.
 * Enforces maximum 5 attempts, immediate invalidation on success, and eviction on max attempts.
 */
export async function verifyEbookOtp(email: string, candidateCode: string): Promise<OtpVerificationResult> {
  cleanMemoryStore();
  const emailKey = normalizeEmailKey(email);
  const otpKey = `${OTP_KEY_PREFIX}${emailKey}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${emailKey}`;
  const salt = getOtpSalt();
  const now = Date.now();

  const cleanCandidate = (candidateCode || "").trim();
  if (!/^\d{6}$/.test(cleanCandidate)) {
    return {
      success: false,
      status: "invalid_code",
      error: "Verification code must be exactly 6 digits.",
    };
  }

  const candidateHash = hashOtpValue(cleanCandidate, salt);

  if (isRedisConfigured()) {
    try {
      const client = await getRedisClient();

      // Check current attempts
      const rawAttempts = await client.get(attemptsKey);
      const currentAttempts = rawAttempts ? parseInt(rawAttempts, 10) : 0;
      if (currentAttempts >= OTP_MAX_ATTEMPTS) {
        // Evict expired / compromised code
        await client.del(otpKey);
        return {
          success: false,
          status: "max_attempts_exceeded",
          error: "Maximum verification attempts exceeded. Please request a new code.",
          attemptsRemaining: 0,
        };
      }

      // Retrieve stored record
      const rawRecord = await client.get(otpKey);
      if (!rawRecord) {
        return {
          success: false,
          status: "expired",
          error: "Verification code has expired or was not requested. Please request a new code.",
        };
      }

      let record: OtpRecord;
      try {
        record = JSON.parse(rawRecord) as OtpRecord;
      } catch {
        return { success: false, status: "error", error: "Corrupted verification session." };
      }

      // Check hash match
      if (record.hashedOtp === candidateHash) {
        // SUCCESS: Invalidate immediately to prevent replay
        await client.del(otpKey);
        await client.del(attemptsKey);
        return {
          success: true,
          status: "verified",
          uid: record.uid,
        };
      }

      // Failed match: Increment attempt counter
      const newAttempts = await client.incr(attemptsKey);
      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - newAttempts);
      if (remaining === 0) {
        await client.del(otpKey);
        return {
          success: false,
          status: "max_attempts_exceeded",
          error: "Incorrect code. Maximum attempts exceeded. Please request a new code.",
          attemptsRemaining: 0,
        };
      }

      return {
        success: false,
        status: "invalid_code",
        error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      };
    } catch (redisErr) {
      console.warn("[OTP] Redis check failed:", redisErr instanceof Error ? redisErr.message : redisErr);
      if (process.env["NODE_ENV"] === "production") {
        return {
          success: false,
          status: "error",
          error: "Shared Redis session store is unavailable in production. In-memory OTP verification is disabled in production.",
        };
      }
    }
  } else if (process.env["NODE_ENV"] === "production") {
    return {
      success: false,
      status: "error",
      error: "Shared Redis session store is not configured. Production requires Upstash/Redis for multi-instance OTP verification.",
    };
  }

  // Memory Fallback
  const attemptsEntry = memoryStore.get(attemptsKey);
  const currentAttempts = attemptsEntry ? (attemptsEntry.value as number) : 0;
  if (currentAttempts >= OTP_MAX_ATTEMPTS) {
    memoryStore.delete(otpKey);
    return {
      success: false,
      status: "max_attempts_exceeded",
      error: "Maximum verification attempts exceeded. Please request a new code.",
      attemptsRemaining: 0,
    };
  }

  const otpEntry = memoryStore.get(otpKey);
  if (!otpEntry || otpEntry.expiresAt <= now) {
    return {
      success: false,
      status: "expired",
      error: "Verification code has expired or was not requested. Please request a new code.",
    };
  }

  const record = otpEntry.value as OtpRecord;
  if (record.hashedOtp === candidateHash) {
    // Invalidate immediately
    memoryStore.delete(otpKey);
    memoryStore.delete(attemptsKey);
    return {
      success: true,
      status: "verified",
      uid: record.uid,
    };
  }

  const newAttempts = currentAttempts + 1;
  memoryStore.set(attemptsKey, { value: newAttempts, expiresAt: now + OTP_TTL_SECONDS * 1000 });
  const remaining = Math.max(0, OTP_MAX_ATTEMPTS - newAttempts);
  if (remaining === 0) {
    memoryStore.delete(otpKey);
    return {
      success: false,
      status: "max_attempts_exceeded",
      error: "Incorrect code. Maximum attempts exceeded. Please request a new code.",
      attemptsRemaining: 0,
    };
  }

  return {
    success: false,
    status: "invalid_code",
    error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
    attemptsRemaining: remaining,
  };
}

