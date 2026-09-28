import {
  createTechnicalInfrastructureInquiryWorkflow,
  JiraRequestError,
} from "../src/lib/jira.server.ts";
import type { TechnicalInfrastructureInquiryPayload } from "../src/lib/jira.server.ts";
import { readFile } from "node:fs/promises";

const sampleInquiry: TechnicalInfrastructureInquiryPayload = {
  name: "GreenNext Jira Test Lead",
  email: "jira-test@example.invalid",
  phone: "+91 90000 00000",
  organization: "GreenNext Test Organization",
  region: "South India",
  category: "Infrastructure planning",
  message: "Manual validation sample for the technical infrastructure inquiry workflow.",
  page: "/contact",
  sessionId: "manual-jira-infrastructure-test",
  timestamp: new Date().toISOString(),
  document: null,
};

const payloadFileIndex = process.argv.indexOf("--payload-file");
const payloadFile = payloadFileIndex >= 0 ? process.argv[payloadFileIndex + 1] : undefined;

const inquiry = payloadFile
  ? (JSON.parse(await readFile(payloadFile, "utf8")) as TechnicalInfrastructureInquiryPayload)
  : sampleInquiry;

try {
  const result = await createTechnicalInfrastructureInquiryWorkflow(inquiry);
  console.log(
    JSON.stringify(
      {
        parentKey: result.parent.key,
        subtasks: result.subtasks.map(({ summary, issue }) => ({ summary, key: issue.key })),
      },
      null,
      2,
    ),
  );
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
    console.error(
      error instanceof Error ? error.message : "Jira infrastructure workflow test failed.",
    );
  }
  process.exitCode = 1;
}
