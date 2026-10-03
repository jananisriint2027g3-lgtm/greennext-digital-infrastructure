export interface JiraIssueRef {
  id: string;
  key: string;
  self?: string;
  fields?: { summary?: string };
}

export interface JiraCurrentUser {
  accountId: string;
  displayName: string;
  active?: boolean;
}

export interface JiraIssueFields {
  summary: string;
  description: string;
  priority?: string;
  labels?: string[];
  assigneeAccountId?: string;
}

export interface TechnicalInfrastructureInquiryPayload {
  leadType?: JiraLeadType;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  region: string;
  category: string;
  message: string;
  page?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: string;
  document?: { fileName: string } | string | null;
}

export type JiraLeadType = "session" | "partner" | "technical" | "career" | "general";

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
  readonly operation: string;
  readonly method: string;
  readonly projectKey: string;
  readonly issueType?: string;
  requestPayload?: unknown;

  constructor(
    status: number,
    requestPath: string,
    responseBody: unknown,
    requestPayload?: unknown,
    context: { operation: string; method: string; projectKey: string; issueType?: string } = {
      operation: "Jira API request",
      method: "GET",
      projectKey: "",
    },
  ) {
    super(`Jira request failed with status ${status}.`);
    this.status = status;
    this.requestPath = requestPath;
    this.responseBody = responseBody;
    this.requestPayload = requestPayload;
    this.operation = context.operation;
    this.method = context.method;
    this.projectKey = context.projectKey;
    if (context.issueType) this.issueType = context.issueType;
    this.name = "JiraRequestError";
  }
}

export function getJiraErrorLogDetails(error: JiraRequestError): Record<string, unknown> {
  const responseBody = error.responseBody;
  const bodyRecord =
    responseBody && typeof responseBody === "object" && !Array.isArray(responseBody)
      ? (responseBody as Record<string, unknown>)
      : undefined;

  return {
    operation: error.operation,
    method: error.method,
    requestPath: error.requestPath,
    status: error.status,
    project: error.projectKey,
    ...(error.issueType ? { issueType: error.issueType } : {}),
    jiraResponseBody: responseBody,
    jiraErrorMessages: Array.isArray(bodyRecord?.["errorMessages"])
      ? bodyRecord["errorMessages"]
      : [],
    jiraErrors:
      bodyRecord?.["errors"] && typeof bodyRecord["errors"] === "object"
        ? bodyRecord["errors"]
        : {},
  };
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
  const projectKey = getServerEnv("JIRA_PROJECT_KEY")?.trim();

  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error("Jira integration is not configured on the server.");
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), email, apiToken, projectKey };
}

function getConfiguredWorkflowAssignees(): {
  jananiAccountId?: string;
  rubaAccountId?: string;
} {
  const jananiAccountId = getServerEnv("JIRA_JANANI_ACCOUNT_ID")?.trim() || undefined;
  const rubaAccountId = getServerEnv("JIRA_RUBA_ACCOUNT_ID")?.trim() || undefined;
  const assignees: { jananiAccountId?: string; rubaAccountId?: string } = {};
  if (jananiAccountId) assignees.jananiAccountId = jananiAccountId;
  if (rubaAccountId) assignees.rubaAccountId = rubaAccountId;
  return assignees;
}

function encodeBasicAuth(email: string, apiToken: string): string {
  const credentials = `${email}:${apiToken}`;
  if (typeof btoa === "function") return btoa(credentials);
  return Buffer.from(credentials, "utf8").toString("base64");
}

async function jiraRequest<T>(
  path: string,
  init: RequestInit = {},
  operation = "Jira API request",
  issueType?: string,
): Promise<T> {
  const config = getRequiredConfig();
  const method = init.method || "GET";
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

    throw new JiraRequestError(response.status, path, responseBody, requestPayload, {
      operation,
      method,
      projectKey: config.projectKey,
      ...(issueType ? { issueType } : {}),
    });
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

async function getProjectIssueTypes(config: JiraConfig): Promise<JiraCreateIssueType[]> {
  const metadata = await jiraRequest<JiraCreateIssueTypesResponse>(
    `/rest/api/3/issue/createmeta/${encodeURIComponent(config.projectKey)}/issuetypes`,
    {},
    "discover issue types",
  );
  return metadata.issueTypes;
}

function getConfiguredParentIssueType(): string | undefined {
  return getServerEnv("JIRA_PARENT_ISSUE_TYPE")?.trim() || undefined;
}

function selectParentIssueType(issueTypes: JiraCreateIssueType[], projectKey: string): JiraCreateIssueType {
  const configuredName = getConfiguredParentIssueType();
  const parentType = configuredName
    ? issueTypes.find((issueType) => !issueType.subtask && (issueType.name === configuredName || issueType.id === configuredName))
    : issueTypes.find((issueType) => !issueType.subtask && issueType.name === "Task") ||
      issueTypes.find((issueType) => !issueType.subtask);

  if (!parentType) {
    throw new Error(`No valid parent issue type is available for Jira project ${projectKey}.`);
  }

  return parentType;
}

function selectSubtaskIssueType(issueTypes: JiraCreateIssueType[], projectKey: string): JiraCreateIssueType {
  const subtaskType = issueTypes.find((issueType) => issueType.subtask);

  if (!subtaskType) {
    throw new Error(`No subtask issue type is available for Jira project ${projectKey}.`);
  }

  return subtaskType;
}

async function getProjectSubtaskIssueType(config: JiraConfig, issueTypes?: JiraCreateIssueType[]): Promise<JiraCreateIssueType> {
  return selectSubtaskIssueType(issueTypes || (await getProjectIssueTypes(config)), config.projectKey);
}

async function getProjectParentIssueType(config: JiraConfig, issueTypes?: JiraCreateIssueType[]): Promise<JiraCreateIssueType> {
  return selectParentIssueType(issueTypes || (await getProjectIssueTypes(config)), config.projectKey);
}

async function createIdempotencyLabel(
  payload: TechnicalInfrastructureInquiryPayload,
): Promise<string> {
  const canonicalPayload = [
    ...(payload.leadType && payload.leadType !== "technical" ? [payload.leadType] : []),
    payload.name,
    payload.email,
    payload.phone || "",
    payload.organization || "",
    payload.region,
    payload.category,
    payload.message,
    payload.page || "",
    payload.sessionId || "",
    payload.requestId || payload.timestamp || "",
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
  parentIssueTypeName: string,
): Promise<JiraIssueRef | undefined> {
  const jql = `project = ${config.projectKey} AND labels = ${label} AND issuetype = "${parentIssueTypeName.replace(/"/g, '\\"')}"`;
  const result = await jiraRequest<JiraSearchResponse>(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=1&fields=summary`,
    {},
    "find existing parent issue",
  );
  return result.issues[0];
}

async function findSubtasks(config: JiraConfig, parentKey: string): Promise<JiraIssueRef[]> {
  const jql = `project = ${config.projectKey} AND parent = ${parentKey}`;
  const result = await jiraRequest<JiraSearchResponse>(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary`,
    {},
    "find existing subtasks",
  );
  return result.issues;
}

async function resolveAssignableAccountId(
  config: JiraConfig,
  accountId: string | undefined,
): Promise<string | undefined> {
  if (!accountId) return undefined;

  try {
    const users = await jiraRequest<JiraCurrentUser[]>(
      `/rest/api/3/user/assignable/search?project=${encodeURIComponent(config.projectKey)}&accountId=${encodeURIComponent(accountId)}&maxResults=1`,
      {},
      "validate Jira assignee",
    );
    return users.some((user) => user.accountId === accountId && user.active !== false)
      ? accountId
      : undefined;
  } catch (error) {
    if (error instanceof JiraRequestError) {
      console.warn("Jira assignee validation failed", {
        operation: error.operation,
        status: error.status,
        project: config.projectKey,
        configured: true,
      });
    }
    return undefined;
  }
}

export async function getJiraProjectIssueTypes(): Promise<{
  projectKey: string;
  issueTypes: JiraCreateIssueType[];
}> {
  const config = getRequiredConfig();
  return { projectKey: config.projectKey, issueTypes: await getProjectIssueTypes(config) };
}

export async function getJiraCurrentUser(): Promise<JiraCurrentUser> {
  return jiraRequest<JiraCurrentUser>("/rest/api/3/myself", {}, "get current Jira user");
}

export async function findJiraUsersByDisplayName(displayName: string): Promise<JiraCurrentUser[]> {
  const users = await jiraRequest<JiraCurrentUser[]>(
    `/rest/api/3/user/search?query=${encodeURIComponent(displayName)}`,
    {},
    "search Jira users",
  );
  return users.filter((user) => user.displayName === displayName);
}

export async function createJiraTask(
  input: JiraIssueFields,
  parentIssueType?: JiraCreateIssueType,
): Promise<JiraIssueRef> {
  const config = getRequiredConfig();
  const issueType = parentIssueType || (await getProjectParentIssueType(config));
  return jiraRequest<JiraIssueRef>("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({ fields: issueFields(config, input, { id: issueType.id }) }),
  }, "create parent issue", issueType.name);
}

export async function createJiraSubtask(
  parentKey: string,
  input: JiraIssueFields,
  subtaskType?: JiraCreateIssueType,
): Promise<JiraIssueRef> {
  const config = getRequiredConfig();
  const resolvedSubtaskType = subtaskType || (await getProjectSubtaskIssueType(config));
  const payload = { fields: issueFields(config, input, { id: resolvedSubtaskType.id }, parentKey) };

  try {
    return await jiraRequest<JiraIssueRef>("/rest/api/3/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "create subtask", resolvedSubtaskType.name);
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
  }, "assign Jira issue");
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

const leadWorkflowConfig: Record<
  JiraLeadType,
  { parentPrefix: string; descriptionHeading: string; labels: string[]; subtasks: string[] }
> = {
  session: {
    parentPrefix: "Technical Session",
    descriptionHeading: "TECHNICAL SESSION REQUEST",
    labels: ["lead-inquiry", "technical-session"],
    subtasks: [
      "Review Session Request",
      "Review Technical Context",
      "Prepare Session / Technical Response",
      "Contact Lead & Schedule Follow-up",
      "Record Outcome & Next Action",
    ],
  },
  partner: {
    parentPrefix: "Partner Collaboration Inquiry",
    descriptionHeading: "PARTNERSHIP INQUIRY",
    labels: ["lead-inquiry", "partnership"],
    subtasks: [
      "Review Partnership Inquiry",
      "Analyze Collaboration Context",
      "Prepare Partnership Response",
      "Contact Lead & Coordinate Follow-up",
      "Record Outcome & Next Action",
    ],
  },
  technical: {
    parentPrefix: "Infrastructure Inquiry",
    descriptionHeading: "TECHNICAL INFRASTRUCTURE INQUIRY",
    labels: ["lead-inquiry", "infrastructure"],
    subtasks: [
      "Review Inquiry & Requirements",
      "Analyze Technical Requirements",
      "Prepare Technical Response / Recommendation",
      "Contact Lead & Coordinate Follow-up",
      "Record Outcome & Next Action",
    ],
  },
  career: {
    parentPrefix: "Career Inquiry",
    descriptionHeading: "CAREER INQUIRY",
    labels: ["lead-inquiry", "career"],
    subtasks: [
      "Review Career Inquiry",
      "Review Candidate / Role Context",
      "Prepare Career Response",
      "Contact Lead & Coordinate Follow-up",
      "Record Outcome & Next Action",
    ],
  },
  general: {
    parentPrefix: "General Contact Inquiry",
    descriptionHeading: "GENERAL CONTACT INQUIRY",
    labels: ["lead-inquiry", "general"],
    subtasks: [
      "Review General Inquiry",
      "Review Contact Context",
      "Prepare General Response",
      "Contact Lead & Coordinate Follow-up",
      "Record Outcome & Next Action",
    ],
  },
};

function formatInfrastructureDescription(payload: TechnicalInfrastructureInquiryPayload): string {
  const workflow = leadWorkflowConfig[payload.leadType || "technical"];
  const documentName =
    typeof payload.document === "string" ? payload.document : payload.document?.fileName || "None";

  return `${workflow.descriptionHeading}

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
  const workflow = leadWorkflowConfig[payload.leadType || "technical"];
  const config = getRequiredConfig();
  const { jananiAccountId: configuredJananiAccountId, rubaAccountId: configuredRubaAccountId } =
    getConfiguredWorkflowAssignees();
  const issueTypes = await getProjectIssueTypes(config);
  const parentIssueType = selectParentIssueType(issueTypes, config.projectKey);
  const subtaskIssueType = selectSubtaskIssueType(issueTypes, config.projectKey);
  const jananiAccountId = await resolveAssignableAccountId(config, configuredJananiAccountId);
  const rubaAccountId = await resolveAssignableAccountId(config, configuredRubaAccountId);
  const idempotencyLabel = await createIdempotencyLabel(payload);
  const contactLabel = payload.organization
    ? `${payload.name} / ${payload.organization}`
    : payload.name;
  const description = formatInfrastructureDescription(payload);

  const parent =
    (await findIssueByLabel(config, idempotencyLabel, parentIssueType.name)) ||
    (await createJiraTask({
      summary: `${workflow.parentPrefix} – ${contactLabel}`,
      description,
      priority: "Medium",
      labels: [...workflow.labels, idempotencyLabel],
      ...(jananiAccountId ? { assigneeAccountId: jananiAccountId } : {}),
    }, parentIssueType));

  const subtaskDefinitions = workflow.subtasks.map((summary, index) => ({
    summary,
    assigneeAccountId: index === 1 || index === 2 ? rubaAccountId : jananiAccountId,
  }));

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
        labels: workflow.labels,
        ...(definition.assigneeAccountId
          ? { assigneeAccountId: definition.assigneeAccountId }
          : {}),
      }, subtaskIssueType));
    subtasks.push({ summary: definition.summary, issue });
  }

  return { parent, subtasks };
}
