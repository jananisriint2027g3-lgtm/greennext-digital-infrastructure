import { createFileRoute } from "@tanstack/react-router";
import { InternalLink as Link } from "../components/common/InternalLink";
import { PageHero } from "../components/common/PageHero";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Official Privacy Policy for GreenNext Digital Infrastructure Initiative. Learn how we handle inquiry data, automated notifications, privacy-preserving analytics, and DPDP Act compliance.",
      },
      { property: "og:title", content: "Privacy Policy | GreenNext Digital Infrastructure" },
      {
        property: "og:description",
        content:
          "Official Privacy Policy for GreenNext Digital Infrastructure Initiative, detailing data protection principles, report notifications, and privacy rights.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

export function PrivacyPolicyPage() {
  const verifiedEmail = "compliance@trustgrid.ai";
  const siteUrl = "https://greennext-ai.vercel.app";

  const keyPrinciples = [
    {
      icon: ShieldCheck,
      title: "No Data Selling",
      desc: "We never sell, rent, monetize, or trade visitor or inquiry data to third parties or advertising networks.",
    },
    {
      icon: Lock,
      title: "Inquiry-Bound Processing",
      desc: "Information submitted via our forms is used solely to evaluate technical inquiries, coordinate sessions, and respond.",
    },
    {
      icon: Eye,
      title: "Sanitized Telemetry",
      desc: "Automated reporting workflows utilize aggregated metrics and sanitize visitor details to prevent unnecessary exposure of PII.",
    },
    {
      icon: FileText,
      title: "DPDP Act Alignment",
      desc: "Structured in compliance with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and global privacy principles.",
    },
  ];

  const sections = [
    { id: "controller", label: "1. Data Controller & Scope" },
    { id: "categories", label: "2. Categories of Data Collected" },
    { id: "purposes", label: "3. Purposes of Processing & Lawful Bases" },
    { id: "email-workflow", label: "4. Email Communications & Reporting" },
    { id: "disclosure", label: "5. Disclosure & Service Providers" },
    { id: "security", label: "6. Data Security & Storage Safeguards" },
    { id: "retention", label: "7. Data Retention & Expiration" },
    { id: "rights", label: "8. Data Principal Rights & Requests" },
    { id: "cookies", label: "9. Cookies, Diagnostics & Analytics" },
    { id: "third-party", label: "10. Third-Party Links & Integrations" },
    { id: "children", label: "11. Children's Privacy" },
    { id: "breach", label: "12. Data Breach Notification" },
    { id: "disclaimers", label: "13. Limitations & Disclaimers" },
    { id: "updates", label: "14. Policy Updates" },
    { id: "contact", label: "15. Privacy Contact & Redressal" },
  ];

  return (
    <div className="bg-[#070A0E] text-white min-h-screen">
      {/* Hero Header */}
      <PageHero
        breadcrumbs={[{ label: "Privacy Policy" }]}
        eyebrow="LEGAL & DATA GOVERNANCE"
        h1="GreenNext Privacy Policy"
        intro="This Privacy Policy describes how the GreenNext Digital Infrastructure Initiative collects, handles, protects, and respects your personal and inquiry data across our website and technical platforms."
        secondaryAction={
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#94A3B8]">
            <span className="px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155] text-[#10B981]">
              Effective Date: October 2026
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155] text-[#94A3B8]">
              Last Updated: October 2026
            </span>
          </div>
        }
      />

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {keyPrinciples.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-xl bg-[#0D131F] border border-[#1E293B] hover:border-[#10B981]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mb-3">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-base font-semibold text-white mb-2">{item.title}</h2>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Layout: Sidebar ToC + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents (Desktop Sticky) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 p-6 rounded-xl bg-[#0D131F] border border-[#1E293B] flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Policy Navigation</span>
              </span>
              <p className="text-xs text-[#64748B]">
                Jump to specific sections of the GreenNext Privacy Policy:
              </p>
              <nav
                aria-label="Table of Contents"
                className="flex flex-col gap-1.5 text-xs text-[#94A3B8]"
              >
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="hover:text-[#10B981] hover:translate-x-0.5 transition-all py-1 border-b border-[#1E293B]/60 last:border-none"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase text-[#64748B]">
                  Verified Privacy Contact
                </span>
                <a
                  href={`mailto:${verifiedEmail}`}
                  className="text-xs font-mono text-[#10B981] hover:underline flex items-center gap-1.5 break-all"
                >
                  <Mail size={13} className="flex-shrink-0" />
                  <span>{verifiedEmail}</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Main Legal Content */}
          <main className="lg:col-span-8 flex flex-col gap-10">
            {/* Introductory Notice Banner */}
            <div className="p-5 rounded-xl bg-[#0B1528] border border-[#1E3A8A]/50 text-xs text-[#93C5FD] leading-relaxed flex flex-col sm:flex-row gap-3 items-start">
              <ShieldCheck size={20} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">
                  GreenNext Digital Infrastructure Initiative — Official Privacy Notice
                </strong>
                This Privacy Policy is based on the TRUSTGRID.AI enterprise governance framework,
                adapted specifically to accurately reflect GreenNext’s digital infrastructure
                planning platform, regional compute models, and automated email reporting workflows.
              </div>
            </div>

            {/* Section 1 */}
            <section id="controller" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">01.</span>
                <span>Data Controller & Scope</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  This Privacy Policy applies to personal information collected and processed by the{" "}
                  <strong className="text-white">
                    GreenNext Digital Infrastructure Initiative
                  </strong>{" "}
                  (“GreenNext”, “we”, “us”, or “our”) through our primary web portal at{" "}
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10B981] hover:underline font-mono"
                  >
                    {siteUrl}
                  </a>
                  , as well as associated sub-domains, interactive calculators, session tools, and
                  inquiry intake workflows.
                </p>
                <p>
                  GreenNext operates as an AI-driven digital infrastructure initiative focused on
                  infrastructure intelligence, modular facility topologies, power reliability,
                  cooling efficiency, and regional digital infrastructure modeling across South
                  India.
                </p>
                <p>
                  GreenNext acts as the data controller in respect of personal data submitted via
                  our contact and inquiry interfaces. We process personal data in accordance with
                  applicable law, including the{" "}
                  <strong className="text-white">
                    Digital Personal Data Protection Act, 2023 (India) (“DPDP Act”)
                  </strong>
                  , the Digital Personal Data Protection Rules, and relevant international data
                  protection principles where applicable to cross-border stakeholders.
                </p>
                <p>
                  For any privacy-related questions, notice requests, or to exercise statutory
                  rights, our designated privacy contact is:
                </p>
                <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B] font-mono text-xs text-white">
                  <div>
                    <strong>Initiative:</strong> GreenNext Digital Infrastructure Initiative
                  </div>
                  <div>
                    <strong>Jurisdiction:</strong> South India / India
                  </div>
                  <div>
                    <strong>Privacy Contact Email:</strong>{" "}
                    <a href={`mailto:${verifiedEmail}`} className="text-[#10B981] underline">
                      {verifiedEmail}
                    </a>
                  </div>
                  <div>
                    <strong>Portal:</strong> {siteUrl}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="categories" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">02.</span>
                <span>Categories of Personal Data We Process</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  Depending on how you interact with our website and advisory tools, we may process
                  the following categories of information:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong className="text-white">Contact & Inquiry Information:</strong> Name,
                    work email address, phone number, organization name, job title, and specific
                    areas of infrastructure interest (such as AI & Hyperscale, Colocation
                    Assessment, Technical Sessions, Edge Modernization, or Sustainability) when you
                    voluntarily submit our Quick Inquiry, Long-Form Inquiry, or Lead Inquiry forms.
                  </li>
                  <li>
                    <strong className="text-white">Technical Inquiry Details:</strong> Specific
                    facility parameters, power density requirements, timeline projections,
                    questions, and narrative message text provided during inquiry submission or
                    meeting booking.
                  </li>
                  <li>
                    <strong className="text-white">Communications & Confirmation Records:</strong>{" "}
                    Correspondence, inquiry acknowledgments, automated confirmation receipt
                    timestamps, unique Request IDs, and technical session booking details.
                  </li>
                  <li>
                    <strong className="text-white">Usage & Diagnostic Telemetry:</strong> Anonymized
                    or privacy-preserving technical information including device identifiers,
                    browser type, operating system, approximate network region, page paths visited,
                    session interaction timestamps, and referrer information collected via
                    first-party analytics.
                  </li>
                  <li>
                    <strong className="text-white">Session State Telemetry:</strong> Temporary
                    session IDs used to maintain journey continuity across calculator views and
                    demonstration tools (such as our transient Redis session cache, which is
                    strictly time-limited and expires automatically).
                  </li>
                </ul>
                <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B] text-xs text-[#94A3B8]">
                  <strong className="text-white block mb-1">Data Minimization Note:</strong>
                  We do not collect credit card numbers, payment instruments, biometrics,
                  government-issued IDs, or special categories of sensitive personal data. We do not
                  knowingly collect personal data from minors under 18 years of age.
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="purposes" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">03.</span>
                <span>Purposes of Processing and Lawful Bases</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  We process personal information only for legitimate, transparent, and defined
                  purposes:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-[#10B981]" />
                      <span>Responding to Inquiries</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Evaluating technical requirements, coordinating technical advisory sessions,
                      answering questions, and sharing relevant infrastructure specifications.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-[#10B981]" />
                      <span>Automated Confirmations</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Sending instant email delivery acknowledgments and next-steps summaries to
                      visitors who submit inquiries on our website.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-[#10B981]" />
                      <span>Operations & Notifications</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Routing structured, privacy-safe notifications to internal infrastructure
                      coordinators to ensure prompt follow-up on prospective partnerships.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-[#10B981]" />
                      <span>Platform Security & Integrity</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Detecting and mitigating malicious traffic, spam, DDoS attacks, unauthorized
                      scraping, and ensuring form rate limiting and CSRF protection.
                    </p>
                  </div>
                </div>

                <p>
                  <strong className="text-white">Lawful Bases for Processing:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    <strong className="text-white">Consent:</strong> Where you voluntarily supply
                    contact details via our forms or consent to optional cookies and diagnostic
                    tracking.
                  </li>
                  <li>
                    <strong className="text-white">Legitimate Uses / Legitimate Interests:</strong>{" "}
                    Operating, protecting, and improving our regional infrastructure initiative,
                    responding to prospective enterprise collaborators, and maintaining platform
                    resilience.
                  </li>
                  <li>
                    <strong className="text-white">Statutory Compliance:</strong> Satisfying
                    applicable legal, regulatory, accounting, or reporting mandates recognized under
                    Indian law.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="email-workflow" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">04.</span>
                <span>Email Communications & Automated Reporting</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  GreenNext operates an automated, security-hardened email and reporting
                  architecture designed with privacy-safe guardrails:
                </p>
                <div className="p-4 rounded-lg bg-[#0D131F] border border-[#1E293B] space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Server size={16} className="text-[#10B981]" />
                    <span>Automated Inquiry Lifecycle</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#94A3B8]">
                    <li>
                      When you submit an inquiry form, our backend records your request with an
                      idempotent Request ID in our protected intake repository.
                    </li>
                    <li>
                      An automated confirmation email is dispatched to your provided email address
                      acknowledging receipt and providing technical reference materials.
                    </li>
                    <li>
                      An internal operational report notification is dispatched to GreenNext’s
                      designated team recipient (
                      <span className="font-mono text-[#10B981]">{verifiedEmail}</span>) to alert
                      coordinators to the new technical inquiry.
                    </li>
                    <li>
                      Routine daily, weekly, and monthly aggregate analytics summaries generated by
                      our reporting triggers strip personal identifiers and summarize only sanitized
                      metric aggregates (such as volume by inquiry type and regional interest).
                    </li>
                  </ol>
                </div>
                <p>
                  We do not use open mail relays. All email triggers use server-side authentication
                  with shared secrets, rate-limiting throttles, and recipient validation to prevent
                  unsolicited email delivery.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="disclosure" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">05.</span>
                <span>Information Disclosure & Service Providers</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  <strong className="text-white">
                    We do not sell, rent, or lease personal information.
                  </strong>
                </p>
                <p>
                  We may disclose personal data to vetted third-party service providers and
                  infrastructure partners who perform technical functions on our behalf, strictly
                  bound by data protection obligations:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong className="text-white">Cloud Hosting & Edge CDN:</strong> Vercel Inc.
                    provides global edge hosting, SSL termination, and serverless compute
                    infrastructure.
                  </li>
                  <li>
                    <strong className="text-white">Form Automation & Storage:</strong> Google Apps
                    Script & Google Workspace support server-side intake, record archiving, and
                    transactional notifications to our administrative mailbox.
                  </li>
                  <li>
                    <strong className="text-white">Internal Task Management:</strong> Atlassian Jira
                    is used for internal inquiry workflow coordination and assignee tracking for
                    authorized GreenNext team members.
                  </li>
                  <li>
                    <strong className="text-white">Diagnostic & Performance Analytics:</strong>{" "}
                    Vercel Web Analytics (first-party, privacy-preserving) and Microsoft Clarity
                    (anonymized user experience diagnostics).
                  </li>
                  <li>
                    <strong className="text-white">Legal & Regulatory Authorities:</strong> We may
                    disclose data if required to do so by law, court order, subpoena, or in good
                    faith to protect legal rights and physical safety.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="security" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">06.</span>
                <span>Data Security & Infrastructure Safeguards</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  GreenNext employs multi-layered technical, organizational, and physical safeguards
                  to protect personal and technical data:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">Encryption in Transit</strong>
                    <span className="text-xs text-[#94A3B8]">
                      All web traffic and API dispatches are encrypted using modern Transport Layer
                      Security (TLS 1.2/1.3) with HTTPS enforcement.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Server-Side Secret Isolation
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      API keys, webhooks, and Google Apps Script shared secrets reside exclusively
                      in server environments and are never exposed to browser clients.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Access Control & Least Privilege
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      Internal administrative dashboards and spreadsheet registries are restricted
                      strictly to authorized infrastructure researchers.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Anti-Abuse & Rate Limiting
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      Inquiry endpoints employ client validation, payload sanitization, and
                      throttling to prevent spam, script injection, and automated flooding.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#0D131F] border border-[#334155] text-xs text-[#94A3B8] flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">
                      Disclaimer on Transmission Security
                    </strong>
                    While GreenNext adheres to rigorous industry security practices, no method of
                    transmission over the public Internet or electronic storage can be guaranteed
                    100% immune from unauthorized intrusions, zero-day exploits, or third-party
                    infrastructure interruptions.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="retention" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">07.</span>
                <span>Data Retention & Automatic Expiration</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  We retain personal data only for the time necessary to fulfill the purposes
                  described in this policy, resolve inquiries, coordinate partnerships, or comply
                  with statutory requirements:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    <strong className="text-white">Inquiry & Consultation Submissions:</strong>{" "}
                    Retained for the duration of active technical evaluation and follow-up
                    communication (typically up to 24 months from the last interaction).
                  </li>
                  <li>
                    <strong className="text-white">Automated Delivery Logs:</strong> Transactional
                    dispatch logs are retained temporarily for delivery debugging and deduplication,
                    then routinely purged.
                  </li>
                  <li>
                    <strong className="text-white">Transient Session Cache:</strong> Technical
                    session state used in demonstration tools (such as our Redis integration demo)
                    is governed by an explicit 1-hour time-to-live (`TTL = 3600 seconds`) and is
                    systematically purged automatically.
                  </li>
                  <li>
                    <strong className="text-white">Aggregated Reporting Metrics:</strong>{" "}
                    De-identified, anonymized analytical metrics are retained indefinitely for
                    regional infrastructure planning research.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section id="rights" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">08.</span>
                <span>Data Principal Rights & Privacy Requests</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  Under India’s Digital Personal Data Protection Act, 2023 (DPDP Act) and
                  international data privacy principles, you possess recognized rights regarding
                  your personal information:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Right to Access & Summary
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      Request confirmation of whether we process your personal data and receive a
                      concise summary of the data and processing activities.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Right to Correction & Updating
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      Request rectification or completion of any inaccurate, misleading, or outdated
                      personal data held in our systems.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">Right to Erasure</strong>
                    <span className="text-xs text-[#94A3B8]">
                      Request deletion of personal data when the original inquiry has concluded and
                      retention is no longer necessary or mandated by law.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0D131F] border border-[#1E293B]">
                    <strong className="text-white text-xs block mb-1">
                      Right to Grievance Redressal
                    </strong>
                    <span className="text-xs text-[#94A3B8]">
                      Submit concerns or complaints directly to our designated privacy point of
                      contact for prompt evaluation and resolution.
                    </span>
                  </div>
                </div>
                <p>To exercise any of these rights, please email our privacy team at:</p>
                <p className="font-mono text-xs">
                  <a
                    href={`mailto:${verifiedEmail}?subject=GreenNext%20Privacy%20Request`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 transition-colors"
                  >
                    <Mail size={14} />
                    <span>{verifiedEmail}</span>
                  </a>
                </p>
                <p className="text-xs text-[#64748B]">
                  We will verify the identity of the requester to safeguard personal data before
                  processing substantive requests.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="cookies" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">09.</span>
                <span>Cookies, Diagnostics & Analytics</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  GreenNext prioritizes privacy-friendly telemetry across all interactive tools:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    <strong className="text-white">Essential Functional Storage:</strong> Local
                    storage is used for UI state, such as remembering dismissal of banners, chatbot
                    active tab selection, and journey tracking. These keys do not track you across
                    third-party websites.
                  </li>
                  <li>
                    <strong className="text-white">Vercel Web Analytics:</strong> We use
                    first-party, privacy-preserving web analytics (
                    <code className="font-mono text-xs text-[#10B981]">@vercel/analytics</code>). It
                    does not use persistent third-party cookies or profile individual visitors
                    across the Internet.
                  </li>
                  <li>
                    <strong className="text-white">Microsoft Clarity:</strong> We utilize Clarity
                    for aggregate behavioral insights (such as scroll depth and navigation friction)
                    to identify usability bottlenecks. Telemetry is masked to exclude sensitive
                    input.
                  </li>
                </ul>
                <p>
                  You can configure your web browser to block or delete cookies at any time.
                  Disabling cookies will not affect your ability to view our infrastructure
                  research, models, or submit inquiry forms.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="third-party" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">10.</span>
                <span>Third-Party Links & Integrations</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  Our portal features external links and optional integrations to external services:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    <strong className="text-white">LinkedIn:</strong> Our company profile links to
                    our official LinkedIn presence.
                  </li>
                  <li>
                    <strong className="text-white">Google Calendar:</strong> Interactive booking
                    links for Technical Sessions direct visitors to Google Calendar appointment
                    schedules.
                  </li>
                  <li>
                    <strong className="text-white">WhatsApp Inquiry:</strong> Direct click-to-chat
                    links connect visitors to authorized inquiry channels via WhatsApp.
                  </li>
                </ul>
                <p>
                  These third-party platforms maintain their own independent privacy notices.
                  GreenNext is not responsible for the data practices or policies of external
                  services once you navigate away from our site.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="children" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">11.</span>
                <span>Children’s Privacy</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  The GreenNext website and digital infrastructure models are designed exclusively
                  for commercial, enterprise, and professional data center stakeholders. We do not
                  knowingly solicit or collect personal data from individuals under 18 years of age.
                  If you believe a minor has submitted personal information through our forms,
                  please contact us at{" "}
                  <span className="font-mono text-[#10B981]">{verifiedEmail}</span>, and we will
                  take immediate steps to delete it.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="breach" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">12.</span>
                <span>Personal Data Breach Notification</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  GreenNext maintains incident response protocols to detect, assess, and respond to
                  potential data security incidents. In the event of a verified personal data breach
                  impacting stored records, we will notify affected individuals and relevant
                  regulatory bodies (including the Data Protection Board of India, where statutory
                  rules apply) in compliance with applicable timeframes and statutory standards.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section id="disclaimers" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">13.</span>
                <span>Limitations of Liability & Disclaimers</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>To the maximum extent permitted by applicable law:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>
                    GreenNext and its project coordinators shall not be liable for indirect,
                    incidental, special, or consequential damages resulting from or relating to this
                    Privacy Policy, website access, or data processing.
                  </li>
                  <li>
                    The regional infrastructure models, calculators, and architectural diagrams
                    displayed on the website represent conceptual and planning specifications. They
                    do not constitute binding engineering warranties or guarantees of live
                    production measurements.
                  </li>
                  <li>
                    GreenNext shall not be liable for interruptions or failures resulting from
                    events outside its reasonable control, including carrier outages, cloud
                    infrastructure disruptions, cyber-attacks, or statutory interventions.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 14 */}
            <section id="updates" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">14.</span>
                <span>Changes to this Privacy Policy</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-3">
                <p>
                  We may revise this Privacy Policy periodically to reflect technological updates,
                  expanded infrastructure initiatives, or statutory regulatory guidance under the
                  DPDP Act. When revisions occur, we will update the “Last Updated” date at the top
                  of this page. We encourage visitors to review this policy periodically to stay
                  informed about how we protect personal information.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section id="contact" className="scroll-mt-28 flex flex-col gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-[#10B981] font-mono text-base">15.</span>
                <span>Privacy Contact & Grievance Redressal</span>
              </h2>
              <div className="text-sm text-[#94A3B8] leading-relaxed space-y-4">
                <p>
                  For any questions regarding this Privacy Policy, our data processing practices, or
                  to lodge a grievance or privacy rights request, please contact our team directly:
                </p>
                <div className="p-6 rounded-xl bg-[#0D131F] border border-[#10B981]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono uppercase text-[#10B981]">
                      Primary Privacy & Reporting Recipient
                    </span>
                    <h3 className="text-lg font-bold text-white">GreenNext Privacy Team</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Initiative Point of Contact for Data Protection & Inquiry Verification
                    </p>
                    <a
                      href={`mailto:${verifiedEmail}`}
                      className="inline-flex items-center gap-1.5 font-mono text-sm text-[#10B981] hover:underline pt-1"
                    >
                      <Mail size={14} />
                      <span>{verifiedEmail}</span>
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <a
                      href={`mailto:${verifiedEmail}?subject=GreenNext%20Privacy%20Policy%20Inquiry`}
                      className="px-4 py-2.5 rounded-lg bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121824] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#10B981]/20"
                      style={{ color: "#FFFFFF" }}
                    >
                      <Mail size={13} />
                      <span>Send Privacy Inquiry</span>
                    </a>
                    <Link
                      to="/contact"
                      className="px-4 py-2.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Contact Page</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#0B0F17] border border-[#1E293B] text-xs text-[#64748B] leading-relaxed">
                  <strong className="text-[#94A3B8] block mb-1">
                    Administrative Transparency Note:
                  </strong>
                  The privacy contact address listed above (
                  <span className="font-mono text-[#94A3B8]">{verifiedEmail}</span>) matches the
                  verified recipient mailbox configured in GreenNext’s active Google Apps Script
                  automated reporting and inquiry notification pipeline.
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
