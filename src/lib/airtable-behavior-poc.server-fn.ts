import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createAirtableBehaviorEvent } from "./airtable-behavior-poc.server";

const airtableBehaviorEventSchema = z.object({
  sessionId: z.string().trim().min(1).max(200),
  sessionKind: z.enum(["new_session", "returning_session"]),
  page: z.string().trim().min(1).max(500),
  event: z.string().trim().min(1).max(200),
  value: z.string().trim().max(500),
  sourceTab: z.literal("CTA Interactions"),
});

export const submitAirtableBehaviorEvent = createServerFn({ method: "POST" })
  .validator(airtableBehaviorEventSchema)
  .handler(async ({ data }) => {
    try {
      await createAirtableBehaviorEvent({
        ...data,
        timestamp: new Date().toISOString(),
      });
      return { success: true } as const;
    } catch (error) {
      console.error(
        "Airtable behaviour POC event failed:",
        error instanceof Error ? error.message : "Unknown Airtable error.",
      );
      return { success: false } as const;
    }
  });
