/**
 * GreenNext Inquiry Service
 *
 * Handles real transmission of user inquiries (Quick Inquiry and Long-Form Technical Inquiry)
 * to the Google Apps Script Web App endpoint, which writes to Spreadsheet 1 (Raw Data)
 * and updates Spreadsheet 2 (Analytics).
 *
 * Privacy & Security:
 * - Real inquiry submissions transmit user-submitted contact data directly to the authorized endpoint.
 * - General behavioral telemetry remains privacy-safe and free of PII.
 */

import { ANALYTICS_ENDPOINT, getSessionId, getSessionKind, getCurrentPage } from "./analytics";
import { readClientContext } from "./layer2-intelligence";
import { submitTechnicalInfrastructureInquiryToJira } from "./jira-inquiry.server-fn";

export const LEAD_TYPES = {
  session: "Technical Consultation / Session Booking",
  partner: "Partner / Collaboration Inquiry",
  technical: "Technical Infrastructure Inquiry",
  general: "General Contact Inquiry",
  career: "Career Inquiry",
} as const;

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES];

export const DOCUMENT_REQUIREMENTS: Record<LeadType, { required: boolean; label: string; helper: string }> = {
  [LEAD_TYPES.session]: {
    required: false,
    label: "Supporting Document (Optional)",
    helper: "Upload requirements, architecture notes, specifications, or other supporting material.",
  },
  [LEAD_TYPES.partner]: {
    required: true,
    label: "Partnership / Company Document *",
    helper: "Upload a company profile, partnership proposal, capability document, or relevant material.",
  },
  [LEAD_TYPES.technical]: {
    required: false,
    label: "Technical Document (Optional)",
    helper: "Upload technical requirements, specifications, architecture documents, or related material.",
  },
  [LEAD_TYPES.general]: {
    required: false,
    label: "Supporting Document (Optional)",
    helper: "Upload relevant supporting material if helpful.",
  },
  [LEAD_TYPES.career]: {
    required: true,
    label: "Resume / CV *",
    helper: "Upload your latest resume or CV.",
  },
};

export interface LeadDocument {
  fileName: string;
  mimeType: string;
  data: string;
}

export interface LeadPayload {
  leadType: LeadType;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  region?: string;
  topic: string;
  message: string;
  currentRole?: string;
  experienceLevel?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  page?: string;
  sessionId?: string;
  sessionKind?: string;
  timestamp?: string;
  document: LeadDocument | null;
}

const JIRA_LEAD_TYPES = {
  [LEAD_TYPES.session]: "session",
  [LEAD_TYPES.partner]: "partner",
  [LEAD_TYPES.technical]: "technical",
  [LEAD_TYPES.career]: "career",
  [LEAD_TYPES.general]: "general",
} as const;

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const ACCEPTED_DOCUMENT_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export async function serializeLeadDocument(file: File | null): Promise<LeadDocument | null> {
  if (!file) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return { fileName: file.name, mimeType: file.type || "application/octet-stream", data: btoa(binary) };
}

export interface QuickInquiryData {
  name: string;
  email: string;
  phone?: string;
  interest: string;
  message: string;
  page?: string;
}

export interface LongFormInquiryData {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  category: string;
  region: string;
  message: string;
  page?: string;
  document?: LeadDocument | null;
}

export interface InquiryResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function createRequestId(parts: string[]): Promise<string> {
  const canonical = parts.map((part) => part.trim()).join("\u001f");
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    return `gn_req_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return `gn_req_${btoa(canonical).replace(/[^a-z0-9]/gi, "").slice(0, 96)}`;
  }
}

/** Shared website-side lead payload for the next Apps Script integration step. */
export async function submitLead(data: LeadPayload): Promise<InquiryResult> {
  const page = data.page || getCurrentPage();
  const sessionId = data.sessionId || getSessionId();
  const requestId = await createRequestId([
    data.leadType, data.name, data.email, data.phone || "", data.organization || "",
    data.region || "", data.topic, data.message, sessionId, data.document?.fileName || "",
  ]);
  const payload = {
    ...data,
    ...getContextPayload(page),
    sheet: "Contact_Submissions",
    phone: data.phone || "",
    organization: data.organization || "",
    region: data.region || "",
    currentRole: data.currentRole || "",
    experienceLevel: data.experienceLevel || "",
    linkedinUrl: data.linkedinUrl || "",
    portfolioUrl: data.portfolioUrl || "",
    page,
    sessionId,
    sessionKind: data.sessionKind || getSessionKind(),
    requestId,
    timestamp: data.timestamp || new Date().toISOString(),
    document: data.document || null,
    formType: "lead_inquiry",
  };
  const inquiryResult = await postInquiryPayload(payload, `Lead: ${data.leadType}`);
  if (!inquiryResult.success) return inquiryResult;

  try {
    const jiraResult = await submitTechnicalInfrastructureInquiryToJira({
      data: {
        leadType: JIRA_LEAD_TYPES[data.leadType],
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        organization: data.organization || "",
        region: data.region || "South India",
        category: data.topic || "General Requirements",
        message: data.message,
        page: payload.page,
        sessionId: payload.sessionId,
        requestId,
        timestamp: payload.timestamp,
        documentFileName: data.document?.fileName || null,
      },
    });

    if (jiraResult.status === "failed") {
      return {
        ...inquiryResult,
        message: "Inquiry recorded successfully. Jira follow-up is pending.",
      };
    }
  } catch {
    return {
      ...inquiryResult,
      message: "Inquiry recorded successfully. Jira follow-up is pending.",
    };
  }

  return inquiryResult;
}

/**
 * Low-level transmitter with timeout and backward-compatibility fallback.
 */
async function postInquiryPayload(
  payload: Record<string, any>,
  fallbackCta: string,
): Promise<InquiryResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response
    }

    // If server responded with "Invalid sheet", the endpoint is running the legacy script.
    // Gracefully fallback to CTA Interactions so the lead is not lost and the user experiences success.
    if (data && data.success === false && data.message === "Invalid sheet.") {
      try {
        const fallbackPayload = {
          ...payload,
          sheet: "CTA Interactions",
          cta: fallbackCta,
        };
        const fallbackRes = await fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(fallbackPayload),
        });
        const fallbackText = await fallbackRes.text();
        const fallbackData = JSON.parse(fallbackText);
        if (fallbackData && fallbackData.success) {
          return {
            success: true,
            message: "Inquiry recorded successfully.",
          };
        }
      } catch {
        // Fallback fetch failed, proceed with original response handling
      }
    }

    if (data && data.success === false) {
      return {
        success: false,
        error: data.message || "Submission was not accepted by the server. Please try again.",
      };
    }

    if (response.ok || (data && data.success === true)) {
      return {
        success: true,
        message: data?.message || "Inquiry transmitted successfully.",
      };
    }

    return {
      success: false,
      error: `Server responded with status ${response.status}. Please try again.`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        success: false,
        error: "Network request timed out. Please check your internet connection and try again.",
      };
    }
    return {
      success: false,
      error: "Unable to connect to the inquiry service. Please check your network connection and try again.",
    };
  }
}

/**
 * Submits a Quick Inquiry form to the Google Apps Script backend.
 * Dedicated sheet: Quick_Inquiries
 */
export async function submitQuickInquiry(data: QuickInquiryData): Promise<InquiryResult> {
  const page = data.page || getCurrentPage();
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();
  const requestId = await createRequestId(["quick", data.name, data.email, data.phone || "", data.interest, data.message, sessionId]);

  const payload = {
    ...getContextPayload(page),
    sheet: "Quick_Inquiries",
    formType: "quick_inquiry",
    event: "quick_inquiry_submit",
    leadType: LEAD_TYPES.general,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    interest: data.interest || "General Inquiry",
    message: data.message,
    page,
    sessionId,
    sessionKind: getSessionKind(),
    requestId,
    timestamp,
  };

  const fallbackCta = `Quick Inquiry: ${data.interest || "General"}`;
  const inquiryResult = await postInquiryPayload(payload, fallbackCta);
  if (!inquiryResult.success) return inquiryResult;

  try {
    const jiraResult = await submitTechnicalInfrastructureInquiryToJira({
      data: {
        leadType: "general",
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        organization: "",
        region: "South India",
        category: data.interest || "General Inquiry",
        message: data.message,
        page,
        sessionId,
        requestId,
        timestamp,
        documentFileName: null,
      },
    });

    if (jiraResult.status === "failed") {
      return {
        ...inquiryResult,
        message: "Inquiry recorded successfully. Jira follow-up is pending.",
      };
    }
  } catch {
    return {
      ...inquiryResult,
      message: "Inquiry recorded successfully. Jira follow-up is pending.",
    };
  }

  return inquiryResult;
}

/**
 * Submits a Long-Form Technical Inquiry to the Google Apps Script backend.
 * Dedicated sheet: Contact_Submissions
 */
export async function submitLongFormInquiry(data: LongFormInquiryData): Promise<InquiryResult> {
  const page = data.page || getCurrentPage();
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();
  const requestId = await createRequestId(["long", data.name, data.email, data.phone || "", data.organization || "", data.category, data.region, data.message, sessionId, data.document?.fileName || ""]);

  const payload = {
    ...getContextPayload(page),
    sheet: "Contact_Submissions",
    formType: "long_form_inquiry",
    event: "long_form_inquiry_submit",
    leadType: LEAD_TYPES.technical,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    organization: data.organization || "",
    category: data.category || "General Requirements",
    region: data.region || "South India",
    message: data.message,
    page,
    sessionId,
    sessionKind: getSessionKind(),
    requestId,
    timestamp,
    document: data.document || null,
  };

  const fallbackCta = `Long Form: ${data.category} | ${data.region}`;
  const inquiryResult = await postInquiryPayload(payload, fallbackCta);
  if (!inquiryResult.success) return inquiryResult;

  try {
    const jiraResult = await submitTechnicalInfrastructureInquiryToJira({
      data: {
        leadType: "technical",
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        organization: data.organization || "",
        region: data.region || "South India",
        category: data.category || "General Requirements",
        message: data.message,
        page,
        sessionId,
        requestId,
        timestamp,
        documentFileName: data.document?.fileName || null,
      },
    });

    if (jiraResult.status === "failed") {
      return {
        ...inquiryResult,
        message: "Inquiry recorded successfully. Jira follow-up is pending.",
      };
    }
  } catch {
    return {
      ...inquiryResult,
      message: "Inquiry recorded successfully. Jira follow-up is pending.",
    };
  }

  return inquiryResult;
}

function getContextPayload(page: string): Record<string, string> {
  const context = readClientContext(page);
  return {
    siteHost: context.siteHost,
    trafficSource: context.trafficSource,
    referrerUrl: context.referrerUrl,
    landingPage: context.landingPage,
    utmSource: context.utmSource,
    utmMedium: context.utmMedium,
    utmCampaign: context.utmCampaign,
    utmTerm: context.utmTerm,
    utmContent: context.utmContent,
    timezone: context.timezone,
    utcOffset: context.utcOffset,
    activityLocalHour: context.activityLocalHour,
    activityDay: context.activityDay,
  };
}
