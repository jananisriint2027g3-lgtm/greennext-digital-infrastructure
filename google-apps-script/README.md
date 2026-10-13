# GreenNext Backend & Analytics Google Apps Script Integration

This directory contains the production-ready Google Apps Script backend (`Code.gs`) that powers the GreenNext digital infrastructure platform.

---

## 1. System Architecture

```
GreenNext Website (User Interactivity & Inquiry Forms)
      │
      ├── Telemetry & Form Submissions (JSON POST via fetch / sendBeacon)
      ▼
Google Apps Script Web App Endpoint (`doPost`)
      │
      ├── Writes raw events & inquiries
      ▼
Spreadsheet 1: GreenNext Raw Data (`1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY`)
  ├── 10 Behavioral Tabs (Navigation, Regions, Infrastructure, Energy, Automation,
  │                       Solutions, Industries, Locations, AI Assistant, CTA Interactions)
  ├── `Quick_Inquiries` (Dedicated quick-lead submissions)
  ├── `Contact_Submissions` (Dedicated consultative long-form inquiries)
  └── `Lead_Submissions` (Unified consultation & partnership leads)
      │
      ├── Immediate Team Notification Email (`MailApp.sendEmail`)
      │
      ├── Non-Blocking Follow-up Event Creation (`CalendarApp`) [Disabled by default]
      │   └── Schedules 30-min follow-up for next day at 10:00 AM IST (Asia/Kolkata)
      │
      ├── Derived Aggregation & Funnel Computation (`updateAnalyticsSpreadsheet`)
      ▼
Spreadsheet 2: GreenNext Analytics (`1OTeDPp9JP36ztYa3ZNcE6Ev221wQIQ9Bi094zoxcF18`)
  ├── `Executive_Summary` (Core KPIs, Sessions, Inquiries, Recent Lead Log)
  ├── `Regional_Analytics` (Madurai, Coimbatore, Trichy, Mangalore Breakdown)
  ├── `CTA_and_Funnel` (Conversion Funnel & CTA Click Distribution)
  ├── `Infrastructure_and_Energy` (Stack layers, Energy flow, and Automation nodes)
  └── `AI_Assistant_Telemetry` (Chatbot opens, sanitized topics, suggestions clicked)
```

---

## 2. Key Features

1. **Dual-Destination Ingestion**:
   - Captures form submissions into dedicated sheets (`Quick_Inquiries`, `Contact_Submissions`, `Lead_Submissions`) with complete contact parameters.
   - Simultaneously writes a privacy-safe high-intent event to `CTA Interactions` (with no PII) to preserve unified behavioral tracking.
2. **Google Calendar Follow-Up Integration**:
   - Creates a 30-minute follow-up calendar event for the **next calendar day at 10:00 AM IST (`Asia/Kolkata`)** whenever a new lead or enquiry is recorded.
   - Includes lead type, name, email, phone, organization, topic/category, message summary, source page, and request ID.
   - Uses native `CalendarApp` under the script owner's authorization, without external OAuth tokens or secrets in frontend code.
   - **Disabled by default**: Safe to deploy without immediate calendar side effects until explicitly configured and enabled.
   - **Multi-layer Deduplication**: Combines in-memory cache keys (`gn_cal_req_<requestId>`) and calendar window event searches by `requestId` to prevent duplicate events on retried requests.
   - **Strict Error Isolation**: Calendar failures are trapped safely and **never prevent** an enquiry from being recorded in Google Sheets or lead notification emails from being sent.
3. **Controlled Report Email Automation**:
   - Existing daily, weekly, and monthly report runners use `MailApp.sendEmail()` when approved time-driven triggers are configured.
   - Lead submission notification emails remain separate from scheduled aggregate report deliveries.
4. **Resilient Backward & Forward Compatibility**:
   - Supports existing 5-column behavioral tabs without disrupting historical data.
   - Preserves all spreadsheet schemas, validation, and privacy protections.

---

## 3. How to Deploy the Apps Script

1. Open **Spreadsheet 1 (Raw Data)** in Google Sheets:
   - URL: `https://docs.google.com/spreadsheets/d/1X4gGWCFfs48gcTcapB1LNb-5ieThCPNO35uXGRJNdoY/edit`
2. Navigate to **Extensions > Apps Script** in the top menu.
3. Replace the existing code in the editor with the complete contents of `google-apps-script/Code.gs`.
4. Click **Save** (💾 icon).
5. Click **Deploy > Manage deployments**:
   - Click the pencil icon (**Edit**) on the active Web app deployment.
   - Under **Version**, select **New version**.
   - Click **Deploy**.

---

## 4. Google Calendar Authorization, Testing & Activation

The Google Calendar integration is **disabled by default**. Follow these steps to authorize, test, and enable it safely:

### Step 1: Authorize Google Calendar Access
1. In the Apps Script editor, open the function drop-down in the top toolbar.
2. Select `getCalendarIntegrationStatus`.
3. Click **Run**.
4. Google will display an **"Authorization required"** prompt:
   - Click **Review permissions**.
   - Select your Google account (the deployment owner).
   - If prompted with "Google hasn't verified this app", click **Advanced** > **Go to GreenNext... (unsafe)**.
   - Review requested scopes (Google Sheets, Gmail/Mail, and Google Calendar).
   - Click **Allow**.
5. The Execution log will output the diagnostic status confirming `calendarAppAuthorized: true`.

### Step 2: Run a Safe Diagnostic Test (Requires Dedicated Test Calendar)
To guarantee your default/primary calendar is never cluttered with test artifacts, `testCalendarIntegration()` strictly requires an explicitly configured, dedicated secondary test calendar. It will reject execution if run without one, or if set to "primary":

1. In [Google Calendar](https://calendar.google.com), click the **+** next to "Other calendars" > **Create new calendar** (e.g. `GreenNext Test Events`).
2. Go to the new calendar's **Settings** and copy its **Calendar ID** (looks like `c_xxxxxxxx@group.calendar.google.com`).
3. In the Apps Script editor, you can test event creation without enabling production Calendar integration:
   - Run the diagnostic test passing your test calendar ID:
     ```javascript
     testCalendarIntegration({
       testCalendarId: "your_test_calendar_id@group.calendar.google.com",
       keepEvent: false // automatically deletes the event after verification
     });
     ```
   - Alternatively, configure the test calendar once via script property `CALENDAR_TEST_ID`:
     ```javascript
     configureCalendarIntegration({
       testCalendarId: "your_test_calendar_id@group.calendar.google.com"
     });
     // Then you can simply run testCalendarIntegration() directly
     testCalendarIntegration();
     ```
4. Inspect the Execution log:
   - Confirms connection to the test calendar (`[TEST] [GreenNext Follow-up] ...`).
   - Confirms event creation ID and safe clean-up (`cleanupStatus: "cleaned_up"`).
   - If event deletion fails due to Google rate limits or permissions, it explicitly logs `cleanupStatus: "cleanup_failed"` and provides the event ID so it can be reviewed.
   - If you wish to retain the event on your test calendar for visual inspection in Google Calendar, pass `keepEvent: true`:
     ```javascript
     testCalendarIntegration({ keepEvent: true });
     ```

### Step 3: Enable the Production Integration
Once authorization and diagnostic testing on the dedicated test calendar have succeeded, enable the integration for live website submissions:

#### Option A: Run Helper Function in Apps Script Editor (Recommended)
Run the following helper in the Apps Script editor:
```javascript
configureCalendarIntegration({
  enabled: true,
  // Leave calendarId empty to use your default/primary calendar, or specify an ID
  calendarId: "",
  timezone: "Asia/Kolkata",
  followUpHour: 10,       // 10:00 AM
  followUpMinute: 0,
  durationMinutes: 30     // 30 minutes
});
```

#### Option B: Configure Script Properties Manually
1. In the Apps Script left sidebar, click **Project Settings** (gear icon ⚙️).
2. Scroll down to **Script Properties** and click **Add script property**.
3. Add the following:
   - `CALENDAR_INTEGRATION_ENABLED`: `true`
   - `CALENDAR_TEST_ID`: `your_test_calendar_id@group.calendar.google.com` (for safe future diagnostic testing)
   - `CALENDAR_TIMEZONE`: `Asia/Kolkata` (optional, defaults to `Asia/Kolkata`)
   - `CALENDAR_ID`: (optional, leave blank to use the primary calendar)
   - `CALENDAR_FOLLOWUP_HOUR`: `10` (optional, defaults to 10)
   - `CALENDAR_FOLLOWUP_DURATION_MINUTES`: `30` (optional, defaults to 30)
4. Click **Save script properties**.

### Step 4: Verify Deployment Status
You can verify the live deployment status at any time by performing an HTTP GET on the Apps Script web app endpoint:
```
GET https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```
Response:
```json
{
  "status": "online",
  "system": "GreenNext Digital Infrastructure Data Platform",
  "version": "2.1.0",
  "calendar": {
    "enabled": true,
    "timezone": "Asia/Kolkata",
    "defaultFollowUpTime": "10:00",
    "durationMinutes": 30
  }
}
```

---

## 5. Deduplication & Safety Guarantees

- **Deduplication Strategy**:
  - Every website submission generates a unique cryptographic Request ID (`requestId`).
  - When a submission arrives, `Code.gs` first checks `CacheService` for recent requests with that ID.
  - Next, it searches the target calendar within a +/- 24-hour window for any event containing that Request ID.
  - If a match is found, duplicate event creation is skipped and logged.
- **Fail-Safe Operation**:
  - `createCalendarFollowUpSafely` wraps the entire calendar process in an isolated `try/catch`.
  - In the event of Calendar quota limits, temporary Google API errors, or missing permissions, the enquiry submission is **still recorded in Google Sheets** and the **team email notification is still delivered**.
