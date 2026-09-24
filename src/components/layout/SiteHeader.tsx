import { useState, useEffect, useRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf, ChevronDown, Menu, X, ArrowRight, MessageCircle, ExternalLink } from "../icons";
import { NAVIGATION_STRUCTURE, NavigationCategory } from "../../data/navigation";
import { WHATSAPP_CONFIG } from "../../data/whatsapp";
import { WhatsAppDemoModal, openQuickInquiry } from "../common/FloatingContact";
import { trackEvent } from "../../lib/analytics";

export function SiteHeader() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [currentPath]);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const toggleMobileCategory = (id: string) => {
    setExpandedMobileCategory((prev) => (prev === id ? null : id));
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#1E293B] shadow-2xl py-3"
          : "bg-[#070A0E]/80 backdrop-blur-sm border-b border-[#1E293B]/60 py-4"
      }`}
    >
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight group focus:outline-none"
          aria-label="GreenNext Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:bg-[#10B981] group-hover:text-[#070A0E] transition-colors duration-200">
            <Leaf size={18} className="transition-transform group-hover:scale-110" />
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">
            Green<span className="text-[#10B981]">Next</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] ml-1">
            Infrastructure
          </span>
        </Link>

        {/* Desktop Primary Navigation */}
        <nav className="hidden xl:flex items-center gap-1.5" aria-label="Main Navigation">
          {NAVIGATION_STRUCTURE.map((cat) => {
            const isCurrent =
              currentPath === cat.path || (cat.path !== "/" && currentPath.startsWith(cat.path));
            const hasSubmenu = cat.items && cat.items.length > 0;

            if (!hasSubmenu) {
              return (
                <Link
                  key={cat.id}
                  to={cat.path}
                  onClick={() =>
                    trackEvent({
                      tab: "Navigation",
                      event: "nav_header_click",
                      value: cat.path,
                      page: currentPath,
                    })
                  }
                  className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                    isCurrent
                      ? "text-[#10B981] bg-[#10B981]/10"
                      : "text-[#94A3B8] hover:text-white hover:bg-[#121824]"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            }

            const isOpen = activeDropdown === cat.id;

            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={cat.path}
                  onClick={() =>
                    trackEvent({
                      tab: "Navigation",
                      event: "nav_header_click",
                      value: cat.path,
                      page: currentPath,
                    })
                  }
                  className={`px-3 py-1.5 rounded text-[13px] font-medium flex items-center gap-1 transition-colors ${
                    isCurrent || isOpen
                      ? "text-[#10B981] bg-[#10B981]/10"
                      : "text-[#94A3B8] hover:text-white hover:bg-[#121824]"
                  }`}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span>{cat.label}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#10B981]" : "text-[#64748B]"
                    }`}
                  />
                </Link>

                {/* Dropdown / Mega-Menu Flyout */}
                {isOpen && (
                  <div
                    className={`absolute left-0 top-full pt-2 z-50 ${
                      (cat.items?.length || 0) > 4 ? "w-[540px]" : "w-[340px]"
                    }`}
                  >
                    <div className="bg-[#121824] border border-[#334155] rounded-xl shadow-2xl p-4 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="mb-2 pb-2 border-b border-[#1E293B] flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981]">
                          {cat.label} Section
                        </span>
                        <Link
                          to={cat.path}
                          onClick={() =>
                            trackEvent({
                              tab: "Navigation",
                              event: "nav_header_click",
                              value: cat.path,
                              page: currentPath,
                            })
                          }
                          className="text-[11px] text-[#94A3B8] hover:text-white flex items-center gap-1 group"
                        >
                          <span>Overview</span>
                          <ArrowRight
                            size={11}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </div>

                      <div
                        className={`grid gap-2 ${
                          (cat.items?.length || 0) > 4 ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {cat.items?.map((item) => {
                          const isSubCurrent = currentPath === item.path;
                          return (
                            <Link
                              key={item.id}
                              to={item.path}
                              onClick={() =>
                                trackEvent({
                                  tab: "Navigation",
                                  event: "nav_header_click",
                                  value: item.path,
                                  page: currentPath,
                                })
                              }
                              className={`p-2.5 rounded-lg border transition-all text-left flex flex-col group ${
                                isSubCurrent
                                  ? "bg-[#1A2234] border-[#10B981]/50 text-white"
                                  : "bg-[#0B0F17]/50 border-transparent hover:bg-[#1A2234] hover:border-[#334155]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[13px] font-medium text-white group-hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                                  {item.label}
                                </span>
                                {item.isConceptual && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1E293B] text-[#94A3B8]">
                                    Concept
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* WhatsApp Quick Link */}
          {WHATSAPP_CONFIG.isConfigured() ? (
            <a
              href={WHATSAPP_CONFIG.getUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent({
                  tab: "CTA Interactions",
                  event: "whatsapp_modal_trigger",
                  value: "Header WhatsApp Link",
                  page: currentPath,
                })
              }
              className="p-2 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981]/40 hover:bg-[#10B981]/5 transition-colors"
              title="Discuss Infrastructure on WhatsApp"
              aria-label="Discuss Infrastructure on WhatsApp"
            >
              <MessageCircle size={17} />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackEvent({
                  tab: "CTA Interactions",
                  event: "whatsapp_modal_trigger",
                  value: "Header WhatsApp Button",
                  page: currentPath,
                })
                setWhatsAppModalOpen(true);
              }}
              className="p-2 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981]/40 hover:bg-[#10B981]/5 transition-colors"
              title="WhatsApp Inquiry"
              aria-label="WhatsApp Inquiry"
            >
              <MessageCircle size={17} />
            </button>
          )}

          {/* Primary Contact CTA */}
          <Link
            to="/contact"
            onClick={() =>
              trackEvent({
                tab: "CTA Interactions",
                event: "cta_block_click",
                value: "Header Connect Button -> /contact",
                page: currentPath,
              })
            }
            className="px-3.5 py-1.5 rounded-lg bg-[#10B981] text-[#070A0E] text-[13px] font-semibold hover:bg-[#34D399] transition-all flex items-center gap-1.5 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30"
          >
            <span>Connect</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 xl:hidden">
          <Link
            to="/contact"
            className="px-3 py-1 rounded bg-[#10B981] text-[#070A0E] text-xs font-semibold sm:hidden"
          >
            Connect
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#121824] transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-[61px] bottom-0 bg-[#070A0E] border-t border-[#1E293B] z-50 overflow-y-auto p-4 sm:p-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2 max-w-lg mx-auto pb-12">
            {NAVIGATION_STRUCTURE.map((cat) => {
              const hasSubmenu = cat.items && cat.items.length > 0;
              const isExpanded = expandedMobileCategory === cat.id;
              const isCurrent =
                currentPath === cat.path || (cat.path !== "/" && currentPath.startsWith(cat.path));

              if (!hasSubmenu) {
                return (
                  <Link
                    key={cat.id}
                    to={cat.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]"
                        : "bg-[#0B0F17] border-[#1E293B] text-white hover:border-[#334155]"
                    }`}
                  >
                    {cat.label}
                  </Link>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="rounded-lg border border-[#1E293B] bg-[#0B0F17] overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <Link
                      to={cat.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-sm font-medium ${
                        isCurrent ? "text-[#10B981]" : "text-white"
                      }`}
                    >
                      {cat.label}
                    </Link>
                    <button
                      onClick={() => toggleMobileCategory(cat.id)}
                      className="p-1 rounded text-[#94A3B8] hover:text-white"
                      aria-label={`Toggle ${cat.label} submenu`}
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[#10B981]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#1E293B] bg-[#121824]/60 p-2 flex flex-col gap-1">
                      {cat.items?.map((sub) => {
                        const isSubCurrent = currentPath === sub.path;
                        return (
                          <Link
                            key={sub.id}
                            to={sub.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`p-2 rounded text-xs transition-colors flex items-center justify-between ${
                              isSubCurrent
                                ? "bg-[#10B981]/20 text-[#10B981] font-semibold"
                                : "text-[#94A3B8] hover:text-white hover:bg-[#1A2234]"
                            }`}
                          >
                            <span>{sub.label}</span>
                            {sub.isConceptual && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1E293B] text-[#64748B]">
                                Concept
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile Footer CTAs */}
            <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-col gap-3">
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-lg bg-[#10B981] text-[#070A0E] text-center font-semibold text-sm hover:bg-[#34D399] transition-colors"
              >
                Connect With GreenNext
              </Link>
              {WHATSAPP_CONFIG.isConfigured() ? (
                <a
                  href={WHATSAPP_CONFIG.getUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-white text-center font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#121824] transition-colors"
                >
                  <MessageCircle size={16} className="text-[#10B981]" />
                  <span>Discuss on WhatsApp</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setWhatsAppModalOpen(true);
                  }}
                  className="w-full py-3 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-white text-center font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#121824] transition-colors"
                >
                  <MessageCircle size={16} className="text-[#10B981]" />
                  <span>WhatsApp Inquiry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => openQuickInquiry()}
      />
    </header>
  );
}
