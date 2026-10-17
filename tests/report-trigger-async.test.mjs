import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const tsSource = fs.readFileSync(new URL("../src/lib/report-trigger.server.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const {
  handleReportCronRequest,
  resolveScheduledReportType,
  isReportCronPath,
  CRON_REPORT_DISPATCH_PATH,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

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
            getOptions: () => ({ get: () => "Mock Chart" }),
            getAs: () => ({
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
  const scriptProperties = new Map();
  const cacheMap = new Map();
  const sentEmails = [];
  const projectTriggers = [];

  const getOrCreateMockSs = (id) => {
    if (!spreadsheetsRegistry.has(id)) {
      spreadsheetsRegistry.set(id, createMockSpreadsheet(id, "Spreadsheet_" + id));
    }
    return spreadsheetsRegistry.get(id);
  };

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
        const offsetMs = 5.5 * 3600 * 1000; // Asia/Kolkata
        const adj = new Date(d.getTime() + offsetMs);
        const y = adj.getUTCFullYear();
        const m = String(adj.getUTCMonth() + 1).padStart(2, "0");
        const day = String(adj.getUTCDate()).padStart(2, "0");
        const h = String(adj.getUTCHours()).padStart(2, "0");
        const min = String(adj.getUTCMinutes()).padStart(2, "0");
        const s = String(adj.getUTCSeconds()).padStart(2, "0");
        if (format === "yyyy-MM-dd") return `${y}-${m}-${day}`;
        if (format === "yyyy-MM-dd HH:mm:ss") return `${y}-${m}-${day} ${h}:${min}:${s}`;
        return `${y}-${m}-${day}`;
      },
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text) => ({
        setMimeType: () => ({
          getContent: () => text,
        }),
        getContent: () => text,
      }),
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
        get: (k) => cacheMap.get(k) || null,
        put: (k, v) => cacheMap.set(k, String(v)),
        remove: (k) => cacheMap.delete(k),
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
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => scriptProperties.get(k) || null,
        setProperty: (k, v) => scriptProperties.set(k, String(v)),
        deleteProperty: (k) => scriptProperties.delete(k),
        getProperties: () => Object.fromEntries(scriptProperties.entries()),
      }),
    },
    ScriptApp: {
      getProjectTriggers: () => [...projectTriggers],
      deleteTrigger: (trig) => {
        const idx = projectTriggers.indexOf(trig);
        if (idx !== -1) projectTriggers.splice(idx, 1);
      },
      newTrigger: (funcName) => {
        const triggerObj = {
          getHandlerFunction: () => funcName,
          getUniqueId: () => "trigger_" + Math.random().toString(36).slice(2),
        };
        const builder = {
          timeBased: () => builder,
          after: () => builder,
          everyDays: () => builder,
          atHour: () => builder,
          onWeekDay: () => builder,
          onMonthDay: () => builder,
          create: () => {
            projectTriggers.push(triggerObj);
            return triggerObj;
          },
        };
        return builder;
      },
    },
    Logger: {
      log: () => {},
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(codeGsSource, sandbox);

  return { sandbox, scriptProperties, cacheMap, sentEmails, projectTriggers, getOrCreateMockSs };
}

// ─── Tests ───

test("Scheduler Routing: Correctly maps dates to daily, weekly, and monthly reports", () => {
  // Day 2 of the month -> monthly
  const monthlyDate = new Date("2026-11-02T02:30:00Z");
  const monthlyRes = resolveScheduledReportType(monthlyDate);
  assert.equal(monthlyRes.frequency, "monthly");

  // Monday (not 2nd) -> weekly
  // 2026-10-19 is a Monday
  const weeklyDate = new Date("2026-10-19T02:30:00Z");
  const weeklyRes = resolveScheduledReportType(weeklyDate);
  assert.equal(weeklyRes.frequency, "weekly");

  // Other days -> daily
  // 2026-10-21 is a Wednesday
  const dailyDate = new Date("2026-10-21T02:30:00Z");
  const dailyRes = resolveScheduledReportType(dailyDate);
  assert.equal(dailyRes.frequency, "daily");
});

test("Apps Script Handler: Enforces shared secret authentication", () => {
  const { sandbox, scriptProperties } = createAppsScriptReportingContext();
  scriptProperties.set("REPORT_TRIGGER_SECRET", "super_secret_test_key");

  // 1. Missing secret
  const res1 = JSON.parse(sandbox.handleReportTriggerAction({ action: "trigger_report", reportType: "daily" }).getContent());
  assert.equal(res1.success, false);
  assert.equal(res1.status, "unauthorized");

  // 2. Invalid secret
  const res2 = JSON.parse(sandbox.handleReportTriggerAction({ action: "trigger_report", reportType: "daily", secret: "wrong_secret" }).getContent());
  assert.equal(res2.success, false);
  assert.equal(res2.status, "unauthorized");

  // 3. Valid secret accepts request
  const res3 = JSON.parse(sandbox.handleReportTriggerAction({ action: "trigger_report", reportType: "daily", secret: "super_secret_test_key" }).getContent());
  assert.equal(res3.success, true);
  assert.equal(res3.status, "accepted");
  assert.equal(res3.delivered, false);
});

test("Apps Script Asynchronous Handoff: Enqueues job and creates one-off trigger without timeout", () => {
  const { sandbox, scriptProperties, projectTriggers } = createAppsScriptReportingContext();
  scriptProperties.set("REPORT_TRIGGER_SECRET", "valid_secret_123");

  const responseText = sandbox.handleReportTriggerAction({
    action: "trigger_report",
    reportType: "daily",
    secret: "valid_secret_123",
  }).getContent();

  const response = JSON.parse(responseText);
  assert.equal(response.success, true);
  assert.equal(response.status, "accepted");
  assert.equal(response.delivered, false);
  assert.ok(response.acceptedAt);

  // Verifies one-off trigger was created for processAsyncReportTrigger
  assert.equal(projectTriggers.length, 1);
  assert.equal(projectTriggers[0].getHandlerFunction(), "processAsyncReportTrigger");

  // Verifies job payload is persisted in ScriptProperties
  const jobPayload = JSON.parse(scriptProperties.get("GN_ASYNC_REPORT_JOB"));
  assert.equal(jobPayload.reportType, "daily");
});

test("Apps Script Background Worker: Processes queued job, delivers email, and cleans up triggers", () => {
  const { sandbox, scriptProperties, sentEmails, projectTriggers } = createAppsScriptReportingContext();
  scriptProperties.set("REPORT_TRIGGER_SECRET", "valid_secret_123");

  // Step 1: Trigger the report asynchronously
  sandbox.handleReportTriggerAction({
    action: "trigger_report",
    reportType: "daily",
    secret: "valid_secret_123",
  });

  assert.equal(sentEmails.length, 0, "Email must not be sent synchronously during acceptance");
  assert.equal(projectTriggers.length, 1);

  // Step 2: Background worker fires
  sandbox.processAsyncReportTrigger();

  assert.equal(sentEmails.length, 1, "Email must be dispatched by the background worker");
  assert.equal(projectTriggers.length, 0, "Temporary one-off trigger must be deleted after processing");

  // Step 3: Check delivery state in ScriptProperties
  assert.equal(scriptProperties.get("GN_REPORT_STATUS_daily"), "delivered");
  assert.ok(scriptProperties.get("GN_REPORT_LAST_DELIVERED_daily"));
  assert.ok(!scriptProperties.get("GN_ASYNC_REPORT_JOB"), "Completed job must be cleaned up");
});

test("Apps Script Deduplication & Idempotency: Prevents duplicate email if previously delivered today", () => {
  const { sandbox, scriptProperties, sentEmails } = createAppsScriptReportingContext();
  scriptProperties.set("REPORT_TRIGGER_SECRET", "valid_secret_123");

  // Execute and deliver daily report once
  sandbox.handleReportTriggerAction({
    action: "trigger_report",
    reportType: "daily",
    secret: "valid_secret_123",
  });
  sandbox.processAsyncReportTrigger();
  assert.equal(sentEmails.length, 1);

  // Second trigger attempt on the same day (e.g. after a Vercel 504 retry or duplicate cron)
  const retryResponse = JSON.parse(sandbox.handleReportTriggerAction({
    action: "trigger_report",
    reportType: "daily",
    secret: "valid_secret_123",
  }).getContent());

  assert.equal(retryResponse.success, true);
  assert.equal(retryResponse.status, "already_completed");
  assert.equal(retryResponse.delivered, true);
  assert.equal(retryResponse.skipped, true);
  assert.equal(sentEmails.length, 1, "Duplicate email must not be dispatched");
});

test("Apps Script Status Action: Real-time inspection distinguishes accepted, delivered, and idle states", () => {
  const { sandbox, scriptProperties } = createAppsScriptReportingContext();
  scriptProperties.set("REPORT_TRIGGER_SECRET", "valid_secret_123");

  // 1. Idle status initially
  const status1 = JSON.parse(sandbox.handleReportTriggerAction({
    action: "report_status",
    reportType: "daily",
    secret: "valid_secret_123",
  }).getContent());
  assert.equal(status1.delivered, false);
  assert.equal(status1.status, "idle");

  // 2. Accepted / in-progress status
  sandbox.handleReportTriggerAction({
    action: "trigger_report",
    reportType: "daily",
    secret: "valid_secret_123",
  });
  const status2 = JSON.parse(sandbox.handleReportTriggerAction({
    action: "report_status",
    reportType: "daily",
    secret: "valid_secret_123",
  }).getContent());
  assert.equal(status2.delivered, false);
  assert.equal(status2.status, "in_progress");

  // 3. Delivered status after execution
  sandbox.processAsyncReportTrigger();
  const status3 = JSON.parse(sandbox.handleReportTriggerAction({
    action: "report_status",
    reportType: "daily",
    secret: "valid_secret_123",
  }).getContent());
  assert.equal(status3.delivered, true);
  assert.equal(status3.status, "delivered");
  assert.ok(status3.completedTodayAt);
});

test("Vercel Route Handler: Dispatches async trigger and parses 'accepted' state with delivered: false", async () => {
  let fetchedPayload = null;

  // Mock global fetch to return instantaneous Google Apps Script acknowledgment
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    fetchedPayload = JSON.parse(opts.body);
    return new Response(JSON.stringify({
      success: true,
      status: "accepted",
      delivered: false,
      reportType: "daily",
      message: "Report daily trigger accepted for asynchronous processing.",
      acceptedAt: "2026-10-17 17:30:00 IST",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const req = new Request("https://greennext.io/api/cron/reports?type=daily", {
      headers: {
        Authorization: "Bearer test_cron_secret",
      },
    });

    const env = {
      CRON_SECRET: "test_cron_secret",
      REPORT_APPS_SCRIPT_URL: "https://script.google.com/macros/s/mock/exec",
      REPORT_TRIGGER_SECRET: "test_report_secret",
    };

    const res = await handleReportCronRequest(req, env);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.status, "accepted");
    assert.equal(body.delivered, false);
    assert.equal(body.reportType, "daily");

    assert.equal(fetchedPayload.action, "trigger_report");
    assert.equal(fetchedPayload.secret, "test_report_secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Vercel Route Handler: Correctly reports already_completed state on duplicate retries", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      success: true,
      status: "already_completed",
      delivered: true,
      skipped: true,
      reportType: "weekly",
      message: "Report weekly was already completed today. Duplicate delivery prevented.",
      completedAt: "2026-10-17 08:00:15 IST",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    // Uses weekly report type to avoid cooldown collisions with daily
    const req = new Request("https://greennext.io/api/cron/reports?type=weekly", {
      headers: {
        Authorization: "Bearer test_cron_secret",
      },
    });

    const env = {
      CRON_SECRET: "test_cron_secret",
      REPORT_APPS_SCRIPT_URL: "https://script.google.com/macros/s/mock/exec",
      REPORT_TRIGGER_SECRET: "test_report_secret",
    };

    const res = await handleReportCronRequest(req, env);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.status, "already_completed");
    assert.equal(body.delivered, true);
    assert.equal(body.skipped, true);
    assert.equal(body.completedAt, "2026-10-17 08:00:15 IST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Vercel Route Handler: Supports status query (?action=status) to check confirmed delivery", async () => {
  let fetchedPayload = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    fetchedPayload = JSON.parse(opts.body);
    return new Response(JSON.stringify({
      success: true,
      status: "delivered",
      delivered: true,
      reportType: "daily",
      message: "Report daily was completed and delivered at 2026-10-17 08:00:15 IST.",
      completedTodayAt: "2026-10-17 08:00:15 IST",
      lastDeliveredAt: "2026-10-17 08:00:15 IST",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const req = new Request("https://greennext.io/api/cron/reports?type=daily&action=status", {
      headers: {
        Authorization: "Bearer test_cron_secret",
      },
    });

    const env = {
      CRON_SECRET: "test_cron_secret",
      REPORT_APPS_SCRIPT_URL: "https://script.google.com/macros/s/mock/exec",
      REPORT_TRIGGER_SECRET: "test_report_secret",
    };

    const res = await handleReportCronRequest(req, env);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.status, "delivered");
    assert.equal(body.delivered, true);
    assert.equal(body.completedTodayAt, "2026-10-17 08:00:15 IST");

    assert.equal(fetchedPayload.action, "report_status");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
