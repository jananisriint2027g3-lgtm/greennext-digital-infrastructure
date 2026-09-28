import {
  createJiraConnectionTestSubtask,
  createJiraConnectionTestTask,
  getJiraCurrentUser,
  getJiraProjectIssueTypes,
  findJiraUsersByDisplayName,
  JiraRequestError,
} from "../src/lib/jira.server.ts";

const [kind, parentKey] = process.argv.slice(2);

try {
  if (kind === "metadata") {
    const metadata = await getJiraProjectIssueTypes();
    console.log(JSON.stringify(metadata, null, 2));
  } else if (kind === "current-user") {
    const user = await getJiraCurrentUser();
    console.log(
      JSON.stringify({ accountId: user.accountId, displayName: user.displayName }, null, 2),
    );
  } else if (kind === "find-ruba") {
    const users = await findJiraUsersByDisplayName("Ruba Dharshini M");
    console.log(
      JSON.stringify(
        users.map(({ accountId, displayName }) => ({ accountId, displayName })),
        null,
        2,
      ),
    );
  } else if (kind === "parent") {
    const issue = await createJiraConnectionTestTask();
    console.log(JSON.stringify(issue, null, 2));
  } else if (kind === "subtask" && parentKey && /^[A-Z][A-Z0-9_]*-\d+$/.test(parentKey)) {
    const issue = await createJiraConnectionTestSubtask(parentKey);
    console.log(JSON.stringify(issue, null, 2));
  } else {
    console.error("Usage: current-user | find-ruba | metadata | parent | subtask <parent-key>");
    process.exitCode = 1;
  }
} catch (error) {
  if (error instanceof JiraRequestError) {
    console.error(
      JSON.stringify(
        {
          status: error.status,
          requestPath: error.requestPath,
          jiraResponse: error.responseBody,
          requestPayload: error.requestPayload,
        },
        null,
        2,
      ),
    );
  } else {
    console.error(error instanceof Error ? error.message : "Jira test failed.");
  }
  process.exitCode = 1;
}
