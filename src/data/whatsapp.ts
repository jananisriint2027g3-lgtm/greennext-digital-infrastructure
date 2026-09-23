/**
 * GreenNext WhatsApp Direct CTA Configuration
 * 
 * CRITICAL RULE:
 * Strictly avoids inventing or fabricating any phone numbers.
 * When real number is unavailable, defaults to clearly identifiable placeholder "WHATSAPP_NUMBER".
 */
export const WHATSAPP_CONFIG = {
  // Configured placeholder / environment variable hook
  placeholder: "WHATSAPP_NUMBER",
  phoneNumber:
    (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_PHONE) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WHATSAPP_PHONE) ||
    "WHATSAPP_NUMBER",
  defaultMessage:
    "Hello GreenNext team, I would like to discuss digital infrastructure requirements and regional planning.",

  isConfigured: (): boolean => {
    const num = WHATSAPP_CONFIG.phoneNumber;
    return Boolean(
      num &&
      num !== "WHATSAPP_NUMBER" &&
      !num.includes("00000") &&
      num.trim().length > 5
    );
  },

  getUrl: (customMessage?: string): string => {
    if (!WHATSAPP_CONFIG.isConfigured()) {
      return "#whatsapp-placeholder";
    }
    const text = encodeURIComponent(customMessage || WHATSAPP_CONFIG.defaultMessage);
    return `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${text}`;
  },
};
