import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Load Code.gs into a sandboxed VM context with Apps Script mocks
const codeGsSource = fs.readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");

function createMockSheet(name, initialHeaders = []) {
  const rows = [];
  if (initialHeaders.length > 0) {
    rows.push([...initialHeaders]);
  }
  return {
    _name: name,
    _rows: rows,
    _clearedCount: 0,
    getName: () => name,
    getLastRow: () => rows.length,
    getLastColumn: () => (rows.length > 0 ? rows[0].length : 0),
    appendRow: (row) => {
      rows.push([...row]);
      return rows.length;
    },
    clear: function() {
      this._clearedCount++;
      rows.length = 0;
    },
    getRange: (startRow, startCol, numRows, numCols) => {
      return {
        getValues: () => {
          const slice = [];
          for (let r = 0; r < numRows; r++) {
            const rowIndex = startRow - 1 + r;
            const rowData = rows[rowIndex] || [];
            const cols = [];
            for (let c = 0; c < numCols; c++) {
              const colIndex = startCol - 1 + c;
              cols.push(rowData[colIndex] !== undefined ? rowData[colIndex] : "");
            }
            slice.push(cols);
          }
          return slice;
        },
        setValues: (values) => {
          for (let r = 0; r < values.length; r++) {
            const targetRowIndex = startRow - 1 + r;
            while (rows.length <= targetRowIndex) {
              rows.push([]);
            }
            for (let c = 0; c < values[r].length; c++) {
              const targetColIndex = startCol - 1 + c;
              rows[targetRowIndex][targetColIndex] = values[r][c];
            }
          }
        },
        setFontWeight: function() { return this; },
        setBackground: function() { return this; },
        setFontColor: function() { return this; },
        setFontSize: function() { return this; },
        setFontStyle: function() { return this; },
      };
    },
    setFrozenRows: () => {},
    autoResizeColumns: () => {},
  };
}

function createMockSpreadsheet(id, name) {
  const sheets = new Map();
  return {
    _id: id,
    _name: name,
    getId: () => id,
    getName: () => name,
    getSheetByName: (sName) => sheets.get(sName) || null,
    insertSheet: (sName) => {
      const sheet = createMockSheet(sName);
      sheets.set(sName, sheet);
      return sheet;
    },
    toast: () => {},
  };
}

function createAppsScriptContext(customMocks = {}) {
  const triggers = [];
  const spreadsheetsRegistry = new Map();

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
      openById: (id) => getOrCreateMockSs(id),
      getActiveSpreadsheet: () => null,
      getUi: () => ({
        createMenu: () => ({
          addItem: function() { return this; },
          addSeparator: function() { return this; },
          addToUi: function() { return this; },
        }),
      }),
    },
    ScriptApp: {
      getOAuthToken: () => "mock-token-xyz",
      getProjectTriggers: () => [...triggers],
      deleteTrigger: (trig) => {
        const idx = triggers.indexOf(trig);
        if (idx !== -1) triggers.splice(idx, 1);
      },
      newTrigger: (functionName) => {
        let interval = 0;
        return {
          timeBased: function() { return this; },
          everyMinutes: function(mins) { interval = mins; return this; },
          create: () => {
            const t = {
              _id: "trigger_" + Math.random().toString(36).substring(2, 9),
              getHandlerFunction: () => functionName,
              getUniqueId: function() { return this._id; },
              interval,
            };
            triggers.push(t);
            return t;
          },
        };
      },
    },
    Logger: {
      log: () => {},
    },
    ...customMocks,
  };

  vm.createContext(sandbox);
  vm.runInContext(codeGsSource, sandbox);
  return { sandbox, getOrCreateMockSs, triggers };
}

// ----------------------------------------------------------------------------
// 1. Configuration & Dedicated Naming
// ----------------------------------------------------------------------------

test("YouTube: Configuration contains official GreenNext channel details and schemas", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  assert.equal(ctx.YOUTUBE_CONFIG.channelId, "UC9NjTPG8J1ekB45TZzvwM7A");
  assert.equal(ctx.YOUTUBE_CONFIG.channelHandle, "@GreenNextAI");
  assert.equal(ctx.YOUTUBE_CONFIG.channelTitle, "GreenNext");
  assert.deepEqual([...ctx.YOUTUBE_CONFIG.seedVideoIds], ["IHRbyPoDdlw"]);
  assert.equal(ctx.YOUTUBE_CONFIG.sheets.rawVideoData, "YouTube_Raw_Data");
  assert.equal(ctx.YOUTUBE_CONFIG.sheets.comments, "YouTube_Comments");
  assert.equal(ctx.YOUTUBE_CONFIG.sheets.channelStats, "YouTube_Channel_Stats");
  assert.equal(ctx.YOUTUBE_CONFIG.sheets.analytics, "YouTube_Analytics");
  assert.equal(ctx.YOUTUBE_CONFIG.triggerIntervalMinutes, 10);
});

test("YouTube: setupYouTubeSheets initializes strictly dedicated YouTube_* sheets without alias hijacking", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");

  // Pre-insert alias names that might exist in another workbook
  rawSs.insertSheet("Video_Analytics").appendRow(["Legacy", "Data"]);
  rawSs.insertSheet("Video_Comments").appendRow(["Legacy", "Comments"]);
  rawSs.insertSheet("Channel_Stats").appendRow(["Legacy", "Stats"]);

  const res = ctx.setupYouTubeSheets(rawSs, anaSs);
  assert.equal(res.success, true);
  // Must use dedicated YouTube_* names, NOT alias names
  assert.equal(res.sheets.rawVideoData, "YouTube_Raw_Data");
  assert.equal(res.sheets.comments, "YouTube_Comments");
  assert.equal(res.sheets.channelStats, "YouTube_Channel_Stats");
  assert.equal(res.sheets.analytics, "YouTube_Analytics");

  // Verify dedicated sheets were created and legacy ones were untouched
  assert.ok(rawSs.getSheetByName("YouTube_Raw_Data"));
  assert.ok(rawSs.getSheetByName("YouTube_Comments"));
  assert.ok(rawSs.getSheetByName("YouTube_Channel_Stats"));
  assert.equal(rawSs.getSheetByName("Video_Analytics").getLastRow(), 1);
});

// ----------------------------------------------------------------------------
// 2. Failure Detection vs Empty Data
// ----------------------------------------------------------------------------

test("YouTube: fetchYouTubeChannelStats returns FAILED status and null metrics on API error", () => {
  const mockFailingService = {
    Channels: {
      list: () => {
        throw new Error("QuotaExceeded: YouTube API quota limit reached");
      },
    },
  };

  const { sandbox: ctx } = createAppsScriptContext({ YouTube: mockFailingService });
  const stats = ctx.fetchYouTubeChannelStats("UC9NjTPG8J1ekB45TZzvwM7A");

  assert.equal(stats.success, false);
  assert.equal(stats.status, "FAILED");
  assert.ok(stats.error.includes("QuotaExceeded"));
  assert.equal(stats.subscribers, null); // NOT 0
  assert.equal(stats.views, null);       // NOT 0
});

test("YouTube: fetchYouTubeVideos returns FAILED status on API error", () => {
  const mockFailingService = {
    Videos: {
      list: () => {
        throw new Error("BackendError: 500 Internal Server Error");
      },
    },
  };

  const { sandbox: ctx } = createAppsScriptContext({ YouTube: mockFailingService });
  const res = ctx.fetchYouTubeVideos(["IHRbyPoDdlw"]);

  assert.equal(res.success, false);
  assert.equal(res.status, "FAILED");
  assert.ok(res.error.includes("BackendError"));
  assert.deepEqual([...res.videos], []);
});

test("YouTube: syncYouTubeDataToSheets reports FAILED when API calls fail and preserves existing sheet data", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");

  ctx.setupYouTubeSheets(rawSs, createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics"));

  // Seed last known good data in raw sheets
  const sRaw = rawSs.getSheetByName("YouTube_Raw_Data");
  sRaw.appendRow([
    "2026-10-14 18:00:00",
    "IHRbyPoDdlw",
    "GreenNext | Powering Smarter, Greener AI Infrastructure 🌿",
    "2026-10-14T13:11:00Z",
    120, // 120 views
    15,  // 15 likes
    4,   // 4 comments
    "https://www.youtube.com/watch?v=IHRbyPoDdlw",
  ]);

  const sChannel = rawSs.getSheetByName("YouTube_Channel_Stats");
  sChannel.appendRow([
    "2026-10-14 18:00:00",
    "GreenNext",
    "UC9NjTPG8J1ekB45TZzvwM7A",
    50,  // 50 subscribers
    800, // 800 views
    1    // 1 video
  ]);

  // Now simulate an outage where both channel and video fetches fail
  ctx.fetchYouTubeChannelStats = () => ({
    success: false,
    status: "FAILED",
    error: "Service Unavailable 503",
    subscribers: null,
    views: null,
    videoCount: null,
  });

  ctx.fetchYouTubeVideos = () => ({
    success: false,
    status: "FAILED",
    error: "Network timeout connecting to YouTube API",
    videos: [],
  });

  const syncRes = ctx.syncYouTubeDataToSheets(rawSs);

  // Must report FAILED, not SUCCESS!
  assert.equal(syncRes.success, false);
  assert.equal(syncRes.status, "FAILED");
  assert.ok(syncRes.errors.length >= 2);

  // Crucial: last known good data MUST NOT be overwritten or blanked!
  assert.equal(sRaw.getLastRow(), 2);
  assert.equal(sRaw._rows[1][4], 120); // Still 120 views!
  assert.equal(sRaw._rows[1][5], 15);  // Still 15 likes!

  assert.equal(sChannel.getLastRow(), 2);
  assert.equal(sChannel._rows[1][3], 50); // Still 50 subs!
});

test("YouTube: syncYouTubeDataToSheets reports PARTIAL when only one subsystem fails", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  ctx.setupYouTubeSheets(rawSs, createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics"));

  // Channel succeeds, but video fetch fails
  ctx.fetchYouTubeChannelStats = () => ({
    success: true,
    status: "SUCCESS",
    channelId: "UC9NjTPG8J1ekB45TZzvwM7A",
    title: "GreenNext",
    subscribers: 60,
    views: 950,
    videoCount: 1,
    uploadsPlaylistId: null,
  });

  ctx.fetchYouTubeVideos = () => ({
    success: false,
    status: "FAILED",
    error: "Video endpoint error",
    videos: [],
  });

  const syncRes = ctx.syncYouTubeDataToSheets(rawSs);

  assert.equal(syncRes.success, false);
  assert.equal(syncRes.status, "PARTIAL");
  assert.equal(syncRes.channelStatus, "SUCCESS");
  assert.equal(syncRes.videosStatus, "FAILED");
});

// ----------------------------------------------------------------------------
// 3. Historical Snapshot Preservation & Trends
// ----------------------------------------------------------------------------

test("YouTube: Preserves history by appending snapshots on metric change without overwriting", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  ctx.setupYouTubeSheets(rawSs, createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics"));

  const mockChannel = {
    channelId: "UC9NjTPG8J1ekB45TZzvwM7A",
    title: "GreenNext",
    subscribers: 20,
    views: 100,
    videoCount: 1,
  };

  // 1st sync: initial snapshot (views = 10, likes = 2)
  const sync1 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos: [
      { videoId: "IHRbyPoDdlw", title: "GreenNext Intro", publishedAt: "2026-10-14T10:00:00Z", views: 10, likes: 2, commentsCount: 0, videoUrl: "url" },
    ],
  });
  assert.equal(sync1.snapshotsAppended, 1);

  const sRaw = rawSs.getSheetByName("YouTube_Raw_Data");
  assert.equal(sRaw.getLastRow(), 2); // Header + Snapshot 1

  // 2nd sync: views unchanged -> should NOT append duplicate snapshot
  const sync2 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos: [
      { videoId: "IHRbyPoDdlw", title: "GreenNext Intro", publishedAt: "2026-10-14T10:00:00Z", views: 10, likes: 2, commentsCount: 0, videoUrl: "url" },
    ],
  });
  assert.equal(sync2.snapshotsAppended, 0);
  assert.equal(sRaw.getLastRow(), 2); // Still 2 rows

  // 3rd sync: views grew from 10 to 35 -> MUST append new snapshot without deleting old one
  const sync3 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos: [
      { videoId: "IHRbyPoDdlw", title: "GreenNext Intro", publishedAt: "2026-10-14T10:00:00Z", views: 35, likes: 7, commentsCount: 1, videoUrl: "url" },
    ],
  });
  assert.equal(sync3.snapshotsAppended, 1);
  assert.equal(sRaw.getLastRow(), 3); // Header + Snapshot 1 + Snapshot 2

  // Check both snapshots are preserved
  assert.equal(sRaw._rows[1][4], 10); // Historical Snapshot 1 has 10 views
  assert.equal(sRaw._rows[2][4], 35); // Snapshot 2 has 35 views

  // Verify getLatestYouTubeVideoMetrics extracts latest state and preserves all history
  const existingRows = sRaw.getRange(2, 1, sRaw.getLastRow() - 1, sRaw.getLastColumn()).getValues();
  const vMap = ctx.getLatestYouTubeVideoMetrics(existingRows);
  assert.ok(vMap["IHRbyPoDdlw"]);
  assert.equal(vMap["IHRbyPoDdlw"].first.views, 10);
  assert.equal(vMap["IHRbyPoDdlw"].latest.views, 35);
  assert.equal(vMap["IHRbyPoDdlw"].snapshots.length, 2);
});

// ----------------------------------------------------------------------------
// 4. Duplicate Comment Prevention
// ----------------------------------------------------------------------------

test("YouTube: Strict deduplication by Comment ID prevents duplicate comment entries", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  ctx.setupYouTubeSheets(rawSs, createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics"));

  const mockChannel = { channelId: "UC9NjTPG8J1ekB45TZzvwM7A", title: "GreenNext", subscribers: 10, views: 50, videoCount: 1 };
  const mockVideos = [{ videoId: "IHRbyPoDdlw", title: "GreenNext", publishedAt: "2026-10-14", views: 20, likes: 5, commentsCount: 2, videoUrl: "url" }];

  // First sync with 2 comments
  ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos,
    mockComments: {
      IHRbyPoDdlw: [
        { commentId: "c_alpha", authorDisplayName: "Alice", commentText: "Great video", publishedAt: "2026-10-14T11:00:00Z" },
        { commentId: "c_beta", authorDisplayName: "Bob", commentText: "Clean infrastructure", publishedAt: "2026-10-14T11:10:00Z" },
      ],
    },
  });

  const sComments = rawSs.getSheetByName("YouTube_Comments");
  assert.equal(sComments.getLastRow(), 3); // Header + 2 comments

  // Second sync with 1 duplicate (c_alpha) and 1 new (c_gamma)
  const sync2 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos,
    mockComments: {
      IHRbyPoDdlw: [
        { commentId: "c_alpha", authorDisplayName: "Alice", commentText: "Great video", publishedAt: "2026-10-14T11:00:00Z" },
        { commentId: "c_gamma", authorDisplayName: "Carol", commentText: "New question", publishedAt: "2026-10-14T12:00:00Z" },
      ],
    },
  });

  assert.equal(sync2.newCommentsAdded, 1);
  assert.equal(sComments.getLastRow(), 4); // Header + 3 distinct comments
  assert.equal(sComments._rows[3][2], "c_gamma");
});

// ----------------------------------------------------------------------------
// 5. Sheet Isolation (Analytics Protection)
// ----------------------------------------------------------------------------

test("YouTube: renderYouTubeAnalytics clears ONLY YouTube_Analytics and leaves unrelated tabs untouched", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");

  // Create unrelated production analytics tabs
  const execSummary = anaSs.insertSheet("Executive_Summary");
  execSummary.appendRow(["KPI", "Observed"]);
  execSummary.appendRow(["Total Sessions", 1420]);

  const linkedInAnalytics = anaSs.insertSheet("LinkedIn_Analytics");
  linkedInAnalytics.appendRow(["Campaign", "Sessions"]);
  linkedInAnalytics.appendRow(["q4_ai_launch", 312]);

  ctx.setupYouTubeSheets(rawSs, anaSs);

  // Render dashboard
  const renderRes = ctx.renderYouTubeAnalytics(anaSs, rawSs, { status: "SUCCESS" });

  assert.equal(renderRes.success, true);
  assert.equal(renderRes.sheetName, "YouTube_Analytics");

  // Verify YouTube_Analytics was cleared and rewritten
  const ySheet = anaSs.getSheetByName("YouTube_Analytics");
  assert.equal(ySheet._clearedCount, 1);
  assert.ok(ySheet.getLastRow() >= 9);

  // Verify unrelated sheets were NEVER cleared and retain their exact data
  assert.equal(execSummary._clearedCount, 0);
  assert.equal(execSummary.getLastRow(), 2);
  assert.deepEqual([...execSummary._rows[1]], ["Total Sessions", 1420]);

  assert.equal(linkedInAnalytics._clearedCount, 0);
  assert.equal(linkedInAnalytics.getLastRow(), 2);
  assert.deepEqual([...linkedInAnalytics._rows[1]], ["q4_ai_launch", 312]);
});

// ----------------------------------------------------------------------------
// 6. Trigger Verification & Idempotency
// ----------------------------------------------------------------------------

test("YouTube: setupYouTubeAnalyticsTrigger installs 10-minute trigger idempotently and handles removal", () => {
  const { sandbox: ctx, triggers } = createAppsScriptContext();

  // 1. Initial creation
  const res1 = ctx.setupYouTubeAnalyticsTrigger();
  assert.equal(res1.success, true);
  assert.equal(res1.alreadyExists, false);
  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].getHandlerFunction(), "refreshYouTubeAnalytics");
  assert.equal(triggers[0].interval, 10); // 10 minutes

  // 2. Duplicate prevention: second call must NOT add another trigger
  const res2 = ctx.setupYouTubeAnalyticsTrigger();
  assert.equal(res2.success, true);
  assert.equal(res2.alreadyExists, true);
  assert.equal(triggers.length, 1); // Still exactly 1 trigger!

  // Add an unrelated trigger (e.g. daily email report)
  triggers.push({
    _id: "unrelated_1",
    getHandlerFunction: () => "sendDailyReport",
    getUniqueId: () => "unrelated_1",
  });
  assert.equal(triggers.length, 2);

  // 3. Removal must delete ONLY the YouTube trigger, preserving unrelated triggers
  const resRemove = ctx.removeYouTubeAnalyticsTrigger();
  assert.equal(resRemove.success, true);
  assert.equal(resRemove.removedCount, 1);
  assert.equal(triggers.length, 1);
  assert.equal(triggers[0].getHandlerFunction(), "sendDailyReport");
});

test("YouTube: refreshYouTubeAnalytics handles spreadsheet errors safely without unhandled crashes", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  ctx.SpreadsheetApp.openById = () => {
    throw new Error("Temporary network timeout");
  };

  const res = ctx.refreshYouTubeAnalytics(null, null);
  assert.equal(res.success, false);
  assert.equal(res.status, "FAILED");
  assert.ok(res.error.includes("Temporary network timeout"));
});

// ----------------------------------------------------------------------------
// 7. Failed Sync or Dashboard-Rendering Error Preserves Last Known Good Data
// ----------------------------------------------------------------------------

test("YouTube: Failed sync or dashboard-rendering error preserves last known good data and does not falsely display SUCCESS", () => {
  let toastMessage = "";
  const mockActiveSpreadsheet = {
    toast: (msg) => {
      toastMessage = msg;
    },
  };

  const { sandbox: ctx } = createAppsScriptContext({
    SpreadsheetApp: {
      openById: (id) => getOrCreateMockSs(id),
      getActiveSpreadsheet: () => mockActiveSpreadsheet,
    },
  });

  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");
  ctx.setupYouTubeSheets(rawSs, anaSs);

  // Pre-seed last known good data in raw sheets
  const sRaw = rawSs.getSheetByName("YouTube_Raw_Data");
  sRaw.appendRow(["2026-10-14 10:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-14T09:00:00Z", 500, 45, 12, "https://youtube.com/watch?v=IHRbyPoDdlw"]);
  const sChannel = rawSs.getSheetByName("YouTube_Channel_Stats");
  sChannel.appendRow(["2026-10-14 10:00:00", "GreenNext", "UC9NjTPG8J1ekB45TZzvwM7A", 120, 2500, 1]);

  // Case A: Sync succeeds, but dashboard rendering throws an unexpected error
  const originalSync = ctx.syncYouTubeDataToSheets;
  const originalRender = ctx.renderYouTubeAnalytics;

  ctx.syncYouTubeDataToSheets = () => ({
    success: true,
    status: "SUCCESS",
    videosTracked: 1,
    snapshotsAppended: 0,
    newCommentsAdded: 0,
    errors: [],
  });

  ctx.renderYouTubeAnalytics = () => ({
    success: false,
    status: "FAILED",
    error: "Spreadsheet quota exceeded during dashboard write",
    sheetName: "YouTube_Analytics",
  });

  const refreshResult = ctx.refreshYouTubeAnalytics(rawSs, anaSs);

  // Overall status MUST be FAILED, NOT SUCCESS
  assert.equal(refreshResult.success, false);
  assert.equal(refreshResult.status, "FAILED");
  assert.ok(toastMessage.includes("FAILED"));
  assert.ok(!toastMessage.includes("SUCCESS"));

  // Last known good data in raw sheets remains intact
  assert.equal(sRaw.getLastRow(), 2);
  assert.equal(sRaw._rows[1][4], 500); // 500 views
  assert.equal(sChannel._rows[1][3], 120); // 120 subs

  // Restore real functions for Case B
  ctx.syncYouTubeDataToSheets = originalSync;
  ctx.renderYouTubeAnalytics = originalRender;

  // Case B: Sync fails with an API error; renderYouTubeAnalytics renders dashboard with last known good data & FAILED status
  const failedSync = {
    success: false,
    status: "FAILED",
    errors: ["YouTube API 503 Backend Error"],
  };

  const renderResult = ctx.renderYouTubeAnalytics(anaSs, rawSs, failedSync);
  assert.equal(renderResult.success, false);
  assert.equal(renderResult.status, "FAILED");

  const yDash = anaSs.getSheetByName("YouTube_Analytics");
  const dashRows = yDash._rows;
  // Line 3 must display FAILED and last known good timestamp
  assert.ok(dashRows[2][0].includes("Status: FAILED"));
  assert.ok(dashRows[2][0].includes("Last Known Good Data: 2026-10-14 10:00:00"));
  assert.ok(!dashRows[2][0].includes("Status: SUCCESS"));

  // Overview row must display FAILED under Data Status
  assert.equal(dashRows[6][7], "FAILED");
  // Metrics must still display last known good values (120 subs, 500 views)
  assert.equal(dashRows[6][0], 120);
  assert.equal(dashRows[6][3], 500);
});

// ----------------------------------------------------------------------------
// 8. Multi-Page Comment Pagination & Refresh Deduplication
// ----------------------------------------------------------------------------

test("YouTube: Multi-page comment pagination with nextPageToken discovers new comments across pages without duplicates", () => {
  let pageCallCount = 0;
  const mockYouTubeService = {
    CommentThreads: {
      list: (part, params) => {
        pageCallCount++;
        if (!params.pageToken) {
          // Page 1
          return {
            nextPageToken: "token_page_2",
            items: [
              { id: "c1", snippet: { topLevelComment: { id: "c1", snippet: { authorDisplayName: "Alice", textDisplay: "First comment", publishedAt: "2026-10-14T10:00:00Z" } } } },
              { id: "c2", snippet: { topLevelComment: { id: "c2", snippet: { authorDisplayName: "Bob", textDisplay: "Second comment", publishedAt: "2026-10-14T10:05:00Z" } } } },
            ],
          };
        } else if (params.pageToken === "token_page_2") {
          // Page 2
          return {
            nextPageToken: null,
            items: [
              { id: "c3", snippet: { topLevelComment: { id: "c3", snippet: { authorDisplayName: "Charlie", textDisplay: "Third comment", publishedAt: "2026-10-14T10:10:00Z" } } } },
            ],
          };
        }
        return { items: [] };
      },
    },
  };

  const { sandbox: ctx } = createAppsScriptContext({ YouTube: mockYouTubeService });
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  ctx.setupYouTubeSheets(rawSs, createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics"));

  // 1. Test pagination directly in fetchYouTubeVideoComments
  const fetchRes = ctx.fetchYouTubeVideoComments("IHRbyPoDdlw", "GreenNext Intro");
  assert.equal(fetchRes.success, true);
  assert.equal(fetchRes.comments.length, 3);
  assert.equal(fetchRes.comments[0].commentId, "c1");
  assert.equal(fetchRes.comments[1].commentId, "c2");
  assert.equal(fetchRes.comments[2].commentId, "c3");
  assert.equal(pageCallCount, 2);

  // 2. Test saving to sheets via sync
  const mockChannel = { channelId: "UC9NjTPG8J1ekB45TZzvwM7A", title: "GreenNext", subscribers: 10, views: 50, videoCount: 1 };
  const mockVideos = [{ videoId: "IHRbyPoDdlw", title: "GreenNext Intro", publishedAt: "2026-10-14", views: 20, likes: 5, commentsCount: 3, videoUrl: "url" }];

  const sync1 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos,
  });
  assert.equal(sync1.newCommentsAdded, 3);
  const sComments = rawSs.getSheetByName("YouTube_Comments");
  assert.equal(sComments.getLastRow(), 4); // Header + 3 comments

  // 3. Later refresh: simulate a new comment "c4" arriving on page 1, followed by existing c1 and c2
  mockYouTubeService.CommentThreads.list = (part, params) => {
    if (!params.pageToken) {
      return {
        nextPageToken: "token_page_2",
        items: [
          { id: "c4", snippet: { topLevelComment: { id: "c4", snippet: { authorDisplayName: "Dave", textDisplay: "Newest comment", publishedAt: "2026-10-14T12:00:00Z" } } } },
          { id: "c1", snippet: { topLevelComment: { id: "c1", snippet: { authorDisplayName: "Alice", textDisplay: "First comment", publishedAt: "2026-10-14T10:00:00Z" } } } },
        ],
      };
    } else if (params.pageToken === "token_page_2") {
      return {
        nextPageToken: null,
        items: [
          { id: "c2", snippet: { topLevelComment: { id: "c2", snippet: { authorDisplayName: "Bob", textDisplay: "Second comment", publishedAt: "2026-10-14T10:05:00Z" } } } },
          { id: "c3", snippet: { topLevelComment: { id: "c3", snippet: { authorDisplayName: "Charlie", textDisplay: "Third comment", publishedAt: "2026-10-14T10:10:00Z" } } } },
        ],
      };
    }
    return { items: [] };
  };

  const sync2 = ctx.syncYouTubeDataToSheets(rawSs, {
    mockChannelStats: mockChannel,
    mockVideos,
  });

  // Exactly 1 new comment added (c4); c1, c2, c3 are not duplicated
  assert.equal(sync2.newCommentsAdded, 1);
  assert.equal(sComments.getLastRow(), 5); // Header + 4 distinct comments
  assert.equal(sComments._rows[4][2], "c4");
});

// ----------------------------------------------------------------------------
// 9. Snapshot Count and View Growth Labeling
// ----------------------------------------------------------------------------

test("YouTube: Dashboard displays correct SNAPSHOT COUNT and labels view growth since first recorded snapshot", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");
  ctx.setupYouTubeSheets(rawSs, anaSs);

  const sRaw = rawSs.getSheetByName("YouTube_Raw_Data");
  // Snapshot 1 (Initial): 100 views
  sRaw.appendRow(["2026-10-10 09:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 100, 10, 2, "https://youtube.com/watch?v=IHRbyPoDdlw"]);
  // Snapshot 2: 175 views
  sRaw.appendRow(["2026-10-12 12:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 175, 18, 4, "https://youtube.com/watch?v=IHRbyPoDdlw"]);
  // Snapshot 3 (Latest): 260 views
  sRaw.appendRow(["2026-10-14 15:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 260, 25, 7, "https://youtube.com/watch?v=IHRbyPoDdlw"]);

  const sChannel = rawSs.getSheetByName("YouTube_Channel_Stats");
  sChannel.appendRow(["2026-10-14 15:00:00", "GreenNext", "UC9NjTPG8J1ekB45TZzvwM7A", 80, 1200, 1]);

  const renderRes = ctx.renderYouTubeAnalytics(anaSs, rawSs, { status: "SUCCESS" });
  assert.equal(renderRes.success, true);

  const yDash = anaSs.getSheetByName("YouTube_Analytics");
  const dashRows = yDash._rows;

  // Verify headers on row 9
  assert.equal(dashRows[8][0], "TOP PERFORMING VIDEOS");
  assert.equal(dashRows[8][2], "VIEWS");
  assert.equal(dashRows[8][3], "VIEW GROWTH (SINCE 1ST SNAPSHOT)");
  assert.equal(dashRows[8][7], "SNAPSHOT COUNT");

  // Verify data row 10
  const videoRow = dashRows[9];
  assert.equal(videoRow[0], "GreenNext Intro");
  assert.equal(videoRow[2], 260); // Latest views
  // View growth: 260 - 100 = +160 since 2026-10-10
  assert.equal(videoRow[3], "+160 (since 2026-10-10)");
  assert.equal(videoRow[7], 3); // snapshotCount = 3
});

// ----------------------------------------------------------------------------
// 10. onOpen() Menu Integration & Preservation of Existing Items
// ----------------------------------------------------------------------------

test("YouTube: onOpen() menu registers all existing items intact followed by YouTube items", () => {
  const registeredItems = [];
  let menuTitle = "";

  const mockUi = {
    createMenu: (title) => {
      menuTitle = title;
      const builder = {
        addItem: (label, func) => {
          registeredItems.push({ type: "item", label, func });
          return builder;
        },
        addSeparator: () => {
          registeredItems.push({ type: "separator" });
          return builder;
        },
        addToUi: () => {},
      };
      return builder;
    },
  };

  const { sandbox: ctx } = createAppsScriptContext({
    SpreadsheetApp: {
      getUi: () => mockUi,
      openById: () => null,
      getActiveSpreadsheet: () => null,
    },
  });

  ctx.onOpen();

  assert.equal(menuTitle, "GreenNext");

  // Verify existing items (0..4) are strictly preserved
  assert.equal(registeredItems[0].label, "🔄 Update Analytics & Reports");
  assert.equal(registeredItems[0].func, "updateAnalyticsSpreadsheet");

  assert.equal(registeredItems[1].label, "📊 Refresh Analytics Now");
  assert.equal(registeredItems[1].func, "updateAnalyticsSpreadsheet");

  assert.equal(registeredItems[2].label, "🔗 Refresh LinkedIn Analytics");
  assert.equal(registeredItems[2].func, "refreshLinkedInAnalyticsManual");

  assert.equal(registeredItems[3].label, "⚙️ Setup Analytics Sheets Structure");
  assert.equal(registeredItems[3].func, "setupAnalyticsSpreadsheet");

  assert.equal(registeredItems[4].label, "📑 Setup LinkedIn Raw Data Sheet");
  assert.equal(registeredItems[4].func, "setupLinkedInRawDataSheet");

  // Verify separator
  assert.equal(registeredItems[5].type, "separator");

  // Verify YouTube items (6..9)
  assert.equal(registeredItems[6].label, "📺 Refresh YouTube Analytics");
  assert.equal(registeredItems[6].func, "refreshYouTubeAnalytics");

  assert.equal(registeredItems[7].label, "⚙️ Setup YouTube Sheets");
  assert.equal(registeredItems[7].func, "setupYouTubeSheets");

  assert.equal(registeredItems[8].label, "⏱️ Enable YouTube Auto-Refresh (10 min)");
  assert.equal(registeredItems[8].func, "setupYouTubeAnalyticsTrigger");

  assert.equal(registeredItems[9].label, "🛑 Disable YouTube Auto-Refresh");
  assert.equal(registeredItems[9].func, "removeYouTubeAnalyticsTrigger");
});

// ----------------------------------------------------------------------------
// 11. Apps Script Manifest Validation
// ----------------------------------------------------------------------------

test("YouTube: Manifest appsscript.json preserves webapp deployment settings and production scopes", () => {
  const manifestPath = new URL("../google-apps-script/appsscript.json", import.meta.url);
  assert.ok(fs.existsSync(manifestPath), "appsscript.json must exist in google-apps-script/");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Core settings
  assert.equal(manifest.timeZone, "Asia/Kolkata");
  assert.equal(manifest.runtimeVersion, "V8");
  assert.equal(manifest.exceptionLogging, "STACKDRIVER");

  // Webapp deployment settings MUST be preserved
  assert.ok(manifest.webapp, "webapp configuration must be defined");
  assert.equal(manifest.webapp.executeAs, "USER_DEPLOYING");
  assert.equal(manifest.webapp.access, "ANYONE_ANONYMOUS");

  // OAuth Scopes
  const scopes = manifest.oauthScopes || [];
  assert.ok(scopes.includes("https://www.googleapis.com/auth/spreadsheets"), "Spreadsheet scope required");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/script.send_mail"), "Mail scope required");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/script.scriptapp"), "ScriptApp scope required");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/calendar"), "Calendar scope required");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/youtube.readonly"), "YouTube readonly scope required");
  assert.ok(scopes.includes("https://www.googleapis.com/auth/script.external_request"), "UrlFetch external request scope required");

  // Advanced Services
  const advServices = (manifest.dependencies && manifest.dependencies.enabledAdvancedServices) || [];
  const ytService = advServices.find((s) => s.userSymbol === "YouTube");
  assert.ok(ytService, "YouTube advanced service must be enabled");
  assert.equal(ytService.serviceId, "youtube");
  assert.equal(ytService.version, "v3");
});

// ----------------------------------------------------------------------------
// 12. Snapshot Chronology with Descending and Sorted Rows
// ----------------------------------------------------------------------------

test("YouTube: getLatestYouTubeVideoMetrics identifies oldest and newest snapshots by timestamp even in descending or sorted order", () => {
  const { sandbox: ctx } = createAppsScriptContext();

  // Rows sorted descending (newest row first, oldest row last)
  const descendingRows = [
    ["2026-10-14 15:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 260, 25, 7, "https://youtube.com/watch?v=IHRbyPoDdlw"],
    ["2026-10-12 12:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 175, 18, 4, "https://youtube.com/watch?v=IHRbyPoDdlw"],
    ["2026-10-10 09:00:00", "IHRbyPoDdlw", "GreenNext Intro", "2026-10-10T08:00:00Z", 100, 10, 2, "https://youtube.com/watch?v=IHRbyPoDdlw"],
  ];

  const videoMap = ctx.getLatestYouTubeVideoMetrics(descendingRows);
  const entry = videoMap["IHRbyPoDdlw"];

  assert.ok(entry, "Entry for video must exist");
  assert.equal(entry.snapshotCount, 3);
  // Oldest must be 2026-10-10 with 100 views (NOT the first encountered row)
  assert.equal(entry.first.updatedAt, "2026-10-10 09:00:00");
  assert.equal(entry.first.views, 100);
  // Latest must be 2026-10-14 with 260 views (NOT the last encountered row)
  assert.equal(entry.latest.updatedAt, "2026-10-14 15:00:00");
  assert.equal(entry.latest.views, 260);

  // When rendered to dashboard, view growth must be positive (+160), not negative (-160)
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");
  ctx.setupYouTubeSheets(rawSs, anaSs);

  const sRaw = rawSs.getSheetByName("YouTube_Raw_Data");
  descendingRows.forEach((r) => sRaw.appendRow(r));
  const sChannel = rawSs.getSheetByName("YouTube_Channel_Stats");
  sChannel.appendRow(["2026-10-14 15:00:00", "GreenNext", "UC9NjTPG8J1ekB45TZzvwM7A", 80, 1200, 1]);

  const renderRes = ctx.renderYouTubeAnalytics(anaSs, rawSs, { status: "SUCCESS" });
  assert.equal(renderRes.success, true);

  const yDash = anaSs.getSheetByName("YouTube_Analytics");
  const videoRow = yDash._rows[9];
  assert.equal(videoRow[0], "GreenNext Intro");
  assert.equal(videoRow[2], 260); // latest views
  assert.equal(videoRow[3], "+160 (since 2026-10-10)"); // positive growth
  assert.equal(videoRow[7], 3); // snapshot count
});

// ----------------------------------------------------------------------------
// 13. Snapshot Handling with Invalid and Missing Timestamps
// ----------------------------------------------------------------------------

test("YouTube: getLatestYouTubeVideoMetrics safely handles invalid, empty, or unparseable timestamps", () => {
  const { sandbox: ctx } = createAppsScriptContext();

  // Video A: Mixed valid and invalid timestamps
  const mixedRows = [
    ["invalid-timestamp-xyz", "vid_mixed", "Mixed Video", "2026-10-01", 150, 10, 2, "url1"],
    ["2026-10-15 10:00:00", "vid_mixed", "Mixed Video", "2026-10-01", 300, 30, 5, "url1"],
    ["2026-10-05 08:00:00", "vid_mixed", "Mixed Video", "2026-10-01", 100, 5, 1, "url1"],
    ["", "vid_mixed", "Mixed Video", "2026-10-01", 120, 8, 2, "url1"],
  ];

  const mapMixed = ctx.getLatestYouTubeVideoMetrics(mixedRows);
  const entryMixed = mapMixed["vid_mixed"];

  assert.equal(entryMixed.snapshotCount, 4);
  // Identified valid timestamps are used as chronological anchors
  assert.equal(entryMixed.first.updatedAt, "2026-10-05 08:00:00");
  assert.equal(entryMixed.first.views, 100);
  assert.equal(entryMixed.latest.updatedAt, "2026-10-15 10:00:00");
  assert.equal(entryMixed.latest.views, 300);

  // Video B: All timestamps missing or invalid (graceful fallback without throwing or NaN)
  const invalidRows = [
    ["", "vid_invalid", "Invalid Dates Video", "2026-10-01", 50, 2, 0, "url2"],
    ["not_a_date", "vid_invalid", "Invalid Dates Video", "2026-10-01", 80, 5, 1, "url2"],
  ];

  const mapInvalid = ctx.getLatestYouTubeVideoMetrics(invalidRows);
  const entryInvalid = mapInvalid["vid_invalid"];

  assert.equal(entryInvalid.snapshotCount, 2);
  assert.equal(entryInvalid.first.views, 50);
  assert.equal(entryInvalid.latest.views, 80);
});

// ----------------------------------------------------------------------------
// 14. Dashboard Write Failure Preservation
// ----------------------------------------------------------------------------

test("YouTube: renderYouTubeAnalytics preserves previous dashboard when replacement dashboard write fails", () => {
  const { sandbox: ctx } = createAppsScriptContext();
  const rawSs = createMockSpreadsheet(ctx.RAW_DATA_SPREADSHEET_ID, "Raw_Data");
  const anaSs = createMockSpreadsheet(ctx.ANALYTICS_SPREADSHEET_ID, "Analytics");
  ctx.setupYouTubeSheets(rawSs, anaSs);

  // Pre-seed an existing valid dashboard on YouTube_Analytics
  const yDash = anaSs.getSheetByName("YouTube_Analytics");
  yDash.appendRow(["GREENNEXT YOUTUBE DASHBOARD - PRIOR VERSION"]);
  yDash.appendRow(["Official Channel: GreenNext | Status: Prior Good Data"]);
  yDash.appendRow(["Channel Views: 5000 | Subscribers: 250"]);

  const priorFirstRowText = yDash._rows[0][0];

  // Configure sheet to throw an error when setValues is called for replacement write
  const originalGetRange = yDash.getRange;
  let attemptCount = 0;
  yDash.getRange = (startRow, startCol, numRows, numCols) => {
    const rangeObj = originalGetRange(startRow, startCol, numRows, numCols);
    const originalSetValues = rangeObj.setValues;
    rangeObj.setValues = (values) => {
      attemptCount++;
      // Throw during the new replacement write (attempt 1)
      if (attemptCount === 1) {
        throw new Error("Quota exceeded / Network timeout during setValues");
      }
      // Allow restore write (attempt 2)
      return originalSetValues(values);
    };
    return rangeObj;
  };

  const renderRes = ctx.renderYouTubeAnalytics(anaSs, rawSs, { status: "SUCCESS" });

  // Render must report failure
  assert.equal(renderRes.success, false);
  assert.equal(renderRes.status, "FAILED");
  assert.ok(renderRes.error.includes("Quota exceeded"));

  // Previous dashboard must be safely restored and NOT left empty
  assert.ok(yDash.getLastRow() >= 3, "Dashboard must not be left empty");
  assert.equal(yDash._rows[0][0], priorFirstRowText);
});


