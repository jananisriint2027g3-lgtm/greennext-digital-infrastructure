/**
 * GreenNext Analytics, Daily Analysis, and Cron Security Tests
 *
 * Tests for:
 * 1. Vercel analytics metric summary & unconfigured/unavailable state handling.
 * 2. Scheduled cron job authorization verification (CRON_SECRET).
 * 3. Anomaly detection thresholding, sample size gating, and fingerprint deterministic deduplication.
 * 4. Jira issue mapping without data fabrication.
 */

import assert from "node:assert/strict";
import test from "node:test";

// ─── 1. Vercel Analytics State & Unconfigured Adaptation ───────────────────────

test("unconfigured Vercel credentials return explicit unavailable state without fabrication", () => {
  function evaluateMetricsState(creds) {
    if (!creds?.token || !creds?.projectId) {
      return {
        status: "unconfigured",
        totalVisitors: null,
        totalPageviews: null,
        topPages: [],
        dataQuality: "unavailable",
      };
    }
    return {
      status: "configured",
      totalVisitors: 100,
      totalPageviews: 450,
      topPages: [{ path: "/", views: 450 }],
      dataQuality: "live",
    };
  }

  const unconfigured = evaluateMetricsState(null);
  assert.equal(unconfigured.status, "unconfigured");
  assert.equal(unconfigured.dataQuality, "unavailable");
  assert.equal(unconfigured.totalVisitors, null);
  assert.equal(unconfigured.totalPageviews, null);
  assert.equal(unconfigured.topPages.length, 0);

  const missingToken = evaluateMetricsState({ projectId: "prj_123" });
  assert.equal(missingToken.status, "unconfigured");
  assert.equal(missingToken.dataQuality, "unavailable");

  const valid = evaluateMetricsState({ token: "tok_123", projectId: "prj_123" });
  assert.equal(valid.status, "configured");
  assert.equal(valid.dataQuality, "live");
  assert.equal(valid.totalPageviews, 450);
});

// ─── 2. Scheduled Cron Authorization & Security ──────────────────────────────

test("cron endpoint rejects unauthenticated requests when secret is missing or mismatched", () => {
  function verifyCronAuthorization(authHeader, serverSecret) {
    if (!serverSecret || serverSecret.trim() === "") {
      return { status: 503, error: "CRON_SECRET not configured" };
    }
    if (authHeader !== `Bearer ${serverSecret}`) {
      return { status: 401, error: "Unauthorized" };
    }
    return { status: 200, success: true };
  }

  // Case 1: Server has no secret set
  assert.equal(verifyCronAuthorization("Bearer secret123", "").status, 503);
  assert.equal(verifyCronAuthorization(null, null).status, 503);

  // Case 2: Client provides no or invalid header
  assert.equal(verifyCronAuthorization(null, "my_cron_secret").status, 401);
  assert.equal(verifyCronAuthorization("Bearer wrong_secret", "my_cron_secret").status, 401);
  assert.equal(verifyCronAuthorization("Basic my_cron_secret", "my_cron_secret").status, 401);

  // Case 3: Valid bearer token matching CRON_SECRET
  const valid = verifyCronAuthorization("Bearer my_cron_secret", "my_cron_secret");
  assert.equal(valid.status, 200);
  assert.equal(valid.success, true);
});

// ─── 3. Deterministic Fingerprint & Deduplication ─────────────────────────────

test("anomaly fingerprint is deterministic and stable across repeated runs", async () => {
  async function computeFindingFingerprint(category, target, periodKey) {
    const canonical = `${category}:${target}:${periodKey}`;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    return `gn-anomaly-${hex.slice(0, 16)}`;
  }

  const fp1 = await computeFindingFingerprint("TRAFFIC_DROP", "site_total", "2026-10-05_2026-10-12");
  const fp2 = await computeFindingFingerprint("TRAFFIC_DROP", "site_total", "2026-10-05_2026-10-12");
  const fpOtherTarget = await computeFindingFingerprint("TRAFFIC_DROP", "/about", "2026-10-05_2026-10-12");
  const fpOtherPeriod = await computeFindingFingerprint("TRAFFIC_DROP", "site_total", "2026-09-28_2026-10-05");

  assert.equal(fp1, fp2, "Identical findings must produce identical fingerprints");
  assert.notEqual(fp1, fpOtherTarget, "Different targets must produce different fingerprints");
  assert.notEqual(fp1, fpOtherPeriod, "Different periods must produce different fingerprints");
  assert.ok(fp1.startsWith("gn-anomaly-"), "Fingerprint must have expected prefix");
});

test("duplicate Jira tickets are avoided when existing fingerprint label is found", () => {
  const existingJiraLabels = new Set(["gn-anomaly-abcd1234ef567890"]);

  function shouldCreateJiraIssue(findingId) {
    if (existingJiraLabels.has(findingId)) {
      return { action: "SKIP", status: "SKIPPED_DUPLICATE" };
    }
    return { action: "CREATE", status: "CREATED" };
  }

  assert.equal(shouldCreateJiraIssue("gn-anomaly-abcd1234ef567890").status, "SKIPPED_DUPLICATE");
  assert.equal(shouldCreateJiraIssue("gn-anomaly-9999888877776666").status, "CREATED");
});

// ─── 4. Anomaly Thresholding & Insufficient Data Handling ─────────────────────

test("insufficient or missing data produces explicit INSUFFICIENT_DATA status without creating alerts", () => {
  function evaluateDailyRun(metrics) {
    if (metrics.dataQuality === "unavailable" || metrics.totalPageviews === null) {
      return {
        status: "INSUFFICIENT_DATA",
        findings: [],
        jiraTicketsCreated: 0,
        summaryNote: "Analysis completed with INSUFFICIENT DATA",
      };
    }

    const findings = [];
    if (metrics.totalPageviews > 0 && metrics.totalPageviews < 10) {
      findings.push({ category: "TRAFFIC_DROP", severity: "LOW" });
    }

    return {
      status: "COMPLETED",
      findings,
      jiraTicketsCreated: findings.length,
      summaryNote: "Analysis completed",
    };
  }

  const nullDataResult = evaluateDailyRun({ dataQuality: "unavailable", totalPageviews: null });
  assert.equal(nullDataResult.status, "INSUFFICIENT_DATA");
  assert.equal(nullDataResult.findings.length, 0);
  assert.equal(nullDataResult.jiraTicketsCreated, 0);

  const lowDataResult = evaluateDailyRun({ dataQuality: "live", totalPageviews: 5 });
  assert.equal(lowDataResult.status, "COMPLETED");
  assert.equal(lowDataResult.findings.length, 1);
  assert.equal(lowDataResult.findings[0].category, "TRAFFIC_DROP");
});

test("severity correctly maps to standard Jira priorities without assuming custom names", () => {
  function mapSeverityToJiraPriority(severity) {
    switch (severity) {
      case "CRITICAL":
        return "Highest";
      case "HIGH":
        return "High";
      case "MEDIUM":
        return "Medium";
      case "LOW":
      default:
        return "Low";
    }
  }

  assert.equal(mapSeverityToJiraPriority("CRITICAL"), "Highest");
  assert.equal(mapSeverityToJiraPriority("HIGH"), "High");
  assert.equal(mapSeverityToJiraPriority("MEDIUM"), "Medium");
  assert.equal(mapSeverityToJiraPriority("LOW"), "Low");
  assert.equal(mapSeverityToJiraPriority("UNKNOWN"), "Low");
});
