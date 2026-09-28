import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createTechnicalInfrastructureInquiryWorkflow, isJiraEnabled } from "./jira.server";

const technicalInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(100).optional(),
  organization: z.string().max(200).optional(),
  region: z.string().min(1).max(200),
  category: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  page: z.string().max(2000).optional(),
  sessionId: z.string().max(200).optional(),
  timestamp: z.string().max(100).optional(),
  documentFileName: z.string().max(500).nullable().optional(),
});

export type JiraInquirySubmissionResult =
  | { status: "disabled" }
  | { status: "created"; parentKey: string; subtaskKeys: string[] }
  | { status: "failed" };

export const submitTechnicalInfrastructureInquiryToJira = createServerFn({ method: "POST" })
  .validator(technicalInquirySchema)
  .handler(async ({ data }): Promise<JiraInquirySubmissionResult> => {
    if (!isJiraEnabled()) {
      return { status: "disabled" };
    }

    try {
      const result = await createTechnicalInfrastructureInquiryWorkflow({
        ...data,
        document: data.documentFileName,
      });
      return {
        status: "created",
        parentKey: result.parent.key,
        subtaskKeys: result.subtasks.map(({ issue }) => issue.key),
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error("Jira technical infrastructure workflow failed:", error.message);
      } else {
        console.error("Jira technical infrastructure workflow failed.");
      }
      return { status: "failed" };
    }
  });
