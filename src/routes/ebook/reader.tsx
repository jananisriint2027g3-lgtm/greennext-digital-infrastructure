import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  LogOut,
} from "lucide-react";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  getEbookSession,
  isEbookDevPreview,
  logoutEbook,
  type EbookSessionState,
} from "../../lib/ebook-session.server-fn";

export const Route = createFileRoute("/ebook/reader")({
  head: () => ({
    meta: [
      { title: "GreenNext Ebook | Intelligent Infrastructure for a Sustainable Digital Future" },
      {
        name: "description",
        content:
          "The complete GreenNext Edition 2.0 publication with protected source pages and study-oriented chapter companions.",
      },
    ],
  }),
  loader: async () => await getEbookSession(),
  component: EbookReaderPage,
});

interface ChapterDefinition {
  num: number;
  id: string;
  title: string;
  sourcePages: [number, number];
  readTimeMinutes: number;
  summary: string;
  learningObjectives: string[];
  keyConcepts: Array<{ title: string; desc: string }>;
  terminology: Array<{ term: string; definition: string }>;
  practicalRelevance: string;
  knowledgeCheck: string[];
}

const CHAPTERS: ChapterDefinition[] = [
  {
    num: 1,
    id: "why-ai-changes-infrastructure",
    title: "Why AI Changes Infrastructure",
    sourcePages: [5, 6],
    readTimeMinutes: 6,
    summary: "AI changes the physical assumptions behind data-center design: dense accelerators, sustained loads, abrupt power changes, and tightly coupled cluster reliability require compute, power, cooling, and telemetry to be designed as one system.",
    learningObjectives: ["Explain the four infrastructure shifts caused by AI workloads.", "Relate granular visibility to reserve capacity and reliability decisions.", "Describe the compute-power-cooling-telemetry feedback loop."],
    keyConcepts: [
      { title: "Compute density", desc: "Accelerator clusters concentrate silicon, heat, and electrical demand into tightly coupled chassis and racks." },
      { title: "Sustained and step-change loads", desc: "Training can hold multi-megawatt demand while inference can create abrupt power swings." },
      { title: "Visibility before efficiency", desc: "Feed, rack, and branch measurements expose imbalance, distortion, and stranded capacity that aggregate meters hide." },
    ],
    terminology: [
      { term: "di/dt", definition: "The rate of change of current; fast power swings can stress electrical equipment." },
      { term: "Stranded capacity", definition: "Provisioned electrical or cooling capacity that cannot be used because of constraints elsewhere." },
    ],
    practicalRelevance: "Use the chapter’s visibility-first framing when sizing electrical, cooling, and monitoring systems for AI workloads; the source’s figures are reference scenarios, not site measurements.",
    knowledgeCheck: ["Why does AI require rack-level rather than room-level design?", "How can granular measurements reduce conservative reserve capacity?", "Why does a failed node become a cluster-level reliability concern?"],
  },
  {
    num: 2,
    id: "seven-layer-operational-stack",
    title: "The Seven-Layer Operational Stack",
    sourcePages: [7, 8],
    readTimeMinutes: 7,
    summary: "The source defines seven connected layers—from users and AI applications through network, compute, storage, energy, cooling, and monitoring—with workload demand flowing down and operational signals flowing up.",
    learningObjectives: ["Identify all seven layers and their roles.", "Explain why cross-layer seams create efficiency and reliability leaks.", "Select measurements appropriate to each layer."],
    keyConcepts: [
      { title: "Two-way flow", desc: "Workload demand informs infrastructure sizing; telemetry informs workload placement, pacing, and automation." },
      { title: "Layer coupling", desc: "A compute decision also becomes a power and cooling decision because the outputs of one layer constrain others." },
      { title: "Seam visibility", desc: "Schedulers, meters, and alarms need context from adjacent layers to avoid blind spots and false actions." },
    ],
    terminology: [
      { term: "Telemetry", definition: "Continuous measurements streamed from equipment for monitoring and analysis." },
      { term: "Operational stack", definition: "The source’s seven-layer model connecting application demand to physical infrastructure and operational control." },
    ],
    practicalRelevance: "Use the layer-and-seam model to organize requirements, ownership, and measurement plans before selecting infrastructure tooling.",
    knowledgeCheck: ["Name the seven layers in order.", "What information should move upward from the compute layer?", "Give one example of a seam where missing context can cause waste or risk."],
  },
  {
    num: 3,
    id: "what-ai-ready-means",
    title: "What ‘AI-Ready’ Really Means",
    sourcePages: [9, 10],
    readTimeMinutes: 7,
    summary: "AI-ready is presented as a tested physical property: a facility must deliver power, remove heat, carry data, remain observable and safe, and prove the design through commissioning.",
    learningObjectives: ["Describe the five pillars of AI-ready infrastructure.", "Distinguish evidence from an unsupported AI-ready label.", "Explain why commissioning and testing belong in the definition."],
    keyConcepts: [
      { title: "Five pillars", desc: "Power path, thermal design, network and cabling, safety and protection, and commissioning form the source’s practical definition." },
      { title: "Evidence-based readiness", desc: "Single-line diagrams, thermal models, topology evidence, protection designs, and test results support a claim." },
      { title: "Context-calibrated cooling", desc: "Cooling choices depend on density, climate, water availability, and operating model rather than one universal design." },
    ],
    terminology: [
      { term: "BMC", definition: "Baseboard management controller; an embedded server controller reporting temperatures, fan speeds, and health." },
      { term: "Direct-to-chip cooling", definition: "Liquid loops that carry heat directly away from processors and accelerators." },
    ],
    practicalRelevance: "Use the five questions in the source as a due-diligence checklist for vendor claims, rack density, measurement points, cooling response, failure behavior, and assumptions.",
    knowledgeCheck: ["What evidence would support a claim about validated rack density?", "Why can hybrid air-liquid cooling be appropriate?", "Why is commissioning part of AI readiness rather than a postscript?"],
  },
  {
    num: 4,
    id: "energy-closed-loop",
    title: "Energy: The Closed Loop",
    sourcePages: [11, 13],
    readTimeMinutes: 9,
    summary: "The closed loop links compute demand, power delivery, thermal extraction, and resource efficiency. The chapter uses PUE arithmetic, cooling calibration, workload-aware scheduling, and an illustrative daily pattern to show how telemetry becomes action.",
    learningObjectives: ["Explain the four stages of the closed energy loop.", "Calculate facility power from IT load and PUE using the source’s example.", "Relate thermal headroom and workload scheduling to efficiency."],
    keyConcepts: [
      { title: "PUE arithmetic", desc: "Power Usage Effectiveness is total facility energy divided by IT equipment energy; the source illustrates 4 MW IT load at PUE 1.4, 1.5, and 1.6." },
      { title: "Cooling calibration", desc: "Move setpoints in small monitored steps, watching the hottest components and measured thermal margin." },
      { title: "Workload-aware resource management", desc: "Schedulers can pace, place, or defer work against electrical and thermal headroom." },
    ],
    terminology: [
      { term: "PUE", definition: "Power Usage Effectiveness: total facility energy divided by IT equipment energy." },
      { term: "IT load", definition: "Electrical power consumed by IT equipment alone, excluding cooling and other facility overhead." },
    ],
    practicalRelevance: "Apply the chapter as a measurement and operating loop: estimate demand from workload plans, find idle or over-provisioned resources, and compare equivalent periods and sites.",
    knowledgeCheck: ["For a 4 MW IT load at PUE 1.5, what is total facility power?", "Why should cooling setpoints change in small steps?", "How can a scheduler use facility headroom?"],
  },
  {
    num: 5,
    id: "intelligent-automation",
    title: "Intelligent Automation",
    sourcePages: [14, 15],
    readTimeMinutes: 8,
    summary: "Automation is bounded, auditable, and closed-loop. The source’s six stages are Monitor, Detect, Analyze, Decide, Automate, and Report, supported by a staged path from observation to bounded autonomy.",
    learningObjectives: ["Explain the six-stage operational sequence.", "Compare static thresholds with context-aware detection.", "Apply the bounded, observable, and reversible guardrails."],
    keyConcepts: [
      { title: "Context-aware detection", desc: "Signals are interpreted with workload, weather, maintenance, and neighboring-system context rather than isolated thresholds." },
      { title: "Staircase of autonomy", desc: "The source moves from Observe to Advise, Assist, and finally Bounded autonomy as evidence and trust grow." },
      { title: "Three guardrails", desc: "Every automated action should be bounded by hard limits, observable through logging, and quickly reversible." },
    ],
    terminology: [
      { term: "Bounded autonomy", definition: "Automation that acts independently only inside pre-approved limits and records what it did." },
      { term: "False positive", definition: "An alert raised for a normal condition, such as a legitimate workload burst." },
    ],
    practicalRelevance: "Use the staged autonomy model to introduce automation without handing facility control to an opaque system or skipping human accountability.",
    knowledgeCheck: ["What context can help distinguish a normal burst from degradation?", "What differentiates Assist from Bounded autonomy?", "Why must every automated action be reversible?"],
  },
  {
    num: 6,
    id: "enterprise-use-cases",
    title: "Six Enterprise Use Cases",
    sourcePages: [16, 18],
    readTimeMinutes: 8,
    summary: "Six scenarios show how the closed-loop model connects signals to decisions: energy monitoring, infrastructure health, AI workload management, cooling optimization, capacity planning, and anomaly detection.",
    learningObjectives: ["Summarize the problem, signals, desired outcome, and metrics for each use case.", "Recognize the common thread across the six scenarios.", "Distinguish measurable outcomes from unsupported claims."],
    keyConcepts: [
      { title: "Energy monitoring", desc: "Connect feed, PDU, rack, branch, phase, harmonic, and voltage data to capacity decisions." },
      { title: "Health and workload management", desc: "Use component health and scheduler profiles to drain degrading nodes and respect facility limits." },
      { title: "Cooling, capacity, and anomaly detection", desc: "Calibrate cooling, plan utility and hardware limits, and detect multi-variable drift earlier." },
    ],
    terminology: [
      { term: "Headroom", definition: "Available electrical or thermal capacity before an operating limit is reached." },
      { term: "Anomaly detection", definition: "Identifying departures from expected behavior, including gradual multi-variable drift." },
    ],
    practicalRelevance: "Use the source’s problem/signals/outcome/metrics pattern to turn an infrastructure concern into a measurable operational case.",
    knowledgeCheck: ["What signals support cooling optimization?", "Which metrics show whether infrastructure health monitoring is working?", "What common thread connects all six use cases?"],
  },
  {
    num: 7,
    id: "regional-model",
    title: "A Distributed Regional Model for South India",
    sourcePages: [19, 22],
    readTimeMinutes: 10,
    summary: "The source frames seven South Indian planning nodes as a conceptual regional model for proximity, resilience, logistics, and demand distribution. It includes a Madurai planning snapshot and a reusable site-evaluation scorecard.",
    learningObjectives: ["Identify the seven planning nodes and their stated geographic context.", "Explain the opportunities and limits of a distributed regional model.", "Use the source scorecard to structure site evaluation without treating planning figures as confirmed facts."],
    keyConcepts: [
      { title: "Planning nodes", desc: "Mangalore, Hosur, Coimbatore, Trichy, Madurai, Tirunelveli, and Puducherry are presented as places to evaluate, not operating facilities." },
      { title: "Madurai case", desc: "The southern anchor example separates source-reported values from items that remain to be confirmed or unavailable." },
      { title: "Reusable scorecard", desc: "Power, water, connectivity, logistics, climate, and ecosystem are evaluated with evidence requirements." },
    ],
    terminology: [
      { term: "Source-reported", definition: "A figure attributed to a source but not thereby confirmed as secured capacity or measured performance." },
      { term: "MLD", definition: "Million litres per day, a common way to express water supply." },
    ],
    practicalRelevance: "Use the scorecard for early diligence while preserving the source’s factual discipline: conceptual maps and planning references require independent verification.",
    knowledgeCheck: ["What are the seven planning nodes?", "Which Madurai attributes remain to be confirmed or unavailable?", "What evidence should support a regional power claim?"],
  },
  {
    num: 8,
    id: "sustainability-without-spin",
    title: "Sustainability Without the Spin",
    sourcePages: [23, 24],
    readTimeMinutes: 6,
    summary: "The chapter takes a measurement-first stance: meter what can be measured, calibrate what can be tuned, and avoid claims that cannot be shown. It sets out six working principles and a measure-versus-claim discipline.",
    learningObjectives: ["State the six working principles for sustainable digital growth.", "Separate defensible measurements from claims requiring verification.", "Explain why traceability matters for sustainability credibility."],
    keyConcepts: [
      { title: "Measure before claiming", desc: "Power, cooling, water, and setpoint outcomes should be tied to metering, calibration, and an appropriate baseline." },
      { title: "Resource optimization", desc: "Idle compute, over-provisioned cooling, and under-used interfaces are planning opportunities, not automatic savings claims." },
      { title: "Factual discipline", desc: "The source deliberately avoids speculative carbon-offset figures and unverified environmental benefits." },
    ],
    terminology: [
      { term: "Baseline", definition: "The measured reference condition against which an improvement is evaluated." },
      { term: "Carbon-offset claim", definition: "An environmental assertion that requires traceable measurement and method before it is defensible." },
    ],
    practicalRelevance: "Use the measure/avoid-claim table when preparing ESG or operational reporting; it keeps improvements auditable and prevents marketing language from outrunning evidence.",
    knowledgeCheck: ["Which sustainability measures does the source treat as defensible with metering?", "Why are percentage savings claims insufficient without a baseline?", "What is the source’s narrow stance on environmental claims?"],
  },
  {
    num: 9,
    id: "greennext-methodology",
    title: "The GreenNext Methodology",
    sourcePages: [25, 26],
    readTimeMinutes: 7,
    summary: "Understand, Intelligence, Optimize form a continuous operational cycle. The source adds an illustrative 90-day path that establishes a baseline, closes visibility gaps, and makes a measured improvement.",
    learningObjectives: ["Describe the three stages and their outputs.", "Relate the 90-day example to baseline, telemetry, and improvement work.", "Match the methodology to different infrastructure audiences."],
    keyConcepts: [
      { title: "Understand", desc: "Map infrastructure, workload, energy, cooling, regional context, constraints, and patterns." },
      { title: "Intelligence", desc: "Apply telemetry, analytics, and AI-driven analysis where suitable across the stack." },
      { title: "Optimize", desc: "Tune cooling, balance load, and plan capacity using measured operational insight." },
    ],
    terminology: [
      { term: "Closed cycle", definition: "A repeatable sequence that revisits infrastructure decisions as workloads, hardware, and weather change." },
      { term: "Advise mode", definition: "An operating mode where analytics recommend actions while people retain the decision." },
    ],
    practicalRelevance: "Use the 30/60/90-day framing to sequence measurement and improvement work without presenting the illustrative framework as a commitment or service level.",
    knowledgeCheck: ["What outputs should exist after the Understand stage?", "What is the purpose of Intelligence in the cycle?", "What makes the 90-day path illustrative rather than a guarantee?"],
  },
  {
    num: 10,
    id: "planning-checklist-faq",
    title: "Your Planning Checklist and FAQ",
    sourcePages: [27, 28],
    readTimeMinutes: 8,
    summary: "The final chapter turns the publication into a technical conversation guide, covering workload, power, cooling, operations, automation, region, resilience, and frequently asked questions about GreenNext’s planning model.",
    learningObjectives: ["Use the checklist to structure an initial technical conversation.", "Answer the source’s core questions about AI-ready infrastructure and regional planning.", "Identify which claims require verified site data."],
    keyConcepts: [
      { title: "Question-led planning", desc: "The checklist asks what is measured, what is expected to grow, what can bind, and which assumptions remain unverified." },
      { title: "Conceptual boundary", desc: "GreenNext is described as a planning and reference initiative, not an operating data-center provider." },
      { title: "Visibility as the starting point", desc: "The source recommends power and thermal visibility detailed enough to challenge reserves and setpoints." },
    ],
    terminology: [
      { term: "Residency", definition: "The geographic or jurisdictional requirement governing where workloads or data may be hosted." },
      { term: "Commissioning", definition: "Testing that proves a design works before relying on it for demanding workloads." },
    ],
    practicalRelevance: "Use the checklist as a revision tool or meeting agenda, keeping the source’s distinction between conceptual capability and verified operating evidence.",
    knowledgeCheck: ["Which questions test whether power and cooling claims are measured?", "How does the source answer ‘Is GreenNext an operating data center provider?’", "Where does the source recommend teams start?"],
  },
];

function StudyList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-[#CBD5E1] leading-relaxed">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function EbookReaderPage() {
  const session = Route.useLoaderData() as EbookSessionState;
  const navigate = useNavigate();
  const [activeChapterNum, setActiveChapterNum] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastActivityPingAt = useRef(0);
  const isDevPreview = Boolean(session?.isDevPreview || isEbookDevPreview());
  const currentChapter = CHAPTERS.find((chapter) => chapter.num === activeChapterNum) || CHAPTERS[0];

  useEffect(() => {
    if (session?.sessionExpired) {
      window.location.assign("/ebook/auth?reason=session_expired");
      return;
    }
    if (isDevPreview || !session?.authenticated) return;

    const reportActivity = () => {
      const now = Date.now();
      if (now - lastActivityPingAt.current < 5 * 60 * 1000) return;
      lastActivityPingAt.current = now;
      void fetch("/api/ebook/session", {
        method: "GET",
        headers: { Accept: "application/json", "X-Ebook-Activity": "reader" },
        credentials: "include",
        cache: "no-store",
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok && data?.sessionExpired) window.location.assign("/ebook/auth?reason=session_expired");
      }).catch(() => undefined);
    };

    window.addEventListener("pointerdown", reportActivity, { passive: true });
    window.addEventListener("keydown", reportActivity);
    window.addEventListener("wheel", reportActivity, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", reportActivity);
      window.removeEventListener("keydown", reportActivity);
      window.removeEventListener("wheel", reportActivity);
    };
  }, [isDevPreview, session?.authenticated, session?.sessionExpired]);

  const selectChapter = (num: number) => {
    setActiveChapterNum(num);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutEbook();
      navigate({ to: "/ebook" });
    } finally {
      setLoggingOut(false);
    }
  };

  if (!isDevPreview && (!session?.authenticated || !session?.user)) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center px-4">
        <div className="max-w-md w-full border border-[#1E293B] bg-[#0A0F1D] rounded-2xl p-8 text-center space-y-6">
          <Lock className="w-8 h-8 text-[#10B981] mx-auto" />
          <h1 className="text-2xl font-extrabold text-white">Authentication Required</h1>
          <p className="text-sm text-[#94A3B8]">Sign in to access the complete protected publication and study companion.</p>
          <Link to="/ebook/auth" className="inline-flex w-full justify-center py-3 rounded-xl bg-[#10B981] text-[#070A0E] font-bold">Sign In or Register</Link>
        </div>
      </div>
    );
  }

  if (!isDevPreview && !session?.emailVerified) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center px-4">
        <div className="max-w-md w-full border border-[#1E293B] bg-[#0A0F1D] rounded-2xl p-8 text-center space-y-6">
          <Lock className="w-8 h-8 text-[#F59E0B] mx-auto" />
          <h1 className="text-2xl font-extrabold text-white">Email Verification Required</h1>
          <p className="text-sm text-[#94A3B8]">Complete the email OTP verification before reading the protected publication.</p>
          <Link to="/ebook/verify-otp" className="inline-flex w-full justify-center py-3 rounded-xl bg-[#10B981] text-[#070A0E] font-bold">Enter Verification Code</Link>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((activeChapterNum / CHAPTERS.length) * 100);
  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex flex-col">
      <header className="border-b border-[#1E293B] bg-[#0A0F1D]/95 backdrop-blur px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen((open) => !open)} className="lg:hidden p-2 rounded-lg bg-[#1E293B] text-white" aria-label="Toggle table of contents"><BookOpen className="w-4 h-4" /></button>
          <BookOpen className="w-6 h-6 text-[#10B981]" />
          <div>
            <div className="text-sm font-bold text-white">Intelligent Infrastructure for a Sustainable Digital Future</div>
            <div className="text-[11px] text-[#64748B]">Edition 2.0 · {isDevPreview ? "Local study preview" : `Verified Reader: ${session?.user?.displayName || session?.user?.email || "Reader"}`}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/ebook/download" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-[#070A0E]"><Download className="w-3.5 h-3.5" />Download Ebook (PDF)</a>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] text-[#CBD5E1] disabled:opacity-50"><LogOut className="w-3.5 h-3.5" />Sign Out</button>
        </div>
      </header>

      <div className="w-full bg-[#0A0F1D] h-1.5 border-b border-[#1E293B] sticky top-[61px] z-30"><div className="bg-gradient-to-r from-[#10B981] to-[#38BDF8] h-full" style={{ width: `${progressPercentage}%` }} /></div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className={`fixed inset-y-0 left-0 z-50 lg:static w-80 bg-[#0A0F1D] border-r border-[#1E293B] p-4 space-y-6 overflow-y-auto transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between"><div className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Contents · {activeChapterNum}/{CHAPTERS.length}</div><button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-xs text-[#94A3B8]">Close</button></div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-xs"><div className="flex justify-between text-[#94A3B8] mb-1 font-mono text-[11px]"><span>Reading Progress</span><span>{progressPercentage}%</span></div><div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden"><div className="bg-[#10B981] h-full" style={{ width: `${progressPercentage}%` }} /></div></div>
          <div className="space-y-1">{CHAPTERS.map((chapter) => <button key={chapter.num} type="button" onClick={() => selectChapter(chapter.num)} className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-3 ${chapter.num === activeChapterNum ? "bg-[#10B981]/15 text-white font-semibold border border-[#10B981]/40" : "text-[#94A3B8] hover:bg-[#1E293B]/60 border border-transparent"}`}><span className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold ${chapter.num === activeChapterNum ? "bg-[#10B981] text-[#070A0E]" : "bg-[#1E293B] text-[#94A3B8]"}`}>{String(chapter.num).padStart(2, "0")}</span><span className="flex-1 leading-snug"><span className="block">{chapter.title}</span><span className="block text-[10px] text-[#64748B] font-mono mt-1">{chapter.readTimeMinutes} min · PDF pp. {chapter.sourcePages[0]}–{chapter.sourcePages[1]}</span></span></button>)}</div>
          <div className="pt-4 border-t border-[#1E293B] text-center text-xs text-[#64748B]">Canonical publication · Edition 2.0</div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1 bg-[#050811] px-4 py-8 sm:px-8 sm:py-12 lg:px-14 max-w-7xl mx-auto w-full space-y-12">
          <section className="border-b border-[#1E293B] pb-10" aria-labelledby="publication-masthead">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#10B981]"><span className="h-px w-8 bg-[#10B981]" /> Protected reader · Edition 2.0</div>
                <div className="space-y-3">
                  <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">Intelligent Infrastructure for a Sustainable Digital Future</p>
                  <p id="publication-masthead" className="max-w-2xl text-sm leading-relaxed text-[#94A3B8] sm:text-base">A practical publication on AI-ready, energy-aware infrastructure planning across South India. Read the canonical pages alongside a focused study companion for each chapter.</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-l border-[#1E293B] pl-5 text-xs text-[#94A3B8]">
                <div><dt className="font-mono uppercase tracking-wider text-[#64748B]">Chapters</dt><dd className="mt-1 text-lg font-semibold text-white">10</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[#64748B]">Pages</dt><dd className="mt-1 text-lg font-semibold text-white">30</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[#64748B]">Edition</dt><dd className="mt-1 text-lg font-semibold text-white">2.0</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[#64748B]">Access</dt><dd className="mt-1 text-lg font-semibold text-[#10B981]">Verified</dd></div>
              </dl>
            </div>
          </section>

          <header className="space-y-4 border-b border-[#1E293B] pb-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-xs font-bold uppercase tracking-widest text-[#10B981]">Chapter {String(currentChapter.num).padStart(2, "0")} of 10</span><span className="text-xs font-mono text-[#64748B]">PDF pages {currentChapter.sourcePages[0]}–{currentChapter.sourcePages[1]}</span></div><h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{currentChapter.title}</h1><p className="max-w-4xl border-l-2 border-[#10B981] pl-4 text-base leading-relaxed text-[#CBD5E1]"><span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-[#10B981]">Chapter brief</span>{currentChapter.summary}</p></header>

          <section className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Canonical publication pages</h2><p className="text-xs text-[#94A3B8] mt-1">The complete PDF remains the source of truth, including its original tables, diagrams, captions, glossary, and next steps.</p></div><FileText className="w-5 h-5 text-[#10B981]" /></div><div className="rounded-xl overflow-hidden border border-[#334155] bg-white"><iframe key={currentChapter.id} title={`${currentChapter.title} source pages`} src={`/api/ebook/stream#page=${currentChapter.sourcePages[0]}`} className="w-full h-[720px]" /></div><p className="text-xs text-[#64748B]">Source range: pages {currentChapter.sourcePages[0]}–{currentChapter.sourcePages[1]}. Use the PDF viewer to read the complete protected publication; pages 29–30 contain the glossary and next steps.</p></section>

          <section className="space-y-4 border-t border-[#1E293B] pt-8"><div><span className="text-[11px] font-mono uppercase tracking-widest text-[#38BDF8]">Supplementary study companion</span><h2 className="text-xl font-bold text-white mt-1">Study this chapter</h2><p className="text-xs text-[#94A3B8] mt-1">The sections below are study aids derived from the canonical source and are not additional publication claims.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-3">Learning objectives</h3><StudyList items={currentChapter.learningObjectives} /></div><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-3">Practical relevance</h3><p className="text-sm text-[#CBD5E1] leading-relaxed">{currentChapter.practicalRelevance}</p></div></div></section>

          <section className="grid gap-6 md:grid-cols-2"><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-4">Key concepts</h3><div className="space-y-4">{currentChapter.keyConcepts.map((concept) => <div key={concept.title}><div className="flex items-center gap-2 text-[#10B981] text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />{concept.title}</div><p className="text-xs text-[#94A3B8] leading-relaxed mt-1 ml-6">{concept.desc}</p></div>)}</div></div><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-4">Important terminology</h3><dl className="space-y-4">{currentChapter.terminology.map((item) => <div key={item.term}><dt className="text-xs font-bold text-[#38BDF8]">{item.term}</dt><dd className="text-xs text-[#94A3B8] leading-relaxed mt-1">{item.definition}</dd></div>)}</dl></div></section>

          <section className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B] space-y-4"><h3 className="text-sm font-bold text-white">Knowledge check</h3><StudyList items={currentChapter.knowledgeCheck} /></section>

          <div className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4"><button type="button" onClick={() => selectChapter(activeChapterNum - 1)} disabled={activeChapterNum <= 1} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border border-[#334155] bg-[#0A0F1D] text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" />Previous Chapter</button><div className="flex items-center gap-1.5">{CHAPTERS.map((chapter) => <button key={chapter.num} type="button" onClick={() => selectChapter(chapter.num)} title={chapter.title} aria-label={`Go to chapter ${chapter.num}`} className={`w-3 h-3 rounded-full ${chapter.num === activeChapterNum ? "bg-[#10B981] scale-125" : "bg-[#1E293B] hover:bg-[#334155]"}`} />)}</div><button type="button" onClick={() => selectChapter(activeChapterNum + 1)} disabled={activeChapterNum >= CHAPTERS.length} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#10B981] text-[#070A0E] disabled:opacity-30">Next Chapter<ChevronRight className="w-4 h-4" /></button></div>
        </main>
      </div>
    </div>
  );
}
