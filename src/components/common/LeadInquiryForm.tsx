import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Send, ShieldCheck } from "../icons";
import { CONTACT_CONFIG } from "../../data/contactConfig";
import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  ACCEPTED_DOCUMENT_TYPES,
  DOCUMENT_REQUIREMENTS,
  LEAD_TYPES,
  MAX_DOCUMENT_SIZE,
  serializeLeadDocument,
  type LeadType,
} from "../../lib/inquiry";
import {
  getCurrentPage,
  getSessionKind,
  trackDocumentSelected,
  trackEvent,
  trackFormAbandon,
  trackFormOpen,
  trackFormStart,
} from "../../lib/analytics";

type LeadFormProps = { leadType: LeadType; onLeadTypeChange?: (type: LeadType) => void };
type FormState = { name: string; email: string; phone: string; organization: string; region: string; topic: string; message: string; currentRole: string; experienceLevel: string; linkedinUrl: string; portfolioUrl: string };
const EMPTY: FormState = { name: "", email: "", phone: "", organization: "", region: "", topic: "", message: "", currentRole: "", experienceLevel: "", linkedinUrl: "", portfolioUrl: "" };
const TOPICS: Record<LeadType, string[]> = {
  [LEAD_TYPES.session]: ["AI infrastructure planning", "Energy and cooling", "Automation and monitoring", "Capacity planning", "Other"],
  [LEAD_TYPES.partner]: ["Technology partnership", "Regional collaboration", "Research collaboration", "Implementation partnership", "Other"],
  [LEAD_TYPES.technical]: ["Infrastructure", "Energy efficiency", "Cooling", "Automation", "AI workload management", "Monitoring", "Capacity planning", "Other"],
  [LEAD_TYPES.general]: ["General contact"],
  [LEAD_TYPES.career]: ["AI infrastructure", "Data center operations", "Energy and cooling", "Software and analytics", "Research", "Other"],
};

export function LeadInquiryForm({ leadType, onLeadTypeChange }: LeadFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const abandonedRef = useRef(false);
  const openedFormRef = useRef<LeadType | null>(null);
  const topics = TOPICS[leadType];
  const documentRequirement = DOCUMENT_REQUIREMENTS[leadType];
  const formCopy = {
    [LEAD_TYPES.session]: { title: "Book a Technical Session", subtitle: "Share the context and topic you would like to discuss with the GreenNext team." },
    [LEAD_TYPES.partner]: { title: "Partner With GreenNext", subtitle: "Tell us about your organization and the collaboration you are exploring." },
    [LEAD_TYPES.technical]: { title: "Infrastructure Requirements Inquiry", subtitle: "Share your technical requirements so the team can understand the infrastructure context." },
    [LEAD_TYPES.general]: { title: "Send a General Inquiry", subtitle: "Send us the details and we will route your request to the right team." },
    [LEAD_TYPES.career]: { title: "Join GreenNext", subtitle: "Tell us about your background, interests, and the opportunities you are looking for." },
  }[leadType];
  const markFormStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackFormStart(leadType);
  };
  const set = (key: keyof FormState, value: string) => {
    markFormStarted();
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    startedRef.current = false;
    submittedRef.current = false;
    abandonedRef.current = false;
    if (openedFormRef.current !== leadType) {
      openedFormRef.current = leadType;
      trackFormOpen(leadType);
    }
    const onPageHide = () => {
      if (startedRef.current && !submittedRef.current && !abandonedRef.current) {
        abandonedRef.current = true;
        trackFormAbandon(leadType);
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      if (startedRef.current && !submittedRef.current && !abandonedRef.current) {
        abandonedRef.current = true;
        trackFormAbandon(leadType);
      }
    };
  }, [leadType]);

  const handleFile = (selected: File | undefined) => {
    if (!selected) { setFile(null); return; }
    if (!ACCEPTED_DOCUMENT_TYPES.includes(selected.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
      setErrors((current) => ({ ...current, ["file"]: "Please select a PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, or TXT file." })); return;
    }
    if (selected.size > MAX_DOCUMENT_SIZE) {
      setErrors((current) => ({ ...current, ["file"]: "Files must be 10 MB or smaller." })); return;
    }
    markFormStarted();
    trackDocumentSelected(leadType);
    setErrors((current) => ({ ...current, ["file"]: "" })); setFile(selected);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = "Name is required";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) next["email"] = "Enter a valid email address";
    if (!form.topic) next["topic"] = "Please select a topic";
    if (leadType === LEAD_TYPES.career && !form.currentRole.trim()) next["currentRole"] = "Current role or student status is required";
    if (leadType === LEAD_TYPES.career && !form.experienceLevel) next["experienceLevel"] = "Please select an experience level";
    if (documentRequirement.required && !file) {
      next["file"] = leadType === LEAD_TYPES.partner
        ? "Please upload a partnership or company document."
        : "Please upload your resume or CV.";
    }
    if (!form.message.trim()) next["message"] = "Message is required";
    setErrors(next); return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!validate()) return;
    setStatus("loading"); setErrorMessage("");
    try {
      const result = await CONTACT_CONFIG.submitLead({
        leadType, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        organization: form.organization.trim(), region: form.region, topic: form.topic,
        message: form.message.trim(), currentRole: form.currentRole.trim(), experienceLevel: form.experienceLevel.trim(),
        linkedinUrl: form.linkedinUrl.trim(), portfolioUrl: form.portfolioUrl.trim(), page: getCurrentPage(),
        sessionKind: leadType === LEAD_TYPES.career ? getSessionKind() : "", document: await serializeLeadDocument(file),
      });
      if (!result.success) { setStatus("error"); setErrorMessage("We could not submit your request. Please try again."); return; }
      submittedRef.current = true;
      trackEvent({ tab: "CTA Interactions", event: "lead_conversion", value: leadType, page: getCurrentPage() });
      setStatus("success");
    } catch { setStatus("error"); setErrorMessage("We could not submit your request. Please check your connection and try again."); }
  };

  if (status === "success") return <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-8 text-center"><CheckCircle2 size={36} className="mx-auto mb-3 text-[#10B981]" /><h3 className="mb-2 text-xl font-bold text-white">Inquiry submitted successfully</h3><p className="mx-auto mb-5 max-w-lg text-sm leading-relaxed text-[#CBD5E1]">Thank you for contacting GreenNext. Your request has been received and will be reviewed by the appropriate team.</p><button type="button" onClick={() => { setForm(EMPTY); setFile(null); setErrors({}); setStatus("idle"); startedRef.current = false; submittedRef.current = false; abandonedRef.current = false; trackFormOpen(leadType); }} className="rounded-lg border border-[#10B981] bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-[#070A0E] transition-colors hover:bg-[#34D399]">Return to Contact Options</button></div>;

  return <form onSubmit={submit} noValidate className="space-y-4">
    <div className="mb-6 border-b border-[#1E293B] pb-5"><span className="text-[11px] font-mono uppercase tracking-widest text-[#10B981]">{leadType}</span><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{formCopy.title}</h2><p className="mt-1 text-sm leading-relaxed text-[#94A3B8]">{formCopy.subtitle}</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name *" value={form.name} error={errors["name"]} onChange={(v) => set("name", v)} autoComplete="name" />
      <Field label="Email *" type="email" value={form.email} error={errors["email"]} onChange={(v) => set("email", v)} autoComplete="email" />
      <Field label="Phone" type="tel" value={form.phone} onChange={(v) => set("phone", v)} autoComplete="tel" />
      <Field label="Organization" value={form.organization} onChange={(v) => set("organization", v)} autoComplete="organization" />
    </div>
    {leadType === LEAD_TYPES.career && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Current Role / Student Status *" value={form.currentRole} error={errors["currentRole"]} onChange={(v) => set("currentRole", v)} placeholder="e.g. Data center engineer or student" />
      <div><label className="label">Experience Level *</label><select value={form.experienceLevel} onChange={(e) => set("experienceLevel", e.target.value)} className={`input ${errors["experienceLevel"] ? "border-red-500/70" : ""}`}><option value="">Select an experience level…</option>{["Student", "Entry level", "Mid level", "Senior", "Leadership", "Researcher", "Other"].map((level) => <option key={level}>{level}</option>)}</select>{errors["experienceLevel"] && <Error text={errors["experienceLevel"]} />}</div>
      <Field label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} placeholder="https://linkedin.com/in/..." />
      <Field label="Portfolio / GitHub URL" type="url" value={form.portfolioUrl} onChange={(v) => set("portfolioUrl", v)} placeholder="https://github.com/..." />
    </div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={leadType === LEAD_TYPES.career ? "Preferred Region" : "Region"} value={form.region} onChange={(v) => set("region", v)} placeholder="City, state, or country" />
      <div><label className="label">{leadType === LEAD_TYPES.session ? "Session / consultation topic *" : leadType === LEAD_TYPES.partner ? "Partnership interest *" : leadType === LEAD_TYPES.career ? "Area of Interest *" : "Inquiry topic *"}</label><select value={form.topic} onChange={(e) => set("topic", e.target.value)} className={`input ${errors["topic"] ? "border-red-500/70" : ""}`}><option value="">Select a topic…</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select>{errors["topic"] && <Error text={errors["topic"]} />}</div>
    </div>
    <div><label className="label">Message *</label><textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} className={`input resize-none ${errors["message"] ? "border-red-500/70" : ""}`} placeholder="Tell us what you would like to discuss…" />{errors["message"] && <Error text={errors["message"]} />}</div>
    <div><label htmlFor="lead-document" className="label">{documentRequirement.label}</label><input id="lead-document" type="file" accept={ACCEPTED_DOCUMENT_EXTENSIONS} required={documentRequirement.required} aria-invalid={Boolean(errors["file"])} aria-describedby="lead-document-help lead-document-error" onChange={(e) => handleFile(e.target.files?.[0])} className="block w-full text-xs text-[#94A3B8] file:mr-3 file:rounded-md file:border-0 file:bg-[#1E293B] file:px-3 file:py-2 file:text-xs file:text-white" />{file && <p className="mt-2 text-xs text-[#CBD5E1]">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}<p id="lead-document-help" className="mt-1 text-[11px] text-[#64748B]">{documentRequirement.helper} Accepted: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, or TXT · maximum 10 MB.</p>{errors["file"] && <p id="lead-document-error"><Error text={errors["file"]} /></p>}</div>
    {status === "error" && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"><AlertCircle size={16} className="mt-0.5 shrink-0" /><div><p className="font-semibold">We couldn't submit your inquiry.</p><p className="mt-1 text-red-200/80">Please check your connection and try again.</p></div></div>}
    <button disabled={status === "loading"} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#10B981] py-3 text-sm font-semibold text-[#070A0E] transition-colors hover:bg-[#34D399] disabled:cursor-not-allowed disabled:opacity-60"><Send size={15} />{status === "loading" ? "Submitting..." : "Submit inquiry"}</button>
    <p className="flex items-center gap-1.5 border-t border-[#1E293B] pt-3 text-[11px] text-[#64748B]"><ShieldCheck size={13} className="text-[#10B981]" /> Your contact details are used to respond to this request.</p>
    {onLeadTypeChange && <div className="flex flex-wrap gap-2 border-t border-[#1E293B] pt-3">{[LEAD_TYPES.session, LEAD_TYPES.partner, LEAD_TYPES.technical, LEAD_TYPES.career].map((type) => <button key={type} type="button" onClick={() => { onLeadTypeChange(type); setStatus("idle"); }} className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${type === leadType ? "border-[#10B981] text-[#10B981]" : "border-[#334155] text-[#94A3B8] hover:border-[#64748B]"}`}>{type}</button>)}</div>}
  </form>;
}

function Field({ label, value, onChange, error, type = "text", placeholder, autoComplete }: { label: string; value: string; onChange: (value: string) => void; error?: string | undefined; type?: string; placeholder?: string; autoComplete?: string }) { return <div><label className="label">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`input ${error ? "border-red-500/70" : ""}`} />{error && <Error text={error} />}</div>; }
function Error({ text }: { text: string }) { return <p className="mt-1 text-[11px] text-red-400">{text}</p>; }
