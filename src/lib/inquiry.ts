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

import { ANALYTICS_ENDPOINT, getSessionId, getCurrentPage } from "./analytics";

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

/** Shared website-side lead payload for the next Apps Script integration step. */
export async function submitLead(data: LeadPayload): Promise<InquiryResult> {
  const payload = {
    ...data,
    phone: data.phone || "",
    organization: data.organization || "",
    region: data.region || "",
    currentRole: data.currentRole || "",
    experienceLevel: data.experienceLevel || "",
    linkedinUrl: data.linkedinUrl || "",
    portfolioUrl: data.portfolioUrl || "",
    page: data.page || getCurrentPage(),
    sessionId: data.sessionId || getSessionId(),
    sessionKind: data.sessionKind || "",
    timestamp: data.timestamp || new Date().toISOString(),
    document: data.document || null,
    formType: "lead_inquiry",
  };
  return postInquiryPayload(payload, `Lead: ${data.leadType}`);
}

/**
 * Low-level transmitter with timeout and backward-compatibility fallback.
 */
async function postInquiryPayload(
  payload: Record<string, any>,
  fallbackCta: string,
): Promise<InquiryResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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

  const payload = {
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
    timestamp,
  };

  const fallbackCta = `Quick Inquiry: ${data.interest || "General"}`;
  return postInquiryPayload(payload, fallbackCta);
}

/**
 * Submits a Long-Form Technical Inquiry to the Google Apps Script backend.
 * Dedicated sheet: Contact_Submissions
 */
export async function submitLongFormInquiry(data: LongFormInquiryData): Promise<InquiryResult> {
  const page = data.page || getCurrentPage();
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();

  const payload = {
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
    timestamp,
    document: data.document || null,
  };

  const fallbackCta = `Long Form: ${data.category} | ${data.region}`;
  return postInquiryPayload(payload, fallbackCta);
}
