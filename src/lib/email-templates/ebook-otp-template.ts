/**
 * GreenNext Ebook OTP Verification Email Template
 *
 * Implements the approved GreenNext email branding:
 * - Approved header and footer banners
 * - Responsive 680px email card
 * - High-contrast 6-digit numeric OTP display
 * - 5-minute expiration notice
 * - Security warnings (never share code)
 */

export interface EbookOtpEmailOptions {
  recipientName: string;
  recipientEmail: string;
  otpCode: string;
  expiresInMinutes?: number;
  siteBaseUrl?: string | undefined;
  headerBannerUrl?: string | undefined;
  footerBannerUrl?: string | undefined;
}

export interface RenderedEbookOtpOutput {
  subject: string;
  html: string;
  plainText: string;
  firstName: string;
}

export const DEFAULT_BASE_URL = "https://greennext-ai.vercel.app";

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

export function renderEbookOtpEmail(options: EbookOtpEmailOptions): RenderedEbookOtpOutput {
  const baseUrl = (options.siteBaseUrl || process.env["PUBLIC_WEBSITE_URL"] || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const headerBannerUrl = options.headerBannerUrl || `${baseUrl}/images/email/greennext-email-header.png`;
  const footerBannerUrl = options.footerBannerUrl || `${baseUrl}/images/email/greennext-email-footer.png`;

  const firstName = extractFirstName(options.recipientName);
  const safeName = escapeHtml(firstName);
  const safeOtp = escapeHtml(options.otpCode);
  const expiryMin = options.expiresInMinutes || 5;

  const subject = `Your GreenNext Verification Code: ${options.otpCode}`;

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

          <!-- Content -->
          <tr>
            <td style="padding: 40px 36px 32px 36px;">
              <div style="display: inline-block; padding: 6px 14px; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; color: #10B981; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px;">
                Email Verification
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">
                Verify your GreenNext reader account
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Hello ${safeName}, enter the following verification code on the GreenNext portal to verify your email and activate your access to <em>Intelligent Infrastructure for a Sustainable Digital Future</em>:
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <tr>
                  <td style="padding: 28px 16px;">
                    <div style="font-size: 12px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">
                      Your Single-Use Verification Code
                    </div>
                    <div style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; color: #10B981; letter-spacing: 0.25em; padding-left: 0.25em;">
                      ${safeOtp}
                    </div>
                    <div style="font-size: 13px; color: #64748B; margin-top: 10px;">
                      Expires in <strong style="color: #E2E8F0;">${expiryMin} minutes</strong> &bull; Single-use only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #0A1122; border-left: 3px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94A3B8;">
                  <strong style="color: #F8FAFC;">Security notice:</strong> GreenNext will never ask for this code via phone, chat, or social media. If you did not initiate this request, you can safely disregard this email.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                Need help? Contact our technical team at <a href="${baseUrl}/contact" style="color: #10B981; text-decoration: none;">greennext.internal/contact</a>.
              </p>
            </td>
          </tr>

          <!-- Footer Banner -->
          <tr>
            <td style="padding: 0; background-color: #070B14; line-height: 0;">
              <img src="${footerBannerUrl}" alt="GreenNext &bull; Intelligent Infrastructure" width="680" style="width: 100%; max-width: 680px; height: auto; display: block; border: 0;" />
            </td>
          </tr>

          <!-- Copyright Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #050811; text-align: center; border-top: 1px solid #1E293B;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                &copy; ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plainText = `GREENNEXT EMAIL VERIFICATION
============================================================

Hello ${firstName},

Your verification code for GreenNext Ebook access is:

${options.otpCode}

This code expires in ${expiryMin} minutes.

Security notice: Never share this code with anyone. GreenNext will never ask you for this code outside the official portal.

If you did not request this verification, you can safely ignore this email.

(c) ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.`;

  return {
    subject,
    html,
    plainText,
    firstName,
  };
}

