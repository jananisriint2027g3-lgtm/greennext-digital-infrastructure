import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  BookOpen,
  LogOut,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  Network,
  Cpu,
  BarChart3,
  Flame,
  Activity,
  Compass,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileText,
} from "lucide-react";
import {
  getEbookSession,
  logoutEbook,
  isEbookDevPreview,
  type EbookSessionState,
} from "../../lib/ebook-session.server-fn";

// Interactive components from GreenNext
import {
  AiComputeCoolingInfographic,
  RegionalTopologyInfographic,
  PowerMonitoringInfographic,
} from "../../components/visuals/InfrastructureInfographics";
import { RegionalExplorer } from "../../components/home/RegionalExplorer";
import { PowerReliabilityModel } from "../../components/kpi/PowerReliabilityModel";
import { CoolingEfficiencyCalculator } from "../../components/kpi/CoolingEfficiencyCalculator";
import { SevenLayerStack } from "../../components/home/SevenLayerStack";
import { ArchitectureExplorer } from "../../components/solutions/ArchitectureExplorer";
import { AutomationWorkflow } from "../../components/home/AutomationWorkflow";
import { CapacityUtilizationModel } from "../../components/kpi/CapacityUtilizationModel";
import { InfrastructureConfigurator } from "../../components/solutions/InfrastructureConfigurator";
import { InfrastructureDataExplorer } from "../../components/mining/InfrastructureDataExplorer";
import { EnergyImpactCalculator } from "../../components/solutions/EnergyImpactCalculator";
import { PueCalculator } from "../../components/kpi/PueCalculator";
import { CybersecurityFramework } from "../../components/infrastructure/CybersecurityFramework";

export const Route = createFileRoute("/ebook/reader")({
  head: () => ({
    meta: [
      { title: "Interactive Ebook Reader | GreenNext Digital Infrastructure" },
      {
        name: "description",
        content:
          "Official interactive research edition: Intelligent Infrastructure for a Sustainable Digital Future (Edition 2.0). 10 modules covering sovereign AI compute, thermal dynamics, regional fabrics, and closed-loop telemetry.",
      },
    ],
  }),
  loader: async () => {
    return await getEbookSession();
  },
  component: EbookReaderPage,
});

interface ChapterDefinition {
  num: number;
  id: string;
  title: string;
  subtitle: string;
  readTimeMinutes: number;
  summary: string;
  paragraphs: string[];
  keyPrinciples: Array<{ title: string; desc: string }>;
  interactiveType:
    | "ai-cooling"
    | "regional-topology"
    | "power-reliability"
    | "cooling-calc"
    | "seven-layer"
    | "automation"
    | "capacity-config"
    | "regional-mining"
    | "energy-calc"
    | "cybersecurity";
}

const CHAPTERS: ChapterDefinition[] = [
  {
    num: 1,
    id: "macro-shift",
    title: "The Macro Shift: Sovereign AI & Green Compute Imperative",
    subtitle: "Rethinking Data Center Envelopes for 100+ kW Compute Densities",
    readTimeMinutes: 7,
    summary:
      "Modern deep-learning foundation models and sustained tensor-core utilization demand fundamentally new facility engineering paradigms, moving far beyond legacy 5 kW–10 kW air-cooled envelopes into high-density liquid-assisted infrastructures.",
    paragraphs: [
      "Enterprise data center engineering has arrived at an unprecedented physical inflection point. For nearly three decades, commercial multi-tenant facilities were designed around predictable electrical envelopes of 5 kW to 10 kW per rack. Standard hot-aisle/cold-aisle containment and raised-floor computer room air handlers (CRAHs) were adequate to dissipate the thermal loads of general-purpose x86 servers.",
      "The rapid rise of accelerated computing—anchored by high-TDP GPUs, tensor processing clusters, and custom deep-learning ASICs—has obliterated these traditional boundaries. Modern accelerated servers package multiple 700 W to 1000 W compute engines into single chassis, driving rack power densities to 40 kW, 60 kW, and in dense clusters exceeding 100 kW per rack. Air-cooling mechanisms cannot move enough mass air flow through these tightly coupled heatsinks without consuming exorbitant parasitic fan power that degrades facility efficiency.",
      "Concurrently, the emergence of sovereign AI mandates has transformed compute infrastructure into a core pillar of national economic competitiveness. Sovereign AI requires high-performance model training and inference capacity to remain hosted within resilient, domestically governed digital corridors, directly aligned with regional clean energy grids rather than dependent on monolithic overseas hyperscale campuses.",
      "GreenNext defines a comprehensive co-design methodology where chip-level heat spreaders, rack fluid distribution units (CDUs), facility electrical substations, and regional power utilities are planned as a single integrated thermodynamic system.",
    ],
    keyPrinciples: [
      {
        title: "Density Inflection",
        desc: "Transitioning rack envelopes from 8 kW air-cooled legacy baselines to 60 kW–100 kW liquid-cooled accelerated architectures.",
      },
      {
        title: "Thermodynamic Co-Design",
        desc: "Unifying chip-level thermal capture directly with facility hydronics, eliminating redundant mechanical conversion losses.",
      },
      {
        title: "Digital Sovereignty",
        desc: "Locating high-density compute within regional industrial clusters powered by domestic renewable energy generation.",
      },
    ],
    interactiveType: "ai-cooling",
  },
  {
    num: 2,
    id: "regional-topologies",
    title: "Regional Network Topologies: South India Multi-Node Fabric",
    subtitle: "Decentralized Interconnects Across Secondary Industrial Corridors",
    readTimeMinutes: 8,
    summary:
      "Concentrating compute exclusively in congested tier-1 metropolitan centers introduces municipal grid strain, water competition, and single-point-of-failure vulnerabilities. A decentralized South Indian multi-node topology unlocks resilient, sub-10ms inter-facility performance.",
    paragraphs: [
      "Metropolitan data center clustering in tier-1 hubs (such as Chennai or Mumbai) has created acute geographic bottlenecks. Operators face multi-year substation expansion delays, escalating industrial power tariffs, severe potable water constraints, and hyper-inflated urban real estate acquisition costs.",
      "GreenNext's regional architectural framework distributes sovereign computing capacity across a coordinated multi-node mesh connecting South India's secondary industrial corridors: Coimbatore, Madurai, Mangalore, Trichy, and Kochi. By leveraging dedicated dark-fiber optical backbones and non-blocking DWDM routing, these nodes achieve sub-10ms round-trip latency to primary metropolitan exchanges.",
      "This decentralized topology enables active-active workload placement: long-running foundation training runs can be routed to facilities with surplus localized wind or solar generation, while latency-sensitive inference workloads execute close to regional industrial and healthcare clusters.",
      "Furthermore, geographical dispersion distributes electrical demand across multiple regional state grid transformers (TANGEDCO, KPTCL, KSEB), avoiding localized transmission overloads and providing robust disaster resilience against coastal weather events.",
    ],
    keyPrinciples: [
      {
        title: "Secondary-City Advantage",
        desc: "Capitalizing on 30%–45% lower development costs, ample land, and direct access to renewable power generation corridors.",
      },
      {
        title: "Sub-10ms Regional Mesh",
        desc: "Low-latency non-blocking optical interconnects enabling seamless distributed training checkpoints and distributed inference.",
      },
      {
        title: "Grid Balancing",
        desc: "Spreading multi-megawatt computing demands across distinct regional substations to relieve localized metropolitan grid stress.",
      },
    ],
    interactiveType: "regional-topology",
  },
  {
    num: 3,
    id: "power-architectures",
    title: "Intelligent Power Architectures: Substation Integration & Renewables",
    subtitle: "Absorbing Millisecond Tensor Transients and Harmonizing Clean Grid Feeds",
    readTimeMinutes: 9,
    summary:
      "AI accelerators introduce violent millisecond electrical load swings when transitioning between matrix execution phases. Intelligent medium-voltage integration and battery storage smooth demand while maximizing renewable blending.",
    paragraphs: [
      "Accelerated AI workloads present an electrical profile fundamentally different from legacy cloud servers. When thousands of tensor cores initiate simultaneous transformer model matrix multiplications, facility power draw spikes by tens of megawatts within single-digit milliseconds. When synchronization barriers or checkpoint saves occur, load plunges just as abruptly.",
      "These high-amplitude di/dt transients cause dangerous voltage fluctuations, harmonic distortions, and transformer heating if not mitigated by intelligent facility power architectures. GreenNext addresses this through direct medium-voltage (110kV/33kV) dual-substation feeds paired with solid-state transformers (SSTs) and distributed track busways.",
      "Rather than relying solely on oversized legacy double-conversion UPS systems with high continuous parasitic losses, the GreenNext architecture deploys rack-integrated energy storage modules and facility-scale Battery Energy Storage Systems (BESS). These battery banks act as high-speed dynamic buffers, absorbing sub-second transient spikes and supplying peak shaving power during critical grid demand intervals.",
      "Crucially, facility substations are engineered for bidirectional clean power integration, harmonizing incoming grid feeds with co-located solar PV arrays and regional wind power contracts to maximize real-time carbon-free energy utilization.",
    ],
    keyPrinciples: [
      {
        title: "Transient Load Buffering",
        desc: "Deploying high-discharge battery storage to absorb millisecond di/dt spikes caused by tensor compute bursts.",
      },
      {
        title: "Medium-Voltage Busways",
        desc: "Eliminating redundant low-voltage distribution stages to cut electrical transmission losses by up to 4%.",
      },
      {
        title: "Renewable Blending",
        desc: "Real-time synchronization between utility substation feeders, on-site battery reserves, and regional clean energy generation.",
      },
    ],
    interactiveType: "power-reliability",
  },
  {
    num: 4,
    id: "thermal-dynamics",
    title: "Advanced Thermal Dynamics: Liquid Cooling & Heat Reuse",
    subtitle: "Direct-to-Chip Capture and Warm-Water Operation in Tropical Climates",
    readTimeMinutes: 8,
    summary:
      "Air is fundamentally inadequate for 100 kW rack dissipation. Direct-to-Chip (DLC) cold plates capture over 85% of heat directly at the silicon interface, enabling compressor-free dry cooling even in tropical climates.",
    paragraphs: [
      "The physics of thermal heat transfer dictate that air-cooling cannot efficiently cool semiconductor packages dissipating hundreds of watts per square centimeter. Air has a volumetric heat capacity over three thousand times lower than water. Attempting to force massive volumes of chilled air through high-density server chassis results in deafening fan noise, catastrophic fan electrical draw, and severe localized thermal throttling.",
      "GreenNext's thermal reference model implements Direct-to-Chip Liquid Cooling (DLC) as the primary heat rejection mechanism. Treated dielectric or water-glycol coolant is pumped directly through micro-channel cold plates mounted flush with GPU and CPU integrated heat spreaders (IHS), capturing over 80% to 85% of total rack heat dissipation at the silicon source.",
      "The residual 15% to 20% of heat—radiated by power supplies, memory DIMMs, and network interfaces—is captured by high-efficiency Rear-Door Heat Exchangers (RDHx), preventing any thermal exhaust into the data center hall. As a result, the facility operates with neutral ambient room temperatures (24°C–27°C) without requiring energy-intensive raised-floor cold air plenums.",
      "Most importantly for South Indian tropical climates, DLC systems operate efficiently with elevated supply water temperatures (32°C to 35°C). This high temperature delta allows dry coolers to reject heat directly to ambient air without running mechanical compressors for the majority of the year, driving annual Power Usage Effectiveness (PUE) below 1.15.",
    ],
    keyPrinciples: [
      {
        title: "Direct-to-Chip Capture",
        desc: "Extracting 85%+ of silicon thermal dissipation directly through closed-loop micro-channel liquid cold plates.",
      },
      {
        title: "Elevated Supply Temperatures",
        desc: "Operating with 32°C–35°C water loops to enable compressor-free 'free cooling' in tropical environments.",
      },
      {
        title: "Low-Grade Heat Recovery",
        desc: "Channeling 45°C–55°C warm effluent for industrial drying, agricultural greenhousing, or water pre-heating.",
      },
    ],
    interactiveType: "cooling-calc",
  },
  {
    num: 5,
    id: "seven-layer-stack",
    title: "The 7-Layer Intelligent Infrastructure Stack",
    subtitle: "A Unified Architectural Taxonomy from Application Demand to Operational Telemetry",
    readTimeMinutes: 10,
    summary:
      "Modern AI facilities cannot be engineered in isolated silos. The GreenNext 7-Layer Stack connects application demand, network fabrics, compute hardware, storage tiers, hydronics, electrical distribution, and telemetry into a single unified framework.",
    paragraphs: [
      "Historically, data center design was fragmented across disconnected disciplines: software architects chose server models, network engineers provisioned spine-leaf switches, mechanical contractors installed chillers, and electrical contractors laid busways. In a 100 kW AI compute environment, this siloed approach guarantees catastrophic bottlenecks.",
      "A restriction in cooling loop fluid velocity immediately throttles GPU tensor clocks, degrading AI training throughput by 30%. Similarly, an unbuffered electrical transient trips upstream breakers, corrupting multi-day distributed model checkpoints. Every physical component is inextricably bound to the computational layer above and below it.",
      "GreenNext introduces the 7-Layer Intelligent Infrastructure Stack as a rigorous systems-engineering model:",
      "• Layer 01 – Users & AI Applications: Ingestion of training workloads, inference requests, and latency SLA boundaries.\n• Layer 02 – Network & Connectivity: Non-blocking optical fabrics, inter-node RoCE/InfiniBand, and regional dark fiber transit.\n• Layer 03 – Compute Layer: High-density accelerated nodes, tensor cores, memory bandwidth, and thermal dissipation surfaces.\n• Layer 04 – Storage & Data Layer: High-throughput NVMe scratch fabrics, model weight repositories, and durable checkpoint storage.\n• Layer 05 – Cooling Infrastructure: Direct-to-chip cold plates, coolant distribution units (CDUs), and ambient dry cooler loops.\n• Layer 06 – Power Delivery: Medium-voltage substations, solid-state transformers, battery energy storage, and smart busways.\n• Layer 07 – Operational Telemetry & Control: Closed-loop telemetry pipelines, predictive failure models, and real-time governance.",
    ],
    keyPrinciples: [
      {
        title: "Systems Co-Design",
        desc: "Co-optimizing electrical distribution, hydronic flow, and workload scheduling as an indivisible engineering system.",
      },
      {
        title: "Cross-Layer Observability",
        desc: "Propagating physical telemetry (silicon delta-T, busway harmonics) upward into intelligent cluster orchestrators.",
      },
      {
        title: "Rigorous Taxonomy",
        desc: "Providing a standardized architecture model for multidisciplinary engineering teams, facility operators, and enterprise tenants.",
      },
    ],
    interactiveType: "seven-layer",
  },
  {
    num: 6,
    id: "telemetry-automation",
    title: "Operational Telemetry & Closed-Loop Automation",
    subtitle: "High-Frequency Telemetry Pipelines and Automated Anomaly Resolution",
    readTimeMinutes: 8,
    summary:
      "Legacy 5-minute SNMP polling is useless when thermal runaway can occur in seconds. GreenNext implements sub-second edge telemetry pipelines and closed-loop automated calibration.",
    paragraphs: [
      "In high-density accelerated facilities, operational margins are measured in fractions of a millimeter and fractions of a second. If a pump impeller cavitates or a valve sticks during a full-cluster 50 MW model training checkpoint, temperatures on high-TDP accelerators can spike to critical thermal cutoff limits within 15 seconds.",
      "Traditional data center infrastructure management (DCIM) tools polling via SNMP or Modbus at 5-minute intervals cannot provide adequate protection. GreenNext replaces legacy DCIM with high-frequency distributed edge telemetry pipelines capturing fluid pressure, flow velocity, delta-T, vibration frequency, harmonic distortion, and per-socket power draw every 100 milliseconds.",
      "Edge telemetry brokers normalize these heterogeneous signals into a unified time-series intelligence fabric. Real-time statistical classification models continuously evaluate streaming data against dynamic operational baselines.",
      "When micro-anomalies appear—such as a subtle pressure drop indicating a developing coolant line micro-leak or an unbalanced phase on a secondary PDU—the closed-loop automation engine acts autonomously: adjusting variable-speed pumping loops, notifying on-site technicians with exact spatial coordinates, and signaling workload schedulers to migrate active compute jobs seamlessly.",
    ],
    keyPrinciples: [
      {
        title: "Sub-Second Ingestion",
        desc: "Gathering high-resolution sensor metrics across physical and electrical subsystems at 100ms intervals.",
      },
      {
        title: "Automated Root-Cause Classification",
        desc: "Distinguishing transient workload spikes from genuine mechanical or electrical equipment degradation.",
      },
      {
        title: "Closed-Loop Escalation",
        desc: "Executing automated physical compensations (pump speeds, valve trims) while signaling job schedulers before hardware limits are breached.",
      },
    ],
    interactiveType: "automation",
  },
  {
    num: 7,
    id: "workload-orchestration",
    title: "Workload Orchestration & Compute Density Optimization",
    subtitle: "Harmonizing Training, Inference, and Thermal Envelopes across Heterogeneous Clusters",
    readTimeMinutes: 8,
    summary:
      "Training jobs demand sustained multi-week power plateaus, while inference jobs exhibit dynamic diurnal swings. Intelligent workload orchestration co-schedules jobs to balance thermal dissipation and optimize cluster ROI.",
    paragraphs: [
      "Accelerated computing workloads are not monolithic. Foundation model pre-training and large-scale fine-tuning represent massive, continuous workloads: thousands of accelerators compute synchronously, maintaining flat-line 100% electrical draw and maximum thermal dissipation for weeks at a time.",
      "In sharp contrast, real-time enterprise inference workloads follow human behavioral cycles, characterized by sharp morning and evening traffic peaks interspersed with substantial nighttime idle periods. Hosting these workloads in separate facilities creates severe capital inefficiency, leaving power and cooling infrastructure underutilized during low-traffic hours.",
      "GreenNext introduces workload-aware infrastructure orchestration. By co-scheduling flexible batch training jobs alongside latency-critical inference workloads within the same physical hall, cluster schedulers can 'fill the valleys' of inference demand, maintaining consistent facility electrical utilization and steady-state thermal loops.",
      "Furthermore, density optimization algorithms match specific workload profiles with the optimal hardware tier—allocating dense 80 kW liquid-cooled rows for high-bandwidth training while placing distributed edge inference models in modular 25 kW hybrid enclosures.",
    ],
    keyPrinciples: [
      {
        title: "Workload Complementarity",
        desc: "Co-locating bursty inference and deferrable training to smooth facility load profiles and maximize infrastructure CapEx utilization.",
      },
      {
        title: "Thermal-Aware Scheduling",
        desc: "Directing computational jobs to specific rack rows with verified hydronic cooling headroom.",
      },
      {
        title: "Adaptive Capacity Planning",
        desc: "Using transparent rule-based profiling to balance accelerator count, memory bandwidth, and power distribution envelopes.",
      },
    ],
    interactiveType: "capacity-config",
  },
  {
    num: 8,
    id: "regional-economics",
    title: "Regional Economic Impact: Decentralized Compute Corridors",
    subtitle: "Land, Power, and Capital Arbitrage across South India's 25 Key Data Center Nodes",
    readTimeMinutes: 9,
    summary:
      "A quantitative examination of the economic advantages of South Indian secondary compute corridors, detailing power tariff structures, land cost arbitrage, and sovereign regional AI enablement.",
    paragraphs: [
      "The ongoing operational expenditure of an AI computing facility is overwhelmingly dominated by electrical energy tariffs. Over a 5-year hardware lifecycle, the cost of power consumed by high-density accelerators frequently exceeds the initial purchase price of the servers themselves.",
      "In congested tier-1 metros, commercial industrial power tariffs remain high (often exceeding ₹8.50 to ₹10.00 per kWh), compounded by steep real estate lease rates and high water tariffs. By establishing facilities in regional industrial corridors across Tamil Nadu, Karnataka, Kerala, and Andhra Pradesh, operators achieve substantial cost arbitrage:",
      "• 30% to 45% reduction in real estate acquisition and civil construction costs.\n• Proximity to dedicated green power generation corridors: high-capacity wind belts in Tirunelveli and Coimbatore, and mega-scale solar parks in Pavagada and Kamuthi.\n• Substantial concessions and expedited single-window approvals from state industrial development corporations (SIPCOT, KIADB, KINFRA).",
      "Beyond direct operator savings, regional compute corridors stimulate local high-technology ecosystems. Decentralized AI infrastructure provides high-performance compute access for local precision manufacturing, regional vernacular language models, agricultural telemetry, and healthcare research institutions without incurring prohibitive metropolitan transit fees.",
    ],
    keyPrinciples: [
      {
        title: "Cost Arbitrage",
        desc: "Achieving dramatic OpEx savings through lower regional power tariffs, reduced land costs, and municipal tax incentives.",
      },
      {
        title: "Clean Energy Proximity",
        desc: "Minimizing transmission wheeling charges by co-locating near major wind and solar generation zones.",
      },
      {
        title: "Regional Economic Multiplier",
        desc: "Catalyzing high-skilled engineering jobs and sovereign AI innovation clusters in secondary cities.",
      },
    ],
    interactiveType: "regional-mining",
  },
  {
    num: 9,
    id: "environmental-accounting",
    title: "Environmental Accounting: Real-Time Carbon & PUE Metrics",
    subtitle: "Moving Beyond Paper Carbon Offsets to 24/7 Carbon-Free Energy Matching",
    readTimeMinutes: 8,
    summary:
      "True environmental accountability requires granular, hourly matching between compute energy draw and local clean generation. Transparent mathematical modeling of PUE, WUE, and real-time grid emissions.",
    paragraphs: [
      "Historically, corporate data center sustainability claims relied heavily on retrospective annual purchases of Renewable Energy Certificates (RECs) or unbundled carbon credits. Under this model, a facility could consume coal-heavy power during midnight peak demand hours and 'offset' it with surplus solar credits generated hundreds of miles away at noon.",
      "In the era of gigawatt-scale AI computing, this paper-based approach is increasingly recognized as greenwashing. GreenNext champions true environmental accounting based on 24/7 Carbon-Free Energy (CFE) matching. Under this framework, every megawatt-hour of computing load is matched on an hourly basis with genuine zero-carbon generation delivered across the regional grid.",
      "GreenNext tracks three primary environmental performance indicators with auditable mathematical transparency:",
      "1. Power Usage Effectiveness (PUE): The ratio of total facility power to IT compute load, targeting 1.15 in optimized warm-water DLC facilities.\n2. Water Usage Effectiveness (WUE): Liters of water consumed per kWh of IT load, driven toward zero through closed-circuit dry cooling loops.\n3. Carbon Intensity Factor (CIF): Real-time tracking of grams of CO₂ emitted per kilowatt-hour from the regional transmission grid.",
      "By integrating real-time carbon intensity feeds into workload schedulers, non-urgent batch training jobs can be automatically throttled during high-carbon grid hours and accelerated when local wind and solar production surge.",
    ],
    keyPrinciples: [
      {
        title: "Hourly 24/7 Matching",
        desc: "Synchronizing computing power demand with real-time localized clean energy generation.",
      },
      {
        title: "Water Conservation",
        desc: "Prioritizing closed-loop hydronics to protect precious regional municipal water aquifers in tropical zones.",
      },
      {
        title: "Carbon-Aware Scheduling",
        desc: "Modulating batch training compute intensity based on streaming regional grid emissions telemetry.",
      },
    ],
    interactiveType: "energy-calc",
  },
  {
    num: 10,
    id: "strategic-roadmap",
    title: "Strategic Roadmap: Transitioning from Legacy DC to AI Infrastructure",
    subtitle: "Phased Brownfield Retrofitting and Zero-Trust Hardware Governance",
    readTimeMinutes: 9,
    summary:
      "A structured 4-phase engineering roadmap enabling existing data center operators to retrofit legacy facilities for high-density AI compute while enforcing rigorous hardware-rooted zero-trust cybersecurity.",
    paragraphs: [
      "Enterprise infrastructure operators cannot simply discard billions of dollars in existing data center assets to build greenfield facilities. The strategic imperative is executing a structured, risk-mitigated transition roadmap that retrofits legacy facilities to host accelerated AI compute without disrupting ongoing operations.",
      "The GreenNext Strategic Transition Roadmap establishes four distinct execution phases:",
      "• Phase 1 – Structural & Electrical Feasibility Audit: Evaluating ceiling heights, slab floor loading capacity (AI liquid racks weigh 1,500 kg to 2,000 kg), and auditing incoming medium-voltage utility transformer headroom.\n• Phase 2 – In-Row Hybrid Liquid Retrofitting: Introducing modular in-row Coolant Distribution Units (CDUs) and Rear-Door Heat Exchangers (RDHx) to existing rows, increasing density from 10 kW to 45 kW per rack without civil wall modifications.\n• Phase 3 – Electrical Substation & Storage Integration: Upgrading overhead busways, installing solid-state transfer switches, and integrating dedicated rack-level or containerized BESS modules to buffer tensor load transients.\n• Phase 4 – Autonomous Telemetry & Zero-Trust Defense: Deploying continuous high-frequency environmental sensors and implementing hardware-rooted zero-trust security across all server BMCs, out-of-band management switches, and facility controls.",
      "Security is an inseparable pillar of sovereign AI infrastructure. AI models and training datasets represent irreplaceable intellectual property. GreenNext enforces defense-in-depth zero-trust architectures: strict physical access control, air-gapped out-of-band management networks, encrypted-at-rest model weights, and hardware root-of-trust (RoT) verification for every server boot sequence.",
    ],
    keyPrinciples: [
      {
        title: "Brownfield Viability",
        desc: "Tripling rack compute density in existing enterprise data halls through modular liquid cooling retrofits.",
      },
      {
        title: "Hardware Root-of-Trust",
        desc: "Cryptographically verifying firmware integrity and securing out-of-band management networks from external intrusion.",
      },
      {
        title: "Phased Capital Investment",
        desc: "Aligning CapEx commitments with verified enterprise AI workload adoption over a structured 36-month timeline.",
      },
    ],
    interactiveType: "cybersecurity",
  },
];

export function EbookReaderPage() {
  const session = Route.useLoaderData() as EbookSessionState;
  const navigate = useNavigate();
  const [activeChapterNum, setActiveChapterNum] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Development-only preview mode: allows local inspection of all 10 chapters without requiring login.
  // In production builds / Vercel, isEbookDevPreview() evaluates to false and authentication is strictly enforced.
  const isDevPreview = Boolean(session?.isDevPreview || isEbookDevPreview());

  const currentChapter =
    CHAPTERS.find((c) => c.num === activeChapterNum) || CHAPTERS[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutEbook();
      navigate({ to: "/ebook" });
    } finally {
      setLoggingOut(false);
    }
  };

  const handlePrev = () => {
    if (activeChapterNum > 1) {
      setActiveChapterNum((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (activeChapterNum < CHAPTERS.length) {
      setActiveChapterNum((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // If not authenticated and not in development preview mode, render locked view with CTA to sign in
  if (!isDevPreview && (!session?.authenticated || !session?.user)) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full border border-[#1E293B] bg-[#0A0F1D] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 bg-[#10B981]/15 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Authentication Required</h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              This publication is restricted to verified GreenNext readers. Please sign in or register to access the full 10-chapter interactive research edition.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/ebook/auth"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all shadow-lg shadow-[#10B981]/20"
            >
              Sign In or Register &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but email unverified and not in development preview mode, render verification gate
  if (!isDevPreview && !session?.emailVerified) {
    return (
      <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full border border-[#1E293B] bg-[#0A0F1D] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 bg-[#F59E0B]/15 text-[#F59E0B] rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Email Verification Required</h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Your account (<strong className="text-white">{session?.user?.email || "Reader"}</strong>) is not yet verified. Please enter the 6-digit verification code sent to your inbox to unlock ebook reading.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/ebook/verify-otp"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all shadow-lg shadow-[#10B981]/20"
            >
              Enter Verification Code &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (activeChapterNum / CHAPTERS.length) * 100
  );

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex flex-col selection:bg-[#10B981]/30 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#1E293B] bg-[#0A0F1D]/95 backdrop-blur px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white text-xs"
            aria-label="Toggle Table of Contents"
          >
            <Compass className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Intelligent Infrastructure
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                Edition 2.0
              </span>
            </div>
            <div className="text-[11px] text-[#64748B]">
              {isDevPreview ? (
                <span className="text-[#10B981] font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Local Dev Preview &bull; All 10 Chapters Unlocked
                </span>
              ) : (
                <>
                  Verified Reader:{" "}
                  <span className="text-[#94A3B8] font-medium">
                    {session?.user?.displayName || session?.user?.email || "Reader"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Note: Placeholder PDF is not offered to prevent misleading users */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-[#1E293B]/80 text-[#94A3B8] border border-[#334155]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Authoritative Interactive Web Edition
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white border border-[#334155] transition-all disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#0A0F1D] h-1.5 border-b border-[#1E293B] sticky top-[61px] z-30">
        <div
          className="bg-gradient-to-r from-[#10B981] to-[#38BDF8] h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Table of Contents Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 lg:static w-80 bg-[#0A0F1D] border-r border-[#1E293B] p-4 space-y-6 overflow-y-auto transform transition-transform duration-200 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between lg:block">
            <div className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
              Table of Contents
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-xs text-[#94A3B8] hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-xs">
            <div className="flex justify-between text-[#94A3B8] mb-1 font-mono text-[11px]">
              <span>Reading Progress</span>
              <span>
                {activeChapterNum} of {CHAPTERS.length} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#10B981] h-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            {CHAPTERS.map((ch) => {
              const isActive = ch.num === activeChapterNum;
              return (
                <button
                  key={ch.num}
                  type="button"
                  onClick={() => {
                    setActiveChapterNum(ch.num);
                    setSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-3 ${
                    isActive
                      ? "bg-[#10B981]/15 text-white font-semibold border border-[#10B981]/40 shadow-sm"
                      : "text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white border border-transparent"
                  }`}
                >
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${
                      isActive
                        ? "bg-[#10B981] text-[#070A0E]"
                        : "bg-[#1E293B] text-[#94A3B8]"
                    }`}
                  >
                    {String(ch.num).padStart(2, "0")}
                  </span>
                  <div className="flex-1 leading-snug">
                    <div className="line-clamp-2">{ch.title}</div>
                    <div className="text-[10px] text-[#64748B] font-mono mt-1 flex items-center gap-1.5">
                      <span>{ch.readTimeMinutes} min read</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#1E293B] text-center text-xs text-[#64748B]">
            GreenNext Research Publication &bull; 2026
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chapter Content Area */}
        <main className="flex-1 bg-[#050811] px-4 py-8 sm:px-8 sm:py-12 lg:px-12 max-w-5xl mx-auto w-full space-y-12">
          {/* Chapter Header */}
          <div className="border-b border-[#1E293B] pb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/25">
                Module {String(currentChapter.num).padStart(2, "0")} of 10
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                {currentChapter.readTimeMinutes} min read &bull; Edition 2.0
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {currentChapter.title}
            </h1>

            <p className="text-base sm:text-lg text-[#38BDF8] font-medium leading-relaxed">
              {currentChapter.subtitle}
            </p>

            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs text-[#94A3B8] leading-relaxed">
              <strong className="text-white block mb-1">Executive Summary:</strong>
              {currentChapter.summary}
            </div>
          </div>

          {/* Substantive Prose Paragraphs */}
          <section className="space-y-6 text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
            {currentChapter.paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </section>

          {/* Key Principles Cards */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono text-xs text-[#10B981]">
              Architectural Takeaways &amp; Core Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentChapter.keyPrinciples.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0A0F1D] border border-[#1E293B] space-y-2 hover:border-[#10B981]/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Embedded Native Interactive Chapter Tools */}
          <section className="space-y-4 pt-4 border-t border-[#1E293B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Interactive Chapter Research Tool
                </h2>
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                Live React Component
              </span>
            </div>

            <div className="rounded-2xl border border-[#1E293B] bg-[#0A0F1D] p-4 sm:p-6 shadow-2xl overflow-hidden">
              {/* Dynamic Chapter Tool Render */}
              {currentChapter.interactiveType === "ai-cooling" && (
                <div className="space-y-6">
                  <div className="text-xs text-[#94A3B8]">
                    Explore the connected co-design flow from AI workload requirements down to thermal heat extraction and power delivery.
                  </div>
                  <AiComputeCoolingInfographic />
                </div>
              )}

              {currentChapter.interactiveType === "regional-topology" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Regional Interconnect Topology
                    </h3>
                    <RegionalTopologyInfographic />
                  </div>
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      South India Multi-Node Regional Explorer
                    </h3>
                    <RegionalExplorer />
                  </div>
                </div>
              )}

              {currentChapter.interactiveType === "power-reliability" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Substation to Rack Power Metering Levels
                    </h3>
                    <PowerMonitoringInfographic />
                  </div>
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Power Reliability &amp; Redundancy Simulator
                    </h3>
                    <PowerReliabilityModel />
                  </div>
                </div>
              )}

              {currentChapter.interactiveType === "cooling-calc" && (
                <div className="space-y-4">
                  <div className="text-xs text-[#94A3B8]">
                    Simulate fluid velocity, delta-T temperature rises, and cooling loop thermal rejection across high-density liquid workloads.
                  </div>
                  <CoolingEfficiencyCalculator />
                </div>
              )}

              {currentChapter.interactiveType === "seven-layer" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Interactive 7-Layer Operational Stack
                    </h3>
                    <SevenLayerStack />
                  </div>
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Infrastructure Layer Planning Inspector
                    </h3>
                    <ArchitectureExplorer />
                  </div>
                </div>
              )}

              {currentChapter.interactiveType === "automation" && (
                <div className="space-y-4">
                  <div className="text-xs text-[#94A3B8]">
                    Step through the closed-loop telemetry pipeline: from high-frequency sensor ingestion to automated anomaly mitigation.
                  </div>
                  <AutomationWorkflow />
                </div>
              )}

              {currentChapter.interactiveType === "capacity-config" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Cluster Capacity &amp; Rack Density Headroom
                    </h3>
                    <CapacityUtilizationModel />
                  </div>
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Workload Profile Configurator
                    </h3>
                    <InfrastructureConfigurator />
                  </div>
                </div>
              )}

              {currentChapter.interactiveType === "regional-mining" && (
                <div className="space-y-4">
                  <div className="text-xs text-[#94A3B8]">
                    Search, filter, and inspect 25 verified South Indian data center facilities across Tamil Nadu, Karnataka, Kerala, and Andhra Pradesh.
                  </div>
                  <InfrastructureDataExplorer />
                </div>
              )}

              {currentChapter.interactiveType === "energy-calc" && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Interactive Workload Energy &amp; Carbon Calculator
                    </h3>
                    <EnergyImpactCalculator />
                  </div>
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                      Power Usage Effectiveness (PUE) Auditor
                    </h3>
                    <PueCalculator />
                  </div>
                </div>
              )}

              {currentChapter.interactiveType === "cybersecurity" && (
                <div className="space-y-4">
                  <div className="text-xs text-[#94A3B8]">
                    Inspect hardware root-of-trust, out-of-band management network isolation, and zero-trust controls across every layer.
                  </div>
                  <CybersecurityFramework />
                </div>
              )}
            </div>
          </section>

          {/* Bottom Pagination Controls */}
          <div className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeChapterNum <= 1}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold border border-[#334155] bg-[#0A0F1D] hover:bg-[#1E293B] text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Module
            </button>

            {/* Quick jump chapter indicator dots */}
            <div className="flex items-center gap-1.5">
              {CHAPTERS.map((c) => (
                <button
                  key={c.num}
                  type="button"
                  onClick={() => {
                    setActiveChapterNum(c.num);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={c.title}
                  className={`w-3 h-3 rounded-full transition-all ${
                    c.num === activeChapterNum
                      ? "bg-[#10B981] scale-125 shadow-sm shadow-[#10B981]"
                      : "bg-[#1E293B] hover:bg-[#334155]"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={activeChapterNum >= CHAPTERS.length}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-[#070A0E] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-[#10B981]/20"
            >
              Next Module
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
