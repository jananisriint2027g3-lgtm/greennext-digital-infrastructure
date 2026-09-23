import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "../components/common/PageHero";
import { LongFormInquiry } from "../components/common/LongFormInquiry";
import { WhatsAppDemoModal, openQuickInquiry } from "../components/common/FloatingContact";
import { WHATSAPP_CONFIG } from "../data/whatsapp";
import {
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Send,
  Cpu,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  ArrowRight,
  Clock,
  Search,
  Users,
} from "lucide-react";
import facilityImg from "../assets/datacenter-facility-exterior.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact GreenNext | Regional Digital Infrastructure Initiative" },
      {
        name: "description",
        content:
          "Connect with the GreenNext infrastructure planning team for regional digital infrastructure, energy efficiency, and AI workload requirements across South India.",
      },
    ],
  }),
  component: ContactPage,
});

export function ContactPage() {
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const handleWhatsAppAction = (e: React.MouseEvent) => {
    if (!WHATSAPP_CONFIG.isConfigured()) {
      e.preventDefault();
      setWhatsAppModalOpen(true);
    }
  };

  const helpAreas = [
    {
      icon: Cpu,
      title: "Infrastructure Planning",
      tag: "COMPUTE & ARCHITECTURE",
      desc: "High-density compute modeling (up to 40+ kW/rack), modular facility layouts, edge node topologies, and hardware lifecycle staging.",
      bullets: [
        "AI rack density modeling",
        "Modular floor layout planning",
        "Power headroom analysis",
      ],
    },
    {
      icon: Zap,
      title: "Energy & Cooling",
      tag: "THERMAL & POWER",
      desc: "PUE reduction pathways, hybrid liquid/air thermal engineering, ambient climate adaptation for South India, and power telemetry calibration.",
      bullets: ["PUE calibration targets", "Liquid-to-chip transition", "Renewable power pairing"],
    },
    {
      icon: Activity,
      title: "Automation & Monitoring",
      tag: "CLOSED-LOOP TELEMETRY",
      desc: "Full-stack telemetry architectures, real-time threshold monitoring, automated environmental pacing, and predictive incident detection.",
      bullets: ["7-layer telemetry design", "Automated alert pacing", "Thermal anomaly detection"],
    },
    {
      icon: Layers,
      title: "Regional Infrastructure",
      tag: "SOUTH INDIA CORRIDORS",
      desc: "Tier-2 city digital infrastructure integration across Madurai, Coimbatore, Trichy, and Mangalore with low-latency regional interconnects.",
      bullets: [
        "Secondary-city data hubs",
        "Regional fiber interconnects",
        "Decentralized resilience",
      ],
    },
  ];

  const processSteps = [
    {
      step: "01",
      icon: Send,
      title: "Share your requirements",
      desc: "Submit your compute workload density, facility constraints, cooling preferences, or regional planning questions via the interactive inquiry form.",
    },
    {
      step: "02",
      icon: Search,
      title: "Review the context",
      desc: "Our engineering and planning team reviews your submitted parameters against regional grid availability, ambient thermal profiles, and infrastructure models.",
    },
    {
      step: "03",
      icon: Users,
      title: "Continue the conversation",
      desc: "We coordinate a focused technical discussion with our infrastructure architects to review layout feasibility, efficiency metrics, and collaborative scenarios.",
    },
  ];

  return (
    <div className="w-full bg-[#070A0E] text-white">
      {/* WhatsApp Modal for Demo Interactivity */}
      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => openQuickInquiry()}
      />

      {/* 1. CONTACT HERO */}
      <PageHero
        breadcrumbs={[{ label: "Contact" }]}
        eyebrow="Start a Conversation"
        h1="Connect With the GreenNext Team"
        intro="If you are involved in infrastructure planning, data center operations, AI workload management, or regional digital development across South India, we want to understand your requirements."
      />

      <main className="w-full">
        {/* 2. INQUIRY + DIRECT CORRESPONDENCE (Balanced Two-Column Section) */}
        <section className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Infrastructure Requirements Inquiry Form (7 Cols) */}
            <div className="lg:col-span-7">
              <LongFormInquiry
                title="Infrastructure Requirements Inquiry"
                subtitle="Submit your technical infrastructure parameters below. This interactive form operates in demonstration mode."
              />
            </div>

            {/* Right: Direct Correspondence (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Direct Correspondence Box */}
              <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-7 shadow-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
                    <Send size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block">
                      OFFICIAL CHANNEL
                    </span>
                    <h3 className="text-base font-bold text-white">Direct Correspondence</h3>
                  </div>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-5">
                  For technical discussions, infrastructure planning, and strategic inquiries, use
                  the GreenNext inquiry interface.
                </p>
                <button
                  type="button"
                  onClick={() => openQuickInquiry()}
                  className="w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#34D399] text-[#070A0E] font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30 cursor-pointer"
                  id="direct-correspondence-quick-inquiry-btn"
                >
                  <Send size={15} />
                  <span>Open Quick Inquiry</span>
                </button>
                <p className="text-[11px] text-[#64748B] mt-3">
                  Opens our interactive inquiry modal in demonstration mode.
                </p>
              </div>

              {/* Direct WhatsApp CTA Box */}
              <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-6 sm:p-7 shadow-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block">
                      DIRECT MESSAGING
                    </span>
                    <h3 className="text-base font-bold text-white">WhatsApp Inquiry</h3>
                  </div>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed mb-5">
                  Direct WhatsApp routing channel for real-time technical coordination and
                  preliminary feasibility discussions.
                </p>

                {WHATSAPP_CONFIG.isConfigured() ? (
                  <a
                    href={WHATSAPP_CONFIG.getUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#070A0E] text-xs font-semibold transition-colors shadow-lg shadow-[#10B981]/20"
                    id="contact-whatsapp-link"
                  >
                    <MessageCircle size={15} />
                    <span>Open WhatsApp Discussion</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleWhatsAppAction}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] text-xs font-semibold transition-colors"
                    id="contact-whatsapp-demo-btn"
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp Inquiry</span>
                  </button>
                )}
              </div>

              {/* Regional Focus Nodes Box */}
              <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-7 shadow-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider block">
                      SOUTH INDIA CORRIDOR
                    </span>
                    <h4 className="text-base font-bold text-white">Regional Focus Nodes</h4>
                  </div>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                  GreenNext digital infrastructure initiatives focus across four strategic regional
                  nodes:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#CBD5E1]">
                  <Link
                    to="/regions/madurai"
                    className="p-2.5 rounded-lg bg-[#121824] border border-[#1E293B] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors flex items-center justify-between"
                  >
                    <span>Madurai</span>
                    <span className="text-[#10B981] text-[10px]">MDU</span>
                  </Link>
                  <Link
                    to="/regions/coimbatore"
                    className="p-2.5 rounded-lg bg-[#121824] border border-[#1E293B] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors flex items-center justify-between"
                  >
                    <span>Coimbatore</span>
                    <span className="text-[#10B981] text-[10px]">CJB</span>
                  </Link>
                  <Link
                    to="/regions/trichy"
                    className="p-2.5 rounded-lg bg-[#121824] border border-[#1E293B] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors flex items-center justify-between"
                  >
                    <span>Trichy</span>
                    <span className="text-[#10B981] text-[10px]">TRZ</span>
                  </Link>
                  <Link
                    to="/regions/mangalore"
                    className="p-2.5 rounded-lg bg-[#121824] border border-[#1E293B] hover:border-[#10B981]/50 hover:text-[#10B981] transition-colors flex items-center justify-between"
                  >
                    <span>Mangalore</span>
                    <span className="text-[#10B981] text-[10px]">IXE</span>
                  </Link>
                </div>
                <div className="pt-3 mt-3 border-t border-[#1E293B] text-[10px] text-[#64748B] flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#10B981] flex-shrink-0" />
                  <span>Regional planning focus & digital capacity distribution</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW CAN WE HELP? (4 Concise Areas) */}
        <section className="border-t border-b border-[#1E293B] bg-[#0B0F17]/60 py-16">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                Collaboration Scope
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                How Can We Help?
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                GreenNext collaborates with enterprise engineering teams, data center operators, and
                regional planners across four primary disciplines:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpAreas.map((area) => {
                const Icon = area.icon;
                return (
                  <div
                    key={area.title}
                    className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 flex flex-col justify-between hover:border-[#334155] hover:bg-[#121824] transition-all shadow-xl group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block mb-1">
                        {area.tag}
                      </span>
                      <h3 className="text-base font-bold text-white mb-2">{area.title}</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{area.desc}</p>
                    </div>
                    <div className="pt-3 border-t border-[#1E293B] space-y-1.5">
                      {area.bullets.map((b) => (
                        <div
                          key={b}
                          className="flex items-center gap-1.5 text-[11px] text-[#CBD5E1]"
                        >
                          <CheckCircle2 size={12} className="text-[#10B981] flex-shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. INFRASTRUCTURE IN CONTEXT (Balanced Editorial Section with Facility Image) */}
        <section className="py-20 bg-[#070A0E]">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Editorial Text Column (6 Cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                    Infrastructure In Context
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                    Engineered for AI Densities and Regional Climates
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                  Traditional enterprise facilities were designed for steady-state 5–10 kW rack
                  envelopes. Modern AI training and inference clusters demand fundamentally
                  different physical engineering—requiring 30–50 kW rack density headroom, resilient
                  thermal dissipation, and deterministic telemetry.
                </p>

                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  GreenNext conceives facility architecture as an integrated physical-digital
                  system. Specifically calibrated for South India’s ambient operating environments,
                  our models prioritize dynamic cooling adaptation, modular power distribution, and
                  decentralized regional deployment to eliminate single metropolitan choke points.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#0B0F17]">
                    <span className="text-[10px] font-mono text-[#10B981] uppercase tracking-wider block mb-0.5">
                      COMPUTE HEADROOM
                    </span>
                    <span className="text-sm font-bold text-white">Up to 50 kW / Rack</span>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      AI cluster ready architecture
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#1E293B] bg-[#0B0F17]">
                    <span className="text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider block mb-0.5">
                      REGIONAL FOOTPRINT
                    </span>
                    <span className="text-sm font-bold text-white">4 Focus Nodes</span>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Madurai · CJB · Trichy · Mangalore
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/infrastructure/architecture"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#10B981] hover:text-[#34D399] transition-colors group"
                  >
                    <span>Explore Complete Infrastructure Architecture</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>

              {/* Facility Image Composition (6 Cols) */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-[#1E293B] bg-[#0B0F17] shadow-2xl group">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#070A0E]">
                    <img
                      src={facilityImg}
                      alt="Modern enterprise digital infrastructure facility exterior with sustainable landscaping and operations campus"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-4 bg-[#121824] border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                    <span>FACILITY ARCHITECTURE (ILLUSTRATIVE)</span>
                    <span className="text-[#10B981]">OPERATIONS CAMPUS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHAT HAPPENS NEXT (Informational 3-Step Section) */}
        <section className="border-t border-[#1E293B] bg-[#0B0F17]/60 py-16">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-2">
                Consultative Engagement
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                What Happens Next
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Our engagement methodology is engineering-led, collaborative, and focused on
                specific operational specifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {processSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="p-6 sm:p-7 rounded-2xl border border-[#1E293B] bg-[#0B0F17] flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
                        <span className="font-mono text-xs font-bold text-[#10B981]">
                          STEP // {step.step}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#121824] border border-[#1E293B] text-[#10B981] flex items-center justify-center">
                          <StepIcon size={15} />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl border border-[#1E293B] bg-[#121824] text-xs text-[#64748B] flex items-center gap-2">
              <Clock size={15} className="text-[#10B981] flex-shrink-0" />
              <span>
                <strong>Informational Notice:</strong> GreenNext conducts consultative, direct
                technical reviews. No automated marketing pipelines or automated email responders
                are active.
              </span>
            </div>
          </div>
        </section>

        {/* 6. FINAL CONTACT CTA */}
        <section className="py-16 bg-[#070A0E]">
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl overflow-hidden border border-[#1E293B] bg-gradient-to-br from-[#121824] via-[#0B0F17] to-[#070A0E] p-8 sm:p-12 text-center relative shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-80" />

              <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-3">
                Rapid Technical Inquiry
              </span>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Have an infrastructure requirement in mind?
              </h2>

              <p className="text-sm text-[#94A3B8] max-w-xl mx-auto leading-relaxed mb-8">
                Whether you have a specific regional capacity query or want to explore high-density
                thermal management, our team is ready to review your parameters.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => openQuickInquiry()}
                  className="px-6 py-3 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#070A0E] font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:shadow-[#10B981]/35"
                  id="final-open-quick-inquiry-btn"
                >
                  <Send size={15} />
                  <span>Open Quick Inquiry</span>
                </button>

                <Link
                  to="/infrastructure/architecture"
                  className="px-5 py-3 rounded-lg border border-[#334155] bg-[#121824]/60 text-white hover:bg-[#1A2234] hover:border-[#475569] text-sm font-medium transition-all"
                >
                  Explore Infrastructure Architecture
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
