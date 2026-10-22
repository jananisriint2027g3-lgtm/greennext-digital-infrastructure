import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, ArrowRight, Layers, Cpu, Zap, Users, Leaf } from "../icons";
import { trackEvent } from "../../lib/analytics";

type FitTier = "strong" | "discovery" | "lower";

interface OptionChoice {
  label: string;
  tierScore: FitTier;
  note: string;
}

interface Question {
  id: string;
  title: string;
  description: string;
  options: OptionChoice[];
}

const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: "density",
    title: "Workload & Rack Density Profile",
    description:
      "What power density characteristics describe your immediate or planned compute environment?",
    options: [
      {
        label:
          "High-Density AI / Accelerator Clusters (30 kW to 100+ kW/rack, liquid/hybrid cooling transition)",
        tierScore: "strong",
        note: "Directly matches GreenNext high-density thermal and power delivery frameworks.",
      },
      {
        label: "Mixed Enterprise Densities (10 kW to 25 kW/rack, hybrid containment retrofits)",
        tierScore: "discovery",
        note: "Requires discovery regarding existing chiller headroom and airflow containment feasibility.",
      },
      {
        label: "Standard Low-Density Commodity Hosting (<5 kW/rack, perimeter air-cooled)",
        tierScore: "lower",
        note: "Standard perimeter air cooling typically functions adequately without high-density engineering intervention.",
      },
      {
        label: "Cloud-Native SaaS with Zero Physical Data Center Footprint",
        tierScore: "lower",
        note: "GreenNext focuses on physical facility engineering, electrical busways, and thermal loops.",
      },
    ],
  },
  {
    id: "power",
    title: "Substation & Electrical Capacity Headroom",
    description:
      "What electrical power constraints affect your facility operations or expansion plans?",
    options: [
      {
        label:
          "Active Substation Constraints / Transformer Capacity Limits (<12 month deployment timeline)",
        tierScore: "strong",
        note: "High urgency for workload-aware power scheduling, peak shaving, and busway optimization.",
      },
      {
        label:
          "Evaluating Medium-Term Substation Sizing or Secondary Feeder Redundancy (12-24 months)",
        tierScore: "discovery",
        note: "Optimal window for architectural planning and reliability modeling before equipment procurement.",
      },
      {
        label: "Abundant Available Power / No Near-Term Transformer Headroom Constraints",
        tierScore: "discovery",
        note: "Focus shifts from power scarcity to efficiency optimization, PUE reduction, and operational resilience.",
      },
      {
        label: "Tenant with Fixed Sub-Metered Utility Allotment / No Infrastructure Control",
        tierScore: "lower",
        note: "Without facility-level operational authority, direct infrastructure changes cannot be implemented.",
      },
    ],
  },
  {
    id: "telemetry",
    title: "Operational Telemetry & Sensor Availability",
    description: "What level of sensory instrumentation is accessible in your environment?",
    options: [
      {
        label:
          "Granular Branch-Circuit, Tap-Off Box, and Environmental Telemetry Active or Planned",
        tierScore: "strong",
        note: "Enables immediate application of ISO/IEC 30134 Category 2/3 PUE models and anomaly detection.",
      },
      {
        label: "Facility-Level Substation / Main Switchgear Metering Only",
        tierScore: "discovery",
        note: "Requires deployment of sub-metering or estimation boundaries before high-resolution optimization.",
      },
      {
        label: "Infrequent Manual Utility Bill Ingestion / No Live Sensor Logs",
        tierScore: "lower",
        note: "GreenNext methodologies rely on telemetry data; sensor deployment must precede advisory modeling.",
      },
    ],
  },
  {
    id: "alignment",
    title: "Cross-Functional Stakeholder Sponsorship",
    description: "Which leadership teams are actively championing the infrastructure initiative?",
    options: [
      {
        label:
          "Cross-Functional Alignment (Facilities/Operations + IT/AI Infrastructure + Executive Leadership)",
        tierScore: "strong",
        note: "Highest success probability: bridging the historic divide between facility power and IT compute.",
      },
      {
        label:
          "Single Department Champion (Facilities evaluating independently from IT, or vice versa)",
        tierScore: "discovery",
        note: "Requires alignment sessions to unify mechanical facility constraints with IT workload roadmaps.",
      },
      {
        label: "Individual Technical Research / Academic Exploration",
        tierScore: "lower",
        note: "Best served by self-directed review of GreenNext published blueprints and calculators.",
      },
    ],
  },
];

const STAKEHOLDER_PROFILES = [
  {
    id: "facilities",
    role: "Facilities & Data Center Operations",
    title: "VP of Data Center Operations / Chief Facilities Engineer",
    icon: Zap,
    priorities: [
      "100% mission-critical uptime SLA compliance and 2N redundancy verification.",
      "Preventing mechanical chiller failures and managing peak summer wet-bulb temperatures.",
      "Eliminating hot-aisle recirculations and hot spots caused by high-density tenant racks.",
      "Strict Standard Operating Procedure (SOP) and Method of Procedure (MOP) safety governance.",
    ],
    challenges:
      "Balancing escalating tenant power densities against fixed substation capacities and aging electrical switchgear.",
    greenNextValue:
      "Provides physical facility blueprints, 5-level commissioning testing frameworks, and continuous PUE sub-metering architectures.",
  },
  {
    id: "ai-compute",
    role: "AI & Compute Infrastructure",
    title: "Head of AI Infrastructure / Principal HPC Architect",
    icon: Cpu,
    priorities: [
      "Maximizing sustained GPU/accelerator throughput without thermal throttling.",
      "Ultra-low latency inter-node fabrics (RoCEv2, InfiniBand) with non-blocking topology.",
      "Managing severe transient di/dt electrical swings during synchronized training checkpoints.",
      "Accelerating cluster deployment timelines from contract to initial model training.",
    ],
    challenges:
      "Facility power and cooling bottlenecks delaying accelerator cluster turn-up and limiting per-rack compute density.",
    greenNextValue:
      "Delivers high-density containment blueprints, secondary liquid loop CDU sizing, and workload-aware resource coordination.",
  },
  {
    id: "sustainability",
    role: "Sustainability & Energy Officers",
    title: "Chief Sustainability Officer / Data Center Energy Manager",
    icon: Leaf,
    priorities: [
      "Auditable ISO/IEC 30134 PUE and WUE reporting for institutional investors and regulators.",
      "Scope 1 (diesel generator) and Scope 2 (grid electricity) carbon accounting integrity.",
      "Negotiating regional open-access renewable power purchase agreements (solar/wind PPAs).",
      "Evaluating battery energy storage systems (BESS) for clean peak shaving.",
    ],
    challenges:
      "Navigating greenwashing risks, inconsistent measurement boundaries, and conflicting marketing claims.",
    greenNextValue:
      "Enforces rigorous measurement boundaries, transparent calculation formulas, and clear distinctions between measured logs and scenario models.",
  },
  {
    id: "finance",
    role: "Procurement & Executive Leadership",
    title: "CFO / VP of Infrastructure Procurement",
    icon: Users,
    priorities: [
      "Predictable Total Cost of Ownership (TCO) across 5-to-10 year lifecycle horizons.",
      "Optimizing Capex vs. Opex: retrofit existing brownfield sites vs. leasing new wholesale colocation.",
      "Avoiding utility peak demand penalties and power factor surcharges.",
      "Ensuring capital asset longevity and vendor-neutral architectural decisions.",
    ],
    challenges:
      "Large capital commitments for AI facilities in rapidly evolving accelerator technology cycles.",
    greenNextValue:
      "Provides transparent thermodynamic calculators, financial amortization modeling, and vendor-neutral architectural specifications.",
  },
];

export function CustomerFitFramework() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({
    density: 0,
    power: 0,
    telemetry: 0,
    alignment: 0,
  });

  const [activeStakeholder, setActiveStakeholder] = useState(0);

  // Compute qualitative tier based on selections
  const computeFitTier = (): {
    tier: FitTier;
    title: string;
    summary: string;
    recommendation: string;
  } => {
    const scores = Object.entries(selectedAnswers).map(([qId, optIdx]) => {
      const q = ASSESSMENT_QUESTIONS.find((item) => item.id === qId);
      return q?.options[optIdx]?.tierScore || "discovery";
    });

    const strongCount = scores.filter((s) => s === "strong").length;
    const lowerCount = scores.filter((s) => s === "lower").length;

    if (lowerCount >= 2) {
      return {
        tier: "lower",
        title: "Lower Current Engagement Fit",
        summary:
          "Your current profile reflects standard low-density hosting, cloud-native SaaS workloads, or environments without live telemetry access. Incremental architectural intervention may provide limited immediate ROI.",
        recommendation:
          "Explore our self-guided resources: utilize the Energy Impact Calculator and review published regional architecture frameworks. Re-evaluate engagement when high-density accelerator projects or facility retrofits are planned.",
      };
    }

    if (strongCount >= 2) {
      return {
        tier: "strong",
        title: "Strong Potential Engagement Fit",
        summary:
          "Your organization exhibits key structural drivers: high-density compute requirements, substation/cooling constraints, accessible telemetry, and cross-functional leadership alignment.",
        recommendation:
          "We recommend an initial technical discovery session with GreenNext infrastructure architects to review power distribution single-line diagrams, thermal containment layouts, and telemetry integration boundaries.",
      };
    }

    return {
      tier: "discovery",
      title: "Potential Fit Requiring Technical Discovery",
      summary:
        "Your environment features relevant infrastructure elements, but certain factors (such as sensor deployment, timeline urgency, or cross-departmental coordination) require exploratory discovery.",
      recommendation:
        "Initiate a preliminary exploratory dialogue with GreenNext to scope telemetry prerequisites, define baseline metrics, and align facility operations with planned compute roadmaps.",
    };
  };

  const fitResult = computeFitTier();

  return (
    <section className="space-y-16">
      {/* Tier Overview Matrix */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            <Layers size={14} />
            <span>Qualification Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Customer Fit Evaluation Framework
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-3xl mt-2 leading-relaxed">
            GreenNext evaluates engagements through an objective, engineering-driven framework. We
            do not enforce arbitrary corporate revenue thresholds or company-size minimums; fit is
            determined by physical infrastructure characteristics, technical complexity, and
            operational readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="rounded-xl border border-[#10B981]/40 bg-[#121824] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-bl-full pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-medium mb-3">
                <CheckCircle2 size={13} />
                <span>Tier 1 • Strong Fit</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                High-Density & Active Projects
              </h3>
              <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
                Organizations actively facing physical facility boundaries where conventional
                methods have stalled.
              </p>
              <ul className="space-y-2 text-xs text-[#CBD5E1] border-t border-[#1E293B] pt-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Deploying or planning 30+ kW/rack compute (AI/GPU clusters).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Substation transformer or mechanical cooling constraints.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Granular branch-circuit or BMS telemetry available.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Active alignment between Facilities and IT engineering.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#10B981] uppercase tracking-wider block mb-1">
                Engagement Model
              </span>
              <p className="text-xs text-[#94A3B8]">
                Full architectural advisory, thermal modeling, and telemetry integration.
              </p>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="rounded-xl border border-[#F59E0B]/40 bg-[#121824] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-bl-full pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-mono font-medium mb-3">
                <ShieldCheck size={13} />
                <span>Tier 2 • Discovery Required</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Mixed Legacy & Scoping Phase
              </h3>
              <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
                Enterprises with relevant infrastructure needs that require scoping and data
                baseline establishment.
              </p>
              <ul className="space-y-2 text-xs text-[#CBD5E1] border-t border-[#1E293B] pt-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Brownfield server rooms with 10-25 kW hybrid rack requirements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Exploratory AI roadmap with deployment horizon &gt; 12 months.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Partial sensor instrumentation requiring telemetry upgrades.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Single-department champion seeking cross-functional buy-in.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#F59E0B] uppercase tracking-wider block mb-1">
                Engagement Model
              </span>
              <p className="text-xs text-[#94A3B8]">
                Technical discovery workshop, scoping questionnaire, and baseline assessment.
              </p>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="rounded-xl border border-[#334155] bg-[#121824] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[#94A3B8] text-xs font-mono font-medium mb-3">
                <span>Tier 3 • Lower Current Fit</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Standard Hosting & SaaS</h3>
              <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
                Environments where physics-based high-density engineering delivers limited immediate
                leverage.
              </p>
              <ul className="space-y-2 text-xs text-[#94A3B8] border-t border-[#1E293B] pt-4">
                <li className="flex items-start gap-2">
                  <span>✕</span>
                  <span>Standard low-density commodity hosting (&lt;5 kW/rack).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✕</span>
                  <span>Pure cloud SaaS workloads without physical server management.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✕</span>
                  <span>Unwillingness to share operational power/cooling telemetry.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✕</span>
                  <span>Seeking general commercial construction or equipment sales.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-1">
                Engagement Model
              </span>
              <p className="text-xs text-[#94A3B8]">
                Self-guided platform tools, educational documentation, and public calculators.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Self-Assessment Explorer */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            Interactive Alignment Tool
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Qualify Your Infrastructure Fit
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-2xl">
            Select the options matching your infrastructure profile to evaluate alignment with
            GreenNext engineering capabilities and determine the most appropriate next step.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Questions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {ASSESSMENT_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 rounded-xl border border-[#1E293B] bg-[#121824]"
              >
                <h3 className="text-sm font-semibold text-white mb-1">{q.title}</h3>
                <p className="text-xs text-[#94A3B8] mb-3">{q.description}</p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = selectedAnswers[q.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }));
                          trackEvent({
                            tab: "Industries",
                            event: "icp_assessment_option_selected",
                            value: `${q.id}:${idx}`,
                            page: "/icp",
                          });
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#10B981]/10 border-[#10B981] text-white"
                            : "bg-[#070A0E]/60 border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "border-[#10B981] bg-[#10B981]"
                              : "border-[#475569] bg-transparent"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#070A0E]" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium block leading-snug">{opt.label}</span>
                          {isSelected && (
                            <span className="text-[11px] text-[#10B981] mt-1 block">
                              Analysis: {opt.note}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Results Summary Box (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-xl border border-[#334155] bg-[#121824] p-6 shadow-xl">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] block mb-2">
                Alignment Assessment Result
              </span>

              <div
                className={`p-4 rounded-lg border mb-4 ${
                  fitResult.tier === "strong"
                    ? "bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]"
                    : fitResult.tier === "discovery"
                      ? "bg-[#F59E0B]/10 border-[#F59E0B]/50 text-[#F59E0B]"
                      : "bg-[#1E293B]/40 border-[#334155] text-[#94A3B8]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {fitResult.tier === "strong" ? (
                    <CheckCircle2 size={16} />
                  ) : fitResult.tier === "discovery" ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <Layers size={16} />
                  )}
                  <h4 className="text-sm font-bold text-white">{fitResult.title}</h4>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed mt-2">{fitResult.summary}</p>
              </div>

              <div className="space-y-3 mb-6">
                <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider block">
                  Recommended Action Path
                </span>
                <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#070A0E] p-3 rounded-lg border border-[#1E293B]">
                  {fitResult.recommendation}
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  to="/contact"
                  onClick={() =>
                    trackEvent({
                      tab: "CTA Interactions",
                      event: "icp_assessment_cta_click",
                      value: `tier:${fitResult.tier}`,
                      page: "/icp",
                    })
                  }
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#10B981] text-[#070A0E] text-xs font-semibold hover:bg-[#34D399] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
                >
                  <span>Connect with Engineering Planning</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  to="/solutions/energy-calculator"
                  className="w-full min-h-[44px] py-2 px-4 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1A2234] text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explore Energy Calculator</span>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1E293B] text-[11px] text-[#64748B] leading-relaxed">
                <strong>Methodological Transparency:</strong> This interactive explorer provides
                qualitative diagnostic guidance based on engineering parameters. It does not
                generate commercial sales ratings or restrictive thresholds.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stakeholder Alignment Explorer */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold">
            Enterprise Decision Alignment
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Stakeholder Priorities & Engagement Value
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 max-w-2xl">
            Modern digital infrastructure decisions require consensus across historically disparate
            teams. Review how GreenNext blueprints address the distinct priorities of each technical
            discipline.
          </p>
        </div>

        {/* Stakeholder Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {STAKEHOLDER_PROFILES.map((stk, idx) => {
            const isActive = activeStakeholder === idx;
            const Icon = stk.icon;
            return (
              <button
                key={stk.id}
                type="button"
                onClick={() => {
                  setActiveStakeholder(idx);
                  trackEvent({
                    tab: "Industries",
                    event: "icp_stakeholder_tab_click",
                    value: stk.id,
                    page: "/icp",
                  });
                }}
                className={`p-3 min-h-[44px] rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                  isActive
                    ? "bg-[#1A2234] border-[#10B981] text-white"
                    : "bg-[#121824] border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#10B981]" : "text-[#64748B]"} />
                <span className="text-xs font-medium truncate">{stk.role}</span>
              </button>
            );
          })}
        </div>

        {/* Active Stakeholder Card */}
        {(() => {
          const current = STAKEHOLDER_PROFILES[activeStakeholder] ?? STAKEHOLDER_PROFILES[0];
          if (!current) return null;
          const Icon = current.icon;
          return (
            <div className="rounded-xl border border-[#334155] bg-[#121824] p-6 sm:p-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1E293B] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">{current.title}</h3>
                    <span className="text-xs font-mono text-[#10B981] uppercase tracking-wider">
                      {current.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-3">
                    Primary Operational Priorities
                  </h4>
                  <ul className="space-y-2 text-xs text-[#CBD5E1]">
                    {current.priorities.map((item, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-[#10B981] font-bold">▪</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#070A0E] p-4 rounded-lg border border-[#1E293B]">
                    <span className="text-[11px] font-mono text-[#F59E0B] uppercase tracking-wider block mb-1">
                      Core Friction Point
                    </span>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{current.challenges}</p>
                  </div>

                  <div className="bg-[#070A0E] p-4 rounded-lg border border-[#10B981]/30">
                    <span className="text-[11px] font-mono text-[#10B981] uppercase tracking-wider block mb-1">
                      GreenNext Strategic Alignment
                    </span>
                    <p className="text-xs text-[#CBD5E1] leading-relaxed">
                      {current.greenNextValue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
