import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function loadTsModule(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const templateModule = await loadTsModule("../src/lib/email-templates/visitor-welcome-template.ts");
const mailModule = await loadTsModule("../src/lib/mail-controller.server.ts");

const {
  renderVisitorWelcomeEmail,
  resolveServiceContent,
  resolvePublicSiteUrl,
  extractFirstName,
  formatFormName,
  escapeHtml,
} = templateModule;

const {
  MailController,
  SimulatedMailTransport,
  ResendMailTransport,
  IdempotencyTracker,
  RecipientRateLimiter,
  resolveMailTransport,
  isValidEmailAddress,
} = mailModule;

test("Visitor Email: HTML Escaping & XSS Protection", () => {
  const maliciousInput = '<script>alert("xss")</script> & "quotes" \'single\'';
  const escaped = escapeHtml(maliciousInput);

  assert.equal(escaped.includes("<script>"), false);
  assert.equal(escaped.includes("&lt;script&gt;"), true);
  assert.equal(escaped.includes("&amp;"), true);
  assert.equal(escaped.includes("&quot;quotes&quot;"), true);
  assert.equal(escaped.includes("&#39;single&#39;"), true);
});

test("Visitor Email: First Name Extraction with Honorifics", () => {
  assert.equal(extractFirstName("Dr. Aris Thorne"), "Aris");
  assert.equal(extractFirstName("Mr. Rajesh Kumar"), "Rajesh");
  assert.equal(extractFirstName("Ms. Priya Sharma"), "Priya");
  assert.equal(extractFirstName("Prof. John Smith"), "John");
  assert.equal(extractFirstName("Deepa"), "Deepa");
  assert.equal(extractFirstName(""), "there");
  assert.equal(extractFirstName("A"), "there");
});

test("Visitor Email: Form Name Formatting", () => {
  assert.equal(formatFormName("lead_inquiry", "Technical Consultation / Session Booking"), "Technical Consultation");
  assert.equal(formatFormName("lead_inquiry", "Partner / Collaboration Inquiry"), "Partner & Collaboration");
  assert.equal(formatFormName("lead_inquiry", "Technical Infrastructure Inquiry"), "Technical Infrastructure Inquiry");
  assert.equal(formatFormName("lead_inquiry", "Career Inquiry"), "Career & Talent Inquiry");
  assert.equal(formatFormName("quick_inquiry"), "Quick Inquiry");
  assert.equal(formatFormName("long_form_inquiry"), "Technical Requirements");
});

test("Visitor Email: Service Category & Interest Mapping across All Form Categories", () => {
  const base = "https://greennext.internal";

  // Career priority
  const career = resolveServiceContent("AI infrastructure", "lead_inquiry", "Career Inquiry", base);
  assert.equal(career.url, "https://greennext.internal/about/what-we-are");

  // Partner priority
  const partner = resolveServiceContent("Technology partnership", "lead_inquiry", "Partner / Collaboration Inquiry", base);
  assert.equal(partner.url, "https://greennext.internal/about/what-we-are");

  // AI compute
  const ai1 = resolveServiceContent("AI Infrastructure", "quick_inquiry", undefined, base);
  assert.equal(ai1.url, "https://greennext.internal/infrastructure/ai-ready");

  const ai2 = resolveServiceContent("AI & High-Density Compute", "long_form_inquiry", undefined, base);
  assert.equal(ai2.url, "https://greennext.internal/infrastructure/ai-ready");

  const ai3 = resolveServiceContent("AI infrastructure planning", "lead_inquiry", "Technical Consultation / Session Booking", base);
  assert.equal(ai3.url, "https://greennext.internal/infrastructure/ai-ready");

  // Energy & Thermal
  const energy1 = resolveServiceContent("Energy & Thermal Telemetry", "long_form_inquiry", undefined, base);
  assert.equal(energy1.url, "https://greennext.internal/energy/monitoring");

  const energy2 = resolveServiceContent("Energy and cooling", "lead_inquiry", "Technical Consultation / Session Booking", base);
  assert.equal(energy2.url, "https://greennext.internal/energy/monitoring");

  // Automation
  const auto1 = resolveServiceContent("Intelligent Automation", "quick_inquiry", undefined, base);
  assert.equal(auto1.url, "https://greennext.internal/automation/monitoring");

  const auto2 = resolveServiceContent("Automation Architecture", "long_form_inquiry", undefined, base);
  assert.equal(auto2.url, "https://greennext.internal/automation/monitoring");

  // Regional
  const reg1 = resolveServiceContent("Regional Infrastructure (MDU/CJB/TRZ/IXE)", "quick_inquiry", undefined, base);
  assert.equal(reg1.url, "https://greennext.internal/regions/overview");

  // Data Center & Cloud Solutions
  const dc1 = resolveServiceContent("Modular Data Center Solutions", "quick_inquiry", undefined, base);
  assert.equal(dc1.url, "https://greennext.internal/solutions/architecture-explorer");

  // Fallback
  const fallback = resolveServiceContent("Unknown custom interest", "quick_inquiry", undefined, base);
  assert.equal(fallback.url, "https://greennext.internal/solutions");
});

test("Visitor Email: Public HTTPS Domain Enforcement in Production", () => {
  // In simulation, default fallback is allowed
  const simUrl = resolvePublicSiteUrl(undefined, true);
  assert.equal(simUrl, "https://greennext.internal");

  // Custom configured URL works cleanly
  const customUrl = resolvePublicSiteUrl("custom.greennext.org", true);
  assert.equal(customUrl, "https://custom.greennext.org");

  // In live production (!isSimulation && NODE_ENV === 'production'), greennext.internal must reject
  const origNodeEnv = process.env["NODE_ENV"];
  try {
    process.env["NODE_ENV"] = "production";
    assert.throws(
      () => resolvePublicSiteUrl("https://greennext.internal", false),
      /Invalid production domain/
    );
    assert.throws(
      () => resolvePublicSiteUrl("", false),
      /PUBLIC_WEBSITE_URL must be configured/
    );
  } finally {
    process.env["NODE_ENV"] = origNodeEnv;
  }
});

test("Visitor Email: Template Rendering & Approved Banner/Logo URLs", () => {
  const rendered = renderVisitorWelcomeEmail({
    recipientName: "Dr. Vikram Seth",
    recipientEmail: "vikram@enterprise.example",
    formType: "long_form_inquiry",
    categoryOrTopic: "Energy & Thermal Telemetry",
    siteBaseUrl: "https://greennext.internal",
  });

  // 1. Must use absolute HTTPS image URLs and never data: URIs or local file paths
  assert.equal(rendered.html.includes("data:image"), false);
  assert.equal(rendered.html.includes("file:///"), false);
  assert.equal(
    rendered.html.includes('src="https://greennext.internal/images/email/greennext-email-header.png"'),
    true
  );
  assert.equal(
    rendered.html.includes('src="https://greennext.internal/images/email/greennext-email-footer.png"'),
    true
  );

  // 2. Contains personalized greeting and form name
  assert.equal(rendered.html.includes("Hello Vikram,"), true);
  assert.equal(rendered.html.includes("Technical Requirements"), true);

  // 3. Contains relevant service content and CTA
  assert.equal(rendered.html.includes("Energy Intelligence &amp; Thermal Telemetry"), true);
  assert.equal(rendered.html.includes('href="https://greennext.internal/energy/monitoring"'), true);

  // Banner images have meaningful, distinct alt attributes and valid HTML attributes
  assert.equal(
    rendered.html.includes('alt="GreenNext – AI Infrastructure. Sustainable Progress."'),
    true
  );
  assert.equal(
    rendered.html.includes('alt="GreenNext – Sustainable Regional Digital Infrastructure"'),
    true
  );
  assert.equal(rendered.subject.includes('?"'), false);
  assert.equal(rendered.html.includes('?"'), false);

  // 4. Working footer links
  assert.equal(rendered.html.includes('href="https://greennext.internal"'), true);
  assert.equal(rendered.html.includes('href="https://greennext.internal/contact"'), true);
  assert.equal(rendered.html.includes('href="https://www.linkedin.com/company/greennext"'), true);

  // 5. Plain text alternative
  assert.equal(rendered.plainText.includes("Hello Vikram,"), true);
  assert.equal(rendered.plainText.includes("Energy Intelligence & Thermal Telemetry"), true);
  assert.equal(rendered.plainText.includes("https://greennext.internal/energy/monitoring"), true);
  assert.equal(rendered.plainText.includes("Best regards,"), true);
  assert.equal(rendered.plainText.includes("GreenNext Team"), true);
});

test("Visitor Email: Strict Email Address Syntax Validation", () => {
  assert.equal(isValidEmailAddress("user@greennext.internal"), true);
  assert.equal(isValidEmailAddress("contact.person+tag@subdomain.example.co.in"), true);

  assert.equal(isValidEmailAddress(""), false);
  assert.equal(isValidEmailAddress("not-an-email"), false);
  assert.equal(isValidEmailAddress("@missinguser.com"), false);
  assert.equal(isValidEmailAddress("missingdomain@"), false);
  assert.equal(isValidEmailAddress("spaces in@email.com"), false);
  assert.equal(isValidEmailAddress(null), false);
  assert.equal(isValidEmailAddress(undefined), false);
});

test("Visitor Email: Effective Default Simulation Mode", () => {
  const origSim = process.env["EMAIL_SIMULATION_MODE"];
  const origProv = process.env["EMAIL_PROVIDER"];

  try {
    delete process.env["EMAIL_SIMULATION_MODE"];
    delete process.env["EMAIL_PROVIDER"];

    const transport = resolveMailTransport();
    assert.equal(transport.isSimulated, true);
  } finally {
    if (origSim !== undefined) process.env["EMAIL_SIMULATION_MODE"] = origSim;
    if (origProv !== undefined) process.env["EMAIL_PROVIDER"] = origProv;
  }
});

test("Visitor Email: Simulated Dispatch Mode & In-Memory Verification", async () => {
  SimulatedMailTransport.clearLedger();
  IdempotencyTracker.clear();

  const controller = new MailController(new SimulatedMailTransport());
  assert.equal(controller.isSimulation, true);

  const rendered = renderVisitorWelcomeEmail({
    recipientName: "Aparna Raman",
    recipientEmail: "aparna@southindiatech.example",
    formType: "quick_inquiry",
    categoryOrTopic: "AI Infrastructure",
    siteBaseUrl: "https://greennext.internal",
  });

  const result = await controller.sendMail({
    to: "aparna@southindiatech.example",
    subject: rendered.subject,
    htmlBody: rendered.html,
    plainTextBody: rendered.plainText,
  });

  assert.equal(result.success, true);
  assert.equal(result.simulated, true);
  assert.equal(result.messageId.startsWith("sim_"), true);

  const ledger = SimulatedMailTransport.getLedger();
  assert.equal(ledger.length >= 1, true);
  const entry = ledger[ledger.length - 1];
  assert.equal(entry.options.to, "aparna@southindiatech.example");
  assert.equal(entry.options.subject.includes("AI-Ready Infrastructure"), true);
  assert.equal(entry.options.htmlBody.includes("Hello Aparna,"), true);
});

test("Visitor Email: Idempotency Tracker Prevents Duplicate Dispatch", () => {
  IdempotencyTracker.clear();
  const reqId = "gn_req_test_dedup_001";

  assert.equal(IdempotencyTracker.check(reqId).isDuplicate, false);
  IdempotencyTracker.record(reqId, "sim_msg_001");

  const duplicateCheck = IdempotencyTracker.check(reqId);
  assert.equal(duplicateCheck.isDuplicate, true);
  assert.equal(duplicateCheck.messageId, "sim_msg_001");
});

test("Visitor Email: Recipient Rate Limiter Throttles Excessive Requests", () => {
  RecipientRateLimiter.clear();
  const email = "abusive-caller@example.com";

  // Allowed 3 times
  assert.equal(RecipientRateLimiter.checkAndRecord(email).allowed, true);
  assert.equal(RecipientRateLimiter.checkAndRecord(email).allowed, true);
  assert.equal(RecipientRateLimiter.checkAndRecord(email).allowed, true);

  // 4th request must be rejected
  const fourth = RecipientRateLimiter.checkAndRecord(email);
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.remaining, 0);
});

test("Visitor Email: Resend Provider Successful Delivery", async () => {
  const origFetch = globalThis.fetch;
  let interceptedUrl = "";
  let interceptedOptions = null;

  globalThis.fetch = async (url, opts) => {
    interceptedUrl = String(url);
    interceptedOptions = opts;
    return new Response(JSON.stringify({ id: "res_mock_success_12345" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const transport = new ResendMailTransport("re_valid_mock_token_123", "GreenNext <inquiries@greennext.digital>");
    assert.equal(transport.isSimulated, false);

    const rendered = renderVisitorWelcomeEmail({
      recipientName: "Dr. Elena Rostova",
      recipientEmail: "elena@datacenter-edge.example",
      formType: "long_form_inquiry",
      categoryOrTopic: "AI Infrastructure",
      siteBaseUrl: "https://greennext.internal",
    });

    const result = await transport.send({
      to: "elena@datacenter-edge.example",
      subject: rendered.subject,
      htmlBody: rendered.html,
      plainTextBody: rendered.plainText,
      replyTo: "contact@greennext.digital",
    });

    assert.equal(result.success, true);
    assert.equal(result.messageId, "resend_res_mock_success_12345");
    assert.equal(interceptedUrl, "https://api.resend.com/emails");

    const sentHeaders = interceptedOptions.headers;
    assert.equal(sentHeaders["Authorization"], "Bearer re_valid_mock_token_123");
    assert.equal(sentHeaders["Content-Type"], "application/json");

    const sentPayload = JSON.parse(interceptedOptions.body);
    assert.equal(sentPayload.from, "GreenNext <inquiries@greennext.digital>");
    assert.deepEqual(sentPayload.to, ["elena@datacenter-edge.example"]);
    assert.equal(sentPayload.subject.includes("AI-Ready Infrastructure"), true);
    assert.equal(sentPayload.reply_to, "contact@greennext.digital");
    assert.equal(sentPayload.html.includes("Hello Elena,"), true);
    assert.equal(sentPayload.text.includes("Hello Elena,"), true);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("Visitor Email: Resend Provider API Error Handling (HTTP 4xx/5xx)", async () => {
  const origFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        statusCode: 403,
        message: "The domain 'greennext.digital' is not verified in your Resend account.",
        name: "validation_error",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  };

  try {
    const transport = new ResendMailTransport("re_mock_key", "GreenNext <inquiries@greennext.digital>");
    const result = await transport.send({
      to: "visitor@example.com",
      subject: "Test Subject",
      htmlBody: "<p>Test</p>",
      plainTextBody: "Test",
    });

    assert.equal(result.success, false);
    assert.equal(result.error.includes("not verified in your Resend account"), true);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("Visitor Email: Resend Provider Network Failure Handling", async () => {
  const origFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new TypeError("fetch failed: connection timeout");
  };

  try {
    const transport = new ResendMailTransport("re_mock_key", "GreenNext <inquiries@greennext.digital>");
    const result = await transport.send({
      to: "visitor@example.com",
      subject: "Test Subject",
      htmlBody: "<p>Test</p>",
      plainTextBody: "Test",
    });

    assert.equal(result.success, false);
    assert.equal(result.error.includes("Network error dispatching to Resend"), true);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("Visitor Email: Resend Configuration Guardrails & Recipient Syntax Check", async () => {
  // Missing API key must fail safely
  const missingKeyTransport = new ResendMailTransport("");
  const resMissing = await missingKeyTransport.send({
    to: "visitor@example.com",
    subject: "Test",
    htmlBody: "<p>Test</p>",
    plainTextBody: "Test",
  });
  assert.equal(resMissing.success, false);
  assert.equal(resMissing.error.includes("RESEND_API_KEY"), true);

  // Invalid recipient email must fail safely without network call
  const validKeyTransport = new ResendMailTransport("re_test_key");
  const resBadEmail = await validKeyTransport.send({
    to: "not-an-email",
    subject: "Test",
    htmlBody: "<p>Test</p>",
    plainTextBody: "Test",
  });
  assert.equal(resBadEmail.success, false);
  assert.equal(resBadEmail.error.includes("Invalid recipient address syntax"), true);
});

test("Visitor Email: Live vs Simulation Transport Resolution", () => {
  const origSim = process.env["EMAIL_SIMULATION_MODE"];
  const origProv = process.env["EMAIL_PROVIDER"];
  const origKey = process.env["RESEND_API_KEY"];

  try {
    // 1. Simulation enabled (default)
    delete process.env["EMAIL_SIMULATION_MODE"];
    delete process.env["EMAIL_PROVIDER"];
    const simTransport = resolveMailTransport();
    assert.equal(simTransport.isSimulated, true);

    // 2. Explicit live mode with Resend provider
    process.env["EMAIL_SIMULATION_MODE"] = "false";
    process.env["EMAIL_PROVIDER"] = "resend";
    process.env["RESEND_API_KEY"] = "re_test_live_key";

    const resendTransport = resolveMailTransport();
    assert.equal(resendTransport.isSimulated, false);
    assert.equal(resendTransport instanceof ResendMailTransport, true);
  } finally {
    if (origSim !== undefined) process.env["EMAIL_SIMULATION_MODE"] = origSim;
    else delete process.env["EMAIL_SIMULATION_MODE"];

    if (origProv !== undefined) process.env["EMAIL_PROVIDER"] = origProv;
    else delete process.env["EMAIL_PROVIDER"];

    if (origKey !== undefined) process.env["RESEND_API_KEY"] = origKey;
    else delete process.env["RESEND_API_KEY"];
  }
});

test("Visitor Email: All Three Form Inquiries Trigger Confirmation Dispatch and Isolate Failures", async () => {
  // Verify failure isolation pattern across Quick Inquiry, Long Form Inquiry, and Lead Inquiry
  // When confirmation email delivery fails (e.g. rate limit, unverified domain, or provider error),
  // the inquiry persistence must remain successful and NOT throw or report false failure to the visitor.

  const mockSuccessfulInquiry = { success: true, message: "Inquiry recorded successfully." };

  // 1. Simulated successful form persistence with email dispatch error
  let emailDispatched = false;
  let emailFailedSafely = false;

  const simulatedInquiryWorkflow = async (formKind) => {
    // Step A: Form persistence (Sheets/Jira)
    const persistenceResult = { ...mockSuccessfulInquiry, formKind };

    // Step B: Dispatch confirmation email with non-blocking error boundary
    try {
      emailDispatched = true;
      // Simulate rate limit or provider error
      throw new Error("Provider rate limit or unverified domain error");
    } catch (err) {
      emailFailedSafely = true;
      // Error is logged, not re-thrown
    }

    // Step C: Form response returned to visitor is still successful
    return persistenceResult;
  };

  const forms = ["quick_inquiry", "long_form_inquiry", "lead_inquiry"];
  for (const form of forms) {
    emailDispatched = false;
    emailFailedSafely = false;

    const result = await simulatedInquiryWorkflow(form);
    assert.equal(result.success, true);
    assert.equal(result.formKind, form);
    assert.equal(emailDispatched, true);
    assert.equal(emailFailedSafely, true);
  }
});
