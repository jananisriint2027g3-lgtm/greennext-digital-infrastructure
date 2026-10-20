import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidEmailAddress, IdempotencyTracker, RecipientRateLimiter } from "./mail-controller.server";
import {
  sendVisitorEmailViaAppsScript,
  VISITOR_FORM_TYPES,
  type VisitorEmailRequest,
} from "./visitor-email-apps-script.server";

const visitorConfirmationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  formType: z.enum(VISITOR_FORM_TYPES),
  leadType: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  page: z.string().max(2000).optional(),
  requestId: z.string().regex(/^gn_req_[a-zA-Z0-9_\-]{8,128}$/, "Invalid request identifier format"),
});

export type VisitorEmailDispatchResponse = {
  success: boolean;
  messageId: string;
  /** Always false: delivery is performed by Google Apps Script (MailApp), never simulated. */
  simulated: boolean;
  duplicate?: boolean | undefined;
  error?: string | undefined;
  subject?: string | undefined;
};

/** Masks an address for logs: jane.doe@example.com -> j***@example.com */
function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

function logEmail(level: "info" | "warn" | "error", message: string, fields: Record<string, unknown>) {
  console[level](`[visitor-email] ${message} ${JSON.stringify(fields)}`);
}

/**
 * Dispatches the visitor confirmation through the secure Apps Script `dispatch_email` action.
 * Resend is not used. Failures are returned (never thrown) so the inquiry itself still succeeds.
 */
export const dispatchVisitorConfirmationEmail = createServerFn({ method: "POST" })
  .validator(visitorConfirmationSchema)
  .handler(async ({ data }): Promise<VisitorEmailDispatchResponse> => {
    const flow = data.formType;
    const requestRef = data.requestId.slice(0, 20);
    const fail = (error: string): VisitorEmailDispatchResponse => ({
      success: false,
      messageId: "",
      simulated: false,
      error,
    });
    try {
      const email = data.email.trim();
      if (!isValidEmailAddress(email)) {
        logEmail("warn", "rejected: invalid recipient format", { flow, requestRef });
        return fail("Invalid recipient email format");
      }

      // In-process duplicate guard (Apps Script holds the durable one).
      const idempotency = IdempotencyTracker.check(data.requestId);
      if (idempotency.isDuplicate && idempotency.messageId) {
        logEmail("info", "skipped: duplicate request already sent", { flow, requestRef });
        return { success: true, messageId: idempotency.messageId, simulated: false, duplicate: true };
      }

      // Anti-abuse: max 3 confirmations per recipient per 10 minutes (per server instance).
      const rateLimit = RecipientRateLimiter.checkAndRecord(email);
      if (!rateLimit.allowed) {
        logEmail("warn", "rejected: recipient rate limit", { flow, requestRef });
        return fail("Too many confirmations requested for this address. Please try again later.");
      }

      const request: VisitorEmailRequest = {
        name: data.name,
        email,
        formType: data.formType,
        leadType: data.leadType,
        category: data.category,
        requestId: data.requestId,
      };
      logEmail("info", "dispatching via apps_script", { flow, requestRef, to: maskEmail(email) });
      const res = await sendVisitorEmailViaAppsScript(request);

      if (res.success) {
        const ref = res.deliveryRef || `gas_${res.status}`;
        IdempotencyTracker.record(data.requestId, ref);
        logEmail("info", res.duplicate ? "apps_script reported duplicate (not resent)" : "sent via apps_script", {
          flow,
          requestRef,
          status: res.status,
        });
        return { success: true, messageId: ref, simulated: false, duplicate: res.duplicate };
      }

      logEmail("error", "apps_script email failed", { flow, requestRef, status: res.status, error: res.error });
      return fail(res.error || "Email delivery failed");
    } catch (err) {
      const safeMessage = err instanceof Error ? err.message : String(err);
      logEmail("error", "dispatch threw", { flow, requestRef, error: safeMessage });
      return fail(safeMessage);
    }
  });
