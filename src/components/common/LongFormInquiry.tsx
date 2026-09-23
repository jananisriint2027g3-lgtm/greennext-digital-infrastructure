import { useState, FormEvent } from "react";
import { Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { CONTACT_CONFIG } from "../../data/contactConfig";

export interface LongFormState {
  name: string;
  email: string;
  phone: string;
  organization: string;
  category: string;
  region: string;
  message: string;
}

const INITIAL_FORM: LongFormState = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  category: "Regional Infrastructure",
  region: "All Regions",
  message: "",
};

export function LongFormInquiry({
  initialCategory,
  initialRegion,
  title = "Infrastructure Requirements Inquiry",
  subtitle = "Submit your technical infrastructure parameters for regional deployment planning.",
}: {
  initialCategory?: string;
  initialRegion?: string;
  title?: string;
  subtitle?: string;
}) {
  const [formData, setFormData] = useState<LongFormState>({
    ...INITIAL_FORM,
    ...(initialCategory ? { category: initialCategory } : {}),
    ...(initialRegion ? { region: initialRegion } : {}),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LongFormState, string>>>({});

  const validate = (): boolean => {
    const errs: Partial<Record<keyof LongFormState, string>> = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Valid work email is required";
    }
    if (!formData.message.trim()) {
      errs.message = "Requirements description is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Isolated demo simulation — no network call, no data storage
      await CONTACT_CONFIG.submitInquiryDemo(formData);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6 sm:p-8 shadow-2xl">
      <div className="pb-6 mb-6 border-b border-[#1E293B]">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#10B981]/10 text-[#10B981] text-[11px] font-mono uppercase tracking-wider mb-2">
          <span>Technical Inquiry</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-xs sm:text-sm text-[#94A3B8]">{subtitle}</p>
      </div>

      {submitted ? (
        <div className="py-12 px-6 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-[#10B981]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Inquiry Acknowledged</h3>
          <p className="text-base text-[#E2E8F0] font-medium max-w-lg mx-auto mb-2">
            “Thank you. Your inquiry has been received for demonstration purposes.”
          </p>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
            This is a frontend demonstration prototype. No information has been stored, transmitted,
            or processed on a backend server.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#070A0E] text-xs font-semibold transition-colors shadow-lg shadow-[#10B981]/20"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors ${
                  errors.name ? "border-red-500/70" : "border-[#1E293B]"
                }`}
              />
              {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Work Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. ramesh@organization.com"
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors ${
                  errors.email ? "border-red-500/70" : "border-[#1E293B]"
                }`}
              />
              {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Phone / Contact Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 00000 00000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Organization / Company
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g. Tech Enterprise Ltd"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Inquiry Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
              >
                <option value="Regional Infrastructure">Regional Infrastructure</option>
                <option value="AI & High-Density Compute">AI & High-Density Compute</option>
                <option value="Energy & Thermal Telemetry">Energy & Thermal Telemetry</option>
                <option value="Automation Architecture">Automation Architecture</option>
                <option value="Ecosystem Collaboration">Ecosystem Collaboration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Regional Focus Area
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1E293B] bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
              >
                <option value="All Regions">All South India Regions</option>
                <option value="Madurai (MDU)">Madurai (MDU)</option>
                <option value="Coimbatore (CJB)">Coimbatore (CJB)</option>
                <option value="Trichy (TRZ)">Trichy (TRZ)</option>
                <option value="Mangalore (IXE)">Mangalore (IXE)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#94A3B8] mb-1.5 uppercase tracking-wider">
              Infrastructure Requirements or Message *
            </label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe compute workload profiles, power considerations, or regional planning questions..."
              className={`w-full px-3.5 py-2.5 rounded-lg border bg-[#121824] text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors resize-none ${
                errors.message ? "border-red-500/70" : "border-[#1E293B]"
              }`}
            />
            {errors.message && <p className="text-red-400 text-[11px] mt-1">{errors.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-[#070A0E] text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30"
            >
              <Send size={15} />
              <span>{isSubmitting ? "Submitting Inquiry..." : "Submit Technical Inquiry"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#1E293B]/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#10B981]" />
              <span>Demonstration UI interaction · No data stored</span>
            </div>
            <span>Frontend Prototype</span>
          </div>
        </form>
      )}
    </div>
  );
}
