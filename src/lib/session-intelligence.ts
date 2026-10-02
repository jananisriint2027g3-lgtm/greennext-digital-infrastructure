export interface SessionEvent {
  sessionId: string;
  sessionKind?: string;
  event: string;
  page?: string;
  value?: string;
  timestamp: string | number | Date;
  sourceTab?: string;
}

export interface SessionIntelligenceRecord {
  session_id: string;
  session_type: string;
  session_start_time: string | null;
  session_end_time: string | null;
  entry_page: string | null;
  pages_visited: string[];
  pages_count: number;
  navigation_flow: string;
  exit_page: string | null;
  total_session_duration: number | null;
  page_dwell_times: Record<string, { page_start: string; page_end: string; active_time: number }>;
  bounce: boolean | null;
  engaged: boolean;
  total_events: number;
  cta_interactions: number;
  form_interactions: number;
  lead_conversion: boolean;
  session_end_observed: boolean;
}

const HOUSEKEEPING_EVENTS = new Set(["page_view", "nav_page_view", "scroll_25", "scroll_50", "scroll_75", "scroll_90", "scroll_100", "time_on_page", "session_end"]);

function toTimestamp(value: SessionEvent["timestamp"]): number {
  const result = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(result) ? result : 0;
}

function pageFor(event: SessionEvent): string {
  return (event.page || (event.event === "page_view" ? event.value : "") || "/").trim() || "/";
}

function isPageView(event: SessionEvent): boolean {
  return event.event === "page_view" || event.event === "nav_page_view";
}

function isMeaningful(event: SessionEvent): boolean {
  return !HOUSEKEEPING_EVENTS.has(event.event) && !event.event.startsWith("engagement_");
}

export function reconstructSession(events: SessionEvent[]): SessionIntelligenceRecord | null {
  const usable = events
    .map((event, index) => ({ event, index, time: toTimestamp(event.timestamp) }))
    .filter((item) => item.event.sessionId && item.event.sessionId !== "session_fallback" && item.time > 0)
    .sort((a, b) => a.time - b.time || a.index - b.index);
  if (!usable.length) return null;

  const deduped = usable.filter((item, index, all) => {
    const previous = all[index - 1];
    if (!previous) return true;
    return ["event", "page", "value", "sourceTab"].some((key) => item.event[key as keyof SessionEvent] !== previous.event[key as keyof SessionEvent]);
  });
  const first = deduped[0]!;
  const last = deduped[deduped.length - 1]!;
  const pageEvents = deduped.filter((item) => isPageView(item.event));
  const pages: string[] = [];
  let lastPageTime = 0;
  pageEvents.forEach((item) => {
    const page = pageFor(item.event);
    if (pages[pages.length - 1] === page && item.time - lastPageTime <= 2000) return;
    pages.push(page);
    lastPageTime = item.time;
  });
  const dwell: Record<string, { page_start: string; page_end: string; active_time: number }> = {};
  pageEvents.forEach((item) => {
    const page = pageFor(item.event);
    const timestamp = new Date(item.time).toISOString();
    if (!dwell[page]) dwell[page] = { page_start: timestamp, page_end: timestamp, active_time: 0 };
    dwell[page].page_end = timestamp;
  });
  deduped.forEach((item) => {
    if (item.event.event !== "time_on_page") return;
    const activeMs = Number(item.event.value);
    const page = pageFor(item.event);
    if (Number.isFinite(activeMs) && activeMs >= 0) {
      if (!dwell[page]) {
        const timestamp = new Date(item.time).toISOString();
        dwell[page] = { page_start: timestamp, page_end: timestamp, active_time: 0 };
      }
      dwell[page].active_time += activeMs;
      dwell[page].page_end = new Date(item.time).toISOString();
    }
  });
  const meaningful = deduped.filter((item) => isMeaningful(item.event));
  const ctaInteractions = deduped.filter((item) => item.event.sourceTab === "CTA Interactions" && isMeaningful(item.event)).length;
  const formInteractions = deduped.filter((item) => /^(form_|lead_conversion)/.test(item.event.event)).length;
  const leadConversion = deduped.some((item) => item.event.event === "lead_conversion" || item.event.event === "form_submit");
  const engaged = pages.length > 1 || meaningful.some((item) => item.event.event.startsWith("engagement_") || item.event.event === "scroll_50" || item.event.event === "scroll_75" || item.event.event === "scroll_90" || item.event.event === "scroll_100" || item.event.event === "lead_conversion" || item.event.event.startsWith("form_") || item.event.sourceTab === "CTA Interactions");
  const sessionEnd = deduped.find((item) => item.event.event === "session_end");
  const endTime = sessionEnd?.time || last.time;
  return {
    session_id: first.event.sessionId,
    session_type: first.event.sessionKind || "unknown",
    session_start_time: new Date(first.time).toISOString(),
    session_end_time: new Date(endTime).toISOString(),
    entry_page: pages[0] || pageFor(first.event),
    pages_visited: pages,
    pages_count: pages.length,
    navigation_flow: pages.join(" → "),
    exit_page: pages[pages.length - 1] || pageFor(last.event),
    total_session_duration: endTime - first.time,
    page_dwell_times: dwell,
    bounce: pages.length === 1 && !engaged && !leadConversion,
    engaged,
    total_events: deduped.length,
    cta_interactions: ctaInteractions,
    form_interactions: formInteractions,
    lead_conversion: leadConversion,
    session_end_observed: Boolean(sessionEnd),
  };
}

export function reconstructSessions(events: SessionEvent[]): SessionIntelligenceRecord[] {
  const bySession = new Map<string, SessionEvent[]>();
  events.forEach((event) => {
    if (!event.sessionId) return;
    const bucket = bySession.get(event.sessionId) || [];
    bucket.push(event);
    bySession.set(event.sessionId, bucket);
  });
  return [...bySession.values()].map(reconstructSession).filter((record): record is SessionIntelligenceRecord => Boolean(record));
}
