/**
 * ============================================================================
 * GreenNext Digital Infrastructure - Backend & Analytics Integration
 * ============================================================================
 *
 * Architecture:
 * - Spreadsheet 1 (Raw Data): Collects real-time interaction telemetry and form submissions.
 * - Spreadsheet 2 (Analytics): Derives aggregated reporting, funnels, and regional intelligence.
 *
 * Core Principles:
 * - Lead notification email is sent only for website lead submissions.
 * - Lead identification is derived from observed behavior + form submissions.
 * - Quick Inquiry and Long-Form Inquiry are recorded in dedicated, distinct categories.
 * - Full backward compatibility with the existing 10 behavioral tracking tabs.
 * - No PII in behavioral tabs; contact details recorded only in dedicated inquiry tabs.
 */

// Spreadsheet IDs
var RAW_DATA_SPREADSHEET_ID = "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY";
var ANALYTICS_SPREADSHEET_ID = "1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18";

// ─── 1. HTTP GET & POST ENDPOINTS ──────────────────────────────────────────

/**
 * Health check & diagnostic status endpoint.
 */
function doGet(e) {
  var output = {
    status: "online",
    system: "GreenNext Digital Infrastructure Data Platform",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      rawDataSpreadsheetId: RAW_DATA_SPREADSHEET_ID,
      analyticsSpreadsheetId: ANALYTICS_SPREADSHEET_ID,
    },
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ingestion handler for both behavioral telemetry and actual inquiry submissions.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "No payload received.");
    }

    var payload = JSON.parse(e.postData.contents);
    var targetSheet = payload.sheet;
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

    // ── Unified Lead Submission ──
    // Lead payloads intentionally do not need a sheet name; they are routed by formType.
    if (payload.formType === "lead_inquiry") {
      return processLeadSubmission(payload, rawSs, timestamp);
    }

    if (!targetSheet) {
      return jsonResponse(false, "Missing sheet parameter.");
    }

    // ── Form Submission: Quick Inquiry ──
    if (targetSheet === "Quick_Inquiries" || payload.formType === "quick_inquiry") {
      var qSheet = getOrCreateSheet(rawSs, "Quick_Inquiries", [
        "Timestamp", "Event", "Name", "Email", "Phone", "Interest", "Message", "Page", "Session ID"
      ]);

      qSheet.appendRow([
        timestamp,
        payload.event || "quick_inquiry_submit",
        payload.name || "",
        payload.email || "",
        payload.phone || "",
        payload.interest || "General",
        payload.message || "",
        payload.page || "",
        payload.sessionId || ""
      ]);

      // Dual recording: Also log high-intent CTA event (no PII in CTA tab)
      var ctaSheet = getOrCreateSheet(rawSs, "CTA Interactions", [
        "Timestamp", "Event", "CTA", "Page", "Session ID"
      ]);
      ctaSheet.appendRow([
        timestamp,
        "quick_inquiry_submit",
        "Quick Inquiry: " + (payload.interest || "General"),
        payload.page || "",
        payload.sessionId || ""
      ]);

      // Refresh analytics asynchronously or best-effort
      tryUpdateAnalytics();
      return jsonResponse(true, "Quick inquiry recorded successfully.");
    }

    // ── Form Submission: Long-Form Technical Inquiry ──
    if (targetSheet === "Contact_Submissions" || payload.formType === "long_form_inquiry") {
      var cSubSheet = getOrCreateSheet(rawSs, "Contact_Submissions", [
        "Timestamp", "Event", "Name", "Email", "Phone", "Organization", "Category", "Region", "Message", "Page", "Session ID"
      ]);

      cSubSheet.appendRow([
        timestamp,
        payload.event || "long_form_inquiry_submit",
        payload.name || "",
        payload.email || "",
        payload.phone || "",
        payload.organization || "",
        payload.category || "General Requirements",
        payload.region || "South India",
        payload.message || "",
        payload.page || "",
        payload.sessionId || ""
      ]);

      // Dual recording: Also log high-intent CTA event (no PII in CTA tab)
      var ctaSheet = getOrCreateSheet(rawSs, "CTA Interactions", [
        "Timestamp", "Event", "CTA", "Page", "Session ID"
      ]);
      ctaSheet.appendRow([
        timestamp,
        "long_form_inquiry_submit",
        "Long Form: " + (payload.category || "Inquiry") + " | " + (payload.region || "All"),
        payload.page || "",
        payload.sessionId || ""
      ]);

      // Refresh analytics
      tryUpdateAnalytics();
      return jsonResponse(true, "Technical inquiry recorded successfully.");
    }

    // ── Behavioral Telemetry: 10 Fixed Tabs ──
    var sheet = rawSs.getSheetByName(targetSheet);
    if (!sheet) {
      // Create if missing with correct schema
      sheet = setupBehavioralSheetIfMissing(rawSs, targetSheet);
    }

    var row = buildBehavioralRow(targetSheet, payload, timestamp);
    if (!row) {
      return jsonResponse(false, "Invalid sheet: " + targetSheet);
    }

    sheet.appendRow(row);
    return jsonResponse(true, "Event recorded.");
  } catch (err) {
    return jsonResponse(false, "Error: " + err.toString());
  }
}

/**
 * Stores a website lead in the dedicated raw-data sheet and sends the internal
 * notification after the metadata row has been persisted.
 */
function processLeadSubmission(payload, rawSs, timestamp) {
  var validLeadTypes = [
    "Technical Consultation / Session Booking",
    "Partner / Collaboration Inquiry",
    "Technical Infrastructure Inquiry",
    "General Contact Inquiry",
    "Career Inquiry"
  ];

  if (validLeadTypes.indexOf(payload.leadType) === -1) {
    return jsonResponse(false, "Invalid lead type.");
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var leadSheet = getOrCreateSheet(rawSs, "Lead_Submissions", [
      "Timestamp", "Lead Type", "Name", "Email", "Phone", "Organization",
      "Region", "Topic / Category", "Message", "Page", "Session ID",
      "Session Kind", "Document Attached", "Document Name", "Document MIME Type", "Status"
    ]);

    var leadTimestamp = payload.timestamp || timestamp;
    var document = normalizeLeadDocument(payload.document);
    if ((payload.leadType === "Partner / Collaboration Inquiry" || payload.leadType === "Career Inquiry") && !document) {
      return jsonResponse(false, payload.leadType === "Partner / Collaboration Inquiry"
        ? "Please upload a partnership or company document."
        : "Please upload your resume or CV.");
    }
    var duplicateRow = findRecentLeadDuplicate(leadSheet, payload, leadTimestamp, document);
    if (duplicateRow > 0) {
      return jsonResponse(true, "Lead submission already recorded.");
    }

    var rowNumber = leadSheet.getLastRow() + 1;
    leadSheet.appendRow([
      leadTimestamp,
      payload.leadType,
      payload.name || "",
      payload.email || "",
      payload.phone || "",
      payload.organization || "",
      payload.region || "",
      payload.topic || "",
      payload.message || "",
      payload.page || "",
      payload.sessionId || "",
      payload.sessionKind || "",
      document ? "Yes" : "No",
      document ? document.fileName : "",
      document ? document.mimeType : "",
      ""
    ]);

    var emailStatus = "EMAIL_FAILED";
    try {
      var attachment = null;
      if (document) {
        attachment = Utilities.newBlob(
          Utilities.base64Decode(document.data),
          document.mimeType,
          document.fileName
        );
      }

      var emailSubject = getLeadEmailSubject(payload.leadType);
      var emailBody = buildLeadEmailBody(payload, document);
      var emailOptions = { to: "jananisri.int2027g3@gmail.com", subject: emailSubject, body: emailBody };
      if (attachment) emailOptions.attachments = [attachment];
      MailApp.sendEmail(emailOptions);
      emailStatus = document ? "EMAIL_SENT" : "EMAIL_SENT_WITHOUT_DOCUMENT";
    } catch (emailError) {
      Logger.log("Lead email failed: " + safeErrorMessage(emailError));
    }

    leadSheet.getRange(rowNumber, 16).setValue(emailStatus);
    return jsonResponse(true, "Lead submission recorded successfully.");
  } finally {
    lock.releaseLock();
  }
}

function getLeadEmailSubject(leadType) {
  var subjects = {
    "Partner / Collaboration Inquiry": "GreenNext - Partner With GreenNext",
    "Technical Infrastructure Inquiry": "GreenNext - Technical Infrastructure Inquiry",
    "Technical Consultation / Session Booking": "GreenNext - Technical Consultation / Session Booking",
    "General Contact Inquiry": "GreenNext - General Contact Inquiry",
    "Career Inquiry": "GreenNext - Career Inquiry"
  };

  return subjects[leadType] || "GreenNext - General Contact Inquiry";
}

function normalizeLeadDocument(document) {
  if (!document || typeof document !== "object") return null;
  if (!document.fileName || !document.mimeType || !document.data) return null;
  return {
    fileName: safeEmailText(String(document.fileName), 255),
    mimeType: safeEmailText(String(document.mimeType), 160),
    data: String(document.data)
  };
}

/**
 * Exact-payload retry guard. It only matches the same session, timestamp,
 * lead type, contact identity, and document name, so legitimate later repeats
 * remain valid submissions.
 */
function findRecentLeadDuplicate(sheet, payload, leadTimestamp, document) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var startRow = Math.max(2, lastRow - 49);
  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 16).getValues();
  var documentName = document ? document.fileName : "";
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (sameLeadTimestamp(row[0], leadTimestamp) &&
        String(row[1]) === String(payload.leadType) &&
        String(row[2]) === String(payload.name || "") &&
        String(row[3]) === String(payload.email || "") &&
        String(row[10]) === String(payload.sessionId || "") &&
        String(row[13]) === documentName) {
      return startRow + i;
    }
  }
  return 0;
}

function sameLeadTimestamp(left, right) {
  if (String(left) === String(right)) return true;
  var leftDate = new Date(left);
  var rightDate = new Date(right);
  return !isNaN(leftDate.getTime()) && !isNaN(rightDate.getTime()) &&
    leftDate.getTime() === rightDate.getTime();
}

function buildLeadEmailBody(payload, document) {
  if (payload.leadType === "Career Inquiry") {
    var careerLines = [
      "GreenNext Lead Submission",
      "",
      "Lead Type: Career Inquiry",
      "Full Name: " + (payload.name || ""),
      "Email: " + (payload.email || "")
    ];
    if (payload.phone) careerLines.push("Phone: " + payload.phone);
    careerLines.push(
      "Current Role / Student Status: " + (payload.currentRole || ""),
      "Area of Interest: " + (payload.topic || ""),
      "Experience Level: " + (payload.experienceLevel || ""),
      "Preferred Region: " + (payload.region || ""),
      "Message: " + (payload.message || ""),
      "Page: " + (payload.page || ""),
      "Session ID: " + (payload.sessionId || ""),
      "Session Kind: " + (payload.sessionKind || "")
    );
    if (payload.linkedinUrl) careerLines.push("LinkedIn URL: " + payload.linkedinUrl);
    if (payload.portfolioUrl) careerLines.push("Portfolio / GitHub URL: " + payload.portfolioUrl);
    careerLines.push(
      "Resume Attachment: " + (document ? document.fileName : "None"),
      "Resume MIME Type: " + (document ? document.mimeType : "None"),
      "Resume Attached: " + (document ? "Yes" : "No")
    );
    return careerLines.join("\n");
  }

  return [
    "GreenNext Lead Submission",
    "",
    "Lead Type: " + (payload.leadType || ""),
    "Name: " + (payload.name || ""),
    "Email: " + (payload.email || ""),
    "Phone: " + (payload.phone || ""),
    "Organization: " + (payload.organization || ""),
    "Region: " + (payload.region || ""),
    "Topic / Category: " + (payload.topic || ""),
    "Message: " + (payload.message || ""),
    "Page: " + (payload.page || ""),
    "Session ID: " + (payload.sessionId || ""),
    "Session Kind: " + (payload.sessionKind || ""),
    "Document Attached: " + (document ? "Yes" : "No")
  ].join("\n");
}

function safeEmailText(value, maxLength) {
  return String(value || "").replace(/[\r\n]/g, " ").substring(0, maxLength);
}

function safeErrorMessage(error) {
  if (!error) return "Unknown error";
  return String(error.message || error).replace(/[\r\n]/g, " ").substring(0, 500);
}

/**
 * Helper to build the row array matching each tab's exact 5-column schema.
 */
function buildBehavioralRow(sheetName, p, ts) {
  var event = p.event || "";
  var page = p.page || "";
  var sid = p.sessionId || "";

  switch (sheetName) {
    case "Navigation":
      // Timestamp | Event | Page | Destination | Session ID
      return [ts, event, page, p.destination || p.value || "", sid];
    case "Regions":
      // Timestamp | Event | Region | Page | Session ID
      return [ts, event, p.region || p.value || "", page, sid];
    case "Infrastructure":
      // Timestamp | Event | Capability | Page | Session ID
      return [ts, event, p.capability || p.value || "", page, sid];
    case "Energy":
      // Timestamp | Event | Topic | Page | Session ID
      return [ts, event, p.topic || p.value || "", page, sid];
    case "Automation":
      // Timestamp | Event | Feature | Page | Session ID
      return [ts, event, p.feature || p.value || "", page, sid];
    case "Solutions":
      // Timestamp | Event | Solution | Page | Session ID
      return [ts, event, p.solution || p.value || "", page, sid];
    case "Industries":
      // Timestamp | Event | Industry | Page | Session ID
      return [ts, event, p.industry || p.value || "", page, sid];
    case "Locations":
      // Timestamp | Event | Location | Page | Session ID
      return [ts, event, p.location || p.value || "", page, sid];
    case "AI Assistant":
      // Timestamp | Event | Input / Selection | Page | Session ID
      return [ts, event, p.inputSelection || p.value || "", page, sid];
    case "CTA Interactions":
      // Timestamp | Event | CTA | Page | Session ID
      return [ts, event, p.cta || p.value || "", page, sid];
    default:
      return null;
  }
}

function jsonResponse(success, message) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: success, message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}

function tryUpdateAnalytics() {
  try {
    updateAnalyticsSpreadsheet();
  } catch (e) {
    Logger.log("Analytics refresh deferred: " + e.toString());
  }
}

// ─── 2. ANALYTICS SPREADSHEET DERIVATION & AGGREGATION ─────────────────────

/**
 * Reads collected raw data from Spreadsheet 1 and aggregates derived intelligence
 * into Spreadsheet 2 (GreenNext Analytics).
 */
function updateAnalyticsSpreadsheet() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var anaSs = resolveSpreadsheet(null, ANALYTICS_SPREADSHEET_ID, "analytics");
  var refreshTime = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

  // Gather raw data
  var navData = getSheetRows(rawSs, "Navigation");
  var regData = getSheetRows(rawSs, "Regions");
  var infData = getSheetRows(rawSs, "Infrastructure");
  var eneData = getSheetRows(rawSs, "Energy");
  var autData = getSheetRows(rawSs, "Automation");
  var solData = getSheetRows(rawSs, "Solutions");
  var indData = getSheetRows(rawSs, "Industries");
  var locData = getSheetRows(rawSs, "Locations");
  var aiData = getSheetRows(rawSs, "AI Assistant");
  var ctaData = getSheetRows(rawSs, "CTA Interactions");
  var quickLeads = getSheetRows(rawSs, "Quick_Inquiries");
  var longLeads = getSheetRows(rawSs, "Contact_Submissions");
  var dedicatedLeads = getSheetRows(rawSs, "Lead_Submissions");

  var advancedSource = {
    Navigation: navData,
    Regions: regData,
    Infrastructure: infData,
    Energy: eneData,
    Automation: autData,
    Solutions: solData,
    Industries: indData,
    Locations: locData,
    "AI Assistant": aiData,
    "CTA Interactions": ctaData,
    Quick_Inquiries: quickLeads,
    Contact_Submissions: longLeads,
    Lead_Submissions: dedicatedLeads
  };
  var advancedModel = buildAdvancedWebsiteIntelligenceModel(advancedSource, getReportingTimezone(rawSs));

  // Distinct Sessions across all tabs
  var allSessions = {};
  [navData, regData, infData, eneData, autData, solData, indData, locData, aiData, ctaData, quickLeads, longLeads].forEach(function(dataset) {
    dataset.forEach(function(row) {
      var sid = row[row.length - 1]; // Session ID is always the last column
      if (sid && sid !== "Session ID" && sid !== "session_fallback") {
        allSessions[sid] = true;
      }
    });
  });
  var uniqueSessionsCount = Object.keys(allSessions).length;

  // Page Views count (from Navigation)
  var pageViewsCount = 0;
  navData.forEach(function(r) {
    if (r[1] === "nav_page_view") pageViewsCount++;
  });

  // WhatsApp triggers count
  var whatsAppTriggers = 0;
  ctaData.forEach(function(r) {
    if (r[1] === "whatsapp_modal_trigger") whatsAppTriggers++;
  });

  // Quick inquiry submissions & opens
  var quickOpens = 0;
  var quickSubmits = quickLeads.length;
  var longSubmits = longLeads.length;
  ctaData.forEach(function(r) {
    if (r[1] === "quick_inquiry_open") quickOpens++;
  });

  // Total Behavioral Events
  var totalEvents = navData.length + regData.length + infData.length + eneData.length +
                    autData.length + solData.length + indData.length + locData.length +
                    aiData.length + ctaData.length;

  // 1. Executive Summary Sheet
  renderExecutiveSummary(anaSs, {
    refreshTime: refreshTime,
    pageViewsCount: pageViewsCount,
    uniqueSessionsCount: uniqueSessionsCount,
    totalInquiries: quickSubmits + longSubmits,
    quickSubmits: quickSubmits,
    longSubmits: longSubmits,
    quickOpens: quickOpens,
    whatsAppTriggers: whatsAppTriggers,
    totalEvents: totalEvents,
    recentQuick: quickLeads.slice(-5).reverse(),
    recentLong: longLeads.slice(-5).reverse(),
    advanced: advancedModel.summary
  });

  // 2. Regional Analytics Sheet
  renderRegionalAnalytics(anaSs, regData, locData, quickLeads, longLeads);

  // 3. CTA and Conversion Funnel Sheet
  renderCtaAndFunnel(anaSs, ctaData, uniqueSessionsCount, quickOpens, quickSubmits, longSubmits);

  // 4. Infrastructure & Energy Telemetry Sheet
  renderInfraEnergyAnalytics(anaSs, infData, eneData, autData);

  // 5. AI Assistant Telemetry Sheet
  renderAiAssistantAnalytics(anaSs, aiData);

  // 6. Additive daily / weekly / monthly reporting layer
  try {
    updateReportingLayer();
  } catch (reportError) {
    Logger.log("Reporting refresh deferred: " + safeErrorMessage(reportError));
  }

  try {
    updateAdvancedWebsiteIntelligence(anaSs, advancedModel);
  } catch (advancedError) {
    Logger.log("Advanced intelligence refresh deferred: " + safeErrorMessage(advancedError));
  }
}

/**
 * 1. Executive Summary Sheet
 */
function renderExecutiveSummary(anaSs, stats) {
  anaSs = resolveSpreadsheet(anaSs, ANALYTICS_SPREADSHEET_ID, "analytics");
  var sheet = getOrCreateSheet(anaSs, "Executive_Summary");
  sheet.clear();
  clearCharts(sheet);

  var headers = [
    ["GREENNEXT DIGITAL INFRASTRUCTURE - EXECUTIVE ANALYTICS"],
    ["Last Refreshed: " + stats.refreshTime + " (IST)"],
    [""],
    ["CORE KPI METRIC", "VALUE", "NOTES / CONTEXT"],
    ["Total Website Page Views", stats.pageViewsCount, "Page-view lifecycle telemetry"],
    ["Total Unique Sessions", stats.uniqueSessionsCount, "Anonymous browser session tokens"],
    ["Total Inquiries Received", stats.totalInquiries, "Verified inquiry submissions across all forms"],
    ["- Quick Inquiry Leads", stats.quickSubmits, "Dedicated modal submissions"],
    ["- Long-Form Technical Inquiries", stats.longSubmits, "Contact page infrastructure inquiries"],
    ["Quick Inquiry Modals Opened", stats.quickOpens, "User initiated the modal"],
    ["WhatsApp Action Triggers", stats.whatsAppTriggers, "Header / footer / modal WhatsApp buttons"],
    ["Total Behavioral Interaction Events", stats.totalEvents, "Across 10 behavioral dimensions"],
    [""],
    ["RECENT INQUIRIES LOG (LATEST SUBMISSIONS)"],
    ["Timestamp", "Form Type", "Name", "Email", "Phone", "Interest / Category", "Region / Organization", "Page"]
  ];

  var rows = [];
  stats.recentQuick.forEach(function(r) {
    rows.push([r[0], "Quick Inquiry", r[2], r[3], r[4], r[5], "—", r[7]]);
  });
  stats.recentLong.forEach(function(r) {
    rows.push([r[0], "Technical Inquiry", r[2], r[3], r[4], r[6], (r[7] || "") + " (" + (r[5] || "") + ")", r[9]]);
  });

  if (rows.length === 0) {
    rows.push(["—", "No inquiries recorded yet", "—", "—", "—", "—", "—", "—"]);
  }

  if (stats.advanced) {
    rows.push([""]);
    rows.push(["ADVANCED WEBSITE INTELLIGENCE", "VALUE", "OBSERVABLE BASIS"]);
    rows.push(["New Sessions", stats.advanced.newSessions, "Session Kind: new_session where available"]);
    rows.push(["Returning Sessions", stats.advanced.returningSessions, "Session Kind: returning_session where available"]);
    rows.push(["Engaged Sessions", stats.advanced.engagedSessions, "Observed scroll, engagement, CTA, or form activity"]);
    rows.push(["CTA Interactions", stats.advanced.ctaInteractions, "CTA Interactions records"]);
    rows.push(["Form Starts", stats.advanced.formStarts, "CTA Interactions: form_start"]);
    rows.push(["Form Abandonments", stats.advanced.formAbandonments, "CTA Interactions: form_abandon"]);
    rows.push(["Leads", stats.advanced.leads, "Actual Quick, Contact, and Lead_Submissions records"]);
    rows.push(["Lead Conversion Rate", stats.advanced.leadConversionRate, "Lead sessions / total sessions when available"]);
    rows.push(["Top Content Interest", stats.advanced.topContentInterest, "Observed behavioral-interest interactions"]);
    rows.push(["Top Region", stats.advanced.topRegion, "Observed regional behavioral activity"]);
    rows.push(["AI Assistant Interactions", stats.advanced.aiInteractions, "AI Assistant telemetry records"]);
    rows.push(["Leads With Documents", stats.advanced.leadsWithDocuments, "Lead_Submissions document metadata"]);
  }

  var fullData = headers.concat(rows);
  writeRows(sheet, fullData, 8);

  // Style Header
  sheet.getRange("A1:H1").setFontWeight("bold").setFontSize(14).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:C4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.getRange("A14:H14").setFontWeight("bold").setFontSize(11).setBackground("#0F172A").setFontColor("#38BDF8");
  sheet.getRange("A15:H15").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 8);

  // Preserve the KPI table and place the visualization to its right.
  var hasKpiData = stats.pageViewsCount > 0 || stats.uniqueSessionsCount > 0 ||
    stats.totalInquiries > 0 || stats.totalEvents > 0 || stats.whatsAppTriggers > 0;
  if (hasKpiData) {
    insertChartSafely(sheet, Charts.ChartType.COLUMN, [sheet.getRange("A4:B12")], 1, 10,
      "GreenNext KPI Overview", "bottom");
  }
}

/**
 * 2. Regional Analytics Sheet
 */
function renderRegionalAnalytics(anaSs, regData, locData, quickLeads, longLeads) {
  anaSs = resolveSpreadsheet(anaSs, ANALYTICS_SPREADSHEET_ID, "analytics");
  var sheet = getOrCreateSheet(anaSs, "Regional_Analytics");
  sheet.clear();
  clearCharts(sheet);

  var regions = {
    "Madurai": { views: 0, corridors: 0, inquiries: 0 },
    "Coimbatore": { views: 0, corridors: 0, inquiries: 0 },
    "Trichy": { views: 0, corridors: 0, inquiries: 0 },
    "Mangalore": { views: 0, corridors: 0, inquiries: 0 },
  };

  regData.forEach(function(r) {
    var val = (r[2] || "").toLowerCase();
    if (val.indexOf("madurai") !== -1) regions["Madurai"].views++;
    if (val.indexOf("coimbatore") !== -1) regions["Coimbatore"].views++;
    if (val.indexOf("trichy") !== -1 || val.indexOf("tiruchirappalli") !== -1) regions["Trichy"].views++;
    if (val.indexOf("mangalore") !== -1 || val.indexOf("mangaluru") !== -1) regions["Mangalore"].views++;
  });

  locData.forEach(function(r) {
    var val = (r[2] || "").toLowerCase();
    if (val.indexOf("madurai") !== -1) regions["Madurai"].corridors++;
    if (val.indexOf("coimbatore") !== -1) regions["Coimbatore"].corridors++;
    if (val.indexOf("trichy") !== -1) regions["Trichy"].corridors++;
    if (val.indexOf("mangalore") !== -1) regions["Mangalore"].corridors++;
  });

  longLeads.forEach(function(r) {
    var val = (r[7] || "").toLowerCase();
    if (val.indexOf("madurai") !== -1) regions["Madurai"].inquiries++;
    if (val.indexOf("coimbatore") !== -1) regions["Coimbatore"].inquiries++;
    if (val.indexOf("trichy") !== -1) regions["Trichy"].inquiries++;
    if (val.indexOf("mangalore") !== -1) regions["Mangalore"].inquiries++;
  });

  var rows = [
    ["GREENNEXT REGIONAL INTEREST ANALYSIS - SOUTH INDIA CORRIDORS"],
    ["Evaluates geographic attention and engagement across the four key digital infrastructure nodes."],
    [""],
    ["Focus Node", "Node Code", "Regional Page Views", "Corridor Inspections", "Direct Inquiries", "Primary Workload Alignment"],
    ["Madurai", "MDU", regions["Madurai"].views, regions["Madurai"].corridors, regions["Madurai"].inquiries, "Deep South AI Hub / Solar Energy Pairing"],
    ["Coimbatore", "CJB", regions["Coimbatore"].views, regions["Coimbatore"].corridors, regions["Coimbatore"].inquiries, "Industrial High-Density Compute / Western Corridor"],
    ["Trichy", "TRZ", regions["Trichy"].views, regions["Trichy"].corridors, regions["Trichy"].inquiries, "Central Tamil Nadu Transit Node / Low-PUE Edge"],
    ["Mangalore", "IXE", regions["Mangalore"].views, regions["Mangalore"].corridors, regions["Mangalore"].inquiries, "Coastal Subsea Cable Landings / High-Availability Gateway"],
  ];

  writeRows(sheet, rows, 6);
  sheet.getRange("A1:F1").setFontWeight("bold").setFontSize(13).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:F4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 6);

  if (regData.length > 0 || locData.length > 0 || longLeads.length > 0) {
    insertReportChartSafely(
      sheet,
      Charts.ChartType.COLUMN,
      [sheet.getRange("A5:A8"), sheet.getRange("C5:C8")],
      1,
      8,
      "Regional Engagement Comparison",
      { colors: ["#10B981"], legend: "none", width: 560, height: 320 }
    );
  }
}

/**
 * 3. CTA & Funnel Analytics Sheet
 */
function renderCtaAndFunnel(anaSs, ctaData, uniqueSessions, quickOpens, quickSubmits, longSubmits) {
  anaSs = resolveSpreadsheet(anaSs, ANALYTICS_SPREADSHEET_ID, "analytics");
  var sheet = getOrCreateSheet(anaSs, "CTA_and_Funnel");
  sheet.clear();
  clearCharts(sheet);

  var ctaCounts = {};
  ctaData.forEach(function(r) {
    var cta = r[2] || "Unspecified";
    ctaCounts[cta] = (ctaCounts[cta] || 0) + 1;
  });

  var rows = [
    ["GREENNEXT CTA & CONVERSION FUNNEL METRICS"],
    ["Tracks lead-generation touchpoints and user commitment progression."],
    [""],
    ["FUNNEL STAGE", "COUNT", "STAGE CONVERSION RATE", "NOTES"],
    ["1. Unique Visitors (Sessions)", uniqueSessions, "100.0%", "Baseline total traffic"],
    ["2. Quick Inquiry Opened", quickOpens, uniqueSessions > 0 ? ((quickOpens / uniqueSessions) * 100).toFixed(1) + "%" : "0%", "Users who clicked an inquiry CTA button"],
    ["3. Quick Inquiry Form Submitted", quickSubmits, quickOpens > 0 ? ((quickSubmits / quickOpens) * 100).toFixed(1) + "%" : "0%", "High-intent quick lead completions"],
    ["4. Long-Form Requirements Submitted", longSubmits, uniqueSessions > 0 ? ((longSubmits / uniqueSessions) * 100).toFixed(1) + "%" : "0%", "Detailed consultative technical inquiries"],
    [""],
    ["TOP CTA BUTTON / INTERACTION CLICKS"],
    ["CTA Identifier / Value", "Total Click Count"]
  ];

  var ctaList = Object.keys(ctaCounts).map(function(k) { return [k, ctaCounts[k]]; });
  ctaList.sort(function(a, b) { return b[1] - a[1]; });

  var finalData = rows.concat(ctaList.slice(0, 20));
  writeRows(sheet, finalData, 4);

  sheet.getRange("A1:D1").setFontWeight("bold").setFontSize(13).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:D4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.getRange("A10:D10").setFontWeight("bold").setBackground("#0F172A").setFontColor("#38BDF8");
  sheet.getRange("A11:B11").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 4);

  var hasFunnelData = uniqueSessions > 0 || quickOpens > 0 || quickSubmits > 0 || longSubmits > 0;
  if (hasFunnelData) {
    insertChartSafely(sheet, Charts.ChartType.COLUMN, [sheet.getRange("A4:B8")], 1, 6,
      "CTA Funnel Progression", "bottom");
  }

  if (ctaData.length > 0 && ctaList.length > 0) {
    var ctaEndRow = 11 + Math.min(ctaList.length, 20);
    insertChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A11:B" + ctaEndRow)], 20, 6,
      "CTA Interaction Counts", "none");
  }
}

/**
 * 4. Infrastructure & Energy Telemetry Sheet
 */
function renderInfraEnergyAnalytics(anaSs, infData, eneData, autData) {
  anaSs = resolveSpreadsheet(anaSs, ANALYTICS_SPREADSHEET_ID, "analytics");
  var sheet = getOrCreateSheet(anaSs, "Infrastructure_and_Energy");
  sheet.clear();
  clearCharts(sheet);

  var infraCounts = countValues(infData, 2);
  var energyCounts = countValues(eneData, 2);
  var autoCounts = countValues(autData, 2);

  var rows = [
    ["GREENNEXT TECHNICAL ARCHITECTURE ENGAGEMENT"],
    ["Analyzes user deep-dives into 7-layer stack, energy telemetry, and closed-loop automation."],
    [""],
    ["INFRASTRUCTURE STACK CAPABILITY", "VIEWS"],
  ];
  appendCounts(rows, infraCounts);

  rows.push([""]);
  rows.push(["ENERGY FLOW & THERMAL TOPIC", "VIEWS"]);
  appendCounts(rows, energyCounts);

  rows.push([""]);
  rows.push(["AUTOMATION & TELEMETRY NODE", "VIEWS"]);
  appendCounts(rows, autoCounts);

  writeRows(sheet, rows, 2);
  sheet.getRange("A1:B1").setFontWeight("bold").setFontSize(13).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:B4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 2);

  var infraCount = Object.keys(infraCounts).length;
  var energyCount = Object.keys(energyCounts).length;
  var automationCount = Object.keys(autoCounts).length;

  if (infData.length > 0 && infraCount > 0) {
    insertChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A4:B" + (4 + infraCount))], 1, 4,
      "Infrastructure Capability Views", "none");
  }

  if (eneData.length > 0 && energyCount > 0) {
    var energyHeaderRow = 6 + infraCount;
    insertChartSafely(sheet, Charts.ChartType.BAR, [
      sheet.getRange("A" + energyHeaderRow + ":B" + (energyHeaderRow + energyCount))
    ], 20, 4, "Energy and Thermal Topic Views", "none");
  }

  if (autData.length > 0 && automationCount > 0) {
    var automationHeaderRow = 8 + infraCount + energyCount;
    insertChartSafely(sheet, Charts.ChartType.BAR, [
      sheet.getRange("A" + automationHeaderRow + ":B" + (automationHeaderRow + automationCount))
    ], 39, 4, "Automation Telemetry Views", "none");
  }
}

/**
 * 5. AI Assistant Telemetry Sheet
 */
function renderAiAssistantAnalytics(anaSs, aiData) {
  anaSs = resolveSpreadsheet(anaSs, ANALYTICS_SPREADSHEET_ID, "analytics");
  var sheet = getOrCreateSheet(anaSs, "AI_Assistant_Telemetry");
  sheet.clear();
  clearCharts(sheet);

  var opens = 0;
  var queries = 0;
  var suggestions = 0;
  var links = 0;
  var topicCounts = {};

  aiData.forEach(function(r) {
    var evt = r[1];
    var val = r[2] || "";
    if (evt === "chatbot_open") opens++;
    if (evt === "chatbot_query_send") {
      queries++;
      topicCounts[val] = (topicCounts[val] || 0) + 1;
    }
    if (evt === "chatbot_suggestion_select") {
      suggestions++;
      topicCounts[val] = (topicCounts[val] || 0) + 1;
    }
    if (evt === "chatbot_link_click") links++;
  });

  var rows = [
    ["GREENNEXT AI ASSISTANT TELEMETRY & INTENT DISTRIBUTION"],
    ["Privacy-Preserving Telemetry (Sanitized Topics Only - No Private Text Stored)"],
    [""],
    ["INTERACTION TYPE", "COUNT"],
    ["Chatbot Widget Opens", opens],
    ["User Inquiries Dispatched", queries],
    ["Preset Suggestions Selected", suggestions],
    ["Resource Links Clicked", links],
    [""],
    ["SANITIZED TOPIC / INTENT CATEGORY", "OCCURRENCES"],
  ];
  appendCounts(rows, topicCounts);

  writeRows(sheet, rows, 2);
  sheet.getRange("A1:B1").setFontWeight("bold").setFontSize(13).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:B4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 2);

  if (aiData.length > 0) {
    insertChartSafely(sheet, Charts.ChartType.COLUMN, [sheet.getRange("A4:B8")], 1, 4,
      "AI Assistant Interaction Types", "bottom");
  }

  var topicCount = Object.keys(topicCounts).length;
  if (aiData.length > 0 && topicCount > 0) {
    insertChartSafely(sheet, Charts.ChartType.BAR, [
      sheet.getRange("A10:B" + (10 + topicCount))
    ], 20, 4, "AI Assistant Topics and Intents", "none");
  }
}

// ─── 3. UTILITIES & INITIALIZERS ───────────────────────────────────────────

/**
 * Ensures a renderer has the Spreadsheet instance for the requested document.
 * This also makes direct/manual renderer calls safe if the argument is omitted
 * or an object from the other spreadsheet is accidentally passed.
 */
function resolveSpreadsheet(ss, spreadsheetId, label) {
  var hasSheetApi = ss && typeof ss.getSheetByName === "function";
  var isExpectedSpreadsheet = hasSheetApi &&
    (typeof ss.getId !== "function" || ss.getId() === spreadsheetId);

  if (isExpectedSpreadsheet) return ss;

  var resolved = SpreadsheetApp.openById(spreadsheetId);
  if (!resolved || typeof resolved.getSheetByName !== "function") {
    throw new Error("Unable to resolve the " + label + " spreadsheet.");
  }
  return resolved;
}

function getOrCreateSheet(ss, name, headers) {
  if (!ss || typeof ss.getSheetByName !== "function") {
    throw new Error("A valid Spreadsheet instance is required for sheet: " + name);
  }

  var s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      s.appendRow(headers);
      s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
      s.setFrozenRows(1);
    }
  }
  return s;
}

/**
 * Removes charts previously generated by this refresh so repeated updates do
 * not accumulate duplicate visualizations. Existing cell tables are untouched.
 */
function clearCharts(sheet) {
  try {
    sheet.getCharts().forEach(function(chart) {
      sheet.removeChart(chart);
    });
  } catch (err) {
    Logger.log("Chart cleanup skipped: " + err.toString());
  }
}

/**
 * Adds a chart only when its source ranges are valid. A chart failure is
 * isolated from the analytics table refresh and never aborts the update.
 */
function insertChartSafely(sheet, chartType, ranges, row, column, title, legendPosition) {
  try {
    if (!sheet || !ranges || ranges.length === 0) return;

    var builder = sheet.newChart().setChartType(chartType);
    ranges.forEach(function(range) {
      if (range) builder.addRange(range);
    });

    builder.setPosition(row, column, 0, 0)
      .setOption("title", title)
      .setOption("legend", { position: legendPosition || "bottom" })
      .setOption("width", 520)
      .setOption("height", 300);

    sheet.insertChart(builder.build());
  } catch (err) {
    Logger.log("Chart creation skipped for " + title + ": " + err.toString());
  }
}

function getSheetRows(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) return [];
  var lastRow = s.getLastRow();
  var lastColumn = s.getLastColumn();
  if (lastRow <= 1 || lastColumn <= 0) return [];
  return s.getRange(2, 1, lastRow - 1, lastColumn).getValues();
}

function countValues(rows, colIndex) {
  var counts = {};
  (Array.isArray(rows) ? rows : []).forEach(function(r) {
    var v = (Array.isArray(r) ? r[colIndex] : "") || "Unspecified";
    counts[v] = (counts[v] || 0) + 1;
  });
  return counts;
}

function appendCounts(rows, map) {
  var list = Object.keys(map || {}).map(function(k) { return [k, map[k]]; });
  list.sort(function(a, b) { return b[1] - a[1]; });
  list.forEach(function(item) { rows.push(item); });
  if (list.length === 0) rows.push(["None recorded", 0]);
}

/**
 * Writes a rectangular table. Every row is normalized to the same width
 * before the range is created, preventing Google Sheets setValues() width
 * mismatches when title or spacer rows contain fewer cells.
 */
function writeRows(sheet, rows, columnCount) {
  var safeRows = Array.isArray(rows) ? rows : [];
  var width = Number(columnCount);
  if (!isFinite(width) || width < 1) width = 1;
  width = Math.floor(width);

  if (safeRows.length === 0) return;

  sheet.getRange(1, 1, safeRows.length, width).setValues(padRows(safeRows, width));
}

function padRows(arr, len) {
  var width = Number(len);
  if (!isFinite(width) || width < 1) width = 1;
  width = Math.floor(width);

  return (Array.isArray(arr) ? arr : []).map(function(row) {
    var copy = Array.isArray(row) ? row.slice(0) : [];
    while (copy.length < width) copy.push("");
    return copy.slice(0, width);
  });
}

function setupBehavioralSheetIfMissing(rawSs, targetSheet) {
  var schemaMap = {
    "Navigation": ["Timestamp", "Event", "Page", "Destination", "Session ID"],
    "Regions": ["Timestamp", "Event", "Region", "Page", "Session ID"],
    "Infrastructure": ["Timestamp", "Event", "Capability", "Page", "Session ID"],
    "Energy": ["Timestamp", "Event", "Topic", "Page", "Session ID"],
    "Automation": ["Timestamp", "Event", "Feature", "Page", "Session ID"],
    "Solutions": ["Timestamp", "Event", "Solution", "Page", "Session ID"],
    "Industries": ["Timestamp", "Event", "Industry", "Page", "Session ID"],
    "Locations": ["Timestamp", "Event", "Location", "Page", "Session ID"],
    "AI Assistant": ["Timestamp", "Event", "Input / Selection", "Page", "Session ID"],
    "CTA Interactions": ["Timestamp", "Event", "CTA", "Page", "Session ID"]
  };
  var headers = schemaMap[targetSheet] || ["Timestamp", "Event", "Value", "Page", "Session ID"];
  return getOrCreateSheet(rawSs, targetSheet, headers);
}

/**
 * Custom UI Menu in Google Sheets for Administrators
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("GreenNext")
    .addItem("🔄 Update Analytics & Reports", "updateAnalyticsSpreadsheet")
    .addItem("📊 Refresh Analytics Now", "updateAnalyticsSpreadsheet")
    .addItem("⚙️ Setup Analytics Sheets Structure", "setupAnalyticsSpreadsheet")
    .addToUi();
}

function setupAnalyticsSpreadsheet() {
  updateAnalyticsSpreadsheet();
  SpreadsheetApp.getUi().alert("GreenNext Analytics Derived Sheets initialized successfully.");
}

// ─── 4. DAILY / WEEKLY / MONTHLY REPORTING LAYER ──────────────────────────

var REPORT_TIMEZONE_FALLBACK = "Asia/Kolkata";
var ANALYTICS_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18/edit";
var REPORT_LEAD_TYPES = [
  "Technical Consultation / Session Booking",
  "Partner / Collaboration Inquiry",
  "Technical Infrastructure Inquiry",
  "General Contact Inquiry",
  "Career Inquiry"
];

/** Refreshes only the additive report tabs. Existing analytics tabs are untouched. */
function updateReportingLayer() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var timezone = getReportingTimezone(rawSs);
  var source = loadReportingSource(rawSs);
  var today = formatReportDate(new Date(), timezone);
  var tomorrow = addReportDays(today, 1);

  buildDailyReport(source, timezone, { start: today, end: tomorrow });

  var weekStart = startOfReportWeek(today);
  var previousWeekStart = addReportDays(weekStart, -7);
  buildWeeklyReport(source, timezone, {
    start: weekStart,
    end: addReportDays(weekStart, 7),
    previousStart: previousWeekStart,
    previousEnd: weekStart
  });

  var monthStart = today.substring(0, 8) + "01";
  var nextMonth = addReportMonths(monthStart, 1);
  var previousMonthStart = addReportMonths(monthStart, -1);
  buildMonthlyReport(source, timezone, {
    start: monthStart,
    end: nextMonth,
    previousStart: previousMonthStart,
    previousEnd: monthStart
  });
}

/**
 * Builds the additive website-intelligence model from existing raw records.
 * This model never writes to the RAW DATA spreadsheet and never treats a
 * behavioral lead_conversion event as a separate lead record.
 */
function buildAdvancedWebsiteIntelligenceModel(source, timezone) {
  var eventRecords = [];
  var eventSources = [
    ["Navigation", source.Navigation],
    ["Regions", source.Regions],
    ["Infrastructure", source.Infrastructure],
    ["Energy", source.Energy],
    ["Automation", source.Automation],
    ["Solutions", source.Solutions],
    ["Industries", source.Industries],
    ["Locations", source.Locations],
    ["AI Assistant", source["AI Assistant"]],
    ["CTA Interactions", source["CTA Interactions"]]
  ];
  eventSources.forEach(function(item) {
    (item[1] || []).forEach(function(row, index) {
      eventRecords.push({
        source: item[0],
        event: String(row[1] || ""),
        value: String(row[2] || ""),
        page: item[0] === "Navigation" ? String(row[2] || "") : String(row[3] || ""),
        destination: item[0] === "Navigation" ? String(row[3] || "") : "",
        timestamp: advancedRecordTime(row[0]),
        sourceIndex: index,
        sessionId: advancedSessionId(row),
        row: row
      });
    });
  });

  var leadRecords = [];
  (source.Lead_Submissions || []).forEach(function(row, index) {
    leadRecords.push({
      type: String(row[1] || ""),
      region: String(row[6] || ""),
      documentAttached: String(row[12] || "").toLowerCase() === "yes",
      sessionId: String(row[10] || ""),
      sessionKind: String(row[11] || ""),
      timestamp: advancedRecordTime(row[0]),
      source: "Lead_Submissions",
      sourceIndex: index
    });
  });
  (source.Quick_Inquiries || []).forEach(function(row, index) {
    leadRecords.push({
      type: "General Contact Inquiry",
      region: "",
      documentAttached: false,
      sessionId: String(row[8] || ""),
      sessionKind: "",
      timestamp: advancedRecordTime(row[0]),
      source: "Quick_Inquiries",
      sourceIndex: index
    });
  });
  (source.Contact_Submissions || []).forEach(function(row, index) {
    leadRecords.push({
      type: "Technical Infrastructure Inquiry",
      region: String(row[7] || ""),
      documentAttached: false,
      sessionId: String(row[10] || ""),
      sessionKind: "",
      timestamp: advancedRecordTime(row[0]),
      source: "Contact_Submissions",
      sourceIndex: index
    });
  });

  var sessions = {};
  function ensureSession(sessionId) {
    if (!advancedUsableSession(sessionId)) return null;
    if (!sessions[sessionId]) sessions[sessionId] = { events: [], leads: [], kinds: {} };
    return sessions[sessionId];
  }
  eventRecords.forEach(function(record) {
    var session = ensureSession(record.sessionId);
    if (session) session.events.push(record);
  });
  leadRecords.forEach(function(lead) {
    var session = ensureSession(lead.sessionId);
    if (session) {
      session.leads.push(lead);
      if (lead.sessionKind) session.kinds[lead.sessionKind] = true;
    }
  });

  Object.keys(sessions).forEach(function(sessionId) {
    sessions[sessionId].events.sort(advancedCompareRecords);
    sessions[sessionId].leads.sort(advancedCompareRecords);
  });

  var sessionIds = Object.keys(sessions);
  var newSessions = sessionIds.filter(function(id) { return sessions[id].kinds.new_session; }).length;
  var returningSessions = sessionIds.filter(function(id) { return sessions[id].kinds.returning_session; }).length;
  var leadSessionIds = {};
  leadRecords.forEach(function(lead) {
    if (advancedUsableSession(lead.sessionId)) leadSessionIds[lead.sessionId] = true;
  });
  var engagedSessionIds = {};
  var ctaSessionIds = {};
  var formOpenSessionIds = {};
  var formStartSessionIds = {};
  var formSubmitSessionIds = {};
  eventRecords.forEach(function(record) {
    if (!advancedUsableSession(record.sessionId)) return;
    if (record.source === "CTA Interactions") {
      ctaSessionIds[record.sessionId] = true;
      engagedSessionIds[record.sessionId] = true;
      if (record.event === "form_open") formOpenSessionIds[record.sessionId] = true;
      if (record.event === "form_start") formStartSessionIds[record.sessionId] = true;
      if (record.event === "lead_conversion") formSubmitSessionIds[record.sessionId] = true;
      if (record.event === "lead_conversion") {
        // This is journey telemetry only; lead counts come from real submissions.
      }
    }
    if (/^scroll_(25|50|75|90|100)$/.test(record.event) || /^engagement_(30|60|120)s$/.test(record.event)) {
      engagedSessionIds[record.sessionId] = true;
    }
  });
  leadRecords.forEach(function(lead) {
    if (advancedUsableSession(lead.sessionId)) formSubmitSessionIds[lead.sessionId] = true;
  });

  var interestRows = buildAdvancedInterestRows(eventRecords, leadSessionIds);
  var interestAggregate = {};
  interestRows.forEach(function(row) {
    var key = row[1];
    if (!interestAggregate[key]) interestAggregate[key] = 0;
    interestAggregate[key] += Number(row[2]) || 0;
  });
  var regionalRows = buildAdvancedRegionalRows(eventRecords, leadRecords, interestRows);
  var ai = buildAdvancedAiMetrics(eventRecords, sessions, leadSessionIds, ctaSessionIds, formStartSessionIds, timezone);
  var journeys = buildAdvancedJourneyMetrics(sessions);
  var sessionAverages = advancedSessionAverages(sessions);
  var engagement = buildAdvancedEngagementMetrics(eventRecords, sessionIds, engagedSessionIds, ctaSessionIds, formOpenSessionIds, formStartSessionIds, formSubmitSessionIds, leadSessionIds);
  var associations = buildAdvancedAssociations(eventRecords);
  var topInterest = advancedTopEntry(interestAggregate);
  var topRegion = advancedTopEntry(regionalRows.reduce(function(map, row) {
    map[row[0]] = Number(row[1]) || 0;
    return map;
  }, {}));

  var summary = {
    newSessions: newSessions,
    returningSessions: returningSessions,
    engagedSessions: Object.keys(engagedSessionIds).length,
    ctaInteractions: eventRecords.filter(function(record) { return record.source === "CTA Interactions"; }).length,
    formStarts: eventRecords.filter(function(record) { return record.source === "CTA Interactions" && record.event === "form_start"; }).length,
    formAbandonments: eventRecords.filter(function(record) { return record.source === "CTA Interactions" && record.event === "form_abandon"; }).length,
    leads: leadRecords.length,
    leadConversionRate: sessionIds.length ? advancedPercent(Object.keys(leadSessionIds).length, sessionIds.length) : "N/A",
    topContentInterest: topInterest ? topInterest[0] : "N/A",
    topRegion: topRegion ? topRegion[0] : "N/A",
    aiInteractions: (source["AI Assistant"] || []).length,
    leadsWithDocuments: leadRecords.filter(function(lead) { return lead.documentAttached; }).length,
    averageEventsPerSession: sessionAverages.events,
    averagePagesPerSession: sessionAverages.pages
  };

  return {
    source: source,
    timezone: timezone,
    eventRecords: eventRecords,
    leadRecords: leadRecords,
    sessions: sessions,
    sessionIds: sessionIds,
    leadSessionIds: leadSessionIds,
    interestRows: interestRows,
    regionalRows: regionalRows,
    ai: ai,
    journeys: journeys,
    engagement: engagement,
    associations: associations,
    summary: summary
  };
}

function updateAdvancedWebsiteIntelligence(anaSs, model) {
  renderAdvancedJourneyAnalysis(anaSs, model);
  renderAdvancedEngagementAnalysis(anaSs, model);
  renderAdvancedInterestAnalysis(anaSs, model);
  renderAdvancedRegionalAnalysis(anaSs, model);
  renderAdvancedAiAnalysis(anaSs, model);
  renderAdvancedLeadAnalysis(anaSs, model);
  renderAdvancedAssociationAnalysis(anaSs, model);
}

function advancedSessionId(row) {
  if (!row || !row.length) return "";
  if (row.length === 16) return String(row[10] || "");
  return String(row[row.length - 1] || "");
}

function advancedUsableSession(sessionId) {
  return !!sessionId && sessionId !== "session_fallback" && sessionId !== "Session ID";
}

function advancedRecordTime(value) {
  var date = value instanceof Date ? value : new Date(value);
  return date && !isNaN(date.getTime()) ? date.getTime() : 0;
}

function advancedCompareRecords(left, right) {
  if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp;
  return (left.sourceIndex || 0) - (right.sourceIndex || 0);
}

function advancedDateKey(timestamp, timezone) {
  if (!timestamp) return "Unknown date";
  try {
    return Utilities.formatDate(new Date(timestamp), timezone || REPORT_TIMEZONE_FALLBACK, "yyyy-MM-dd");
  } catch (err) {
    return new Date(timestamp).toISOString().substring(0, 10);
  }
}

function advancedRecordLabel(record) {
  if (record.source === "Navigation" && record.destination) return record.destination;
  return record.page || record.value || record.event || "Unspecified event";
}

function advancedIncrement(map, key, amount) {
  map[key] = (map[key] || 0) + (amount || 1);
}

function advancedTopRows(map, limit) {
  return Object.keys(map || {}).map(function(key) { return [key, map[key]]; })
    .sort(function(a, b) { return Number(b[1]) - Number(a[1]); })
    .slice(0, limit || 10);
}

function advancedTopEntry(map) {
  var rows = advancedTopRows(map, 1);
  return rows.length ? rows[0] : null;
}

function advancedPercent(numerator, denominator) {
  return denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) + "%" : "N/A";
}

function buildAdvancedJourneyMetrics(sessions) {
  var first = {};
  var next = {};
  var paths = {};
  var beforeCta = {};
  var beforeLead = {};
  var afterLead = {};
  Object.keys(sessions).forEach(function(sessionId) {
    var events = sessions[sessionId].events;
    var labels = events.map(advancedRecordLabel).filter(Boolean);
    if (labels.length) advancedIncrement(first, labels[0]);
    for (var i = 0; i < labels.length - 1; i++) {
      advancedIncrement(next, labels[i] + " → " + labels[i + 1]);
    }
    if (labels.length) advancedIncrement(paths, labels.slice(0, 5).join(" → "));

    var ctaIndex = events.findIndex(function(record) { return record.source === "CTA Interactions"; });
    if (ctaIndex > 0) advancedIncrement(beforeCta, events.slice(Math.max(0, ctaIndex - 4), ctaIndex).map(advancedRecordLabel).join(" → ") + " → CTA Interaction");
    var lead = sessions[sessionId].leads[0];
    if (lead && lead.timestamp) {
      var leadIndex = events.filter(function(record) { return record.timestamp && record.timestamp <= lead.timestamp; }).length;
      if (leadIndex > 0) advancedIncrement(beforeLead, events.slice(Math.max(0, leadIndex - 4), leadIndex).map(advancedRecordLabel).join(" → ") + " → Lead");
      var after = events.slice(leadIndex, leadIndex + 4).map(advancedRecordLabel).filter(Boolean);
      if (after.length) advancedIncrement(afterLead, "Lead → " + after.join(" → "));
    }
  });
  return {
    first: advancedTopRows(first, 10),
    next: advancedTopRows(next, 10),
    paths: advancedTopRows(paths, 15),
    beforeCta: advancedTopRows(beforeCta, 15),
    beforeLead: advancedTopRows(beforeLead, 15),
    afterLead: advancedTopRows(afterLead, 15)
  };
}

function advancedSessionAverages(sessions) {
  var ids = Object.keys(sessions);
  if (!ids.length) return { events: "N/A", pages: "N/A" };
  var eventTotal = 0;
  var pageTotal = 0;
  ids.forEach(function(id) {
    var pages = {};
    eventTotal += sessions[id].events.length;
    sessions[id].events.forEach(function(record) {
      if (record.page) pages[record.page] = true;
    });
    pageTotal += Object.keys(pages).length;
  });
  return {
    events: (eventTotal / ids.length).toFixed(2),
    pages: (pageTotal / ids.length).toFixed(2)
  };
}

function buildAdvancedEngagementMetrics(eventRecords, sessionIds, engaged, cta, formOpen, formStart, formSubmit, leads) {
  var counts = {};
  ["scroll_25", "scroll_50", "scroll_75", "scroll_90", "scroll_100", "engagement_30s", "engagement_60s", "engagement_120s", "form_open", "form_start", "form_abandon"].forEach(function(eventName) {
    counts[eventName] = eventRecords.filter(function(record) { return record.source === "CTA Interactions" && record.event === eventName; }).length;
  });
  var stages = [
    ["Sessions", sessionIds.length],
    ["Engaged Sessions", Object.keys(engaged).length],
    ["CTA Interaction", Object.keys(cta).length],
    ["Form Open", Object.keys(formOpen).length],
    ["Form Start", Object.keys(formStart).length],
    ["Form Submit", Object.keys(formSubmit).length],
    ["Lead", Object.keys(leads).length]
  ];
  var funnel = stages.map(function(stage, index) {
    var previous = index ? stages[index - 1][1] : null;
    return [stage[0], stage[1], previous && previous > 0 ? advancedPercent(stage[1], previous) : "N/A"];
  });
  var scrollRows = [["Scroll Depth", "Interactions"]];
  [["25%", "scroll_25"], ["50%", "scroll_50"], ["75%", "scroll_75"], ["90%", "scroll_90"], ["100%", "scroll_100"]].forEach(function(item) {
    scrollRows.push([item[0], counts[item[1]]]);
  });
  var engagementRows = [["Milestone", "Engagement Events"]];
  [["30 seconds", "engagement_30s"], ["60 seconds", "engagement_60s"], ["120 seconds", "engagement_120s"]].forEach(function(item) {
    engagementRows.push([item[0], counts[item[1]]]);
  });
  return { counts: counts, funnel: funnel, scrollRows: scrollRows, engagementRows: engagementRows };
}

function buildAdvancedInterestRows(eventRecords, leadSessionIds) {
  var allowed = { Regions: true, Infrastructure: true, Energy: true, Automation: true, Solutions: true, Industries: true, Locations: true, "AI Assistant": true };
  var aggregate = {};
  eventRecords.forEach(function(record) {
    if (!allowed[record.source]) return;
    var interest = record.value || "Unspecified";
    var key = record.source + "\u0000" + interest;
    if (!aggregate[key]) aggregate[key] = { category: record.source, interest: interest, interactions: 0, sessions: {}, leads: {} };
    aggregate[key].interactions++;
    if (advancedUsableSession(record.sessionId)) {
      aggregate[key].sessions[record.sessionId] = true;
      if (leadSessionIds[record.sessionId]) aggregate[key].leads[record.sessionId] = true;
    }
  });
  return Object.keys(aggregate).map(function(key) {
    var item = aggregate[key];
    return [item.category, item.interest, item.interactions,
      Object.keys(item.sessions).length || "N/A",
      Object.keys(item.sessions).length ? Object.keys(item.leads).length : "N/A"];
  }).sort(function(a, b) { return Number(b[2]) - Number(a[2]); });
}

function buildAdvancedRegionalRows(eventRecords, leadRecords, interestRows) {
  var regions = ["Madurai", "Coimbatore", "Trichy", "Mangalore"];
  var rows = regions.map(function(region) {
    var normalized = region.toLowerCase();
    var activity = eventRecords.filter(function(record) {
      return (record.source === "Regions" || record.source === "Locations") && record.value.toLowerCase().indexOf(normalized) !== -1;
    }).length;
    var inquiries = leadRecords.filter(function(lead) { return lead.region.toLowerCase().indexOf(normalized) !== -1; }).length;
    var leads = inquiries;
    var top = {};
    interestRows.forEach(function(item) {
      if ((item[0] === "Regions" || item[0] === "Locations") && item[1].toLowerCase().indexOf(normalized) !== -1) advancedIncrement(top, item[1], Number(item[2]) || 0);
    });
    var topInterest = advancedTopEntry(top);
    return [region, activity, inquiries, leads, topInterest ? topInterest[0] : "N/A"];
  });
  return rows;
}

function buildAdvancedAiMetrics(eventRecords, sessions, leadSessionIds, ctaSessionIds, formStartSessionIds, timezone) {
  var aiEvents = eventRecords.filter(function(record) { return record.source === "AI Assistant"; });
  var topics = {};
  var trend = {};
  var aiSessions = {};
  aiEvents.forEach(function(record) {
    advancedIncrement(topics, record.value || record.event || "Unspecified");
    advancedIncrement(trend, advancedDateKey(record.timestamp, timezone));
    if (advancedUsableSession(record.sessionId)) aiSessions[record.sessionId] = true;
  });
  var assistantLeadSessions = Object.keys(aiSessions).filter(function(id) { return leadSessionIds[id]; }).length;
  var assistantCtaSessions = Object.keys(aiSessions).filter(function(id) { return ctaSessionIds[id]; }).length;
  var assistantFormSessions = Object.keys(aiSessions).filter(function(id) { return formStartSessionIds[id]; }).length;
  var kinds = { new_session: {}, returning_session: {} };
  Object.keys(aiSessions).forEach(function(id) {
    var session = sessions[id];
    if (session && session.kinds.new_session) kinds.new_session[id] = true;
    if (session && session.kinds.returning_session) kinds.returning_session[id] = true;
  });
  return {
    interactions: aiEvents.length,
    sessions: Object.keys(aiSessions).length,
    newSessions: Object.keys(kinds.new_session).length,
    returningSessions: Object.keys(kinds.returning_session).length,
    topics: advancedTopRows(topics, 15),
    trend: advancedTopRows(trend, 31).sort(function(a, b) { return String(a[0]).localeCompare(String(b[0])); }),
    ctaSessions: assistantCtaSessions,
    formStartSessions: assistantFormSessions,
    leadSessions: assistantLeadSessions,
    conversionRate: Object.keys(aiSessions).length ? advancedPercent(assistantLeadSessions, Object.keys(aiSessions).length) : "N/A"
  };
}

function buildAdvancedAssociations(eventRecords) {
  var bySession = {};
  eventRecords.forEach(function(record) {
    if (!advancedUsableSession(record.sessionId)) return;
    if (["Infrastructure", "Energy", "Automation"].indexOf(record.source) === -1) return;
    if (!bySession[record.sessionId]) bySession[record.sessionId] = { Infrastructure: {}, Energy: {}, Automation: {} };
    bySession[record.sessionId][record.source][record.value || "Unspecified"] = true;
  });
  var pairs = [["Infrastructure", "Energy"], ["Energy", "Automation"], ["Infrastructure", "Automation"]].map(function(pair) {
    var sessions = Object.keys(bySession).filter(function(id) {
      return Object.keys(bySession[id][pair[0]]).length && Object.keys(bySession[id][pair[1]]).length;
    });
    return [pair[0] + " ↔ " + pair[1], sessions.length, "Observed session overlap; no causation implied"];
  });
  return { pairs: pairs, rows: [["Category", "Interest", "Interactions"]].concat(advancedInterestAssociationRows(eventRecords)) };
}

function advancedInterestAssociationRows(eventRecords) {
  var map = {};
  eventRecords.forEach(function(record) {
    if (["Infrastructure", "Energy", "Automation"].indexOf(record.source) === -1) return;
    var key = record.source + "\u0000" + (record.value || "Unspecified");
    advancedIncrement(map, key);
  });
  return Object.keys(map).map(function(key) {
    var parts = key.split("\u0000");
    return [parts[0], parts[1], map[key]];
  }).sort(function(a, b) { return Number(b[2]) - Number(a[2]); });
}

function advancedSheet(anaSs, name, width) {
  var sheet = getOrCreateSheet(anaSs, name);
  sheet.clear();
  clearCharts(sheet);
  return sheet;
}

function styleAdvancedSheet(sheet, width, headerRows) {
  sheet.getRange(1, 1, 1, width).setFontWeight("bold").setFontSize(13).setBackground("#0F172A").setFontColor("#10B981");
  (headerRows || []).forEach(function(row) {
    sheet.getRange(row, 1, 1, width).setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  });
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, width);
}

function renderAdvancedJourneyAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Journey_Analysis", 3);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - SESSION JOURNEYS"],
    ["Session-level paths are based only on records with usable Session ID values; incomplete telemetry is labeled accordingly."],
    [""],
    ["JOURNEY KPI", "VALUE", "OBSERVABLE BASIS"],
    ["Total Sessions", model.sessionIds.length, "Distinct usable Session ID values"],
    ["New Sessions", model.summary.newSessions, "Session Kind: new_session where available"],
    ["Returning Sessions", model.summary.returningSessions, "Session Kind: returning_session where available"],
    ["Average Events per Session", model.summary.averageEventsPerSession, "Derived from ordered session records"],
    ["Average Pages per Session", model.summary.averagePagesPerSession, "Distinct observed page labels per session"],
    ["Sessions Reaching a Lead", Object.keys(model.leadSessionIds).length, "Distinct lead-associated sessions"],
    ["Journey Coverage", model.sessionIds.length ? "Session ordered; incomplete when telemetry is missing" : "N/A", "Timestamps used when available"],
    [""],
    ["TOP JOURNEY PATHS", "SESSIONS", "NOTE"]
  ];
  model.journeys.paths.forEach(function(row) { rows.push([row[0], row[1], "First five observed destinations/events"]); });
  rows.push([""]); rows.push(["MOST COMMON FIRST RECORDED PAGE / EVENT", "SESSIONS"]);
  model.journeys.first.forEach(function(row) { rows.push(row); });
  rows.push([""]); rows.push(["MOST COMMON NEXT RECORDED DESTINATION / EVENT", "SESSIONS"]);
  model.journeys.next.forEach(function(row) { rows.push(row); });
  rows.push([""]); rows.push(["COMMON PATHS BEFORE CTA INTERACTION", "SESSIONS"]);
  model.journeys.beforeCta.forEach(function(row) { rows.push(row); });
  rows.push([""]); rows.push(["COMMON PATHS BEFORE FORM SUBMISSION / LEAD", "SESSIONS"]);
  model.journeys.beforeLead.forEach(function(row) { rows.push(row); });
  rows.push([""]); rows.push(["LEAD FOLLOW-ON JOURNEYS", "SESSIONS"]);
  model.journeys.afterLead.forEach(function(row) { rows.push(row); });
  writeRows(sheet, rows, 3);
  styleAdvancedSheet(sheet, 3, [4, 13]);
  if (model.journeys.paths.length) {
    insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A13:B" + (13 + model.journeys.paths.length))], 1, 5,
      "Top Observed Journey Paths", { colors: ["#06B6D4"], legend: "none", width: 620, height: 360 });
  }
}

function renderAdvancedEngagementAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Engagement_Analysis", 3);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - ENGAGEMENT"],
    ["Counts are observed events; session metrics use usable Session ID values and valid denominators only."],
    [""],
    ["ENGAGEMENT KPI", "VALUE", "RATE / BASIS"],
    ["Total Sessions", model.sessionIds.length, "Distinct usable Session ID values"],
    ["New Sessions", model.summary.newSessions, "Session Kind: new_session where available"],
    ["Returning Sessions", model.summary.returningSessions, "Session Kind: returning_session where available"],
    ["Engaged Sessions", model.summary.engagedSessions, model.sessionIds.length ? advancedPercent(model.summary.engagedSessions, model.sessionIds.length) : "N/A"],
    ["CTA Interaction Sessions", model.engagement.funnel[2][1], model.sessionIds.length ? advancedPercent(model.engagement.funnel[2][1], model.sessionIds.length) : "N/A"],
    ["Form Open Events", model.engagement.counts.form_open, "Observed CTA Interactions events"],
    ["Form Start Events", model.engagement.counts.form_start, "Observed CTA Interactions events"],
    ["Form Abandonment Events", model.engagement.counts.form_abandon, "Observed CTA Interactions events"],
    ["Lead Records", model.leadRecords.length, "Actual submission records; lead_conversion telemetry excluded"],
    [""],
    ["SCROLL DEPTH PROGRESSION", "INTERACTIONS"],
  ].concat(model.engagement.scrollRows.slice(1));
  rows.push([""]); rows.push(["ENGAGEMENT MILESTONES", "ENGAGEMENT EVENTS"]);
  rows = rows.concat(model.engagement.engagementRows.slice(1));
  rows.push([""]); rows.push(["SESSION-LEVEL FUNNEL", "SESSIONS", "STEP RATE"]);
  rows = rows.concat(model.engagement.funnel);
  writeRows(sheet, rows, 3);
  styleAdvancedSheet(sheet, 3, [4, 15, 22, 27]);
  insertReportChartSafely(sheet, Charts.ChartType.LINE, [sheet.getRange("A15:B20")], 1, 5,
    "Scroll Depth Progression", { colors: ["#06B6D4"], legend: "none", width: 520, height: 300, pointSize: 5 });
  insertReportChartSafely(sheet, Charts.ChartType.COLUMN, [sheet.getRange("A22:B25")], 1, 12,
    "Engagement Milestones", { colors: ["#64748B"], legend: "none", width: 520, height: 300 });
  insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A27:B34")], 18, 5,
    "Observed Session Funnel", { colors: ["#10B981"], legend: "none", width: 520, height: 340 });
}

function renderAdvancedInterestAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Interest_Analysis", 5);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - NORMALIZED INTERESTS"],
    ["Unique sessions and associated leads are N/A when Session ID linkage is unavailable."],
    [""],
    ["CATEGORY", "INTEREST", "INTERACTIONS", "UNIQUE SESSIONS", "LEADS ASSOCIATED"]
  ].concat(model.interestRows);
  var overall = {};
  model.interestRows.forEach(function(row) { advancedIncrement(overall, row[1], Number(row[2]) || 0); });
  rows.push([""]); rows.push(["OVERALL INTEREST", "INTERACTIONS"]);
  var overallRows = advancedTopRows(overall, 15);
  rows = rows.concat(overallRows);
  writeRows(sheet, rows, 5);
  styleAdvancedSheet(sheet, 5, [4, 6 + model.interestRows.length]);
  if (overallRows.length) {
    var start = 6 + model.interestRows.length;
    insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A" + start + ":B" + (start + overallRows.length))], 1, 7,
      "Overall Interest Interactions", { colors: ["#10B981"], legend: "none", width: 620, height: 360 });
  }
}

function renderAdvancedRegionalAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Regional_Analysis", 5);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - REGIONAL ANALYSIS"],
    ["This extends, but does not replace, Regional_Analytics. Regional relationships are observed associations only."],
    [""],
    ["REGION", "BEHAVIORAL ACTIVITY", "INQUIRIES", "LEADS", "TOP INTEREST"]
  ].concat(model.regionalRows);
  writeRows(sheet, rows, 5);
  styleAdvancedSheet(sheet, 5, [4]);
  insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A4:B8")], 1, 7,
    "Regional Behavioral Activity", { colors: ["#10B981"], legend: "none", width: 560, height: 320 });
}

function renderAdvancedAiAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_AI_Analysis", 3);
  var ai = model.ai;
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - AI ASSISTANT"],
    ["Only observed AI Assistant telemetry is included; no responses or intent are inferred."],
    [""],
    ["AI ASSISTANT KPI", "VALUE", "BASIS"],
    ["Total Interactions", ai.interactions, "AI Assistant records"],
    ["Unique Sessions", ai.sessions, "Usable Session ID values"],
    ["New Session Users", ai.newSessions, "Session Kind where available"],
    ["Returning Session Users", ai.returningSessions, "Session Kind where available"],
    ["Assistant → CTA Sessions", ai.ctaSessions, "Observed session overlap"],
    ["Assistant → Form Start Sessions", ai.formStartSessions, "Observed session overlap"],
    ["Assistant → Lead Sessions", ai.leadSessions, "Observed session overlap with actual leads"],
    ["Assistant-Associated Conversion Rate", ai.conversionRate, "Lead sessions / assistant sessions"],
    [""],
    ["TOP AI ASSISTANT INTERESTS", "INTERACTIONS"],
  ].concat(ai.topics);
  rows.push([""]); rows.push(["AI ASSISTANT INTERACTION TREND", "INTERACTIONS"]);
  rows = rows.concat(ai.trend);
  rows.push([""]); rows.push(["ASSISTANT-TO-LEAD FUNNEL", "SESSIONS"]);
  rows.push(["Assistant Sessions", ai.sessions]);
  rows.push(["Assistant → CTA", ai.ctaSessions]);
  rows.push(["Assistant → Form Start", ai.formStartSessions]);
  rows.push(["Assistant → Lead", ai.leadSessions]);
  writeRows(sheet, rows, 3);
  styleAdvancedSheet(sheet, 3, [4, 14, 15 + ai.topics.length, 16 + ai.topics.length + ai.trend.length]);
  if (ai.topics.length) {
    insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A14:B" + (14 + ai.topics.length))], 1, 5,
      "Top AI Assistant Interests", { colors: ["#06B6D4"], legend: "none", width: 560, height: 340 });
  }
  if (ai.trend.length) {
    var trendStart = 16 + ai.topics.length;
    insertReportChartSafely(sheet, Charts.ChartType.LINE, [sheet.getRange("A" + trendStart + ":B" + (trendStart + ai.trend.length))], 1, 12,
      "AI Assistant Interaction Trend", { colors: ["#10B981"], legend: "none", width: 560, height: 300, pointSize: 4 });
  }
  insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A" + (18 + ai.topics.length + ai.trend.length) + ":B" + (22 + ai.topics.length + ai.trend.length))], 18, 5,
    "Assistant-to-Lead Funnel", { colors: ["#0F172A"], legend: "none", width: 560, height: 300 });
}

function renderAdvancedLeadAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Lead_Analysis", 4);
  var types = {};
  model.leadRecords.forEach(function(lead) { advancedIncrement(types, lead.type || "Unspecified"); });
  var sessionsWithLead = model.leadRecords.filter(function(lead) { return advancedUsableSession(lead.sessionId); }).length;
  var leadJourney = advancedLeadJourneySummary(model);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - LEAD ENGAGEMENT"],
    ["This profile is transparent and descriptive; it is not an AI-generated or arbitrary lead score."],
    [""],
    ["LEAD KPI", "VALUE", "BASIS", "NOTES"],
    ["Total Leads", model.leadRecords.length, "Actual submission records", "Behavioral lead_conversion events excluded"],
    ["Leads With Documents", model.leadRecords.filter(function(lead) { return lead.documentAttached; }).length, "Lead_Submissions metadata", ""],
    ["Leads Without Documents", model.leadRecords.filter(function(lead) { return !lead.documentAttached; }).length, "Actual submission records", ""],
    ["Document Attachment Rate", model.leadRecords.length ? advancedPercent(model.leadRecords.filter(function(lead) { return lead.documentAttached; }).length, model.leadRecords.length) : "N/A", "Documents / leads", ""],
    ["Leads With Session ID", sessionsWithLead, "Usable Session ID linkage", "Journey metrics are unavailable without linkage"],
    ["Leads With Prior Observed Activity", leadJourney.priorActivity, "Timestamp-ordered same-session records", "Association only"],
    ["Leads With Prior CTA", leadJourney.priorCta, "CTA event before lead timestamp", "Association only"],
    ["Leads With Prior Form Start", leadJourney.priorFormStart, "form_start before lead timestamp", "Association only"],
    [""],
    ["LEAD TYPE BREAKDOWN", "COUNT", "PERCENT", ""],
  ];
  REPORT_LEAD_TYPES.forEach(function(type) { rows.push([type, types[type] || 0, model.leadRecords.length ? advancedPercent(types[type] || 0, model.leadRecords.length) : "N/A", "Observed records"]); });
  rows.push([""]); rows.push(["TRANSPARENT LEAD ENGAGEMENT PROFILE", "COUNT", "RULE", ""]);
  rows.push(["Has usable Session ID", sessionsWithLead, "Session ID is present and not session_fallback", ""]);
  rows.push(["Document attached", model.leadRecords.filter(function(lead) { return lead.documentAttached; }).length, "Lead_Submissions document flag is Yes", ""]);
  rows.push(["CTA/form association", Object.keys(model.leadSessionIds).filter(function(id) { return model.sessions[id] && model.sessions[id].events.some(function(event) { return event.source === "CTA Interactions"; }); }).length, "A CTA event exists in the same session", "Association only"]);
  rows.push([""]); rows.push(["REGIONAL LEAD DISTRIBUTION", "LEADS"]);
  ["Madurai", "Coimbatore", "Trichy", "Mangalore"].forEach(function(region) {
    rows.push([region, model.leadRecords.filter(function(lead) { return lead.region.toLowerCase().indexOf(region.toLowerCase()) !== -1; }) .length]);
  });
  writeRows(sheet, rows, 4);
  styleAdvancedSheet(sheet, 4, [4, 14, 21, 26]);
}

function advancedLeadJourneySummary(model) {
  var priorActivity = 0;
  var priorCta = 0;
  var priorFormStart = 0;
  model.leadRecords.forEach(function(lead) {
    if (!advancedUsableSession(lead.sessionId) || !lead.timestamp || !model.sessions[lead.sessionId]) return;
    var events = model.sessions[lead.sessionId].events.filter(function(event) {
      return event.timestamp && event.timestamp <= lead.timestamp;
    });
    if (events.length) priorActivity++;
    if (events.some(function(event) { return event.source === "CTA Interactions"; })) priorCta++;
    if (events.some(function(event) { return event.source === "CTA Interactions" && event.event === "form_start"; })) priorFormStart++;
  });
  return { priorActivity: priorActivity, priorCta: priorCta, priorFormStart: priorFormStart };
}

function renderAdvancedAssociationAnalysis(anaSs, model) {
  var sheet = advancedSheet(anaSs, "Advanced_Association_Analysis", 3);
  var rows = [
    ["GREENNEXT ADVANCED WEBSITE INTELLIGENCE - BEHAVIORAL ASSOCIATIONS"],
    ["Infrastructure, Energy, and Automation relationships are observed interactions, not causal claims."],
    [""],
    ["OBSERVED ASSOCIATION", "PAIRED SESSIONS", "INTERPRETATION"]
  ].concat(model.associations.pairs);
  rows.push([""]); rows.push(["INTEREST INTERACTIONS", "INTERACTIONS", ""]);
  rows = rows.concat(model.associations.rows.slice(1));
  writeRows(sheet, rows, 3);
  styleAdvancedSheet(sheet, 3, [4, 9]);
  insertReportChartSafely(sheet, Charts.ChartType.BAR, [sheet.getRange("A4:B7")], 1, 5,
    "Observed Category Associations", { colors: ["#64748B"], legend: "none", width: 560, height: 300 });
}

/** Creates only missing reporting triggers; existing triggers are preserved. */
function setupReportingTriggers() {
  var existing = ScriptApp.getProjectTriggers();
  var triggerFunctions = {};
  existing.forEach(function(trigger) {
    triggerFunctions[trigger.getHandlerFunction()] = true;
  });

  if (!triggerFunctions["runDailyReportAndEmail"]) {
    ScriptApp.newTrigger("runDailyReportAndEmail")
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();
  }
  if (!triggerFunctions["runWeeklyReportAndEmail"]) {
    ScriptApp.newTrigger("runWeeklyReportAndEmail")
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(9)
      .create();
  }
  if (!triggerFunctions["runMonthlyReportAndEmail"]) {
    ScriptApp.newTrigger("runMonthlyReportAndEmail")
      .timeBased()
      .onMonthDay(2)
      .atHour(10)
      .create();
  }
}

function runDailyReport() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var timezone = getReportingTimezone(rawSs);
  var source = loadReportingSource(rawSs);
  var today = formatReportDate(new Date(), timezone);
  buildDailyReport(source, timezone, { start: today, end: addReportDays(today, 1) });
}

function runWeeklyReport() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var timezone = getReportingTimezone(rawSs);
  var source = loadReportingSource(rawSs);
  var today = formatReportDate(new Date(), timezone);
  var weekStart = startOfReportWeek(today);
  buildWeeklyReport(source, timezone, {
    start: weekStart,
    end: addReportDays(weekStart, 7),
    previousStart: addReportDays(weekStart, -7),
    previousEnd: weekStart
  });
}

function runMonthlyReport() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var timezone = getReportingTimezone(rawSs);
  var source = loadReportingSource(rawSs);
  var today = formatReportDate(new Date(), timezone);
  var monthStart = today.substring(0, 8) + "01";
  buildMonthlyReport(source, timezone, {
    start: monthStart,
    end: addReportMonths(monthStart, 1),
    previousStart: addReportMonths(monthStart, -1),
    previousEnd: monthStart
  });
}

function runDailyReportAndEmail() {
  sendDailyReportEmail();
}

function runWeeklyReportAndEmail() {
  sendWeeklyReportEmail();
}

function runMonthlyReportAndEmail() {
  sendMonthlyReportEmail();
}

function sendDailyReportEmail() {
  sendReportEmail(
    "Daily_Report",
    "Daily Report",
    "GreenNext - Daily Report",
    runDailyReport
  );
}

function sendWeeklyReportEmail() {
  sendReportEmail(
    "Weekly_Report",
    "Weekly Report",
    "GreenNext - Weekly Report",
    runWeeklyReport
  );
}

function sendMonthlyReportEmail() {
  sendReportEmail(
    "Monthly_Report",
    "Monthly Report",
    "GreenNext - Monthly Report",
    runMonthlyReport
  );
}

function sendReportEmail(sheetName, reportTitle, subject, reportRunner) {
  try {
    reportRunner();

    var analyticsSs = SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID);
    var sheet = analyticsSs.getSheetByName(sheetName);
    if (!sheet) throw new Error(sheetName + " sheet not found.");

    var values = sheet.getDataRange().getDisplayValues();
    var htmlBody = buildReportEmailHtml(reportTitle, values);
    var plainBody = reportValuesToPlainText(reportTitle, values);

    MailApp.sendEmail({
      to: "jananisri.int2027g3@gmail.com",
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Report email failed (" + sheetName + "): " + safeErrorMessage(err));
  }
}

function buildReportEmailHtml(reportTitle, values) {
  var summary = buildReportEmailSummary(reportTitle, values);
  var html = "<!doctype html><html><body style=\"margin:0;padding:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#1f2933;\">";
  html += "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;\"><tr><td style=\"padding:24px 12px;\">";
  html += "<table role=\"presentation\" style=\"width:100%;max-width:760px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d9e4dc;\">";
  html += "<tr><td style=\"padding:22px 24px;background:#123524;color:#ffffff;\"><div style=\"font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#b9d9c3;\">GreenNext Analytics</div>";
  html += "<h1 style=\"margin:6px 0 0;font-size:24px;line-height:1.25;\">GreenNext - " + escapeReportHtml(reportTitle) + "</h1></td></tr>";
  html += "<tr><td style=\"padding:20px 24px 8px;\"><div style=\"font-size:13px;color:#607267;\">Report period</div><div style=\"font-size:18px;font-weight:bold;color:#123524;margin-top:4px;\">" + escapeReportHtml(summary.period) + "</div></td></tr>";
  html += renderReportHtmlSection("Key performance indicators", renderReportMetricTable(summary.kpis));
  html += renderReportHtmlSection("Behavior and engagement", renderReportMetricTable(summary.behavior));
  html += renderReportHtmlSection("Lead breakdown", renderReportDataTable(["Lead type", "Count"], summary.leads));
  html += renderReportHtmlSection("Regional activity", renderReportDataTable(["Region", "Activity", "Inquiries"], summary.regions));
  html += renderReportHtmlSection("Top recorded interests", renderReportDataTable(["Area", "Interest"], summary.interests));
  html += renderReportHtmlSection("Period comparison", renderReportDataTable(["Metric", "Current", "Previous", "Change", "% Change"], summary.comparison));
  html += renderReportHtmlSection("Behavioral funnel", renderReportDataTable(["Stage", "Count"], summary.funnel));
  html += "<tr><td style=\"padding:22px 24px 10px;text-align:center;\"><a href=\"" + ANALYTICS_SPREADSHEET_URL + "\" style=\"display:inline-block;background:#1f7a4d;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:bold;\">Open GreenNext Analytics</a></td></tr>";
  html += "<tr><td style=\"padding:12px 24px 24px;text-align:center;font-size:12px;color:#718078;\">Detailed report tables and charts remain available in the analytics workbook.</td></tr>";
  html += "</table></td></tr></table></body></html>";
  return html;
}

function buildReportEmailSummary(reportTitle, values) {
  var periodLabel = reportTitle === "Daily Report" ? "Report Date:" :
    reportTitle === "Weekly Report" ? "Report Week:" : "Report Month:";
  var summary = {
    period: reportValue(values, periodLabel) || "Current reporting period",
    kpis: [],
    behavior: [],
    leads: [],
    regions: [],
    interests: [],
    comparison: [],
    funnel: []
  };

  var pageViews = reportValue(values, "Total Page Views");
  var uniqueSessions = reportValue(values, "Unique Sessions");
  var leadConversions = reportValue(values, "Lead Conversions");
  var quickLeads = reportValue(values, "Quick Inquiry Leads");
  var longLeads = reportValue(values, "Long-Form Leads");
  var otherLeads = reportValue(values, "Other Lead Submissions");
  var ctaInteractions = reportValue(values, "Total CTA Interactions") || reportValue(values, "CTA Interactions");
  var formsOpened = reportValue(values, "Forms Opened");
  var formsStarted = reportValue(values, "Forms Started");
  var formsAbandoned = reportValue(values, "Forms Abandoned");

  addReportMetric(summary.kpis, "Website Page Views", pageViews);
  addReportMetric(summary.kpis, "Unique Sessions", uniqueSessions);
  addReportMetric(summary.kpis, "Total Inquiries / Leads", leadConversions);
  addReportMetric(summary.kpis, "Quick Inquiry Leads", quickLeads);
  addReportMetric(summary.kpis, "Long-Form Technical Inquiries", longLeads);
  addReportMetric(summary.kpis, "Other Lead Submissions", otherLeads);
  addReportMetric(summary.kpis, "CTA Interactions", ctaInteractions);
  addReportMetric(summary.kpis, "Forms Opened", formsOpened);
  addReportMetric(summary.kpis, "Forms Started", formsStarted);
  addReportMetric(summary.kpis, "Forms Abandoned", formsAbandoned);

  addReportMetric(summary.behavior, "New Sessions", reportValue(values, "New Sessions"));
  addReportMetric(summary.behavior, "Returning Sessions", reportValue(values, "Returning Sessions"));
  addReportMetric(summary.behavior, "Scroll 25%", reportValue(values, "Scroll 25%"));
  addReportMetric(summary.behavior, "Scroll 50%", reportValue(values, "Scroll 50%"));
  addReportMetric(summary.behavior, "Scroll 75%", reportValue(values, "Scroll 75%"));
  addReportMetric(summary.behavior, "Scroll 90%", reportValue(values, "Scroll 90%"));
  addReportMetric(summary.behavior, "Scroll 100%", reportValue(values, "Scroll 100%"));
  addReportMetric(summary.behavior, "30 Second Engagement", reportValue(values, "30 Second Engagement"));
  addReportMetric(summary.behavior, "60 Second Engagement", reportValue(values, "60 Second Engagement"));
  addReportMetric(summary.behavior, "120 Second Engagement", reportValue(values, "120 Second Engagement"));

  summary.leads = reportSectionRows(values, [
    "DAILY LEAD BREAKDOWN", "WEEKLY LEAD BREAKDOWN", "MONTHLY LEAD BREAKDOWN"
  ], 2);
  summary.regions = reportSectionRows(values, [
    "DAILY REGIONAL INTEREST", "WEEKLY REGIONAL ANALYTICS", "MONTHLY REGIONAL ANALYTICS"
  ], 3);
  summary.interests = reportSectionRows(values, ["DAILY TOP INTERESTS"], 2);
  if (!summary.interests.length) {
    summary.interests = reportNamedRows(values, [
      "Infrastructure", "Energy", "Automation", "Solutions", "Industries", "Locations", "AI Assistant"
    ], 2);
  }
  summary.interests = summary.interests.filter(function(row) {
    return String(row[1] || "").trim().toLowerCase() !== "no data available";
  });
  summary.comparison = reportSectionRows(values, [
    "WEEK-OVER-WEEK COMPARISON", "MONTH-OVER-MONTH COMPARISON"
  ], 5);
  summary.funnel = reportSectionRows(values, ["RECORDED BEHAVIORAL FUNNEL"], 2);

  return summary;
}

function reportValue(values, label) {
  for (var i = 0; i < (values || []).length; i++) {
    if (String(values[i][0] || "").trim() === label) return values[i][1] == null ? "" : values[i][1];
  }
  return "";
}

function addReportMetric(metrics, label, value) {
  if (String(value == null ? "" : value).trim() !== "") metrics.push([label, value]);
}

function reportSectionRows(values, headings, width) {
  var start = -1;
  for (var i = 0; i < (values || []).length; i++) {
    if (headings.indexOf(String(values[i][0] || "").trim()) !== -1) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return [];

  var result = [];
  for (var j = start; j < values.length; j++) {
    var row = values[j] || [];
    var first = String(row[0] || "").trim();
    if (!first) break;
    if (first === first.toUpperCase() && j > start) break;
    if (first === "Report Date:" || first === "Report Week:" || first === "Report Month:") break;
    result.push(row.slice(0, width));
  }
  return result;
}

function reportNamedRows(values, names, width) {
  return names.map(function(name) {
    var row = (values || []).filter(function(candidate) {
      return String(candidate[0] || "").trim() === name;
    })[0];
    return row ? row.slice(0, width) : null;
  }).filter(function(row) { return row !== null; });
}

function renderReportHtmlSection(title, content) {
  if (!content) return "";
  return "<tr><td style=\"padding:14px 24px 4px;\"><h2 style=\"margin:0;color:#123524;font-size:16px;border-bottom:2px solid #d9e4dc;padding-bottom:6px;\">" +
    escapeReportHtml(title) + "</h2></td></tr><tr><td style=\"padding:4px 24px 10px;\">" + content + "</td></tr>";
}

function renderReportMetricTable(rows) {
  if (!rows || !rows.length) return "";
  var cells = rows.map(function(row) {
    return "<td style=\"width:50%;padding:10px;border:1px solid #d9e4dc;background:#f8fbf9;\"><div style=\"font-size:12px;color:#607267;\">" +
      escapeReportHtml(row[0]) + "</div><div style=\"font-size:18px;font-weight:bold;color:#123524;margin-top:3px;\">" +
      escapeReportHtml(row[1]) + "</div></td>";
  });
  var html = "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;\"><tr>";
  for (var i = 0; i < cells.length; i++) {
    html += cells[i];
    if (i % 2 === 1 && i < cells.length - 1) html += "</tr><tr>";
  }
  return html + "</tr></table>";
}

function renderReportDataTable(headers, rows) {
  if (!rows || !rows.length) return "";
  var html = "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;font-size:13px;\"><tr>";
  html += headers.map(function(header) {
    return "<th style=\"padding:8px;border:1px solid #d9e4dc;background:#e8f2ec;color:#123524;text-align:left;\">" +
      escapeReportHtml(header) + "</th>";
  }).join("") + "</tr>";
  html += rows.map(function(row) {
    return "<tr>" + headers.map(function(_, index) {
      return "<td style=\"padding:8px;border:1px solid #d9e4dc;vertical-align:top;\">" +
        escapeReportHtml(row[index] == null ? "" : row[index]) + "</td>";
    }).join("") + "</tr>";
  }).join("");
  return html + "</table>";
}

function reportValuesToPlainText(reportTitle, values) {
  var summary = buildReportEmailSummary(reportTitle, values);
  var lines = [
    "GreenNext - " + reportTitle,
    "Report period: " + summary.period,
    "",
    "KEY PERFORMANCE INDICATORS"
  ];
  appendPlainRows(lines, summary.kpis);
  lines.push("", "BEHAVIOR AND ENGAGEMENT");
  appendPlainRows(lines, summary.behavior);
  appendPlainRows(lines, summary.leads, "LEAD BREAKDOWN");
  appendPlainRows(lines, summary.regions, "REGIONAL ACTIVITY");
  appendPlainRows(lines, summary.interests, "TOP RECORDED INTERESTS");
  appendPlainRows(lines, summary.comparison, "PERIOD COMPARISON");
  appendPlainRows(lines, summary.funnel, "BEHAVIORAL FUNNEL");
  lines.push("", "Open GreenNext Analytics: " + ANALYTICS_SPREADSHEET_URL);
  return lines.join("\n");
}

function appendPlainRows(lines, rows, heading) {
  if (!rows || !rows.length) return;
  if (heading) lines.push("", heading);
  rows.forEach(function(row) { lines.push(row.join(" | ")); });
}

function escapeReportHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function testDailyReportEmail() {
  sendDailyReportEmail();
}

function testWeeklyReportEmail() {
  sendWeeklyReportEmail();
}

function testMonthlyReportEmail() {
  sendMonthlyReportEmail();
}

function getReportingTimezone(rawSs) {
  try {
    return rawSs.getSpreadsheetTimeZone() || REPORT_TIMEZONE_FALLBACK;
  } catch (err) {
    return REPORT_TIMEZONE_FALLBACK;
  }
}

/** Reads each source sheet once for the complete reporting refresh. */
function loadReportingSource(rawSs) {
  return {
    Navigation: getSheetRows(rawSs, "Navigation"),
    Regions: getSheetRows(rawSs, "Regions"),
    Infrastructure: getSheetRows(rawSs, "Infrastructure"),
    Energy: getSheetRows(rawSs, "Energy"),
    Automation: getSheetRows(rawSs, "Automation"),
    Solutions: getSheetRows(rawSs, "Solutions"),
    Industries: getSheetRows(rawSs, "Industries"),
    Locations: getSheetRows(rawSs, "Locations"),
    "AI Assistant": getSheetRows(rawSs, "AI Assistant"),
    "CTA Interactions": getSheetRows(rawSs, "CTA Interactions"),
    Quick_Inquiries: getSheetRows(rawSs, "Quick_Inquiries"),
    Contact_Submissions: getSheetRows(rawSs, "Contact_Submissions"),
    Lead_Submissions: getSheetRows(rawSs, "Lead_Submissions")
  };
}

function buildDailyReport(source, timezone, period) {
  var metrics = calculateReportMetrics(source, timezone, period);
  var sheet = getOrCreateSheet(
    SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID),
    "Daily_Report"
  );
  sheet.clearContents();
  clearCharts(sheet);

  var rows = [
    ["GREENNEXT — DAILY REPORT"],
    ["Report Date:", period.start],
    ["Last Refreshed:", reportRefreshTimestamp(timezone)],
    [""],
    ["DAILY CORE METRICS", "VALUE"],
    ["Total Page Views", metrics.pageViews],
    ["Unique Sessions", metrics.uniqueSessions],
    ["New Sessions", metrics.newSessions],
    ["Returning Sessions", metrics.returningSessions],
    ["Total Behavioral Events", metrics.totalBehavioralEvents],
    ["Total CTA Interactions", metrics.ctaInteractions],
    ["Forms Opened", metrics.formsOpened],
    ["Forms Started", metrics.formsStarted],
    ["Forms Abandoned", metrics.formsAbandoned],
    ["Lead Conversions", metrics.leadConversions],
    ["Quick Inquiry Leads", metrics.quickLeads],
    ["Long-Form Leads", metrics.longLeads],
    ["Other Lead Submissions", metrics.otherLeads],
    ["Documents Attached", metrics.documentsAttached],
    [""],
    ["DAILY ENGAGEMENT", "COUNT"],
    ["Scroll 25%", metrics.scroll["scroll_25"]],
    ["Scroll 50%", metrics.scroll["scroll_50"]],
    ["Scroll 75%", metrics.scroll["scroll_75"]],
    ["Scroll 90%", metrics.scroll["scroll_90"]],
    ["Scroll 100%", metrics.scroll["scroll_100"]],
    ["30 Second Engagement", metrics.engagement["engagement_30s"]],
    ["60 Second Engagement", metrics.engagement["engagement_60s"]],
    ["120 Second Engagement", metrics.engagement["engagement_120s"]],
    [""],
    ["DAILY LEAD BREAKDOWN", "COUNT"],
  ];
  appendLeadBreakdown(rows, metrics.leadTypes);
  rows.push([""]);
  rows.push(["DAILY REGIONAL INTEREST", "BEHAVIORAL ACTIVITY", "INQUIRIES"]);
  appendRegionalRows(rows, metrics.regions);
  rows.push([""]);
  rows.push(["DAILY TOP INTERESTS", "TOP RECORDED VALUES"]);
  appendInterestRows(rows, metrics.topInterests);

  writeRows(sheet, rows, 3);
  styleReportSheet(sheet, 3);
  addDailyCharts(sheet, metrics);
}

function buildWeeklyReport(source, timezone, period) {
  var metrics = calculateReportMetrics(source, timezone, period);
  var previous = calculateReportMetrics(source, timezone, {
    start: period.previousStart,
    end: period.previousEnd
  });
  var sheet = getOrCreateSheet(
    SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID),
    "Weekly_Report"
  );
  sheet.clearContents();
  clearCharts(sheet);

  var rows = [
    ["GREENNEXT — WEEKLY REPORT"],
    ["Report Week:", period.start + " to " + addReportDays(period.start, 6)],
    ["Week Start:", period.start],
    ["Week End:", addReportDays(period.start, 6)],
    ["Last Refreshed:", reportRefreshTimestamp(timezone)],
    [""],
    ["WEEKLY CORE METRICS", "VALUE"],
    ["Total Page Views", metrics.pageViews],
    ["Unique Sessions", metrics.uniqueSessions],
    ["New Sessions", metrics.newSessions],
    ["Returning Sessions", metrics.returningSessions],
    ["Total Behavioral Events", metrics.totalBehavioralEvents],
    ["CTA Interactions", metrics.ctaInteractions],
    ["Forms Opened", metrics.formsOpened],
    ["Forms Started", metrics.formsStarted],
    ["Forms Abandoned", metrics.formsAbandoned],
    ["Lead Conversions", metrics.leadConversions],
    ["Documents Attached", metrics.documentsAttached],
    [""],
    ["WEEK-OVER-WEEK COMPARISON", "CURRENT WEEK", "PREVIOUS WEEK", "ABSOLUTE CHANGE", "PERCENTAGE CHANGE"],
  ];
  appendComparisonRows(rows, metrics, previous, [
    ["Page Views", "pageViews"],
    ["Unique Sessions", "uniqueSessions"],
    ["CTA Interactions", "ctaInteractions"],
    ["Forms Started", "formsStarted"],
    ["Forms Abandoned", "formsAbandoned"],
    ["Lead Conversions", "leadConversions"]
  ]);
  rows.push([""]);
  rows.push(["WEEKLY LEAD BREAKDOWN", "COUNT"]);
  appendLeadBreakdown(rows, metrics.leadTypes);
  rows.push([""]);
  rows.push(["WEEKLY REGIONAL ANALYTICS", "BEHAVIORAL ACTIVITY", "INQUIRIES"]);
  appendRegionalRows(rows, metrics.regions);
  rows.push([""]);
  rows.push(["RECORDED BEHAVIORAL FUNNEL", "COUNT"]);
  appendFunnelRows(rows, metrics);

  writeRows(sheet, rows, 5);
  styleReportSheet(sheet, 5);
  addWeeklyCharts(sheet, metrics, previous);
}

function buildMonthlyReport(source, timezone, period) {
  var metrics = calculateReportMetrics(source, timezone, period);
  var previous = calculateReportMetrics(source, timezone, {
    start: period.previousStart,
    end: period.previousEnd
  });
  var sheet = getOrCreateSheet(
    SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID),
    "Monthly_Report"
  );
  sheet.clearContents();
  clearCharts(sheet);

  var rows = [
    ["GREENNEXT — MONTHLY REPORT"],
    ["Report Month:", period.start.substring(0, 7)],
    ["Month Start:", period.start],
    ["Month End:", addReportDays(period.end, -1)],
    ["Last Refreshed:", reportRefreshTimestamp(timezone)],
    [""],
    ["MONTHLY CORE METRICS", "VALUE"],
    ["Total Page Views", metrics.pageViews],
    ["Unique Sessions", metrics.uniqueSessions],
    ["New Sessions", metrics.newSessions],
    ["Returning Sessions", metrics.returningSessions],
    ["Total Behavioral Events", metrics.totalBehavioralEvents],
    ["CTA Interactions", metrics.ctaInteractions],
    ["Forms Opened", metrics.formsOpened],
    ["Forms Started", metrics.formsStarted],
    ["Forms Abandoned", metrics.formsAbandoned],
    ["Lead Conversions", metrics.leadConversions],
    ["Documents Attached", metrics.documentsAttached],
    [""],
    ["MONTH-OVER-MONTH COMPARISON", "CURRENT MONTH", "PREVIOUS MONTH", "ABSOLUTE CHANGE", "PERCENTAGE CHANGE"],
  ];
  appendComparisonRows(rows, metrics, previous, [
    ["Page Views", "pageViews"],
    ["Unique Sessions", "uniqueSessions"],
    ["CTA Interactions", "ctaInteractions"],
    ["Forms Started", "formsStarted"],
    ["Forms Abandoned", "formsAbandoned"],
    ["Lead Conversions", "leadConversions"]
  ]);
  rows.push([""]);
  rows.push(["MONTHLY LEAD BREAKDOWN", "COUNT"]);
  appendLeadBreakdown(rows, metrics.leadTypes);
  rows.push([""]);
  rows.push(["MONTHLY REGIONAL ANALYTICS", "BEHAVIORAL ACTIVITY", "INQUIRIES"]);
  appendRegionalRows(rows, metrics.regions);
  rows.push([""]);
  rows.push(["MONTHLY BEHAVIORAL ANALYTICS", "COUNT"]);
  rows.push(["Page Views", metrics.pageViews]);
  rows.push(["Scroll 25%", metrics.scroll["scroll_25"]]);
  rows.push(["Scroll 50%", metrics.scroll["scroll_50"]]);
  rows.push(["Scroll 75%", metrics.scroll["scroll_75"]]);
  rows.push(["Scroll 90%", metrics.scroll["scroll_90"]]);
  rows.push(["Scroll 100%", metrics.scroll["scroll_100"]]);
  rows.push(["30 Second Engagement", metrics.engagement["engagement_30s"]]);
  rows.push(["60 Second Engagement", metrics.engagement["engagement_60s"]]);
  rows.push(["120 Second Engagement", metrics.engagement["engagement_120s"]]);
  rows.push(["CTA Activity", metrics.ctaInteractions]);
  rows.push(["Forms Opened", metrics.formsOpened]);
  rows.push(["Forms Started", metrics.formsStarted]);
  rows.push(["Documents Selected", metrics.documentsSelected]);
  rows.push(["Forms Abandoned", metrics.formsAbandoned]);
  rows.push(["Lead Conversions", metrics.leadConversions]);
  appendInterestRows(rows, metrics.topInterests);
  rows.push([""]);
  rows.push(["RECORDED BEHAVIORAL FUNNEL", "COUNT"]);
  appendFunnelRows(rows, metrics);

  writeRows(sheet, rows, 5);
  styleReportSheet(sheet, 5);
  addMonthlyCharts(sheet, metrics, previous);
}

function calculateReportMetrics(source, timezone, period) {
  var behavioralNames = [
    "Navigation", "Regions", "Infrastructure", "Energy", "Automation",
    "Solutions", "Industries", "Locations", "AI Assistant", "CTA Interactions"
  ];
  var filtered = {};
  behavioralNames.forEach(function(name) {
    filtered[name] = filterReportRows(source[name], period, timezone);
  });
  var quick = filterReportRows(source.Quick_Inquiries, period, timezone);
  var longForm = filterReportRows(source.Contact_Submissions, period, timezone);
  var dedicatedLeads = filterReportRows(source.Lead_Submissions, period, timezone);
  var cta = filtered["CTA Interactions"];
  var pageViewEvents = countEvent(cta, "page_view");
  var navigationPageViews = countEvent(filtered.Navigation, "nav_page_view");
  var leadRecords = [];

  dedicatedLeads.forEach(function(row) {
    leadRecords.push({
      type: row[1] || "",
      region: row[6] || "",
      documentAttached: String(row[12] || "").toLowerCase() === "yes",
      sessionId: row[10] || "",
      sessionKind: row[11] || ""
    });
  });
  quick.forEach(function(row) {
    leadRecords.push({ type: "General Contact Inquiry", region: "", documentAttached: false, sessionId: row[8] || "", sessionKind: "" });
  });
  longForm.forEach(function(row) {
    leadRecords.push({ type: "Technical Infrastructure Inquiry", region: row[7] || "", documentAttached: false, sessionId: row[10] || "", sessionKind: "" });
  });

  var allPeriodRows = [];
  behavioralNames.forEach(function(name) { allPeriodRows = allPeriodRows.concat(filtered[name]); });
  allPeriodRows = allPeriodRows.concat(quick, longForm, dedicatedLeads);
  var sessions = {};
  allPeriodRows.forEach(function(row) {
    var sid = row.length === 16 ? row[10] : row[row.length - 1];
    if (sid && sid !== "session_fallback") sessions[String(sid)] = true;
  });

  var sessionKinds = { new_session: {}, returning_session: {} };
  dedicatedLeads.forEach(function(row) {
    if (row[11] === "new_session") sessionKinds.new_session[row[10]] = true;
    if (row[11] === "returning_session") sessionKinds.returning_session[row[10]] = true;
  });

  var leadTypes = {};
  REPORT_LEAD_TYPES.forEach(function(type) { leadTypes[type] = 0; });
  leadRecords.forEach(function(lead) {
    if (Object.prototype.hasOwnProperty.call(leadTypes, lead.type)) leadTypes[lead.type]++;
  });

  var scroll = {};
  ["scroll_25", "scroll_50", "scroll_75", "scroll_90", "scroll_100"].forEach(function(event) {
    scroll[event] = countEvent(cta, event);
  });
  var engagement = {};
  ["engagement_30s", "engagement_60s", "engagement_120s"].forEach(function(event) {
    engagement[event] = countEvent(cta, event);
  });

  return {
    pageViews: pageViewEvents > 0 ? pageViewEvents : navigationPageViews,
    uniqueSessions: Object.keys(sessions).length,
    newSessions: Object.keys(sessionKinds.new_session).length,
    returningSessions: Object.keys(sessionKinds.returning_session).length,
    totalBehavioralEvents: allBehavioralCount(filtered),
    ctaInteractions: cta.length,
    formsOpened: countEvent(cta, "form_open"),
    formsStarted: countEvent(cta, "form_start"),
    formsAbandoned: countEvent(cta, "form_abandon"),
    leadConversions: leadRecords.length,
    quickLeads: quick.length,
    longLeads: longForm.length,
    otherLeads: leadRecords.filter(function(lead) { return REPORT_LEAD_TYPES.indexOf(lead.type) === -1; }).length,
    documentsAttached: leadRecords.filter(function(lead) { return lead.documentAttached; }).length,
    documentsSelected: countEvent(cta, "document_selected"),
    scroll: scroll,
    engagement: engagement,
    leadTypes: leadTypes,
    regions: calculateRegionalActivity(filtered, leadRecords),
    topInterests: calculateTopInterests(filtered)
  };
}

function calculateRegionalActivity(filtered, leadRecords) {
  var regions = {
    "Madurai / MDU": { activity: 0, inquiries: 0, terms: ["madurai", "mdu"] },
    "Coimbatore / CJB": { activity: 0, inquiries: 0, terms: ["coimbatore", "cjb"] },
    "Trichy / TRZ": { activity: 0, inquiries: 0, terms: ["trichy", "trz", "tiruchirappalli"] },
    "Mangalore / IXE": { activity: 0, inquiries: 0, terms: ["mangalore", "ixe", "mangaluru"] }
  };
  ["Regions", "Locations"].forEach(function(sheetName) {
    (filtered[sheetName] || []).forEach(function(row) {
      incrementMatchingRegions(regions, row[2] || "", "activity");
    });
  });
  leadRecords.forEach(function(lead) {
    incrementMatchingRegions(regions, lead.region || "", "inquiries");
  });
  return regions;
}

function incrementMatchingRegions(regions, value, field) {
  var text = String(value).toLowerCase();
  Object.keys(regions).forEach(function(name) {
    if (regions[name].terms.some(function(term) { return text.indexOf(term) !== -1; })) regions[name][field]++;
  });
}

function calculateTopInterests(filtered) {
  var mappings = [
    ["Regions", "Regions", 2],
    ["Infrastructure", "Infrastructure", 2],
    ["Energy", "Energy", 2],
    ["Automation", "Automation", 2],
    ["Solutions", "Solutions", 2],
    ["Industries", "Industries", 2],
    ["Locations", "Locations", 2],
    ["AI Assistant", "AI Assistant", 2]
  ];
  var result = {};
  mappings.forEach(function(mapping) {
    var counts = countValues(filtered[mapping[0]] || [], mapping[2]);
    var list = Object.keys(counts).map(function(value) { return [value, counts[value]]; });
    list.sort(function(a, b) { return b[1] - a[1]; });
    result[mapping[1]] = list.length ? list[0][0] + " (" + list[0][1] + ")" : "No data available";
  });
  return result;
}

function filterReportRows(rows, period, timezone) {
  return (Array.isArray(rows) ? rows : []).filter(function(row) {
    var date = row && row[0];
    var key = reportDateKey(date, timezone);
    return key && key >= period.start && key < period.end;
  });
}

function reportDateKey(value, timezone) {
  var date = value instanceof Date ? value : new Date(value);
  if (!date || isNaN(date.getTime())) return "";
  return formatReportDate(date, timezone);
}

function formatReportDate(date, timezone) {
  return Utilities.formatDate(date, timezone, "yyyy-MM-dd");
}

function reportRefreshTimestamp(timezone) {
  return Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd HH:mm:ss");
}

function addReportDays(dateKey, days) {
  var date = reportKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToReportKey(date);
}

function addReportMonths(dateKey, months) {
  var date = reportKeyToUtcDate(dateKey);
  date.setUTCMonth(date.getUTCMonth() + months);
  return utcDateToReportKey(date);
}

function startOfReportWeek(dateKey) {
  var date = reportKeyToUtcDate(dateKey);
  var day = date.getUTCDay();
  var daysFromMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysFromMonday);
  return utcDateToReportKey(date);
}

function reportKeyToUtcDate(key) {
  var parts = String(key).split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function utcDateToReportKey(date) {
  return Utilities.formatDate(date, "UTC", "yyyy-MM-dd");
}

function countEvent(rows, eventName) {
  return (rows || []).filter(function(row) { return row[1] === eventName; }).length;
}

function allBehavioralCount(filtered) {
  return ["Navigation", "Regions", "Infrastructure", "Energy", "Automation", "Solutions", "Industries", "Locations", "AI Assistant", "CTA Interactions"]
    .reduce(function(total, name) { return total + (filtered[name] || []).length; }, 0);
}

function appendLeadBreakdown(rows, leadTypes) {
  REPORT_LEAD_TYPES.forEach(function(type) { rows.push([type, leadTypes[type] || 0]); });
}

function appendRegionalRows(rows, regions) {
  Object.keys(regions).forEach(function(name) {
    rows.push([name, regions[name].activity, regions[name].inquiries]);
  });
}

function appendInterestRows(rows, interests) {
  Object.keys(interests).forEach(function(name) { rows.push([name, interests[name]]); });
}

function appendComparisonRows(rows, current, previous, definitions) {
  definitions.forEach(function(definition) {
    var currentValue = current[definition[1]] || 0;
    var previousValue = previous[definition[1]] || 0;
    rows.push([
      definition[0],
      currentValue,
      previousValue,
      currentValue - previousValue,
      percentageChange(currentValue, previousValue)
    ]);
  });
}

function percentageChange(current, previous) {
  if (!previous) return "N/A";
  return (((current - previous) / previous) * 100).toFixed(1) + "%";
}

function appendFunnelRows(rows, metrics) {
  rows.push(["CTA Interaction", metrics.ctaInteractions]);
  rows.push(["Form Open", metrics.formsOpened]);
  rows.push(["Form Start", metrics.formsStarted]);
  rows.push(["Document Selected", metrics.documentsSelected]);
  rows.push(["Lead Conversion", metrics.leadConversions]);
  rows.push(["Form Abandonment", metrics.formsAbandoned]);
}

function styleReportSheet(sheet, width) {
  sheet.getRange(1, 1, 1, width).setFontWeight("bold").setFontSize(14).setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange(1, 1, sheet.getLastRow(), width).setWrap(true);
  sheet.autoResizeColumns(1, width);
  sheet.setFrozenRows(1);
}

function addDailyCharts(sheet, metrics) {
  insertReportChartSafely(
    sheet,
    Charts.ChartType.COLUMN,
    [sheet.getRange("A6:B19")],
    1,
    5,
    "Daily Core Activity",
    { colors: ["#10B981"], legend: "none", width: 560, height: 300 }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.PIE,
    [sheet.getRange("A31:B36")],
    18,
    5,
    "Daily Lead Types",
    { colors: ["#10B981", "#06B6D4", "#0F172A", "#64748B", "#94A3B8"], legend: "right", width: 560, height: 300, is3D: false }
  );
}

function addWeeklyCharts(sheet, metrics, previous) {
  insertReportChartSafely(
    sheet,
    Charts.ChartType.COLUMN,
    [sheet.getRange("A22:A27"), sheet.getRange("B21:C27")],
    1,
    7,
    "Current vs Previous Week",
    { colors: ["#10B981", "#06B6D4"], legend: "bottom", width: 560, height: 300, isStacked: false,
      series: { 0: { labelInLegend: "Current Week" }, 1: { labelInLegend: "Previous Week" } } }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.PIE,
    [sheet.getRange("A29:B34")],
    18,
    7,
    "Weekly Lead Types",
    { colors: ["#10B981", "#06B6D4", "#0F172A", "#64748B", "#94A3B8"], legend: "right", width: 560, height: 300, is3D: false }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.BAR,
    [sheet.getRange("A43:B48")],
    35,
    7,
    "Weekly Behavioral Funnel",
    { colors: ["#06B6D4"], legend: "none", width: 560, height: 320 }
  );
}

function addMonthlyCharts(sheet, metrics, previous) {
  insertReportChartSafely(
    sheet,
    Charts.ChartType.COLUMN,
    [sheet.getRange("A22:A27"), sheet.getRange("B21:C27")],
    1,
    7,
    "Current vs Previous Month",
    { colors: ["#10B981", "#06B6D4"], legend: "bottom", width: 560, height: 300, isStacked: false,
      series: { 0: { labelInLegend: "Current Month" }, 1: { labelInLegend: "Previous Month" } } }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.PIE,
    [sheet.getRange("A29:B34")],
    18,
    7,
    "Monthly Lead Types",
    { colors: ["#10B981", "#06B6D4", "#0F172A", "#64748B", "#94A3B8"], legend: "right", width: 560, height: 300, is3D: false }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.BAR,
    [sheet.getRange("A36:C40")],
    35,
    7,
    "Monthly Regional Activity",
    { colors: ["#10B981", "#06B6D4"], legend: "bottom", width: 560, height: 320,
      series: { 0: { labelInLegend: "Behavioral Activity" }, 1: { labelInLegend: "Inquiries" } } }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.BAR,
    [sheet.getRange("A68:B73")],
    52,
    7,
    "Monthly Behavioral Funnel",
    { colors: ["#0F172A"], legend: "none", width: 560, height: 320 }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.LINE,
    [sheet.getRange("A44:B48")],
    69,
    7,
    "Monthly Scroll Depth",
    { colors: ["#06B6D4"], legend: "bottom", width: 560, height: 300, pointSize: 5,
      series: { 0: { labelInLegend: "Scroll Depth" } } }
  );
  insertReportChartSafely(
    sheet,
    Charts.ChartType.COLUMN,
    [sheet.getRange("A49:B51")],
    86,
    7,
    "Monthly Engagement Milestones",
    { colors: ["#64748B"], legend: "bottom", width: 560, height: 300,
      series: { 0: { labelInLegend: "Engagement Events" } } }
  );
}

function insertReportChartSafely(sheet, chartType, ranges, row, column, title, options) {
  try {
    if (!sheet || !ranges || ranges.length === 0) return;

    var builder = sheet.newChart().setChartType(chartType);
    ranges.forEach(function(range) {
      if (range) builder.addRange(range);
    });

    var chartOptions = options || {};
    builder
      .setPosition(row, column, 0, 0)
      .setOption("title", title)
      .setOption("legend", { position: chartOptions.legend || "bottom" })
      .setOption("colors", chartOptions.colors || ["#10B981"])
      .setOption("width", chartOptions.width || 560)
      .setOption("height", chartOptions.height || 300);

    Object.keys(chartOptions).forEach(function(optionName) {
      if (["colors", "legend", "width", "height"].indexOf(optionName) !== -1) return;
      builder.setOption(optionName, chartOptions[optionName]);
    });

    sheet.insertChart(builder.build());
  } catch (err) {
    Logger.log("Report chart creation skipped for " + title + ": " + safeErrorMessage(err));
  }
}

/**
 * Applies the shared inspection-table format to existing RAW DATA sheets.
 * This function never creates, clears, deletes, or rewrites sheet data.
 */
function formatRawDataSheets() {
  var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  var targetNames = [
    "Navigation",
    "Regions",
    "Infrastructure",
    "Energy",
    "Automation",
    "Solutions",
    "Industries",
    "Locations",
    "AI Assistant",
    "CTA Interactions",
    "Lead_Submissions",
    "Quick_Inquiries",
    "Contact_Submissions"
  ];
  var formatted = [];
  var skipped = [];

  targetNames.forEach(function(name) {
    var sheet = rawSs.getSheetByName(name);
    if (!sheet) {
      skipped.push(name);
      return;
    }

    if (name === "Locations") {
      formatLocationsRawDataSheet(sheet);
    } else {
      formatExistingRawDataSheet(sheet);
    }
    formatted.push(name);
  });

  Logger.log("RAW DATA sheets formatted: " + formatted.join(", "));
  if (skipped.length > 0) Logger.log("RAW DATA sheets skipped because they do not exist: " + skipped.join(", "));
  return { formattedSheets: formatted, skippedSheets: skipped };
}

/**
 * Applies the Locations-specific presentation without changing its values or
 * the existing header colors/design. Body formatting spans the available sheet
 * rows so later appendRow() calls inherit the same presentation.
 */
function formatLocationsRawDataSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var maxRows = sheet.getMaxRows();
  var bodyRows = Math.max(maxRows - 1, 0);
  var lastColumn = 5;
  var headerRange = sheet.getRange(1, 1, 1, lastColumn);

  // Apply the font and column behavior to the whole Locations sheet body,
  // including currently blank rows that may receive future appendRow() data.
  sheet.getRange(1, 1, Math.max(maxRows, 1), lastColumn).setFontFamily("Times New Roman");
  if (bodyRows > 0) {
    var bodyRange = sheet.getRange(2, 1, bodyRows, lastColumn);
    bodyRange
      .setFontColor("#000000")
      .setVerticalAlignment("middle");

    sheet.getRange(2, 1, bodyRows, 1)
      .setHorizontalAlignment("center")
      .setNumberFormat("M/d/yyyy HH:mm:ss")
      .setWrap(false);
    sheet.getRange(2, 2, bodyRows, 3)
      .setHorizontalAlignment("left")
      .setWrap(true);
    sheet.getRange(2, 5, bodyRows, 1)
      .setHorizontalAlignment("left")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

    var usedBodyRows = Math.max(lastRow - 1, 0);
    if (usedBodyRows > 0) {
      sheet.getRange(2, 1, usedBodyRows, lastColumn)
        .setBorder(true, true, true, true, true, true, "#D9E4DC", SpreadsheetApp.BorderStyle.SOLID);
    }
    sheet.setRowHeights(2, bodyRows, 28);
    if (lastRow > 1) sheet.autoResizeRows(2, lastRow - 1);
  }

  // Only alignment/wrapping/font are changed here; existing header colors,
  // borders, weight, and other intentional styling are preserved.
  headerRange
    .setFontFamily("Times New Roman")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.setRowHeight(1, 33);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 190);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 260);
  sheet.setFrozenRows(1);
}

function formatExistingRawDataSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return;

  var dataRange = sheet.getRange(1, 1, Math.max(lastRow, 1), lastColumn);
  var headerRange = sheet.getRange(1, 1, 1, lastColumn);
  var headers = headerRange.getDisplayValues()[0].map(function(value) {
    return String(value || "").trim();
  });

  headerRange
    .setBackground("#14532D")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(false);

  dataRange
    .setVerticalAlignment("middle")
    .setFontFamily("Arial")
    .setFontSize(10)
    .setBorder(true, true, true, true, true, true, "#D9E4DC", SpreadsheetApp.BorderStyle.SOLID);

  if (lastRow > 1) {
    var bodyRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
    bodyRange.setHorizontalAlignment("left");

    headers.forEach(function(header, index) {
      var column = index + 1;
      var normalized = header.toLowerCase();
      var columnRange = sheet.getRange(2, column, lastRow - 1, 1);

      if (normalized.indexOf("timestamp") !== -1) {
        columnRange.setNumberFormat("M/d/yyyy HH:mm:ss");
        columnRange.setHorizontalAlignment("left");
      } else if (/count|views|inquiries|total|number|rate/i.test(normalized)) {
        columnRange.setHorizontalAlignment("right");
      }

      if (/message|topic|input|selection|organization|notes|description/i.test(normalized)) {
        columnRange.setWrap(true).setVerticalAlignment("top");
      } else {
        columnRange.setWrap(false);
      }
    });
  }

  applyRawDataBanding(dataRange);
  headerRange
    .setBackground("#14532D")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(false);
  ensureRawDataFilter(sheet, dataRange);
  sizeRawDataColumns(sheet, headers);
  sheet.setFrozenRows(1);
}

function applyRawDataBanding(dataRange) {
  try {
    dataRange.getBandings().forEach(function(banding) {
      banding.remove();
    });
    dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  } catch (err) {
    Logger.log("RAW DATA row banding skipped: " + safeErrorMessage(err));
  }
}

function ensureRawDataFilter(sheet, dataRange) {
  try {
    var filter = sheet.getFilter();
    if (!filter) dataRange.createFilter();
  } catch (err) {
    Logger.log("RAW DATA filter setup skipped for " + sheet.getName() + ": " + safeErrorMessage(err));
  }
}

function sizeRawDataColumns(sheet, headers) {
  sheet.autoResizeColumns(1, headers.length);
  headers.forEach(function(header, index) {
    var normalized = header.toLowerCase();
    var minimum = 90;
    var maximum = 220;

    if (normalized.indexOf("timestamp") !== -1) {
      minimum = 145;
      maximum = 165;
    } else if (normalized.indexOf("session id") !== -1) {
      minimum = 180;
      maximum = 220;
    } else if (/message|topic|input|selection|organization|notes|description/i.test(normalized)) {
      minimum = 180;
      maximum = 320;
    } else if (/event|category|lead type|mime type|document name/i.test(normalized)) {
      minimum = 140;
      maximum = 240;
    } else if (/page|destination|region|capability|feature|solution|industry|location|cta/i.test(normalized)) {
      minimum = 120;
      maximum = 220;
    }

    var currentWidth = sheet.getColumnWidth(index + 1);
    sheet.setColumnWidth(index + 1, Math.max(minimum, Math.min(maximum, currentWidth)));
  });
}
