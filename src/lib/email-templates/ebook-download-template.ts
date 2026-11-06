/**
 * GreenNext Ebook download confirmation email.
 * Uses the same branded visual system as the approved welcome template.
 */

import {
  DEFAULT_BASE_URL,
  DEFAULT_LINKEDIN_URL,
  escapeHtml,
  extractFirstName,
  type RenderedEbookEmailOutput,
} from "./ebook-welcome-template";

export interface EbookDownloadEmailOptions {
  recipientName: string;
  recipientEmail: string;
  siteBaseUrl?: string | undefined;
  downloadUrl?: string | undefined;
  headerBannerUrl?: string | undefined;
  footerBannerUrl?: string | undefined;
  websiteUrl?: string | undefined;
  linkedInUrl?: string | undefined;
}

export function renderEbookDownloadEmail(options: EbookDownloadEmailOptions): RenderedEbookEmailOutput {
  const baseUrl = (options.siteBaseUrl || process.env["PUBLIC_WEBSITE_URL"] || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const websiteUrl = options.websiteUrl || baseUrl;
  const downloadUrl = options.downloadUrl || `${baseUrl}/api/ebook/download`;
  const linkedInUrl = options.linkedInUrl || DEFAULT_LINKEDIN_URL;
  const headerBannerUrl = options.headerBannerUrl || `${baseUrl}/images/email/greennext-email-header.png`;
  const footerBannerUrl = options.footerBannerUrl || `${baseUrl}/images/email/greennext-email-footer.png`;
  const firstName = extractFirstName(options.recipientName);
  const safeName = escapeHtml(firstName);
  const safeEmail = escapeHtml(options.recipientEmail);
  const subject = "Your GreenNext Ebook Is Ready to Download";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#070B14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#070B14;min-height:100vh;"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;width:100%;background-color:#0A0F1D;border:1px solid #1E293B;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -15px rgba(0,0,0,.7);">
      <tr><td style="padding:0;background-color:#070B14;line-height:0;"><img src="${headerBannerUrl}" alt="GreenNext Digital Infrastructure" width="680" style="width:100%;max-width:680px;height:auto;display:block;border:0;"></td></tr>
      <tr><td style="padding:40px 36px 32px;">
        <div style="display:inline-block;padding:6px 14px;background-color:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);border-radius:20px;font-size:12px;font-weight:700;color:#10B981;letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px;">Publication Download</div>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.3;font-weight:800;color:#FFFFFF;letter-spacing:-.02em;">Your GreenNext Ebook is ready, ${safeName}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#94A3B8;">Thank you for your interest in GreenNext and for choosing to explore our AI infrastructure publication.</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94A3B8;">As AI adoption accelerates, organisations face important decisions around computing capacity, energy requirements, cooling, connectivity and sustainable infrastructure planning. Understanding these challenges is an important step towards making informed infrastructure decisions.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0F172A;border:1px solid #1E293B;border-left:4px solid #10B981;border-radius:12px;margin-bottom:28px;"><tr><td style="padding:24px;">
          <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:#FFFFFF;line-height:1.4;">Your Ebook is ready!</h2>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#94A3B8;">AI Infrastructure. Sustainable Progress. brings together practical insights into:</p>
          <ul style="margin:0;padding-left:20px;color:#CBD5E1;font-size:14px;line-height:1.8;"><li>The changing infrastructure requirements of AI workloads.</li><li>The seven-layer operational stack.</li><li>AI-ready computing, energy and intelligent automation.</li><li>Enterprise applications and regional infrastructure planning.</li><li>Sustainability considerations and practical planning guidance.</li></ul>
        </td></tr></table>
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:.05em;">Why this publication matters</h3>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94A3B8;">Infrastructure decisions made today can influence long-term operational efficiency, scalability and sustainability. This publication provides a structured foundation to help you understand the considerations involved.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;"><tr><td style="border-radius:8px;background-color:#10B981;"><a href="${downloadUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#070B14;text-decoration:none;border-radius:8px;letter-spacing:.02em;">Download the GreenNext Ebook &rarr;</a></td></tr></table>
        <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#64748B;">Your requested publication is available through the protected GreenNext download service. We hope it provides valuable insights for your learning and infrastructure planning journey.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">For further information or to discuss infrastructure opportunities, our team would be pleased to hear from you.</p>
        <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#CBD5E1;">Best regards,<br>GreenNext Team<br><span style="color:#10B981;">AI Infrastructure. Sustainable Progress.</span></p>
        <div style="margin-top:24px;padding:16px 20px;background-color:#0A1122;border:1px solid #1E293B;border-radius:8px;font-size:12px;color:#64748B;">Requested by: <span style="color:#E2E8F0;">${safeEmail}</span></div>
      </td></tr>
      <tr><td style="padding:0;background-color:#070B14;line-height:0;"><img src="${footerBannerUrl}" alt="GreenNext • Intelligent Infrastructure" width="680" style="width:100%;max-width:680px;height:auto;display:block;border:0;"></td></tr>
      <tr><td style="padding:24px 36px;background-color:#050811;text-align:center;border-top:1px solid #1E293B;"><p style="margin:0 0 8px;font-size:12px;color:#64748B;">&copy; ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.</p><p style="margin:0;font-size:11px;color:#475569;"><a href="${websiteUrl}" style="color:#94A3B8;text-decoration:none;margin:0 8px;">Website</a> &bull; <a href="${linkedInUrl}" style="color:#94A3B8;text-decoration:none;margin:0 8px;">LinkedIn</a> &bull; <a href="${baseUrl}/privacy-policy" style="color:#94A3B8;text-decoration:none;margin:0 8px;">Privacy Policy</a></p></td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const plainText = `YOUR GREENNEXT EBOOK IS READY TO DOWNLOAD, ${firstName.toUpperCase()}

Thank you for your interest in GreenNext and for choosing to explore our AI infrastructure publication.

AI Infrastructure. Sustainable Progress. brings together practical insights into:
- The changing infrastructure requirements of AI workloads.
- The seven-layer operational stack.
- AI-ready computing, energy and intelligent automation.
- Enterprise applications and regional infrastructure planning.
- Sustainability considerations and practical planning guidance.

Infrastructure decisions made today can influence long-term operational efficiency, scalability and sustainability.

Your requested publication is available through the protected GreenNext download service. We hope it provides valuable insights for your learning and infrastructure planning journey.

Download the GreenNext Ebook: ${downloadUrl}

Website: ${websiteUrl}
LinkedIn: ${linkedInUrl}
Contact: ${baseUrl}/contact

(c) ${new Date().getFullYear()} GreenNext Digital Infrastructure. All rights reserved.`;

  return { subject, html, plainText, firstName, siteBaseUrl: baseUrl };
}
