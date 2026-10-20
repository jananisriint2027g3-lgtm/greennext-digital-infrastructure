import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTsModule(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const client = await loadTsModule("../src/lib/visitor-email-apps-script.server.ts");
const tpl = await loadTsModule("../src/lib/email-templates/visitor-welcome-template.ts");
const { sendVisitorEmailViaAppsScript, validateVisitorEmailRequest } = client;

const SITE = "https://greennext-ai.vercel.app";
const REQ = (n) => `gn_req_${String(n).padStart(16, "0")}`;
const base = (over = {}) => ({
  name: "Asha Rao",
  email: "asha@example.com",
  formType: "quick_inquiry",
  category: "AI Infrastructure",
  requestId: REQ(1),
  ...over,
});
const cfg = (fetchImpl, extra = {}) => ({ url: "https://script.google.com/macros/s/TEST/exec", secret: "s3cret", fetchImpl, ...extra });
const okJson = (obj, status = 200) => new Response(JSON.stringify(obj), { status });

// ─── Website → Apps Script client (mocked fetch; no real email) ──────────────

for (const formType of ["quick_inquiry", "long_form_inquiry", "lead_inquiry"]) {
  test(`Apps Script email: successful ${formType} dispatch`, async () => {
    let seen;
    const res = await sendVisitorEmailViaAppsScript(
      base({ formType, requestId: REQ(formType.length) }),
      cfg(async (url, init) => {
        seen = { url, body: JSON.parse(init.body) };
        return okJson({ success: true, status: "sent", deliveryRef: "mailapp_1" });
      }),
    );
    assert.equal(res.success, true);
    assert.equal(res.status, "sent");
    assert.equal(seen.body.action, "dispatch_email");
    assert.equal(seen.body.formType, formType);
    assert.equal(seen.body.secret, "s3cret");
    // Caller never supplies HTML / subject / body: Apps Script renders the email itself.
    assert.equal("htmlBody" in seen.body || "subject" in seen.body || "html" in seen.body, false);
  });
}

test("Apps Script email: invalid payloads are rejected before any network call", async () => {
  let called = 0;
  const f = async () => (called++, okJson({ success: true }));
  for (const bad of [
    base({ email: "not-an-email" }),
    base({ name: "  " }),
    base({ formType: "other" }),
    base({ requestId: "bad id" }),
  ]) {
    const res = await sendVisitorEmailViaAppsScript(bad, cfg(f));
    assert.equal(res.success, false);
    assert.equal(res.status, "invalid");
  }
  assert.equal(called, 0);
  assert.equal(validateVisitorEmailRequest(base()), null);
});

test("Apps Script email: HTTP failure is reported as failure, not success", async () => {
  const res = await sendVisitorEmailViaAppsScript(base({ requestId: REQ(2) }), cfg(async () => new Response("x", { status: 500 })));
  assert.equal(res.success, false);
  assert.match(res.error, /HTTP 500/);
});

test("Apps Script email: non-JSON (sign-in page) response is a failure", async () => {
  const res = await sendVisitorEmailViaAppsScript(base({ requestId: REQ(3) }), cfg(async () => new Response("<html>Sign in</html>", { status: 200 })));
  assert.equal(res.success, false);
  assert.match(res.error, /non-JSON/);
});

test("Apps Script email: network error and timeout are failures and are NOT retried", async () => {
  let calls = 0;
  const net = await sendVisitorEmailViaAppsScript(base({ requestId: REQ(4) }), cfg(async () => (calls++, Promise.reject(new TypeError("boom")))));
  assert.equal(net.success, false);
  assert.equal(calls, 1);

  let timeoutCalls = 0;
  const slow = await sendVisitorEmailViaAppsScript(
    base({ requestId: REQ(5) }),
    cfg(
      (url, init) =>
        new Promise((_, reject) => {
          timeoutCalls++;
          init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
        }),
      { timeoutMs: 20 },
    ),
  );
  assert.equal(slow.success, false);
  assert.match(slow.error, /timed out/);
  assert.equal(timeoutCalls, 1);
});

test("Apps Script email: Apps Script rejection message is surfaced; secret never appears in result", async () => {
  const res = await sendVisitorEmailViaAppsScript(
    base({ requestId: REQ(6) }),
    cfg(async () => okJson({ success: false, status: "quota_exhausted", message: "Daily email quota exhausted." })),
  );
  assert.equal(res.success, false);
  assert.equal(res.status, "quota_exhausted");
  assert.equal(JSON.stringify(res).includes("s3cret"), false);
});

test("Apps Script email: missing configuration fails honestly (no simulation)", async () => {
  const res = await sendVisitorEmailViaAppsScript(base({ requestId: REQ(7) }), { url: " ", secret: "", fetchImpl: async () => okJson({}) });
  assert.equal(res.success, false);
  assert.equal(res.status, "not_configured");
});

test("Apps Script email: concurrent identical requests produce a single outbound call", async () => {
  let calls = 0;
  const f = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20));
    return okJson({ success: true, status: "sent" });
  };
  const input = base({ requestId: REQ(8) });
  const [a, b] = await Promise.all([sendVisitorEmailViaAppsScript(input, cfg(f)), sendVisitorEmailViaAppsScript(input, cfg(f))]);
  assert.equal(calls, 1);
  assert.equal(a.success && b.success, true);
  assert.equal(b.duplicate, true);
});

test("Resend is not referenced by the active visitor email path", () => {
  for (const file of ["../src/lib/visitor-email.server-fn.ts", "../src/lib/visitor-email-apps-script.server.ts"]) {
    const src = fs.readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/resend|RESEND_API_KEY|api\.resend\.com|ResendMailTransport/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")), false, file);
  }
});

test("Inquiry flows: confirmation failure is isolated from persistence and Jira", () => {
  const src = fs.readFileSync(new URL("../src/lib/inquiry.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("async function sendVisitorConfirmation"), src.indexOf("/** Shared website-side lead payload"));
  assert.ok(fn.includes("try {") && fn.includes("catch (emailErr)"), "email errors are caught");
  assert.equal(/throw /.test(fn), false, "email errors are never re-thrown");
  // Each flow persists once (postInquiryPayload) and has exactly one Jira call, regardless of email outcome.
  for (const fnName of ["submitLead", "submitQuickInquiry", "submitLongFormInquiry"]) {
    const start = src.indexOf(`export async function ${fnName}`);
    const body = src.slice(start, src.indexOf("\n}\n", start));
    assert.equal((body.match(/postInquiryPayload\(/g) || []).length, 1, `${fnName} persists once`);
    assert.equal((body.match(/submitTechnicalInfrastructureInquiryToJira\(/g) || []).length, 1, `${fnName} creates one Jira record`);
    assert.equal((body.match(/sendVisitorConfirmation\(/g) || []).length, 1, `${fnName} sends one confirmation`);
  }
});

// ─── Apps Script (VisitorEmail.gs) executed in a VM with Google service mocks ─

function fakeSheet(name, headers) {
  const rows = [headers];
  return {
    rows,
    getName: () => name,
    getLastRow: () => rows.length,
    getLastColumn: () => headers.length,
    appendRow: (r) => rows.push(r.slice()),
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? "")),
      getValue: () => (rows[r - 1] || [])[c - 1] ?? "",
      setValues: (vals) => vals.forEach((v, i) => v.forEach((x, j) => ((rows[r - 1 + i] = rows[r - 1 + i] || []), (rows[r - 1 + i][c - 1 + j] = x)))),
    }),
  };
}

function loadGas({ quota = 100, sendError = null } = {}) {
  const sheets = {
    Quick_Inquiries: fakeSheet("Quick_Inquiries", ["Timestamp", "Event", "Name", "Email", "Phone", "Interest", "Message", "Page", "Session ID", "Session Kind", "Request ID"]),
    Contact_Submissions: fakeSheet("Contact_Submissions", ["Timestamp", "Event", "Name", "Email", "Phone", "Organization", "Category", "Region", "Message", "Page", "Session ID", "Session Kind", "Request ID"]),
    Lead_Submissions: fakeSheet("Lead_Submissions", ["Timestamp", "Lead Type", "Name", "Email", "Phone", "Organization", "Region", "Topic", "Message", "Page", "Session ID", "Session Kind", "Doc", "Doc Name", "Doc Mime", "Status", "Request ID"]),
  };
  const sent = [];
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = fakeSheet(n, [])),
  };
  const sandbox = {
    RAW_DATA_SPREADSHEET_ID: "TEST",
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ({ REPORT_TRIGGER_SECRET: "s3cret" })[k] || null }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: { openById: () => ss },
    MailApp: {
      getRemainingDailyQuota: () => quota - sent.length,
      sendEmail: (o) => {
        if (sendError) throw new Error(sendError);
        sent.push(o);
      },
    },
    Utilities: { formatDate: () => "2026-10-20 19:00:00" },
    Logger: { log() {} },
    jsonResponse: (success, message, extra) => ({ success, message, ...(extra || {}) }),
    getOrCreateSheet: (s, name, headers) => {
      const existing = s.getSheetByName(name);
      if (existing) return existing;
      const created = fakeSheet(name, headers);
      sheets[name] = created;
      return created;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(new URL("../google-apps-script/VisitorEmail.gs", import.meta.url), "utf8"), sandbox);
  return { sandbox, sheets, sent };
}

function seedInquiry(sheets, formType, requestId, email, extra = {}) {
  if (formType === "quick_inquiry") sheets.Quick_Inquiries.rows.push(["t", "e", "Asha Rao", email, "", "AI Infrastructure", "m", "/", "s", "k", requestId]);
  if (formType === "long_form_inquiry") sheets.Contact_Submissions.rows.push(["t", "e", "Asha Rao", email, "", "", "Energy & Thermal", "r", "m", "/", "s", "k", requestId]);
  if (formType === "lead_inquiry") sheets.Lead_Submissions.rows.push(["t", extra.leadType || "Career Inquiry", "Asha Rao", email, "", "", "", "Careers", "m", "/", "s", "k", "No", "", "", "", requestId]);
}

const call = (g, over = {}) =>
  g.sandbox.handleDispatchEmailAction({
    secret: "s3cret",
    name: "Asha Rao",
    email: "asha@example.com",
    formType: "quick_inquiry",
    category: "AI Infrastructure",
    requestId: REQ(100),
    ...over,
  });

for (const formType of ["quick_inquiry", "long_form_inquiry", "lead_inquiry"]) {
  test(`Apps Script action: sends ${formType} confirmation, logs SENT, blocks duplicate`, () => {
    const g = loadGas();
    const requestId = REQ(200 + formType.length);
    seedInquiry(g.sheets, formType, requestId, "asha@example.com");
    const r1 = call(g, { formType, requestId });
    assert.equal(r1.success, true, JSON.stringify(r1));
    assert.equal(r1.status, "sent");
    assert.equal(g.sent.length, 1);
    assert.equal(g.sent[0].to, "asha@example.com");
    assert.ok(g.sent[0].htmlBody.includes("Hello Asha,"));
    assert.ok(g.sent[0].body.includes("What happens next"));
    const log = g.sheets.Email_Log.rows;
    assert.equal(log[1][4], "SENT");
    assert.equal(log[1][3], "a***@example.com", "full address is not stored in the log");

    const r2 = call(g, { formType, requestId });
    assert.equal(r2.success, true);
    assert.equal(r2.duplicate, true);
    assert.equal(g.sent.length, 1, "retry must not send a second copy");
  });
}

test("Apps Script action: rejects wrong/missing secret and sends nothing", () => {
  const g = loadGas();
  seedInquiry(g.sheets, "quick_inquiry", REQ(100), "asha@example.com");
  assert.equal(call(g, { secret: "wrong" }).status, "unauthorized");
  assert.equal(call(g, { secret: "" }).status, "unauthorized");
  assert.equal(g.sent.length, 0);
});

test("Apps Script action: not an open relay (unknown request or mismatched email is refused)", () => {
  const g = loadGas();
  seedInquiry(g.sheets, "quick_inquiry", REQ(100), "asha@example.com");
  assert.equal(call(g, { requestId: REQ(999) }).success, false);
  assert.equal(call(g, { email: "victim@example.com" }).success, false);
  assert.equal(g.sent.length, 0);
});

test("Apps Script action: validates payload and rejects malformed email", () => {
  const g = loadGas();
  seedInquiry(g.sheets, "quick_inquiry", REQ(100), "asha@example.com");
  for (const bad of [{ email: "nope" }, { name: "" }, { formType: "x" }, { requestId: "bad" }]) {
    const r = call(g, bad);
    assert.equal(r.success, false);
    assert.equal(r.status, "invalid");
  }
  assert.equal(g.sent.length, 0);
});

test("Apps Script action: quota exhaustion and send failures are reported clearly and logged", () => {
  const q = loadGas({ quota: 0 });
  seedInquiry(q.sheets, "quick_inquiry", REQ(100), "asha@example.com");
  const rq = call(q);
  assert.equal(rq.success, false);
  assert.equal(rq.status, "quota_exhausted");

  const f = loadGas({ sendError: "You do not have permission to call MailApp.sendEmail" });
  seedInquiry(f.sheets, "quick_inquiry", REQ(100), "asha@example.com");
  const rf = call(f);
  assert.equal(rf.success, false);
  assert.match(rf.message, /authorizeVisitorEmail/);
  assert.equal(f.sheets.Email_Log.rows[1][4], "FAILED");
  // A FAILED attempt may be retried (nothing was delivered).
  f.sandbox.MailApp.sendEmail = (o) => f.sent.push(o);
  assert.equal(call(f).success, true);
  assert.equal(f.sent.length, 1);
});

// ─── Template parity: Apps Script port must match the TypeScript template ────

test("Template parity: Apps Script render matches TypeScript template (branding, greeting, links)", () => {
  const g = loadGas();
  const cases = [
    { formType: "quick_inquiry", category: "AI Infrastructure" },
    { formType: "long_form_inquiry", category: "Energy & Thermal Telemetry" },
    { formType: "lead_inquiry", leadType: "Partner / Collaboration Inquiry", category: "Partnership" },
    { formType: "lead_inquiry", leadType: "Career Inquiry", category: "Careers" },
    { formType: "quick_inquiry", category: "Modular Data Center Solutions" },
    { formType: "quick_inquiry", category: "Something unknown" },
  ];
  for (const c of cases) {
    const gas = g.sandbox.renderVisitorEmail({ name: "Dr. asha <b>rao</b>", ...c });
    const ts_ = tpl.renderVisitorWelcomeEmail({
      recipientName: "Dr. asha <b>rao</b>",
      recipientEmail: "asha@example.com",
      formType: c.formType,
      leadType: c.leadType,
      categoryOrTopic: c.category,
      siteBaseUrl: SITE,
    });
    assert.equal(gas.subject, ts_.subject);
    const norm = (h) => h.replace(/\s+/g, " ").replace(/> </g, "><").trim();
    assert.equal(norm(gas.html), norm(ts_.html));
    assert.equal(gas.plainText, ts_.plainText);
  }
  const r = g.sandbox.renderVisitorEmail({ name: "Asha Rao", formType: "quick_inquiry", category: "AI" });
  assert.ok(r.html.includes(`${SITE}/images/email/greennext-email-header.png`));
  assert.ok(r.html.includes(`${SITE}/images/email/greennext-email-footer.png`));
  assert.ok(r.html.includes("Hello Asha,"));
  assert.ok(r.html.includes(`href="${SITE}/contact"`));
  assert.equal(/greennext\.internal|localhost/.test(r.html + r.plainText), false);
  assert.equal(g.sandbox.renderVisitorEmail({ name: "<script>x</script>", formType: "quick_inquiry" }).html.includes("<script>"), false);
});

test("Email image assets referenced by the template exist in public/", () => {
  for (const f of ["greennext-email-header.png", "greennext-email-footer.png"]) {
    assert.ok(fs.existsSync(new URL(`../public/images/email/${f}`, import.meta.url)), f);
  }
});
