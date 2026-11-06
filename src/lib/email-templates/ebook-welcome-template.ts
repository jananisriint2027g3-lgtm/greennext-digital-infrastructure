/**
 * GreenNext Ebook Welcome Email Template
 *
 * Implements the approved GreenNext email design:
 * - Approved header banner, footer banner, and official logo
 * - Responsive 680px email container
 * - HTML escaping for user data
 * - Plain-text fallback alternative
 * - Features "Intelligent Infrastructure for a Sustainable Digital Future" (Edition 2.0)
 * - Secure reader link and chapter overview
 */

export interface EbookWelcomeEmailOptions {
  recipientName: string;
  recipientEmail: string;
  siteBaseUrl?: string | undefined;
  readerUrl?: string | undefined;
  headerBannerUrl?: string | undefined;
  footerBannerUrl?: string | undefined;
  logoUrl?: string | undefined;
  websiteUrl?: string | undefined;
  linkedInUrl?: string | undefined;
  isSimulation?: boolean | undefined;
}

export interface RenderedEbookEmailOutput {
  subject: string;
  html: string;
  plainText: string;
  firstName: string;
  siteBaseUrl: string;
}

export const DEFAULT_BASE_URL = "https://greennext-ai.vercel.app";
export const DEFAULT_LINKEDIN_URL = "https://www.linkedin.com/company/greennext";

export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function extractFirstName(fullName: string): string {
  if (!fullName) return "Reader";
  const cleaned = fullName.trim().replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, "");
  const parts = cleaned.split(/\s+/);
  const first = parts[0];
  if (!first || first.length < 2) return "Reader";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function renderEbookWelcomeEmail(options: EbookWelcomeEmailOptions): RenderedEbookEmailOutput {
  const baseUrl = (options.siteBaseUrl || process.env["PUBLIC_WEBSITE_URL"] || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const websiteUrl = options.websiteUrl || baseUrl;
  const readerUrl = options.readerUrl || `${baseUrl}/ebook/reader`;
  const linkedInUrl = options.linkedInUrl || DEFAULT_LINKEDIN_URL;

  const headerBannerUrl = options.headerBannerUrl || `${baseUrl}/images/email/greennext-email-header.png`;
  const footerBannerUrl = options.footerBannerUrl || `${baseUrl}/images/email/greennext-email-footer.png`;

  const firstName = extractFirstName(options.recipientName);
  const safeName = escapeHtml(firstName);
  const safeEmail = escapeHtml(options.recipientEmail);

  const subject = "Welcome to GreenNext Ebook – AI Infrastructure. Sustainable Progress.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #070B14; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; width: 100%; background-color: #0A0F1D; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 0; background-color: #070B14; line-height: 0;">
              <img src="${headerBannerUrl}" alt="GreenNext Digital Infrastructure" width="680" style="width: 100%; max-width: 680px; height: auto; display: block; border: 0;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 36px 32px 36px;">
              <!-- Welcome Badge -->
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; color: #10B981; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px;">
                Verified Reader Account
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
                Welcome to GreenNext, ${safeName}
              </h1>

              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Thank you for choosing to explore the GreenNext Ebook. We are pleased to welcome you to a practical guide to AI-ready infrastructure and sustainable digital progress.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                As AI workloads grow, infrastructure planning becomes increasingly complex. Power density, thermal management, energy efficiency, connectivity and operational readiness all play an important role in building reliable infrastructure.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                The decisions made today can influence tomorrow's infrastructure performance, scalability and sustainability.
              </p>

              <!-- What you will discover -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F172A; border: 1px solid #1E293B; border-left: 4px solid #10B981; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: #FFFFFF; line-height: 1.4;">What you will discover</h2>
                    <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">This publication takes you through:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #CBD5E1; font-size: 14px; line-height: 1.8;"><li>Why AI is changing infrastructure requirements.</li><li>The seven-layer operational stack.</li><li>What AI-ready infrastructure really means.</li><li>Energy management and intelligent automation.</li><li>Enterprise use cases and regional infrastructure planning.</li><li>Sustainability principles and practical planning checklists.</li></ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">Whether you are exploring new infrastructure opportunities, evaluating existing systems or preparing for future AI workloads, this Ebook provides a structured foundation for informed planning.</p>
              <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.05em;">Your next step</h3>
              <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #94A3B8;">Start exploring the chapters at your own pace and discover the concepts, considerations and practical questions that can support your infrastructure decisions.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;"><tr><td style="border-radius: 8px; background-color: #10B981;"><a href="${readerUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; color: #070B14; text-decoration: none; border-radius: 8px; letter-spacing: 0.02em;">Explore the GreenNext Ebook &rarr;</a></td></tr></table>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">We look forward to being part of your learning journey.<br><br>Best regards,<br>GreenNext Team<br><span style="color: #10B981;">AI Infrastructure. Sustainable Progress.</span></p>

              <!-- Account Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0A1122; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 12px; color: #64748B;">Registered Reader:</div>
                    <div style="font-size: 14px; font-weight: 600; color: #E2E8F0; margin-top: 2px;">${safeEmail}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                Need assistance with your account or have technical inquiries about our regional deployment models? Reach out directly via <a href="${baseUrl}/contact" style="color: #10B981; text-decoration: none;">our technical contact portal</a>.
              </p>
            </td>
          </tr>

          <!-- Footer Banner -->
          <tr>
            <td style="padding: 0; background-color: #070B14; line-height: 0;">
              <img src="${footerBannerUrl}" alt="GreenNext &bull; Intelligent Infrastructure" width="680" style="width: 100%; max-width: 680px; height: auto; display: block; border: 0;" />
            </td>
          </tr>

          <!-- Legal / Copyright Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #050811; text-align: center; border-top: 1px solid #1E293B;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748B;">
                &copy; ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                <a href="${websiteUrl}" style="color: #94A3B8; text-decoration: none; margin: 0 8px;">Website</a> &bull;
                <a href="${linkedInUrl}" style="color: #94A3B8; text-decoration: none; margin: 0 8px;">LinkedIn</a> &bull;
                <a href="${baseUrl}/privacy-policy" style="color: #94A3B8; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plainText = `WELCOME TO GREENNEXT EBOOK, ${firstName.toUpperCase()}

Thank you for choosing to explore the GreenNext Ebook. We are pleased to welcome you to a practical guide to AI-ready infrastructure and sustainable digital progress.

As AI workloads grow, infrastructure planning becomes increasingly complex. Power density, thermal management, energy efficiency, connectivity and operational readiness all play an important role in building reliable infrastructure.

The decisions made today can influence tomorrow's infrastructure performance, scalability and sustainability.

WHAT YOU WILL DISCOVER
This publication takes you through:
- Why AI is changing infrastructure requirements.
- The seven-layer operational stack.
- What AI-ready infrastructure really means.
- Energy management and intelligent automation.
- Enterprise use cases and regional infrastructure planning.
- Sustainability principles and practical planning checklists.

Whether you are exploring new infrastructure opportunities, evaluating existing systems or preparing for future AI workloads, this Ebook provides a structured foundation for informed planning.

YOUR NEXT STEP
Start exploring the chapters at your own pace and discover the concepts, considerations and practical questions that can support your infrastructure decisions.

Explore the GreenNext Ebook: ${readerUrl}

We look forward to being part of your learning journey.

Best regards,
GreenNext Team
AI Infrastructure. Sustainable Progress.

Website: ${websiteUrl}
LinkedIn: ${linkedInUrl}
Contact: ${baseUrl}/contact

(c) ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.`;

  return {
    subject,
    html,
    plainText,
    firstName,
    siteBaseUrl: baseUrl,
  };
}

