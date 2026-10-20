/**
 * GreenNext Visitor Experience & Greeting Service
 *
 * Implements a privacy-conscious visitor recognition and greeting system
 * that distinguishes between first-time visitors and returning visitors,
 * and rotates welcome messages across separate visits so the experience
 * feels fresh and conversational.
 *
 * Requirements addressed:
 * - Distinguish first-time vs returning visitors without fingerprinting.
 * - Separate configurable message collections for website and AI chat.
 * - Rotate messages across visits avoiding consecutive repeats.
 * - Cache chosen greetings per session to prevent churn on re-render / page nav.
 * - Graceful degradation when browser storage is unavailable or restricted.
 */

export const FIRST_TIME_WEBSITE_GREETINGS = [
  "Welcome to GreenNext! Explore intelligent infrastructure, sustainable technology, and AI-powered solutions.",
  "Welcome to GreenNext. Discover AI-ready digital infrastructure, sustainable energy, and intelligent automation.",
  "Welcome to GreenNext! Connecting intelligent compute, efficiency, and regional infrastructure.",
] as const;

export const RETURNING_WEBSITE_GREETINGS = [
  "Welcome back! Ready to explore what's new at GreenNext?",
  "Good to see you again! What would you like to discover today?",
  "Welcome back to GreenNext. Let's continue exploring smarter infrastructure.",
  "You're back! Discover more possibilities with GreenNext.",
  "Great to have you here again. Where would you like to start?",
  "Welcome back! Your next discovery starts here.",
] as const;

export const FIRST_TIME_CHAT_GREETINGS = [
  "Hello! I'm the GreenNext AI assistant. I can help you explore our infrastructure services, sustainability initiatives, and technology solutions. What would you like to know?",
  "Welcome to GreenNext! I'm your digital infrastructure assistant. Feel free to ask about our compute, cooling, automation, or regional focus areas.",
] as const;

export const RETURNING_CHAT_GREETINGS = [
  "Welcome back! What can I help you explore today?",
  "Good to see you again! Would you like to learn about infrastructure, sustainability, or AI solutions?",
  "Welcome back to GreenNext. What would you like to discover next?",
  "Hello again! I'm ready to help you find the information you need.",
  "You're back! Let's explore another GreenNext topic together.",
  "Welcome back! What questions can I help you answer today?",
] as const;

export const VISITOR_STORAGE_KEYS = {
  VISITOR_ID: "gn_visitor_id",
  VISIT_COUNT: "gn_visitor_visit_count",
  LAST_VISIT_TIME: "gn_visitor_last_visit_at",
  LAST_WEBSITE_GREETING_INDEX: "gn_visitor_website_greeting_idx",
  LAST_CHAT_GREETING_INDEX: "gn_visitor_chat_greeting_idx",
  SESSION_ID: "gn_visitor_session_id",
  SESSION_WEBSITE_GREETING: "gn_session_website_greeting",
  SESSION_WEBSITE_GREETING_KIND: "gn_session_website_greeting_kind",
  SESSION_WEBSITE_DISMISSED: "gn_session_website_dismissed",
  SESSION_CHAT_GREETING: "gn_session_chat_greeting",
  SESSION_CHAT_GREETING_KIND: "gn_session_chat_greeting_kind",
} as const;

// In-memory fallback if storage is disabled or unavailable (private browsing, cookies blocked)
const memoryStorage: Record<string, string> = {};

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__gn_test_storage__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // Storage access is denied or quota exceeded
  }
  return null;
}

function safeSessionStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const testKey = "__gn_test_session__";
      window.sessionStorage.setItem(testKey, "1");
      window.sessionStorage.removeItem(testKey);
      return window.sessionStorage;
    }
  } catch {
    // SessionStorage access is denied
  }
  return null;
}

function getStoredItem(key: string, isSession = false): string | null {
  const store = isSession ? safeSessionStorage() : safeLocalStorage();
  if (store) {
    try {
      return store.getItem(key);
    } catch {
      return memoryStorage[key] ?? null;
    }
  }
  return memoryStorage[key] ?? null;
}

function setStoredItem(key: string, value: string, isSession = false): void {
  const store = isSession ? safeSessionStorage() : safeLocalStorage();
  if (store) {
    try {
      store.setItem(key, value);
      return;
    } catch {
      // Fall through to memory storage
    }
  }
  memoryStorage[key] = value;
}

function removeStoredItem(key: string, isSession = false): void {
  const store = isSession ? safeSessionStorage() : safeLocalStorage();
  if (store) {
    try {
      store.removeItem(key);
      return;
    } catch {
      // Fall through to memory storage
    }
  }
  delete memoryStorage[key];
}

/**
 * Returns or generates an anonymous, non-identifying visitor identifier.
 * Does not collect personal data, IP addresses, or browser fingerprints.
 */
export function getAnonymousVisitorId(): string {
  const existing = getStoredItem(VISITOR_STORAGE_KEYS.VISITOR_ID, false);
  if (existing && /^gn_v_[A-Za-z0-9_-]{8,100}$/.test(existing)) {
    return existing;
  }
  let id = "";
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      id = `gn_v_${crypto.randomUUID()}`;
    }
  } catch {
    // Fallback to timestamp + random
  }
  if (!id) {
    id = `gn_v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
  setStoredItem(VISITOR_STORAGE_KEYS.VISITOR_ID, id, false);
  return id;
}

/**
 * Generates an anonymous session ID for greeting rotation scope.
 */
function generateSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `gn_gs_${crypto.randomUUID()}`;
    }
  } catch {
    // Fallback
  }
  return `gn_gs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface VisitorStatus {
  isReturning: boolean;
  visitCount: number;
  sessionId: string;
}

/**
 * Initializes and synchronizes the visitor's visit status for the current session.
 * - Detects if this is a new session or continuation of an active session.
 * - Distinguishes first-time visitors (visitCount === 1) from returning visitors (visitCount > 1).
 * - Avoids incrementing visit counts during navigation or refreshes within the same session.
 */
export function syncVisitorSession(): VisitorStatus {
  if (typeof window === "undefined") {
    return { isReturning: false, visitCount: 1, sessionId: "ssr" };
  }

  // Ensure visitor ID exists
  getAnonymousVisitorId();

  let activeSessionId = getStoredItem(VISITOR_STORAGE_KEYS.SESSION_ID, true);
  const rawVisitCount = getStoredItem(VISITOR_STORAGE_KEYS.VISIT_COUNT, false);
  let visitCount = rawVisitCount ? parseInt(rawVisitCount, 10) : 0;
  if (isNaN(visitCount) || visitCount < 0) visitCount = 0;

  // Also check if existing application profile or analytics session seen indicates prior visit
  const existingProfile = getStoredItem("gn_visitor_profile", false);
  const existingAnalytics = getStoredItem("gn_analytics_session_seen", false);
  const hasPriorHistory = visitCount > 0 || Boolean(existingProfile) || Boolean(existingAnalytics);

  if (!activeSessionId) {
    // A new session / visit has started
    activeSessionId = generateSessionId();
    setStoredItem(VISITOR_STORAGE_KEYS.SESSION_ID, activeSessionId, true);

    if (!hasPriorHistory) {
      // Brand-new first-time visitor
      visitCount = 1;
    } else {
      // Returning visitor
      visitCount = (visitCount > 0 ? visitCount : 1) + 1;
    }

    setStoredItem(VISITOR_STORAGE_KEYS.VISIT_COUNT, visitCount.toString(), false);
    setStoredItem(VISITOR_STORAGE_KEYS.LAST_VISIT_TIME, new Date().toISOString(), false);
  } else if (visitCount === 0) {
    visitCount = 1;
    setStoredItem(VISITOR_STORAGE_KEYS.VISIT_COUNT, "1", false);
  }

  const isReturning = visitCount > 1;

  return {
    isReturning,
    visitCount,
    sessionId: activeSessionId,
  };
}

/**
 * Checks whether the current visitor is recognized as a returning visitor.
 */
export function isReturningVisitor(): boolean {
  const status = syncVisitorSession();
  return status.isReturning;
}

/**
 * Helper to rotate an index within an array while guaranteeing that
 * consecutive selections do not repeat the immediately previous item.
 */
function getNextRotatedIndex(storageKey: string, collectionLength: number): number {
  if (collectionLength <= 1) return 0;

  const rawLastIdx = getStoredItem(storageKey, false);
  const lastIdx = rawLastIdx !== null ? parseInt(rawLastIdx, 10) : -1;

  let nextIdx: number;
  if (isNaN(lastIdx) || lastIdx < 0 || lastIdx >= collectionLength) {
    nextIdx = 0;
  } else {
    // Sequential round-robin guarantees consecutive visits never repeat
    nextIdx = (lastIdx + 1) % collectionLength;
  }

  setStoredItem(storageKey, nextIdx.toString(), false);
  return nextIdx;
}

export interface WebsiteGreetingResult {
  text: string;
  isReturning: boolean;
  isDismissed: boolean;
  visitCount: number;
}

/**
 * Retrieves the website greeting for the current visitor.
 * - First-time visitors receive the friendly GreenNext introductory message.
 * - Returning visitors receive a personalized welcome-back message rotated across visits.
 * - The greeting is cached for the duration of the current browsing session,
 *   so re-renders, page refreshes, and route navigations never cause greeting flicker or churn.
 */
export function getWebsiteGreeting(): WebsiteGreetingResult {
  if (typeof window === "undefined") {
    return {
      text: FIRST_TIME_WEBSITE_GREETINGS[0],
      isReturning: false,
      isDismissed: false,
      visitCount: 1,
    };
  }

  const status = syncVisitorSession();
  const isDismissed =
    getStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_DISMISSED, true) === "true";

  // Check if greeting has already been selected for this browsing session
  const sessionCachedGreeting = getStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_GREETING, true);
  if (sessionCachedGreeting) {
    return {
      text: sessionCachedGreeting,
      isReturning: status.isReturning,
      isDismissed,
      visitCount: status.visitCount,
    };
  }

  let selectedText: string;
  if (!status.isReturning) {
    selectedText = FIRST_TIME_WEBSITE_GREETINGS[0];
    setStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_GREETING_KIND, "first_time", true);
  } else {
    const idx = getNextRotatedIndex(
      VISITOR_STORAGE_KEYS.LAST_WEBSITE_GREETING_INDEX,
      RETURNING_WEBSITE_GREETINGS.length,
    );
    selectedText = RETURNING_WEBSITE_GREETINGS[idx] ?? RETURNING_WEBSITE_GREETINGS[0];
    setStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_GREETING_KIND, "returning", true);
  }

  // Cache in session storage so it remains stable for the entire browsing session
  setStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_GREETING, selectedText, true);

  return {
    text: selectedText,
    isReturning: status.isReturning,
    isDismissed,
    visitCount: status.visitCount,
  };
}

/**
 * Dismisses the website greeting banner for the remainder of the current browsing session.
 */
export function dismissWebsiteGreeting(): void {
  setStoredItem(VISITOR_STORAGE_KEYS.SESSION_WEBSITE_DISMISSED, "true", true);
}

export interface ChatGreetingResult {
  text: string;
  isReturning: boolean;
  visitCount: number;
}

/**
 * Retrieves the AI Chat opening message for the current visitor.
 * - First-time visitors receive the helpful assistant introduction.
 * - Returning visitors receive a rotated conversational welcome-back greeting.
 * - Caches the selected greeting within the session so navigations and re-renders do not shift it.
 */
export function getChatGreeting(): string {
  if (typeof window === "undefined") {
    return FIRST_TIME_CHAT_GREETINGS[0];
  }

  const status = syncVisitorSession();

  // Check if chat greeting was already picked for this session
  const sessionCachedGreeting = getStoredItem(VISITOR_STORAGE_KEYS.SESSION_CHAT_GREETING, true);
  if (sessionCachedGreeting) {
    return sessionCachedGreeting;
  }

  let selectedText: string;
  if (!status.isReturning) {
    selectedText = FIRST_TIME_CHAT_GREETINGS[0];
    setStoredItem(VISITOR_STORAGE_KEYS.SESSION_CHAT_GREETING_KIND, "first_time", true);
  } else {
    const idx = getNextRotatedIndex(
      VISITOR_STORAGE_KEYS.LAST_CHAT_GREETING_INDEX,
      RETURNING_CHAT_GREETINGS.length,
    );
    selectedText = RETURNING_CHAT_GREETINGS[idx] ?? RETURNING_CHAT_GREETINGS[0];
    setStoredItem(VISITOR_STORAGE_KEYS.SESSION_CHAT_GREETING_KIND, "returning", true);
  }

  setStoredItem(VISITOR_STORAGE_KEYS.SESSION_CHAT_GREETING, selectedText, true);
  return selectedText;
}

/**
 * Reset helper for testing environments.
 */
export function clearVisitorGreetingState(): void {
  const localStore = safeLocalStorage();
  const sessionStore = safeSessionStorage();

  Object.values(VISITOR_STORAGE_KEYS).forEach((key) => {
    try {
      localStore?.removeItem(key);
    } catch {
      // Ignored
    }
    try {
      sessionStore?.removeItem(key);
    } catch {
      // Ignored
    }
    delete memoryStorage[key];
  });
}
