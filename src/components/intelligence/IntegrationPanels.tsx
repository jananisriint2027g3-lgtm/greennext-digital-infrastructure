/**
 * GreenNext Website Intelligence Platform — Integration Health & Privacy Panels
 */

import type { IntegrationHealth } from "../../lib/dashboard-data";

// ─── Integration Health Panel ─────────────────────────────────────────────────

const STATUS_CONFIG = {
  configured: { label: "Configured", color: "#10B981", dot: "bg-[#10B981]" },
  unconfigured: { label: "Not configured", color: "#F43F5E", dot: "bg-[#F43F5E]" },
  optional: { label: "Optional", color: "#F59E0B", dot: "bg-[#F59E0B]" },
  unavailable: { label: "Unavailable", color: "#475569", dot: "bg-[#475569]" },
};

const QUALITY_CONFIG = {
  live: "Live",
  delayed: "Delayed",
  inferred: "Inferred",
  simulated: "Simulated",
  unavailable: "Unavailable",
};

export function IntegrationHealthPanel({ integrations }: { integrations: IntegrationHealth[] }) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden">
      <div className="p-5 border-b border-[#1E293B]">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Data Sources & Integration Health</h3>
        <p className="mt-1 text-xs text-[#64748B]">
          Provider availability and data freshness. Secret values are never exposed here.
          A missing optional credential produces an "unavailable" state, not a fabricated success.
        </p>
      </div>

      <div className="divide-y divide-[#1E293B]">
        {integrations.map((integration) => {
          const statusCfg = STATUS_CONFIG[integration.status];
          const qualityLabel = QUALITY_CONFIG[integration.dataQuality];

          return (
            <div key={integration.name} className="p-4 flex items-start gap-3">
              {/* Status dot */}
              <div className="mt-1.5">
                <span
                  className={`block w-2 h-2 rounded-full ${statusCfg.dot}`}
                  title={statusCfg.label}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[#F8FAFC]">{integration.name}</h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{integration.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-[#1E293B]">·</span>
                    <span className="text-[10px] text-[#64748B]">{qualityLabel}</span>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-[#475569] leading-relaxed">
                  {integration.note}
                </p>
                {integration.docLink && (
                  <a
                    href={integration.docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#10B981] hover:underline"
                  >
                    View dashboard ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#1E293B] bg-[#0B0F17]">
        <p className="text-[11px] text-[#475569]">
          ⓘ Integration health is based on configuration presence, not live connectivity tests.
          Running health checks would require exposing credentials — this panel shows configuration
          status only. Server logs contain provider diagnostic details.
        </p>
      </div>
    </div>
  );
}

// ─── Privacy & Governance Panel ───────────────────────────────────────────────

const PRIVACY_PRINCIPLES = [
  {
    title: "Consent-first collection",
    description: "Non-essential behavioral tracking does not run before consent is obtained. The platform remains functional when visitors decline tracking.",
    status: "implemented",
  },
  {
    title: "No covert fingerprinting",
    description: "Visitor identification uses only explicit first-party identifiers (sessionStorage, localStorage). No canvas, font, or behavioral fingerprinting is used.",
    status: "implemented",
  },
  {
    title: "Personal data minimization",
    description: "Events carry anonymous session IDs. No names, emails, or passwords are included in analytics payloads. Chat topics are sanitized before transmission.",
    status: "implemented",
  },
  {
    title: "Server-side IP processing",
    description: "IP addresses are processed server-side only via trusted proxy headers. Raw IPs are not stored in analytics events or displayed in dashboards.",
    status: "implemented",
  },
  {
    title: "Payload validation & rate limiting",
    description: "The /api/analytics endpoint validates all incoming events, enforces a 64 KB payload limit, and rate-limits provider calls (60/min) to prevent abuse.",
    status: "implemented",
  },
  {
    title: "No sensitive field capture",
    description: "Form fields (passwords, payment data, confidential content) are never collected. Only behavioral events (open, start, submit, abandon) are tracked.",
    status: "implemented",
  },
  {
    title: "Credential protection",
    description: "API tokens, provider keys, and enrichment secrets are server-side only. VITE_ prefixed variables are audited to ensure no secrets are exposed to browsers.",
    status: "implemented",
  },
  {
    title: "Deletion & suppression",
    description: "Browser-local data can be cleared via localStorage/sessionStorage.clear(). Server-side Airtable and Google Sheets records can be deleted per request.",
    status: "partial",
  },
  {
    title: "Session recordings",
    description: "Microsoft Clarity provides session recording via its tag (yryfxrhkse). Clarity's own consent controls apply. No additional recording is implemented.",
    status: "delegated",
  },
];

const STATUS_COLORS = {
  implemented: "#10B981",
  partial: "#F59E0B",
  delegated: "#06B6D4",
  planned: "#475569",
};

const STATUS_LABELS = {
  implemented: "Implemented",
  partial: "Partial",
  delegated: "Delegated to provider",
  planned: "Planned",
};

export function PrivacyGovernancePanel() {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B0F17] overflow-hidden">
      <div className="p-5 border-b border-[#1E293B]">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Privacy & Governance</h3>
        <p className="mt-1 text-xs text-[#64748B]">
          Privacy is built into the architecture from the beginning. These principles are not
          aspirational — they reflect verified implementation decisions in this codebase.
        </p>
      </div>

      <div className="divide-y divide-[#1E293B]">
        {PRIVACY_PRINCIPLES.map((principle) => {
          const color = STATUS_COLORS[principle.status as keyof typeof STATUS_COLORS] ?? "#475569";
          const label = STATUS_LABELS[principle.status as keyof typeof STATUS_LABELS] ?? principle.status;

          return (
            <div key={principle.title} className="p-4 flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                style={{ background: `${color}22`, color }}
                aria-label={label}
              >
                {principle.status === "implemented" ? "✓" : principle.status === "partial" ? "~" : "↗"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-xs font-semibold text-[#F8FAFC]">{principle.title}</h4>
                  <span className="text-[10px]" style={{ color }}>{label}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">{principle.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 border-t border-[#1E293B]">
        <h4 className="text-xs font-semibold text-[#F8FAFC] mb-3">Data Retention Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { store: "Browser localStorage", data: "Anonymous visitor profile, session count, interests", retention: "Until user clears browser data" },
            { store: "Google Sheets", data: "Analytics events (no raw IPs, no PII)", retention: "Managed by sheet owner" },
            { store: "Airtable", data: "Behavior events (optional POC)", retention: "Managed by Airtable base owner" },
          ].map((item) => (
            <div key={item.store} className="p-3 rounded-lg bg-[#1A2234] border border-[#1E293B]">
              <p className="text-[11px] font-semibold text-[#F8FAFC] mb-1">{item.store}</p>
              <p className="text-[10px] text-[#64748B] mb-1.5">{item.data}</p>
              <p className="text-[10px] text-[#475569]">Retention: {item.retention}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
