/**
 * GreenNext Central Contact & Inquiry Configuration
 *
 * Connected directly to the GreenNext Google Apps Script backend and Google Sheets.
 * Dispatches real form submissions to the dedicated Raw Data spreadsheets.
 */

import {
  submitQuickInquiry,
  submitLongFormInquiry,
  type QuickInquiryData,
  type LongFormInquiryData,
  type InquiryResult,
} from "../lib/inquiry";

export const CONTACT_CONFIG = {
  submitQuickInquiry: async (data: QuickInquiryData): Promise<InquiryResult> => {
    return submitQuickInquiry(data);
  },

  submitLongFormInquiry: async (data: LongFormInquiryData): Promise<InquiryResult> => {
    return submitLongFormInquiry(data);
  },

  /**
   * Compatibility wrapper for existing callers.
   * Directs payload to real inquiry backend.
   */
  submitInquiryDemo: async (
    payload: Record<string, any>,
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    if ("category" in payload || "organization" in payload) {
      const res = await submitLongFormInquiry(payload as LongFormInquiryData);
      return {
        success: res.success,
        message: res.message || (res.success ? "Inquiry submitted successfully." : "Submission failed."),
        error: res.error,
      };
    } else {
      const res = await submitQuickInquiry(payload as QuickInquiryData);
      return {
        success: res.success,
        message: res.message || (res.success ? "Inquiry submitted successfully." : "Submission failed."),
        error: res.error,
      };
    }
  },
};
