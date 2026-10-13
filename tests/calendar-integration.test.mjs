import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Load and evaluate the Google Apps Script backend file into a sandboxed test environment
const codeGsSource = fs.readFileSync(
  new URL("../google-apps-script/Code.gs", import.meta.url),
  "utf8",
);

function createGasSandbox(overrides = {}) {
  const scriptProperties = new Map();
  const scriptCache = new Map();
  const calendarEvents = [];
  const testCalendarEvents = [];

  const defaultCalendar = {
    getName: () => "GreenNext Primary Calendar",
    getTimeZone: () => "Asia/Kolkata",
    getEvents: (startTime, endTime, options) => {
      const search = options?.search;
      if (!search) return calendarEvents;
      return calendarEvents.filter(
        (evt) =>
          (evt.title && evt.title.includes(search)) ||
          (evt.description && evt.description.includes(search)),
      );
    },
    createEvent: (title, startTime, endTime, options) => {
      const event = {
        id: `cal_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        startTime,
        endTime,
        description: options?.description || "",
        guests: options?.guests || null,
        getId() {
          return this.id;
        },
        deleteEvent() {
          const idx = calendarEvents.indexOf(this);
          if (idx !== -1) calendarEvents.splice(idx, 1);
        },
      };
      calendarEvents.push(event);
      return event;
    },
  };

  const dedicatedTestCalendar = {
    getName: () => "GreenNext Automated Test Calendar",
    getTimeZone: () => "Asia/Kolkata",
    getEvents: (startTime, endTime, options) => {
      const search = options?.search;
      if (!search) return testCalendarEvents;
      return testCalendarEvents.filter(
        (evt) =>
          (evt.title && evt.title.includes(search)) ||
          (evt.description && evt.description.includes(search)),
      );
    },
    createEvent: (title, startTime, endTime, options) => {
      const event = {
        id: `test_cal_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        startTime,
        endTime,
        description: options?.description || "",
        guests: options?.guests || null,
        shouldFailDelete: false,
        getId() {
          return this.id;
        },
        deleteEvent() {
          if (this.shouldFailDelete) {
            throw new Error("Calendar service error: event deletion rate limit exceeded");
          }
          const idx = testCalendarEvents.indexOf(this);
          if (idx !== -1) testCalendarEvents.splice(idx, 1);
        },
      };
      testCalendarEvents.push(event);
      return event;
    },
  };

  let lockAcquired = false;
  const mockLock = {
    waitLock: () => {
      lockAcquired = true;
      return true;
    },
    releaseLock: () => {
      lockAcquired = false;
    },
    hasLock: () => lockAcquired,
  };

  const sandbox = {
    Logger: {
      log: () => {},
    },
    LockService: {
      getScriptLock: () => mockLock,
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => Object.fromEntries(scriptProperties.entries()),
        getProperty: (key) => scriptProperties.get(key) || null,
        setProperty: (key, val) => scriptProperties.set(key, String(val)),
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => scriptCache.get(key) || null,
        put: (key, val) => scriptCache.set(key, String(val)),
      }),
    },
    CalendarApp: {
      getDefaultCalendar: () => defaultCalendar,
      getCalendarById: (id) => {
        if (id === "dedicated_test_cal@group.calendar.google.com") return dedicatedTestCalendar;
        if (id === "custom_prod_cal_id") return defaultCalendar;
        return null;
      },
    },
    Utilities: {
      formatDate: (date, tz, format) => {
        const d = new Date(date);
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).formatToParts(d);
        const p = {};
        parts.forEach((item) => {
          p[item.type] = item.value;
        });
        if (format === "yyyy") return p.year;
        if (format === "MM") return p.month;
        if (format === "dd") return p.day;
        if (format === "yyyy-MM-dd HH:mm:ss") {
          return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
        }
        return `${p.year}-${p.month}-${p.day}`;
      },
      parseDate: (dateString, tz, _format) => {
        const [datePart, timePart] = dateString.split(" ");
        const [y, m, d] = datePart.split("/").map(Number);
        const [hh, mm, ss] = timePart.split(":").map(Number);
        if (tz === "Asia/Kolkata") {
          const utcMillis = Date.UTC(y, m - 1, d, hh - 5, mm - 30, ss);
          return new Date(utcMillis);
        }
        return new Date(dateString);
      },
    },
    Date,
    Intl,
    parseInt,
    isNaN,
    JSON,
    String,
    Math,
    Array,
    Object,
    ...overrides,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(codeGsSource, context);

  return {
    sandbox,
    scriptProperties,
    scriptCache,
    calendarEvents,
    testCalendarEvents,
    defaultCalendar,
    dedicatedTestCalendar,
    mockLock,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test("calendar integration is disabled by default", () => {
  const { sandbox } = createGasSandbox();
  const config = sandbox.getCalendarConfig();
  assert.equal(config.enabled, false);
  assert.equal(config.timezone, "Asia/Kolkata");
  assert.equal(config.followUpHour, 10);
  assert.equal(config.durationMinutes, 30);
  assert.equal(config.testCalendarId, "");

  const res = sandbox.createCalendarFollowUp({
    leadType: "Technical Consultation / Session Booking",
    name: "John Doe",
    email: "john@example.com",
    requestId: "gn_req_123",
  });
  assert.equal(res.success, false);
  assert.equal(res.reason, "disabled");
});

test("testCalendarIntegration fails safely when dedicated test calendar ID is missing", () => {
  const { sandbox, calendarEvents, testCalendarEvents } = createGasSandbox();

  // Run test with no test calendar configured and no testCalendarId passed
  const res = sandbox.testCalendarIntegration();
  assert.equal(res.success, false);
  assert.equal(res.code, "MISSING_TEST_CALENDAR_ID");
  assert.ok(res.error.includes("Test calendar ID is missing"));

  // Crucial safety check: ZERO events created on ANY calendar
  assert.equal(calendarEvents.length, 0);
  assert.equal(testCalendarEvents.length, 0);
});

test("testCalendarIntegration rejects 'primary' or 'default' to protect production calendar", () => {
  const { sandbox, calendarEvents, testCalendarEvents } = createGasSandbox();

  const resPrimary = sandbox.testCalendarIntegration({ testCalendarId: "primary" });
  assert.equal(resPrimary.success, false);
  assert.equal(resPrimary.code, "INVALID_TEST_CALENDAR_ID");
  assert.ok(resPrimary.error.includes("cannot be 'primary'"));

  const resDefault = sandbox.testCalendarIntegration({ testCalendarId: "DEFAULT" });
  assert.equal(resDefault.success, false);
  assert.equal(resDefault.code, "INVALID_TEST_CALENDAR_ID");

  // Zero events created on default/primary calendar
  assert.equal(calendarEvents.length, 0);
  assert.equal(testCalendarEvents.length, 0);
});

test("testCalendarIntegration rejects test calendar ID matching production calendar ID", () => {
  const { sandbox, scriptProperties, calendarEvents, testCalendarEvents } = createGasSandbox();
  // Configure production calendar ID
  scriptProperties.set("CALENDAR_ID", "dedicated_test_cal@group.calendar.google.com");

  // Attempt to run test using the identical calendar ID
  const res = sandbox.testCalendarIntegration({
    testCalendarId: "dedicated_test_cal@group.calendar.google.com",
  });

  assert.equal(res.success, false);
  assert.equal(res.code, "TEST_CALENDAR_MATCHES_PRODUCTION");
  assert.ok(res.error.includes("matches the configured production calendar ID"));

  // Ensure zero events created on either calendar
  assert.equal(calendarEvents.length, 0);
  assert.equal(testCalendarEvents.length, 0);
});

test("testCalendarIntegration fails cleanly when test calendar ID is not found", () => {
  const { sandbox, calendarEvents, testCalendarEvents } = createGasSandbox();

  const res = sandbox.testCalendarIntegration({
    testCalendarId: "nonexistent_cal@group.calendar.google.com",
  });
  assert.equal(res.success, false);
  assert.equal(res.code, "TEST_CALENDAR_NOT_FOUND");
  assert.ok(res.error.includes("Dedicated test calendar not found"));

  assert.equal(calendarEvents.length, 0);
  assert.equal(testCalendarEvents.length, 0);
});

test("testCalendarIntegration works on dedicated test calendar without enabling production integration", () => {
  const { sandbox, testCalendarEvents, calendarEvents } = createGasSandbox();
  // Notice: CALENDAR_INTEGRATION_ENABLED is NOT enabled here!
  const res = sandbox.testCalendarIntegration({
    testCalendarId: "dedicated_test_cal@group.calendar.google.com",
    keepEvent: false,
  });

  assert.equal(res.success, true);
  assert.equal(res.calendarName, "GreenNext Automated Test Calendar");
  assert.equal(res.cleanupStatus, "cleaned_up");
  assert.equal(res.cleanupError, null);

  // Default calendar must remain completely untouched
  assert.equal(calendarEvents.length, 0);
  // Test event was created and then cleaned up from dedicated test calendar
  assert.equal(testCalendarEvents.length, 0);
});

test("testCalendarIntegration reports cleanup_failed clearly when event deletion fails", () => {
  const { sandbox, dedicatedTestCalendar, calendarEvents } = createGasSandbox();

  // Override createEvent on dedicated test calendar to simulate a deletion error
  const originalCreate = dedicatedTestCalendar.createEvent;
  dedicatedTestCalendar.createEvent = (title, startTime, endTime, options) => {
    const evt = originalCreate(title, startTime, endTime, options);
    evt.shouldFailDelete = true;
    return evt;
  };

  const res = sandbox.testCalendarIntegration({
    testCalendarId: "dedicated_test_cal@group.calendar.google.com",
    keepEvent: false,
  });

  assert.equal(res.success, true);
  assert.equal(res.cleanupStatus, "cleanup_failed");
  assert.ok(res.cleanupError.includes("event deletion rate limit exceeded"));
  assert.ok(res.eventId.length > 0);
  assert.equal(calendarEvents.length, 0);
});

test("testCalendarIntegration keeps test event when keepEvent is true", () => {
  const { sandbox, testCalendarEvents, calendarEvents } = createGasSandbox();

  const res = sandbox.testCalendarIntegration({
    testCalendarId: "dedicated_test_cal@group.calendar.google.com",
    keepEvent: true,
  });

  assert.equal(res.success, true);
  assert.equal(res.cleanupStatus, "retained");
  assert.equal(testCalendarEvents.length, 1);
  assert.ok(testCalendarEvents[0].title.startsWith("[TEST] [GreenNext Follow-up]"));
  assert.equal(calendarEvents.length, 0);
});

test("deduplication prevents duplicate events on retried and concurrent submissions", () => {
  const { sandbox, scriptProperties, calendarEvents } = createGasSandbox();
  scriptProperties.set("CALENDAR_INTEGRATION_ENABLED", "true");

  const payload = {
    leadType: "Technical Consultation / Session Booking",
    name: "Pooja Sharma",
    email: "pooja@example.com",
    phone: "+91 91234 56789",
    organization: "GreenNext Labs",
    topic: "AI Operations",
    message: "Consultation request.",
    page: "/contact",
    requestId: "gn_req_unique_99",
  };

  // First submission
  const firstRes = sandbox.createCalendarFollowUp(payload);
  assert.equal(firstRes.success, true);
  assert.equal(firstRes.duplicate, undefined);
  assert.equal(calendarEvents.length, 1);

  // Immediate retry submission with exact same requestId
  const retryRes = sandbox.createCalendarFollowUp(payload);
  assert.equal(retryRes.success, true);
  assert.equal(retryRes.duplicate, true);
  assert.equal(retryRes.requestId, "gn_req_unique_99");
  assert.equal(calendarEvents.length, 1);
});

test("calendar errors never bubble up to throw in safe wrapper", () => {
  const { sandbox, scriptProperties } = createGasSandbox({
    CalendarApp: {
      getDefaultCalendar: () => {
        throw new Error("Calendar service temporarily unavailable (OAuth quota exceeded)");
      },
    },
  });
  scriptProperties.set("CALENDAR_INTEGRATION_ENABLED", "true");

  const res = sandbox.createCalendarFollowUpSafely({
    leadType: "General Contact Inquiry",
    name: "Error Test",
    email: "error@example.com",
    requestId: "gn_req_err_01",
  });

  assert.equal(res.success, false);
  assert.ok(res.error.includes("Calendar service temporarily unavailable"));
});

test("createCalendarFollowUp fails safely and does not create event when script lock cannot be acquired", () => {
  const { sandbox, scriptProperties, calendarEvents } = createGasSandbox({
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          throw new Error("Lock timeout: Could not obtain lock after 10000 ms");
        },
        releaseLock: () => {},
      }),
    },
  });
  scriptProperties.set("CALENDAR_INTEGRATION_ENABLED", "true");

  const res = sandbox.createCalendarFollowUpSafely({
    leadType: "Technical Consultation / Session Booking",
    name: "Lock Contention Test",
    email: "lock.test@example.com",
    requestId: "gn_req_lock_01",
  });

  assert.equal(res.success, false);
  assert.ok(res.error.includes("Unable to acquire calendar script lock"));
  // Crucial: Zero events created without lock
  assert.equal(calendarEvents.length, 0);
});

test("next calendar day follow-up window defaults to 10:00 AM IST with 30-min duration", () => {
  const { sandbox } = createGasSandbox();
  const refDate = new Date("2026-10-13T10:00:00.000Z"); // 15:30 IST
  const window = sandbox.calculateNextDayFollowUpWindow("Asia/Kolkata", 10, 0, 30, refDate);

  assert.equal(window.isoDate, "2026-10-14");
  assert.equal(window.timezone, "Asia/Kolkata");
  assert.equal(window.endTime.getTime() - window.startTime.getTime(), 30 * 60 * 1000);
  assert.equal(window.startTime.getUTCHours(), 4);
  assert.equal(window.startTime.getUTCMinutes(), 30);
});

test("event details formatting includes all required metadata", () => {
  const { sandbox } = createGasSandbox();
  const payload = {
    leadType: "Technical Consultation / Session Booking",
    name: "Aravind Kumar",
    email: "aravind@example.com",
    phone: "+91 98765 43210",
    organization: "Tata Solar Infra",
    topic: "Energy Automation Architecture",
    message: "We need an assessment for 20MW microgrid telemetry.",
    page: "/infrastructure/energy",
    requestId: "gn_req_aravind_01",
  };

  const details = sandbox.buildCalendarEventDetails(payload);
  assert.equal(
    details.title,
    "[GreenNext Follow-up] Technical Consultation / Session Booking - Aravind Kumar (Tata Solar Infra)",
  );
  assert.ok(
    details.description.includes("Lead Type:        Technical Consultation / Session Booking"),
  );
  assert.ok(details.description.includes("Full Name:        Aravind Kumar"));
  assert.ok(details.description.includes("Email:            aravind@example.com"));
  assert.ok(details.description.includes("Phone:            +91 98765 43210"));
  assert.ok(details.description.includes("Organization:     Tata Solar Infra"));
  assert.ok(details.description.includes("Topic / Category: Energy Automation Architecture"));
  assert.ok(details.description.includes("Website Page:     /infrastructure/energy"));
  assert.ok(details.description.includes("Request ID:       gn_req_aravind_01"));
  assert.ok(details.description.includes("We need an assessment for 20MW microgrid telemetry."));
});

test("doGet status endpoint includes safe calendar diagnostic metadata", () => {
  const { sandbox } = createGasSandbox({
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (str) => ({
        setMimeType: () => str,
      }),
    },
  });

  const getResponse = JSON.parse(sandbox.doGet());
  assert.equal(getResponse.status, "online");
  assert.equal(getResponse.calendar.enabled, false);
  assert.equal(getResponse.calendar.timezone, "Asia/Kolkata");
  assert.equal(getResponse.calendar.defaultFollowUpTime, "10:00");
  assert.equal(getResponse.calendar.durationMinutes, 30);
});

// ─── Client-side Google Calendar Appointment Schedule Config Tests ─────────

const calendarConfigTs = fs.readFileSync(
  new URL("../src/data/calendarConfig.ts", import.meta.url),
  "utf8",
);
const compiledCalendarConfig = ts.transpileModule(calendarConfigTs, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const calendarConfigModule = await import(
  `data:text/javascript;base64,${Buffer.from(compiledCalendarConfig).toString("base64")}`
);
const { CALENDAR_SCHEDULE_CONFIG } = calendarConfigModule;

test("CALENDAR_SCHEDULE_CONFIG correctly validates official booking URL", () => {
  const originalRaw = CALENDAR_SCHEDULE_CONFIG.rawUrl;
  try {
    CALENDAR_SCHEDULE_CONFIG.rawUrl = "https://calendar.app.google/CQ6ohpdJDx85RgC96";
    assert.equal(CALENDAR_SCHEDULE_CONFIG.isConfigured(), true);
    assert.equal(
      CALENDAR_SCHEDULE_CONFIG.getAppointmentUrl(),
      "https://calendar.app.google/CQ6ohpdJDx85RgC96",
    );
  } finally {
    CALENDAR_SCHEDULE_CONFIG.rawUrl = originalRaw;
  }
});

test("CALENDAR_SCHEDULE_CONFIG safely handles empty, whitespace, and placeholder URLs", () => {
  const originalRaw = CALENDAR_SCHEDULE_CONFIG.rawUrl;
  const invalidOrPlaceholderInputs = [
    "",
    "   ",
    null,
    undefined,
    "PASTE_YOUR_CALENDAR_URL_HERE",
    "YOUR_CALENDAR_SCHEDULE",
    "#calendar-link",
    "javascript:void(0)",
    "not-a-valid-url",
  ];

  try {
    for (const input of invalidOrPlaceholderInputs) {
      CALENDAR_SCHEDULE_CONFIG.rawUrl = input;
      assert.equal(
        CALENDAR_SCHEDULE_CONFIG.isConfigured(),
        false,
        `Expected isConfigured() to be false for input: "${input}"`,
      );
      assert.equal(
        CALENDAR_SCHEDULE_CONFIG.getAppointmentUrl(),
        null,
        `Expected getAppointmentUrl() to be null for input: "${input}"`,
      );
    }
  } finally {
    CALENDAR_SCHEDULE_CONFIG.rawUrl = originalRaw;
  }
});

test("CALENDAR_SCHEDULE_CONFIG only accepts http or https protocols", () => {
  const originalRaw = CALENDAR_SCHEDULE_CONFIG.rawUrl;
  try {
    CALENDAR_SCHEDULE_CONFIG.rawUrl = "ftp://calendar.google.com/schedule";
    assert.equal(CALENDAR_SCHEDULE_CONFIG.isConfigured(), false);
    assert.equal(CALENDAR_SCHEDULE_CONFIG.getAppointmentUrl(), null);

    CALENDAR_SCHEDULE_CONFIG.rawUrl = "https://calendar.google.com/calendar/u/0/appointments/schedules/123";
    assert.equal(CALENDAR_SCHEDULE_CONFIG.isConfigured(), true);
    assert.equal(
      CALENDAR_SCHEDULE_CONFIG.getAppointmentUrl(),
      "https://calendar.google.com/calendar/u/0/appointments/schedules/123",
    );
  } finally {
    CALENDAR_SCHEDULE_CONFIG.rawUrl = originalRaw;
  }
});

test("local .env contains configured VITE_GOOGLE_CALENDAR_APPOINTMENT_URL matching public booking URL", () => {
  const envContent = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
  const match = envContent.match(/^VITE_GOOGLE_CALENDAR_APPOINTMENT_URL=(.*)$/m);
  assert.ok(match, "VITE_GOOGLE_CALENDAR_APPOINTMENT_URL must exist in .env");
  const configuredUrl = match[1].trim();
  assert.equal(configuredUrl, "https://calendar.app.google/CQ6ohpdJDx85RgC96");
});

