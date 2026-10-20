/**
 * ============================================================================
 * GreenNext - Visitor Confirmation Email (Apps Script / MailApp)
 * ============================================================================
 *
 * Add this file to the SAME Apps Script project as Code.gs (File > + > Script).
 * Code.gs doPost() routes { action: "dispatch_email" } to handleDispatchEmailAction().
 *
 * Security model (this is NOT an open mail relay):
 *   1. Shared secret: payload.secret must equal Script Property REPORT_TRIGGER_SECRET
 *      (constant-time comparison). The secret lives only in Vercel server env + Script Properties.
 *   2. The caller supplies no subject/body/HTML. The email is rendered here from a fixed template.
 *   3. The requestId must already exist in the matching Google Sheet row (Quick_Inquiries /
 *      Contact_Submissions / Lead_Submissions) with the SAME email address, i.e. only people who
 *      really submitted a saved inquiry can ever be emailed.
 *   4. Each requestId is emailed at most once (Email_Log + LockService).
 *
 * Template source of truth: src/lib/email-templates/visitor-welcome-template.ts.
 * This file is a hand port; tests/visitor-email-apps-script.test.mjs verifies both render the
 * same subject, links and copy so they cannot silently drift.
 *
 * Optional Script Properties:
 *   PUBLIC_WEBSITE_URL        default https://greennext-ai.vercel.app
 *   VISITOR_EMAIL_REPLY_TO    optional Reply-To address
 *   VISITOR_EMAIL_SENDER_NAME default "GreenNext"
 */

var VISITOR_EMAIL_DEFAULT_SITE_URL = "https://greennext-ai.vercel.app";
var VISITOR_EMAIL_LINKEDIN_URL = "https://www.linkedin.com/company/greennext";
var VISITOR_EMAIL_LOG_SHEET = "Email_Log";
var VISITOR_EMAIL_LOG_HEADERS = [
  "Timestamp", "Request ID", "Form Type", "Recipient (masked)", "Status", "Provider",
  "Delivery Ref", "Quota Remaining", "Error"
];
var VISITOR_EMAIL_FORM_SHEETS = {
  quick_inquiry: { sheet: "Quick_Inquiries", requestIdCol: 10, emailCol: 3 },
  long_form_inquiry: { sheet: "Contact_Submissions", requestIdCol: 12, emailCol: 3 },
  lead_inquiry: { sheet: "Lead_Submissions", requestIdCol: 16, emailCol: 3 }
};

// ─── Action handler ─────────────────────────────────────────────────────────

function handleDispatchEmailAction(payload) {
  var storedSecret = PropertiesService.getScriptProperties().getProperty("REPORT_TRIGGER_SECRET");
  if (!storedSecret) {
    return jsonResponse(false, "REPORT_TRIGGER_SECRET is not configured in Script Properties.", { status: "not_configured" });
  }
  if (!visitorEmailSecureEquals(String(payload && payload.secret || "").trim(), String(storedSecret).trim())) {
    return jsonResponse(false, "Unauthorized.", { status: "unauthorized" });
  }

  var v = validateVisitorEmailPayload(payload);
  if (v) return jsonResponse(false, v, { status: "invalid" });

  var requestId = String(payload.requestId);
  var email = String(payload.email).trim();
  var formType = String(payload.formType);
  var logSheet = null;
  var logRow = 0;
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lockErr) {
    return jsonResponse(false, "Email service busy; not sent.", { status: "failed" });
  }

  try {
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    logSheet = getOrCreateSheet(rawSs, VISITOR_EMAIL_LOG_SHEET, VISITOR_EMAIL_LOG_HEADERS);

    // 1. Only email addresses that really submitted a saved inquiry.
    if (!visitorEmailInquiryExists(rawSs, formType, requestId, email)) {
      return jsonResponse(false, "No saved inquiry matches this request.", { status: "invalid" });
    }

    // 2. Duplicate protection (SENT or in-flight SENDING). FAILED rows may be retried.
    var existing = visitorEmailFindLog(logSheet, requestId);
    if (existing && (existing.status === "SENT" || existing.status === "SENDING")) {
      return jsonResponse(true, "Confirmation already handled for this request.", {
        status: "duplicate", duplicate: true, deliveryRef: existing.ref
      });
    }

    // 3. Quota check.
    var quota = MailApp.getRemainingDailyQuota();
    if (quota <= 0) {
      visitorEmailWriteLog(logSheet, existing ? existing.row : 0, requestId, formType, email, "FAILED", "", quota, "Daily MailApp quota exhausted");
      return jsonResponse(false, "Daily email quota exhausted.", { status: "quota_exhausted" });
    }

    // 4. Record SENDING first so a crash/retry cannot send twice.
    logRow = visitorEmailWriteLog(logSheet, existing ? existing.row : 0, requestId, formType, email, "SENDING", "", quota, "");

    var rendered = renderVisitorEmail({
      name: payload.name, formType: formType, leadType: payload.leadType, category: payload.category
    });
    var props = PropertiesService.getScriptProperties();
    var options = {
      to: email,
      subject: rendered.subject,
      body: rendered.plainText,
      htmlBody: rendered.html,
      name: props.getProperty("VISITOR_EMAIL_SENDER_NAME") || "GreenNext"
    };
    var replyTo = props.getProperty("VISITOR_EMAIL_REPLY_TO");
    if (replyTo) options.replyTo = replyTo;

    MailApp.sendEmail(options);

    var ref = "mailapp_" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMddHHmmss");
    var remaining = MailApp.getRemainingDailyQuota();
    visitorEmailWriteLog(logSheet, logRow, requestId, formType, email, "SENT", ref, remaining, "");
    return jsonResponse(true, "Confirmation email sent.", { status: "sent", duplicate: false, deliveryRef: ref });
  } catch (err) {
    var msg = visitorEmailSafeError(err);
    try {
      if (logSheet) visitorEmailWriteLog(logSheet, logRow, requestId, formType, email, "FAILED", "", "", msg);
    } catch (logErr) { /* diagnostics only */ }
    return jsonResponse(false, msg, { status: "failed" });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

function validateVisitorEmailPayload(p) {
  if (!p || typeof p !== "object") return "Invalid payload.";
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 200) return "Invalid name.";
  if (typeof p.email !== "string" || p.email.length > 320 || !/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(p.email.trim())) {
    return "Invalid email.";
  }
  if (!VISITOR_EMAIL_FORM_SHEETS.hasOwnProperty(String(p.formType))) return "Unsupported inquiry type.";
  if (typeof p.requestId !== "string" || !/^gn_req_[A-Za-z0-9_-]{8,128}$/.test(p.requestId)) return "Invalid request ID.";
  if (p.leadType !== undefined && (typeof p.leadType !== "string" || p.leadType.length > 200)) return "Invalid lead type.";
  if (p.category !== undefined && (typeof p.category !== "string" || p.category.length > 200)) return "Invalid category.";
  return "";
}

function visitorEmailInquiryExists(ss, formType, requestId, email) {
  var cfg = VISITOR_EMAIL_FORM_SHEETS[formType];
  var sheet = ss.getSheetByName(cfg.sheet);
  if (!sheet || sheet.getLastRow() <= 1) return false;
  var ids = sheet.getRange(2, cfg.requestIdCol + 1, sheet.getLastRow() - 1, 1).getValues();
  var wanted = email.toLowerCase();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0] || "").trim() === requestId) {
      var rowEmail = String(sheet.getRange(i + 2, cfg.emailCol + 1).getValue() || "").trim().toLowerCase();
      return rowEmail === wanted;
    }
  }
  return false;
}

function visitorEmailFindLog(sheet, requestId) {
  if (sheet.getLastRow() <= 1) return null;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, VISITOR_EMAIL_LOG_HEADERS.length).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][1]) === requestId) {
      return { row: i + 2, status: String(values[i][4]), ref: String(values[i][6] || "") };
    }
  }
  return null;
}

/** Writes (or updates) an Email_Log row and returns its row number. No full address is stored. */
function visitorEmailWriteLog(sheet, row, requestId, formType, email, status, ref, quota, error) {
  var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  var values = [ts, requestId, formType, visitorEmailMask(email), status, "MailApp", ref || "", quota === "" ? "" : quota, String(error || "").substring(0, 300)];
  if (row > 0) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
    return row;
  }
  sheet.appendRow(values);
  return sheet.getLastRow();
}

function visitorEmailMask(email) {
  var parts = String(email).split("@");
  return (parts[0] || "").substring(0, 1) + "***@" + (parts[1] || "");
}

function visitorEmailSafeError(err) {
  var m = String(err && err.message || err || "Unknown error").replace(/[\r\n]/g, " ").substring(0, 300);
  if (/authoriz|permission/i.test(m)) {
    return "Apps Script is not authorized to send mail. Run authorizeVisitorEmail() once in the editor and redeploy. (" + m + ")";
  }
  if (/quota|too many|limit exceeded/i.test(m)) return "Email quota exceeded: " + m;
  return m;
}

/** Constant-time string comparison. */
function visitorEmailSecureEquals(a, b) {
  var diff = a.length ^ b.length;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Run ONCE manually from the editor (Run > authorizeVisitorEmail) to grant the Gmail/MailApp
 * and Spreadsheet permissions. Sends nothing.
 */
function authorizeVisitorEmail() {
  Logger.log("MailApp daily quota remaining: " + MailApp.getRemainingDailyQuota());
  Logger.log("Spreadsheet access OK: " + SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID).getName());
}

/**
 * Manual demo / backup: edit TEST_TO, then run from the editor to send a sample confirmation
 * to yourself without the website. Does not touch Email_Log.
 */
function sendTestVisitorEmail() {
  var TEST_TO = Session.getActiveUser().getEmail();
  var r = renderVisitorEmail({ name: "Demo Visitor", formType: "quick_inquiry", category: "AI Infrastructure" });
  MailApp.sendEmail({ to: TEST_TO, subject: r.subject, body: r.plainText, htmlBody: r.html, name: "GreenNext" });
  Logger.log("Sample confirmation sent to " + visitorEmailMask(TEST_TO));
}

/**
 * Manual-send fallback from Google Sheets: select a row in Quick_Inquiries, Contact_Submissions
 * or Lead_Submissions and run this from the editor. Uses the same duplicate log.
 */
function manualSendConfirmationForActiveRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var name = sheet.getName();
  var formType = null;
  for (var k in VISITOR_EMAIL_FORM_SHEETS) {
    if (VISITOR_EMAIL_FORM_SHEETS[k].sheet === name) formType = k;
  }
  if (!formType) throw new Error("Select a row in Quick_Inquiries, Contact_Submissions or Lead_Submissions.");
  var row = sheet.getActiveRange().getRow();
  if (row < 2) throw new Error("Select a data row (not the header).");
  var cfg = VISITOR_EMAIL_FORM_SHEETS[formType];
  var values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var requestId = String(values[cfg.requestIdCol] || "");
  var secret = PropertiesService.getScriptProperties().getProperty("REPORT_TRIGGER_SECRET");
  var res = handleDispatchEmailAction({
    secret: secret,
    name: String(values[2] || ""),
    email: String(values[cfg.emailCol] || ""),
    formType: formType,
    leadType: formType === "lead_inquiry" ? String(values[1] || "") : "",
    category: formType === "quick_inquiry" ? String(values[5] || "") : (formType === "long_form_inquiry" ? String(values[6] || "") : String(values[7] || "")),
    requestId: requestId
  });
  Logger.log(res.getContent());
}

// ─── Template (port of src/lib/email-templates/visitor-welcome-template.ts) ──

function visitorEmailEscape(input) {
  if (!input) return "";
  return String(input)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function visitorEmailFirstName(fullName) {
  if (!fullName) return "there";
  var cleaned = String(fullName).trim().replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, "");
  var first = cleaned.split(/\s+/)[0];
  if (!first || first.length < 2) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function visitorEmailFormName(formType, leadType) {
  if (leadType) {
    var lt = String(leadType).toLowerCase();
    if (lt.indexOf("session") !== -1 || lt.indexOf("consultation") !== -1) return "Technical Consultation";
    if (lt.indexOf("partner") !== -1 || lt.indexOf("collaboration") !== -1) return "Partner & Collaboration";
    if (lt.indexOf("technical") !== -1 || lt.indexOf("infrastructure") !== -1) return "Technical Infrastructure Inquiry";
    if (lt.indexOf("career") !== -1) return "Career & Talent Inquiry";
    if (lt.indexOf("general") !== -1) return "General Contact Inquiry";
  }
  if (formType === "quick_inquiry") return "Quick Inquiry";
  if (formType === "long_form_inquiry") return "Technical Requirements";
  if (formType === "lead_inquiry") return "Consultation & Inquiry";
  return "Inquiry";
}

function visitorEmailHas(text, words) {
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) !== -1) return true;
  }
  return false;
}

function visitorEmailServiceContent(categoryOrTopic, leadType, base) {
  var cat = String(categoryOrTopic || "").toLowerCase().trim();
  var lead = String(leadType || "").toLowerCase().trim();
  function svc(title, description, path) { return { title: title, description: description, url: base + path }; }

  if (lead.indexOf("career") !== -1 || visitorEmailHas(cat, ["career", "resume", "cv"])) {
    return svc("Engineering & Infrastructure Innovation at GreenNext",
      "Discover our multidisciplinary research into thermal dynamics, distributed edge topologies, and renewable-powered digital infrastructure.",
      "/about/what-we-are");
  }
  if (lead.indexOf("partner") !== -1 || visitorEmailHas(cat, ["partner", "collaboration", "ecosystem"])) {
    return svc("Technology & Regional Ecosystem Collaboration",
      "Explore co-development, technology integration, and deployment partnership opportunities with GreenNext across sustainable compute and clean energy grids.",
      "/about/what-we-are");
  }
  if (visitorEmailHas(cat, ["ai", "compute", "workload", "density"])) {
    return svc("AI-Ready Infrastructure & High-Density Topology",
      "Explore how GreenNext provisions dedicated high-density computing clusters, accelerated GPU topologies, and low-latency interconnects optimized for demanding AI workloads.",
      "/infrastructure/ai-ready");
  }
  if (visitorEmailHas(cat, ["energy", "cooling", "thermal", "power"])) {
    return svc("Energy Intelligence & Thermal Telemetry",
      "Discover our real-time power distribution monitoring, heat re-circulation management, and predictive cooling systems engineered to maximize energy efficiency.",
      "/energy/monitoring");
  }
  if (visitorEmailHas(cat, ["automation", "monitoring", "sensor", "telemetry"])) {
    return svc("Intelligent Infrastructure Automation",
      "Review our automated operational nodes, predictive failure diagnostics, and closed-loop environmental controls maintaining peak infrastructure stability.",
      "/automation/monitoring");
  }
  if (visitorEmailHas(cat, ["region", "mdu", "cjb", "trz", "ixe", "madurai", "coimbatore", "trichy", "mangalore"])) {
    return svc("Regional Infrastructure Grid across South India",
      "Learn about our strategically distributed Tier-2 edge nodes across Madurai, Coimbatore, Trichy, and Mangalore, delivering sub-15ms regional latency.",
      "/regions/overview");
  }
  if (visitorEmailHas(cat, ["data center", "datacenter", "cloud", "edge", "capacity"])) {
    return svc("Next-Generation Modular Data Center Architecture",
      "Examine our modular facility architecture, scalable power backups, and enterprise redundancy specifications for mission-critical digital operations.",
      "/solutions/architecture-explorer");
  }
  return svc("GreenNext Digital Infrastructure Solutions",
    "Explore how GreenNext unites AI compute acceleration, intelligent automation, and sustainable energy architectures for regional digital transformation.",
    "/solutions");
}

/**
 * @param {{name:string, formType:string, leadType?:string, category?:string, siteUrl?:string}} o
 * @return {{subject:string, html:string, plainText:string}}
 */
function renderVisitorEmail(o) {
  var configured = "";
  try { configured = PropertiesService.getScriptProperties().getProperty("PUBLIC_WEBSITE_URL") || ""; } catch (e) { /* tests */ }
  var base = String(o.siteUrl || configured || VISITOR_EMAIL_DEFAULT_SITE_URL).trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(base)) base = VISITOR_EMAIL_DEFAULT_SITE_URL;
  var websiteUrl = base;
  var linkedInUrl = VISITOR_EMAIL_LINKEDIN_URL;
  var contactUrl = base + "/contact";
  var headerBanner = base + "/images/email/greennext-email-header.png";
  var footerBanner = base + "/images/email/greennext-email-footer.png";

  var firstName = visitorEmailFirstName(o.name);
  var formName = visitorEmailFormName(o.formType, o.leadType);
  var svc = visitorEmailServiceContent(o.category, o.leadType, base);
  var e = visitorEmailEscape;
  var subject = "Thank you for contacting GreenNext \u2013 " + svc.title;

  var html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>GreenNext \u2013 Thank You for Connecting</title>\n<style>\n' +
    '  body { margin:0; padding:24px 12px; background:#eef2f5; font-family:Arial,Helvetica,sans-serif; color:#172536; }\n' +
    '  .email { max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dce4eb; border-radius:6px; overflow:hidden; }\n' +
    '  .banner { display:block; width:100%; height:auto; border:0; }\n' +
    '  .body { padding:30px 34px; font-size:15px; line-height:1.7; }\n' +
    '  .eyebrow { color:#07815e; font-size:11px; font-weight:bold; letter-spacing:1.1px; text-transform:uppercase; }\n' +
    '  h1 { margin:8px 0 18px; font-size:24px; line-height:1.25; color:#102238; }\n' +
    '  h2 { margin:0 0 8px; font-size:17px; color:#102b42; }\n' +
    '  p { margin:0 0 16px; }\n' +
    '  .resource { margin:22px 0; padding:18px 20px; border:1px solid #dce8e4; border-left:4px solid #07815e; background:#f6faf8; border-radius:4px; }\n' +
    '  .resource p { margin:0; color:#435365; }\n' +
    '  .button-wrap { margin:24px 0 18px; }\n' +
    '  .button { display:inline-block; background:#087b60; color:#ffffff !important; text-decoration:none; font-weight:bold; padding:12px 20px; border-radius:4px; }\n' +
    '  .signoff { margin-top:22px; color:#172536; }\n' +
    '  .footer-links { text-align:center; padding:14px 10px; color:#415568; font-size:12px; }\n' +
    '  .footer-links a { color:#087b60; text-decoration:underline; }\n' +
    '  .smallprint { margin:0; font-size:11px; color:#68798a; line-height:1.5; }\n' +
    '  @media (max-width:520px) { body { padding:0; } .email { border:0; border-radius:0; } .body { padding:22px 20px; } h1 { font-size:21px; } }\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="email" role="article" aria-label="GreenNext welcome email">\n' +
    '  <img class="banner" src="' + e(headerBanner) + '" alt="GreenNext \u2013 AI Infrastructure. Sustainable Progress." width="680" height="152">\n' +
    '  <div class="body">\n' +
    '    <div class="eyebrow">Thank you for connecting with us</div>\n' +
    '    <h1>Hello ' + e(firstName) + ',</h1>\n' +
    '    <p>Thank you for your interest in GreenNext and for submitting our <strong>' + e(formName) + '</strong> form.</p>\n' +
    '    <p>We are pleased to help you explore information relevant to your interests. Based on your submission, here is a good place to start.</p>\n' +
    '    <p><strong>What happens next:</strong> we have received your submission and our team will review it and get back to you by email. There is nothing more you need to do right now.</p>\n' +
    '    <div class="resource">\n      <h2>' + e(svc.title) + '</h2>\n      <p>' + e(svc.description) + '</p>\n    </div>\n' +
    '    <p>Explore our website to learn more about the technologies and solutions relevant to your goals.</p>\n' +
    '    <div class="button-wrap">\n      <a class="button" href="' + e(svc.url) + '" target="_blank" rel="noopener noreferrer">Explore GreenNext</a>\n    </div>\n' +
    '    <p>If you have any questions, you can contact our team using the details on our website.</p>\n' +
    '    <div class="signoff">Best regards,<br><strong>GreenNext Team</strong></div>\n  </div>\n' +
    '  <img class="banner" src="' + e(footerBanner) + '" alt="GreenNext \u2013 Sustainable Regional Digital Infrastructure" width="680" height="152">\n' +
    '  <div class="footer-links">\n' +
    '    <a href="' + e(websiteUrl) + '">Website</a> &nbsp;|&nbsp;\n' +
    '    <a href="' + e(linkedInUrl) + '">LinkedIn</a> &nbsp;|&nbsp;\n' +
    '    <a href="' + e(contactUrl) + '">Contact</a>\n  </div>\n' +
    '  <div style="padding:0 18px 18px;text-align:center">\n' +
    '    <p class="smallprint">You are receiving this email because you submitted a GreenNext form. If you did not submit this form, you can disregard this message.</p>\n' +
    '  </div>\n</div>\n</body>\n</html>';

  var plainText = "Hello " + firstName + ",\n\n" +
    "Thank you for your interest in GreenNext and for submitting our " + formName + " form.\n\n" +
    "We are pleased to help you explore information relevant to your interests. Based on your submission, here is a good place to start:\n\n" +
    "What happens next: we have received your submission and our team will review it and get back to you by email. There is nothing more you need to do right now.\n\n" +
    svc.title + "\n" + svc.description + "\n\n" +
    "Explore relevant technologies and infrastructure solutions:\n" + svc.url + "\n\n" +
    "If you have any questions, you can contact our team at " + contactUrl + ".\n\n" +
    "Best regards,\nGreenNext Team\n\n---\n" +
    "Website: " + websiteUrl + "\nLinkedIn: " + linkedInUrl + "\nContact: " + contactUrl + "\n\n" +
    "You are receiving this email because you submitted a GreenNext form. If you did not submit this form, you can disregard this message.";

  return { subject: subject, html: html, plainText: plainText };
}
