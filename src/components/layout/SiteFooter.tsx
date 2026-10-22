import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { InternalLink as Link } from "../common/InternalLink";
import { MessageCircle, ExternalLink, ShieldCheck } from "../icons";
import { NAVIGATION_STRUCTURE } from "../../data/navigation";
import { WHATSAPP_CONFIG } from "../../data/whatsapp";
import { WhatsAppDemoModal, openQuickInquiry } from "../common/FloatingContact";
import { trackEvent } from "../../lib/analytics";

export function SiteFooter() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
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
                className="inline-flex items-center gap-2.5 text-white font-bold text-xl tracking-tight group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] rounded-lg"
                aria-label="GreenNext Home"
              >
                <img
                  src="/images/greennext-logo.png"
                  alt="GreenNext - Digital Infrastructure"
                  width={180}
                  height={40}
                  className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                  decoding="async"
                />
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
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
              {/* Column 1: About & Sustainability */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  About
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link
                    to="/about/what-we-are"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/about/what-we-are",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    What GreenNext Is
                  </Link>
                  <Link
                    to="/about/why-we-exist"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/about/why-we-exist",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Why GreenNext Exists
                  </Link>
                  <Link
                    to="/about/our-approach"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/about/our-approach",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    The GreenNext Approach
                  </Link>
                  <Link
                    to="/about/direction"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/about/direction",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Long-Term Direction
                  </Link>
                  <Link
                    to="/sustainability"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/sustainability",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    Sustainability
                  </Link>
                  <Link
                    to="/sustainability/energy-aware"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/sustainability/energy-aware",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Energy-Aware Infra
                  </Link>
                  <Link
                    to="/sustainability/sustainable-growth"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/sustainability/sustainable-growth",
                        page: currentPath,
                      })
                    }
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
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/ai-ready",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    AI-Ready Infrastructure
                  </Link>
                  <Link
                    to="/infrastructure/compute"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/compute",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Compute Systems
                  </Link>
                  <Link
                    to="/infrastructure/storage"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/storage",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Storage & Data
                  </Link>
                  <Link
                    to="/infrastructure/network"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/network",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Network & Connectivity
                  </Link>
                  <Link
                    to="/infrastructure/architecture"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/architecture",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    7-Layer Architecture
                  </Link>
                  <Link
                    to="/infrastructure/cybersecurity"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/cybersecurity",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Cybersecurity & Protection
                  </Link>
                  <Link
                    to="/infrastructure/facility-engineering"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/facility-engineering",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Facility Engineering
                  </Link>
                  <Link
                    to="/infrastructure/fire-safety"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/fire-safety",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Fire Protection & Safety
                  </Link>
                  <Link
                    to="/infrastructure/commissioning"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/commissioning",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Commissioning & Testing
                  </Link>
                  <Link
                    to="/infrastructure/environmental-monitoring"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/infrastructure/environmental-monitoring",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Environmental Monitoring
                  </Link>
                </div>
              </div>

              {/* Column 3: Energy & Automation */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  Energy & Automation
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link
                    to="/energy/monitoring"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/energy/monitoring",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Power Monitoring
                  </Link>
                  <Link
                    to="/energy/cooling"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/energy/cooling",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Cooling Efficiency
                  </Link>
                  <Link
                    to="/energy/workload-aware"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/energy/workload-aware",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Workload-Aware Res.
                  </Link>
                  <Link
                    to="/energy/analytics"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/energy/analytics",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Energy Analytics
                  </Link>
                  <Link
                    to="/automation/monitoring"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/automation/monitoring",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    Intelligent Monitoring
                  </Link>
                  <Link
                    to="/automation/anomaly"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/automation/anomaly",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Anomaly Detection
                  </Link>
                  <Link
                    to="/automation/alerts"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/automation/alerts",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Automated Alerts
                  </Link>
                  <Link
                    to="/automation/operations"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/automation/operations",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Operations & Maintenance
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
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/regions/overview",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors font-medium text-white"
                  >
                    Regional Overview
                  </Link>
                  <Link
                    to="/regions/madurai"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/regions/madurai",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Madurai (MDU)
                  </Link>
                  <Link
                    to="/regions/coimbatore"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/regions/coimbatore",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Coimbatore (CJB)
                  </Link>
                  <Link
                    to="/regions/trichy"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/regions/trichy",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Trichy (TRZ)
                  </Link>
                  <Link
                    to="/regions/mangalore"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/regions/mangalore",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Mangalore (IXE)
                  </Link>
                  <Link
                    to="/solutions"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/solutions",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors pt-2 font-medium text-white"
                  >
                    All Solutions
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/contact",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors font-medium text-[#10B981]"
                  >
                    Contact Team
                  </Link>
                </div>
              </div>

              {/* Column 5: Ideal Customer Profile (ICP) */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#10B981]">
                  Customer Profiles
                </span>
                <div className="flex flex-col gap-2 text-xs text-[#94A3B8]">
                  <Link
                    to="/icp"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/icp",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors font-medium text-white"
                  >
                    ICP Overview
                  </Link>
                  <Link
                    to="/icp/data-center-operators"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/icp/data-center-operators",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Data Center Operators
                  </Link>
                  <Link
                    to="/icp/ai-hyperscale"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/icp/ai-hyperscale",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    AI & Hyperscale
                  </Link>
                  <Link
                    to="/icp/enterprise-edge"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/icp/enterprise-edge",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Enterprise & Edge
                  </Link>
                  <Link
                    to="/icp/sustainability-energy"
                    onClick={() =>
                      trackEvent({
                        tab: "Navigation",
                        event: "nav_footer_click",
                        value: "/icp/sustainability-energy",
                        page: currentPath,
                      })
                    }
                    className="hover:text-white transition-colors"
                  >
                    Sustainability & ESG
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
              <span className="text-[#334155]">•</span>
              <Link to="/redis-demo" className="text-[#64748B] hover:text-[#10B981] transition-colors flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span>Redis Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
