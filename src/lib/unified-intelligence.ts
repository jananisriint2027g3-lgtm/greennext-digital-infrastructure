export interface UnifiedSession {
  session_id: string;
  session_type?: string;
  session_start_time?: string;
  session_end_time?: string;
  entry_page?: string;
  exit_page?: string;
  pages_count: number;
  navigation_flow?: string;
  total_session_duration?: number | null;
  bounce?: boolean | null;
  engaged?: boolean;
  traffic_source?: string;
  referrer_url?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  geo_country?: string;
  geo_region?: string;
  geo_city?: string;
  geo_confidence?: string;
  geo_source?: string;
  timezone?: string;
  activity_day?: string;
  activity_local_hour?: string;
  network_type?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  network_confidence?: string;
  network_source?: string;
  suspicious_traffic?: boolean;
  suspicious_reason?: string;
  total_events: number;
  cta_interactions: number;
  form_interactions: number;
  lead_conversion: boolean;
  page_dwell_times?: Record<string, { active_time?: number }>;
}

export interface UnifiedProfile extends UnifiedSession {
  engagement_segment: "low" | "medium" | "high" | "converted";
  behavior_patterns: string[];
}

export function activeDwellMs(session: UnifiedSession): number {
  return Object.values(session.page_dwell_times || {}).reduce((total, page) => total + (Number(page.active_time) || 0), 0);
}

export function engagementSegment(session: UnifiedSession): UnifiedProfile["engagement_segment"] {
  if (session.lead_conversion) return "converted";
  const dwell = activeDwellMs(session);
  if (dwell >= 120000 && session.pages_count >= 3 && (session.cta_interactions > 0 || session.form_interactions > 0)) return "high";
  if (session.pages_count >= 2 || session.engaged || session.total_events >= 3) return "medium";
  return "low";
}

export function behaviorPatterns(session: UnifiedSession): string[] {
  const patterns: string[] = [];
  if (session.pages_count <= 1) patterns.push("single_page");
  if (session.pages_count >= 3) patterns.push("deep_navigation");
  if (engagementSegment(session) === "high") patterns.push("high_engagement");
  if (session.cta_interactions > 0) patterns.push("cta_driven");
  if (session.form_interactions > 0) patterns.push("form_driven");
  if (session.lead_conversion) patterns.push("converted");
  if (session.session_type === "returning_session" && session.engaged) patterns.push("returning_engaged");
  if (session.utm_campaign && session.engaged) patterns.push("campaign_engaged");
  return patterns;
}

export function unifySessions(sessions: UnifiedSession[]): UnifiedProfile[] {
  const byId = new Map<string, UnifiedSession>();
  sessions.forEach((session) => {
    if (!session.session_id || byId.has(session.session_id)) return;
    byId.set(session.session_id, session);
  });
  return [...byId.values()].map((session) => ({
    ...session,
    engagement_segment: engagementSegment(session),
    behavior_patterns: behaviorPatterns(session),
  }));
}

export function aggregateBy(sessions: UnifiedProfile[], selector: (session: UnifiedProfile) => string): Record<string, { sessions: number; engaged_sessions: number; bounce_sessions: number; conversions: number; total_duration: number; total_pages: number }> {
  const groups: Record<string, { sessions: number; engaged_sessions: number; bounce_sessions: number; conversions: number; total_duration: number; total_pages: number }> = {};
  sessions.forEach((session) => {
    const key = selector(session) || "Unavailable";
    const group = groups[key] || { sessions: 0, engaged_sessions: 0, bounce_sessions: 0, conversions: 0, total_duration: 0, total_pages: 0 };
    group.sessions += 1;
    group.engaged_sessions += session.engaged ? 1 : 0;
    group.bounce_sessions += session.bounce ? 1 : 0;
    group.conversions += session.lead_conversion ? 1 : 0;
    group.total_duration += Number(session.total_session_duration) || 0;
    group.total_pages += Number(session.pages_count) || 0;
    groups[key] = group;
  });
  return groups;
}

export function conversionRate(sessions: number, conversions: number): string {
  return sessions > 0 ? `${((conversions / sessions) * 100).toFixed(1)}%` : "N/A";
}
