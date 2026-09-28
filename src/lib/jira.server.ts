export interface JiraIssueRef {
  id: string;
  key: string;
  self?: string;
  fields?: { summary?: string };
}

export interface JiraCurrentUser {
  accountId: string;
  displayName: string;
}

export interface JiraIssueFields {
  summary: string;
  description: string;
  priority?: string;
  labels?: string[];
  assigneeAccountId?: string;
}

export interface TechnicalInfrastructureInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  region: string;
  category: string;
  message: string;
  page?: string;
  sessionId?: string;
  timestamp?: string;
  document?: { fileName: string } | string | null;
}

export interface TechnicalInfrastructureInquiryWorkflowResult {
  parent: JiraIssueRef;
  subtasks: Array<{ summary: string; issue: JiraIssueRef }>;
}

export interface UpdateJiraIssueInput {
  summary?: string;
  description?: string;
  priority?: string;
  labels?: string[];
}

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface JiraCreateIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

interface JiraCreateIssueTypesResponse {
  issueTypes: JiraCreateIssueType[];
}

interface JiraSearchResponse {
  issues: JiraIssueRef[];
}

export class JiraRequestError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  readonly requestPath: string;
  requestPayload?: unknown;

  constructor(
    status: number,
    requestPath: string,
    responseBody: unknown,
    requestPayload?: unknown,
  ) {
    super(`Jira request failed with status ${status}.`);
    this.status = status;
    this.requestPath = requestPath;
    this.responseBody = responseBody;
    this.requestPayload = requestPayload;
    this.name = "JiraRequestError";
  }
}

function getServerEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[name];
}

export function isJiraEnabled(): boolean {
  return getServerEnv("JIRA_ENABLED")?.trim().toLowerCase() === "true";
}

function getRequiredConfig(): JiraConfig {
  const baseUrl = getServerEnv("JIRA_BASE_URL")?.trim();
  const email = getServerEnv("JIRA_EMAIL")?.trim();
  const apiToken = getServerEnv("JIRA_API_TOKEN")?.trim();
  const projectKey = getServerEnv("JIRA_PROJECT_KEY")?.trim() || "KAN";

  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error("Jira integration is not configured on the server.");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), email, apiToken, projectKey };
}

function getRequiredWorkflowAssignees(): { jananiAccountId: string; rubaAccountId: string } {
  const jananiAccountId = getServerEnv("JIRA_JANANI_ACCOUNT_ID")?.trim();
  const rubaAccountId = getServerEnv("JIRA_RUBA_ACCOUNT_ID")?.trim();

  if (!jananiAccountId || !rubaAccountId) {
    throw new Error(
      "Technical infrastructure Jira workflow requires JIRA_JANANI_ACCOUNT_ID and JIRA_RUBA_ACCOUNT_ID.",
    );
  }

  return { jananiAccountId, rubaAccountId };
}

function encodeBasicAuth(email: string, apiToken: string): string {
  const credentials = `${email}:${apiToken}`;
  if (typeof btoa === "function") return btoa(credentials);
  return Buffer.from(credentials, "utf8").toString("base64");
}

async function jiraRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getRequiredConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encodeBasicAuth(config.email, config.apiToken)}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let responseBody: unknown = responseText;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Preserve a non-JSON Jira response as text.
    }

    let requestPayload: unknown;
    if (typeof init.body === "string") {
      try {
        requestPayload = JSON.parse(init.body);
      } catch {
        requestPayload = "[non-JSON request body]";
      }
    }

    throw new JiraRequestError(response.status, path, responseBody, requestPayload);
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function issueDescription(text: string) {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

function issueFields(
  config: JiraConfig,
  input: JiraIssueFields,
  issueType: string | { name: string } | { id: string },
  parentKey?: string,
) {
  return {
    project: { key: config.projectKey },
    summary: input.summary,
    description: issueDescription(input.description),
    issuetype: typeof issueType === "string" ? { name: issueType } : issueType,
    ...(input.priority ? { priority: { name: input.priority } } : {}),
    ...(input.labels ? { labels: input.labels } : {}),
    ...(input.assigneeAccountId ? { assignee: { accountId: input.assigneeAccountId } } : {}),
    ...(parentKey ? { parent: { key: parentKey } } : {}),
  };
}

async function getProjectSubtaskIssueType(config: JiraConfig): Promise<JiraCreateIssueType> {
  const metadata = await jiraRequest<JiraCreateIssueTypesResponse>(
    `/rest/api/3/issue/createmeta/${encodeURIComponent(config.projectKey)}/issuetypes`,
  );
  const subtaskType = metadata.issueTypes.find((issueType) => issueType.subtask);

  if (!subtaskType) {
    throw new Error(`No subtask issue type is available for Jira project ${config.projectKey}.`);
  }

  return subtaskType;
}

async function createIdempotencyLabel(
  payload: TechnicalInfrastructureInquiryPayload,
): Promise<string> {
  const canonicalPayload = [
    payload.name,
    payload.email,
    payload.phone || "",
    payload.organization || "",
    payload.region,
    payload.category,
    payload.message,
    payload.page || "",
    payload.sessionId || "",
    payload.timestamp || "",
    typeof payload.document === "string" ? payload.document : payload.document?.fileName || "",
  ]
    .map((value) => value.trim())
    .join("\u001f");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `lead-inquiry-id-${hash}`;
}

async function findIssueByLabel(
  config: JiraConfig,
  label: string,
): Promise<JiraIssueRef | undefined> {
  const jql = `project = ${config.projectKey} AND labels = ${label} AND issuetype = Task`;
  const result = await jiraRequest<JiraSearchResponse>(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=1&fields=summary`,
  );
  return result.issues[0];
}

async function findSubtasks(config: JiraConfig, parentKey: string): Promise<JiraIssueRef[]> {
  const jql = `project = ${config.projectKey} AND parent = ${parentKey}`;
  const result = await jiraRequest<JiraSearchResponse>(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary`,
  );
  return result.issues;
}

export async function getJiraProjectIssueTypes(): Promise<{
  projectKey: string;
  issueTypes: JiraCreateIssueType[];
}> {
  const config = getRequiredConfig();
  const metadata = await jiraRequest<JiraCreateIssueTypesResponse>(
    `/rest/api/3/issue/createmeta/${encodeURIComponent(config.projectKey)}/issuetypes`,
  );
  return { projectKey: config.projectKey, issueTypes: metadata.issueTypes };
}

export async function getJiraCurrentUser(): Promise<JiraCurrentUser> {
  return jiraRequest<JiraCurrentUser>("/rest/api/3/myself");
}

export async function findJiraUsersByDisplayName(displayName: string): Promise<JiraCurrentUser[]> {
  const users = await jiraRequest<JiraCurrentUser[]>(
    `/rest/api/3/user/search?query=${encodeURIComponent(displayName)}`,
  );
  return users.filter((user) => user.displayName === displayName);
}

export async function createJiraTask(input: JiraIssueFields): Promise<JiraIssueRef> {
  const config = getRequiredConfig();
  return jiraRequest<JiraIssueRef>("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({ fields: issueFields(config, input, "Task") }),
  });
}

export async function createJiraSubtask(
  parentKey: string,
  input: JiraIssueFields,
): Promise<JiraIssueRef> {
  const config = getRequiredConfig();
  const subtaskType = await getProjectSubtaskIssueType(config);
  const payload = { fields: issueFields(config, input, { id: subtaskType.id }, parentKey) };

  try {
    return await jiraRequest<JiraIssueRef>("/rest/api/3/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof JiraRequestError) {
      error.requestPayload = payload;
    }
    throw error;
  }
}

export async function assignJiraIssue(issueKey: string, accountId: string): Promise<void> {
  await jiraRequest<void>(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
    method: "PUT",
    body: JSON.stringify({ fields: { assignee: { accountId } } }),
  });
}

export async function updateJiraIssue(
  issueKey: string,
  input: UpdateJiraIssueInput,
): Promise<void> {
  const fields = {
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.description ? { description: issueDescription(input.description) } : {}),
    ...(input.priority ? { priority: { name: input.priority } } : {}),
    ...(input.labels ? { labels: input.labels } : {}),
  };
  await jiraRequest<void>(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export async function createJiraConnectionTestTask(): Promise<JiraIssueRef> {
  return createJiraTask({
    summary: "TEST – GreenNext Jira API Connection",
    description:
      "This is a test issue created while validating the GreenNext Jira API integration.",
    priority: "Medium",
    labels: ["jira-api-test"],
  });
}

export async function createJiraConnectionTestSubtask(parentKey: string): Promise<JiraIssueRef> {
  return createJiraSubtask(parentKey, {
    summary: "TEST – Review Jira API Connection",
    description:
      "This is a test subtask created while validating the GreenNext Jira API integration.",
    priority: "Medium",
    labels: ["jira-api-test"],
  });
}

function formatInfrastructureDescription(payload: TechnicalInfrastructureInquiryPayload): string {
  const documentName =
    typeof payload.document === "string" ? payload.document : payload.document?.fileName || "None";

  return `TECHNICAL INFRASTRUCTURE INQUIRY

CONTACT DETAILS
Name: ${payload.name}
Email: ${payload.email}
Phone: ${payload.phone || ""}
Organization: ${payload.organization || ""}

INQUIRY DETAILS
Region: ${payload.region}
Category: ${payload.category}
Requirements / Message: ${payload.message}

SUBMISSION DETAILS
Source Page: ${payload.page || ""}
Session ID: ${payload.sessionId || ""}
Submitted At: ${payload.timestamp || new Date().toISOString()}

ATTACHMENT
Document: ${documentName}`;
}

export async function createTechnicalInfrastructureInquiryWorkflow(
  payload: TechnicalInfrastructureInquiryPayload,
): Promise<TechnicalInfrastructureInquiryWorkflowResult> {
  const config = getRequiredConfig();
  const { jananiAccountId, rubaAccountId } = getRequiredWorkflowAssignees();
  const idempotencyLabel = await createIdempotencyLabel(payload);
  const contactLabel = payload.organization
    ? `${payload.name} / ${payload.organization}`
    : payload.name;
  const description = formatInfrastructureDescription(payload);

  const parent =
    (await findIssueByLabel(config, idempotencyLabel)) ||
    (await createJiraTask({
      summary: `Infrastructure Inquiry – ${contactLabel}`,
      description,
      priority: "Medium",
      labels: ["lead-inquiry", "infrastructure", idempotencyLabel],
      assigneeAccountId: jananiAccountId,
    }));

  const subtaskDefinitions = [
    { summary: "Review Inquiry & Requirements", assigneeAccountId: jananiAccountId },
    { summary: "Analyze Technical Requirements", assigneeAccountId: rubaAccountId },
    {
      summary: "Prepare Technical Response / Recommendation",
      assigneeAccountId: rubaAccountId,
    },
    { summary: "Contact Lead & Coordinate Follow-up", assigneeAccountId: jananiAccountId },
    { summary: "Record Outcome & Next Action", assigneeAccountId: jananiAccountId },
  ];

  const existingSubtasks = await findSubtasks(config, parent.key);
  const subtasks: TechnicalInfrastructureInquiryWorkflowResult["subtasks"] = [];
  for (const definition of subtaskDefinitions) {
    const existingSubtask = existingSubtasks.find(
      (subtask) => subtask.fields?.summary === definition.summary,
    );
    const issue =
      existingSubtask ||
      (await createJiraSubtask(parent.key, {
        summary: definition.summary,
        description: `Follow-up step for ${parent.key}: ${definition.summary}.`,
        priority: "Medium",
        labels: ["lead-inquiry", "infrastructure"],
        assigneeAccountId: definition.assigneeAccountId,
      }));
    subtasks.push({ summary: definition.summary, issue });
  }

  return { parent, subtasks };
}
