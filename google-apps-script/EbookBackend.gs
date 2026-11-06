/**
 * ============================================================================
 * GreenNext - Ebook Authentication, Activity & Email Module (Apps Script)
 * ============================================================================
 *
 * Add this script to your GreenNext Apps Script project (File > + > Script, name EbookBackend).
 * In Code.gs doPost(), add the following routes:
 *
 *   if (payload.action === "ebook_dispatch_email") return handleEbookDispatchEmailAction(payload);
 *   if (payload.action === "ebook_sync_user") return handleEbookSyncUserAction(payload);
 *   if (payload.action === "ebook_log_activity") return handleEbookLogActivityAction(payload);
 *
 * Security:
 * - Requires payload.secret === Script Property VISITOR_EMAIL_SECRET, or the
 *   legacy REPORT_TRIGGER_SECRET when the dedicated property is absent.
 * - Enforces LockService locks to prevent concurrency race conditions.
 * - Logs all email attempts in the existing 'Email_Log' tab.
 * - Creates 'Ebook_Users' and 'Ebook_Activity' tabs automatically if absent.
 */

var EBOOK_USERS_SHEET = "Ebook_Users";
var EBOOK_USERS_HEADERS = [
  "User_ID", "Full_Name", "Email", "Auth_Method", "Registration_Date",
  "Last_Login", "Email_Verified", "Account_Status", "Ebook_Access", "Welcome_Email_Status"
];

var EBOOK_ACTIVITY_SHEET = "Ebook_Activity";
var EBOOK_ACTIVITY_HEADERS = [
  "Event_ID", "User_ID", "Event_Type", "Ebook_Version", "Timestamp", "Status", "Metadata"
];

/**
 * Dispatches Ebook OTP or Welcome emails via MailApp and logs results to Email_Log.
 */
function handleEbookDispatchEmailAction(payload) {
  var props = PropertiesService.getScriptProperties();
  var storedSecret = props.getProperty("VISITOR_EMAIL_SECRET") || props.getProperty("REPORT_TRIGGER_SECRET");
  if (!storedSecret) {
    return jsonResponse(false, "REPORT_TRIGGER_SECRET is not configured in Script Properties.", { status: "not_configured" });
  }
  if (!visitorEmailSecureEquals(String(payload && payload.secret || "").trim(), String(storedSecret).trim())) {
    return jsonResponse(false, "Unauthorized.", { status: "unauthorized" });
  }

  var subAction = String(payload.subAction || "otp");
  var email = String(payload.email || "").trim().toLowerCase();
  var name = String(payload.name || "Reader").trim();
  var requestId = String(payload.requestId || ("gn_ebk_" + Date.now()));
  var formType = subAction === "otp" ? "ebook_otp" : "ebook_welcome";

  if (!email || email.indexOf("@") === -1) {
    return jsonResponse(false, "Invalid recipient email address.", { status: "invalid" });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lockErr) {
    return jsonResponse(false, "Mail service busy; not sent.", { status: "failed" });
  }

  try {
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    var logSheet = getOrCreateSheet(rawSs, VISITOR_EMAIL_LOG_SHEET, VISITOR_EMAIL_LOG_HEADERS);

    // For Welcome email: Deduplication check so it's sent only once per recipient
    if (subAction === "welcome") {
      var lastRow = logSheet.getLastRow();
      if (lastRow > 1) {
        var logs = logSheet.getRange(2, 1, lastRow - 1, 5).getValues();
        var maskedTarget = maskEmailForLog(email);
        for (var i = 0; i < logs.length; i++) {
          if (logs[i][2] === "ebook_welcome" && logs[i][3] === maskedTarget && logs[i][4] === "SENT") {
            return jsonResponse(true, "Welcome email already delivered to this reader.", {
              status: "already_sent",
              duplicate: true
            });
          }
        }
      }
    }

    // Quota check
    var quota = MailApp.getRemainingDailyQuota();
    if (quota <= 0) {
      visitorEmailWriteLog(logSheet, 0, requestId, formType, email, "FAILED", "", quota, "Daily MailApp quota exhausted");
      return jsonResponse(false, "Daily email quota exhausted.", { status: "quota_exhausted" });
    }

    var logRow = visitorEmailWriteLog(logSheet, 0, requestId, formType, email, "SENDING", "", quota, "");

    // Send email
    var subject = String(payload.subject || (subAction === "otp" ? "Your GreenNext Verification Code" : "Welcome to GreenNext Ebook"));
    var htmlBody = String(payload.htmlBody || "");
    var plainText = String(payload.plainText || "");

    var mailOptions = {
      to: email,
      subject: subject,
      body: plainText || htmlBody.replace(/<[^>]+>/g, " "),
      htmlBody: htmlBody,
      name: PropertiesService.getScriptProperties().getProperty("VISITOR_EMAIL_SENDER_NAME") || "GreenNext"
    };

    var replyTo = PropertiesService.getScriptProperties().getProperty("VISITOR_EMAIL_REPLY_TO");
    if (replyTo) mailOptions.replyTo = replyTo;

    MailApp.sendEmail(mailOptions);

    var deliveryRef = "mailapp_ebook_" + Date.now();
    var remainingQuota = MailApp.getRemainingDailyQuota();
    visitorEmailWriteLog(logSheet, logRow, requestId, formType, email, "SENT", deliveryRef, remainingQuota, "");

    return jsonResponse(true, "Ebook email dispatched successfully.", {
      status: "sent",
      deliveryRef: deliveryRef
    });
  } catch (err) {
    if (logSheet && logRow) {
      visitorEmailWriteLog(logSheet, logRow, requestId, formType, email, "FAILED", "", MailApp.getRemainingDailyQuota(), err.toString());
    }
    return jsonResponse(false, "Failed to send email: " + err.toString(), { status: "failed" });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Creates or updates reader records in Ebook_Users tab.
 */
function handleEbookSyncUserAction(payload) {
  var props = PropertiesService.getScriptProperties();
  var storedSecret = props.getProperty("VISITOR_EMAIL_SECRET") || props.getProperty("REPORT_TRIGGER_SECRET");
  if (!storedSecret) {
    return jsonResponse(false, "REPORT_TRIGGER_SECRET is not configured.", { status: "not_configured" });
  }
  if (!visitorEmailSecureEquals(String(payload && payload.secret || "").trim(), String(storedSecret).trim())) {
    return jsonResponse(false, "Unauthorized.", { status: "unauthorized" });
  }

  var uid = String(payload.uid || "").trim();
  var email = String(payload.email || "").trim().toLowerCase();
  var name = String(payload.name || "").trim();
  var authMethod = String(payload.authMethod || "password").trim();
  var emailVerified = payload.emailVerified === true || payload.emailVerified === "true";
  var now = new Date().toISOString();

  if (!uid || !email) {
    return jsonResponse(false, "UID and email are required to sync user record.", { status: "invalid" });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return jsonResponse(false, "Database busy.", { status: "failed" });
  }

  try {
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    var sheet = getOrCreateSheet(rawSs, EBOOK_USERS_SHEET, EBOOK_USERS_HEADERS);
    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow > 1) {
      var uids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < uids.length; i++) {
        if (String(uids[i][0]).trim() === uid) {
          existingRowIndex = i + 2;
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // Update existing record
      sheet.getRange(existingRowIndex, 6).setValue(now); // Last_Login
      if (emailVerified) {
        sheet.getRange(existingRowIndex, 7).setValue(true); // Email_Verified
        sheet.getRange(existingRowIndex, 9).setValue("GRANTED"); // Ebook_Access
      }
      if (payload.welcomeEmailSent === true) {
        sheet.getRange(existingRowIndex, 10).setValue("SENT");
      }
      return jsonResponse(true, "Reader record updated.", { status: "updated", isNew: false });
    } else {
      // Insert new record
      var newRow = [
        uid,
        name || "Reader",
        email,
        authMethod,
        now, // Registration_Date
        now, // Last_Login
        emailVerified,
        "ACTIVE",
        emailVerified ? "GRANTED" : "PENDING_VERIFICATION",
        payload.welcomeEmailSent === true ? "SENT" : "PENDING"
      ];
      sheet.appendRow(newRow);
      return jsonResponse(true, "New reader record created.", { status: "created", isNew: true });
    }
  } catch (err) {
    return jsonResponse(false, "Failed to sync user: " + err.toString(), { status: "failed" });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Appends reader interaction audit events to Ebook_Activity tab.
 */
function handleEbookLogActivityAction(payload) {
  var props = PropertiesService.getScriptProperties();
  var storedSecret = props.getProperty("VISITOR_EMAIL_SECRET") || props.getProperty("REPORT_TRIGGER_SECRET");
  if (!storedSecret) {
    return jsonResponse(false, "REPORT_TRIGGER_SECRET is not configured.", { status: "not_configured" });
  }
  if (!visitorEmailSecureEquals(String(payload && payload.secret || "").trim(), String(storedSecret).trim())) {
    return jsonResponse(false, "Unauthorized.", { status: "unauthorized" });
  }

  var eventId = String(payload.eventId || ("gn_ev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)));
  var uid = String(payload.uid || "anonymous");
  var eventType = String(payload.eventType || "unknown");
  var status = String(payload.status || "SUCCESS");
  var metadata = typeof payload.metadata === "object" ? JSON.stringify(payload.metadata) : String(payload.metadata || "");

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return jsonResponse(false, "Database busy.", { status: "failed" });
  }

  try {
    var rawSs = SpreadsheetApp.openById(RAW_DATA_SPREADSHEET_ID);
    var sheet = getOrCreateSheet(rawSs, EBOOK_ACTIVITY_SHEET, EBOOK_ACTIVITY_HEADERS);
    var row = [
      eventId,
      uid,
      eventType,
      "2.0",
      new Date().toISOString(),
      status,
      metadata
    ];
    sheet.appendRow(row);
    return jsonResponse(true, "Activity logged.", { status: "logged", eventId: eventId });
  } catch (err) {
    return jsonResponse(false, "Failed to log activity: " + err.toString(), { status: "failed" });
  } finally {
    lock.releaseLock();
  }
}

function maskEmailForLog(email) {
  var s = String(email || "").trim().toLowerCase();
  var at = s.indexOf("@");
  if (at <= 1) return s;
  return s.charAt(0) + "***@" + s.slice(at + 1);
}

