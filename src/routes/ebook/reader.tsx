import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Lock,
  LogOut,
  Moon,
  Search,
  Sun,
  X,
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
  readingSections: Array<{ heading: string; body: string }>;
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
    readingSections: [
      { heading: "The physical shift", body: "The source links AI infrastructure change to four connected pressures: higher compute density, sustained accelerator demand, abrupt power changes, and tighter coupling between cluster nodes. These pressures make a rack, its power path, its cooling path, and its telemetry part of one design decision." },
      { heading: "Why visibility changes the decision", body: "Room-level totals can hide branch imbalance, harmonic distortion, thermal hotspots, and capacity stranded behind a local constraint. Feed, rack, and branch measurements make reserve-capacity and reliability decisions more specific without treating the source’s illustrative scenarios as site measurements." },
      { heading: "Reliability is a system property", body: "A failed or throttled node can affect a distributed workload, so infrastructure planning must connect electrical behavior, heat removal, workload placement, and operational signals. The chapter’s central lesson is to establish visibility before promising efficiency." },
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
    readingSections: [
      { heading: "Seven layers, one operating system", body: "The stack runs from users and AI applications through network/connectivity, compute, storage/data, energy management, cooling, and monitoring/automation. It is not a list of isolated products: workload demand travels downward while operational signals travel upward." },
      { heading: "The seams matter", body: "A scheduler that cannot see thermal headroom, or a facilities system that cannot see workload intent, can make locally reasonable decisions that create system-wide waste or risk. The source therefore treats cross-layer context as an operational requirement." },
      { heading: "Organizing evidence", body: "For each layer, identify its owner, inputs, outputs, limits, and measurements. This turns the model into a practical requirements map and exposes where an alert or automation rule lacks the context supplied by an adjacent layer." },
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
    readingSections: [
      { heading: "Readiness is demonstrated", body: "The source defines AI-ready infrastructure through five pillars: a credible power path, thermal design, network and cabling, safety and protection, and commissioning. The label is meaningful only when drawings, models, topology evidence, protection design, and test results support it." },
      { heading: "Cooling follows context", body: "Air, direct-to-chip liquid, rear-door heat exchangers, and hybrid approaches each depend on density, climate, water availability, maintenance practice, and the operating model. The publication does not present one universal cooling answer." },
      { heading: "The due-diligence questions", body: "Ask what rack density has actually been validated, where power and thermal data are measured, how cooling responds to changing load, what happens during failures, and which assumptions remain unverified. Commissioning closes the gap between a design claim and demonstrated behavior." },
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
    readingSections: [
      { heading: "Compute, power, cooling, efficiency", body: "The closed loop begins with workload demand and follows it through electrical delivery, heat extraction, and resource efficiency. Each stage feeds the next: compute changes power, power becomes heat, cooling consumes resources, and telemetry reveals where the loop can be tuned." },
      { heading: "Use PUE as arithmetic, not a slogan", body: "The source illustrates a 4 MW IT load at PUE 1.4, 1.5, and 1.6. At PUE 1.5, total facility power is 6 MW. The comparison is useful only when the boundary, time period, and measurement basis remain consistent." },
      { heading: "Small, observed interventions", body: "Cooling setpoints should move in monitored steps while the hottest components and thermal margin are watched. Workload-aware scheduling can place, pace, or defer work against available electrical and thermal headroom rather than treating all compute demand as interchangeable." },
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
    readingSections: [
      { heading: "From signal to action", body: "The source describes six stages: Monitor, Detect, Analyze, Decide, Automate, and Report. The sequence separates observing a condition from deciding what it means and from taking an action, which makes the operating trail reviewable." },
      { heading: "Context beats isolated thresholds", body: "A power spike during a planned workload burst is different from a similar spike accompanied by thermal drift or equipment degradation. Workload, weather, maintenance, and neighboring-system context help reduce false positives and missed conditions." },
      { heading: "Earn autonomy gradually", body: "The staircase moves from Observe to Advise, Assist, and Bounded autonomy. Bounded actions must stay inside hard limits, remain observable through logs and telemetry, and be reversible when the evidence or operating state changes." },
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
    readingSections: [
      { heading: "Six operational lenses", body: "The publication applies the closed-loop idea to six use cases: data-center energy monitoring, infrastructure health monitoring, AI workload management, cooling optimization, capacity planning, and anomaly detection." },
      { heading: "A common case structure", body: "Each use case is framed through the problem, the signals needed, what a good outcome looks like, and the metrics that can test it. That structure prevents a tool or dashboard from being mistaken for an operational result." },
      { heading: "Examples of evidence", body: "Energy monitoring can combine feed, PDU, rack, branch, phase, harmonic, and voltage data. Health monitoring can support node draining, while workload and cooling cases connect scheduler profiles and thermal signals to headroom. Capacity and anomaly cases look for constraints and gradual multi-variable drift." },
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
    readingSections: [
      { heading: "A planning network, not a claim of operation", body: "The source names Mangalore, Hosur, Coimbatore, Trichy, Madurai, Tirunelveli, and Puducherry as conceptual planning nodes. The regional model is about proximity, resilience, logistics, and demand distribution; it does not assert that GreenNext operates facilities at these locations." },
      { heading: "The Madurai snapshot", body: "The Madurai example deliberately separates source-reported attributes from items to be confirmed and information that is unavailable. That separation is part of the method: a planning reference should not be rewritten as secured capacity, measured performance, or a customer claim." },
      { heading: "A reusable site scorecard", body: "Evaluate power, water, connectivity, logistics, climate, and ecosystem with explicit evidence requirements. The scorecard makes regional comparison repeatable while keeping conceptual maps and planning figures subject to independent verification." },
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
    readingSections: [
      { heading: "Measure before claiming", body: "The chapter’s six principles favor direct measurement, efficient resource use, credible renewable-energy accounting, regional resilience, transparent reporting, and continuous improvement. The unifying rule is to connect an assertion to a boundary, baseline, method, and traceable evidence." },
      { heading: "What the evidence can support", body: "Metered power, cooling, water, and setpoint outcomes can support operational discussion when the baseline and comparison are clear. Idle compute, over-provisioned cooling, and under-used interfaces are opportunities to investigate—not automatic savings claims." },
      { heading: "Avoiding spin", body: "The publication intentionally avoids speculative carbon-offset figures and unverified environmental benefits. This restraint is a practical quality control: sustainability language should remain no stronger than the underlying measurements." },
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
    readingSections: [
      { heading: "Understand", body: "Begin by mapping infrastructure, workload, energy, cooling, regional context, constraints, and recurring patterns. The output is a shared baseline that makes later recommendations testable rather than impressionistic." },
      { heading: "Intelligence and Optimize", body: "Intelligence adds telemetry, analytics, and suitable AI-driven analysis across the stack. Optimize then uses that insight to tune cooling, balance load, and plan capacity. The cycle repeats as workloads, hardware, and weather change." },
      { heading: "A measured 90-day path", body: "The source’s 30/60/90-day sequence is illustrative: establish a baseline, close visibility gaps, and make a measured improvement. It is a way to sequence work, not a service-level promise or a guaranteed outcome." },
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
    readingSections: [
      { heading: "Turn the publication into questions", body: "The final chapter organizes a planning conversation around workload, power, cooling, operations, automation, region, and resilience. It asks what is measured, what is expected to grow, what can bind, and which assumptions still need evidence." },
      { heading: "Read the boundary statements carefully", body: "The FAQ distinguishes AI-ready infrastructure from a label, describes the distributed model as conceptual, and positions GreenNext as a planning and reference initiative rather than an operating data-center provider. It also rejects unsupported carbon-offset claims." },
      { heading: "Start with visibility", body: "The practical starting point is enough power and thermal visibility to challenge reserve assumptions and setpoints. From there, teams can decide which deeper analysis, automation, or regional diligence is justified by evidence." },
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

const SEVEN_LAYERS = [
  ["Users / AI applications", "Defines workload intent and service requirements.", "Demand profile, latency, residency"],
  ["Network / connectivity", "Carries data between users, storage, and compute.", "Throughput, latency, topology"],
  ["Compute", "Executes training, inference, and other workloads.", "Utilization, health, accelerator demand"],
  ["Storage / data", "Feeds workloads and preserves the data they produce.", "Capacity, I/O, protection"],
  ["Energy management", "Delivers and measures the power that enables compute.", "Feed, branch, phase, headroom"],
  ["Cooling", "Removes heat and maintains thermal operating margin.", "Temperature, flow, setpoints"],
  ["Monitoring / automation", "Connects telemetry to detection, decision, and reporting.", "Alarms, context, audit trail"],
] as const;

const AI_READY_PILLARS = [
  ["Power path", "A documented, protected, testable route from supply to rack."],
  ["Thermal design", "Cooling matched to density, climate, water, and operating practice."],
  ["Network and cabling", "Topology and connectivity evidence for the intended workload."],
  ["Safety and protection", "Protection, failure behavior, and safe operating boundaries."],
  ["Commissioning", "Tests that demonstrate the design before relying on it."],
] as const;

const AUTOMATION_STAGES = [
  ["Monitor", "Signals", "A measured view of the system."],
  ["Detect", "Signals + baseline", "A condition worth examining."],
  ["Analyze", "Context", "A diagnosis that considers workload and neighboring systems."],
  ["Decide", "Policy + evidence", "A bounded response selected with accountability."],
  ["Automate", "Approved action", "A reversible action inside hard limits."],
  ["Report", "Outcome + audit", "A record that supports learning and review."],
] as const;

const REGIONAL_NODES = [
  ["Mangalore", "IXE", "Coastal planning context; evaluate connectivity, power, climate, and logistics."],
  ["Hosur", "HSR", "Industrial corridor planning context; validate supply, land, and network evidence."],
  ["Coimbatore", "CJB", "Regional demand and industrial ecosystem context; verify site constraints."],
  ["Trichy", "TRZ", "Central corridor planning context; compare resilience and connectivity evidence."],
  ["Madurai", "MDU", "Southern anchor example; separate source-reported, to-be-confirmed, and unavailable data."],
  ["Tirunelveli", "TNV", "Southern planning node; evaluate power, water, climate, and ecosystem evidence."],
  ["Puducherry", "PDY", "Regional planning node; assess proximity, logistics, and operating constraints."],
] as const;

const USE_CASES = [
  ["Data-center energy monitoring", "Connect feed, PDU, rack, branch, phase, harmonic, and voltage signals to capacity decisions."],
  ["Infrastructure health monitoring", "Use component health signals to identify degradation and support safe node handling."],
  ["AI workload management", "Place, pace, or defer workloads against electrical and thermal headroom."],
  ["Cooling optimization", "Tune cooling with monitored steps and watch the hottest components and thermal margin."],
  ["Capacity planning", "Compare demand, utility, hardware, and facility limits before constraints bind."],
  ["Anomaly detection", "Find gradual multi-variable drift that isolated thresholds can miss."],
] as const;

const GLOSSARY = [
  ["AI-ready", "Evidence-backed readiness across power, thermal design, network and cabling, safety and protection, and commissioning."],
  ["Baseline", "A measured reference condition used to evaluate an improvement."],
  ["Bounded autonomy", "Automation that acts independently only within pre-approved limits and records its actions."],
  ["Commissioning", "Testing that demonstrates a design works before relying on it for demanding workloads."],
  ["Headroom", "Available electrical or thermal capacity before an operating limit is reached."],
  ["PUE", "Power Usage Effectiveness: total facility energy divided by IT equipment energy."],
  ["Telemetry", "Continuous measurements streamed from equipment for monitoring and analysis."],
  ["Source-reported", "A figure attributed to a source but not thereby confirmed as secured capacity or measured performance."],
] as const;

const KNOWLEDGE_ANSWERS: Record<number, string[]> = {
  1: ["AI concentrates compute, sustained demand, power changes, and heat into a tightly coupled system.", "Granular measurements expose local imbalance and stranded capacity that aggregate meters can hide.", "Cluster workloads depend on coordinated nodes, so a local failure can affect system reliability."],
  2: ["Users/apps, network, compute, storage/data, energy management, cooling, and monitoring/automation.", "Compute health, utilization, workload intent, and capacity signals should inform higher operational layers.", "A scheduler without thermal context can place work in a way that creates a hotspot or wastes headroom."],
  3: ["Validated rack density needs design evidence, thermal models, measurements, and commissioning results.", "Cooling depends on density, climate, water, and operating practice, so hybrid designs can be appropriate.", "Commissioning demonstrates that the design behaves as intended before demanding workloads rely on it."],
  4: ["At 4 MW IT load and PUE 1.5, total facility power is 6 MW.", "Small monitored changes reveal thermal response and reduce the risk of trading efficiency for an unsafe margin.", "A scheduler can place, pace, or defer work according to measured electrical and thermal headroom."],
  5: ["Workload, weather, maintenance, and neighboring-system context help distinguish a planned burst from degradation.", "Assist recommends or supports an action; bounded autonomy can act independently inside approved limits.", "Reversibility limits the impact of a wrong decision and supports safe operational learning."],
  6: ["Cooling optimization uses thermal, flow, setpoint, workload, and environmental signals.", "Health monitoring can be assessed through detection quality, time to intervention, and safe handling of degrading nodes.", "All six connect measured signals to a decision, an outcome, and metrics rather than treating a dashboard as proof."],
  7: ["Mangalore, Hosur, Coimbatore, Trichy, Madurai, Tirunelveli, and Puducherry.", "The Madurai example separates source-reported values from items to confirm and information unavailable in the source.", "A power claim needs source, boundary, availability, and independent confirmation rather than a conceptual map alone."],
  8: ["Metered power, cooling, water, and setpoint outcomes can be discussed when the boundary and baseline are clear.", "Without a baseline, a percentage does not show what changed or how it was measured.", "The source avoids speculative carbon-offset figures and unverified environmental benefits."],
  9: ["Understand should produce a mapped, measured baseline of infrastructure, workload, energy, cooling, and constraints.", "Intelligence applies telemetry and analysis so Optimize can make measured operational changes.", "The 90-day path is an illustrative sequence, not a guaranteed service level or outcome."],
  10: ["They test measured workload, power, cooling, growth, failure, and evidence assumptions.", "GreenNext is presented as a planning and reference initiative, not an operating data-center provider.", "The source recommends starting with sufficiently granular power and thermal visibility."],
};

function InteractiveChapterExperience({ chapter }: { chapter: ChapterDefinition }) {
  const [selected, setSelected] = useState(0);
  const [itEnergy, setItEnergy] = useState(4);
  const [facilityEnergy, setFacilityEnergy] = useState(6);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const panel = (children: ReactNode) => <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1D] p-5">{children}</div>;
  const tabButtons = (items: readonly string[]) => <div className="flex flex-wrap gap-2">{items.map((item, index) => <button key={item} type="button" onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selected === index ? "border-[#10B981]/60 bg-[#10B981]/10 text-[#10B981]" : "border-[#334155] text-[#94A3B8] hover:text-white"}`}>{item}</button>)}</div>;

  if (chapter.num === 1) {
    const comparison = [
      ["Conventional infrastructure", "Lower and steadier density; room-level planning may hide local constraints; capacity is often treated as a broad reserve."],
      ["AI infrastructure", "Dense accelerators, sustained loads, abrupt power changes, tighter thermal margins, and stronger coupling between cluster nodes."],
    ];
    return panel(<><h3 className="text-sm font-semibold text-white">Explore the infrastructure shift</h3><p className="mt-1 text-xs text-[#94A3B8]">The comparison is conceptual and derived from the chapter; it is not a site assessment.</p>{tabButtons(comparison.map(([name]) => name))}<div className="mt-5 border-l-2 border-[#10B981] pl-4"><h4 className="font-semibold text-white">{comparison[selected][0]}</h4><p className="mt-2 text-sm leading-7 text-[#CBD5E1]">{comparison[selected][1]}</p></div></>);
  }
  if (chapter.num === 2) {
    const layer = SEVEN_LAYERS[selected];
    return panel(<><h3 className="text-sm font-semibold text-white">Seven-layer operational stack</h3><p className="mt-1 text-xs text-[#94A3B8]">Select a layer. Demand moves down the stack; operational information moves back up.</p><div className="mt-4 space-y-2">{SEVEN_LAYERS.map(([name], index) => <button key={name} type="button" onClick={() => setSelected(index)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${selected === index ? "border-[#10B981]/60 bg-[#10B981]/10 text-white" : "border-[#1E293B] text-[#94A3B8]"}`}><span>{index + 1}. {name}</span><ChevronRight className="h-3.5 w-3.5" /></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">Purpose</span><p className="mt-1 text-sm leading-6 text-[#CBD5E1]">{layer[1]}</p></div><div><span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8]">Operational signals</span><p className="mt-1 text-sm leading-6 text-[#CBD5E1]">{layer[2]}</p></div></div></>);
  }
  if (chapter.num === 3) {
    const pillar = AI_READY_PILLARS[selected];
    return panel(<><h3 className="text-sm font-semibold text-white">AI-readiness assessment lens</h3><p className="mt-1 text-xs text-[#94A3B8]">This is a study aid, not a GreenNext certification or audit.</p>{tabButtons(AI_READY_PILLARS.map(([name]) => name))}<div className="mt-5"><h4 className="font-semibold text-white">{pillar[0]}</h4><p className="mt-2 text-sm leading-7 text-[#CBD5E1]">{pillar[1]}</p><p className="mt-3 text-xs leading-6 text-[#94A3B8]">Evidence should be documented, tested, and interpreted with the other four pillars rather than treated as a standalone readiness score.</p></div></>);
  }
  if (chapter.num === 4) {
    const pue = itEnergy > 0 ? facilityEnergy / itEnergy : 0;
    return panel(<><h3 className="text-sm font-semibold text-white">Illustrative PUE calculator</h3><p className="mt-1 text-xs text-[#94A3B8]">PUE = Total Facility Energy ÷ IT Equipment Energy. Sample values are illustrative, not GreenNext operational measurements.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#CBD5E1]">IT equipment energy (MW)<input type="number" min="0.1" step="0.1" value={itEnergy} onChange={(event) => setItEnergy(Number(event.target.value) || 0)} className="mt-2 w-full rounded-lg border border-[#334155] bg-[#070A0E] px-3 py-2 text-sm text-white" /></label><label className="text-xs text-[#CBD5E1]">Total facility energy (MW)<input type="number" min="0.1" step="0.1" value={facilityEnergy} onChange={(event) => setFacilityEnergy(Number(event.target.value) || 0)} className="mt-2 w-full rounded-lg border border-[#334155] bg-[#070A0E] px-3 py-2 text-sm text-white" /></label></div><div className="mt-5 border-l-2 border-[#10B981] pl-4"><span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">Illustrative result</span><div className="mt-1 text-2xl font-semibold text-white">PUE {pue.toFixed(2)}</div><p className="mt-1 text-xs text-[#94A3B8]">The result expresses facility overhead relative to IT equipment energy within the selected boundary.</p></div></>);
  }
  if (chapter.num === 5) {
    const stage = AUTOMATION_STAGES[selected];
    return panel(<><h3 className="text-sm font-semibold text-white">Six-stage automation workflow</h3><p className="mt-1 text-xs text-[#94A3B8]">Automation maturity grows from observation toward bounded, observable, reversible action.</p>{tabButtons(AUTOMATION_STAGES.map(([name]) => name))}<div className="mt-5 grid gap-4 sm:grid-cols-3"><div><span className="text-[10px] font-mono uppercase text-[#10B981]">Input</span><p className="mt-1 text-sm text-[#CBD5E1]">{stage[1]}</p></div><div><span className="text-[10px] font-mono uppercase text-[#38BDF8]">Stage</span><p className="mt-1 text-sm text-white">{stage[0]}</p></div><div><span className="text-[10px] font-mono uppercase text-[#F59E0B]">Output</span><p className="mt-1 text-sm text-[#CBD5E1]">{stage[2]}</p></div></div></>);
  }
  if (chapter.num === 6) {
    const useCase = USE_CASES[selected];
    return panel(<><h3 className="text-sm font-semibold text-white">Enterprise use-case explorer</h3><p className="mt-1 text-xs text-[#94A3B8]">These are publication scenarios, not customer case studies or claims of deployed systems.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{USE_CASES.map(([name], index) => <button key={name} type="button" onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-3 text-left text-xs ${selected === index ? "border-[#10B981]/60 bg-[#10B981]/10 text-white" : "border-[#1E293B] text-[#94A3B8]"}`}>{name}</button>)}</div><p className="mt-5 border-l-2 border-[#10B981] pl-4 text-sm leading-7 text-[#CBD5E1]">{useCase[1]}</p></>);
  }
  if (chapter.num === 7) {
    const node = REGIONAL_NODES[selected];
    return panel(<><h3 className="text-sm font-semibold text-white">South India planning nodes</h3><p className="mt-1 text-xs text-[#94A3B8]">Planning and research corridors only; no operating facility, capacity, or readiness claim is implied.</p>{tabButtons(REGIONAL_NODES.map(([name]) => name))}<div className="mt-5"><div className="text-lg font-semibold text-white">{node[0]} <span className="font-mono text-xs text-[#10B981]">{node[1]}</span></div><p className="mt-2 text-sm leading-7 text-[#CBD5E1]">{node[2]}</p></div></>);
  }
  if (chapter.num === 8) {
    const indicators = [["Measure", "Metered power, cooling, water, and setpoint outcomes with a stated baseline."], ["Verify", "Trace the boundary, method, comparison period, and evidence behind an assertion."], ["Avoid claiming", "Do not invent carbon offsets, PUE/WUE improvements, emissions reductions, or unavailable Scope 1–3 figures."]];
    return panel(<><h3 className="text-sm font-semibold text-white">Measure versus claim</h3><p className="mt-1 text-xs text-[#94A3B8]">Select a discipline from the publication’s factual approach.</p>{tabButtons(indicators.map(([name]) => name))}<div className="mt-5 border-l-2 border-[#10B981] pl-4"><p className="text-sm leading-7 text-[#CBD5E1]">{indicators[selected][1]}</p></div></>);
  }
  if (chapter.num === 9) {
    const stages = [["Understand", "Map infrastructure, workload, energy, cooling, constraints, and patterns."], ["Intelligence", "Apply telemetry, analytics, and suitable AI-driven analysis across the stack."], ["Optimize", "Tune cooling, balance load, and plan capacity using measured insight."]];
    return panel(<><h3 className="text-sm font-semibold text-white">Understand → Intelligence → Optimize</h3><p className="mt-1 text-xs text-[#94A3B8]">Select a stage to see its role in the closed methodology.</p>{tabButtons(stages.map(([name]) => name))}<div className="mt-5 border-l-2 border-[#10B981] pl-4"><h4 className="font-semibold text-white">{stages[selected][0]}</h4><p className="mt-2 text-sm leading-7 text-[#CBD5E1]">{stages[selected][1]}</p></div></>);
  }
  const checklist = ["What workload is expected to grow?", "What power and thermal data is measured?", "Which assumptions remain unverified?", "How will failure behavior be commissioned?", "What evidence supports the regional model?"];
  const faqs = ["Is GreenNext an operating data-center provider?", "What does AI-ready mean in this publication?", "Where should a team begin?"];
  return panel(<><h3 className="text-sm font-semibold text-white">Planning checklist and FAQ</h3><p className="mt-1 text-xs text-[#94A3B8]">Use these as conversation prompts, not project-specific recommendations.</p><div className="mt-4 space-y-2">{checklist.map((item) => <label key={item} className="flex items-start gap-3 rounded-lg border border-[#1E293B] p-3 text-sm text-[#CBD5E1]"><input type="checkbox" checked={checkedItems.includes(item)} onChange={() => setCheckedItems((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} className="mt-0.5 accent-[#10B981]" />{item}</label>)}</div><div className="mt-5 space-y-2">{faqs.map((faq, index) => <div key={faq} className="border-t border-[#1E293B] pt-3"><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"><span>{faq}</span><ChevronRight className={`h-4 w-4 transition-transform ${openFaq === index ? "rotate-90" : ""}`} /></button>{openFaq === index && <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{index === 0 ? "No. The publication presents GreenNext as a planning and reference initiative." : index === 1 ? "It means evidence-backed power, thermal, network, safety, and commissioning readiness." : "Start with sufficiently granular power and thermal visibility."}</p>}</div>)}</div></>);
}

export function EbookReaderPage() {
  const session = Route.useLoaderData() as EbookSessionState;
  const navigate = useNavigate();
  const [activeChapterNum, setActiveChapterNum] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [readingTheme, setReadingTheme] = useState<"dark" | "light">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [revealedChecks, setRevealedChecks] = useState<number[]>([]);
  const lastActivityPingAt = useRef(0);
  const isDevPreview = Boolean(session?.isDevPreview || isEbookDevPreview());
  const currentChapter = CHAPTERS.find((chapter) => chapter.num === activeChapterNum) || CHAPTERS[0];
  const searchableChapters = useMemo(() => CHAPTERS.map((chapter) => ({ chapter, text: [chapter.title, chapter.summary, ...chapter.readingSections.map((section) => `${section.heading} ${section.body}`), ...chapter.terminology.map((item) => `${item.term} ${item.definition}`)].join(" ").toLowerCase() })), []);
  const searchResults = searchQuery.trim().length < 2 ? [] : searchableChapters.filter((entry) => entry.text.includes(searchQuery.trim().toLowerCase())).map((entry) => entry.chapter);
  const themeClasses = readingTheme === "light" ? "bg-[#F8FAFC] text-[#0F172A]" : "bg-[#050811] text-[#E2E8F0]";

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("greennext-ebook-reader-preferences") || "null") as { chapter?: number; theme?: typeof readingTheme; bookmarks?: string[]; completed?: number[] } | null;
      if (saved?.chapter && saved.chapter >= 1 && saved.chapter <= CHAPTERS.length) setActiveChapterNum(saved.chapter);
      if (saved?.theme) setReadingTheme(saved.theme);
      if (Array.isArray(saved?.bookmarks)) setBookmarks(saved.bookmarks.filter((value): value is string => typeof value === "string"));
      if (Array.isArray(saved?.completed)) setCompletedChapters(saved.completed.filter((value): value is number => Number.isInteger(value)));
    } catch {
      // Preferences are optional; authentication and reader access do not depend on browser storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("greennext-ebook-reader-preferences", JSON.stringify({ chapter: activeChapterNum, theme: readingTheme, bookmarks, completed: completedChapters }));
    } catch {
      // Reader remains functional when browser storage is unavailable.
    }
  }, [activeChapterNum, bookmarks, completedChapters, readingTheme]);

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

  const toggleBookmark = (heading: string) => {
    setBookmarks((current) => current.includes(heading) ? current.filter((value) => value !== heading) : [...current, heading]);
  };

  const copyDefinition = async (term: string, definition: string) => {
    try {
      await navigator.clipboard.writeText(`${term}: ${definition}`);
    } catch {
      // Clipboard permission is optional and does not affect reading.
    }
  };

  const markChapterComplete = () => {
    setCompletedChapters((current) => current.includes(currentChapter.num) ? current.filter((value) => value !== currentChapter.num) : [...current, currentChapter.num]);
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

  const progressPercentage = Math.round((completedChapters.length / CHAPTERS.length) * 100);
  return (
    <div className="ebook-reader min-h-screen bg-[#070A0E] text-[#E2E8F0] flex flex-col" data-theme={readingTheme}>
      <style>{`
        .ebook-reader {
          --reader-bg: #070A0E;
          --reader-surface: #0A0F1D;
          --reader-surface-raised: #0F172A;
          --reader-border: #1E293B;
          --reader-border-strong: #334155;
          --reader-primary: #E2E8F0;
          --reader-secondary: #CBD5E1;
          --reader-muted: #94A3B8;
          --reader-subtle: #64748B;
        }
        .ebook-reader[data-theme="light"] {
          --reader-bg: #F8FAFC;
          --reader-surface: #FFFFFF;
          --reader-surface-raised: #F1F5F9;
          --reader-border: #CBD5E1;
          --reader-border-strong: #94A3B8;
          --reader-primary: #0F172A;
          --reader-secondary: #334155;
          --reader-muted: #475569;
          --reader-subtle: #64748B;
          color: var(--reader-primary);
          background: var(--reader-bg);
        }
        .ebook-reader[data-theme="light"] [class*="text-white"] { color: var(--reader-primary) !important; }
        .ebook-reader[data-theme="light"] [class*="text-[#E2E8F0]"] { color: var(--reader-primary) !important; }
        .ebook-reader[data-theme="light"] [class*="text-[#CBD5E1]"] { color: var(--reader-secondary) !important; }
        .ebook-reader[data-theme="light"] [class*="text-[#94A3B8]"] { color: var(--reader-muted) !important; }
        .ebook-reader[data-theme="light"] [class*="text-[#64748B]"] { color: var(--reader-subtle) !important; }
        .ebook-reader[data-theme="light"] [class*="text-[#475569]"] { color: var(--reader-muted) !important; }
        .ebook-reader[data-theme="light"] [class*="bg-[#070A0E]"],
        .ebook-reader[data-theme="light"] [class*="bg-[#050811]"],
        .ebook-reader[data-theme="light"] [class*="bg-[#0A0F1D]"],
        .ebook-reader[data-theme="light"] [class*="bg-[#0B132B]"],
        .ebook-reader[data-theme="light"] [class*="bg-[#0F172A]"],
        .ebook-reader[data-theme="light"] [class*="bg-[#1E293B]"] { background-color: var(--reader-surface) !important; }
        .ebook-reader[data-theme="light"] [class*="border-[#1E293B]"],
        .ebook-reader[data-theme="light"] [class*="border-[#334155]"] { border-color: var(--reader-border) !important; }
        .ebook-reader[data-theme="light"] input,
        .ebook-reader[data-theme="light"] textarea,
        .ebook-reader[data-theme="light"] select { color: var(--reader-primary); background-color: var(--reader-surface); border-color: var(--reader-border-strong); }
        .ebook-reader[data-theme="light"] input::placeholder,
        .ebook-reader[data-theme="light"] textarea::placeholder { color: var(--reader-subtle); opacity: 1; }
        .ebook-reader[data-theme="light"] button:focus-visible,
        .ebook-reader[data-theme="light"] a:focus-visible,
        .ebook-reader[data-theme="light"] input:focus-visible { outline: 2px solid #047857; outline-offset: 2px; }
        .ebook-reader[data-theme="light"] [class*="hover:bg-[#1E293B]"]:hover { background-color: #E2E8F0 !important; }
        .ebook-reader[data-theme="light"] [class*="hover:bg-[#334155]"]:hover { background-color: #CBD5E1 !important; }
        .ebook-reader[data-theme="light"] [class*="disabled:opacity-30"]:disabled { color: #94A3B8 !important; }
      `}</style>
      <header className="border-b border-[#1E293B] bg-[#0A0F1D]/95 backdrop-blur px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen((open) => !open)} className="lg:hidden p-2 rounded-lg bg-[#1E293B] text-white" aria-label="Toggle table of contents"><BookOpen className="w-4 h-4" /></button>
          <BookOpen className="w-6 h-6 text-[#10B981]" />
          <div>
            <div className="text-sm font-bold text-white">Intelligent Infrastructure for a Sustainable Digital Future</div>
            <div className="text-[11px] text-[#64748B]">Edition 2.0 · {isDevPreview ? "Local study preview" : `Verified Reader: ${session?.user?.displayName || session?.user?.email || "Reader"}`}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button type="button" onClick={() => setSearchOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1]" aria-label="Search the Ebook"><Search className="h-3.5 w-3.5" />Search</button>
          <button type="button" onClick={() => setGlossaryOpen((open) => !open)} className="hidden items-center gap-1.5 rounded-lg bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1] sm:inline-flex">Glossary</button>
          <button type="button" onClick={() => setBookmarksOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#CBD5E1]" aria-label="View bookmarks"><Bookmark className="h-3.5 w-3.5" />{bookmarks.length}</button>
          <button type="button" onClick={() => setReadingTheme((theme) => theme === "dark" ? "light" : "dark")} className="hidden rounded-lg bg-[#1E293B] p-2 text-[#CBD5E1] md:inline-flex" aria-label="Toggle reading theme">{readingTheme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</button>
          <a href="/api/ebook/download" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#10B981] text-[#070A0E]"><Download className="w-3.5 h-3.5" />Download Ebook (PDF)</a>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] text-[#CBD5E1] disabled:opacity-50"><LogOut className="w-3.5 h-3.5" />Sign Out</button>
        </div>
      </header>

      {(searchOpen || glossaryOpen || bookmarksOpen) && <div className="border-b border-[#1E293B] bg-[#0A0F1D] px-4 py-4 sm:px-6"><div className="mx-auto max-w-7xl">{searchOpen && <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-semibold text-white"><Search className="h-4 w-4 text-[#10B981]" />Search all chapters<input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search terms, concepts, or chapter titles" className="ml-auto w-full max-w-xl rounded-lg border border-[#334155] bg-[#070A0E] px-3 py-2 text-sm font-normal text-white outline-none focus:border-[#10B981]" /></label>{searchQuery.length >= 2 && <div className="grid gap-2 sm:grid-cols-2">{searchResults.length ? searchResults.map((chapter) => <button key={chapter.num} type="button" onClick={() => { selectChapter(chapter.num); setSearchOpen(false); }} className="rounded-lg border border-[#1E293B] p-3 text-left text-xs text-[#CBD5E1] hover:border-[#10B981]/50"><span className="font-semibold text-white">Chapter {chapter.num}: {chapter.title}</span><span className="mt-1 block text-[#94A3B8]">{chapter.summary}</span></button>) : <p className="text-xs text-[#94A3B8]">No chapter matches found.</p>}</div>}</div>}{glossaryOpen && <div className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Glossary</h2><span className="text-xs text-[#64748B]">Definitions from the publication</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{GLOSSARY.map(([term, definition]) => <div key={term} className="rounded-lg border border-[#1E293B] p-3"><dt className="text-xs font-semibold text-[#38BDF8]">{term}</dt><dd className="mt-1 text-xs leading-5 text-[#CBD5E1]">{definition}</dd><button type="button" onClick={() => copyDefinition(term, definition)} className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#10B981]"><Copy className="h-3 w-3" />Copy definition</button></div>)}</div></div>}{bookmarksOpen && <div className="space-y-3"><h2 className="text-sm font-semibold text-white">Bookmarks</h2>{bookmarks.length ? <div className="flex flex-wrap gap-2">{bookmarks.map((bookmark) => <button key={bookmark} type="button" onClick={() => { const chapter = CHAPTERS.find((item) => item.readingSections.some((section) => section.heading === bookmark)); if (chapter) selectChapter(chapter.num); }} className="inline-flex items-center gap-2 rounded-lg border border-[#1E293B] px-3 py-2 text-xs text-[#CBD5E1]"><Bookmark className="h-3 w-3 text-[#10B981]" />{bookmark}</button>)}</div> : <p className="text-xs text-[#94A3B8]">Bookmark a section while reading to find it here.</p>}</div>}</div></div>}

      <div className="w-full bg-[#0A0F1D] h-1.5 border-b border-[#1E293B] sticky top-[61px] z-30"><div className="bg-gradient-to-r from-[#10B981] to-[#38BDF8] h-full" style={{ width: `${progressPercentage}%` }} /></div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className={`fixed inset-y-0 left-0 z-50 lg:static w-80 bg-[#0A0F1D] border-r border-[#1E293B] p-4 space-y-6 overflow-y-auto transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between"><div className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Contents · {activeChapterNum}/{CHAPTERS.length}</div><button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-xs text-[#94A3B8]">Close</button></div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-xs"><div className="flex justify-between text-[#94A3B8] mb-1 font-mono text-[11px]"><span>Reading Progress</span><span>{progressPercentage}%</span></div><div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden"><div className="bg-[#10B981] h-full" style={{ width: `${progressPercentage}%` }} /></div></div>
          <div className="space-y-1">{CHAPTERS.map((chapter) => <button key={chapter.num} type="button" onClick={() => selectChapter(chapter.num)} className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-3 ${chapter.num === activeChapterNum ? "bg-[#10B981]/15 text-white font-semibold border border-[#10B981]/40" : "text-[#94A3B8] hover:bg-[#1E293B]/60 border border-transparent"}`}><span className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold ${chapter.num === activeChapterNum ? "bg-[#10B981] text-[#070A0E]" : "bg-[#1E293B] text-[#94A3B8]"}`}>{String(chapter.num).padStart(2, "0")}</span><span className="flex-1 leading-snug"><span className="block">{chapter.title}</span><span className="block text-[10px] text-[#64748B] font-mono mt-1">{chapter.readTimeMinutes} min · PDF pp. {chapter.sourcePages[0]}–{chapter.sourcePages[1]}</span></span></button>)}</div>
          <div className="pt-4 border-t border-[#1E293B] text-center text-xs text-[#64748B]">Canonical publication · Edition 2.0</div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className={`flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-14 max-w-7xl mx-auto w-full space-y-12 ${themeClasses}`}>
          <header className="space-y-4 border-b border-[#1E293B] pb-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-xs font-bold uppercase tracking-widest text-[#10B981]">Chapter {String(currentChapter.num).padStart(2, "0")} of 10</span><span className="text-xs font-mono text-[#64748B]">PDF pages {currentChapter.sourcePages[0]}–{currentChapter.sourcePages[1]}</span></div><h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{currentChapter.title}</h1><p className="max-w-4xl border-l-2 border-[#10B981] pl-4 text-base leading-relaxed text-[#CBD5E1]"><span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-[#10B981]">Chapter brief</span>{currentChapter.summary}</p></header>

          <section className="space-y-5 border-y border-[#1E293B] py-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-[#10B981]"><FileText className="h-5 w-5" /><span className="text-[10px] font-mono font-bold uppercase tracking-widest">Original publication</span></div><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#94A3B8]">The web edition below is the primary reading experience. Open the protected source PDF only when you want to inspect the original page design, diagrams, tables, glossary, or next steps.</p></div><button type="button" onClick={() => setPdfPreviewOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#10B981]/50 px-4 py-2.5 text-xs font-bold text-[#10B981] transition-colors hover:bg-[#10B981]/10"><FileText className="h-4 w-4" />Preview original PDF</button></div></section>

          <section className="space-y-6" aria-labelledby="chapter-reading-title"><div className="flex items-end justify-between gap-4"><div><span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#38BDF8]">Web edition</span><h2 id="chapter-reading-title" className="mt-1 text-xl font-semibold text-white">Read the chapter</h2></div><span className="hidden text-xs text-[#64748B] sm:block">Source pages {currentChapter.sourcePages[0]}–{currentChapter.sourcePages[1]}</span></div><div className="max-w-4xl space-y-8">{currentChapter.readingSections.map((section) => <article key={section.heading} className="group space-y-2"><div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold text-white">{section.heading}</h3><button type="button" onClick={() => toggleBookmark(section.heading)} className={`rounded-md p-1.5 transition-colors ${bookmarks.includes(section.heading) ? "text-[#10B981]" : "text-[#475569] hover:text-[#CBD5E1]"}`} aria-label={`${bookmarks.includes(section.heading) ? "Remove" : "Add"} bookmark for ${section.heading}`}><Bookmark className="h-4 w-4" fill={bookmarks.includes(section.heading) ? "currentColor" : "none"} /></button></div><p className="text-base leading-8 text-[#CBD5E1]">{section.body}</p></article>)}</div><InteractiveChapterExperience chapter={currentChapter} /></section>

          <section className="space-y-4 border-t border-[#1E293B] pt-8"><div><span className="text-[11px] font-mono uppercase tracking-widest text-[#38BDF8]">Supplementary study companion</span><h2 className="text-xl font-bold text-white mt-1">Study this chapter</h2><p className="text-xs text-[#94A3B8] mt-1">The sections below are study aids derived from the canonical source and are not additional publication claims.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-3">Learning objectives</h3><StudyList items={currentChapter.learningObjectives} /></div><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-3">Practical relevance</h3><p className="text-sm text-[#CBD5E1] leading-relaxed">{currentChapter.practicalRelevance}</p></div></div></section>

          <section className="grid gap-6 md:grid-cols-2"><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-4">Key concepts</h3><div className="space-y-4">{currentChapter.keyConcepts.map((concept) => <div key={concept.title}><div className="flex items-center gap-2 text-[#10B981] text-sm font-semibold"><CheckCircle2 className="w-4 h-4" />{concept.title}</div><p className="text-xs text-[#94A3B8] leading-relaxed mt-1 ml-6">{concept.desc}</p></div>)}</div></div><div className="p-5 rounded-xl bg-[#0A0F1D] border border-[#1E293B]"><h3 className="text-sm font-bold text-white mb-4">Important terminology</h3><dl className="space-y-4">{currentChapter.terminology.map((item) => <div key={item.term}><dt className="text-xs font-bold text-[#38BDF8]">{item.term}</dt><dd className="text-xs text-[#94A3B8] leading-relaxed mt-1">{item.definition}</dd></div>)}</dl></div></section>

          <section className="rounded-xl border border-[#1E293B] bg-[#0A0F1D] p-5"><h3 className="text-sm font-bold text-white">Knowledge check</h3><p className="mt-1 text-xs text-[#94A3B8]">Reveal the source-grounded answer and explanation after thinking through each question.</p><div className="mt-4 space-y-3">{currentChapter.knowledgeCheck.map((question, index) => <div key={question} className="rounded-lg border border-[#1E293B] p-3"><button type="button" onClick={() => setRevealedChecks((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])} className="flex w-full items-start justify-between gap-4 text-left text-sm font-semibold text-white"><span>{question}</span><ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${revealedChecks.includes(index) ? "rotate-90 text-[#10B981]" : "text-[#64748B]"}`} /></button>{revealedChecks.includes(index) && <div className="mt-3 border-l-2 border-[#10B981] pl-3 text-sm leading-6 text-[#CBD5E1]"><strong className="text-[#10B981]">Answer:</strong> {KNOWLEDGE_ANSWERS[currentChapter.num]?.[index] || currentChapter.summary}</div>}</div>)}</div></section>

          <div className="flex flex-col gap-3 border-t border-[#1E293B] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#94A3B8]">{completedChapters.includes(currentChapter.num) ? "Chapter marked complete. You can revisit it at any time." : "Mark this chapter complete when you have finished the reading and knowledge check."}</p><button type="button" onClick={markChapterComplete} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold ${completedChapters.includes(currentChapter.num) ? "border border-[#10B981]/50 text-[#10B981]" : "bg-[#10B981] text-[#070A0E]"}`}><Check className="h-4 w-4" />{completedChapters.includes(currentChapter.num) ? "Completed" : "Mark chapter complete"}</button></div>

          <div className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4"><button type="button" onClick={() => selectChapter(activeChapterNum - 1)} disabled={activeChapterNum <= 1} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border border-[#334155] bg-[#0A0F1D] text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" />Previous Chapter</button><div className="flex items-center gap-1.5">{CHAPTERS.map((chapter) => <button key={chapter.num} type="button" onClick={() => selectChapter(chapter.num)} title={chapter.title} aria-label={`Go to chapter ${chapter.num}`} className={`w-3 h-3 rounded-full ${chapter.num === activeChapterNum ? "bg-[#10B981] scale-125" : "bg-[#1E293B] hover:bg-[#334155]"}`} />)}</div><button type="button" onClick={() => selectChapter(activeChapterNum + 1)} disabled={activeChapterNum >= CHAPTERS.length} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#10B981] text-[#070A0E] disabled:opacity-30">Next Chapter<ChevronRight className="w-4 h-4" /></button></div>
        </main>
      </div>
      {pdfPreviewOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title"><div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#334155] bg-[#0A0F1D] shadow-2xl"><div className="flex items-center justify-between gap-4 border-b border-[#1E293B] px-4 py-3 sm:px-5"><div><h2 id="pdf-preview-title" className="text-sm font-semibold text-white">Original GreenNext Ebook PDF</h2><p className="text-[11px] text-[#94A3B8]">Protected preview · complete 30-page publication</p></div><div className="flex items-center gap-2"><a href="/api/ebook/download" className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-bold text-[#070A0E]"><Download className="h-3.5 w-3.5" />Download PDF</a><button type="button" onClick={() => setPdfPreviewOpen(false)} className="rounded-lg p-2 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white" aria-label="Close PDF preview"><X className="h-4 w-4" /></button></div></div><iframe title="Protected original Ebook PDF preview" src="/api/ebook/stream" className="min-h-0 w-full flex-1 bg-white" /></div></div>}
    </div>
  );
}
