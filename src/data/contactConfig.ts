/**
 * GreenNext Central Contact & Inquiry Configuration
 *
 * Current State: Website Prototype / Demo
 * All submissions are isolated frontend simulations.
 * No real email sending, backend storage, CRM, or external API communication.
 */
export const CONTACT_CONFIG = {
  // Demo submission handler isolating simulation logic in a single location for future integration
  submitInquiryDemo: async (
    _payload: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> => {
    // Pure frontend simulation — no network request, no data storage
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Thank you. Your inquiry has been received for demonstration purposes.",
        });
      }, 350);
    });
  },
};
