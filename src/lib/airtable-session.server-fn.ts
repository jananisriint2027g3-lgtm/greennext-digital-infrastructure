import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createAirtableSessionRecord, isAirtableEnabled } from "./airtable.server";

const anonymousSessionSchema = z.object({
  sessionId: z.string().min(1).max(200),
  startedAt: z.string().datetime(),
  deviceType: z.string().min(1).max(50),
  entryPage: z.string().min(1).max(2000),
  referrer: z.string().max(2000),
  sessionOutcome: z.string().min(1).max(100),
});

export type AirtableSessionSubmissionResult =
  | { status: "disabled" }
  | { status: "created"; recordId: string }
  | { status: "failed" };

export const submitAnonymousSessionToAirtable = createServerFn({ method: "POST" })
  .validator(anonymousSessionSchema)
  .handler(async ({ data }): Promise<AirtableSessionSubmissionResult> => {
    if (!isAirtableEnabled()) return { status: "disabled" };

    try {
      const result = await createAirtableSessionRecord(data);
      return { status: "created", recordId: result.recordId };
    } catch (error) {
      console.error(
        "Airtable anonymous session prototype failed:",
        error instanceof Error ? error.message : "Unknown Airtable error.",
      );
      return { status: "failed" };
    }
  });
