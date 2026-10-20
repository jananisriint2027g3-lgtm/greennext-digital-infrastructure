/**
 * GreenNext Branded Visitor Welcome Email Template
 *
 * Implements the approved GreenNext email design handoff:
 * - Approved header banner, footer banner, and official logo
 * - Responsive 680px email container
 * - HTML escaping for all user-supplied data
 * - Plain-text fallback alternative
 * - Dynamic service personalization based on form and topic
 * - Absolute HTTPS URLs for all links and media
 */

export interface ServiceContentMapping {
  title: string;
  description: string;
  url: string;
}

export interface VisitorEmailTemplateOptions {
  recipientName: string;
  recipientEmail: string;
  formType: "quick_inquiry" | "long_form_inquiry" | "lead_inquiry" | string;
  leadType?: string | undefined;
  categoryOrTopic?: string | undefined;
  siteBaseUrl?: string | undefined;
  headerBannerUrl?: string | undefined;
  footerBannerUrl?: string | undefined;
  logoUrl?: string | undefined;
  websiteUrl?: string | undefined;
  linkedInUrl?: string | undefined;
  contactUrl?: string | undefined;
  isSimulation?: boolean | undefined;
}

export interface RenderedEmailOutput {
  subject: string;
  html: string;
  plainText: string;
  serviceContent: ServiceContentMapping;
  firstName: string;
  formName: string;
  siteBaseUrl: string;
}

export const DEFAULT_BASE_URL = "https://greennext.internal";
export const DEFAULT_LINKEDIN_URL = "https://www.linkedin.com/company/greennext";

/**
 * Escapes HTML characters in user-provided inputs to prevent injection attacks.
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extracts a friendly first name from a full name string.
 * Strips common honorifics (Dr., Mr., Ms., Mrs., Prof.).
 * Falls back to 'there' if empty.
 */
export function extractFirstName(fullName: string): string {
  if (!fullName) return "there";
  const cleaned = fullName.trim().replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, "");
  const parts = cleaned.split(/\s+/);
  const first = parts[0];
  if (!first || first.length < 2) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Maps raw formType and leadType values to reader-friendly form labels.
 */
export function formatFormName(formType: string, leadType?: string): string {
  if (leadType) {
    const lt = leadType.toLowerCase();
    if (lt.includes("session") || lt.includes("consultation")) {
      return "Technical Consultation";
    }
    if (lt.includes("partner") || lt.includes("collaboration")) {
      return "Partner & Collaboration";
    }
    if (lt.includes("technical") || lt.includes("infrastructure")) {
      return "Technical Infrastructure Inquiry";
    }
    if (lt.includes("career")) {
      return "Career & Talent Inquiry";
    }
    if (lt.includes("general")) {
      return "General Contact Inquiry";
    }
  }

  switch (formType) {
    case "quick_inquiry":
      return "Quick Inquiry";
    case "long_form_inquiry":
      return "Technical Requirements";
    case "lead_inquiry":
      return "Consultation & Inquiry";
    default:
      return "Inquiry";
  }
}

/**
 * Resolves the public site URL and prevents production emails from silently using greennext.internal.
 */
export function resolvePublicSiteUrl(configuredUrl?: string, isSimulation: boolean = true): string {
  const candidate = (
    configuredUrl ||
    process.env["PUBLIC_WEBSITE_URL"] ||
    process.env["VERCEL_PROJECT_PRODUCTION_URL"] ||
    ""
  ).trim().replace(/\/+$/, "");

  if (candidate) {
    const formatted = candidate.startsWith("http://") || candidate.startsWith("https://")
      ? candidate
      : `https://${candidate}`;

    if (!isSimulation && process.env["NODE_ENV"] === "production") {
      if (formatted.includes(".internal") || formatted.includes("localhost") || formatted.includes("127.0.0.1")) {
        throw new Error(
          `Invalid production domain: "${formatted}". A valid public HTTPS domain must be set in PUBLIC_WEBSITE_URL when live delivery is active.`
        );
      }
    }
    return formatted;
  }

  if (!isSimulation && process.env["NODE_ENV"] === "production") {
    throw new Error(
      "PUBLIC_WEBSITE_URL must be configured with a public HTTPS domain when live email delivery is enabled in production."
    );
  }

  return DEFAULT_BASE_URL;
}

/**
 * Resolves tailored service content based on the visitor's declared interest or category.
 * Verified against actual routes in src/routes.
 */
export function resolveServiceContent(
  categoryOrTopic?: string,
  formType?: string,
  leadType?: string,
  baseUrl: string = DEFAULT_BASE_URL,
): ServiceContentMapping {
  const normBase = baseUrl.replace(/\/+$/, "");
  const cat = (categoryOrTopic || "").toLowerCase().trim();
  const lead = (leadType || "").toLowerCase().trim();

  // 1. Career / Talent (Checked first so applicant interests in AI/energy point to career pages)
  if (lead.includes("career") || cat.includes("career") || cat.includes("resume") || cat.includes("cv")) {
    return {
      title: "Engineering & Infrastructure Innovation at GreenNext",
      description:
        "Discover our multidisciplinary research into thermal dynamics, distributed edge topologies, and renewable-powered digital infrastructure.",
      url: `${normBase}/about/what-we-are`,
    };
  }

  // 2. Partnership & Ecosystem Collaboration
  if (
    lead.includes("partner") ||
    cat.includes("partner") ||
    cat.includes("collaboration") ||
    cat.includes("ecosystem")
  ) {
    return {
      title: "Technology & Regional Ecosystem Collaboration",
      description:
        "Explore co-development, technology integration, and deployment partnership opportunities with GreenNext across sustainable compute and clean energy grids.",
      url: `${normBase}/about/what-we-are`,
    };
  }

  // 3. AI Infrastructure & High-Density Compute
  if (
    cat.includes("ai") ||
    cat.includes("compute") ||
    cat.includes("workload") ||
    cat.includes("density")
  ) {
    return {
      title: "AI-Ready Infrastructure & High-Density Topology",
      description:
        "Explore how GreenNext provisions dedicated high-density computing clusters, accelerated GPU topologies, and low-latency interconnects optimized for demanding AI workloads.",
      url: `${normBase}/infrastructure/ai-ready`,
    };
  }

  // 4. Energy, Cooling & Thermal Telemetry
  if (
    cat.includes("energy") ||
    cat.includes("cooling") ||
    cat.includes("thermal") ||
    cat.includes("power")
  ) {
    return {
      title: "Energy Intelligence & Thermal Telemetry",
      description:
        "Discover our real-time power distribution monitoring, heat re-circulation management, and predictive cooling systems engineered to maximize energy efficiency.",
      url: `${normBase}/energy/monitoring`,
    };
  }

  // 5. Intelligent Automation & Monitoring
  if (
    cat.includes("automation") ||
    cat.includes("monitoring") ||
    cat.includes("sensor") ||
    cat.includes("telemetry")
  ) {
    return {
      title: "Intelligent Infrastructure Automation",
      description:
        "Review our automated operational nodes, predictive failure diagnostics, and closed-loop environmental controls maintaining peak infrastructure stability.",
      url: `${normBase}/automation/monitoring`,
    };
  }

  // 6. Regional Infrastructure (South India)
  if (
    cat.includes("region") ||
    cat.includes("mdu") ||
    cat.includes("cjb") ||
    cat.includes("trz") ||
    cat.includes("ixe") ||
    cat.includes("madurai") ||
    cat.includes("coimbatore") ||
    cat.includes("trichy") ||
    cat.includes("mangalore")
  ) {
    return {
      title: "Regional Infrastructure Grid across South India",
      description:
        "Learn about our strategically distributed Tier-2 edge nodes across Madurai, Coimbatore, Trichy, and Mangalore, delivering sub-15ms regional latency.",
      url: `${normBase}/regions/overview`,
    };
  }

  // 7. Data Center & Cloud Solutions
  if (
    cat.includes("data center") ||
    cat.includes("datacenter") ||
    cat.includes("cloud") ||
    cat.includes("edge") ||
    cat.includes("capacity")
  ) {
    return {
      title: "Next-Generation Modular Data Center Architecture",
      description:
        "Examine our modular facility architecture, scalable power backups, and enterprise redundancy specifications for mission-critical digital operations.",
      url: `${normBase}/solutions/architecture-explorer`,
    };
  }

  // Default: Overview & Solutions
  return {
    title: "GreenNext Digital Infrastructure Solutions",
    description:
      "Explore how GreenNext unites AI compute acceleration, intelligent automation, and sustainable energy architectures for regional digital transformation.",
    url: `${normBase}/solutions`,
  };
}

/**
 * Renders the approved GreenNext visitor welcome email.
 */
export function renderVisitorWelcomeEmail(
  options: VisitorEmailTemplateOptions,
): RenderedEmailOutput {
  const isSim = options.isSimulation ?? true;
  const baseUrl = resolvePublicSiteUrl(options.siteBaseUrl, isSim);
  const websiteUrl = options.websiteUrl || baseUrl;
  const linkedInUrl = options.linkedInUrl || DEFAULT_LINKEDIN_URL;
  const contactUrl = options.contactUrl || `${baseUrl}/contact`;

  const headerBannerUrl =
    options.headerBannerUrl ||
    `${baseUrl}/images/email/greennext-email-header.png`;
  const footerBannerUrl =
    options.footerBannerUrl ||
    `${baseUrl}/images/email/greennext-email-footer.png`;

  const firstName = extractFirstName(options.recipientName);
  const formName = formatFormName(options.formType, options.leadType);
  const serviceContent = resolveServiceContent(
    options.categoryOrTopic,
    options.formType,
    options.leadType,
    baseUrl,
  );

  const escapedFirstName = escapeHtml(firstName);
  const escapedFormName = escapeHtml(formName);
  const escapedServiceTitle = escapeHtml(serviceContent.title);
  const escapedServiceDescription = escapeHtml(serviceContent.description);
  const escapedServiceUrl = escapeHtml(serviceContent.url);
  const escapedHeaderBanner = escapeHtml(headerBannerUrl);
  const escapedFooterBanner = escapeHtml(footerBannerUrl);
  const escapedWebsiteUrl = escapeHtml(websiteUrl);
  const escapedLinkedInUrl = escapeHtml(linkedInUrl);
  const escapedContactUrl = escapeHtml(contactUrl);

  const subject = `Thank you for contacting GreenNext – ${serviceContent.title}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GreenNext – Thank You for Connecting</title>
<style>
  body { margin:0; padding:24px 12px; background:#eef2f5; font-family:Arial,Helvetica,sans-serif; color:#172536; }
  .email { max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dce4eb; border-radius:6px; overflow:hidden; }
  .banner { display:block; width:100%; height:auto; border:0; }
  .body { padding:30px 34px; font-size:15px; line-height:1.7; }
  .eyebrow { color:#07815e; font-size:11px; font-weight:bold; letter-spacing:1.1px; text-transform:uppercase; }
  h1 { margin:8px 0 18px; font-size:24px; line-height:1.25; color:#102238; }
  h2 { margin:0 0 8px; font-size:17px; color:#102b42; }
  p { margin:0 0 16px; }
  .resource { margin:22px 0; padding:18px 20px; border:1px solid #dce8e4; border-left:4px solid #07815e; background:#f6faf8; border-radius:4px; }
  .resource p { margin:0; color:#435365; }
  .button-wrap { margin:24px 0 18px; }
  .button { display:inline-block; background:#087b60; color:#ffffff !important; text-decoration:none; font-weight:bold; padding:12px 20px; border-radius:4px; }
  .signoff { margin-top:22px; color:#172536; }
  .footer-links { text-align:center; padding:14px 10px; color:#415568; font-size:12px; }
  .footer-links a { color:#087b60; text-decoration:underline; }
  .smallprint { margin:0; font-size:11px; color:#68798a; line-height:1.5; }
  @media (max-width:520px) {
    body { padding:0; }
    .email { border:0; border-radius:0; }
    .body { padding:22px 20px; }
    h1 { font-size:21px; }
  }
</style>
</head>
<body>
<div class="email" role="article" aria-label="GreenNext welcome email">
  <img class="banner" src="${escapedHeaderBanner}" alt="GreenNext – AI Infrastructure. Sustainable Progress." width="680" height="152">
  <div class="body">
    <div class="eyebrow">Thank you for connecting with us</div>
    <h1>Hello ${escapedFirstName},</h1>
    <p>Thank you for your interest in GreenNext and for submitting our <strong>${escapedFormName}</strong> form.</p>
    <p>We are pleased to help you explore information relevant to your interests. Based on your submission, here is a good place to start.</p>
    <div class="resource">
      <h2>${escapedServiceTitle}</h2>
      <p>${escapedServiceDescription}</p>
    </div>
    <p>Explore our website to learn more about the technologies and solutions relevant to your goals.</p>
    <div class="button-wrap">
      <a class="button" href="${escapedServiceUrl}" target="_blank" rel="noopener noreferrer">Explore GreenNext</a>
    </div>
    <p>If you have any questions, you can contact our team using the details on our website.</p>
    <div class="signoff">Best regards,<br><strong>GreenNext Team</strong></div>
  </div>
  <img class="banner" src="${escapedFooterBanner}" alt="GreenNext – Sustainable Regional Digital Infrastructure" width="680" height="152">
  <div class="footer-links">
    <a href="${escapedWebsiteUrl}">Website</a> &nbsp;|&nbsp;
    <a href="${escapedLinkedInUrl}">LinkedIn</a> &nbsp;|&nbsp;
    <a href="${escapedContactUrl}">Contact</a>
  </div>
  <div style="padding:0 18px 18px;text-align:center">
    <p class="smallprint">You are receiving this email because you submitted a GreenNext form. If you did not submit this form, you can disregard this message.</p>
  </div>
</div>
</body>
</html>`;

  const plainText = `Hello ${firstName},

Thank you for your interest in GreenNext and for submitting our ${formName} form.

We are pleased to help you explore information relevant to your interests. Based on your submission, here is a good place to start:

${serviceContent.title}
${serviceContent.description}

Explore relevant technologies and infrastructure solutions:
${serviceContent.url}

If you have any questions, you can contact our team at ${contactUrl}.

Best regards,
GreenNext Team

---
Website: ${websiteUrl}
LinkedIn: ${linkedInUrl}
Contact: ${contactUrl}

You are receiving this email because you submitted a GreenNext form. If you did not submit this form, you can disregard this message.
`.trim();

  return {
    subject,
    html,
    plainText,
    serviceContent,
    firstName,
    formName,
    siteBaseUrl: baseUrl,
  };
}
