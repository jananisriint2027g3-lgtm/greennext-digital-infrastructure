import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createAirtableLeadRecord } from "./airtable-poc.server";

const airtableLeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(100),
  organization: z.string().trim().max(200),
  region: z.string().trim().max(200),
  inquiryType: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(20000),
});

export const submitAirtablePocLead = createServerFn({ method: "POST" })
  .validator(airtableLeadSchema)
  .handler(async ({ data }) => {
    try {
      await createAirtableLeadRecord({
        ...data,
        timestamp: new Date().toISOString(),
      });
      return { success: true } as const;
    } catch (error) {
      console.error(
        "Airtable POC lead creation failed:",
        error instanceof Error ? error.message : "Unknown Airtable error.",
      );
      return { success: false } as const;
    }
  });
