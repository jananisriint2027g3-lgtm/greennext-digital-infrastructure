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
}

export interface InquiryResult {
  success: boolean;
  message?: string;
  error?: string;
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
  };

  const fallbackCta = `Long Form: ${data.category} | ${data.region}`;
  return postInquiryPayload(payload, fallbackCta);
}
