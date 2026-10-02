export interface ActionEventInput {
  event: string;
  page: string;
  value: string;
  sourceTab: string;
  sessionId: string;
  sessionKind: string;
}

export interface VisitorProfile {
  visitorId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  sessionCount: number;
  lastSessionId: string;
  lastSessionEngaged: boolean;
  recentPages: string[];
  sectionVisits: Record<string, number>;
  engagedSections: Record<string, number>;
  meaningfulCtas: string[];
  interests: string[];
  converted: boolean;
  inquiryTypes: string[];
}

export interface VisitorActionContext {
  returningVisitor: boolean;
  recentPages: string[];
  dominantInterest: string;
  engagedSections: string[];
  meaningfulCta: string;
  converted: boolean;
  currentPage: string;
  currentSessionEngaged: boolean;
}

export interface PersonalizationRecommendation {
  show: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

const VISITOR_ID_KEY = "gn_visitor_id";
const VISITOR_PROFILE_KEY = "gn_visitor_profile";
const MAX_RECENT_PAGES = 6;
const MAX_CTA_VALUES = 5;
const MAX_INTERESTS = 6;

const SECTION_ROUTES: Record<string, { label: string; href: string }> = {
  infrastructure: { label: "AI-ready Infrastructure", href: "/infrastructure/ai-ready" },
  automation: { label: "Automation capabilities", href: "/automation/monitoring" },
  energy: { label: "Energy and cooling", href: "/energy/monitoring" },
  regions: { label: "Regional infrastructure", href: "/regions/overview" },
  solutions: { label: "GreenNext solutions", href: "/solutions" },
  sustainability: { label: "Sustainability planning", href: "/sustainability" },
  about: { label: "GreenNext", href: "/about/what-we-are" },
  contact: { label: "a technical conversation", href: "/contact" },
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function makeVisitorId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `gn_v_${crypto.randomUUID()}`;
  } catch {
    // Use the non-identifying fallback below.
  }
  return `gn_v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getVisitorId(): string {
  if (!canUseStorage()) return "visitor_ephemeral";
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing && /^gn_v_[A-Za-z0-9_-]{8,100}$/.test(existing)) return existing;
    const visitorId = makeVisitorId();
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    return "visitor_ephemeral";
  }
}

function emptyProfile(): VisitorProfile {
  return {
    visitorId: getVisitorId(),
    firstSeenAt: "",
    lastSeenAt: "",
    sessionCount: 0,
    lastSessionId: "",
    lastSessionEngaged: false,
    recentPages: [],
    sectionVisits: {},
    engagedSections: {},
    meaningfulCtas: [],
    interests: [],
    converted: false,
    inquiryTypes: [],
  };
}

function safeProfile(value: unknown): VisitorProfile {
  if (!value || typeof value !== "object") return emptyProfile();
  const input = value as Partial<VisitorProfile>;
  const profile = emptyProfile();
  profile.visitorId = typeof input.visitorId === "string" ? input.visitorId : profile.visitorId;
  profile.firstSeenAt = typeof input.firstSeenAt === "string" ? input.firstSeenAt : "";
  profile.lastSeenAt = typeof input.lastSeenAt === "string" ? input.lastSeenAt : "";
  profile.sessionCount = typeof input.sessionCount === "number" && input.sessionCount >= 0 ? Math.floor(input.sessionCount) : 0;
  profile.lastSessionId = typeof input.lastSessionId === "string" ? input.lastSessionId : "";
  profile.lastSessionEngaged = input.lastSessionEngaged === true;
  profile.recentPages = Array.isArray(input.recentPages) ? input.recentPages.filter((page): page is string => typeof page === "string").slice(0, MAX_RECENT_PAGES) : [];
  profile.sectionVisits = cleanCounts(input.sectionVisits);
  profile.engagedSections = cleanCounts(input.engagedSections);
  profile.meaningfulCtas = Array.isArray(input.meaningfulCtas) ? input.meaningfulCtas.filter((item): item is string => typeof item === "string").slice(0, MAX_CTA_VALUES) : [];
  profile.interests = Array.isArray(input.interests) ? input.interests.filter((item): item is string => typeof item === "string").slice(0, MAX_INTERESTS) : [];
  profile.converted = input.converted === true;
  profile.inquiryTypes = Array.isArray(input.inquiryTypes) ? input.inquiryTypes.filter((item): item is string => typeof item === "string").slice(0, MAX_CTA_VALUES) : [];
  return profile;
}

function cleanCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value).reduce<Record<string, number>>((result, [key, count]) => {
    if (/^[a-z-]{2,30}$/.test(key) && typeof count === "number" && Number.isFinite(count) && count > 0) result[key] = Math.floor(count);
    return result;
  }, {});
}

export function getVisitorProfile(): VisitorProfile {
  if (!canUseStorage()) return emptyProfile();
  try {
    return safeProfile(JSON.parse(window.localStorage.getItem(VISITOR_PROFILE_KEY) || "null"));
  } catch {
    return emptyProfile();
  }
}

function saveProfile(profile: VisitorProfile): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(VISITOR_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Personalization is optional and must not affect the website.
  }
}

export function sectionForPage(page: string): string {
  const segment = page.split("/").filter(Boolean)[0] || "home";
  return SECTION_ROUTES[segment] ? segment : segment === "home" ? "home" : "other";
}

function addRecent(list: string[], value: string, limit: number): string[] {
  if (!value || value === "/api/analytics") return list;
  return [value, ...list.filter((item) => item !== value)].slice(0, limit);
}

function addCount(counts: Record<string, number>, key: string): void {
  if (key !== "home" && key !== "other") counts[key] = (counts[key] || 0) + 1;
}

function addUnique(list: string[], value: string, limit: number): string[] {
  if (!value) return list;
  return [value, ...list.filter((item) => item !== value)].slice(0, limit);
}

function isMeaningfulEvent(event: ActionEventInput): boolean {
  return event.sourceTab === "CTA Interactions" && !["page_view", "nav_page_view", "time_on_page", "session_end"].includes(event.event) ||
    event.event.startsWith("form_") || event.event === "lead_conversion" || event.event.startsWith("engagement_");
}

export function recordActionEvent(event: ActionEventInput): VisitorProfile {
  const profile = getVisitorProfile();
  const now = new Date().toISOString();
  if (!profile.firstSeenAt) profile.firstSeenAt = now;
  if (event.sessionId && profile.lastSessionId !== event.sessionId) {
    profile.sessionCount += 1;
    profile.lastSessionId = event.sessionId;
    profile.lastSessionEngaged = false;
  }
  profile.lastSeenAt = now;
  profile.recentPages = addRecent(profile.recentPages, event.page, MAX_RECENT_PAGES);

  const section = sectionForPage(event.page);
  addCount(profile.sectionVisits, section);
  if (isMeaningfulEvent(event)) {
    addCount(profile.engagedSections, section);
    profile.lastSessionEngaged = true;
  }

  if (event.sourceTab === "CTA Interactions" && isMeaningfulEvent(event)) {
    profile.meaningfulCtas = addUnique(profile.meaningfulCtas, event.value, MAX_CTA_VALUES);
  }
  if (event.sourceTab === "AI Assistant" && event.value.startsWith("topic:")) {
    profile.interests = addUnique(profile.interests, event.value, MAX_INTERESTS);
  } else if (section !== "home" && section !== "other") {
    profile.interests = addUnique(profile.interests, section, MAX_INTERESTS);
  }
  if (event.event === "lead_conversion" || event.event === "form_submit") profile.converted = true;
  if (event.event.startsWith("form_") || event.event === "lead_conversion") {
    profile.inquiryTypes = addUnique(profile.inquiryTypes, event.value, MAX_CTA_VALUES);
  }
  saveProfile(profile);
  return profile;
}

function rankedKeys(counts: Record<string, number>): string[] {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key]) => key);
}

export function getVisitorActionContext(currentPage: string, sessionId = ""): VisitorActionContext {
  const profile = getVisitorProfile();
  const engagedSections = rankedKeys(profile.engagedSections).slice(0, 3);
  const dominantInterest = rankedKeys(profile.sectionVisits)[0] || profile.interests[0] || "infrastructure";
  const currentSessionEvents = Boolean(sessionId && profile.lastSessionId === sessionId);
  return {
    returningVisitor: profile.sessionCount > 1,
    recentPages: profile.recentPages.slice(0, 4),
    dominantInterest,
    engagedSections,
    meaningfulCta: profile.meaningfulCtas[0] || "",
    converted: profile.converted,
    currentPage,
    currentSessionEngaged: currentSessionEvents && profile.lastSessionEngaged,
  };
}

export function getPersonalizationRecommendation(currentPage: string, sessionId = ""): PersonalizationRecommendation {
  const context = getVisitorActionContext(currentPage, sessionId);
  const route = SECTION_ROUTES[context.dominantInterest] || SECTION_ROUTES["infrastructure"];
  if (!context.returningVisitor || !route || route.href === currentPage) {
    return { show: false, title: "", body: "", primaryLabel: "", primaryHref: "", secondaryLabel: "", secondaryHref: "" };
  }
  return {
    show: true,
    title: "Welcome back",
    body: `Continue exploring ${route.label.toLowerCase()} based on your recent GreenNext journey.`,
    primaryLabel: `Continue exploring ${route.label}`,
    primaryHref: route.href,
    secondaryLabel: "Explore another area",
    secondaryHref: context.engagedSections[1] && SECTION_ROUTES[context.engagedSections[1]] ? SECTION_ROUTES[context.engagedSections[1]]!.href : "/solutions",
  };
}

export function getAssistantVisitorContext(currentPage: string, sessionId = ""): VisitorActionContext {
  const context = getVisitorActionContext(currentPage, sessionId);
  return {
    returningVisitor: context.returningVisitor,
    recentPages: context.recentPages,
    dominantInterest: context.dominantInterest,
    engagedSections: context.engagedSections,
    meaningfulCta: context.meaningfulCta,
    converted: context.converted,
    currentPage: context.currentPage,
    currentSessionEngaged: context.currentSessionEngaged,
  };
}

