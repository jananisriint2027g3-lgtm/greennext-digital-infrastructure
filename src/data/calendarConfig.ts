/**
 * GreenNext Google Calendar Appointment Schedule Configuration
 *
 * Used after a user submits the Technical Session booking inquiry.
 * When configured, visitors can open the Google Calendar appointment
 * schedule in a new tab to pick their preferred session time.
 *
 * CRITICAL RULE:
 * Strictly avoids inventing or hard-coding any appointment URLs.
 * If not configured via VITE_GOOGLE_CALENDAR_APPOINTMENT_URL, remains unconfigured.
 */

const RAW_CALENDAR_URL =
  (typeof process !== "undefined" && process.env?.["VITE_GOOGLE_CALENDAR_APPOINTMENT_URL"]) ||
  (typeof import.meta !== "undefined" &&
    import.meta.env?.["VITE_GOOGLE_CALENDAR_APPOINTMENT_URL"]) ||
  "";

export const CALENDAR_SCHEDULE_CONFIG = {
  envVarName: "VITE_GOOGLE_CALENDAR_APPOINTMENT_URL",
  rawUrl: RAW_CALENDAR_URL,

  /**
   * Returns true only when a valid HTTPS/HTTP URL is set
   * and not a placeholder string.
   */
  isConfigured: (): boolean => {
    const trimmed = String(CALENDAR_SCHEDULE_CONFIG.rawUrl || "").trim();
    if (!trimmed) return false;
    if (
      trimmed.includes("PASTE_YOUR_") ||
      trimmed.includes("YOUR_CALENDAR") ||
      trimmed.startsWith("#")
    ) {
      return false;
    }
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  },

  /**
   * Returns the appointment schedule URL if configured, or null.
   */
  getAppointmentUrl: (): string | null => {
    if (!CALENDAR_SCHEDULE_CONFIG.isConfigured()) {
      return null;
    }
    return String(CALENDAR_SCHEDULE_CONFIG.rawUrl).trim();
  },
};
