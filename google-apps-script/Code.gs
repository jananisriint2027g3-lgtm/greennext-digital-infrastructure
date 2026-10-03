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

var ALLOWED_BEHAVIORAL_SHEETS = [
  "Navigation", "Regions", "Infrastructure", "Energy", "Automation",
  "Solutions", "Industries", "Locations", "AI Assistant", "CTA Interactions"
];
var ALLOWED_FORM_SHEETS = ["Quick_Inquiries", "Contact_Submissions"];
var ALLOWED_FORM_TYPES = ["quick_inquiry", "long_form_inquiry", "lead_inquiry"];
var MAX_TEXT_LENGTHS = {
  event: 100, eventId: 128, enrichmentSignature: 128, page: 500, sessionId: 200, sessionKind: 40, value: 500,
  name: 200, email: 320, phone: 100, organization: 200, interest: 200,
  category: 200, region: 200, topic: 200, message: 20000, requestId: 128,
  referrerUrl: 2000, landingPage: 500, trafficSource: 40, utmSource: 200,
  utmMedium: 200, utmCampaign: 300, utmTerm: 300, utmContent: 300,
  timezone: 100, utcOffset: 20, activityLocalHour: 5, activityDay: 20, siteHost: 255
};
var ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain"
];
var MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
var INTELLIGENCE_PROVIDER_PROPERTY_NAMES = {
  geoUrl: "GEO_PROVIDER_URL",
  geoApiKey: "GEO_PROVIDER_API_KEY",
  networkUrl: "NETWORK_PROVIDER_URL",
  networkApiKey: "NETWORK_PROVIDER_API_KEY",
  enrichmentSecret: "ANALYTICS_ENRICHMENT_SECRET"
};

// ─── 1. HTTP GET & POST ENDPOINTS ──────────────────────────────────────────

/**
 * Health check & diagnostic status endpoint.
 */
function doGet(e) {
  var output = {
    status: "online",
    system: "GreenNext Digital Infrastructure Data Platform",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ingestion handler for both behavioral telemetry and actual inquiry submissions.
 */
function doPost(e) {
  var diagStartedAt = Date.now();
  greenNextDiag("REQUEST START", diagStartedAt);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(false, "No payload received.");
    }

    var payload = JSON.parse(e.postData.contents);
    validateIncomingPayload(payload);
    var targetSheet = payload.sheet;
    greenNextDiag("OPEN SPREADSHEET START", diagStartedAt);
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    greenNextDiag("OPEN SPREADSHEET COMPLETE", diagStartedAt);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    upsertSessionContext(rawSs, payload, timestamp);

    // ── Unified Lead Submission ──
    // Lead payloads intentionally do not need a sheet name; they are routed by formType.
    if (payload.formType === "lead_inquiry") {
      greenNextDiag("PROCESS LEAD START", diagStartedAt);
      var leadResponse = processLeadSubmission(payload, rawSs, timestamp, diagStartedAt);
      greenNextDiag("PROCESS LEAD COMPLETE", diagStartedAt);
      return leadResponse;
    }

    // ── Form Submission: Quick Inquiry ──
    if (targetSheet === "Quick_Inquiries" || payload.formType === "quick_inquiry") {
      var qSheet = getOrCreateSheet(rawSs, "Quick_Inquiries", [
        "Timestamp", "Event", "Name", "Email", "Phone", "Interest", "Message", "Page", "Session ID", "Session Kind", "Request ID"
      ]);

      var quickWasDuplicate = appendInquiryOnce(qSheet, [
        timestamp,
        payload.event || "quick_inquiry_submit",
        payload.name || "",
        payload.email || "",
        payload.phone || "",
        payload.interest || "General",
        payload.message || "",
        payload.page || "",
        payload.sessionId || "",
        payload.sessionKind || "",
        payload.requestId || ""
      ], payload.requestId, 11);
      if (quickWasDuplicate) return jsonResponse(true, "Quick inquiry already recorded.");

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
        "Timestamp", "Event", "Name", "Email", "Phone", "Organization", "Category", "Region", "Message", "Page", "Session ID", "Session Kind", "Request ID"
      ]);

      var longWasDuplicate = appendInquiryOnce(cSubSheet, [
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
        payload.sessionId || "",
        payload.sessionKind || "",
        payload.requestId || ""
      ], payload.requestId, 12);
      if (longWasDuplicate) return jsonResponse(true, "Technical inquiry already recorded.");

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
    var sheet = setupBehavioralSheetIfMissing(rawSs, targetSheet);

    var row = buildBehavioralRow(targetSheet, payload, timestamp);
    if (!row) {
      return jsonResponse(false, "Invalid sheet: " + targetSheet);
    }

    if (appendBehavioralEventOnce(sheet, row, payload)) return jsonResponse(true, "Event already recorded.");
    return jsonResponse(true, "Event recorded.");
  } catch (err) {
    return jsonResponse(false, "Error: " + err.toString());
  }
}

function appendBehavioralEventOnce(sheet, row, payload) {
  var eventId = String(payload && payload.eventId || "");
  if (!eventId) {
    sheet.appendRow(row);
    return false;
  }
  var cacheKey = "gn_event_" + eventId;
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get(cacheKey)) return true;
    sheet.appendRow(row);
    cache.put(cacheKey, "1", 21600);
    return false;
  } finally {
    lock.releaseLock();
  }
}

function validateIncomingPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload must be a JSON object.");
  }

  Object.keys(payload).forEach(function(key) {
    if (typeof payload[key] === "string" && MAX_TEXT_LENGTHS[key] && payload[key].length > MAX_TEXT_LENGTHS[key]) {
      throw new Error("Field exceeds the allowed length: " + key);
    }
  });

  if (!payload.sheet || typeof payload.sheet !== "string") {
    throw new Error("Missing sheet parameter.");
  }

  var isBehavioralSheet = ALLOWED_BEHAVIORAL_SHEETS.indexOf(payload.sheet) !== -1;
  var isFormSheet = ALLOWED_FORM_SHEETS.indexOf(payload.sheet) !== -1;
  if (!isBehavioralSheet && !isFormSheet) {
    throw new Error("Unexpected sheet.");
  }

  if (payload.formType && ALLOWED_FORM_TYPES.indexOf(payload.formType) === -1) {
    throw new Error("Unexpected form type.");
  }
  if (payload.formType && (!payload.requestId || typeof payload.requestId !== "string")) {
    throw new Error("Missing request ID.");
  }
  if (payload.formType !== "lead_inquiry" &&
      (!payload.event || typeof payload.event !== "string" || !/^[a-z][a-z0-9_]{1,99}$/.test(payload.event))) {
    throw new Error("Invalid event.");
  }
  if (!payload.sessionId || typeof payload.sessionId !== "string") {
    throw new Error("Missing session ID.");
  }
  if (payload.eventId !== undefined &&
      (typeof payload.eventId !== "string" || !/^[-A-Za-z0-9_]{8,128}$/.test(payload.eventId))) {
    throw new Error("Invalid event ID.");
  }

  if (payload.formType === "lead_inquiry") {
    ["name", "email", "message", "leadType"].forEach(function(field) {
      if (!payload[field] || typeof payload[field] !== "string") throw new Error("Missing lead field: " + field);
    });
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) throw new Error("Invalid email.");
    validateLeadDocument(payload.document);
  } else if (payload.formType === "quick_inquiry" || payload.formType === "long_form_inquiry") {
    ["name", "email", "message"].forEach(function(field) {
      if (!payload[field] || typeof payload[field] !== "string") throw new Error("Missing inquiry field: " + field);
    });
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) throw new Error("Invalid email.");
    if (payload.formType === "long_form_inquiry") validateLeadDocument(payload.document);
  } else if (!isBehavioralSheet) {
    throw new Error("Form type is required for inquiry sheets.");
  }
}

function validateLeadDocument(document) {
  if (!document) return;
  if (typeof document !== "object" || Array.isArray(document) ||
      typeof document.fileName !== "string" || typeof document.mimeType !== "string" ||
      typeof document.data !== "string") {
    throw new Error("Invalid document payload.");
  }
  if (document.fileName.length < 1 || document.fileName.length > 255 ||
      ALLOWED_DOCUMENT_MIME_TYPES.indexOf(document.mimeType) === -1) {
    throw new Error("Unsupported document.");
  }
  var estimatedBytes = Math.floor(document.data.length * 3 / 4);
  if (estimatedBytes > MAX_DOCUMENT_BYTES) throw new Error("Document exceeds the 10 MB limit.");
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(document.data)) throw new Error("Invalid document encoding.");
}

function upsertSessionContext(rawSs, payload, timestamp) {
  if (!payload || !payload.sessionId) return;
  var headers = [
    "Session ID", "Session Kind", "First Seen", "Traffic Source", "Referrer URL", "Landing Page",
    "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content", "Timezone", "UTC Offset",
    "Activity Local Hour", "Activity Day", "Geo Country", "Geo Region", "Geo City", "IP Available",
    "Network Type", "ISP", "Organization", "ASN", "Context Source", "Geo Confidence", "Geo Source",
    "Network Confidence", "Network Source"
  ];
  var sheet = getOrCreateSheet(rawSs, "Session_Context", headers);
  var enrichmentVerified = verifyEnrichmentSignature(payload);
  var context = normalizeTrafficContext(payload);
  if (enrichmentVerified) {
    context = applyProviderEnrichment(context, {
      country: payload.geoCountry, region: payload.geoRegion, city: payload.geoCity,
      confidence: payload.geoConfidence, source: payload.geoSource
    }, {
      network_type: payload.networkType, isp: payload.isp, organization: payload.organization,
      asn: payload.asn, confidence: payload.networkConfidence, source: payload.networkSource
    });
  }
  var providerContext = getProviderContextStatus();
  var geoSource = context.geo_source || (enrichmentVerified ? providerContext.geo_source : "unverified_ignored");
  var networkSource = context.network_source || (enrichmentVerified ? providerContext.network_source : "unverified_ignored");
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    // Re-check after acquiring the lock to prevent two first events creating duplicates.
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var lockedExisting = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var j = 0; j < lockedExisting.length; j++) {
        if (String(lockedExisting[j][0] || "") === String(payload.sessionId)) {
          if (enrichmentVerified) updateSessionContextEnrichment(sheet, j + 2, context, geoSource, networkSource);
          return;
        }
      }
    }
    sheet.appendRow([
      payload.sessionId || "", payload.sessionKind || "", timestamp, context.traffic_source,
      context.referrer_url, context.landing_page, context.utm_source, context.utm_medium,
      context.utm_campaign, context.utm_term, context.utm_content, context.timezone,
      context.utc_offset, context.activity_local_hour, context.activity_day,
      context.geo_country || "", context.geo_region || "", context.geo_city || "",
      context.ip_available || "unavailable", context.network_type || "unavailable",
      context.isp || "", context.organization || "", context.asn || "",
      "client_context_plus_apps_script", context.geo_confidence || "", geoSource,
      context.network_confidence || "", networkSource
    ]);
  } finally {
    lock.releaseLock();
  }
}

function isUnavailableContextValue(value) {
  var normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "unavailable" || normalized === "geo unavailable" ||
    normalized === "not available" || normalized === "unknown";
}

function updateContextCellIfMissing(row, column, incoming) {
  if (!isUnavailableContextValue(incoming) && isUnavailableContextValue(row[column - 1])) {
    row[column - 1] = incoming;
  }
}

function updateSessionContextEnrichment(sheet, rowNumber, context, geoSource, networkSource) {
  var row = sheet.getRange(rowNumber, 1, 1, 28).getValues()[0];
  updateContextCellIfMissing(row, 16, context.geo_country);
  updateContextCellIfMissing(row, 17, context.geo_region);
  updateContextCellIfMissing(row, 18, context.geo_city);
  updateContextCellIfMissing(row, 19, context.ip_available);
  updateContextCellIfMissing(row, 20, context.network_type);
  updateContextCellIfMissing(row, 21, context.isp);
  updateContextCellIfMissing(row, 22, context.organization);
  updateContextCellIfMissing(row, 23, context.asn);
  updateContextCellIfMissing(row, 25, context.geo_confidence);
  updateContextCellIfMissing(row, 26, geoSource);
  updateContextCellIfMissing(row, 27, context.network_confidence);
  updateContextCellIfMissing(row, 28, networkSource);
  sheet.getRange(rowNumber, 1, 1, 28).setValues([row]);
}

/**
 * Provider configuration is intentionally server-side. Apps Script web apps do
 * not expose the caller's IP, so configured providers remain dormant until a
 * trusted reverse proxy supplies a server-only lookup input. Client payloads
 * are never accepted as location or network authority.
 */
function getProviderContextStatus() {
  var config = getIntelligenceProviderConfig();
  return {
    geo_source: config.geo.url && config.geo.api_key_configured ? "configured_pending_trusted_lookup" : "not_configured",
    network_source: config.network.url && config.network.api_key_configured ? "configured_pending_trusted_lookup" : "not_configured"
  };
}

function getIntelligenceProviderConfig() {
  var properties = PropertiesService.getScriptProperties().getProperties() || {};
  return {
    geo: {
      url: safeProviderUrl(properties[INTELLIGENCE_PROVIDER_PROPERTY_NAMES.geoUrl]),
      api_key_configured: !!String(properties[INTELLIGENCE_PROVIDER_PROPERTY_NAMES.geoApiKey] || "").trim()
    },
    network: {
      url: safeProviderUrl(properties[INTELLIGENCE_PROVIDER_PROPERTY_NAMES.networkUrl]),
      api_key_configured: !!String(properties[INTELLIGENCE_PROVIDER_PROPERTY_NAMES.networkApiKey] || "").trim()
    }
  };
}

function safeProviderUrl(value) {
  var url = String(value || "").trim();
  return /^https:\/\/[^\s]{1,500}$/i.test(url) ? url : "";
}

function normalizeProviderResponse(response, kind) {
  var value = response && typeof response === "object" ? response : {};
  var result = {
    country: safeContextValue(value.country || value.country_code, 100),
    region: safeContextValue(value.region || value.region_name, 150),
    city: safeContextValue(value.city, 150),
    network_type: safeContextValue(value.network_type || value.networkType, 100),
    isp: safeContextValue(value.isp, 200),
    organization: safeContextValue(value.organization || value.org, 200),
    asn: safeContextValue(value.asn, 100),
    confidence: safeContextValue(value.confidence, 20),
    source: safeContextValue(value.source || value.provider, 100)
  };
  if (kind === "geo") return { country: result.country, region: result.region, city: result.city, confidence: result.confidence, source: result.source };
  return { network_type: result.network_type, isp: result.isp, organization: result.organization, asn: result.asn, confidence: result.confidence, source: result.source };
}

// Adapter boundary for a future trusted reverse proxy. This function accepts
// provider responses only after server-side lookup and never accepts client
// location/network fields as authority.
function applyProviderEnrichment(context, geoResponse, networkResponse) {
  var enriched = context || {};
  var geo = normalizeProviderResponse(geoResponse, "geo");
  var network = normalizeProviderResponse(networkResponse, "network");
  if (geo.country || geo.region || geo.city) {
    enriched.geo_country = geo.country;
    enriched.geo_region = geo.region;
    enriched.geo_city = geo.city;
    enriched.ip_available = "derived_provider_only";
    enriched.geo_confidence = geo.confidence;
    enriched.geo_source = geo.source || "trusted_provider";
  }
  if (network.network_type || network.isp || network.organization || network.asn) {
    enriched.network_type = network.network_type;
    enriched.isp = network.isp;
    enriched.organization = network.organization;
    enriched.asn = network.asn;
    enriched.network_confidence = network.confidence;
    enriched.network_source = network.source || "trusted_provider";
    enriched.ip_available = "derived_provider_only";
  }
  return enriched;
}

function verifyEnrichmentSignature(payload) {
  var secret = String(PropertiesService.getScriptProperties().getProperty(INTELLIGENCE_PROVIDER_PROPERTY_NAMES.enrichmentSecret) || "");
  var supplied = String(payload && payload.enrichmentSignature || "");
  if (!secret || !supplied) return false;
  var message = [
    payload.eventId || "", payload.sessionId || "", payload.timestamp || "",
    payload.geoCountry || "", payload.geoRegion || "", payload.geoCity || "",
    payload.geoConfidence || "", payload.geoSource || "", payload.networkType || "",
    payload.isp || "", payload.organization || "", payload.asn || "",
    payload.networkConfidence || "", payload.networkSource || ""
  ].join("|");
  var expected = Utilities.base64Encode(Utilities.computeHmacSha256Signature(message, secret));
  return expected === supplied;
}

function normalizeTrafficContext(payload) {
  var referrer = String(payload.referrerUrl || "").trim();
  var source = String(payload.utmSource || "").trim();
  var medium = String(payload.utmMedium || "").trim();
  var campaign = String(payload.utmCampaign || "").trim();
  var sourceLower = source.toLowerCase();
  var mediumLower = medium.toLowerCase();
  var referrerHost = extractHost(referrer);
  var trafficSource = "unknown";
  if (["cpc", "ppc", "paid", "paid_social", "display", "programmatic"].indexOf(mediumLower) !== -1) trafficSource = "paid";
  else if (mediumLower === "social" || isSocialHost(sourceLower) || isSocialHost(referrerHost)) trafficSource = "social";
  else if (mediumLower === "organic" || isOrganicHost(sourceLower) || isOrganicHost(referrerHost)) trafficSource = "organic";
  else if (source || medium || campaign) trafficSource = "campaign";
  else if (!referrer || (referrerHost && String(payload.siteHost || "").toLowerCase().replace(/^www\./, "") === referrerHost)) trafficSource = "direct";
  else if (referrerHost) trafficSource = "referral";
  return {
    traffic_source: trafficSource,
    referrer_url: safeContextValue(referrer, 2000),
    landing_page: safeContextValue(payload.landingPage || payload.page || "/", 500),
    utm_source: safeContextValue(source, 200),
    utm_medium: safeContextValue(medium, 200),
    utm_campaign: safeContextValue(campaign, 300),
    utm_term: safeContextValue(payload.utmTerm || "", 300),
    utm_content: safeContextValue(payload.utmContent || "", 300),
    timezone: safeContextValue(payload.timezone || "", 100),
    utc_offset: safeContextValue(payload.utcOffset || "", 20),
    activity_local_hour: safeContextValue(payload.activityLocalHour || "", 5),
    activity_day: safeContextValue(payload.activityDay || "", 20)
  };
}

function safeContextValue(value, maxLength) {
  return String(value || "").substring(0, maxLength);
}

function extractHost(value) {
  var match = String(value || "").match(/^https?:\/\/([^/]+)/i);
  return match ? match[1].toLowerCase().replace(/^www\./, "").split(":")[0] : "";
}

function isSocialHost(host) {
  return ["facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "youtube.com", "tiktok.com"].indexOf(host) !== -1;
}

function isOrganicHost(host) {
  return ["google.com", "bing.com", "yahoo.com", "duckduckgo.com", "baidu.com"].indexOf(host) !== -1;
}

/**
 * Stores a website lead in the dedicated raw-data sheet and sends the internal
 * notification after the metadata row has been persisted.
 */
function processLeadSubmission(payload, rawSs, timestamp, diagStartedAt) {
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
  greenNextDiag("LOCK WAIT START", diagStartedAt);
  lock.waitLock(20000);
  greenNextDiag("LOCK ACQUIRED", diagStartedAt);

  try {
    greenNextDiag("GET/CREATE SHEET START", diagStartedAt);
    var leadSheet = getOrCreateSheet(rawSs, "Lead_Submissions", [
      "Timestamp", "Lead Type", "Name", "Email", "Phone", "Organization",
      "Region", "Topic / Category", "Message", "Page", "Session ID",
      "Session Kind", "Document Attached", "Document Name", "Document MIME Type", "Status", "Request ID"
    ]);
    greenNextDiag("GET/CREATE SHEET COMPLETE", diagStartedAt);

    var leadTimestamp = payload.timestamp || timestamp;
    var document = normalizeLeadDocument(payload.document);
    if ((payload.leadType === "Partner / Collaboration Inquiry" || payload.leadType === "Career Inquiry") && !document) {
      return jsonResponse(false, payload.leadType === "Partner / Collaboration Inquiry"
        ? "Please upload a partnership or company document."
        : "Please upload your resume or CV.");
    }
    greenNextDiag("DUPLICATE CHECK START", diagStartedAt);
    var duplicateRow = findRecentLeadDuplicate(leadSheet, payload, leadTimestamp, document);
    greenNextDiag("DUPLICATE CHECK COMPLETE", diagStartedAt);
    if (duplicateRow > 0) {
      return jsonResponse(true, "Lead submission already recorded.");
    }

    var rowNumber = leadSheet.getLastRow() + 1;
    greenNextDiag("APPEND START", diagStartedAt);
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
      "",
      payload.requestId || ""
    ]);
    greenNextDiag("APPEND COMPLETE row=" + rowNumber, diagStartedAt);

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
      greenNextDiag("EMAIL START", diagStartedAt);
      MailApp.sendEmail(emailOptions);
      greenNextDiag("EMAIL COMPLETE", diagStartedAt);
      emailStatus = document ? "EMAIL_SENT" : "EMAIL_SENT_WITHOUT_DOCUMENT";
    } catch (emailError) {
      Logger.log("Lead email failed: " + safeErrorMessage(emailError));
    }

    greenNextDiag("STATUS UPDATE START", diagStartedAt);
    leadSheet.getRange(rowNumber, 16).setValue(emailStatus);
    greenNextDiag("STATUS UPDATE COMPLETE", diagStartedAt);
    greenNextDiag("RESPONSE START", diagStartedAt);
    return jsonResponse(true, "Lead submission recorded successfully.");
  } finally {
    greenNextDiag("LOCK RELEASE START", diagStartedAt);
    lock.releaseLock();
    greenNextDiag("LOCK RELEASE COMPLETE", diagStartedAt);
  }
}

function greenNextDiag(operation, startedAt) {
  var now = new Date();
  Logger.log(
    "[GREENNEXT_DIAG] " + now.toISOString() + " | " + operation + " | elapsedMs=" + (Date.now() - startedAt),
  );
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
  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, Math.max(16, sheet.getLastColumn())).getValues();
  var documentName = document ? document.fileName : "";
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (payload.requestId && String(row[16] || "") === String(payload.requestId)) {
      return startRow + i;
    }
    if (sameLeadTimestamp(row[0], leadTimestamp) &&
        String(row[1]) === String(payload.leadType) &&
        String(row[2]) === String(payload.name || "") &&
        String(row[3]) === String(payload.email || "") &&
        String(row[10]) === String(payload.sessionId || "") &&
      String(row[13]) === documentName &&
      (!payload.requestId || String(row[16] || "") === String(payload.requestId))) {
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
 * Helper to build the row array matching each tab's schema.
 */
function buildBehavioralRow(sheetName, p, ts) {
  var event = p.event || "";
  var page = p.page || "";
  var sid = p.sessionId || "";

  switch (sheetName) {
    case "Navigation":
      // Timestamp | Event | Page | Destination | Session ID | Session Kind
      return [ts, event, page, p.destination || p.value || "", sid, p.sessionKind || ""];
    case "Regions":
      // Timestamp | Event | Region | Page | Session ID
      return [ts, event, p.region || p.value || "", page, sid, p.sessionKind || ""];
    case "Infrastructure":
      // Timestamp | Event | Capability | Page | Session ID
      return [ts, event, p.capability || p.value || "", page, sid, p.sessionKind || ""];
    case "Energy":
      // Timestamp | Event | Topic | Page | Session ID
      return [ts, event, p.topic || p.value || "", page, sid, p.sessionKind || ""];
    case "Automation":
      // Timestamp | Event | Feature | Page | Session ID
      return [ts, event, p.feature || p.value || "", page, sid, p.sessionKind || ""];
    case "Solutions":
      // Timestamp | Event | Solution | Page | Session ID
      return [ts, event, p.solution || p.value || "", page, sid, p.sessionKind || ""];
    case "Industries":
      // Timestamp | Event | Industry | Page | Session ID
      return [ts, event, p.industry || p.value || "", page, sid, p.sessionKind || ""];
    case "Locations":
      // Timestamp | Event | Location | Page | Session ID
      return [ts, event, p.location || p.value || "", page, sid, p.sessionKind || ""];
    case "AI Assistant":
      // Timestamp | Event | Input / Selection | Page | Session ID
      return [ts, event, p.inputSelection || p.value || "", page, sid, p.sessionKind || ""];
    case "CTA Interactions":
      // Timestamp | Event | CTA | Page | Session ID
      return [ts, event, p.cta || p.value || "", page, sid, p.sessionKind || ""];
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
  var sessionContext = buildSessionContextMap(getSheetRows(rawSs, "Session_Context"));

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
  var sessionRecords = buildSessionIntelligenceRecords(advancedModel, sessionContext);
  renderSessionIntelligence(anaSs, sessionRecords);
  renderTrafficIntelligence(anaSs, sessionRecords);
  renderGeoIntelligence(anaSs, sessionRecords);
  renderTimezoneIntelligence(anaSs, sessionRecords);
  renderIpIntelligence(anaSs, sessionRecords);
  renderUnifiedIntelligence(anaSs, buildUnifiedIntelligenceModel(sessionRecords));

  // Distinct Sessions across all tabs
  var allSessions = {};
  [navData, regData, infData, eneData, autData, solData, indData, locData, aiData, ctaData, quickLeads, longLeads, dedicatedLeads].forEach(function(dataset) {
    dataset.forEach(function(row) {
      var sid = rawSessionId(row);
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
  var dedicatedSubmits = dedicatedLeads.length;
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
    totalInquiries: quickSubmits + longSubmits + dedicatedSubmits,
    quickSubmits: quickSubmits,
    longSubmits: longSubmits + dedicatedSubmits,
    quickOpens: quickOpens,
    whatsAppTriggers: whatsAppTriggers,
    totalEvents: totalEvents,
    recentQuick: quickLeads.slice(-5).reverse(),
    recentLong: longLeads.slice(-5).reverse(),
    advanced: advancedModel.summary
  });

  // 2. Regional Analytics Sheet
  renderRegionalAnalytics(anaSs, regData, locData, quickLeads, longLeads, dedicatedLeads);

  // 3. CTA and Conversion Funnel Sheet
  renderCtaAndFunnel(anaSs, ctaData, uniqueSessionsCount, quickOpens, quickSubmits, longSubmits + dedicatedSubmits);

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

  // Presentation-only enhancement. This reuses the existing session model and
  // never changes raw schemas, intelligence definitions, or collection logic.
  try {
    enhanceExistingReportingPresentation(anaSs, sessionRecords, { aiData: aiData });
  } catch (presentationError) {
    Logger.log("Presentation enhancement deferred: " + safeErrorMessage(presentationError));
  }

  try {
    refreshNativeVisualizationLayer(anaSs, sessionRecords, {
      aiData: aiData,
      regData: regData,
      locData: locData,
      infData: infData,
      eneData: eneData,
      autData: autData,
      quickLeads: quickLeads,
      longLeads: longLeads,
      dedicatedLeads: dedicatedLeads
    });
  } catch (visualizationError) {
    Logger.log("Native visualization refresh deferred: " + safeErrorMessage(visualizationError));
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
    ["- Long-Form / Lead Submissions", stats.longSubmits, "Contact page and dedicated lead submissions"],
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

  // The dashboard owns the KPI visualization. Executive_Summary retains the
  // exact KPI and inquiry tables without adding a redundant chart.
}

/**
 * 2. Regional Analytics Sheet
 */
function renderRegionalAnalytics(anaSs, regData, locData, quickLeads, longLeads, dedicatedLeads) {
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
  (dedicatedLeads || []).forEach(function(r) {
    var val = (r[6] || "").toLowerCase();
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
    ["4. Long-Form / Lead Submissions", longSubmits, uniqueSessions > 0 ? ((longSubmits / uniqueSessions) * 100).toFixed(1) + "%" : "0%", "Detailed consultative and dedicated lead submissions"],
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
  } else if (headers && headers.length > s.getLastColumn()) {
    s.getRange(1, s.getLastColumn() + 1, 1, headers.length - s.getLastColumn()).setValues([
      headers.slice(s.getLastColumn())
    ]);
    s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
    s.setFrozenRows(1);
  }
  return s;
}

function appendInquiryOnce(sheet, row, requestId, requestColumnIndex) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (findInquiryRequest(sheet, requestId, requestColumnIndex) > 0) return true;
    sheet.appendRow(row);
    return false;
  } finally {
    lock.releaseLock();
  }
}

function findInquiryRequest(sheet, requestId, requestColumnIndex) {
  if (!requestId || !sheet || sheet.getLastRow() <= 1) return 0;
  var lastRow = sheet.getLastRow();
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][requestColumnIndex] || "") === String(requestId)) return i + 2;
  }
  return 0;
}

/**
 * Removes charts previously generated by this refresh so repeated updates do
 * not accumulate duplicate visualizations. Existing cell tables are untouched.
 */
function clearCharts(sheet) {
  try {
    sheet.getCharts().forEach(function(chart) {
      if (isGreenNextOwnedChart(chart)) sheet.removeChart(chart);
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
  var ownedTitle = String(title || "");
  if (ownedTitle.indexOf(GREENNEXT_CHART_TITLE_PREFIX) !== 0) ownedTitle = GREENNEXT_CHART_TITLE_PREFIX + ownedTitle;
  return insertOwnedChartSafely(sheet, chartType, ranges, row, column,
    ownedTitle, legendPosition ? { legend: legendPosition } : {});
}

var GREENNEXT_CHART_TITLE_PREFIX = "GreenNext | ";

function isGreenNextOwnedChart(chart) {
  try {
    var title = chart.getOptions().get("title");
    return String(title || "").indexOf(GREENNEXT_CHART_TITLE_PREFIX) === 0;
  } catch (err) {
    return false;
  }
}

function insertOwnedChartSafely(sheet, chartType, sourceRange, row, column, title, options) {
  if (!sheet || !sourceRange || !title) return null;
  try {
    var legend = options && options.legend;
    if (typeof legend === "string") legend = { position: legend };
    if (!legend) legend = { position: "none" };
    var builder = sheet.newChart()
      .setChartType(chartType)
      .setPosition(row, column, 0, 0)
      .setOption("title", title)
      .setOption("legend", legend);
    (Array.isArray(sourceRange) ? sourceRange : [sourceRange]).forEach(function(range) {
      if (range) builder.addRange(range);
    });
    if (options) {
      Object.keys(options).forEach(function(key) {
        if (key !== "legend" && options[key] !== undefined && options[key] !== null) {
          builder.setOption(key, options[key]);
        }
      });
    }
    var chart = builder.build();
    sheet.insertChart(chart);
    return chart;
  } catch (err) {
    Logger.log("GreenNext chart skipped for " + sheet.getName() + ": " + safeErrorMessage(err));
    return null;
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
    "Navigation": ["Timestamp", "Event", "Page", "Destination", "Session ID", "Session Kind"],
    "Regions": ["Timestamp", "Event", "Region", "Page", "Session ID", "Session Kind"],
    "Infrastructure": ["Timestamp", "Event", "Capability", "Page", "Session ID", "Session Kind"],
    "Energy": ["Timestamp", "Event", "Topic", "Page", "Session ID", "Session Kind"],
    "Automation": ["Timestamp", "Event", "Feature", "Page", "Session ID", "Session Kind"],
    "Solutions": ["Timestamp", "Event", "Solution", "Page", "Session ID", "Session Kind"],
    "Industries": ["Timestamp", "Event", "Industry", "Page", "Session ID", "Session Kind"],
    "Locations": ["Timestamp", "Event", "Location", "Page", "Session ID", "Session Kind"],
    "AI Assistant": ["Timestamp", "Event", "Input / Selection", "Page", "Session ID", "Session Kind"],
    "CTA Interactions": ["Timestamp", "Event", "CTA", "Page", "Session ID", "Session Kind"]
  };
  var headers = schemaMap[targetSheet] || ["Timestamp", "Event", "Value", "Page", "Session ID", "Session Kind"];
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
var REPORT_EMAIL_RECIPIENTS = "jananisri.int2027g3@gmail.com,pooja.test2026@gmail.com";
var PRESENTATION_HEATMAP_PROPERTY = "GREENNEXT_PRESENTATION_HEATMAP_RANGES";
var PRESENTATION_START_MARKER = "PRESENTATION_START";
var PRESENTATION_END_MARKER = "PRESENTATION_END";
var PRESENTATION_SHEETS = [
  "Executive_Summary", "Session_Intelligence", "Traffic_Intelligence", "Geo_Intelligence",
  "Regional_Analytics", "Timezone_Intelligence", "IP_Intelligence", "Unified_Intelligence", "CTA_and_Funnel",
  "AI_Assistant_Telemetry"
];
var PRESENTATION_SECTION_TITLES = [
  "SESSION PATH / DWELL INSPECTION",
  "SESSION DEPTH / DWELL DISTRIBUTION",
  "TRAFFIC × ENGAGEMENT × CONVERSION",
  "REGIONAL DEMAND / ENGAGEMENT MATRIX",
  "ACTIVITY DAY × LOCAL HOUR HEATMAP",
  "NETWORK × SUSPICIOUS ACTIVITY",
  "BEHAVIOR SEGMENT × CONVERSION",
  "FUNNEL INSPECTION / OBSERVED SESSION COUNTS"
];
var CHART_CLEANUP_SHEETS = PRESENTATION_SHEETS.concat([
  "Infrastructure_and_Energy", "AI_Assistant_Telemetry", "Daily_Report", "Weekly_Report", "Monthly_Report",
  "Advanced_Journey_Analysis", "Advanced_Engagement_Analysis", "Advanced_Interest_Analysis",
  "Advanced_Regional_Analysis", "Advanced_AI_Analysis", "Advanced_Lead_Analysis", "Advanced_Association_Analysis"
]);
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

/** Refreshes the presentation layer for standalone daily/weekly/monthly runs. */
function refreshPresentationLayerFromReportingSource(rawSs, source, timezone) {
  rawSs = rawSs || SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
  source = source || loadReportingSource(rawSs);
  timezone = timezone || getReportingTimezone(rawSs);
  var model = buildAdvancedWebsiteIntelligenceModel(source, timezone);
  var records = buildSessionIntelligenceRecords(
    model,
    buildSessionContextMap(getSheetRows(rawSs, "Session_Context"))
  );
  enhanceExistingReportingPresentation(
    SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID),
    records,
    { aiData: source["AI Assistant"] || [] }
  );
  refreshNativeVisualizationLayer(SpreadsheetApp.openById(ANALYTICS_SPREADSHEET_ID), records, {
    aiData: source["AI Assistant"] || [],
    regData: source.Regions || [],
    locData: source.Locations || [],
    infData: source.Infrastructure || [],
    eneData: source.Energy || [],
    autData: source.Automation || [],
    quickLeads: source.Quick_Inquiries || [],
    longLeads: source.Contact_Submissions || [],
    dedicatedLeads: source.Lead_Submissions || []
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
        sessionKind: String(row.length >= 6 ? row[5] || "" : ""),
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
  return rawSessionId(row);
}

function buildSessionIntelligenceRecords(model, contextMap) {
  var records = [];
  Object.keys(model.sessions || {}).forEach(function(sessionId) {
    var session = model.sessions[sessionId];
    var events = (session.events || []).slice().sort(advancedCompareRecords);
    if (!events.length && (session.leads || []).length) {
      events = session.leads.map(function(lead) {
        return {
          source: "Lead_Submissions",
          event: "lead_conversion",
          value: lead.type || "",
          page: "",
          timestamp: lead.timestamp || 0,
          sourceIndex: lead.sourceIndex || 0,
          sessionId: sessionId,
          sessionKind: lead.sessionKind || ""
        };
      });
    }
    if (!events.length) return;

    var pageViews = [];
    var pages = [];
    var lastPage = "";
    var lastPageTime = 0;
    var dwell = {};
    var ctaInteractions = 0;
    var formInteractions = 0;
    var leadConversion = false;
    var engaged = false;
    var sessionEndObserved = false;

    if ((session.leads || []).length) {
      leadConversion = true;
      engaged = true;
      formInteractions += session.leads.length;
    }

    events.forEach(function(record) {
      var eventName = record.event;
      var page = record.page || record.destination || "";
      if (eventName === "page_view" || eventName === "nav_page_view") {
        page = page || record.value || "/";
        if (!dwell[page]) dwell[page] = { page_start: record.timestamp, page_end: record.timestamp, active_time: 0 };
        dwell[page].page_end = record.timestamp;
        if (page !== lastPage || !lastPageTime || record.timestamp - lastPageTime > 2000) {
          pages.push(page);
          pageViews.push(record);
          lastPage = page;
          lastPageTime = record.timestamp;
        }
      }
      if (eventName === "time_on_page") {
        var activeMs = Number(record.value);
        page = page || "/";
        if (isFinite(activeMs) && activeMs >= 0) {
          if (!dwell[page]) dwell[page] = { page_start: record.timestamp, page_end: record.timestamp, active_time: 0 };
          dwell[page].active_time += activeMs;
          dwell[page].page_end = record.timestamp;
        }
      }
      if (eventName === "session_end") sessionEndObserved = true;
      if (record.source === "CTA Interactions" && !isSessionHousekeepingEvent(eventName)) {
        ctaInteractions++;
        engaged = true;
      }
      if (/^(form_|lead_conversion)/.test(eventName)) {
        formInteractions++;
        engaged = true;
      }
      if (eventName === "lead_conversion" || eventName === "form_submit") leadConversion = true;
      if (/^engagement_/.test(eventName) || /^(scroll_50|scroll_75|scroll_90|scroll_100)$/.test(eventName)) engaged = true;
    });

    var first = events[0];
    var last = events[events.length - 1];
    var start = first.timestamp || 0;
    var end = last.timestamp || 0;
    var bounce = pages.length === 1 && !engaged && !leadConversion;
    var context = (contextMap && contextMap[sessionId]) || {};
    var suspicious = detectSuspiciousSession(events, pages.length);
    records.push({
      session_id: sessionId,
      session_type: sessionKindForSession(session, events),
      session_start_time: start ? new Date(start).toISOString() : "",
      session_end_time: end ? new Date(end).toISOString() : "",
      entry_page: pages[0] || first.page || "",
      pages_visited: pages,
      pages_count: pages.length,
      navigation_flow: pages.join(" → "),
      exit_page: pages.length ? pages[pages.length - 1] : (last.page || ""),
      total_session_duration: start && end && end >= start ? end - start : "",
      page_dwell_times: dwell,
      bounce: pages.length ? bounce : "",
      engaged: engaged,
      total_events: events.length,
      cta_interactions: ctaInteractions,
      form_interactions: formInteractions,
      lead_conversion: leadConversion,
      session_end_observed: sessionEndObserved,
      traffic_source: context.traffic_source || "unknown",
      referrer_url: context.referrer_url || "",
      landing_page: context.landing_page || "",
      utm_source: context.utm_source || "",
      utm_medium: context.utm_medium || "",
      utm_campaign: context.utm_campaign || "",
      utm_term: context.utm_term || "",
      utm_content: context.utm_content || "",
      geo_country: context.geo_country || "",
      geo_region: context.geo_region || "",
      geo_city: context.geo_city || "",
      timezone: context.timezone || "",
      utc_offset: context.utc_offset || "",
      activity_local_hour: context.activity_local_hour || "",
      activity_day: context.activity_day || "",
      network_type: context.network_type || "unavailable",
      isp: context.isp || "",
      organization: context.organization || "",
      asn: context.asn || "",
      geo_confidence: context.geo_confidence || "",
      geo_source: context.geo_source || "not_configured",
      network_confidence: context.network_confidence || "",
      network_source: context.network_source || "not_configured",
      ip_available: context.ip_available || "unavailable",
      suspicious_traffic: suspicious.suspicious,
      suspicious_reason: suspicious.reason
    });
  });
  return records;
}

function buildSessionContextMap(rows) {
  var map = {};
  (rows || []).forEach(function(row) {
    var sessionId = String(row[0] || "");
    if (!sessionId) return;
    map[sessionId] = {
      session_kind: String(row[1] || ""), traffic_source: String(row[3] || "unknown"),
      referrer_url: String(row[4] || ""), landing_page: String(row[5] || ""),
      utm_source: String(row[6] || ""), utm_medium: String(row[7] || ""),
      utm_campaign: String(row[8] || ""), utm_term: String(row[9] || ""),
      utm_content: String(row[10] || ""), timezone: String(row[11] || ""),
      utc_offset: String(row[12] || ""), activity_local_hour: String(row[13] || ""),
      activity_day: String(row[14] || ""), geo_country: String(row[15] || ""),
      geo_region: String(row[16] || ""), geo_city: String(row[17] || ""),
      ip_available: String(row[18] || "unavailable"), network_type: String(row[19] || "unavailable"),
      isp: String(row[20] || ""), organization: String(row[21] || ""), asn: String(row[22] || ""),
      context_source: String(row[23] || ""), geo_confidence: String(row[24] || ""),
      geo_source: String(row[25] || "not_configured"), network_confidence: String(row[26] || ""),
      network_source: String(row[27] || "not_configured")
    };
  });
  return map;
}

function detectSuspiciousSession(events, pageCount) {
  var timestamps = (events || []).map(function(event) { return event.timestamp; }).filter(function(value) { return isFinite(value); }).sort(function(a, b) { return a - b; });
  for (var i = 0; i + 20 < timestamps.length; i++) {
    if (timestamps[i + 20] - timestamps[i] <= 10000) return { suspicious: true, reason: "large_event_burst" };
  }
  if (events.length > 120) return { suspicious: true, reason: "high_event_volume" };
  if (pageCount > 30) return { suspicious: true, reason: "high_page_view_volume" };
  if (events.length >= 40 && timestamps.length > 1 && timestamps[timestamps.length - 1] - timestamps[0] <= 60000) {
    return { suspicious: true, reason: "abnormal_activity_density" };
  }
  return { suspicious: false, reason: "" };
}

function sessionKindForSession(session, events) {
  var kinds = session.kinds || {};
  if (kinds.new_session) return "new_session";
  if (kinds.returning_session) return "returning_session";
  for (var i = 0; i < events.length; i++) {
    if (events[i].sessionKind) return events[i].sessionKind;
  }
  return "unknown";
}

function isSessionHousekeepingEvent(eventName) {
  return eventName === "page_view" || eventName === "nav_page_view" ||
    eventName === "time_on_page" || eventName === "session_end" ||
    /^scroll_/.test(eventName) || /^engagement_/.test(eventName);
}

function renderSessionIntelligence(anaSs, records) {
  var sheet = getOrCreateSheet(anaSs, "Session_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT SESSION INTELLIGENCE"],
    ["Derived from canonical behavioral and inquiry event streams. Dwell values are active foreground milliseconds."],
    [""],
    ["Metric", "Value"],
    ["Total Sessions", records.length],
    ["New Sessions", records.filter(function(r) { return r.session_type === "new_session"; }).length],
    ["Returning Sessions", records.filter(function(r) { return r.session_type === "returning_session"; }).length],
    ["Average Session Duration (ms)", averageSessionMetric(records, "total_session_duration")],
    ["Average Pages / Session", averageSessionMetric(records, "pages_count")],
    ["Bounce Rate", records.length ? (records.filter(function(r) { return r.bounce === true; }).length / records.length * 100).toFixed(1) + "%" : "N/A"],
    ["Engagement Rate", records.length ? (records.filter(function(r) { return r.engaged === true; }).length / records.length * 100).toFixed(1) + "%" : "N/A"],
    [""],
  ];
  for (var dashboardSpacer = 0; dashboardSpacer < 12; dashboardSpacer++) rows.push([""]);
  rows.push(["session_id", "session_type", "session_start_time", "session_end_time", "entry_page", "pages_visited", "pages_count", "navigation_flow", "exit_page", "total_session_duration", "page_dwell_times", "bounce", "engaged", "total_events", "cta_interactions", "form_interactions", "lead_conversion", "session_end_observed", "traffic_source", "referrer_url", "landing_page", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "geo_country", "geo_region", "geo_city", "timezone", "utc_offset", "activity_local_hour", "activity_day", "network_type", "isp", "organization", "asn", "ip_available", "suspicious_traffic", "suspicious_reason", "geo_confidence", "geo_source", "network_confidence", "network_source"]);
  records.forEach(function(record) {
    rows.push([
      record.session_id, record.session_type, record.session_start_time, record.session_end_time,
      record.entry_page, record.pages_visited.join(" | "), record.pages_count, record.navigation_flow,
      record.exit_page, record.total_session_duration, JSON.stringify(record.page_dwell_times),
      record.bounce, record.engaged, record.total_events, record.cta_interactions,
      record.form_interactions, record.lead_conversion, record.session_end_observed,
      record.traffic_source, record.referrer_url, record.landing_page, record.utm_source,
      record.utm_medium, record.utm_campaign, record.utm_term, record.utm_content,
      record.geo_country, record.geo_region, record.geo_city, record.timezone, record.utc_offset,
      record.activity_local_hour, record.activity_day, record.network_type, record.isp, record.organization, record.asn,
      record.ip_available, record.suspicious_traffic, record.suspicious_reason, record.geo_confidence,
      record.geo_source, record.network_confidence, record.network_source
    ]);
  });
  writeRows(sheet, rows, 44);
  sheet.getRange("A1:AR1").setFontWeight("bold").setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:B4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.getRange("A25:AR25").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 44);
}

function averageSessionMetric(records, key) {
  var values = records.map(function(record) {
    return record[key] === "" || record[key] === null || record[key] === undefined ? null : Number(record[key]);
  }).filter(function(value) { return value !== null && isFinite(value); });
  return values.length ? (values.reduce(function(total, value) { return total + value; }, 0) / values.length).toFixed(2) : "N/A";
}

function aggregateSessionRecords(records, keyFunction) {
  var groups = {};
  (records || []).forEach(function(record) {
    var key = keyFunction(record) || "Unavailable";
    if (!groups[key]) groups[key] = { sessions: 0, engaged: 0, conversions: 0, suspicious: 0 };
    groups[key].sessions++;
    if (record.engaged) groups[key].engaged++;
    if (record.lead_conversion) groups[key].conversions++;
    if (record.suspicious_traffic) groups[key].suspicious++;
  });
  return groups;
}

function aggregateRows(groups, firstColumn) {
  return Object.keys(groups).sort(function(a, b) { return groups[b].sessions - groups[a].sessions; }).map(function(key) {
    var group = groups[key];
    return [key, group.sessions, group.engaged, group.conversions, group.suspicious];
  });
}

function renderTrafficIntelligence(anaSs, records) {
  var sheet = getOrCreateSheet(anaSs, "Traffic_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT TRAFFIC INTELLIGENCE"],
    ["Derived from first-touch session context and Layer 1 session records."],
    [""],
    ["Traffic Source", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]
  ].concat(aggregateRows(aggregateSessionRecords(records, function(r) { return r.traffic_source; })), [[""], ["Campaign", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]], aggregateRows(aggregateSessionRecords(records, function(r) { return r.utm_campaign || "No Campaign"; })), [[""], ["Landing Page", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]], aggregateRows(aggregateSessionRecords(records, function(r) { return r.landing_page || r.entry_page || "Unavailable"; })), [[""], ["Referral URL", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]], aggregateRows(aggregateSessionRecords(records, function(r) { return r.referrer_url || "Direct / None"; })));
  writeRows(sheet, rows, 5);
  styleIntelligenceSheet(sheet, "A1:E1");
}

function renderGeoIntelligence(anaSs, records) {
  var sheet = getOrCreateSheet(anaSs, "Geo_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT GEO INTELLIGENCE"],
    ["Only trusted server-side enrichment is shown; unavailable fields remain unavailable."],
    [""],
    ["Country / Region / City", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]
  ].concat(aggregateRows(aggregateSessionRecords(records, function(r) { return [r.geo_country, r.geo_region, r.geo_city].filter(Boolean).join(" / ") || "Unavailable"; })));
  writeRows(sheet, rows, 5);
  styleIntelligenceSheet(sheet, "A1:E1");
}

function renderTimezoneIntelligence(anaSs, records) {
  var sheet = getOrCreateSheet(anaSs, "Timezone_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT TIMEZONE INTELLIGENCE"],
    ["Timezone and local activity hour are client-derived unless a trusted server source is later added."],
    [""],
    ["Timezone / Activity Day / Local Hour", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]
  ].concat(aggregateRows(aggregateSessionRecords(records, function(r) { return (r.timezone || "Timezone unavailable") + " / day " + (r.activity_day || "unknown") + " / hour " + (r.activity_local_hour || "unknown"); })));
  writeRows(sheet, rows, 5);
  styleIntelligenceSheet(sheet, "A1:E1");
}

function renderIpIntelligence(anaSs, records) {
  var sheet = getOrCreateSheet(anaSs, "IP_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT IP / NETWORK INTELLIGENCE"],
    ["Raw IP is not stored. Network fields remain unavailable until a trusted server-side provider is configured."],
    [""],
    ["Network / Organization / ASN", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"],
  ].concat(aggregateRows(aggregateSessionRecords(records, function(r) { return [r.network_type, r.organization, r.asn].filter(Boolean).join(" / ") || "Unavailable"; })), [[""], ["Suspicious Reason", "Sessions", "Engaged Sessions", "Conversions", "Suspicious Sessions"]], aggregateRows(aggregateSessionRecords(records, function(r) { return r.suspicious_reason || "None"; })));
  writeRows(sheet, rows, 5);
  styleIntelligenceSheet(sheet, "A1:E1");
}

function buildUnifiedIntelligenceModel(records) {
  var unified = (records || []).filter(function(record) { return record && record.session_id; }).map(function(record) {
    var enriched = {};
    Object.keys(record).forEach(function(key) { enriched[key] = record[key]; });
    enriched.engagement_segment = unifiedEngagementSegment(record);
    enriched.behavior_patterns = unifiedBehaviorPatterns(record);
    enriched.unified_profile = [
      record.session_type || "unknown",
      record.traffic_source || "unknown",
      record.utm_campaign || "no_campaign",
      enriched.engagement_segment,
      record.lead_conversion ? "converted" : "not_converted",
      record.geo_country || "geo_unavailable",
      record.timezone || "timezone_unavailable",
      record.network_type || "network_unavailable"
    ].join(" | ");
    return enriched;
  });
  return {
    records: unified,
    traffic: aggregateUnifiedDimension(unified, function(r) { return r.traffic_source; }),
    campaigns: aggregateUnifiedDimension(unified, function(r) { return r.utm_campaign || "No Campaign"; }),
    entries: aggregateUnifiedDimension(unified, function(r) { return r.entry_page; }),
    exits: aggregateUnifiedDimension(unified, function(r) { return r.exit_page; }),
    navigation: aggregateUnifiedDimension(unified, function(r) { return r.navigation_flow; }),
    geo: aggregateUnifiedDimension(unified, function(r) { return [r.geo_country, r.geo_region, r.geo_city].filter(Boolean).join(" / ") || "Unavailable"; }),
    timezone: aggregateUnifiedDimension(unified, function(r) { return [r.timezone, r.activity_day, r.activity_local_hour].filter(Boolean).join(" / ") || "Unavailable"; }),
    activityHours: aggregateUnifiedDimension(unified, function(r) { return r.activity_local_hour || "Unavailable"; }),
    trafficGeo: aggregateUnifiedDimension(unified, function(r) { return [(r.traffic_source || "unknown"), r.geo_country || "Unavailable"].join(" / "); }),
    trafficTimezone: aggregateUnifiedDimension(unified, function(r) { return [(r.traffic_source || "unknown"), r.timezone || "Unavailable", r.activity_local_hour || "unknown"].join(" / "); }),
    networkTraffic: aggregateUnifiedDimension(unified, function(r) { return [(r.network_type || "unavailable"), (r.traffic_source || "unknown")].join(" / "); })
  };
}

function unifiedActiveDwell(record) {
  var dwell = record.page_dwell_times || {};
  return Object.keys(dwell).reduce(function(total, page) { return total + (Number(dwell[page].active_time) || 0); }, 0);
}

function unifiedEngagementSegment(record) {
  if (record.lead_conversion) return "converted";
  if (unifiedActiveDwell(record) >= 120000 && Number(record.pages_count) >= 3 && (Number(record.cta_interactions) > 0 || Number(record.form_interactions) > 0)) return "high";
  if (Number(record.pages_count) >= 2 || record.engaged || Number(record.total_events) >= 3) return "medium";
  return "low";
}

function unifiedBehaviorPatterns(record) {
  var patterns = [];
  if (Number(record.pages_count) <= 1) patterns.push("single_page");
  if (Number(record.pages_count) >= 3) patterns.push("deep_navigation");
  if (unifiedEngagementSegment(record) === "high") patterns.push("high_engagement");
  if (Number(record.cta_interactions) > 0) patterns.push("cta_driven");
  if (Number(record.form_interactions) > 0) patterns.push("form_driven");
  if (record.lead_conversion) patterns.push("converted");
  if (record.session_type === "returning_session" && record.engaged) patterns.push("returning_engaged");
  if (record.utm_campaign && record.engaged) patterns.push("campaign_engaged");
  return patterns;
}

function aggregateUnifiedDimension(records, keyFunction) {
  var groups = {};
  (records || []).forEach(function(record) {
    var key = keyFunction(record) || "Unavailable";
    if (!groups[key]) groups[key] = { sessions: 0, engaged_sessions: 0, bounce_sessions: 0, conversions: 0, total_duration: 0, total_pages: 0 };
    groups[key].sessions++;
    if (record.engaged) groups[key].engaged_sessions++;
    if (record.bounce === true) groups[key].bounce_sessions++;
    if (record.lead_conversion) groups[key].conversions++;
    groups[key].total_duration += Number(record.total_session_duration) || 0;
    groups[key].total_pages += Number(record.pages_count) || 0;
  });
  return groups;
}

function unifiedGroupRows(groups, limit) {
  return Object.keys(groups).sort(function(a, b) { return groups[b].sessions - groups[a].sessions; }).slice(0, limit || 25).map(function(key) {
    var group = groups[key];
    return [
      key, group.sessions, group.engaged_sessions, group.bounce_sessions, group.conversions,
      group.sessions ? (group.conversions / group.sessions * 100).toFixed(1) + "%" : "N/A",
      group.sessions ? (group.total_duration / group.sessions).toFixed(2) : "N/A",
      group.sessions ? (group.total_pages / group.sessions).toFixed(2) : "N/A"
    ];
  });
}

function unifiedTopKeys(groups, limit) {
  return Object.keys(groups).sort(function(a, b) { return groups[b].sessions - groups[a].sessions; }).slice(0, limit || 5).join(" | ") || "N/A";
}

function renderUnifiedIntelligence(anaSs, model) {
  var records = model.records || [];
  var total = records.length;
  var engaged = records.filter(function(r) { return r.engaged; }).length;
  var returning = records.filter(function(r) { return r.session_type === "returning_session"; }).length;
  var bounce = records.filter(function(r) { return r.bounce === true; }).length;
  var cta = records.filter(function(r) { return Number(r.cta_interactions) > 0; }).length;
  var form = records.filter(function(r) { return Number(r.form_interactions) > 0; }).length;
  var converted = records.filter(function(r) { return r.lead_conversion; }).length;
  var durationTotal = records.reduce(function(sum, r) { return sum + (Number(r.total_session_duration) || 0); }, 0);
  var pagesTotal = records.reduce(function(sum, r) { return sum + (Number(r.pages_count) || 0); }, 0);
  var sheet = getOrCreateSheet(anaSs, "Unified_Intelligence");
  sheet.clear();
  var rows = [
    ["GREENNEXT UNIFIED INTELLIGENCE"],
    ["Session-oriented deterministic analysis joining Layer 1 sessions with Layer 2 context. No PII or raw IP identity is used."],
    [""],
    ["Executive Metric", "Value"],
    ["Total Sessions", total], ["Engaged Sessions", engaged], ["Returning Sessions", returning],
    ["Bounce Rate", total ? (bounce / total * 100).toFixed(1) + "%" : "N/A"],
    ["Average Session Duration (ms)", total ? (durationTotal / total).toFixed(2) : "N/A"],
    ["Average Pages / Session", total ? (pagesTotal / total).toFixed(2) : "N/A"],
    ["CTA Rate", total ? (cta / total * 100).toFixed(1) + "%" : "N/A"],
    ["Form Rate", total ? (form / total * 100).toFixed(1) + "%" : "N/A"],
    ["Conversion Rate", total ? (converted / total * 100).toFixed(1) + "%" : "N/A"],
    ["Suspicious Sessions", records.filter(function(r) { return r.suspicious_traffic; }).length],
    ["Top Traffic Sources", unifiedTopKeys(model.traffic)],
    ["Top Campaigns", unifiedTopKeys(model.campaigns)],
    ["Top Entry Pages", unifiedTopKeys(model.entries)],
    ["Top Exit Pages", unifiedTopKeys(model.exits)],
    ["Top Navigation Paths", unifiedTopKeys(model.navigation)],
    ["Top Geographies", unifiedTopKeys(model.geo)],
    ["Top Timezones", unifiedTopKeys(model.timezone)],
    ["Peak Activity Hours", unifiedTopKeys(model.activityHours)],
    [""],
    ["Traffic / Session", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"],
    ["Traffic Source", "", "", "", "", "", "", ""],
  ].concat(unifiedGroupRows(model.traffic), [[""], ["Campaign", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.campaigns), [[""], ["Entry Page", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.entries), [[""], ["Exit Page", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.exits), [[""], ["Geo", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.geo), [[""], ["Timezone / Day / Hour", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.timezone), [[""], ["Traffic / Geo", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.trafficGeo), [[""], ["Traffic / Timezone", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.trafficTimezone), [[""], ["Network / Traffic", "Sessions", "Engaged Sessions", "Bounce Sessions", "Conversions", "Conversion Rate", "Avg Duration (ms)", "Avg Pages"]], unifiedGroupRows(model.networkTraffic), [[""], ["Funnel Stage", "Sessions", "Rate", "Definition"]], ["Traffic", total, "100%", "All unified sessions"], ["Landing Page", records.filter(function(r) { return !!r.landing_page || !!r.entry_page; }).length, total ? "100%" : "N/A", "Sessions with landing/entry context"], ["Page Engagement", engaged, total ? (engaged / total * 100).toFixed(1) + "%" : "N/A", "engaged = Layer 1 engagement"], ["CTA Interaction", cta, total ? (cta / total * 100).toFixed(1) + "%" : "N/A", "sessions with CTA interactions"], ["Form Interaction", form, total ? (form / total * 100).toFixed(1) + "%" : "N/A", "sessions with form interactions"], ["Lead Conversion", converted, total ? (converted / total * 100).toFixed(1) + "%" : "N/A", "sessions with lead conversion"], [[""], ["Navigation / Behavior", "Sessions", "Engaged Sessions", "Conversions", "Conversion Rate"]], unifiedGroupRows(model.navigation).map(function(row) { return [row[0], row[1], row[2], row[4], row[5]]; }), [[""], ["UNIFIED SESSION RECORDS"]], [["session_id", "session_type", "session_start_time", "session_end_time", "entry_page", "exit_page", "pages_count", "navigation_flow", "total_session_duration", "bounce", "engaged", "traffic_source", "referrer_url", "landing_page", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "geo_country", "geo_region", "geo_city", "geo_confidence", "geo_source", "timezone", "activity_day", "activity_local_hour", "network_type", "isp", "organization", "asn", "network_confidence", "network_source", "suspicious_traffic", "suspicious_reason", "total_events", "cta_interactions", "form_interactions", "lead_conversion", "engagement_segment", "behavior_patterns", "unified_profile"]], records.map(function(r) { return [r.session_id, r.session_type, r.session_start_time, r.session_end_time, r.entry_page, r.exit_page, r.pages_count, r.navigation_flow, r.total_session_duration, r.bounce, r.engaged, r.traffic_source, r.referrer_url, r.landing_page, r.utm_source, r.utm_medium, r.utm_campaign, r.utm_term, r.utm_content, r.geo_country, r.geo_region, r.geo_city, r.geo_confidence, r.geo_source, r.timezone, r.activity_day, r.activity_local_hour, r.network_type, r.isp, r.organization, r.asn, r.network_confidence, r.network_source, r.suspicious_traffic, r.suspicious_reason, r.total_events, r.cta_interactions, r.form_interactions, r.lead_conversion, r.engagement_segment, r.behavior_patterns.join(" | "), r.unified_profile]; }));
  writeRows(sheet, rows, 42);
  sheet.getRange("A1:AP1").setFontWeight("bold").setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:B4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 42);
}

/**
 * Presentation layer for the existing report and intelligence sheets.
 *
 * These tables deliberately stay inside the existing sheets so the team keeps
 * one shared report. They are derived only from Session_Intelligence records,
 * which makes every displayed value traceable to the current pipeline.
 */
function enhanceExistingReportingPresentation(anaSs, records, auxiliary) {
  auxiliary = auxiliary || {};
  CHART_CLEANUP_SHEETS.forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (sheet) clearCharts(sheet);
  });
  resetPresentationHeatmaps(anaSs);
  resetPresentationBlocks(anaSs);
  var sessions = Array.isArray(records) ? records.filter(function(record) {
    return record && record.session_id;
  }) : [];
  var pathRows = aggregatePresentationGroups(sessions, function(record) {
    return record.navigation_flow || record.entry_page || "Unavailable";
  });
  var regionRows = aggregatePresentationGroups(sessions, function(record) {
    return [record.geo_country, record.geo_region, record.geo_city].filter(Boolean).join(" / ") || "Unavailable";
  });
  var timeRows = aggregatePresentationGroups(sessions, function(record) {
    return (record.activity_day || "Day unavailable") + " / hour " +
      (record.activity_local_hour === "" || record.activity_local_hour === undefined ? "unavailable" : record.activity_local_hour);
  });
  var networkRows = aggregatePresentationGroups(sessions, function(record) {
    return [record.network_type, record.isp, record.asn].filter(Boolean).join(" / ") || "Unavailable";
  });
  var segmentRows = aggregatePresentationGroups(sessions, function(record) {
    return record.engagement_segment || unifiedEngagementSegment(record);
  });
  var trafficSegmentRows = aggregatePresentationGroups(sessions, function(record) {
    return (record.traffic_source || "Unavailable") + " / " +
      (record.engagement_segment || unifiedEngagementSegment(record));
  });

  appendPresentationSection(anaSs.getSheetByName("Session_Intelligence"), "SESSION PATH / DWELL INSPECTION", [
    ["Navigation Path or Entry", "Sessions", "Engaged", "Conversions", "Bounce", "Avg Pages", "Avg Duration (ms)"]
  ].concat(pathRows.slice(0, 25).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.conversions, row.bounce, row.avgPages, row.avgDuration];
  })), 7, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("Session_Intelligence"), "SESSION DEPTH / DWELL DISTRIBUTION", [
    ["Observed Band", "Sessions", "Engaged", "Conversions", "Bounce"]
  ].concat(buildPresentationDistributionRows(sessions)), 5, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("Traffic_Intelligence"), "TRAFFIC × ENGAGEMENT × CONVERSION", [
    ["Traffic Source / Engagement Segment", "Sessions", "Engaged", "CTA Sessions", "Form Sessions", "Conversions", "Conversion Rate"]
  ].concat(trafficSegmentRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.cta, row.form, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A"];
  })), 7, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("Regional_Analytics"), "REGIONAL DEMAND / ENGAGEMENT MATRIX", [
    ["Country / Region / City", "Sessions", "Engaged", "CTA Sessions", "Conversions", "Conversion Rate"]
  ].concat(regionRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.cta, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A"];
  })), 6, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("Timezone_Intelligence"), "ACTIVITY DAY × LOCAL HOUR HEATMAP", [
    ["Activity Day / Local Hour", "Sessions", "Engaged", "Conversions", "CTA Sessions", "Form Sessions"]
  ].concat(timeRows.slice(0, 60).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.conversions, row.cta, row.form];
  })), 6, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("IP_Intelligence"), "NETWORK × SUSPICIOUS ACTIVITY", [
    ["Network / ISP / ASN", "Sessions", "Engaged", "Conversions", "Suspicious", "Suspicious Rate"]
  ].concat(networkRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.conversions, row.suspicious,
      row.sessions ? (row.suspicious / row.sessions * 100).toFixed(1) + "%" : "N/A"];
  })), 6, "#0F172A", "#38BDF8");

  appendPresentationSection(anaSs.getSheetByName("Unified_Intelligence"), "BEHAVIOR SEGMENT × CONVERSION", [
    ["Engagement Segment", "Sessions", "Engaged", "CTA Sessions", "Form Sessions", "Conversions", "Conversion Rate"]
  ].concat(segmentRows.map(function(row) {
    return [row.key, row.sessions, row.engaged, row.cta, row.form, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A"];
  })), 7, "#0F172A", "#38BDF8");

  var funnelSheet = anaSs.getSheetByName("CTA_and_Funnel");
  if (funnelSheet) {
    appendPresentationSection(funnelSheet, "FUNNEL INSPECTION / OBSERVED SESSION COUNTS", [
      ["Stage", "Sessions", "Rate", "Definition"]
    ].concat(buildPresentationFunnelRows(sessions)), 4, "#0F172A", "#38BDF8");
  }

  renderCellNativePresentation(anaSs, sessions, {
    pathRows: pathRows,
    regionRows: regionRows,
    timeRows: timeRows,
    networkRows: networkRows,
    segmentRows: segmentRows,
    trafficSegmentRows: trafficSegmentRows
  }, auxiliary.aiData || []);
  finalizePresentationBlocks(anaSs);
  applyPresentationFormatting(anaSs, sessions.length);
}

function renderCellNativePresentation(anaSs, records, groups, aiData) {
  aiData = Array.isArray(aiData) ? aiData : [];
  var kpis = buildPresentationKpis(records);
  var signals = [
    ["Highest-volume path", topPresentationGroup(groups.pathRows, "key")],
    ["Leading traffic source", topPresentationGroup(aggregatePresentationGroups(records, function(record) { return record.traffic_source || "Unavailable"; }), "key")],
    ["Highest-demand region", topPresentationGroup(groups.regionRows, "key")],
    ["Busiest local-time window", topPresentationGroup(groups.timeRows, "key")],
    ["Suspicious activity signal", kpis.suspicious > 0 ? kpis.suspicious + " session(s) flagged" : "No flagged sessions"],
    ["Returning visitor signal", kpis.returning + " returning session(s)"]
  ];

  appendPresentationPanel(anaSs.getSheetByName("Executive_Summary"), "INTELLIGENCE COMMAND CENTER", [
    ["Metric", "Value", "Metric", "Value", "Metric", "Value"],
    ["Total Sessions", kpis.sessions, "Engaged Sessions", kpis.engaged, "Returning Visitors", kpis.returning],
    ["Leads", kpis.leads, "CTA Interactions", kpis.ctaInteractions, "Conversion Rate", kpis.conversionRate],
    ["Average Session Duration", kpis.avgDuration, "Suspicious Activity", kpis.suspicious, "Data State", records.length ? "LIVE" : "NO DATA"]
  ], 6);
  appendPresentationPanel(anaSs.getSheetByName("Executive_Summary"), "INTELLIGENCE SIGNALS", [
    ["Signal", "Observed value"]
  ].concat(signals), 2);
  appendPresentationPanel(anaSs.getSheetByName("Executive_Summary"), "JOURNEY OVERVIEW", buildPresentationFunnelRows(records), 4);

  appendPresentationPanel(anaSs.getSheetByName("Session_Intelligence"), "JOURNEY FLOW / OBSERVED SESSION COUNTS", [
    ["ENTRY", "NAVIGATION", "ENGAGEMENT", "CTA", "LEAD"],
    ["Sessions", kpis.sessions, kpis.engaged, kpis.cta, kpis.leads]
  ], 5);
  appendPresentationMatrix(anaSs.getSheetByName("Session_Intelligence"), "PATH FREQUENCY MATRIX", [
    ["Path", "Sessions", "Engaged", "Conversions", "Intensity"]
  ].concat(groups.pathRows.slice(0, 25).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.conversions, presentationIntensity(row.sessions, records.length)];
  })), 5);
  appendPresentationMatrix(anaSs.getSheetByName("Session_Intelligence"), "SESSION INSPECTOR", [
    ["Session ID", "Entry Page", "Pages", "Journey", "Duration", "Engagement", "CTA", "Conversion", "Session Type", "Region", "Timezone"]
  ].concat(records.slice(0, 200).map(function(record) {
    return [record.session_id, record.entry_page || "Unavailable", record.pages_count,
      record.navigation_flow || "Unavailable", record.total_session_duration || "N/A",
      record.engaged ? "ENGAGED" : "LOW", Number(record.cta_interactions) > 0 ? "YES" : "NO",
      record.lead_conversion ? "LEAD" : "NO", record.session_type || "Unavailable",
      [record.geo_country, record.geo_region, record.geo_city].filter(Boolean).join(" / ") || "Unavailable",
      record.timezone || "Unavailable"];
  })), 11);

  appendPresentationMatrix(anaSs.getSheetByName("Traffic_Intelligence"), "SOURCE × BEHAVIOR MATRIX", [
    ["Traffic Source / Segment", "Visitors", "Engaged", "CTA", "Leads", "Conversion", "Intensity"]
  ].concat(groups.trafficSegmentRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.cta, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A",
      presentationIntensity(row.sessions, records.length)];
  })), 7);
  appendPresentationMatrix(anaSs.getSheetByName("Traffic_Intelligence"), "CAMPAIGN / REFERRAL INSPECTION", [
    ["Traffic Source", "Landing / Entry", "Campaign", "Sessions", "Engaged", "Leads"]
  ].concat(records.slice(0, 200).map(function(record) {
    return [record.traffic_source || "Unavailable", record.landing_page || record.entry_page || "Unavailable",
      record.utm_campaign || "No Campaign", 1, record.engaged ? 1 : 0, record.lead_conversion ? 1 : 0];
  })), 6);

  appendPresentationMatrix(anaSs.getSheetByName("Geo_Intelligence"), "GEOGRAPHIC INTELLIGENCE MATRIX", [
    ["Country / Region / City", "Sessions", "Engaged", "CTA", "Leads", "Conversion", "Returning", "Demand"]
  ].concat(groups.regionRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.cta, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A",
      row.returning, row.sessions >= 10 ? "HIGH" : row.sessions > 0 ? "ACTIVE" : "UNAVAILABLE"];
  })), 8);

  appendPresentationMatrix(anaSs.getSheetByName("Timezone_Intelligence"), "DAY × LOCAL HOUR ACTIVITY HEATMAP", buildDayHourMatrix(records), 25);
  appendPresentationMatrix(anaSs.getSheetByName("IP_Intelligence"), "NETWORK RELATIONSHIP MATRIX", [
    ["Network / ISP / ASN", "Sessions", "Engaged", "Returning", "Suspicious", "High-frequency", "CTA", "Status"]
  ].concat(groups.networkRows.slice(0, 30).map(function(row) {
    return [row.key, row.sessions, row.engaged, row.returning, row.suspicious,
      row.suspicious > 0 ? "FLAGGED" : "NORMAL", row.cta,
      row.suspicious > 0 ? "REVIEW" : "NORMAL"];
  })), 8);
  appendPresentationMatrix(anaSs.getSheetByName("IP_Intelligence"), "ANOMALY GRID", [
    ["Network", "Activity", "Frequency", "Time Window", "Suspicion Signal", "Reason", "Status"]
  ].concat(records.filter(function(record) { return record.suspicious_traffic; }).slice(0, 100).map(function(record) {
    return [[record.network_type, record.isp, record.asn].filter(Boolean).join(" / ") || "Unavailable",
      record.total_events || 0, record.total_events > 40 ? "HIGH" : "MEDIUM",
      record.activity_day || "Unavailable", "SUSPICIOUS", record.suspicious_reason || "Observed anomaly",
      "REVIEW"];
  })), 7);

  appendPresentationMatrix(anaSs.getSheetByName("Unified_Intelligence"), "BEHAVIOR SEGMENTATION MATRIX", [
    ["Behavior Segment", "Sessions", "Pages", "Engagement", "CTA", "Leads", "Conversion", "Geo", "Traffic Source", "Timezone"]
  ].concat(groups.segmentRows.map(function(row) {
    return [row.key, row.sessions, row.avgPages, row.engaged, row.cta, row.conversions,
      row.sessions ? (row.conversions / row.sessions * 100).toFixed(1) + "%" : "N/A",
      "Inspectable", "Inspectable", "Inspectable"];
  })), 10);
  appendPresentationPanel(anaSs.getSheetByName("Unified_Intelligence"), "BEHAVIOR → OUTCOME FLOW", [
    ["Behavior Segment", "Content Interest", "Engagement", "CTA", "Lead"],
    ["Inspectable session cohorts", "Existing interest fields", kpis.engaged, kpis.cta, kpis.leads]
  ], 5);

  appendPresentationPanel(anaSs.getSheetByName("CTA_and_Funnel"), "VISUAL FUNNEL / CELL BLOCKS", [
    ["VISITORS", kpis.sessions],
    ["↓", ""],
    ["ENGAGED", kpis.engaged],
    ["↓", ""],
    ["CTA", kpis.cta],
    ["↓", ""],
    ["LEAD", kpis.leads]
  ], 2);
  appendPresentationMatrix(anaSs.getSheetByName("CTA_and_Funnel"), "FUNNEL INSPECTION DETAIL", [
    ["Stage", "Sessions", "Rate", "Definition"]
  ].concat(buildPresentationFunnelRows(records)), 4);

  appendPresentationMatrix(anaSs.getSheetByName("AI_Assistant_Telemetry"),
    "AI ASSISTANT TOPIC / INTERACTION HEATMAP", buildAssistantTelemetryMatrix(aiData), 7);
}

/** Builds a cell-native telemetry heatmap from the existing sanitized AI rows. */
function buildAssistantTelemetryMatrix(aiData) {
  var eventColumns = [
    "chatbot_open",
    "chatbot_query_send",
    "chatbot_suggestion_select",
    "chatbot_link_click"
  ];
  var groups = {};
  (aiData || []).forEach(function(row) {
    var topic = String(row[2] || "Unspecified");
    var event = String(row[1] || "Other");
    if (!groups[topic]) {
      groups[topic] = { topic: topic, counts: {}, other: 0, total: 0 };
    }
    if (eventColumns.indexOf(event) >= 0) {
      groups[topic].counts[event] = (groups[topic].counts[event] || 0) + 1;
    } else {
      groups[topic].other++;
    }
    groups[topic].total++;
  });
  var rows = Object.keys(groups).map(function(key) { return groups[key]; });
  rows.sort(function(a, b) { return b.total - a.total || a.topic.localeCompare(b.topic); });
  return [["Sanitized Topic / Interaction"].concat(eventColumns).concat(["Other", "Total"])].concat(
    rows.slice(0, 50).map(function(group) {
      return [group.topic].concat(eventColumns.map(function(event) {
        return group.counts[event] || 0;
      })).concat([group.other, group.total]);
    })
  );
}

function buildPresentationKpis(records) {
  var sessions = records.length;
  var engaged = records.filter(function(record) { return record.engaged; }).length;
  var returning = records.filter(function(record) { return record.session_type === "returning_session"; }).length;
  var leads = records.filter(function(record) { return record.lead_conversion; }).length;
  var cta = records.filter(function(record) { return Number(record.cta_interactions) > 0; }).length;
  var ctaInteractions = records.reduce(function(total, record) {
    return total + (Number(record.cta_interactions) || 0);
  }, 0);
  var durations = records.map(function(record) { return Number(record.total_session_duration); })
    .filter(function(value) { return isFinite(value); });
  return {
    sessions: sessions,
    engaged: engaged,
    returning: returning,
    leads: leads,
    cta: cta,
    ctaInteractions: ctaInteractions,
    suspicious: records.filter(function(record) { return record.suspicious_traffic; }).length,
    conversionRate: sessions ? (leads / sessions * 100).toFixed(1) + "%" : "N/A",
    avgDuration: durations.length ? (durations.reduce(function(sum, value) { return sum + value; }, 0) / durations.length).toFixed(0) + " ms" : "N/A"
  };
}

function topPresentationGroup(rows, key) {
  return rows && rows.length ? rows[0][key] + " (" + rows[0].sessions + ")" : "Unavailable";
}

function presentationIntensity(value, total) {
  if (!total || !value) return "·";
  var ratio = value / total;
  return ratio >= 0.5 ? "████" : ratio >= 0.25 ? "███" : ratio >= 0.1 ? "██" : "█";
}

function buildDayHourMatrix(records) {
  var header = ["Day / Hour"];
  for (var hour = 0; hour < 24; hour++) header.push(String(hour).padStart(2, "0"));
  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Unavailable"];
  var rows = [header];
  days.forEach(function(day) {
    var row = [day];
    for (var hour = 0; hour < 24; hour++) {
      var count = records.filter(function(record) {
        var recordHour = Number(record.activity_local_hour);
        return (record.activity_day || "Unavailable") === day && isFinite(recordHour) && recordHour === hour;
      }).length;
      row.push(count);
    }
    rows.push(row);
  });
  return rows;
}

function appendPresentationPanel(sheet, title, rows, width) {
  if (!sheet || !rows || !rows.length) return;
  ensurePresentationStartMarker(sheet);
  var startRow = sheet.getLastRow() + 2;
  var normalized = rows.map(function(row) { return padRows([row], width)[0]; });
  sheet.getRange(startRow, 1, normalized.length, width).setValues(normalized);
  sheet.getRange(startRow, 1, 1, width).clearContent();
  sheet.getRange(startRow, 1).setValue(title);
  sheet.getRange(startRow, 1, 1, width).mergeAcross()
    .setBackground("#0F172A").setFontColor("#10B981").setFontWeight("bold").setFontSize(12);
  if (normalized.length > 1) {
    sheet.getRange(startRow + 1, 1, normalized.length - 1, width)
      .setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID)
      .setVerticalAlignment("middle");
  }
  if (normalized.length > 2) {
    sheet.getRange(startRow + 1, 1, 1, width).setBackground("#1E293B").setFontColor("#F8FAFC").setFontWeight("bold");
  }
  sheet.autoResizeColumns(1, width);
}

function appendPresentationMatrix(sheet, title, rows, width) {
  if (!sheet || !rows || rows.length < 2) return;
  appendPresentationPanel(sheet, title, rows, width);
  var endRow = sheet.getLastRow();
  var startRow = endRow - rows.length + 1;
  if (rows.length > 2) applyPresentationHeatmap(sheet.getRange(startRow + 2, 2, rows.length - 2, Math.max(width - 1, 1)));
}

function aggregatePresentationGroups(records, keyFunction) {
  var groups = {};
  (records || []).forEach(function(record) {
    var key = String(keyFunction(record) || "Unavailable");
    if (!groups[key]) groups[key] = {
      key: key, sessions: 0, engaged: 0, cta: 0, form: 0,
      conversions: 0, returning: 0, bounce: 0, suspicious: 0, pages: 0, duration: 0
    };
    var group = groups[key];
    group.sessions++;
    if (record.engaged) group.engaged++;
    if (Number(record.cta_interactions) > 0) group.cta++;
    if (Number(record.form_interactions) > 0) group.form++;
    if (record.lead_conversion) group.conversions++;
    if (record.session_type === "returning_session") group.returning++;
    if (record.bounce === true) group.bounce++;
    if (record.suspicious_traffic) group.suspicious++;
    group.pages += Number(record.pages_count) || 0;
    group.duration += Number(record.total_session_duration) || 0;
  });
  return Object.keys(groups).map(function(key) {
    var group = groups[key];
    group.avgPages = group.sessions ? (group.pages / group.sessions).toFixed(2) : "N/A";
    group.avgDuration = group.sessions ? (group.duration / group.sessions).toFixed(2) : "N/A";
    return group;
  }).sort(function(left, right) {
    return right.sessions - left.sessions || left.key.localeCompare(right.key);
  });
}

function buildPresentationFunnelRows(records) {
  var total = records.length;
  var engaged = records.filter(function(record) { return record.engaged; }).length;
  var cta = records.filter(function(record) { return Number(record.cta_interactions) > 0; }).length;
  var form = records.filter(function(record) { return Number(record.form_interactions) > 0; }).length;
  var conversions = records.filter(function(record) { return record.lead_conversion; }).length;
  return [
    ["Visit", total, total ? "100.0%" : "N/A", "All valid reconstructed sessions"],
    ["Engaged", engaged, total ? (engaged / total * 100).toFixed(1) + "%" : "N/A", "Existing Layer 1 engagement definition"],
    ["CTA interaction", cta, total ? (cta / total * 100).toFixed(1) + "%" : "N/A", "Sessions with observed CTA interaction"],
    ["Form interaction", form, total ? (form / total * 100).toFixed(1) + "%" : "N/A", "Sessions with observed form interaction"],
    ["Inquiry / lead", conversions, total ? (conversions / total * 100).toFixed(1) + "%" : "N/A", "Actual linked inquiry or lead session"]
  ];
}

function buildPresentationDistributionRows(records) {
  var bands = [
    ["1 page", function(record) { return presentationPageCount(record) === 1; }],
    ["2–3 pages", function(record) { var count = presentationPageCount(record); return count !== null && count >= 2 && count <= 3; }],
    ["4–6 pages", function(record) { var count = presentationPageCount(record); return count !== null && count >= 4 && count <= 6; }],
    ["7+ pages", function(record) { var count = presentationPageCount(record); return count !== null && count >= 7; }],
    ["Unavailable", function(record) { return presentationPageCount(record) === null; }]
  ];
  return bands.map(function(band) {
    var matching = records.filter(band[1]);
    return [band[0], matching.length,
      matching.filter(function(record) { return record.engaged; }).length,
      matching.filter(function(record) { return record.lead_conversion; }).length,
      matching.filter(function(record) { return record.bounce === true; }).length];
  }).filter(function(row) { return row[1] > 0; });
}

function presentationPageCount(record) {
  var raw = record && record.pages_count;
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) return null;
  var count = Number(raw);
  return isFinite(count) && count >= 0 && Math.floor(count) === count ? count : null;
}

function appendPresentationSection(sheet, title, rows, width, titleColor, headerColor) {
  if (!sheet || !rows || rows.length < 2) return;
  ensurePresentationStartMarker(sheet);
  var startRow = sheet.getLastRow() + 2;
  var normalized = rows.map(function(row) { return padRows([row], width)[0]; });
  sheet.getRange(startRow, 1, normalized.length, width).setValues(normalized);
  sheet.getRange(startRow, 1, 1, width).clearContent();
  sheet.getRange(startRow, 1).setValue(title);
  sheet.getRange(startRow, 1, 1, width).mergeAcross()
    .setFontWeight("bold").setFontColor("#10B981").setBackground(titleColor);
  sheet.getRange(startRow + 1, 1, 1, width)
    .setFontWeight("bold").setFontColor("#F8FAFC").setBackground(headerColor);
  sheet.getRange(startRow, 1, normalized.length, width).setWrap(true);
  sheet.autoResizeColumns(1, width);
  if (normalized.length > 2) {
    applyPresentationHeatmap(sheet.getRange(startRow + 2, 2, normalized.length - 2, Math.max(width - 1, 1)));
  }
}

function applyPresentationHeatmap(range) {
  try {
    if (!range || range.getNumRows() < 1 || range.getNumColumns() < 1) return;
    var values = range.getValues();
    var hasNumericValue = values.some(function(row) {
      return row.some(function(value) { return typeof value === "number" && isFinite(value); });
    });
    if (!hasNumericValue) return;

    var sheet = range.getSheet();
    var signature = presentationHeatmapSignature(range);
    var properties = PropertiesService.getScriptProperties();
    var ownedRanges = readPresentationHeatmapRanges(properties);
    var rules = (sheet.getConditionalFormatRules() || []).filter(function(rule) {
      return !(isPresentationHeatmapRule(rule) && ownedRanges.indexOf(signature) !== -1 &&
        presentationRuleHasSignature(rule, signature));
    });
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .setGradientMinpoint("#F8FAFC")
      .setGradientMaxpoint("#10B981")
      .setRanges([range])
      .build());
    sheet.setConditionalFormatRules(rules);
    if (ownedRanges.indexOf(signature) === -1) ownedRanges.push(signature);
    properties.setProperty(PRESENTATION_HEATMAP_PROPERTY, JSON.stringify(ownedRanges));
  } catch (err) {
    Logger.log("Presentation heatmap skipped: " + safeErrorMessage(err));
  }
}

function resetPresentationBlocks(anaSs) {
  PRESENTATION_SHEETS.forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (!sheet) return;

    var startRow = findPresentationStartRow(sheet);
    if (startRow < 1) return;

    var endRow = findPresentationEndRow(sheet, startRow);
    var lastRow = endRow > 0 ? endRow : sheet.getLastRow();
    var rowCount = lastRow - startRow + 1;
    if (rowCount < 1) return;

    var blockRange = sheet.getRange(startRow, 1, rowCount, Math.max(sheet.getLastColumn(), 1));
    try { blockRange.breakApart(); } catch (err) { /* No merged cells in block. */ }
    blockRange.clear({ contentsOnly: true });
    blockRange.clearFormat();
  });
}

function finalizePresentationBlocks(anaSs) {
  PRESENTATION_SHEETS.forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (!sheet) return;
    var startRow = findPresentationStartRow(sheet);
    if (startRow < 1) return;

    var endRow = sheet.getLastRow() + 2;
    sheet.getRange(endRow, 1).setValue(PRESENTATION_END_MARKER)
      .setFontColor("#64748B").setFontStyle("italic");
  });
}

function ensurePresentationStartMarker(sheet) {
  if (findPresentationStartRow(sheet) > 0) return;
  var markerRow = sheet.getLastRow() + 2;
  sheet.getRange(markerRow, 1).setValue(PRESENTATION_START_MARKER)
    .setFontWeight("bold").setFontColor("#10B981").setBackground("#0F172A");
}

function findPresentationStartRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return -1;
  var values = sheet.getRange(1, 1, lastRow, 1).getDisplayValues();
  for (var index = 0; index < values.length; index++) {
    if (String(values[index][0] || "").trim() === PRESENTATION_START_MARKER) return index + 1;
  }

  // Migrate the earlier unmarked presentation block, if present, without
  // touching the intelligence/report rows that precede its first title.
  for (var titleIndex = 0; titleIndex < PRESENTATION_SECTION_TITLES.length; titleIndex++) {
    for (var rowIndex = 0; rowIndex < values.length; rowIndex++) {
      if (String(values[rowIndex][0] || "").trim() === PRESENTATION_SECTION_TITLES[titleIndex]) return rowIndex + 1;
    }
  }
  return -1;
}

function findPresentationEndRow(sheet, startRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return -1;
  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 1).getDisplayValues();
  for (var index = 0; index < values.length; index++) {
    if (String(values[index][0] || "").trim() === PRESENTATION_END_MARKER) return startRow + index;
  }
  return -1;
}

function resetPresentationHeatmaps(anaSs) {
  var properties = PropertiesService.getScriptProperties();
  var ownedRanges = readPresentationHeatmapRanges(properties);
  if (!ownedRanges.length) return;

  ["Executive_Summary", "Regional_Analytics", "CTA_and_Funnel", "Session_Intelligence",
    "Traffic_Intelligence", "Timezone_Intelligence", "IP_Intelligence", "Unified_Intelligence"].forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (!sheet) return;
    var rules = sheet.getConditionalFormatRules() || [];
    var retained = rules.filter(function(rule) {
      return !(isPresentationHeatmapRule(rule) && rule.getRanges().some(function(ruleRange) {
        return ownedRanges.indexOf(presentationHeatmapSignature(ruleRange)) !== -1;
      }));
    });
    if (retained.length !== rules.length) sheet.setConditionalFormatRules(retained);
  });
  properties.deleteProperty(PRESENTATION_HEATMAP_PROPERTY);
}

function readPresentationHeatmapRanges(properties) {
  try {
    var value = properties.getProperty(PRESENTATION_HEATMAP_PROPERTY);
    var ranges = value ? JSON.parse(value) : [];
    return Array.isArray(ranges) ? ranges : [];
  } catch (err) {
    return [];
  }
}

function presentationHeatmapSignature(range) {
  return range.getSheet().getName() + "!" + range.getA1Notation();
}

function presentationRuleHasSignature(rule, signature) {
  return rule.getRanges().some(function(range) {
    return presentationHeatmapSignature(range) === signature;
  });
}

function isPresentationHeatmapRule(rule) {
  try {
    var gradient = rule.getGradientCondition();
    if (!gradient) return false;
    return String(gradient.getMinColor() || "").toUpperCase() === "#F8FAFC" &&
      String(gradient.getMaxColor() || "").toUpperCase() === "#10B981";
  } catch (err) {
    return false;
  }
}

function applyPresentationFormatting(anaSs, sessionCount) {
  ["Executive_Summary", "Regional_Analytics", "CTA_and_Funnel", "Infrastructure_and_Energy",
    "AI_Assistant_Telemetry", "Daily_Report", "Weekly_Report", "Monthly_Report"].forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (!sheet) return;
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), Math.max(sheet.getLastColumn(), 1))
      .setFontFamily("Arial").setVerticalAlignment("middle");
  });

  ["Session_Intelligence", "Traffic_Intelligence", "Geo_Intelligence", "Timezone_Intelligence",
    "IP_Intelligence", "Unified_Intelligence"].forEach(function(name) {
    var sheet = anaSs.getSheetByName(name);
    if (!sheet) return;
    sheet.setFrozenRows(4);
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), Math.max(sheet.getLastColumn(), 1))
      .setFontFamily("Arial").setVerticalAlignment("middle");
    addPresentationFilter(sheet);
  });

  var executive = anaSs.getSheetByName("Executive_Summary");
  if (executive) {
    executive.getRange("A5:B12").setFontWeight("bold");
    applyPresentationHeatmap(executive.getRange("B5:B12"));
    executive.getRange("A1:H1").setFontFamily("Arial").setFontSize(16);
  }
  if (sessionCount === 0) Logger.log("Presentation layer refreshed with no valid sessions; unavailable states preserved.");
}

function addPresentationFilter(sheet) {
  try {
    var filter = sheet.getFilter();
    if (filter) filter.remove();
    var presentationStart = findPresentationStartRow(sheet);
    var lastRow = presentationStart > 0 ? presentationStart - 2 : sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var headerRow = 4;
    if (sheet.getName() === "Session_Intelligence") headerRow = 25;
    if (sheet.getName() === "Unified_Intelligence") {
      var values = sheet.getRange(1, 1, Math.max(lastRow, 1), 1).getDisplayValues();
      for (var index = 0; index < values.length; index++) {
        if (values[index][0] === "session_id") {
          headerRow = index + 1;
          break;
        }
      }
    }
    if (lastRow > headerRow && lastColumn > 1) {
      sheet.getRange(headerRow, 1, lastRow - headerRow + 1, lastColumn).createFilter();
    }
  } catch (err) {
    Logger.log("Presentation filter skipped for " + sheet.getName() + ": " + safeErrorMessage(err));
  }
}

function styleIntelligenceSheet(sheet, titleRange) {
  sheet.getRange(titleRange).setFontWeight("bold").setBackground("#0F172A").setFontColor("#10B981");
  sheet.getRange("A4:E4").setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
  sheet.autoResizeColumns(1, 5);
}

function rawSessionId(row) {
  if (!row || !row.length) return "";
  if (row.length >= 16) return String(row[10] || "");
  if (row.length === 13) return String(row[10] || "");
  if (row.length === 12) return String(row[8] || "");
  if (row.length === 6) return String(row[4] || "");
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
  refreshPresentationLayerFromReportingSource(rawSs, source, timezone);
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
  refreshPresentationLayerFromReportingSource(rawSs, source, timezone);
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
  refreshPresentationLayerFromReportingSource(rawSs, source, timezone);
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
      to: REPORT_EMAIL_RECIPIENTS,
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
  addReportMetric(summary.kpis, "Long-Form / Lead Submissions", longLeads);
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
    var sid = rawSessionId(row);
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
  return insertOwnedChartSafely(sheet, chartType, ranges && ranges[0], row, column,
    GREENNEXT_CHART_TITLE_PREFIX + title, options || {});
}

/**
 * Creates the native visualization layer from the same reconstructed session
 * records used by the intelligence tables. Chart_Data is intentionally
 * traceable and contains only aggregated/chart-ready values.
 */
function refreshNativeVisualizationLayer(anaSs, records, auxiliary) {
  auxiliary = auxiliary || {};
  var chartData = getOrCreateSheet(anaSs, "Chart_Data");
  clearCharts(chartData);
  var lastRow = chartData.getLastRow();
  var lastColumn = chartData.getLastColumn();
  if (lastRow > 0 && lastColumn > 0) chartData.getRange(1, 1, lastRow, lastColumn).clearContent().clearFormat();
  var state = { nextRow: 1 };
  var sessions = Array.isArray(records) ? records.filter(function(record) {
    return record && record.session_id;
  }) : [];

  ["📊 GreenNext Dashboard", "Executive_Summary", "Traffic_Intelligence", "Geo_Intelligence", "Session_Intelligence",
    "CTA_and_Funnel", "Unified_Intelligence", "Regional_Analytics", "IP_Intelligence",
    "AI_Assistant_Telemetry", "Infrastructure_and_Energy"].forEach(function(name) {
      var sheet = anaSs.getSheetByName(name);
      if (sheet) clearCharts(sheet);
    });

  addExecutiveNativeCharts(anaSs, state, sessions);
  addTrafficNativeCharts(anaSs, chartData, state, sessions);
  addGeoNativeChart(anaSs, state, sessions);
  addSessionNativeCharts(anaSs, state, sessions);
  addCtaNativeChart(anaSs, state, sessions);
  addUnifiedNativeChart(anaSs, state, sessions);
  addRegionalNativeChart(anaSs, state, sessions, auxiliary);
  addIpNativeChart(anaSs, state, sessions);
  addAiNativeChart(anaSs, state, auxiliary.aiData || []);
  addInfrastructureNativeChart(anaSs, state, auxiliary);
  buildGreenNextDashboard(anaSs, chartData, state, sessions, auxiliary);
  chartData.setFrozenRows(1);
  chartData.getRange(1, 1, Math.max(chartData.getLastRow(), 1), Math.max(chartData.getLastColumn(), 1))
    .setFontFamily("Arial").setWrap(true);
  logNativeChartCounts(anaSs);
}

function logNativeChartCounts(anaSs) {
  ["📊 GreenNext Dashboard", "Executive_Summary", "Traffic_Intelligence", "Geo_Intelligence", "Session_Intelligence",
    "CTA_and_Funnel", "Unified_Intelligence", "Regional_Analytics", "IP_Intelligence",
    "AI_Assistant_Telemetry", "Infrastructure_and_Energy"].forEach(function(name) {
      var sheet = anaSs.getSheetByName(name);
      if (!sheet) return;
      var count = sheet.getCharts().filter(isGreenNextOwnedChart).length;
      Logger.log("GreenNext native chart count | " + name + " | " + count);
    });
}

function nativeNumber(value) {
  var number = Number(value);
  return isFinite(number) ? number : 0;
}

function nativeGroup(records, keyFunction) {
  var groups = {};
  (records || []).forEach(function(record) {
    var key = String(keyFunction(record) || "Unavailable");
    if (!groups[key]) groups[key] = {
      key: key, sessions: 0, engaged: 0, conversions: 0, cta: 0, form: 0,
      suspicious: 0, pages: 0, duration: 0
    };
    var group = groups[key];
    group.sessions++;
    if (record.engaged) group.engaged++;
    if (record.lead_conversion) group.conversions++;
    if (nativeNumber(record.cta_interactions) > 0) group.cta++;
    if (nativeNumber(record.form_interactions) > 0) group.form++;
    if (record.suspicious_traffic) group.suspicious++;
    group.pages += nativeNumber(record.pages_count);
    group.duration += nativeNumber(record.total_session_duration);
  });
  return Object.keys(groups).map(function(key) {
    var group = groups[key];
    group.avgPages = group.sessions ? group.pages / group.sessions : 0;
    group.avgDuration = group.sessions ? group.duration / group.sessions : 0;
    return group;
  }).sort(function(left, right) {
    return right.sessions - left.sessions || left.key.localeCompare(right.key);
  });
}

function writeNativeChartData(sheet, state, blockName, rows) {
  if (!rows || rows.length < 2) return null;
  var width = rows.reduce(function(maximum, row) { return Math.max(maximum, row.length); }, 1);
  var normalized = padRows(rows, width);
  var titleRow = state.nextRow;
  sheet.getRange(titleRow, 1).setValue(blockName);
  sheet.getRange(titleRow, 1, 1, width).setFontWeight("bold").setBackground("#D1FAE5");
  var dataRow = titleRow + 1;
  sheet.getRange(dataRow, 1, normalized.length, width).setValues(normalized);
  state.nextRow = dataRow + normalized.length + 2;
  return sheet.getRange(dataRow, 1, normalized.length, width);
}

function buildGreenNextDashboard(anaSs, chartData, state, records, auxiliary) {
  var dashboard = getOrCreateSheet(anaSs, "📊 GreenNext Dashboard");
  clearCharts(dashboard);
  var dashboardLastRow = dashboard.getLastRow();
  var dashboardLastColumn = dashboard.getLastColumn();
  if (dashboardLastRow > 0 && dashboardLastColumn > 0) {
    dashboard.getRange(1, 1, Math.max(dashboardLastRow, 120), Math.max(dashboardLastColumn, 26))
      .clearContent().clearFormat();
  }

  var kpis = buildPresentationKpis(records);
  dashboard.getRange("A1:P1").mergeAcross().setValue("GREENNEXT").setFontSize(18)
    .setFontWeight("bold").setFontColor("#10B981").setBackground("#0F172A");
  dashboard.getRange("A2:P2").mergeAcross().setValue("DIGITAL PRESENCE INTELLIGENCE")
    .setFontSize(14).setFontWeight("bold").setFontColor("#F8FAFC").setBackground("#0F172A");
  dashboard.getRange("A3:P3").mergeAcross().setValue(
    "Reporting period: current collected telemetry  |  Last updated: " + reportRefreshTimestamp(REPORT_TIMEZONE_FALLBACK) + " IST"
  ).setFontColor("#CBD5E1").setBackground("#1E293B");

  var cards = [
    ["TOTAL SESSIONS", kpis.sessions], ["ENGAGED SESSIONS", kpis.engaged],
    ["LEADS / CONVERSIONS", kpis.leads], ["CONVERSION RATE", kpis.conversionRate],
    ["RETURNING VISITORS", kpis.returning], ["AVG SESSION DURATION", kpis.avgDuration],
    ["CTA INTERACTIONS", kpis.ctaInteractions], ["SUSPICIOUS ACTIVITY", kpis.suspicious]
  ];
  cards.forEach(function(card, index) {
    var column = 1 + index * 2;
    dashboard.getRange(5, column, 1, 2).mergeAcross().setValue(card[0])
      .setFontWeight("bold").setFontColor("#CBD5E1").setBackground("#1E293B");
    dashboard.getRange(6, column, 2, 2).mergeAcross().setValue(card[1])
      .setFontSize(16).setFontWeight("bold").setFontColor("#10B981")
      .setBackground("#F8FAFC").setHorizontalAlignment("center").setVerticalAlignment("middle");
  });

  var traffic = nativeGroup(records, function(record) { return record.traffic_source; });
  var trafficRows = [["Traffic Source", "Sessions", "Engaged Sessions", "Conversions", "Conversion Rate"]];
  traffic.forEach(function(group) {
    trafficRows.push([group.key, group.sessions, group.engaged, group.conversions,
      group.sessions ? group.conversions / group.sessions : 0]);
  });
  var trafficRange = writeNativeChartData(chartData, state, "Dashboard_Traffic_Data", trafficRows);
  if (trafficRows.length >= 3) insertOwnedChartSafely(dashboard, Charts.ChartType.TREEMAP, trafficRange, 12, 1,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Traffic Composition", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 27, 1, "01 — TRAFFIC INTELLIGENCE", trafficRows, 5, "0.0%");

  var journeyRows = [["Session Depth", "Sessions"]];
  buildPresentationDistributionRows(records).forEach(function(row) { journeyRows.push([row[0], row[1]]); });
  var journeyChartRows = [["Pages per Session"]];
  records.forEach(function(record) {
    var pageCount = nativeNumber(record.pages_count);
    if (pageCount >= 0) journeyChartRows.push([pageCount]);
  });
  var journeyRange = writeNativeChartData(chartData, state, "Dashboard_Journey_Data", journeyChartRows);
  if (journeyChartRows.length >= 3) insertOwnedChartSafely(dashboard, Charts.ChartType.HISTOGRAM, journeyRange, 12, 9,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Visitor Journey Depth", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 27, 9, "02 — VISITOR JOURNEY", journeyRows, 2);

  var regionalRows = buildDashboardRegionalRows(records, auxiliary);
  var regionalRange = writeNativeChartData(chartData, state, "Dashboard_Regional_Data", regionalRows);
  var populatedRegionalRows = regionalRows.slice(1).filter(function(row) {
    return row.slice(1).some(function(value) { return nativeNumber(value) > 0; });
  });
  if (populatedRegionalRows.length >= 2) insertOwnedChartSafely(dashboard, Charts.ChartType.RADAR, regionalRange, 40, 1,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Regional Demand Signals", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 55, 1, "03 — REGIONAL INTELLIGENCE", regionalRows, 4);
  if (populatedRegionalRows.length < 2) {
    dashboard.getRange("A61:F61").mergeAcross()
      .setValue("Regional visualization unavailable — insufficient trusted regional activity data")
      .setFontColor("#64748B").setFontStyle("italic");
  } else if (!hasTrustedCountryData(records)) {
    dashboard.getRange("A61:F61").mergeAcross()
      .setValue("Geo visualization unavailable — insufficient trusted country data")
      .setFontColor("#64748B").setFontStyle("italic");
  }

  var behaviorGroups = nativeGroup(records, function(record) {
    return record.engagement_segment || unifiedEngagementSegment(record);
  });
  var behaviorRows = [["Behavior Segment", "Avg Duration (seconds)", "Avg Pages", "Sessions"]];
  behaviorGroups.forEach(function(group) {
    behaviorRows.push([group.key, group.avgDuration / 1000, group.avgPages, group.sessions]);
  });
  var behaviorRange = writeNativeChartData(chartData, state, "Dashboard_Behavior_Data", behaviorRows);
  if (behaviorRows.length >= 3) insertOwnedChartSafely(dashboard, Charts.ChartType.BUBBLE, behaviorRange, 40, 9,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Behavior Segments", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 55, 9, "04 — BEHAVIOR INTELLIGENCE", behaviorRows, 4);

  var timeRows = buildDayHourMatrix(records);
  dashboard.getRange(68, 1, 1, 25).mergeAcross().setValue("05 — TIME INTELLIGENCE | DAY × LOCAL HOUR HEATMAP")
    .setFontWeight("bold").setFontColor("#10B981").setBackground("#0F172A");
  dashboard.getRange(69, 1, 1, 25).mergeAcross().setValue("Darker emerald cells indicate greater observed session density; values remain exact.")
    .setFontColor("#475569");
  dashboard.getRange(70, 1, timeRows.length, 25).setValues(padRows(timeRows, 25));
  dashboard.getRange(70, 1, 1, 25).setFontWeight("bold").setFontColor("#F8FAFC").setBackground("#1E293B");
  applyPresentationHeatmap(dashboard.getRange(71, 2, Math.max(timeRows.length - 1, 1), 24));

  var total = records.length;
  var engaged = records.filter(function(record) { return record.engaged; }).length;
  var cta = records.filter(function(record) { return nativeNumber(record.cta_interactions) > 0; }).length;
  var form = records.filter(function(record) { return nativeNumber(record.form_interactions) > 0; }).length;
  var converted = records.filter(function(record) { return record.lead_conversion; }).length;
  var conversionRows = [["Stage", "Change"], ["Visitors", total], ["Engagement drop", -(total - engaged)],
    ["CTA drop", -(engaged - cta)], ["Inquiry drop", -(cta - form)], ["Conversion drop", -(form - converted)]];
  var conversionRange = writeNativeChartData(chartData, state, "Dashboard_Conversion_Data", conversionRows);
  if (total > 0) insertOwnedChartSafely(dashboard, Charts.ChartType.WATERFALL, conversionRange, 82, 9,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Conversion Progression", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 97, 9, "06 — CONVERSION INTELLIGENCE", conversionRows, 2);

  var networkGroups = nativeGroup(records, function(record) {
    return [record.network_type, record.isp, record.asn].filter(Boolean).join(" / ");
  }).filter(function(group) { return group.key !== "Unavailable"; });
  var networkRows = [["Network Group", "Sessions", "Suspicious Sessions", "Engaged Sessions"]];
  networkGroups.forEach(function(group) { networkRows.push([group.key, group.sessions, group.suspicious, group.engaged]); });
  var networkRange = writeNativeChartData(chartData, state, "Dashboard_Network_Data", networkRows);
  if (networkRows.length >= 3) insertOwnedChartSafely(dashboard, Charts.ChartType.BUBBLE, networkRange, 110, 1,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | Network Attention", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 125, 1, "07 — NETWORK / SECURITY INTELLIGENCE", networkRows, 4);

  var aiGroups = {};
  (auxiliary.aiData || []).forEach(function(row) {
    var topic = String(row[2] || "Unspecified");
    aiGroups[topic] = (aiGroups[topic] || 0) + 1;
  });
  var aiRows = [["AI Topic", "Interactions"]];
  Object.keys(aiGroups).forEach(function(topic) { aiRows.push([topic, aiGroups[topic]]); });
  var aiChartRows = [["Name", "Parent", "Interactions"], ["AI Assistant", "", (auxiliary.aiData || []).length]];
  Object.keys(aiGroups).forEach(function(topic) { aiChartRows.push([topic, "AI Assistant", aiGroups[topic]]); });
  var aiRange = writeNativeChartData(chartData, state, "Dashboard_AI_Data", aiChartRows);
  if (aiChartRows.length >= 4) insertOwnedChartSafely(dashboard, Charts.ChartType.TREEMAP, aiRange, 110, 9,
    GREENNEXT_CHART_TITLE_PREFIX + "Dashboard | AI Topic Intelligence", { width: 600, height: 250 });
  writeDashboardTable(dashboard, 125, 9, "08 — AI / CONTENT INTELLIGENCE", aiRows, 2);

  dashboard.getRange("Z1").setValue("GREENNEXT_DASHBOARD_START").setFontColor("#FFFFFF");
  dashboard.getRange("Z140").setValue("GREENNEXT_DASHBOARD_END").setFontColor("#FFFFFF");
  dashboard.setFrozenRows(7);
  dashboard.setColumnWidths(1, 25, 92);
  dashboard.getRange("A1:Y140").setFontFamily("Arial").setWrap(true).setVerticalAlignment("middle");
  dashboard.getRange("A1:P3").setHorizontalAlignment("left");
  try {
    anaSs.setActiveSheet(dashboard);
    anaSs.moveActiveSheet(1);
  } catch (err) {
    Logger.log("Dashboard tab ordering skipped: " + safeErrorMessage(err));
  }
}

function writeDashboardTable(sheet, row, column, title, rows, width, percentColumnFormat) {
  var normalized = padRows(rows, width);
  sheet.getRange(row, column, 1, width).mergeAcross().setValue(title)
    .setFontWeight("bold").setFontColor("#10B981").setBackground("#0F172A");
  sheet.getRange(row + 1, column, normalized.length, width).setValues(normalized)
    .setBorder(true, true, true, true, true, true, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(row + 1, column, 1, width).setFontWeight("bold").setFontColor("#F8FAFC").setBackground("#1E293B");
  if (percentColumnFormat) sheet.getRange(row + 2, column + width - 1, Math.max(normalized.length - 1, 1), 1).setNumberFormat("0.0%");
}

function buildDashboardRegionalRows(records, auxiliary) {
  var rows = [["Region", "Regional Activity", "Corridor Inspections", "Inquiries"]];
  ["Madurai", "Coimbatore", "Trichy", "Mangalore"].forEach(function(name) {
    var term = name.toLowerCase();
    var activity = (auxiliary.regData || []).filter(function(row) {
      return String(row[2] || "").toLowerCase().indexOf(term) !== -1;
    }).length;
    var corridors = (auxiliary.locData || []).filter(function(row) {
      return String(row[2] || "").toLowerCase().indexOf(term) !== -1;
    }).length;
    var inquiries = (auxiliary.longLeads || []).filter(function(row) {
      return String(row[7] || "").toLowerCase().indexOf(term) !== -1;
    }).length + (auxiliary.dedicatedLeads || []).filter(function(row) {
      return String(row[6] || "").toLowerCase().indexOf(term) !== -1;
    }).length;
    rows.push([name, activity, corridors, inquiries]);
  });
  return rows;
}

function hasTrustedCountryData(records) {
  var countries = {};
  (records || []).forEach(function(record) {
    var country = String(record.geo_country || "").trim();
    if (country && country.toLowerCase() !== "unavailable" && country.toLowerCase() !== "geo unavailable") {
      countries[country] = true;
    }
  });
  return Object.keys(countries).length >= 2;
}

function addExecutiveNativeCharts(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("Executive_Summary");
  if (!sheet || !records.length) return;
  var converted = records.filter(function(record) { return record.lead_conversion; }).length;
  var rate = records.length ? converted / records.length * 100 : 0;
  var range = writeNativeChartData(anaSs.getSheetByName("Chart_Data"), state, "Executive_Gauge_Data", [
    ["KPI", "Value"], ["Lead conversion rate", rate]
  ]);
  insertOwnedChartSafely(sheet, Charts.ChartType.GAUGE, range, 2, 10,
    GREENNEXT_CHART_TITLE_PREFIX + "Executive | Lead Conversion Rate", {
      min: 0, max: 100, greenFrom: 0, greenTo: 100, width: 420, height: 260
    });
}

function addTrafficNativeCharts(anaSs, chartData, state, records) {
  var sheet = anaSs.getSheetByName("Traffic_Intelligence");
  if (!sheet || !records.length) return;
  var hierarchy = [["Name", "Parent", "Sessions"]];
  var traffic = nativeGroup(records, function(record) { return record.traffic_source || "Unavailable"; });
  var leafCount = 0;
  hierarchy.push(["Traffic", "", records.length]);
  traffic.forEach(function(category) {
    if (category.key === "Unavailable") return;
    hierarchy.push([category.key, "Traffic", category.sessions]);
    var sources = nativeGroup(records.filter(function(record) {
      return (record.traffic_source || "Unavailable") === category.key;
    }), function(record) { return record.utm_source || ""; }).filter(function(group) { return group.key; });
    sources.forEach(function(source) {
      var sourceName = category.key + " / " + source.key;
      hierarchy.push([sourceName, category.key, source.sessions]);
      leafCount++;
      var campaigns = nativeGroup(records.filter(function(record) {
        return (record.traffic_source || "Unavailable") === category.key &&
          (record.utm_source || "") === source.key;
      }), function(record) { return record.utm_campaign || ""; }).filter(function(group) { return group.key; });
      campaigns.forEach(function(campaign) {
        hierarchy.push([sourceName + " / " + campaign.key, sourceName, campaign.sessions]);
        leafCount++;
      });
    });
  });
  var range = leafCount >= 2 ? writeNativeChartData(chartData, state, "Traffic_Treemap_Data", hierarchy) : null;
  if (range) {
    insertOwnedChartSafely(sheet, Charts.ChartType.TREEMAP, range, 2, 8,
      GREENNEXT_CHART_TITLE_PREFIX + "Traffic | Session Hierarchy", { width: 620, height: 340 });
    return;
  }
  var bubbleRows = [["Traffic Source", "Sessions", "Conversion Rate", "Engaged Sessions"]];
  traffic.filter(function(group) { return group.key !== "Unavailable"; }).forEach(function(group) {
    bubbleRows.push([group.key, group.sessions,
      group.sessions ? group.conversions / group.sessions * 100 : 0, group.engaged]);
  });
  range = writeNativeChartData(chartData, state, "Traffic_Bubble_Data", bubbleRows);
  if (range && bubbleRows.length >= 3) {
    insertOwnedChartSafely(sheet, Charts.ChartType.BUBBLE, range, 2, 8,
      GREENNEXT_CHART_TITLE_PREFIX + "Traffic | Sessions vs Conversion", { width: 620, height: 340 });
  }
}

function addGeoNativeChart(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("Geo_Intelligence");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var geo = nativeGroup(records, function(record) { return record.geo_country; }).filter(function(group) {
    return group.key && group.key !== "Unavailable" && group.key.toLowerCase() !== "geo unavailable";
  });
  if (geo.length < 2) {
    Logger.log("Geo chart skipped: trusted country data is missing or too sparse.");
    return;
  }
  var rows = [["Country", "Sessions"]];
  geo.forEach(function(group) { rows.push([group.key, group.sessions]); });
  var range = writeNativeChartData(chartData, state, "Geo_Data", rows);
  insertOwnedChartSafely(sheet, Charts.ChartType.GEO, range, 2, 8,
    GREENNEXT_CHART_TITLE_PREFIX + "Geo | Trusted Country Sessions", { width: 620, height: 340 });
}

function addSessionNativeCharts(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("Session_Intelligence");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var durations = [["Session Duration (seconds)"]];
  var pages = [["Pages per Session"]];
  records.forEach(function(record) {
    var duration = nativeNumber(record.total_session_duration);
    var pageCount = nativeNumber(record.pages_count);
    if (duration > 0) durations.push([duration / 1000]);
    if (pageCount >= 0) pages.push([pageCount]);
  });
  var durationRange = durations.length >= 3 ? writeNativeChartData(chartData, state, "Session_Duration_Histogram_Data", durations) : null;
  var pagesRange = pages.length >= 3 ? writeNativeChartData(chartData, state, "Session_Pages_Histogram_Data", pages) : null;
  if (durationRange) insertOwnedChartSafely(sheet, Charts.ChartType.HISTOGRAM, durationRange, 2, 4,
    GREENNEXT_CHART_TITLE_PREFIX + "Sessions | Duration Distribution", { width: 500, height: 280 });
  if (pagesRange) insertOwnedChartSafely(sheet, Charts.ChartType.HISTOGRAM, pagesRange, 2, 16,
    GREENNEXT_CHART_TITLE_PREFIX + "Sessions | Pages Distribution", { width: 500, height: 280 });
}

function addCtaNativeChart(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("CTA_and_Funnel");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet || !records.length) return;
  var total = records.length;
  var engaged = records.filter(function(record) { return record.engaged; }).length;
  var cta = records.filter(function(record) { return nativeNumber(record.cta_interactions) > 0; }).length;
  var form = records.filter(function(record) { return nativeNumber(record.form_interactions) > 0; }).length;
  var converted = records.filter(function(record) { return record.lead_conversion; }).length;
  var rows = [["Funnel Stage", "Change"], ["Total sessions", total],
    ["Engagement drop", -(total - engaged)], ["CTA drop", -(engaged - cta)],
    ["Form drop", -(cta - form)], ["Conversion drop", -(form - converted)]];
  var range = writeNativeChartData(chartData, state, "Funnel_Waterfall_Data", rows);
  insertOwnedChartSafely(sheet, Charts.ChartType.WATERFALL, range, 2, 6,
    GREENNEXT_CHART_TITLE_PREFIX + "Funnel | Sequential Drop-off", { width: 620, height: 340 });
}

function addUnifiedNativeChart(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("Unified_Intelligence");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var groups = nativeGroup(records, function(record) {
    return record.engagement_segment || unifiedEngagementSegment(record);
  });
  var rows = [["Engagement Segment", "Avg Duration (seconds)", "Avg Pages", "Sessions"]];
  groups.forEach(function(group) {
    rows.push([group.key, group.avgDuration / 1000, group.avgPages, group.sessions]);
  });
  var range = rows.length >= 3 ? writeNativeChartData(chartData, state, "Unified_Bubble_Data", rows) : null;
  if (range) insertOwnedChartSafely(sheet, Charts.ChartType.BUBBLE, range, 2, 4,
    GREENNEXT_CHART_TITLE_PREFIX + "Unified | Engagement Segments", { width: 620, height: 340 });
}

function addRegionalNativeChart(anaSs, state, records, auxiliary) {
  var sheet = anaSs.getSheetByName("Regional_Analytics");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var names = ["Madurai", "Coimbatore", "Trichy", "Mangalore"];
  var rows = [["Region", "Page Views", "Corridor Inspections", "Inquiries"]];
  names.forEach(function(name) {
    var terms = name.toLowerCase();
    var views = (auxiliary.regData || []).filter(function(row) { return String(row[2] || "").toLowerCase().indexOf(terms) !== -1; }).length;
    var corridors = (auxiliary.locData || []).filter(function(row) { return String(row[2] || "").toLowerCase().indexOf(terms) !== -1; }).length;
    var inquiries = (records || []).filter(function(record) {
      return String(record.geo_region || "").toLowerCase().indexOf(terms) !== -1 ||
        String(record.geo_city || "").toLowerCase().indexOf(terms) !== -1;
    }).filter(function(record) { return record.lead_conversion; }).length;
    rows.push([name, views, corridors, inquiries]);
  });
  var populatedRegions = rows.slice(1).filter(function(row) {
    return row.slice(1).some(function(value) { return nativeNumber(value) > 0; });
  }).length;
  if (populatedRegions < 2) {
    Logger.log("Regional radar skipped: regional data is too sparse.");
    return;
  }
  var range = writeNativeChartData(chartData, state, "Regional_Radar_Data", rows);
  insertOwnedChartSafely(sheet, Charts.ChartType.RADAR, range, 2, 8,
    GREENNEXT_CHART_TITLE_PREFIX + "Regional | Comparable Demand Signals", { width: 620, height: 340 });
}

function addIpNativeChart(anaSs, state, records) {
  var sheet = anaSs.getSheetByName("IP_Intelligence");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var groups = nativeGroup(records, function(record) {
    return [record.network_type, record.isp, record.asn].filter(Boolean).join(" / ");
  }).filter(function(group) { return group.key !== "Unavailable"; });
  var rows = [["Network Group", "Sessions", "Suspicious Sessions", "Engaged Sessions"]];
  groups.forEach(function(group) { rows.push([group.key, group.sessions, group.suspicious, group.engaged]); });
  var range = rows.length >= 3 ? writeNativeChartData(chartData, state, "Network_Bubble_Data", rows) : null;
  if (range) insertOwnedChartSafely(sheet, Charts.ChartType.BUBBLE, range, 2, 8,
    GREENNEXT_CHART_TITLE_PREFIX + "Network | Activity vs Suspicion", { width: 620, height: 340 });
}

function addAiNativeChart(anaSs, state, aiData) {
  var sheet = anaSs.getSheetByName("AI_Assistant_Telemetry");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet || !aiData.length) return;
  var groups = {};
  aiData.forEach(function(row) {
    var topic = String(row[2] || "Unspecified");
    groups[topic] = (groups[topic] || 0) + 1;
  });
  var rows = [["Name", "Parent", "Interactions"], ["AI Assistant", "", aiData.length]];
  Object.keys(groups).forEach(function(topic) { rows.push([topic, "AI Assistant", groups[topic]]); });
  var range = rows.length >= 4 ? writeNativeChartData(chartData, state, "AI_Topic_Treemap_Data", rows) : null;
  if (range) insertOwnedChartSafely(sheet, Charts.ChartType.TREEMAP, range, 2, 5,
    GREENNEXT_CHART_TITLE_PREFIX + "AI Assistant | Topic Volume", { width: 620, height: 340 });
}

function addInfrastructureNativeChart(anaSs, state, auxiliary) {
  var sheet = anaSs.getSheetByName("Infrastructure_and_Energy");
  var chartData = anaSs.getSheetByName("Chart_Data");
  if (!sheet) return;
  var rows = [["Name", "Parent", "Views"], ["Technical engagement", "", 0]];
  [["Infrastructure", auxiliary.infData || []], ["Energy", auxiliary.eneData || []],
    ["Automation", auxiliary.autData || []]].forEach(function(item) {
      var counts = countValues(item[1], 2);
      Object.keys(counts).forEach(function(key) {
        rows.push([item[0] + " / " + key, item[0], counts[key]]);
      });
    });
  rows[1][2] = rows.slice(2).reduce(function(total, row) { return total + nativeNumber(row[2]); }, 0);
  var range = rows.length >= 4 ? writeNativeChartData(chartData, state, "Technical_Engagement_Treemap_Data", rows) : null;
  if (range) insertOwnedChartSafely(sheet, Charts.ChartType.TREEMAP, range, 2, 4,
    GREENNEXT_CHART_TITLE_PREFIX + "Technical Engagement | Capability Volume", { width: 620, height: 340 });
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
