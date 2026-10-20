import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Load Code.gs into a sandboxed VM context with necessary Google Apps Script mocks
const codeGsSource = fs.readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");

function createAppsScriptContext() {
  const sandbox = {
    console,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    Utilities: {
      formatDate: (date, tz, format) => {
        return new Date(date).toISOString().replace("T", " ").substring(0, 19);
      },
      base64Decode: (str) => Buffer.from(str || "", "base64"),
      newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        waitLock: () => true,
        releaseLock: () => {},
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: () => null,
        put: () => {},
      }),
    },
    SpreadsheetApp: {
      openById: (id) => ({ id }),
    },
    MailApp: {
      sendEmail: () => {},
    },
    ContentService: {
      createTextOutput: (content) => {
        const text = String(content);
        return {
          setMimeType: () => ({
            getContent: () => text,
            getContentText: () => text,
          }),
          getContent: () => text,
          getContentText: () => text,
        };
      },
      MimeType: { JSON: "application/json" },
    },
    Logger: {
      log: () => {},
    },
  };
  vm.createContext(sandbox);
  // Execute Code.gs within the sandbox
  vm.runInContext(codeGsSource, sandbox);
  return sandbox;
}

test("Apps Script: isLinkedInHost accurately identifies LinkedIn domains and subdomains", () => {
  const ctx = createAppsScriptContext();
  assert.equal(ctx.isLinkedInHost("linkedin.com"), true);
  assert.equal(ctx.isLinkedInHost("www.linkedin.com"), true);
  assert.equal(ctx.isLinkedInHost("l.linkedin.com"), true); // Link Shim
  assert.equal(ctx.isLinkedInHost("touch.linkedin.com"), true); // Mobile
  assert.equal(ctx.isLinkedInHost("in.linkedin.com"), true); // Country subdomains
  assert.equal(ctx.isLinkedInHost("lnkd.in"), true); // URL shortener
  assert.equal(ctx.isLinkedInHost("www.lnkd.in"), true);
});

test("Apps Script: isLinkedInHost rejects lookalikes and phishing domains", () => {
  const ctx = createAppsScriptContext();
  assert.equal(ctx.isLinkedInHost("linkedin-phishing.com"), false);
  assert.equal(ctx.isLinkedInHost("notlinkedin.com"), false);
  assert.equal(ctx.isLinkedInHost("fake-lnkd.in"), false);
  assert.equal(ctx.isLinkedInHost("attackerlnkd.in"), false);
  assert.equal(ctx.isLinkedInHost("google.com"), false);
  assert.equal(ctx.isLinkedInHost(""), false);
});

test("Apps Script: isSocialHost integrates LinkedIn and rejects deceptive domains", () => {
  const ctx = createAppsScriptContext();
  assert.equal(ctx.isSocialHost("linkedin.com"), true);
  assert.equal(ctx.isSocialHost("l.linkedin.com"), true);
  assert.equal(ctx.isSocialHost("lnkd.in"), true);
  assert.equal(ctx.isSocialHost("facebook.com"), true);
  assert.equal(ctx.isSocialHost("instagram.com"), true);
  assert.equal(ctx.isSocialHost("x.com"), true);
  assert.equal(ctx.isSocialHost("linkedin-fake.com"), false);
  assert.equal(ctx.isSocialHost("partner-site.com"), false);
});

test("Apps Script: normalizeTrafficContext classifies LinkedIn referrers and UTM sources as social", () => {
  const ctx = createAppsScriptContext();
  
  // LinkedIn organic post click
  const c1 = ctx.normalizeTrafficContext({ referrerUrl: "https://www.linkedin.com/" });
  assert.equal(c1.traffic_source, "social");

  // LinkedIn link shim redirect
  const c2 = ctx.normalizeTrafficContext({ referrerUrl: "https://l.linkedin.com/feed" });
  assert.equal(c2.traffic_source, "social");

  // LinkedIn short link
  const c3 = ctx.normalizeTrafficContext({ referrerUrl: "https://lnkd.in/abc1234" });
  assert.equal(c3.traffic_source, "social");

  // UTM Source = linkedin without medium
  const c4 = ctx.normalizeTrafficContext({ utmSource: "linkedin" });
  assert.equal(c4.traffic_source, "social");

  // LinkedIn Paid ad (paid medium takes precedence over organic social)
  const c5 = ctx.normalizeTrafficContext({ utmSource: "linkedin", utmMedium: "cpc" });
  assert.equal(c5.traffic_source, "paid");

  // Phishing/lookalike domain remains referral
  const c6 = ctx.normalizeTrafficContext({ referrerUrl: "https://linkedin-phishing.com/abc" });
  assert.equal(c6.traffic_source, "referral");
});

test("Apps Script: buildSessionContextMap coalescing preserves first-touch attribution without empty value overwrites", () => {
  const ctx = createAppsScriptContext();

  const rows = [
    // Row 1: Session arrival from LinkedIn campaign
    [
      "gn_s_apps_test", "new_session", "2026-10-14 11:40:05", "social",
      "https://www.linkedin.com/", "/solutions", "linkedin", "social", "q4_ai_launch", "compute", "hero_banner",
      "Asia/Kolkata", "330", "11", "Wednesday", "IN", "Tamil Nadu", "Chennai", "server_derived",
      "broadband", "Example ISP", "Example Org", "AS64500", "client_context", "0.95", "geo_provider",
      "0.9", "network_provider", "203.0.113.1"
    ],
    // Row 2: Subsequent event in same session with blank UTM and direct referrer
    [
      "gn_s_apps_test", "new_session", "2026-10-14 11:42:15", "direct",
      "", "/infrastructure", "", "", "", "", "",
      "Asia/Kolkata", "330", "11", "Wednesday", "", "", "", "unavailable",
      "unavailable", "", "", "", "client_context", "", "not_configured",
      "", "not_configured", ""
    ]
  ];

  const contextMap = ctx.buildSessionContextMap(rows);
  const session = contextMap["gn_s_apps_test"];

  assert.equal(session.traffic_source, "social");
  assert.equal(session.referrer_url, "https://www.linkedin.com/");
  assert.equal(session.landing_page, "/solutions");
  assert.equal(session.utm_source, "linkedin");
  assert.equal(session.utm_campaign, "q4_ai_launch");
  assert.equal(session.geo_country, "IN");
  assert.equal(session.geo_city, "Chennai");
  assert.equal(session.client_ip, "203.0.113.1");
});

test("Apps Script: recordLinkedInRawEventIfApplicable writes to LinkedIn_Raw_Data with correct fields and deduplicates", () => {
  const ctx = createAppsScriptContext();

  const appendedRows = [];
  const mockSheet = {
    getLastRow: () => appendedRows.length + 1,
    getLastColumn: () => 18,
    setFrozenRows: () => {},
    getRange: (row, col, numRows, numCols) => ({
      getValues: () => appendedRows.slice(Math.max(0, appendedRows.length - (numRows || 1))),
      setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
      setValues: () => {},
    }),
    appendRow: (row) => {
      appendedRows.push(row);
    },
  };

  const mockRawSs = {
    id: "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY",
    getSheetByName: (name) => (name === "LinkedIn_Raw_Data" ? mockSheet : null),
    insertSheet: (name) => mockSheet,
  };

  // Test 1: Record initial pageview for LinkedIn session
  const payload1 = {
    sessionId: "gn_s_linkedin_1",
    sessionKind: "new_session",
    referrerUrl: "https://www.linkedin.com/",
    landingPage: "/solutions",
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "launch_2026",
    event: "page_view",
    page: "/solutions",
    value: "Solutions Overview",
  };
  const trafficCtx1 = ctx.normalizeTrafficContext(payload1);
  ctx.recordLinkedInRawEventIfApplicable(mockRawSs, payload1, "2026-10-14 11:40:05", trafficCtx1);

  assert.equal(appendedRows.length, 1);
  assert.equal(appendedRows[0][1], "gn_s_linkedin_1"); // Session ID
  assert.equal(appendedRows[0][3], "social"); // Traffic Source
  assert.equal(appendedRows[0][4], "https://www.linkedin.com/"); // Referrer URL
  assert.equal(appendedRows[0][11], "page_view"); // Event Name
  assert.equal(appendedRows[0][16], "NONE"); // Tech session status
  assert.equal(appendedRows[0][17], "NONE"); // Booking status

  // Test 2: Duplicate pageview submission within sliding window is ignored
  ctx.recordLinkedInRawEventIfApplicable(mockRawSs, payload1, "2026-10-14 11:40:06", trafficCtx1);
  assert.equal(appendedRows.length, 1); // Deduplicated!

  // Test 3: Technical session consultation inquiry
  const payload2 = {
    sessionId: "gn_s_linkedin_1",
    sessionKind: "new_session",
    referrerUrl: "https://www.linkedin.com/",
    landingPage: "/solutions",
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "launch_2026",
    formType: "lead_inquiry",
    leadType: "Technical Consultation / Session Booking",
    requestId: "gn_req_hash_123",
    page: "/contact",
  };
  ctx.recordLinkedInRawEventIfApplicable(mockRawSs, payload2, "2026-10-14 11:45:00", trafficCtx1);

  assert.equal(appendedRows.length, 2);
  const inquiryRow = appendedRows[1];
  assert.equal(inquiryRow[11], "lead_inquiry");
  assert.equal(inquiryRow[14], "Technical Consultation / Session Booking");
  assert.equal(inquiryRow[15], "gn_req_hash_123");
  assert.equal(inquiryRow[16], "REQUESTED");
  assert.equal(inquiryRow[17], "PENDING_CONFIRMATION");

  // Test 4: Duplicate inquiry retry is deduplicated by requestId
  ctx.recordLinkedInRawEventIfApplicable(mockRawSs, payload2, "2026-10-14 11:45:02", trafficCtx1);
  assert.equal(appendedRows.length, 2); // Deduplicated!
});

test("Apps Script: renderLinkedInAnalytics correctly aggregates metrics and maintains distinct booking status", () => {
  const ctx = createAppsScriptContext();

  let renderedRows = [];
  const mockAnalyticsSheet = {
    clear: () => { renderedRows = []; },
    getRange: () => ({
      setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
      setValues: (values) => { renderedRows = values; },
    }),
    autoResizeColumns: () => {},
  };

  const mockAnaSs = {
    id: "1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18",
    getSheetByName: (name) => (name === "LinkedIn_Analytics" ? mockAnalyticsSheet : null),
    insertSheet: (name) => mockAnalyticsSheet,
  };

  const records = [
    // Session 1: LinkedIn session with consultation request
    {
      session_id: "s_li_1",
      traffic_source: "social",
      referrer_url: "https://www.linkedin.com/",
      landing_page: "/solutions",
      utm_source: "linkedin",
      utm_medium: "social",
      utm_campaign: "ai_infrastructure",
      session_start_time: "2026-10-14T11:40:05.000Z",
      engaged: true,
      bounce: false,
      lead_conversion: true,
      total_session_duration: 120000,
    },
    // Session 2: LinkedIn session without inquiry (bounced)
    {
      session_id: "s_li_2",
      traffic_source: "social",
      referrer_url: "https://lnkd.in/shortlink",
      landing_page: "/",
      utm_source: "lnkd.in",
      utm_medium: "",
      utm_campaign: "",
      session_start_time: "2026-10-14T12:00:00.000Z",
      engaged: false,
      bounce: true,
      lead_conversion: false,
      total_session_duration: 5000,
    },
    // Session 3: Google organic session (must NOT be counted in LinkedIn analytics)
    {
      session_id: "s_google_3",
      traffic_source: "organic",
      referrer_url: "https://www.google.com/",
      landing_page: "/",
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: "",
      session_start_time: "2026-10-14T12:05:00.000Z",
      engaged: true,
      bounce: false,
      lead_conversion: true,
      total_session_duration: 60000,
    }
  ];

  const model = {
    sessions: {
      s_li_1: {
        leads: [
          {
            type: "Technical Consultation / Session Booking",
            status: "EMAIL_SENT", // Requested, not yet confirmed via calendar
            requestId: "req_li_1",
          }
        ]
      },
      s_li_2: {
        leads: []
      },
      s_google_3: {
        leads: [
          {
            type: "General Contact Inquiry",
            status: "EMAIL_SENT",
            requestId: "req_google_3",
          }
        ]
      }
    }
  };

  ctx.renderLinkedInAnalytics(mockAnaSs, records, model);

  // Check metrics rendered
  const metricMap = {};
  renderedRows.forEach((row) => {
    if (row[0] && row[1] !== undefined && row[1] !== "") {
      metricMap[String(row[0]).trim()] = row[1];
    }
  });

  assert.equal(metricMap["Unique LinkedIn Sessions"], 2);
  assert.equal(metricMap["Engaged LinkedIn Sessions"], 1);
  assert.equal(metricMap["Engagement Rate"], "50.00%");
  assert.equal(metricMap["Bounced Sessions"], 1);
  assert.equal(metricMap["Bounce Rate"], "50.00%");
  assert.equal(metricMap["Total Inquiries from LinkedIn"], 1);
  assert.equal(metricMap["Session-to-Inquiry Conversion Rate"], "50.00%");
  assert.equal(metricMap["Technical Session Requests"], 1);
  assert.equal(metricMap["Confirmed Bookings"], 0); // Distinct from request!
  assert.equal(metricMap["Session-to-Technical Session Rate"], "50.00%");

  // Verify that Google inquiry is NOT in LinkedIn analytics
  assert.notEqual(metricMap["Total Inquiries from LinkedIn"], 2);
});

test("Apps Script: isValidLinkedInSource validates legitimate LinkedIn tags and rejects deceptive/lookalike values", () => {
  const ctx = createAppsScriptContext();
  assert.equal(ctx.isValidLinkedInSource("linkedin"), true);
  assert.equal(ctx.isValidLinkedInSource("lnkd.in"), true);
  assert.equal(ctx.isValidLinkedInSource("LinkedIn_Newsletter"), true);
  assert.equal(ctx.isValidLinkedInSource("linkedin-ads"), true);
  assert.equal(ctx.isValidLinkedInSource("linkedin.com"), true);

  // Deceptive
  assert.equal(ctx.isValidLinkedInSource("notlinkedin.com"), false);
  assert.equal(ctx.isValidLinkedInSource("notlinkedin"), false);
  assert.equal(ctx.isValidLinkedInSource("fake-linkedin"), false);
  assert.equal(ctx.isValidLinkedInSource("linkedin-phishing.com"), false);
  assert.equal(ctx.isValidLinkedInSource("google.com"), false);
});

test("Apps Script: isLinkedInTrafficContext strictly rejects lookalike domains and deceptive UTM sources", () => {
  const ctx = createAppsScriptContext();
  assert.equal(ctx.isLinkedInTrafficContext({ utm_source: "linkedin" }, {}), true);
  assert.equal(ctx.isLinkedInTrafficContext({ referrer_url: "https://www.linkedin.com/feed" }, {}), true);
  assert.equal(ctx.isLinkedInTrafficContext({ referrer_url: "https://lnkd.in/post1" }, {}), true);

  // Lookalikes rejected
  assert.equal(ctx.isLinkedInTrafficContext({ utm_source: "notlinkedin.com" }, {}), false);
  assert.equal(ctx.isLinkedInTrafficContext({ utm_source: "fake-linkedin" }, {}), false);
  assert.equal(ctx.isLinkedInTrafficContext({ referrer_url: "https://notlinkedin.com/" }, {}), false);
  assert.equal(ctx.isLinkedInTrafficContext({ referrer_url: "https://linkedin-phishing.com/" }, {}), false);
});

test("Apps Script: processLeadSubmission writes to Lead_Submissions and LinkedIn_Raw_Data only on success, and rejects invalid leads without conversion recording", () => {
  const ctx = createAppsScriptContext();

  const rawSheets = {};
  function getMockSheet(name, headers) {
    if (!rawSheets[name]) {
      const rows = [];
      rawSheets[name] = {
        name,
        getLastRow: () => rows.length,
        getLastColumn: () => headers ? headers.length : (rows[0] ? rows[0].length : 18),
        getRange: (startRow, startCol, numRows, numCols) => ({
          getValues: () => rows.slice(Math.max(0, startRow - 1), startRow - 1 + (numRows || 1)),
          setValue: (val) => {},
          setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
          setValues: () => {},
        }),
        appendRow: (row) => rows.push(row),
        setFrozenRows: () => {},
        _rows: rows,
      };
    }
    return rawSheets[name];
  }

  const mockRawSs = {
    id: "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY",
    getSheetByName: (name) => rawSheets[name] || null,
    insertSheet: (name) => getMockSheet(name),
  };

  // Test 1: Invalid lead type is rejected and DOES NOT write to LinkedIn_Raw_Data
  const invalidPayload = {
    leadType: "Unrecognized / Invalid Type",
    name: "Test Hacker",
    email: "hacker@example.com",
    message: "Test message",
    sessionId: "gn_s_test_inv",
    utmSource: "linkedin",
  };
  const res1 = ctx.processLeadSubmission(invalidPayload, mockRawSs, "2026-10-14 11:40:00", Date.now());
  const res1Obj = JSON.parse(res1.getContentText());
  assert.equal(res1Obj.success, false);
  assert.equal(mockRawSs.getSheetByName("LinkedIn_Raw_Data"), null); // No conversion written!

  // Test 2: Valid Career Inquiry without required resume document is rejected and DOES NOT write to LinkedIn_Raw_Data
  const noResumePayload = {
    leadType: "Career Inquiry",
    name: "Applicant Without Resume",
    email: "applicant@example.com",
    message: "Looking for job",
    sessionId: "gn_s_test_no_doc",
    utmSource: "linkedin",
    document: null,
  };
  const res2 = ctx.processLeadSubmission(noResumePayload, mockRawSs, "2026-10-14 11:41:00", Date.now());
  const res2Obj = JSON.parse(res2.getContentText());
  assert.equal(res2Obj.success, false);
  assert.equal(mockRawSs.getSheetByName("LinkedIn_Raw_Data"), null); // Still no conversion written!

  // Test 3: Successful consultation submission persists to Lead_Submissions and writes conversion to LinkedIn_Raw_Data
  const validConsultationPayload = {
    formType: "lead_inquiry",
    leadType: "Technical Consultation / Session Booking",
    name: "Dr. Jane Doe",
    email: "jane.doe@enterprise.com",
    phone: "+91 98765 00000",
    organization: "Enterprise AI Labs",
    topic: "Hyperscale Thermal Modeling",
    message: "Requesting a dedicated architecture review.",
    sessionId: "gn_s_li_valid_1",
    sessionKind: "new_session",
    requestId: "gn_req_jane_001",
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "oct_launch",
    referrerUrl: "https://www.linkedin.com/",
    landingPage: "/solutions",
    page: "/contact",
  };
  const res3 = ctx.processLeadSubmission(validConsultationPayload, mockRawSs, "2026-10-14 11:42:00", Date.now());
  const res3Obj = JSON.parse(res3.getContentText());
  assert.equal(res3Obj.success, true);

  const leadSheet = mockRawSs.getSheetByName("Lead_Submissions");
  assert.ok(leadSheet);
  assert.equal(leadSheet._rows.length, 2); // 1 header row + 1 lead row
  assert.equal(leadSheet._rows[1][1], "Technical Consultation / Session Booking");
  assert.equal(leadSheet._rows[1][2], "Dr. Jane Doe");
  assert.equal(leadSheet._rows[1][16], "gn_req_jane_001");

  const liRawSheet = mockRawSs.getSheetByName("LinkedIn_Raw_Data");
  assert.ok(liRawSheet);
  assert.equal(liRawSheet._rows.length, 2); // 1 header row + 1 conversion event
  assert.equal(liRawSheet._rows[1][1], "gn_s_li_valid_1");
  assert.equal(liRawSheet._rows[1][11], "lead_inquiry");
  assert.equal(liRawSheet._rows[1][15], "gn_req_jane_001");
  assert.equal(liRawSheet._rows[1][16], "REQUESTED");
  assert.equal(liRawSheet._rows[1][17], "PENDING_CONFIRMATION"); // Distinct from confirmed booking!

  // Test 4: Identical retry with same requestId returns already recorded and does NOT create duplicate rows
  const res4 = ctx.processLeadSubmission(validConsultationPayload, mockRawSs, "2026-10-14 11:42:05", Date.now());
  const res4Obj = JSON.parse(res4.getContentText());
  assert.equal(res4Obj.success, true);
  assert.ok(res4Obj.message.includes("already recorded"));
  assert.equal(leadSheet._rows.length, 2); // No duplicate lead
  assert.equal(liRawSheet._rows.length, 2); // No duplicate conversion
});

test("Apps Script: renderLinkedInAnalytics clears only LinkedIn_Analytics and preserves unrelated tabs", () => {
  const ctx = createAppsScriptContext();

  const clearedSheets = [];
  const mockSheets = {
    "Executive_Summary": { clear: () => clearedSheets.push("Executive_Summary") },
    "Overview": { clear: () => clearedSheets.push("Overview") },
    "CTA Interactions": { clear: () => clearedSheets.push("CTA Interactions") },
    "LinkedIn_Analytics": {
      clear: () => clearedSheets.push("LinkedIn_Analytics"),
      getRange: () => ({
        setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
        setValues: () => {},
      }),
      autoResizeColumns: () => {},
    },
  };

  const mockAnaSs = {
    id: "1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18",
    getSheetByName: (name) => mockSheets[name] || null,
    insertSheet: (name) => mockSheets[name],
  };

  ctx.renderLinkedInAnalytics(mockAnaSs, [], { sessions: {} });

  // Only LinkedIn_Analytics was cleared
  assert.equal(clearedSheets.length, 1);
  assert.equal(clearedSheets[0], "LinkedIn_Analytics");
  assert.equal(clearedSheets.includes("Executive_Summary"), false);
  assert.equal(clearedSheets.includes("Overview"), false);
  assert.equal(clearedSheets.includes("CTA Interactions"), false);
});

test("Apps Script: setupLinkedInRawDataSheet creates LinkedIn_Raw_Data with 18 headers and preserves existing data idempotently", () => {
  const ctx = createAppsScriptContext();

  const sheets = {};
  function createMockSheet(name) {
    const rows = [];
    return {
      name,
      getLastRow: () => rows.length,
      getLastColumn: () => (rows[0] ? rows[0].length : 0),
      getRange: (startRow, startCol, numRows, numCols) => ({
        getValues: () => rows.slice(Math.max(0, startRow - 1), startRow - 1 + (numRows || 1)),
        setValue: () => {},
        setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
        setValues: () => {},
      }),
      appendRow: (row) => rows.push(row),
      setFrozenRows: () => {},
      _rows: rows,
    };
  }

  const mockRawSs = {
    id: "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY",
    getSheetByName: (name) => sheets[name] || null,
    insertSheet: (name) => {
      sheets[name] = createMockSheet(name);
      return sheets[name];
    },
  };

  // Run 1: Tab does not exist yet -> should be created with 18 headers
  const result1 = ctx.setupLinkedInRawDataSheet(mockRawSs);
  assert.equal(result1.success, true);
  assert.equal(result1.sheetName, "LinkedIn_Raw_Data");
  assert.equal(result1.spreadsheetId, "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY");

  const createdSheet = mockRawSs.getSheetByName("LinkedIn_Raw_Data");
  assert.ok(createdSheet);
  assert.equal(createdSheet._rows.length, 1); // 1 header row
  const expectedHeaders = [
    "Timestamp", "Session ID", "Session Kind", "Traffic Source", "Referrer URL",
    "Landing Page", "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content",
    "Event Name", "Event Detail", "Page", "Inquiry Type", "Submission Reference",
    "Technical Session Status", "Booking Status"
  ];
  assert.equal(JSON.stringify(Array.from(createdSheet._rows[0])), JSON.stringify(expectedHeaders));

  // Simulate existing data row added to the tab
  createdSheet.appendRow([
    "2026-10-14 12:00:00", "gn_s_001", "new_session", "social", "https://www.linkedin.com/",
    "/solutions", "linkedin", "social", "launch", "", "", "page_view", "Solutions",
    "/solutions", "", "", "NONE", "NONE"
  ]);
  assert.equal(createdSheet._rows.length, 2);

  // Run 2: Tab already exists -> should NOT clear, overwrite, or duplicate headers
  const result2 = ctx.setupLinkedInRawDataSheet(mockRawSs);
  assert.equal(result2.success, true);
  assert.equal(createdSheet._rows.length, 2); // Still exactly 2 rows (1 header + 1 data row)
  assert.equal(createdSheet._rows[1][1], "gn_s_001"); // Data row remains intact!
});

test("Apps Script: renderLinkedInAnalytics deduplicates 4 event rows from LinkedIn_Raw_Data into 2 unique sessions", () => {
  const ctx = createAppsScriptContext();

  let renderedRows = [];
  const mockAnalyticsSheet = {
    clear: () => { renderedRows = []; },
    getRange: () => ({
      setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
      setValues: (values) => { renderedRows = values; },
    }),
    autoResizeColumns: () => {},
  };

  const mockAnaSs = {
    getSheetByName: (name) => (name === "LinkedIn_Analytics" ? mockAnalyticsSheet : null),
    insertSheet: (name) => mockAnalyticsSheet,
  };

  // The four supplied event rows from GreenNext_Raw_Data.xlsx -> LinkedIn_Raw_Data
  const fourEventRows = [
    ['Timestamp', 'Session ID', 'Session Kind', 'Traffic Source', 'Referrer URL', 'Landing Page', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Event Name', 'Event Detail', 'Page', 'Inquiry Type', 'Submission Reference', 'Technical Session Status', 'Booking Status'],
    ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE']
  ];

  ctx.renderLinkedInAnalytics(mockAnaSs, fourEventRows, null);

  const metricMap = {};
  renderedRows.forEach((row) => {
    if (row[0] && row[1] !== undefined && row[1] !== "") {
      metricMap[String(row[0]).trim()] = row[1];
    }
  });

  // Task 8 / Task 2: Expected result is 2 unique LinkedIn sessions, not 4
  assert.equal(metricMap["Unique LinkedIn Sessions"], 2);

  // Parse section rows
  let campaignSessionsSum = 0;
  let inCampaignSection = false;
  let inDailySection = false;
  let inLandingSection = false;
  let dailySessionsSum = 0;
  const campaignsFound = {};

  renderedRows.forEach((row) => {
    const col0 = String(row[0] || "").trim();
    if (col0.indexOf("CAMPAIGN PERFORMANCE") === 0) {
      inCampaignSection = true;
      inDailySection = false;
      inLandingSection = false;
      return;
    }
    if (col0.indexOf("DAILY & MONTHLY VISITOR ATTRIBUTION") === 0) {
      inCampaignSection = false;
      inDailySection = true;
      inLandingSection = false;
      return;
    }
    if (col0.indexOf("LANDING PAGE") === 0) {
      inCampaignSection = false;
      inDailySection = false;
      inLandingSection = true;
      return;
    }
    if (col0.indexOf("INQUIRY BREAKDOWN") === 0 || col0.indexOf("UTM ATTRIBUTION") === 0) {
      inCampaignSection = false;
      inDailySection = false;
      inLandingSection = false;
      return;
    }

    if (inCampaignSection && row[2] !== undefined && typeof row[2] === "number") {
      campaignSessionsSum += row[2];
      campaignsFound[col0] = row[2];
    }
    if (inDailySection && row[1] !== undefined && typeof row[1] === "number") {
      dailySessionsSum += row[1];
    }
    if (inLandingSection && col0 === "/") {
      // Landing page duration should NOT be fabricated from unrelated events
      // Since timestamps within sessions are identical and no active dwell is present, avg duration is 0
      assert.equal(row[4], 0, "Duration should not be fabricated from unrelated events");
    }
  });

  // Task 8: Verify campaign totals sum to 2
  assert.equal(campaignSessionsSum, 2);
  assert.equal(campaignsFound["company_launch"], 1, "company_launch has exactly 1 session");
  assert.equal(campaignsFound["(none / organic post or profile link)"], 1, "referrer-only has exactly 1 session");

  // Task 8: Verify daily totals also equal 2
  assert.equal(dailySessionsSum, 2);

  // Task 6: Mutually exclusive engagement & bounce
  const engaged = metricMap["Engaged LinkedIn Sessions"];
  const bounced = metricMap["Bounced Sessions"];
  assert.equal(engaged + bounced, 2, "Sessions cannot be counted as both engaged and bounced");

  // Task 7: No invented inquiry submissions or bookings
  assert.equal(metricMap["Total Inquiries from LinkedIn"], 0);
  assert.equal(metricMap["Technical Session Requests"], 0);
  assert.equal(metricMap["Confirmed Bookings"], 0);
});

test("Apps Script: renderLinkedInAnalytics coalesces session intelligence records with LinkedIn_Raw_Data preserving engagement and duration", () => {
  const ctx = createAppsScriptContext();

  let renderedRows = [];
  const mockAnalyticsSheet = {
    clear: () => { renderedRows = []; },
    getRange: () => ({
      setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
      setValues: (values) => { renderedRows = values; },
    }),
    autoResizeColumns: () => {},
  };

  const mockAnaSs = {
    getSheetByName: (name) => (name === "LinkedIn_Analytics" ? mockAnalyticsSheet : null),
    insertSheet: (name) => mockAnalyticsSheet,
  };

  // Session records from buildSessionIntelligenceRecords (as generated from Navigation + CTA Interactions)
  const sessionRecords = [
    {
      session_id: "gn_s_8nnp8p1_mv81pec2",
      traffic_source: "social",
      landing_page: "/",
      utm_source: "linkedin",
      utm_medium: "organic_social",
      utm_campaign: "company_launch",
      session_start_time: "2026-10-14T11:47:38.000Z",
      engaged: true,
      bounce: false,
      total_session_duration: 28000,
    },
    {
      session_id: "gn_s_7cuqd2j_mv81r0vc",
      traffic_source: "social",
      referrer_url: "https://www.linkedin.com/",
      landing_page: "/",
      session_start_time: "2026-10-14T11:48:53.000Z",
      engaged: false,
      bounce: true,
      total_session_duration: 7000,
    }
  ];

  const rawRows = [
    ['Timestamp', 'Session ID', 'Session Kind', 'Traffic Source', 'Referrer URL', 'Landing Page', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Event Name', 'Event Detail', 'Page', 'Inquiry Type', 'Submission Reference', 'Technical Session Status', 'Booking Status'],
    ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
    ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE']
  ];

  ctx.renderLinkedInAnalytics(mockAnaSs, sessionRecords, null, null, rawRows);

  const metricMap = {};
  renderedRows.forEach((row) => {
    if (row[0] && row[1] !== undefined && row[1] !== "") {
      metricMap[String(row[0]).trim()] = row[1];
    }
  });

  // Exactly 2 unique LinkedIn sessions
  assert.equal(metricMap["Unique LinkedIn Sessions"], 2);
  assert.equal(metricMap["Engaged LinkedIn Sessions"], 1);
  assert.equal(metricMap["Bounced Sessions"], 1);
  assert.equal(metricMap["Engagement Rate"], "50.00%");
  assert.equal(metricMap["Bounce Rate"], "50.00%");

  // Check landing page average duration reflects reliable session duration
  // Session 1 (28s) + Session 2 (7s) = 35s / 2 sessions = 17.5s -> 18s
  let landingPageDuration = null;
  let inLandingSection = false;
  renderedRows.forEach((row) => {
    const col0 = String(row[0] || "").trim();
    if (col0.indexOf("LANDING PAGE") === 0) { inLandingSection = true; return; }
    if (col0.indexOf("INQUIRY BREAKDOWN") === 0) { inLandingSection = false; return; }
    if (inLandingSection && col0 === "/") {
      landingPageDuration = row[4];
    }
  });
  assert.equal(landingPageDuration, 18, "Average duration uses reliable session duration, not inter-session gaps");
});

test("Apps Script: refreshLinkedInAnalyticsManual executes end-to-end and renders deduplicated metrics", () => {
  const ctx = createAppsScriptContext();

  const sheets = {};
  function createMockSheet(name, initialRows) {
    const rows = (initialRows || []).slice();
    return {
      name,
      clear: () => { rows.length = 0; },
      getLastRow: () => rows.length,
      getLastColumn: () => (rows[0] ? rows[0].length : 0),
      getRange: (startRow, startCol, numRows, numCols) => ({
        getValues: () => rows.slice(Math.max(0, startRow - 1), startRow - 1 + (numRows || 1)),
        setValue: () => {},
        setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }),
        setValues: (vals) => {
          rows.length = 0;
          vals.forEach(r => rows.push(r));
        },
      }),
      appendRow: (row) => rows.push(row),
      setFrozenRows: () => {},
      autoResizeColumns: () => {},
      _rows: rows,
    };
  }

  // Raw Data spreadsheet with LinkedIn_Raw_Data containing the 4 event rows
  const rawSheets = {
    "LinkedIn_Raw_Data": createMockSheet("LinkedIn_Raw_Data", [
      ['Timestamp', 'Session ID', 'Session Kind', 'Traffic Source', 'Referrer URL', 'Landing Page', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Event Name', 'Event Detail', 'Page', 'Inquiry Type', 'Submission Reference', 'Technical Session Status', 'Booking Status'],
      ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
      ['46309.7205787037', 'gn_s_8nnp8p1_mv81pec2', 'returning_session', 'social', '', '/', 'linkedin', 'organic_social', 'company_launch', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE'],
      ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'nav_page_view', '/', '/', '', '', 'NONE', 'NONE'],
      ['46309.72144675926', 'gn_s_7cuqd2j_mv81r0vc', 'returning_session', 'social', 'https://www.linkedin.com/', '/', '', '', '', '', '', 'page_view', '/', '/', '', '', 'NONE', 'NONE']
    ]),
    "Session_Context": createMockSheet("Session_Context", [
      ["gn_s_8nnp8p1_mv81pec2", "returning_session", "46309.7205787037", "social", "/", "linkedin", "organic_social", "company_launch"],
      ["gn_s_7cuqd2j_mv81r0vc", "returning_session", "46309.72144675926", "social", "https://www.linkedin.com/", "/"]
    ]),
    "Navigation": createMockSheet("Navigation", []),
    "Regions": createMockSheet("Regions", []),
    "Infrastructure": createMockSheet("Infrastructure", []),
    "Energy": createMockSheet("Energy", []),
    "Automation": createMockSheet("Automation", []),
    "Solutions": createMockSheet("Solutions", []),
    "Industries": createMockSheet("Industries", []),
    "Locations": createMockSheet("Locations", []),
    "AI Assistant": createMockSheet("AI Assistant", []),
    "CTA Interactions": createMockSheet("CTA Interactions", []),
    "Quick_Inquiries": createMockSheet("Quick_Inquiries", []),
    "Contact_Submissions": createMockSheet("Contact_Submissions", []),
    "Lead_Submissions": createMockSheet("Lead_Submissions", []),
  };

  const anaSheets = {
    "LinkedIn_Analytics": createMockSheet("LinkedIn_Analytics", []),
  };

  const mockRawSs = {
    id: "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY",
    getId: () => "1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY",
    getSheetByName: (name) => rawSheets[name] || null,
  };

  const mockAnaSs = {
    id: "1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18",
    getId: () => "1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18",
    getSheetByName: (name) => anaSheets[name] || null,
    insertSheet: (name) => {
      anaSheets[name] = createMockSheet(name);
      return anaSheets[name];
    },
  };

  const result = ctx.refreshLinkedInAnalyticsManual(mockRawSs, mockAnaSs);
  assert.equal(result.success, true);
  assert.equal(result.sheetName, "LinkedIn_Analytics");
  assert.equal(result.totalSessions, 2, "Manual refresh deduplicates 4 raw rows into 2 unique sessions");
});



