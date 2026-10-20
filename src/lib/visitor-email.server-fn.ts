import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  defaultMailController,
  isValidEmailAddress,
  IdempotencyTracker,
  RecipientRateLimiter,
  type MailDeliveryOptions,
} from "./mail-controller.server";
import {
  renderVisitorWelcomeEmail,
  type VisitorEmailTemplateOptions,
} from "./email-templates/visitor-welcome-template";

const visitorConfirmationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  formType: z.enum(["lead_inquiry", "long_form_inquiry", "quick_inquiry"]).or(z.string().max(100)),
  leadType: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  page: z.string().max(2000).optional(),
  requestId: z.string().regex(/^gn_req_[a-zA-Z0-9_\-]{8,128}$/, "Invalid request identifier format"),
});

export type VisitorEmailDispatchResponse = {
  success: boolean;
  messageId: string;
  simulated: boolean;
  duplicate?: boolean | undefined;
  error?: string | undefined;
  subject?: string | undefined;
};

export const dispatchVisitorConfirmationEmail = createServerFn({ method: "POST" })
  .validator(visitorConfirmationSchema)
  .handler(async ({ data }): Promise<VisitorEmailDispatchResponse> => {
    try {
      const email = data.email.trim();

      // 1. Recipient syntax validation
      if (!isValidEmailAddress(email)) {
        return {
          success: false,
          messageId: "",
          simulated: defaultMailController.isSimulation,
          error: `Invalid recipient email format: ${email}`,
        };
      }

      // 2. Anti-abuse recipient rate limiter (max 3 emails per recipient per 10 minutes)
      const rateLimit = RecipientRateLimiter.checkAndRecord(email);
      if (!rateLimit.allowed) {
        return {
          success: false,
          messageId: "",
          simulated: defaultMailController.isSimulation,
          error: "Rate limit exceeded: too many inquiry confirmations requested for this address. Please try again later.",
        };
      }

      // 3. Request idempotency verification
      const idempotency = IdempotencyTracker.check(data.requestId);
      if (idempotency.isDuplicate && idempotency.messageId) {
        return {
          success: true,
          messageId: idempotency.messageId,
          simulated: defaultMailController.isSimulation,
          duplicate: true,
        };
      }

      // 4. Render the approved GreenNext email template
      const templateOptions: VisitorEmailTemplateOptions = {
        recipientName: data.name,
        recipientEmail: email,
        formType: data.formType,
        ...(data.leadType !== undefined ? { leadType: data.leadType } : {}),
        ...(data.category !== undefined ? { categoryOrTopic: data.category } : {}),
        isSimulation: defaultMailController.isSimulation,
      };

      const rendered = renderVisitorWelcomeEmail(templateOptions);

      // 5. Build delivery options with fixed non-tamperable content
      const fromAddress = (
        process.env["EMAIL_FROM"] ||
        process.env["RESEND_FROM"] ||
        ""
      ).trim();

      const replyToAddress = (
        process.env["EMAIL_REPLY_TO"] ||
        (defaultMailController.isSimulation ? "contact@greennext.internal" : undefined)
      );

      const deliveryOptions: MailDeliveryOptions = {
        to: email,
        subject: rendered.subject,
        htmlBody: rendered.html,
        plainTextBody: rendered.plainText,
        ...(fromAddress ? { from: fromAddress } : {}),
        ...(replyToAddress ? { replyTo: replyToAddress } : {}),
        headers: {
          "X-GreenNext-Form": data.formType,
          "X-GreenNext-Request-Id": data.requestId,
        },
      };

      // 6. Dispatch via configured transport (simulation by default)
      const dispatchRes = await defaultMailController.sendMail(deliveryOptions);

      if (dispatchRes.success) {
        IdempotencyTracker.record(data.requestId, dispatchRes.messageId);
      }

      return {
        success: dispatchRes.success,
        messageId: dispatchRes.messageId,
        simulated: defaultMailController.isSimulation,
        subject: rendered.subject,
        ...(dispatchRes.error ? { error: dispatchRes.error } : {}),
      };
    } catch (err) {
      console.error("Visitor confirmation email dispatch error:", err);
      return {
        success: false,
        messageId: "",
        simulated: defaultMailController.isSimulation,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
