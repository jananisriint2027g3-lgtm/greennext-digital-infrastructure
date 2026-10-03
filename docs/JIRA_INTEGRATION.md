# GreenNext Jira integration

This integration is a server-only Jira REST API v3 workflow. When explicitly enabled in the server environment, inquiry submissions can create or reuse a parent Task and its follow-up subtasks.

## Configuration

The server reads Jira settings from the project-root `.env` file. The committed `.env.example` contains only empty placeholders:

```dotenv
JIRA_BASE_URL=https://trustworkz.atlassian.net
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=DI
JIRA_ENABLED=false
JIRA_PARENT_ISSUE_TYPE=
JIRA_JANANI_ACCOUNT_ID=
JIRA_RUBA_ACCOUNT_ID=
```

Create the local file from the example, then set `JIRA_EMAIL` to the Jira account email and `JIRA_API_TOKEN` to the token generated for that account. The assignment workflow also requires the Atlassian account IDs in `JIRA_JANANI_ACCOUNT_ID` and `JIRA_RUBA_ACCOUNT_ID`; these are account ID strings, not API tokens. Never put any of these values in source code or a `VITE_*` variable. `.env` is ignored by Git.

`JIRA_ENABLED=false` is the safe default. With this value, technical infrastructure inquiries still submit to Google Sheets, but the website does not create Jira issues. Set it to `true` only in the server/deployment environment when production Jira creation is approved.

## Safe connection test

From the project root, create exactly one parent Task with this explicit local-only command:

```powershell
node --env-file=.env --experimental-strip-types scripts/jira-test.ts parent
```

The command prints the created Jira issue key and ID. Verify the issue in the Trustworkz project at `https://trustworkz.atlassian.net/browse/<issue-key>`; it should use the project-supported parent issue type with the `jira-api-test` label, Medium priority, and a `TEST –` summary.

After the parent test succeeds, create exactly one subtask by replacing `DI-123` with the returned parent key:

```powershell
$parentKey = 'DI-123'
node --env-file=.env --experimental-strip-types scripts/jira-test.ts subtask $parentKey
```

These requests must be run manually. No website form invokes them.

## Manual infrastructure workflow test

After configuring both assignee account IDs, create one sample parent Task and its five subtasks with:

```powershell
node --env-file=.env --experimental-strip-types scripts/jira-infrastructure-test.ts
```

The command prints the parent key and all five subtask keys. It does not run when the dev server starts and is not called by any inquiry form.

To test with a saved inquiry-shaped JSON payload instead of the built-in sample, run:

```powershell
node --env-file=.env --experimental-strip-types scripts/jira-infrastructure-test.ts --payload-file .\\local-technical-inquiry.json
```

This manual script is the controlled real-payload test path. It is separate from website submissions and is never started automatically.

## Production submission behavior

Inquiry submission functions invoke the server-side Jira submission function only after the Google Sheets/analytics request succeeds. Jira creation is disabled by default and is best enabled only in a controlled staging or production environment.

The server adds a deterministic idempotency label derived from the inquiry payload. On a retry of the same payload, it finds the existing parent and reuses existing subtasks by summary, creating only any missing subtasks.

If Jira is disabled, the original Google Sheets result is returned unchanged. If Jira is enabled but fails, the inquiry remains successful from the website's perspective and the response indicates that Jira follow-up is pending; the server logs only a safe failure summary. Jira failure never replaces or rolls back the Google Sheets submission.

## Token rotation

If the token is exposed or needs to be replaced, revoke it in the Jira account's API-token settings, create a replacement, update only the local/deployment secret store, and restart the server. Do not commit `.env` or print the token in logs.

## Jira setup still required

The Jira account must have permission to browse the `DI` project, create the project-supported parent and subtask issue types, and assign issues to both configured account IDs. The account's email and API token must belong to the same Atlassian account. The exact assignment configuration variables are `JIRA_JANANI_ACCOUNT_ID` and `JIRA_RUBA_ACCOUNT_ID`.
