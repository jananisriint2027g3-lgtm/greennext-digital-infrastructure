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
 * - No email automation or mail triggers (independent of email).
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

    if (!targetSheet) {
      return jsonResponse(false, "Missing sheet parameter.");
    }

    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");

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
    recentLong: longLeads.slice(-5).reverse()
  });

  // 2. Regional Analytics Sheet
  renderRegionalAnalytics(anaSs, regData, locData, quickLeads, longLeads);

  // 3. CTA and Conversion Funnel Sheet
  renderCtaAndFunnel(anaSs, ctaData, uniqueSessionsCount, quickOpens, quickSubmits, longSubmits);

  // 4. Infrastructure & Energy Telemetry Sheet
  renderInfraEnergyAnalytics(anaSs, infData, eneData, autData);

  // 5. AI Assistant Telemetry Sheet
  renderAiAssistantAnalytics(anaSs, aiData);
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
    insertChartSafely(sheet, Charts.ChartType.COLUMN, [
      sheet.getRange("A4:A8"),
      sheet.getRange("C4:E8")
    ], 1, 8, "Regional Engagement Comparison", "bottom");
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
    .addItem("📊 Refresh Analytics Now", "updateAnalyticsSpreadsheet")
    .addItem("⚙️ Setup Analytics Sheets Structure", "setupAnalyticsSpreadsheet")
    .addToUi();
}

function setupAnalyticsSpreadsheet() {
  updateAnalyticsSpreadsheet();
  SpreadsheetApp.getUi().alert("GreenNext Analytics Derived Sheets initialized successfully.");
}
