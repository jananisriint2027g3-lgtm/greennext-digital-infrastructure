import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const codeGsSource = fs.readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");

function createMockSheet(name, initialHeaders = []) {
  const rows = [];
  if (initialHeaders.length > 0) {
    rows.push([...initialHeaders]);
  }
  const charts = [];
  return {
    _name: name,
    _rows: rows,
    _charts: charts,
    getName: () => name,
    getLastRow: () => rows.length,
    getLastColumn: () => (rows.length > 0 ? rows[0].length : 0),
    getMaxRows: () => rows.length + 50,
    getDataRange: () => ({
      getDisplayValues: () => rows.map(r => r.map(c => String(c != null ? c : ""))),
      getValues: () => rows.map(r => [...r]),
    }),
    appendRow: (row) => {
      rows.push([...row]);
      return rows.length;
    },
    clear: function() {
      rows.length = 0;
    },
    clearContents: function() {
      rows.length = 0;
    },
    clearFormat: function() {},
    getCharts: () => [...charts],
    newChart: () => {
      const chartBuilder = {
        asColumnChart: () => chartBuilder,
        asBarChart: () => chartBuilder,
        asPieChart: () => chartBuilder,
        asLineChart: () => chartBuilder,
        asAreaChart: () => chartBuilder,
        addRange: () => chartBuilder,
        setChartType: () => chartBuilder,
        setPosition: () => chartBuilder,
        setOption: () => chartBuilder,
        setOptionArray: () => chartBuilder,
        setTitle: () => chartBuilder,
        build: () => {
          const chartObj = {
            getOptions: () => ({ get: (opt) => "Mock Chart" }),
            getAs: (mime) => ({
              getName: () => "mock_chart.png",
              getBytes: () => [1, 2, 3],
              setContentType: () => {},
              setName: (n) => ({ getName: () => n, getBytes: () => [1, 2, 3] })
            }),
          };
          return chartObj;
        }
      };
      return chartBuilder;
    },
    insertChart: (chart) => {
      charts.push(chart);
    },
    removeChart: (chart) => {
      const idx = charts.indexOf(chart);
      if (idx !== -1) charts.splice(idx, 1);
    },
    getRange: (startRow, startCol = 1, numRows = 1, numCols = 1) => {
      let rStart = Number(startRow) || 1;
      let cStart = Number(startCol) || 1;
      let rNum = Number(numRows) || 1;
      let cNum = Number(numCols) || 1;
      if (typeof startRow === "string") {
        const match = startRow.match(/([A-Za-z]+)(\d+)(?::([A-Za-z]+)(\d+))?/);
        if (match) {
          const colLettersToNum = (letters) => {
            let n = 0;
            for (let i = 0; i < letters.length; i++) {
              n = n * 26 + (letters.charCodeAt(i) - 64);
            }
            return n;
          };
          cStart = colLettersToNum(match[1].toUpperCase());
          rStart = parseInt(match[2], 10);
          if (match[3] && match[4]) {
            const cEnd = colLettersToNum(match[3].toUpperCase());
            const rEnd = parseInt(match[4], 10);
            rNum = rEnd - rStart + 1;
            cNum = cEnd - cStart + 1;
          } else {
            rNum = 1;
            cNum = 1;
          }
        }
      }
      return {
        getValues: () => {
          const slice = [];
          for (let r = 0; r < rNum; r++) {
            const rowIndex = rStart - 1 + r;
            const rowData = rows[rowIndex] || [];
            const cols = [];
            for (let c = 0; c < cNum; c++) {
              const colIndex = cStart - 1 + c;
              cols.push(rowData[colIndex] !== undefined ? rowData[colIndex] : "");
            }
            slice.push(cols);
          }
          return slice;
        },
        getDisplayValues: () => {
          const slice = [];
          for (let r = 0; r < rNum; r++) {
            const rowIndex = rStart - 1 + r;
            const rowData = rows[rowIndex] || [];
            const cols = [];
            for (let c = 0; c < cNum; c++) {
              const colIndex = cStart - 1 + c;
              cols.push(String(rowData[colIndex] !== undefined && rowData[colIndex] !== null ? rowData[colIndex] : ""));
            }
            slice.push(cols);
          }
          return slice;
        },
        setValues: function(values) {
          for (let r = 0; r < values.length; r++) {
            const targetRowIndex = rStart - 1 + r;
            while (rows.length <= targetRowIndex) {
              rows.push([]);
            }
            for (let c = 0; c < values[r].length; c++) {
              const targetColIndex = cStart - 1 + c;
              rows[targetRowIndex][targetColIndex] = values[r][c];
            }
          }
          return this;
        },
        setValue: function(v) {
          while (rows.length < rStart) rows.push([]);
          rows[rStart - 1][cStart - 1] = v;
          return this;
        },
        mergeAcross: function() { return this; },
        setFontWeight: function() { return this; },
        setFontSize: function() { return this; },
        setBackground: function() { return this; },
        setFontColor: function() { return this; },
        setFontFamily: function() { return this; },
        setFontStyle: function() { return this; },
        setHorizontalAlignment: function() { return this; },
        setVerticalAlignment: function() { return this; },
        setBorder: function() { return this; },
        setNumberFormat: function() { return this; },
        setWrap: function() { return this; },
        setWrapStrategy: function() { return this; },
        createFilter: function() { return {}; },
        clearContent: function() { return this; },
        clearFormat: function() { return this; },
        applyRowBanding: function() { return this; },
        getBandings: function() { return []; },
      };
    },
    setFrozenRows: () => {},
    setColumnWidths: () => {},
    setColumnWidth: () => {},
    setRowHeights: () => {},
    setRowHeight: () => {},
    autoResizeColumns: () => {},
    autoResizeRows: () => {},
    getFilter: () => null,
  };
}

function createMockSpreadsheet(id, name) {
  const sheets = new Map();
  return {
    _id: id,
    _name: name,
    getId: () => id,
    getName: () => name,
    getSpreadsheetTimeZone: () => "Asia/Kolkata",
    getSheetByName: (sName) => sheets.get(sName) || null,
    insertSheet: (sName) => {
      const sheet = createMockSheet(sName);
      sheets.set(sName, sheet);
      return sheet;
    },
    setActiveSheet: () => {},
    moveActiveSheet: () => {},
    toast: () => {},
  };
}

function createAppsScriptReportingContext() {
  const spreadsheetsRegistry = new Map();

  const getOrCreateMockSs = (id) => {
    if (!spreadsheetsRegistry.has(id)) {
      spreadsheetsRegistry.set(id, createMockSpreadsheet(id, "Spreadsheet_" + id));
    }
    return spreadsheetsRegistry.get(id);
  };

  const sentEmails = [];

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
    parseInt,
    parseFloat,
    isFinite,
    isNaN,
    encodeURIComponent,
    Utilities: {
      formatDate: (date, tz, format) => {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return "";
        // Asia/Kolkata is UTC+05:30
        const isKolkata = String(tz).indexOf("Kolkata") !== -1;
        const offsetMs = isKolkata ? (5.5 * 3600 * 1000) : 0;
        const adjusted = new Date(d.getTime() + offsetMs);
        const y = adjusted.getUTCFullYear();
        const m = String(adjusted.getUTCMonth() + 1).padStart(2, "0");
        const day = String(adjusted.getUTCDate()).padStart(2, "0");
        const h = String(adjusted.getUTCHours()).padStart(2, "0");
        const min = String(adjusted.getUTCMinutes()).padStart(2, "0");
        const s = String(adjusted.getUTCSeconds()).padStart(2, "0");
        if (format === "yyyy-MM-dd") return `${y}-${m}-${day}`;
        if (format === "yyyy-MM-dd HH:mm:ss") return `${y}-${m}-${day} ${h}:${min}:${s}`;
        return `${y}-${m}-${day}`;
      },
      base64Encode: (s) => Buffer.from(s).toString("base64"),
      base64Decode: (s) => Buffer.from(s, "base64"),
      computeHmacSha256Signature: () => "sig",
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
      openById: (id) => getOrCreateMockSs(id),
      getActiveSpreadsheet: () => null,
      BorderStyle: { SOLID: "SOLID" },
      BandingTheme: { LIGHT_GREY: "LIGHT_GREY" },
      WrapStrategy: { CLIP: "CLIP" },
      getUi: () => ({
        createMenu: () => ({
          addItem: function() { return this; },
          addSeparator: function() { return this; },
          addToUi: function() { return this; },
        }),
        alert: () => {},
      }),
    },
    Charts: {
      ChartType: {
        COLUMN: "COLUMN",
        BAR: "BAR",
        LINE: "LINE",
        PIE: "PIE",
        AREA: "AREA",
        WATERFALL: "WATERFALL",
        HISTOGRAM: "HISTOGRAM",
        TREEMAP: "TREEMAP",
        BUBBLE: "BUBBLE",
        RADAR: "RADAR",
        GAUGE: "GAUGE",
        GEO: "GEO"
      }
    },
    MailApp: {
      sendEmail: (opts) => {
        sentEmails.push(opts);
      }
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({}),
        getProperty: () => null
      })
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      newTrigger: () => ({
        timeBased: function() { return this; },
        everyDays: function() { return this; },
        onWeekDay: function() { return this; },
        onMonthDay: function() { return this; },
        atHour: function() { return this; },
        create: function() { return {}; }
      })
    },
    Logger: {
      log: () => {},
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(codeGsSource, sandbox);
  return { sandbox, getOrCreateMockSs, sentEmails };
}

test("Accuracy: rawSessionId correctly reads Session ID (index 8) for 11-column Quick_Inquiries", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const rawSessionId = sandbox.rawSessionId;
  const rawSessionKind = sandbox.rawSessionKind;

  // Schema for Quick_Inquiries:
  // [Timestamp, Event, Name, Email, Phone, Interest, Message, Page, Session ID, Session Kind, Request ID]
  const quickRow = [
    "2026-10-15 10:00:00",
    "quick_inquiry_submit",
    "John Doe",
    "john@example.com",
    "+919876543210",
    "Madurai Data Center",
    "Need edge deployment info",
    "/regions/madurai",
    "session_quick_verified_123",
    "new_session",
    "req_uuid_99999"
  ];
  assert.equal(quickRow.length, 11, "Quick inquiry row must have exactly 11 columns");
  assert.equal(rawSessionId(quickRow), "session_quick_verified_123", "Must extract Session ID (index 8), not Request ID");
  assert.equal(rawSessionKind(quickRow), "new_session", "Must extract Session Kind (index 9)");
});

test("Accuracy: rawSessionId and rawSessionKind extract correct indices across all sheet schemas", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const rawSessionId = sandbox.rawSessionId;
  const rawSessionKind = sandbox.rawSessionKind;

  // Contact_Submissions (13 cols): [Timestamp, Event, Name, Email, Phone, Org, Category, Region, Message, Page, Session ID, Session Kind, Request ID]
  const contactRow = [
    "2026-10-15 10:00:00", "long_form_inquiry_submit", "Alice", "alice@example.com", "123",
    "Acme", "Infrastructure", "Coimbatore", "Inquiry", "/contact",
    "session_contact_456", "returning_session", "req_uuid_888"
  ];
  assert.equal(contactRow.length, 13);
  assert.equal(rawSessionId(contactRow), "session_contact_456");
  assert.equal(rawSessionKind(contactRow), "returning_session");

  // Lead_Submissions (17 cols): index 10 is Session ID, index 11 is Session Kind
  const leadRow = new Array(17).fill("");
  leadRow[10] = "session_lead_789";
  leadRow[11] = "new_session";
  leadRow[16] = "req_uuid_777";
  assert.equal(rawSessionId(leadRow), "session_lead_789");
  assert.equal(rawSessionKind(leadRow), "new_session");

  // Behavioral row (6 cols): index 4 is Session ID, index 5 is Session Kind
  const behavRow = ["2026-10-15 10:00:00", "nav_page_view", "/overview", "/regions", "session_behav_101", "returning_session"];
  assert.equal(behavRow.length, 6);
  assert.equal(rawSessionId(behavRow), "session_behav_101");
  assert.equal(rawSessionKind(behavRow), "returning_session");
});

test("Accuracy: New vs Returning vs Unknown session classification reconciles exactly to total unique sessions", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const buildAdvancedWebsiteIntelligenceModel = sandbox.buildAdvancedWebsiteIntelligenceModel;

  const mockSource = {
    Navigation: [
      ["2026-10-15 10:00:00", "nav_page_view", "/", "/regions", "sess_new_1", "new_session"],
      ["2026-10-15 10:05:00", "nav_page_view", "/", "/energy", "sess_returning_1", "returning_session"],
      ["2026-10-15 10:10:00", "nav_page_view", "/", "/solutions", "sess_unknown_1", ""],
      ["2026-10-15 10:15:00", "nav_page_view", "/", "/solutions", "sess_unknown_2", "unspecified"]
    ],
    Regions: [],
    Infrastructure: [],
    Energy: [],
    Automation: [],
    Solutions: [],
    Industries: [],
    Locations: [],
    "AI Assistant": [],
    "CTA Interactions": [],
    Quick_Inquiries: [],
    Contact_Submissions: [],
    Lead_Submissions: []
  };

  const model = buildAdvancedWebsiteIntelligenceModel(mockSource, "Asia/Kolkata");
  assert.equal(model.summary.newSessions, 1, "Expected 1 verified new session");
  assert.equal(model.summary.returningSessions, 1, "Expected 1 verified returning session");
  assert.equal(model.summary.unknownSessions, 2, "Expected 2 unclassified/unknown sessions");
  assert.equal(
    model.summary.newSessions + model.summary.returningSessions + model.summary.unknownSessions,
    model.sessionIds.length,
    "New + Returning + Unknown must equal total unique sessions"
  );
});

test("Accuracy: Standardized Page Views uses Navigation nav_page_view as canonical definition", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const calculateReportMetrics = sandbox.calculateReportMetrics;

  const period = { start: "2026-10-15", end: "2026-10-16" };
  const mockSource = {
    Navigation: [
      ["2026-10-15 08:00:00", "nav_page_view", "/", "/regions", "sess_1", "new_session"],
      ["2026-10-15 08:30:00", "nav_page_view", "/", "/energy", "sess_2", "returning_session"],
      ["2026-10-15 09:00:00", "nav_page_view", "/", "/contact", "sess_3", "new_session"]
    ],
    Regions: [],
    Infrastructure: [],
    Energy: [],
    Automation: [],
    Solutions: [],
    Industries: [],
    Locations: [],
    "AI Assistant": [],
    "CTA Interactions": [
      // CTA has its own page_view event with different count
      ["2026-10-15 08:00:00", "page_view", "Hero CTA", "/overview", "sess_1", "new_session"]
    ],
    Quick_Inquiries: [],
    Contact_Submissions: [],
    Lead_Submissions: []
  };

  const metrics = calculateReportMetrics(mockSource, "Asia/Kolkata", period);
  assert.equal(metrics.pageViews, 3, "Canonical pageViews must be exactly 3 from Navigation nav_page_view");
  assert.equal(metrics.ctaPageViews, 1, "ctaPageViews retained as diagnostic metric");
});

test("Accuracy: Funnel enforces genuine subset membership across distinct session sets (S4 ⊆ S3 ⊆ S2 ⊆ S1)", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const renderCtaAndFunnel = sandbox.renderCtaAndFunnel;
  const mockSs = sandbox.SpreadsheetApp.openById(sandbox.ANALYTICS_SPREADSHEET_ID);

  // Behavioral CTA events with known session IDs
  const ctaData = [
    ["2026-10-15 10:00:00", "cta_click", "Explore Edge", "/infrastructure", "sess_1"],
    ["2026-10-15 10:02:00", "cta_click", "Calculator", "/energy", "sess_2"],
    ["2026-10-15 10:03:00", "quick_inquiry_open", "Open Quick Modal", "/", "sess_3"],
    ["2026-10-15 10:04:00", "form_start", "Start Form", "/contact", "sess_4"]
  ];

  // Stage 1 has 6 verified visitor sessions
  const allSessions = {
    sess_1: true,
    sess_2: true,
    sess_3: true,
    sess_4: true,
    sess_5: true,
    sess_6: true
  };

  // Lead submissions: sess_3 and sess_4 are linked to visitor sessions;
  // unlinked_sess_999 is NOT in allSessions (e.g. unlinked or untracked submission)
  const leadSessionIds = {
    sess_3: true,
    sess_4: true,
    unlinked_sess_999: true
  };

  const res = renderCtaAndFunnel(mockSs, ctaData, 6, 1, 2, 1, {
    allSessionIds: allSessions,
    leadSessionIds: leadSessionIds,
    intentSessionIds: { sess_3: true, sess_4: true },
    engagedSessionIds: { sess_1: true, sess_2: true, sess_3: true, sess_4: true }
  });

  // Verify genuine mathematical subset membership
  assert.ok(res, "renderCtaAndFunnel must return stage sets object");
  const s4Ids = Object.keys(res.s4);
  const s3Ids = Object.keys(res.s3);
  const s2Ids = Object.keys(res.s2);
  const s1Ids = Object.keys(res.s1);

  // S4 ⊆ S3
  s4Ids.forEach(id => {
    assert.ok(res.s3[id], `Session ${id} in Stage 4 must be a genuine member of Stage 3`);
  });
  // S3 ⊆ S2
  s3Ids.forEach(id => {
    assert.ok(res.s2[id], `Session ${id} in Stage 3 must be a genuine member of Stage 2`);
  });
  // S2 ⊆ S1
  s2Ids.forEach(id => {
    assert.ok(res.s1[id], `Session ${id} in Stage 2 must be a genuine member of Stage 1`);
  });

  // Unlinked lead was NOT fabricated into S1 or S4
  assert.equal(res.unlinkedLeads, 1, "Unlinked submission without visitor session must be reported as unattributed");
  assert.equal(res.s4.unlinked_sess_999, undefined, "Unlinked session must not be fabricated into S4");

  const sheet = mockSs.getSheetByName("CTA_and_Funnel");
  assert.ok(sheet, "CTA_and_Funnel sheet created");
  const values = sheet.getDataRange().getDisplayValues();

  // Find funnel stage rows
  const stageRows = values.filter(r => /^\d\./.test(String(r[0])));
  assert.equal(stageRows.length, 4, "Must have 4 funnel stages");

  const counts = stageRows.map(r => Number(r[1]));
  // Strict descending counts from subset property: S1 >= S2 >= S3 >= S4
  assert.ok(counts[0] >= counts[1], `Stage 1 (${counts[0]}) must be >= Stage 2 (${counts[1]})`);
  assert.ok(counts[1] >= counts[2], `Stage 2 (${counts[1]}) must be >= Stage 3 (${counts[2]})`);
  assert.ok(counts[2] >= counts[3], `Stage 3 (${counts[2]}) must be >= Stage 4 (${counts[3]})`);

  // Ensure stage conversion rates are <= 100%
  stageRows.forEach((r, idx) => {
    const ratePct = parseFloat(String(r[2]).replace("%", ""));
    assert.ok(ratePct <= 100.0, `Stage ${idx + 1} rate (${ratePct}%) must not exceed 100%`);
  });

  // Check that unattributed row is documented in table
  assert.ok(values.some(r => r[0] === "Unattributed / Unlinked Leads" && Number(r[1]) === 1),
    "Unattributed leads must be explicitly reported in table");
});

test("Accuracy: Regional attribution uses explicit recorded location only and routes Quick_Inquiries to Other / Unknown", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const renderRegionalAnalytics = sandbox.renderRegionalAnalytics;
  const mockSs = sandbox.SpreadsheetApp.openById(sandbox.ANALYTICS_SPREADSHEET_ID);

  const regData = [
    ["2026-10-15 10:00:00", "region_view", "Madurai Node", "/regions/madurai", "s1"]
  ];
  const locData = [
    ["2026-10-15 10:00:00", "corridor_inspect", "Coimbatore Corridor", "/locations", "s2"]
  ];
  // Explicit Region in Contact_Submissions (col 7): "Tiruchirappalli" -> maps to Trichy
  const longLeads = [
    ["2026-10-15 10:00:00", "long_form_submit", "Alice", "a@test.com", "123", "Acme", "Technical", "Tiruchirappalli", "Msg", "/contact", "s3", "new_session", "req1"]
  ];
  // Explicit Region in Lead_Submissions (col 6): "Mangaluru" -> maps to Mangalore
  const dedicatedLeads = [
    ["2026-10-15 10:00:00", "Technical", "Bob", "b@test.com", "456", "Beta", "Mangaluru", "Cat", "Msg", "/page", "s4", "new_session", "No", "", "", "", "req2"]
  ];
  // Quick_Inquiries has NO explicit region field. Even if interest says "Madurai" or page says "/regions/coimbatore",
  // it must NOT guess location from interest, message, or page URL, and must strictly route to Other / Unknown!
  const quickLeads = [
    ["2026-10-15 10:00:00", "quick_submit", "Charlie", "c@test.com", "789", "Madurai Edge", "Interested", "/overview", "s5", "new_session", "req3"],
    ["2026-10-15 10:00:00", "quick_submit", "Diana", "d@test.com", "012", "General", "Hello", "/regions/coimbatore", "s6", "new_session", "req4"],
    ["2026-10-15 10:00:00", "quick_submit", "Evan", "e@test.com", "345", "General", "General question", "/", "s7", "new_session", "req5"]
  ];

  renderRegionalAnalytics(mockSs, regData, locData, quickLeads, longLeads, dedicatedLeads);

  const sheet = mockSs.getSheetByName("Regional_Analytics");
  const values = sheet.getDataRange().getDisplayValues();

  // Find data rows (Madurai, Coimbatore, Trichy, Mangalore, Other / Unknown)
  const regionNames = ["Madurai", "Coimbatore", "Trichy", "Mangalore", "Other / Unknown"];
  let totalInquiriesInTable = 0;

  regionNames.forEach(name => {
    const row = values.find(r => r[0] === name);
    assert.ok(row, `Row for ${name} must be present`);
    totalInquiriesInTable += Number(row[4]);
  });

  const totalRawInquiries = longLeads.length + dedicatedLeads.length + quickLeads.length;
  assert.equal(totalInquiriesInTable, totalRawInquiries, "All inquiries must reconcile without loss or duplication");

  // Trichy has 1 inquiry from longLeads (explicit "Tiruchirappalli")
  const trichyRow = values.find(r => r[0] === "Trichy");
  assert.equal(Number(trichyRow[4]), 1, "Trichy must have 1 inquiry from explicit recorded region in longLeads");

  // Mangalore has 1 inquiry from dedicatedLeads (explicit "Mangaluru")
  const mangaloreRow = values.find(r => r[0] === "Mangalore");
  assert.equal(Number(mangaloreRow[4]), 1, "Mangalore must have 1 inquiry from explicit recorded region in dedicatedLeads");

  // Madurai must have 0 inquiries (since no explicit long/dedicated lead was Madurai, and Quick_Inquiries is not guessed)
  const maduraiRow = values.find(r => r[0] === "Madurai");
  assert.equal(Number(maduraiRow[4]), 0, "Madurai must have 0 inquiries because location is not guessed from quick inquiry text or page");

  // Other / Unknown must capture all 3 quick inquiries
  const otherRow = values.find(r => r[0] === "Other / Unknown");
  assert.equal(Number(otherRow[4]), 3, "Other / Unknown must capture all 3 quick inquiries that lack an explicit region field");
});

test("Accuracy: Weekly and Monthly reports contain standardized lead-type breakdown", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const buildWeeklyReport = sandbox.buildWeeklyReport;
  const buildMonthlyReport = sandbox.buildMonthlyReport;
  const mockSs = sandbox.SpreadsheetApp.openById(sandbox.ANALYTICS_SPREADSHEET_ID);

  const mockSource = {
    Navigation: [],
    Regions: [],
    Infrastructure: [],
    Energy: [],
    Automation: [],
    Solutions: [],
    Industries: [],
    Locations: [],
    "AI Assistant": [],
    "CTA Interactions": [],
    Quick_Inquiries: [
      ["2026-10-15 10:00:00", "quick_submit", "User1", "u1@test.com", "111", "General", "Msg", "/", "s1", "new_session", "req1"]
    ],
    Contact_Submissions: [
      ["2026-10-15 10:00:00", "long_submit", "User2", "u2@test.com", "222", "Org", "Infra", "MDU", "Msg", "/", "s2", "new_session", "req2"]
    ],
    Lead_Submissions: [
      ["2026-10-15 10:00:00", "Partner / Collaboration Inquiry", "User3", "u3@test.com", "333", "Org", "MDU", "Topic", "Msg", "/", "s3", "new_session", "No", "", "", "", "req3"]
    ]
  };

  buildWeeklyReport(mockSource, "Asia/Kolkata", {
    start: "2026-10-12",
    end: "2026-10-19",
    previousStart: "2026-10-05",
    previousEnd: "2026-10-12"
  });

  const weeklySheet = mockSs.getSheetByName("Weekly_Report");
  const weeklyValues = weeklySheet.getDataRange().getDisplayValues();
  assert.ok(weeklyValues.some(r => r[0] === "Quick Inquiry Leads" && Number(r[1]) === 1), "Weekly Report must include Quick Inquiry Leads");
  assert.ok(weeklyValues.some(r => r[0] === "Long-Form Leads" && Number(r[1]) === 1), "Weekly Report must include Long-Form Leads");
  assert.ok(weeklyValues.some(r => r[0] === "Other Lead Submissions"), "Weekly Report must include Other Lead Submissions");

  buildMonthlyReport(mockSource, "Asia/Kolkata", {
    start: "2026-10-01",
    end: "2026-11-01",
    previousStart: "2026-09-01",
    previousEnd: "2026-10-01"
  });

  const monthlySheet = mockSs.getSheetByName("Monthly_Report");
  const monthlyValues = monthlySheet.getDataRange().getDisplayValues();
  assert.ok(monthlyValues.some(r => r[0] === "Quick Inquiry Leads" && Number(r[1]) === 1), "Monthly Report must include Quick Inquiry Leads");
  assert.ok(monthlyValues.some(r => r[0] === "Long-Form Leads" && Number(r[1]) === 1), "Monthly Report must include Long-Form Leads");
  assert.ok(monthlyValues.some(r => r[0] === "Other Lead Submissions"), "Monthly Report must include Other Lead Submissions");
});

test("Accuracy: Daily report defaults to previous completed calendar day with manual current-day option", () => {
  const { sandbox } = createAppsScriptReportingContext();
  const runDailyReport = sandbox.runDailyReport;
  const runDailyReportCurrentDay = sandbox.runDailyReportCurrentDay;
  const mockSs = sandbox.SpreadsheetApp.openById(sandbox.ANALYTICS_SPREADSHEET_ID);

  // Run scheduled daily report (defaults to previous completed calendar day)
  runDailyReport();
  const sheet = mockSs.getSheetByName("Daily_Report");
  const values = sheet.getDataRange().getDisplayValues();
  const dateRow = values.find(r => r[0] === "Report Date:");
  assert.ok(dateRow, "Report Date header exists");

  const todayStr = sandbox.formatReportDate(new Date(), "Asia/Kolkata");
  const yesterdayStr = sandbox.addReportDays(todayStr, -1);
  assert.equal(dateRow[1], yesterdayStr, "Scheduled Daily Report must cover yesterday (previous completed calendar day)");

  // Run on-demand current-day report
  runDailyReportCurrentDay();
  const valuesCurrent = sheet.getDataRange().getDisplayValues();
  const dateRowCurrent = valuesCurrent.find(r => r[0] === "Report Date:");
  assert.equal(dateRowCurrent[1], todayStr, "Manual current-day Daily Report must cover today");
});

test("Visuals & Privacy: Email report embeds chart images via CID and redacts PII", () => {
  const { sandbox, sentEmails } = createAppsScriptReportingContext();
  const sendReportEmail = sandbox.sendReportEmail;
  const sanitizeEmailReportValues = sandbox.sanitizeEmailReportValues;
  const mockSs = sandbox.SpreadsheetApp.openById(sandbox.ANALYTICS_SPREADSHEET_ID);

  // Test PII sanitizer
  const testTable = [
    ["User Name", "Contact Email", "Phone", "Client IP"],
    ["John Doe", "john.doe@company.com", "+91 98765 43210", "192.168.1.100"]
  ];
  const sanitized = sanitizeEmailReportValues(testTable);
  assert.equal(sanitized[1][1], "[REDACTED_EMAIL]");
  assert.equal(sanitized[1][2], "[REDACTED_PHONE]");
  assert.equal(sanitized[1][3], "[REDACTED_IP]");

  // Test email sending with embedded chart
  const reportSheet = mockSs.insertSheet("Test_Report");
  reportSheet.appendRow(["GREENNEXT — TEST REPORT"]);
  reportSheet.appendRow(["Report Date:", "2026-10-15"]);
  reportSheet.appendRow(["Total Page Views", "100"]);
  reportSheet.appendRow(["Unique Sessions", "40"]);

  // Add a mock chart to the sheet
  const chart = reportSheet.newChart().build();
  reportSheet.insertChart(chart);

  sendReportEmail("Test_Report", "Daily Report", "GreenNext Daily", () => {});

  assert.equal(sentEmails.length, 1, "One email should be sent");
  const sent = sentEmails[0];
  assert.ok(sent.htmlBody.includes("cid:report_chart_0"), "HTML body must contain cid: reference for embedded chart");
  assert.ok(sent.inlineImages && sent.inlineImages.report_chart_0, "inlineImages object must attach chart blob");
  assert.ok(!sent.htmlBody.includes("john.doe@company.com"), "PII must not appear in report email");
});
