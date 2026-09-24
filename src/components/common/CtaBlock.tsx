import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, ExternalLink, Send } from "lucide-react";
import { WHATSAPP_CONFIG } from "../../data/whatsapp";
import { openQuickInquiry, WhatsAppDemoModal } from "./FloatingContact";
import { trackEvent, getCurrentPage } from "../../lib/analytics";

interface LongFormCtaProps {
  eyebrow?: string;
  title?: string;
  copy?: string;
  primaryAction?: {
    label: string;
    path: string;
  };
  secondaryAction?: {
    label: string;
    path: string;
  };
  showQuickInquiry?: boolean;
  showWhatsApp?: boolean;
}

export function LongFormCta({
  eyebrow = "Start a Conversation",
  title = "Build the Next Generation of Digital Infrastructure",
  copy = "If you are involved in infrastructure planning, data center operations, AI workload management, or regional digital development across South India, we want to understand your requirements.",
  primaryAction = {
    label: "Connect With GreenNext",
    path: "/contact",
  },
  secondaryAction = {
    label: "Explore Infrastructure Architecture",
    path: "/infrastructure/architecture",
  },
  showQuickInquiry = true,
  showWhatsApp = true,
}: LongFormCtaProps) {
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (!WHATSAPP_CONFIG.isConfigured()) {
      e.preventDefault();
      setWhatsAppModalOpen(true);
    }
  };

  return (
    <>
      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => openQuickInquiry()}
      />

      <section className="relative my-6 sm:my-8 rounded-2xl overflow-hidden border border-[#1E293B] bg-gradient-to-br from-[#121824] via-[#0B0F17] to-[#070A0E] p-8 sm:p-12 lg:p-16 shadow-2xl">
        {/* Structural Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent opacity-80" />

        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-[#10B981] font-semibold block mb-3">
            {eyebrow}
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
            {title}
          </h2>

          <p className="text-[#94A3B8] text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
            {copy}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {primaryAction && (
              <Link
                to={primaryAction.path}
                onClick={() =>
                  trackEvent({
                    tab: "CTA Interactions",
                    event: "cta_block_click",
                    value: `${primaryAction.label} -> ${primaryAction.path}`,
                    page: getCurrentPage(),
                  })
                }
                className="px-6 py-3 rounded-lg bg-[#10B981] text-[#070A0E] font-semibold text-sm hover:bg-[#34D399] transition-all flex items-center gap-2 shadow-lg shadow-[#10B981]/25 hover:shadow-[#10B981]/35"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight size={15} />
              </Link>
            )}

            {showQuickInquiry && (
              <button
                type="button"
                onClick={() => {
                  trackEvent({
                    tab: "CTA Interactions",
                    event: "quick_inquiry_open",
                    value: "CTA Block Quick Inquiry",
                    page: getCurrentPage(),
                  });
                  openQuickInquiry();
                }}
                className="px-5 py-3 rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] font-semibold text-sm hover:bg-[#10B981]/20 transition-all flex items-center gap-2"
              >
                <Send size={14} />
                <span>Quick Inquiry</span>
              </button>
            )}

            {secondaryAction && (
              <Link
                to={secondaryAction.path}
                className="px-5 py-3 rounded-lg border border-[#334155] bg-[#121824]/50 text-white font-medium text-sm hover:bg-[#1A2234] hover:border-[#475569] transition-all"
              >
                {secondaryAction.label}
              </Link>
            )}

            {showWhatsApp && (
              <>
                {WHATSAPP_CONFIG.isConfigured() ? (
                  <a
                    href={WHATSAPP_CONFIG.getUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981] hover:bg-[#10B981]/15 transition-all text-sm font-medium flex items-center gap-2"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle size={16} />
                    <span>Discuss on WhatsApp</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="px-4 py-3 rounded-lg border border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981]/30 transition-all text-sm font-medium flex items-center gap-2"
                    title="WhatsApp Inquiry"
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp Inquiry</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function ShortFormCta({
  label,
  path,
  variant = "ghost",
}: {
  label: string;
  path: string;
  variant?: "primary" | "ghost" | "link";
}) {
  if (variant === "primary") {
    return (
      <Link
        to={path}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10B981] text-[#070A0E] font-semibold text-xs hover:bg-[#34D399] transition-all"
      >
        <span>{label}</span>
        <ArrowRight size={13} />
      </Link>
    );
  }

  if (variant === "link") {
    return (
      <Link
        to={path}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:text-[#34D399] transition-colors group"
      >
        <span>{label}</span>
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
      </Link>
    );
  }

  return (
    <Link
      to={path}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#334155] bg-[#121824] text-[#F8FAFC] text-xs font-medium hover:border-[#10B981] hover:text-[#10B981] transition-all group"
    >
      <span>{label}</span>
      <ArrowRight
        size={12}
        className="text-[#94A3B8] group-hover:text-[#10B981] group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}

export function WhatsAppCta({
  label = "Chat on WhatsApp",
  customMessage,
}: {
  label?: string;
  customMessage?: string;
}) {
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  if (WHATSAPP_CONFIG.isConfigured()) {
    return (
      <a
        href={WHATSAPP_CONFIG.getUrl(customMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/20 transition-all"
      >
        <MessageCircle size={15} />
        <span>{label}</span>
        <ExternalLink size={11} />
      </a>
    );
  }

  return (
    <>
      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => openQuickInquiry()}
      />
      <button
        type="button"
        onClick={() => setWhatsAppModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1E293B] bg-[#121824] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981]/30 text-xs font-semibold transition-all"
      >
        <MessageCircle size={15} />
        <span>{label}</span>
      </button>
    </>
  );
}
