import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroSlider } from "../components/home/HeroSlider";
import { SevenLayerStack } from "../components/home/SevenLayerStack";
import { EnergyFlowModel } from "../components/home/EnergyFlowModel";
import { AutomationWorkflow } from "../components/home/AutomationWorkflow";
import { RegionalExplorer } from "../components/home/RegionalExplorer";
import { DashboardPreview } from "../components/home/DashboardPreview";
import { LongFormCta, ShortFormCta } from "../components/common/CtaBlock";
import { SOLUTIONS_DATA } from "../data/solutions";
import {
  Cpu,
  Zap,
  Bot,
  Network,
  ArrowRight,
  CheckCircle2,
  Building2,
  CircuitBoard,
  Gauge,
  Leaf,
  Layers,
  Sparkles,
  ShieldCheck,
  Server,
  Activity,
  CloudCog,
} from "lucide-react";
import aiComputeImg from "../assets/ai-compute-cluster.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreenNext | AI-Driven Digital Infrastructure for South India" },
      {
        name: "description",
        content:
          "Intelligent infrastructure for a sustainable digital future. Connecting AI-driven data center infrastructure, energy efficiency, and intelligent automation across Madurai, Coimbatore, Trichy, and Mangalore.",
      },
      {
        property: "og:title",
        content: "GreenNext | Intelligent Infrastructure for a Sustainable Digital Future",
      },
      {
        property: "og:description",
        content:
          "AI-driven data center infrastructure, energy efficiency, and intelligent automation across South India.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const capabilityCards = [
    {
      num: "01",
      title: "AI-Ready Infrastructure",
      path: "/infrastructure/ai-ready",
      icon: Cpu,
      accent: "#06B6D4",
      desc: "Infrastructure designed to support demanding AI and high-performance compute workloads where compute density, power draws, and thermal dissipation behave differently from conventional enterprise applications.",
    },
    {
      num: "02",
      title: "Energy Efficiency",
      path: "/energy/monitoring",
      icon: Zap,
      accent: "#F59E0B",
      desc: "Continuous monitoring and active optimization of power delivery and cooling requirements, treating energy performance as an engineering discipline rather than overhead.",
    },
    {
      num: "03",
      title: "Smart Automation",
      path: "/automation/monitoring",
      icon: Bot,
      accent: "#38BDF8",
      desc: "Event-driven automation of operational workflows — including monitoring, alert management, anomaly detection, and capacity planning — supporting consistent infrastructure responses.",
    },
    {
      num: "04",
      title: "Regional Connectivity",
      path: "/regions/overview",
      icon: Network,
      accent: "#10B981",
      desc: "A distributed regional approach designed around the infrastructure and connectivity requirements of Madurai, Coimbatore, Trichy, and Mangalore across South India.",
    },
  ];

  const aiPipeline = [
    { label: "AI Workloads", desc: "Training & Inference", icon: Sparkles },
    { label: "Compute Infrastructure", desc: "High-Density Clusters", icon: Cpu },
    { label: "Data Center Operations", desc: "Physical Facility", icon: Server },
    { label: "Energy & Cooling", desc: "Thermal Feedback", icon: Zap },
    { label: "Intelligent Monitoring", desc: "Telemetry Stream", icon: Activity },
    { label: "Automated Optimization", desc: "Closed-Loop Tuning", icon: CloudCog },
  ];

  const sustainabilityPillars = [
    {
      num: "01",
      title: "Energy-Aware Infrastructure",
      desc: "Infrastructure designed with energy visibility built in from the outset rather than added retrospectively.",
      path: "/sustainability/energy-aware",
    },
    {
      num: "02",
      title: "Efficient Cooling",
      desc: "Cooling systems calibrated to actual measured thermal load rather than theoretical worst-case buffers.",
      path: "/sustainability/efficient-cooling",
    },
    {
      num: "03",
      title: "Resource Optimization",
      desc: "Eliminating idle compute, overprovisioned chillers, and underutilised network interfaces.",
      path: "/sustainability/resource-optimization",
    },
    {
      num: "04",
      title: "Intelligent Workload Management",
      desc: "Scheduling and pacing compute tasks against available electrical and thermal headroom.",
      path: "/solutions/ai-workload-management",
    },
    {
      num: "05",
      title: "Infrastructure Visibility",
      desc: "Consolidated operational insight across physical and logical systems as the prerequisite for waste reduction.",
      path: "/energy/monitoring",
    },
    {
      num: "06",
      title: "Sustainable Digital Growth",
      desc: "Scaling regional digital capacity without proportional degradation in energy and resource use.",
      path: "/sustainability/sustainable-growth",
    },
  ];

  const approachStages = [
    {
      step: "01",
      name: "Understand",
      icon: Building2,
      desc: "Develop a detailed understanding of the infrastructure, workload, energy, and regional operational environment. Assess compute density and thermal profiles.",
    },
    {
      step: "02",
      name: "Intelligence",
      icon: CircuitBoard,
      desc: "Apply telemetry, analytics, and AI-driven analysis to understand operational states across the full stack in real time.",
    },
    {
      step: "03",
      name: "Optimize",
      icon: Gauge,
      desc: "Use operational insights to continuously improve resource efficiency, cooling calibration, and operational reliability as workloads evolve.",
    },
  ];

  const solutionsList = Object.values(SOLUTIONS_DATA).slice(0, 6);

  return (
    <main className="bg-[#070A0E] text-white">
      {/* 01. HERO SLIDER */}
      <HeroSlider />

      {/* 02. POSITIONING BANNER */}
      <section className="border-b border-[#1E293B] bg-[#0B0F17] py-16 lg:py-20">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                Why GreenNext
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                Where Digital Infrastructure Meets Intelligence
              </h2>
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                Modern AI workloads demand more than raw compute. They require reliable systems,
                efficient energy management, scalable architecture, and intelligent operational
                control. GreenNext brings these requirements into a single, coherent infrastructure
                model.
              </p>
            </div>

            <div className="lg:col-span-5 p-6 rounded-xl border border-[#334155] bg-[#121824] shadow-xl">
              <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block mb-2">
                Core Initiative Mandate
              </span>
              <p className="text-xs sm:text-sm text-white font-medium leading-relaxed mb-4">
                "GreenNext helps shape smarter, more efficient, and intelligently managed digital
                infrastructure for the AI era across South India."
              </p>
              <Link
                to="/about/what-we-are"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-[#34D399] transition-colors"
              >
                <span>Read About GreenNext</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03. CORE CAPABILITY CARDS */}
      <section className="py-20 border-b border-[#1E293B] bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
              Primary Focus Areas
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Foundational Infrastructure Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 flex flex-col justify-between hover:border-[#334155] hover:bg-[#121824] transition-all group shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${card.accent}15`,
                          borderColor: `${card.accent}30`,
                          color: card.accent,
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <span className="font-mono text-xs text-[#64748B] font-bold">{card.num}</span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#10B981] transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">{card.desc}</p>
                  </div>

                  <Link
                    to={card.path}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] group-hover:text-[#34D399] transition-colors pt-4 border-t border-[#1E293B]"
                  >
                    <span>Explore Capability</span>
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04. AI-DRIVEN INFRASTRUCTURE PIPELINE */}
      <section className="py-20 border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            <div className="lg:col-span-7">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                End-to-End Systems Integration
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                The AI Infrastructure Operational Pipeline
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                AI workloads create demanding requirements across compute, power, cooling, and
                telemetry. GreenNext connects each tier into an integrated operational system.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#121824] shadow-xl group">
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#070A0E]">
                  <img
                    src={aiComputeImg}
                    alt="High-density enterprise server racks with organized structured cabling in modern data center"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="px-3.5 py-2 bg-[#0B0F17] border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                  <span>HIGH-DENSITY COMPUTE (ILLUSTRATIVE)</span>
                  <span className="text-[#06B6D4]">AI-READY CLUSTER</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Stage Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {aiPipeline.map((pipe, idx) => {
              const Icon = pipe.icon;
              return (
                <div
                  key={pipe.label}
                  className="rounded-xl border border-[#1E293B] bg-[#121824] p-4 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[#10B981] font-semibold">
                      0{idx + 1}
                    </span>
                    <Icon size={16} className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">{pipe.label}</h4>
                    <span className="text-[10px] font-mono text-[#94A3B8] block">{pipe.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-[#CBD5E1]">
              <CheckCircle2 size={15} className="text-[#10B981]" />
              <span>System-aware design across physical facilities and digital scheduling</span>
            </div>
            <Link
              to="/infrastructure/ai-ready"
              className="text-xs font-semibold text-[#10B981] hover:text-[#34D399] flex items-center gap-1"
            >
              <span>Explore AI-Ready Infrastructure</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 05. ENERGY EFFICIENCY DISCIPLINE */}
      <section className="py-20 border-b border-[#1E293B] bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <EnergyFlowModel />
        </div>
      </section>

      {/* 06. INTELLIGENT AUTOMATION */}
      <section className="py-20 border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <AutomationWorkflow />
        </div>
      </section>

      {/* 07. REGIONAL DIGITAL INFRASTRUCTURE */}
      <section className="py-20 border-b border-[#1E293B] bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <RegionalExplorer />
        </div>
      </section>

      {/* 08. 7-LAYER INFRASTRUCTURE ARCHITECTURE */}
      <section className="py-20 border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
              Infrastructure Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              One Connected Operational Stack
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Signals move in both directions: workload demand informs infrastructure sizing and
              configuration, while operational telemetry informs workload placement, pacing, and
              automation.
            </p>
          </div>

          <SevenLayerStack />
        </div>
      </section>

      {/* 09. DASHBOARD PREVIEW */}
      <section className="py-20 border-b border-[#1E293B] bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
              Operational Visibility Console
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Regional Infrastructure Dashboard
            </h2>
            <p className="text-sm text-[#94A3B8]">
              A conceptual demonstration of the cross-region telemetry signals GreenNext aims to
              connect.
            </p>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* 10. OPERATIONAL USE CASES */}
      <section className="py-20 border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                Operational Scenarios
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Enterprise Infrastructure Use Cases
              </h2>
            </div>
            <Link
              to="/solutions"
              className="text-xs font-semibold text-[#10B981] hover:text-[#34D399] flex items-center gap-1"
            >
              <span>View All 7 Use Cases</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutionsList.map((sol) => (
              <div
                key={sol.id}
                className="rounded-2xl border border-[#1E293B] bg-[#121824] p-6 flex flex-col justify-between hover:border-[#334155] transition-all group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[#10B981] font-semibold">
                      {sol.code}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#070A0E] text-[#94A3B8]">
                      Operational
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#10B981] transition-colors">
                    {sol.title}
                  </h3>

                  <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3 mb-6">
                    {sol.problem}
                  </p>
                </div>

                <Link
                  to={`/solutions/${sol.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] group-hover:text-[#34D399] transition-colors pt-4 border-t border-[#1E293B]"
                >
                  <span>Explore Solution</span>
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. SUSTAINABILITY PRINCIPLES */}
      <section className="py-20 border-b border-[#1E293B] bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
              Environmental Rigor
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Digital Growth Without Ignoring Resource Efficiency
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              "The goal is not to slow digital growth, but to ensure that growth is delivered as
              efficiently as the technology allows."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sustainabilityPillars.map((p) => (
              <div
                key={p.title}
                className="p-6 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-xs text-[#10B981] font-semibold block mb-2">
                    {p.num} //
                  </span>
                  <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{p.desc}</p>
                </div>
                <Link
                  to={p.path}
                  className="text-xs text-[#10B981] hover:text-[#34D399] inline-flex items-center gap-1 font-medium"
                >
                  <span>Read Principle</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#121824] text-xs text-[#64748B] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#10B981] flex-shrink-0" />
            <span>
              <strong>Factual Discipline:</strong> GreenNext does not publish speculative carbon
              offset figures or unverified environmental claims. Sustainability is measured through
              physical power monitoring and cooling calibration.
            </span>
          </div>
        </div>
      </section>

      {/* 12. THE GREENNEXT APPROACH */}
      <section className="py-20 border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
              Engineering Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              From Understanding to Continuous Optimization
            </h2>
            <p className="text-sm text-[#94A3B8]">
              A three-stage operational cycle that keeps infrastructure aligned with evolving AI
              workloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {approachStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.name}
                  className="p-8 rounded-2xl border border-[#1E293B] bg-[#121824] flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-xs text-[#10B981] font-bold block mb-3">
                      STAGE // {stage.step}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-[#0B0F17] border border-[#1E293B] flex items-center justify-center text-[#10B981] mb-4">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{stage.name}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              to="/about/our-approach"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#334155] bg-[#121824] hover:bg-[#1A2234] text-white text-xs font-semibold transition-colors"
            >
              <span>Read Complete GreenNext Methodology</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 13. TYPE 1 LONG-FORM CONVERSION CTA */}
      <section className="py-20 bg-[#070A0E]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          <LongFormCta />
        </div>
      </section>
    </main>
  );
}
