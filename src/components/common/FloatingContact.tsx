import { useState, FormEvent, useEffect } from "react";
import { MessageCircle, X, ArrowRight, Send, CheckCircle2, ShieldCheck, AlertCircle } from "../icons";
import { Link } from "@tanstack/react-router";
import { WHATSAPP_CONFIG } from "../../data/whatsapp";
import { CONTACT_CONFIG } from "../../data/contactConfig";
import { trackEvent, getCurrentPage } from "../../lib/analytics";

/**
 * Global helper to trigger the Quick Inquiry modal from anywhere on the website.
 */
export function openQuickInquiry(interest?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-quick-inquiry", {
        detail: { interest },
      })
    );
  }
}

interface QuickFormState {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

const INTEREST_OPTIONS = [
  "AI Infrastructure",
  "Data Center Solutions",
  "Energy Efficiency",
  "Infrastructure Monitoring",
  "Intelligent Automation",
  "Cloud & Edge Infrastructure",
  "Regional Infrastructure (MDU/CJB/TRZ/IXE)",
  "Other",
];

const INITIAL_QUICK_STATE: QuickFormState = {
  name: "",
  email: "",
  phone: "",
  interest: "",
  message: "",
};

// ─── Standalone WhatsApp Demo Dialog ─────────────────────────────────────────────
export function WhatsAppDemoModal({
  isOpen,
  onClose,
  onOpenQuickInquiry,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickInquiry: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="WhatsApp Demo Information"
    >
      <div
        className="absolute inset-0 bg-[#070A0E]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-[#0B0F17] border border-[#10B981]/40 rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto mb-4">
          <MessageCircle size={24} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] text-[10px] font-mono uppercase tracking-wider mb-2">
          <span>Prototype Notice · Direct Messaging</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">WhatsApp Inquiry Channel</h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
          The WhatsApp messaging channel is currently running in demonstration mode for this prototype.
          Direct chat will connect to the GreenNext regional infrastructure desk in production.
        </p>
        <div className="p-3 rounded-lg border border-[#1E293B] bg-[#121824] text-left text-xs text-[#CBD5E1] mb-5 space-y-1">
          <div className="flex items-center gap-1.5 text-[#10B981] font-semibold text-[11px]">
            <ShieldCheck size={13} />
            <span>Ready for Production Integration</span>
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            Configure the direct phone route to immediately enable real-time technical coordination.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenQuickInquiry();
            }}
            className="flex-1 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#070A0E] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Send size={13} />
            <span>Use Quick Inquiry Instead</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#334155] bg-[#121824] hover:bg-[#1A2234] text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Quick Inquiry Modal ───────────────────────────────────────────────
export function QuickInquiryModal({
  isOpen,
  onClose,
  initialInterest,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialInterest?: string;
}) {
  const [form, setForm] = useState<QuickFormState>(INITIAL_QUICK_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<QuickFormState>>({});

  useEffect(() => {
    if (initialInterest) {
      setForm((prev) => ({ ...prev, interest: initialInterest }));
    }
  }, [initialInterest]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const e: Partial<QuickFormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await CONTACT_CONFIG.submitQuickInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        interest: form.interest || "General Inquiry",
        message: form.message.trim(),
        page: getCurrentPage(),
      });

      if (result.success) {
        // Track the submission — record only selected interest category, no PII
        trackEvent({
          tab: "CTA Interactions",
          event: "quick_inquiry_submit",
          value: form.interest || "No Interest Selected",
          page: getCurrentPage(),
        });
        setSubmitted(true);
      } else {
        setSubmitError(result.error || "Unable to submit inquiry. Please try again.");
      }
    } catch {
      setSubmitError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_QUICK_STATE);
    setErrors({});
    setSubmitError(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Inquiry Form"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#070A0E]/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-lg bg-[#0B0F17] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#10B981] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981] block mb-0.5">
              Quick Inquiry · Regional Infrastructure
            </span>
            <h2 className="text-base font-bold text-white">Send Infrastructure Inquiry</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            aria-label="Close inquiry form"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-[#10B981]/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={30} className="text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Inquiry Submitted Successfully</h3>
              <p className="text-sm text-[#E2E8F0] font-medium leading-relaxed mb-3 max-w-sm mx-auto">
                Thank you. Your inquiry has been received by the GreenNext planning team.
              </p>
              <p className="text-xs text-[#94A3B8] mb-6 max-w-sm mx-auto">
                Our infrastructure architects will review your parameters against regional corridor capacity and connect with you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg border border-[#334155] bg-[#121824] text-white text-xs font-semibold hover:bg-[#1A2234] transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-lg bg-[#10B981] text-[#070A0E] text-xs font-semibold hover:bg-[#34D399] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className={`w-full px-3 py-2 rounded-lg border text-white text-sm bg-[#121824] focus:outline-none focus:border-[#10B981] transition-colors ${
                      errors.name ? "border-red-500/70" : "border-[#1E293B]"
                    }`}
                    id="quick-inquiry-name"
                    autoComplete="name"
                  />
                  {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className={`w-full px-3 py-2 rounded-lg border text-white text-sm bg-[#121824] focus:outline-none focus:border-[#10B981] transition-colors ${
                      errors.email ? "border-red-500/70" : "border-[#1E293B]"
                    }`}
                    id="quick-inquiry-email"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 00000 00000"
                    className="w-full px-3 py-2 rounded-lg border border-[#1E293B] text-white text-sm bg-[#121824] focus:outline-none focus:border-[#10B981] transition-colors"
                    id="quick-inquiry-phone"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
                    Area of Interest
                  </label>
                  <select
                    value={form.interest}
                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#1E293B] text-white text-sm bg-[#121824] focus:outline-none focus:border-[#10B981] transition-colors"
                    id="quick-inquiry-interest"
                  >
                    <option value="">Select an area…</option>
                    {INTEREST_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
                  Message *
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your infrastructure question or requirements…"
                  className={`w-full px-3 py-2 rounded-lg border text-white text-sm bg-[#121824] focus:outline-none focus:border-[#10B981] transition-colors resize-none ${
                    errors.message ? "border-red-500/70" : "border-[#1E293B]"
                  }`}
                  id="quick-inquiry-message"
                />
                {errors.message && <p className="text-red-400 text-[10px] mt-1">{errors.message}</p>}
              </div>

              {submitError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-[#070A0E] text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 cursor-pointer"
                id="quick-inquiry-submit"
              >
                <Send size={14} />
                <span>{isSubmitting ? "Transmitting Inquiry..." : "Submit Inquiry"}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#64748B] pt-1">
                <ShieldCheck size={12} className="text-[#10B981]" />
                <span>Direct technical routing · Transmitted securely to GreenNext</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Floating Contact Widget ────────────────────────────────────────────────────
export function FloatingContact() {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [activeInterest, setActiveInterest] = useState<string | undefined>(undefined);

  // Global event listener to allow any button on any page to open Quick Inquiry
  useEffect(() => {
    const handleGlobalTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ interest?: string }>;
      setActiveInterest(customEvent.detail?.interest);
      setModalOpen(true);
    };
    window.addEventListener("open-quick-inquiry", handleGlobalTrigger);
    return () => {
      window.removeEventListener("open-quick-inquiry", handleGlobalTrigger);
    };
  }, []);

  const toggle = () => setExpanded((v) => !v);

  const openInquiryModal = () => {
    setExpanded(false);
    setModalOpen(true);
    trackEvent({
      tab: "CTA Interactions",
      event: "quick_inquiry_open",
      value: "Floating Contact Widget",
      page: getCurrentPage(),
    });
  };

  const handleWhatsAppAction = (e: React.MouseEvent) => {
    if (!WHATSAPP_CONFIG.isConfigured()) {
      e.preventDefault();
      setExpanded(false);
      setWhatsAppModalOpen(true);
      trackEvent({
        tab: "CTA Interactions",
        event: "whatsapp_modal_trigger",
        value: "Floating Contact Widget WhatsApp",
        page: getCurrentPage(),
      });
    }
  };

  return (
    <>
      <QuickInquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialInterest={activeInterest}
      />

      <WhatsAppDemoModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        onOpenQuickInquiry={() => setModalOpen(true)}
      />

      {/* Floating Widget — bottom-right, above mobile navigation */}
      <aside
        className="fixed bottom-6 right-4 sm:right-6 z-[100] flex flex-col items-end gap-2"
        aria-label="Quick contact and inquiry options"
      >
        {/* Expanded actions */}
        {expanded && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in slide-in-from-bottom-2 duration-200">
            {/* Quick Inquiry — opens reusable demo modal */}
            <button
              onClick={openInquiryModal}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0B0F17] border border-[#334155] text-white text-xs font-semibold shadow-xl hover:border-[#10B981] hover:text-[#10B981] transition-all whitespace-nowrap backdrop-blur-sm"
              id="floating-quick-inquiry-btn"
            >
              <Send size={13} className="text-[#10B981]" />
              <span>Quick Inquiry</span>
            </button>

            {/* WhatsApp CTA */}
            {WHATSAPP_CONFIG.isConfigured() ? (
              <a
                href={WHATSAPP_CONFIG.getUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0B0F17] border border-[#10B981]/40 text-[#10B981] text-xs font-semibold shadow-xl hover:bg-[#10B981]/10 transition-all whitespace-nowrap backdrop-blur-sm"
                id="floating-whatsapp-btn"
                title="Chat on WhatsApp"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                onClick={handleWhatsAppAction}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-[#94A3B8] hover:text-[#10B981] hover:border-[#10B981]/30 text-xs font-semibold shadow-xl hover:bg-[#10B981]/5 transition-all whitespace-nowrap backdrop-blur-sm"
                id="floating-whatsapp-btn"
                title="WhatsApp Inquiry"
              >
                <MessageCircle size={13} />
                <span>WhatsApp Inquiry</span>
              </button>
            )}

            {/* Full Contact Page */}
            <Link
              to="/contact"
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1E293B] text-[#94A3B8] text-xs font-semibold shadow-xl hover:border-[#334155] hover:text-white transition-all whitespace-nowrap backdrop-blur-sm"
              id="floating-contact-page-btn"
            >
              <ArrowRight size={13} />
              <span>Contact Page</span>
            </Link>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
            expanded
              ? "bg-[#1E293B] text-white border border-[#334155] rotate-45"
              : "bg-[#10B981] text-[#070A0E] hover:bg-[#34D399] shadow-[#10B981]/30"
          }`}
          aria-label={expanded ? "Close contact menu" : "Open quick contact and inquiry menu"}
          id="floating-contact-toggle"
        >
          {expanded ? <X size={20} /> : <MessageCircle size={20} />}
        </button>
      </aside>
    </>
  );
}
