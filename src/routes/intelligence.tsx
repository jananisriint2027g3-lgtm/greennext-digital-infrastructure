/**
 * GreenNext Website Intelligence Platform — Main Dashboard Route
 *
 * Route: /intelligence
 *
 * A professional analytics workspace built on the existing GreenNext AI
 * application. Uses only first-party browser data — no fabricated statistics.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";

import {
  getLiveSessionSnapshot,
  getVisitorIntelligenceSummary,
  getEngagementSnapshot,
  getPropensitySnapshot,
  getLayerStatuses,
  getIntegrationHealth,
  buildConversionFunnel,
  calculateAttribution,
  getMaturityAssessment,
  type LiveSessionSnapshot,
  type VisitorIntelligenceSummary,
  type EngagementSnapshot,
  type LayerStatus,
  type IntegrationHealth,
} from "../lib/dashboard-data";
import { calculatePropensity } from "../lib/intelligence-schema";

// Components
import {
  DashboardOverview,
  DashboardSkeleton,
  TierArchitectureBanner,
} from "../components/intelligence/DashboardOverview";
import {
  SessionIntelligencePanel,
  TrafficIntelligencePanel,
  GeoIntelligencePanel,
  TimezoneIntelligencePanel,
  IPIntelligencePanel,
  BehaviorIntelligencePanel,
  RepeatVisitorPanel,
  InterestIntelligencePanel,
  ConversionIntelligencePanel,
  EngagementIntelligencePanel,
  PredictiveIntelligencePanel,
  RetentionIntelligencePanel,
  CognitiveIntelligencePanel,
} from "../components/intelligence/LayerPanels";
import {
  AnalyticsMaturityModel,
  ConversionFunnelChart,
  RFMSegmentationMatrix,
  AttributionModelChart,
  CohortRetentionHeatmap,
  IntelligenceMaturityRadar,
  PropensityScoringBands,
} from "../components/intelligence/AnalyticalModels";
import {
  IntegrationHealthPanel,
  PrivacyGovernancePanel,
} from "../components/intelligence/IntegrationPanels";

// ─── Route Definition ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Website Intelligence Platform | GreenNext AI" },
      {
        name: "description",
        content:
          "GreenNext Website Intelligence Platform — 13-layer analytics workspace with session, traffic, geo, behavioral, and strategic intelligence.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IntelligenceDashboard,
});

// ─── Navigation Sections ──────────────────────────────────────────────────────

type SectionId =
  | "overview"
  | "foundational"
  | "behavioral"
  | "strategic"
  | "models"
  | "events"
  | "datasources"
  | "privacy";

const NAV_SECTIONS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "foundational", label: "Foundational Intelligence", icon: "⬡" },
  { id: "behavioral", label: "Behavioral Intelligence", icon: "⬢" },
  { id: "strategic", label: "Strategic Intelligence", icon: "◈" },
  { id: "models", label: "Analytical Models", icon: "⬟" },
  { id: "events", label: "Events & Conversions", icon: "⬠" },
  { id: "datasources", label: "Data Sources", icon: "⬣" },
  { id: "privacy", label: "Privacy & Governance", icon: "⬡" },
];

// ─── Dashboard State ──────────────────────────────────────────────────────────

interface DashboardState {
  session: LiveSessionSnapshot | null;
  visitor: VisitorIntelligenceSummary | null;
  engagement: EngagementSnapshot | null;
  layerStatuses: LayerStatus[];
  integrations: IntegrationHealth[];
  loaded: boolean;
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function IntelligenceDashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState<DashboardState>({
    session: null,
    visitor: null,
    engagement: null,
    layerStatuses: [],
    integrations: [],
    loaded: false,
  });

  // Load all dashboard data on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getLiveSessionSnapshot();
    const visitor = getVisitorIntelligenceSummary();
    const engagement = getEngagementSnapshot();
    const layerStatuses = getLayerStatuses();
    const integrations = getIntegrationHealth();
    setState({ session, visitor, engagement, layerStatuses, integrations, loaded: true });
  }, []);

  const handleNavClick = useCallback((id: SectionId) => {
    setActiveSection(id);
    setSidebarOpen(false);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!state.loaded || !state.session || !state.visitor || !state.engagement) {
    return (
      <main className="min-h-screen bg-[#070A0E] p-6 lg:p-10">
        <DashboardSkeleton />
      </main>
    );
  }

  const { session, visitor, engagement, layerStatuses, integrations } = state;

  // Compute models
  const maturity = getMaturityAssessment();
  const propensity = getPropensitySnapshot();
  const funnel = buildConversionFunnel([]); // Empty — no persistent event store
  const attribution = calculateAttribution([], "last_touch");

  // Get layer statuses by ID
  const layerById = (id: string) =>
    layerStatuses.find((l) => l.id === id) ?? layerStatuses[0]!;

  return (
    <div className="min-h-screen bg-[#070A0E] flex flex-col">
      {/* Dashboard Header */}
      <header className="border-b border-[#1E293B] bg-[#0B0F17] px-6 py-4 sticky top-[64px] z-30">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#1A2234] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={sidebarOpen}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div>
              <h1 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <span className="text-[#10B981]">GreenNext</span>
                <span className="text-[#94A3B8]">/</span>
                Website Intelligence Platform
              </h1>
              <p className="text-[11px] text-[#64748B]">
                13-layer analytics workspace · First-party data only · No fabricated statistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2234] border border-[#1E293B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] text-[#94A3B8]">Live session</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-[#0B0F17] border-r border-[#1E293B] pt-32 pb-6
            lg:sticky lg:top-[128px] lg:h-[calc(100vh-128px)] lg:pt-6
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-[-1] bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <nav className="px-4 overflow-y-auto h-full" aria-label="Intelligence platform sections">
            <div className="mb-4">
              <p className="text-[10px] text-[#475569] uppercase tracking-widest font-medium px-2 mb-2">
                Navigation
              </p>
            </div>

            <ul className="space-y-0.5" role="list">
              {NAV_SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => handleNavClick(section.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all
                      ${activeSection === section.id
                        ? "bg-[#10B981]/10 text-[#10B981] font-medium"
                        : "text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1A2234]"
                      }
                    `}
                    aria-current={activeSection === section.id ? "page" : undefined}
                  >
                    <span className="text-[12px] shrink-0" aria-hidden="true">{section.icon}</span>
                    <span className="truncate">{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Layer Count */}
            <div className="mt-6 px-3 py-3 rounded-lg bg-[#1A2234] border border-[#1E293B]">
              <p className="text-[10px] text-[#64748B] mb-2">Layer Status</p>
              <div className="flex gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#10B981]">
                    {layerStatuses.filter((l) => l.isActive).length}
                  </p>
                  <p className="text-[10px] text-[#64748B]">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#475569]">
                    {layerStatuses.filter((l) => !l.isActive).length}
                  </p>
                  <p className="text-[10px] text-[#64748B]">Need Config</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#94A3B8]">13</p>
                  <p className="text-[10px] text-[#64748B]">Total</p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-6 py-8 space-y-12 overflow-y-auto">
          {/* Section: Overview */}
          <div id="section-overview">
            <TierArchitectureBanner />
            <DashboardOverview
              visitor={visitor}
              session={session}
              engagement={engagement}
            />
          </div>

          {/* Section: Foundational Intelligence */}
          <section id="section-foundational" aria-label="Foundational Intelligence">
            <SectionHeader
              tier="foundational"
              number="01"
              label="Foundational Intelligence"
              description="Session lifecycle, traffic attribution, geolocation, time-zone patterns, and network context."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SessionIntelligencePanel
                session={session}
                status={layerById("session")}
              />
              <TrafficIntelligencePanel
                session={session}
                status={layerById("traffic")}
              />
              <GeoIntelligencePanel status={layerById("geo")} />
              <TimezoneIntelligencePanel
                session={session}
                status={layerById("timezone")}
              />
              <IPIntelligencePanel status={layerById("ip")} />
            </div>
          </section>

          {/* Section: Behavioral Intelligence */}
          <section id="section-behavioral" aria-label="Behavioral Intelligence">
            <SectionHeader
              tier="behavioral"
              number="02"
              label="Behavioral Intelligence"
              description="User behavior patterns, repeat visit signals, interest areas, conversion funnel, and engagement scoring."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BehaviorIntelligencePanel
                visitor={visitor}
                status={layerById("behavior")}
              />
              <RepeatVisitorPanel
                visitor={visitor}
                status={layerById("repeat_visitor")}
              />
              <InterestIntelligencePanel
                visitor={visitor}
                status={layerById("interest")}
              />
              <ConversionIntelligencePanel
                visitor={visitor}
                status={layerById("conversion")}
              />
              <EngagementIntelligencePanel
                visitor={visitor}
                status={layerById("engagement")}
                engagementScore={engagement}
              />
            </div>
          </section>

          {/* Section: Strategic Intelligence */}
          <section id="section-strategic" aria-label="Strategic Intelligence">
            <SectionHeader
              tier="strategic"
              number="03"
              label="Strategic Intelligence"
              description="Rules-based propensity baseline, retention indicators, and human-supervised experiment framework."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PredictiveIntelligencePanel
                propensity={propensity}
                status={layerById("predictive")}
              />
              <RetentionIntelligencePanel status={layerById("retention")} />
              <CognitiveIntelligencePanel status={layerById("cognitive")} />
            </div>
          </section>

          {/* Section: Analytical Models */}
          <section id="section-models" aria-label="Analytical Models">
            <SectionHeader
              tier="foundational"
              number="04"
              label="Analytical Models"
              description="Seven reusable analytical models with transparent methodology and appropriate data quality labels."
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AnalyticsMaturityModel assessment={maturity} />
              <IntelligenceMaturityRadar assessment={maturity} />
              <ConversionFunnelChart funnel={funnel} />
              <AttributionModelChart attribution={attribution} />
              <PropensityScoringBands score={propensity} />
              <RFMSegmentationMatrix />
              <CohortRetentionHeatmap />
            </div>
          </section>

          {/* Section: Events & Conversions */}
          <section id="section-events" aria-label="Events and Conversions">
            <SectionHeader
              tier="behavioral"
              number="05"
              label="Events & Conversions"
              description="Event schema documentation and current session event summary."
            />
            <EventSchemaPanel />
          </section>

          {/* Section: Data Sources */}
          <section id="section-datasources" aria-label="Data Sources">
            <SectionHeader
              tier="strategic"
              number="06"
              label="Data Sources"
              description="Integration health, provider configuration, and data freshness."
            />
            <IntegrationHealthPanel integrations={integrations} />
          </section>

          {/* Section: Privacy */}
          <section id="section-privacy" aria-label="Privacy and Governance">
            <SectionHeader
              tier="strategic"
              number="07"
              label="Privacy & Governance"
              description="Built-in privacy principles, data retention policies, and governance framework."
            />
            <PrivacyGovernancePanel />
          </section>
        </main>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  tier,
  number,
  label,
  description,
}: {
  tier: string;
  number: string;
  label: string;
  description: string;
}) {
  const tierColors: Record<string, string> = {
    foundational: "#06B6D4",
    behavioral: "#8B5CF6",
    strategic: "#F59E0B",
  };
  const color = tierColors[tier] ?? "#94A3B8";

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1.5">
        <span
          className="text-[11px] font-bold font-mono"
          style={{ color }}
          aria-hidden="true"
        >
          {number}
        </span>
        <div className="flex-1 h-px" style={{ background: `${color}33` }} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-[#F8FAFC]">{label}</h2>
      <p className="mt-1 text-sm text-[#64748B]">{description}</p>
    </div>
  );
}

// ─── Event Schema Panel ───────────────────────────────────────────────────────

function EventSchemaPanel() {
  const schemaFields = [
    { field: "eventId", type: "string", description: "UUID or time-based unique identifier", required: true, example: "gn_evt_1abc_def456" },
    { field: "eventName", type: "string", description: "Semantic event name", required: true, example: "page_view, form_submit" },
    { field: "timestamp", type: "ISO-8601", description: "UTC timestamp of the event", required: true, example: "2026-10-12T10:00:00.000Z" },
    { field: "schemaVersion", type: "string", description: "Schema version for forward-compatibility", required: true, example: "1.0.0" },
    { field: "sessionId", type: "string?", description: "Anonymous browser-scoped session ID", required: false, example: "gn_s_abc123_1abc" },
    { field: "visitorId", type: "string?", description: "Anonymous browser-level visitor ID", required: false, example: "gn_v_abc123-..." },
    { field: "pagePath", type: "string", description: "URL path at time of event", required: true, example: "/infrastructure/ai-ready" },
    { field: "trafficSource", type: "string?", description: "Classified traffic source", required: false, example: "direct, organic, referral" },
    { field: "utmSource", type: "string?", description: "UTM source parameter", required: false, example: "google" },
    { field: "timezone", type: "string?", description: "IANA timezone from browser", required: false, example: "Asia/Kolkata" },
    { field: "sessionKind", type: "enum?", description: "new_session or returning_session", required: false, example: "returning_session" },
    { field: "sourceTab", type: "string?", description: "Analytics category tab", required: false, example: "CTA Interactions" },
    { field: "eventValue", type: "string?", description: "Event-specific value (sanitized)", required: false, example: "/about, form_type" },
    { field: "consentStatus", type: "enum?", description: "Consent state for this event", required: false, example: "granted, pending" },
  ];

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden">
      <div className="p-5 border-b border-[#1E293B]">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Analytics Event Schema v1.0.0</h3>
        <p className="mt-1 text-xs text-[#64748B]">
          Common versioned event schema shared across all 13 intelligence layers.
          Events are validated on the server before enrichment and forwarding.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" role="table" aria-label="Event schema fields">
          <thead>
            <tr className="border-b border-[#1E293B]">
              <th className="text-left px-4 py-3 text-[#64748B] font-medium">Field</th>
              <th className="text-left px-4 py-3 text-[#64748B] font-medium">Type</th>
              <th className="text-left px-4 py-3 text-[#64748B] font-medium">Required</th>
              <th className="text-left px-4 py-3 text-[#64748B] font-medium">Description</th>
              <th className="text-left px-4 py-3 text-[#64748B] font-medium">Example</th>
            </tr>
          </thead>
          <tbody>
            {schemaFields.map((field, i) => (
              <tr
                key={field.field}
                className={`border-b border-[#1E293B] last:border-0 ${i % 2 === 0 ? "bg-[#0B0F17]" : "bg-[#060A10]"}`}
              >
                <td className="px-4 py-2.5">
                  <code className="text-[#10B981] text-[11px]">{field.field}</code>
                </td>
                <td className="px-4 py-2.5">
                  <code className="text-[#06B6D4] text-[11px]">{field.type}</code>
                </td>
                <td className="px-4 py-2.5">
                  <span className={field.required ? "text-[#F43F5E]" : "text-[#475569]"}>
                    {field.required ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#94A3B8]">{field.description}</td>
                <td className="px-4 py-2.5">
                  <code className="text-[#64748B] text-[10px]">{field.example}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-[#1E293B] bg-[#0B0F17]">
        <p className="text-[11px] text-[#475569]">
          Events are collected browser-side, validated and enriched server-side via <code className="text-[#10B981]">/api/analytics</code>,
          then forwarded to Google Sheets via the Apps Script endpoint. Geo and network fields are added
          server-side only from trusted proxy headers. No sensitive personal data is included in events.
        </p>
      </div>
    </div>
  );
}
