import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, MessageCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { NAVIGATION_STRUCTURE } from "../../data/navigation";
import { WHATSAPP_CONFIG } from "../../data/whatsapp";
import { WhatsAppDemoModal, openQuickInquiry } from "../common/FloatingContact";

export function SiteFooter() {
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  return (
    <>
      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => openQuickInquiry()}
      />
      <footer className="bg-[#070A0E] text-white border-t border-[#1E293B] pt-14 pb-12 mt-6 sm:mt-10">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section: Brand & High-level Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-[#1E293B]">
            {/* Brand Column (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Link
                to="/"
                className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight"
              >
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
                  <Leaf size={18} />
                </div>
                <span>
                  Green<span className="text-[#10B981]">Next</span>
                </span>
              </Link>

              <p className="text-xs font-mono tracking-wider text-[#10B981] uppercase mt-1">
                Smarter Infrastructure. Efficient Operations. Intelligent Automation.
              </p>

              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-sm">
                An AI-driven digital infrastructure initiative focused on infrastructure
                intelligence, energy efficiency, intelligent automation, and regional digital
                infrastructure across South India.
              </p>

              <div className="pt-2 flex flex-col gap-2.5 text-xs text-[#94A3B8]">
                {WHATSAPP_CONFIG.isConfigured() ? (
                  <a
                    href={WHATSAPP_CONFIG.getUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#94A3B8] hover:text-[#10B981] transition-colors"
                  >
                    <MessageCircle size={14} className="text-[#10B981]" />
                    <span>Chat on WhatsApp</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWhatsAppModalOpen(true)}
                    className="flex items-center gap-2 text-[#94A3B8] hover:text-[#10B981] transition-colors text-left"
                  >
                    <MessageCircle size={14} className="text-[#10B981]" />
                    <span>WhatsApp Inquiry</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sitemap Multi-Column (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {/* Column 1: About & Sustainability */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  About
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link to="/about/what-we-are" className="hover:text-white transition-colors">
                    What GreenNext Is
                  </Link>
                  <Link to="/about/why-we-exist" className="hover:text-white transition-colors">
                    Why GreenNext Exists
                  </Link>
                  <Link to="/about/our-approach" className="hover:text-white transition-colors">
                    The GreenNext Approach
                  </Link>
                  <Link to="/about/direction" className="hover:text-white transition-colors">
                    Long-Term Direction
                  </Link>
                  <Link
                    to="/sustainability"
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    Sustainability
                  </Link>
                  <Link
                    to="/sustainability/energy-aware"
                    className="hover:text-white transition-colors"
                  >
                    Energy-Aware Infra
                  </Link>
                  <Link
                    to="/sustainability/sustainable-growth"
                    className="hover:text-white transition-colors"
                  >
                    Sustainable Growth
                  </Link>
                </div>
              </div>

              {/* Column 2: Infrastructure */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  Infrastructure
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link
                    to="/infrastructure/ai-ready"
                    className="hover:text-white transition-colors"
                  >
                    AI-Ready Infrastructure
                  </Link>
                  <Link to="/infrastructure/compute" className="hover:text-white transition-colors">
                    Compute Systems
                  </Link>
                  <Link to="/infrastructure/storage" className="hover:text-white transition-colors">
                    Storage & Data
                  </Link>
                  <Link to="/infrastructure/network" className="hover:text-white transition-colors">
                    Network & Connectivity
                  </Link>
                  <Link
                    to="/infrastructure/architecture"
                    className="hover:text-white transition-colors"
                  >
                    7-Layer Architecture
                  </Link>
                </div>
              </div>

              {/* Column 3: Energy & Automation */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  Energy & Automation
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link to="/energy/monitoring" className="hover:text-white transition-colors">
                    Power Monitoring
                  </Link>
                  <Link to="/energy/cooling" className="hover:text-white transition-colors">
                    Cooling Efficiency
                  </Link>
                  <Link to="/energy/workload-aware" className="hover:text-white transition-colors">
                    Workload-Aware Res.
                  </Link>
                  <Link to="/energy/analytics" className="hover:text-white transition-colors">
                    Energy Analytics
                  </Link>
                  <Link
                    to="/automation/monitoring"
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    Intelligent Monitoring
                  </Link>
                  <Link to="/automation/anomaly" className="hover:text-white transition-colors">
                    Anomaly Detection
                  </Link>
                  <Link to="/automation/alerts" className="hover:text-white transition-colors">
                    Automated Alerts
                  </Link>
                </div>
              </div>

              {/* Column 4: Regions & Solutions */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  Regions & Solutions
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link
                    to="/regions/overview"
                    className="hover:text-white transition-colors font-medium text-white"
                  >
                    Regional Overview
                  </Link>
                  <Link to="/regions/madurai" className="hover:text-white transition-colors">
                    Madurai (MDU)
                  </Link>
                  <Link to="/regions/coimbatore" className="hover:text-white transition-colors">
                    Coimbatore (CJB)
                  </Link>
                  <Link to="/regions/trichy" className="hover:text-white transition-colors">
                    Trichy (TRZ)
                  </Link>
                  <Link to="/regions/mangalore" className="hover:text-white transition-colors">
                    Mangalore (IXE)
                  </Link>
                  <Link
                    to="/solutions"
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    All Solutions
                  </Link>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors font-medium text-[#10B981]"
                  >
                    Contact Team
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Factual Disclaimer & Copyright Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-2 max-w-3xl">
              <ShieldCheck size={16} className="text-[#10B981] flex-shrink-0" />
              <p>
                <strong>Factual Status:</strong> The regional network, automated systems, and
                dashboard telemetry represented on this website reflect conceptual and planning
                models. They do not constitute claims of currently operating production data centers
                or live customer measurements.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 font-mono text-[11px]">
              <span>© {new Date().getFullYear()} GreenNext Initiative</span>
              <span>South India</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
