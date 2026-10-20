# Visitor confirmation email via Google Apps Script (Gmail/MailApp)

Flow: form submit → site posts to Apps Script (Sheets row saved) → site server calls
`dispatch_email` (same web app, shared secret) → Apps Script verifies the saved row,
renders the GreenNext template, sends via `MailApp`, records the outcome in the
`Email_Log` sheet of the raw-data spreadsheet.

## One-time setup (Apps Script)

1. Open the existing GreenNext Apps Script project (the one bound to the `/exec` URL used by the site).
2. Replace `Code.gs` with the repo's `google-apps-script/Code.gs` (only change: a `dispatch_email` route in `doPost`).
3. **File → + → Script**, name it `VisitorEmail`, paste `google-apps-script/VisitorEmail.gs`. Save (Ctrl+S).
4. **Project Settings → Script properties**: confirm `REPORT_TRIGGER_SECRET` exists (create a long random value if not; do not share it in chat).
   Optional: `VISITOR_EMAIL_REPLY_TO`, `VISITOR_EMAIL_SENDER_NAME`, `PUBLIC_WEBSITE_URL`.
5. Select function `authorizeVisitorEmail` → **Run** → accept the Google permission prompt
   (Gmail send + Sheets). Check the log: quota remaining and spreadsheet name are printed. Nothing is sent.
6. Optional sanity check: run `sendTestVisitorEmail` – sends a sample to the signed-in Google account.
7. **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy.**
   Keep *Execute as: Me* and the same URL. (Saving code alone does NOT update the live `/exec` URL.)

## Vercel (Project → Settings → Environment Variables → Production)

| Name | Value |
|------|-------|
| `REPORT_APPS_SCRIPT_URL` (or `VISITOR_EMAIL_APPS_SCRIPT_URL`) | the `/exec` URL from step 7 (same as `ANALYTICS_APPS_SCRIPT_URL`) |
| `REPORT_TRIGGER_SECRET` (or `VISITOR_EMAIL_SECRET`) | exact value of the Script Property `REPORT_TRIGGER_SECRET` |

Then **Redeploy** (env changes apply only to new deployments). `RESEND_*` / `EMAIL_*` variables are no longer needed.

## Verify end to end

1. Submit the Quick Inquiry form on https://greennext-ai.vercel.app using an inbox you can open.
2. Sheet `Quick_Inquiries` gets the row; sheet `Email_Log` gets a row with status `SENT` (or `FAILED` + safe error).
3. Vercel → Logs: `[visitor-email] sent via apps_script` (or the failure reason; never the secret).
4. Check the inbox (and Spam). Repeat for the Long form and a Lead form.

## Manual fallback (no Vercel/website needed)

In the spreadsheet, click a row in `Quick_Inquiries` / `Contact_Submissions` / `Lead_Submissions`,
then in the Apps Script editor run `manualSendConfirmationForActiveRow`. Uses the same duplicate log.

## Limits and notes

- Consumer Gmail: ~100 MailApp emails/day (Workspace ~1500). Quota exhaustion is reported as `quota_exhausted`.
- The email is sent *from the Google account that owns/deploys the script*; `MailApp` returns no message ID,
  so `Email_Log` stores a timestamp reference and the status, not a provider message ID.
- The endpoint is not an open relay: shared secret + the request must exist in a saved sheet row with the same email + one send per request ID.
- Keep `VisitorEmail.gs` in sync with `src/lib/email-templates/visitor-welcome-template.ts`
  (`tests/visitor-email-apps-script.test.mjs` fails if they diverge).
