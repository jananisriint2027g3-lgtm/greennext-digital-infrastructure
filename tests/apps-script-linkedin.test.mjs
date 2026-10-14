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
