import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Network,
  Zap,
  Cpu,
  Database,
  Snowflake,
  Server,
  Activity,
  ShieldCheck,
  Layers,
  Gauge,
  Building2,
  CircuitBoard,
  ChevronRight,
  Radio,
} from "../icons";
import {
  AI_COMPUTE_COOLING_LAYERS,
  POWER_METERING_LEVELS,
  REGIONAL_TOPOLOGY_EDGES,
  REGIONAL_TOPOLOGY_NODES,
  SUSTAINABILITY_PILLARS,
  type InfographicStep,
} from "../../data/infrastructureInfographics";

const shell = "rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-5 sm:p-8 shadow-2xl relative overflow-hidden";
const eyebrow = "font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#10B981]";
const muted = "text-sm leading-relaxed text-[#94A3B8]";

interface StepDetail {
  purpose: string;
  itemsLabel: string;
  items: string[];
  specs?: { label: string; value: string }[];
}

const STEP_DETAILS: Record<string, StepDetail> = {
  workloads: {
    purpose: "Frame workload characteristics and duty cycles before sizing dependent infrastructure.",
    itemsLabel: "Key Engineering Inputs",
    items: [
      "AI model training batch patterns & inference concurrency",
      "Per-accelerator power swing profiles (150W idle to 700W+ burst)",
      "Strict latency SLA and packet-loss zero tolerance bounds",
    ],
    specs: [
      { label: "Target Density", value: "40kW – 100kW / Rack" },
      { label: "Duty Cycle", value: "95%+ Sustained Compute" },
      { label: "Tolerance", value: "Zero Packet Drop" },
    ],
  },
  accelerators: {
    purpose: "Connect accelerator cluster selection to rack density, power delivery, and thermal dissipation.",
    itemsLabel: "Engineered Subsystems",
    items: [
      "High-density 8x GPU SXM / OAM chassis with liquid cold plates",
      "Sub-millisecond inter-GPU interconnect fabrics (NVLink / PCIe Gen5)",
      "Redundant 54V/12V DC-DC high-efficiency busbar converters",
    ],
    specs: [
      { label: "Die Heat Flux", value: "> 100 W/cm²" },
      { label: "Voltage Feed", value: "415V 3-Phase -> 54V DC" },
      { label: "Busbar Rating", value: "1000A Solid Copper" },
    ],
  },
  compute: {
    purpose: "Coordinate compute, parallel NVMe storage tiers, and fabric boundaries as a unified system.",
    itemsLabel: "Architectural Elements",
    items: [
      "High-core density host CPUs with RDMA offload engines",
      "All-NVMe parallel file systems supporting GPUDirect Storage",
      "Dual-port 400G/800G network interface controllers per node",
    ],
    specs: [
      { label: "I/O Throughput", value: "200+ GB/s per Chassis" },
      { label: "Memory Bandwidth", value: "3.2+ TB/s HBM3e" },
      { label: "Interconnect", value: "Lossless RoCEv2 / IB" },
    ],
  },
  power: {
    purpose: "Make electrical dependencies visible to capacity, redundancy, and resilience planning.",
    itemsLabel: "Power Delivery Path",
    items: [
      "Dual 2N utility substation feeds with automated source-transfer",
      "Modular double-conversion UPS with lithium-ion / flywheel energy reserve",
      "Overhead smart-track busway enabling rapid circuit tap insertion",
    ],
    specs: [
      { label: "Topology", value: "2N Distributed Redundant" },
      { label: "Efficiency", value: "97.5% Double-Conversion" },
      { label: "Power Factor", value: "> 0.99 at Full Load" },
    ],
  },
  cooling: {
    purpose: "Match direct-to-chip and facility cooling choices to heat density, water availability, and maintainability.",
    itemsLabel: "Thermal Transport Loop",
    items: [
      "Closed-loop direct-to-chip microchannel copper cold plates",
      "In-row Coolant Distribution Units (CDUs) with redundant N+1 variable pumps",
      "High-efficiency dry cooler heat exchangers operating with zero water consumption",
    ],
    specs: [
      { label: "Supply Temp", value: "32°C – 45°C Water" },
      { label: "Target PUE", value: "< 1.25 Annually" },
      { label: "Water Metric", value: "WUE = 0.00 L/kWh (Dry)" },
    ],
  },
  automation: {
    purpose: "Correlate telemetry signals across infrastructure layers to drive automated pacing and alerting.",
    itemsLabel: "Telemetry & Control Points",
    items: [
      "Sub-second IPMI/Redfish electrical and thermal sensor polling",
      "Predictive thermal runaway detection with automated load migration",
      "Workload pacing aligned with facility thermal headroom and power tariffs",
    ],
    specs: [
      { label: "Polling Rate", value: "100ms Telemetry Stream" },
      { label: "Response", value: "< 2s Automated Pacing" },
      { label: "Architecture", value: "Edge-Agent Anomaly ML" },
    ],
  },
  network: {
    purpose: "Ensure low-latency deterministic east-west communication between regional clusters.",
    itemsLabel: "Fabric Specifications",
    items: [
      "Non-blocking 800G spine-leaf topology with Priority Flow Control (PFC)",
      "Explicit Congestion Notification (ECN) avoiding buffer-bloat dropouts",
      "Carrier-neutral multi-path regional transit corridors across South India",
    ],
    specs: [
      { label: "Latency", value: "< 1.2µs Port-to-Port" },
      { label: "Bisection", value: "100% Non-Blocking" },
      { label: "Inter-City", value: "Sub-5ms South India Corridors" },
    ],
  },
  facility: {
    purpose: "Establish the electrical boundary for whole-facility energy reconciliation and utility intertie.",
    itemsLabel: "Substation & Facility Metering",
    items: [
      "Utility 110kV / 33kV incoming feed revenue meters (Class 0.2s accuracy)",
      "Main vacuum circuit breaker telemetry and power quality analyzers",
      "Whole-facility active, reactive, and apparent power logging",
    ],
    specs: [
      { label: "Incomer Class", value: "0.2s Utility Revenue" },
      { label: "Feed Voltage", value: "33kV / 110kV Dual" },
      { label: "Boundary", value: "Total Facility Power (P_total)" },
    ],
  },
  substation: {
    purpose: "Observe medium-voltage transformation and uninterruptible power backup boundaries.",
    itemsLabel: "Conditioning & Transformer Points",
    items: [
      "Cast-resin dry-type transformer temperature and loading sensors",
      "Static Transfer Switch (STS) millisecond failover monitors",
      "UPS input, bypass, output, and battery string health telemetry",
    ],
    specs: [
      { label: "Transformers", value: "Cast-Resin Dry Type" },
      { label: "UPS Topology", value: "2N Distributed Modular" },
      { label: "Transfer Time", value: "< 4ms Seamless STS" },
    ],
  },
  "electrical-room": {
    purpose: "Correlate room, row, and busway distribution with downstream server room load planning.",
    itemsLabel: "Row & Busway Distribution",
    items: [
      "Medium voltage switchboards with intelligent digital protective relays",
      "Overhead continuous plug-in track busways with integral current sensors",
      "Row-level Power Distribution Units (PDUs) with branch circuit isolation",
    ],
    specs: [
      { label: "Busway Feed", value: "415V / 800A – 1600A" },
      { label: "Granularity", value: "Per-Tap Box Current" },
      { label: "Harmonics", value: "THD Monitoring < 3%" },
    ],
  },
  rack: {
    purpose: "Relate rack-level power consumption directly to IT compute output and PUE calculation.",
    itemsLabel: "Rack Telemetry Points",
    items: [
      "Dual intelligent monitored/switched rack PDUs (A + B feed)",
      "Per-receptacle kWh metering and server power supply telemetry",
      "Baseboard Management Controller (BMC) power capping interfaces",
    ],
    specs: [
      { label: "PDU Input", value: "415V 32A/63A 3-Phase" },
      { label: "Accuracy", value: "±1% True RMS Billing Grade" },
      { label: "Boundary", value: "IT Equipment Power (P_IT)" },
    ],
  },
  energy: {
    purpose: "Define an energy boundary before comparing efficiency, carbon impact, or operational PUE.",
    itemsLabel: "Planning Indicators",
    items: [
      "Rigorous PUE boundary formulation adhering strictly to Green Grid Level 2/3",
      "Separation of baseline facility energy from workload-correlated dynamic power",
      "Continuous verification of power factor and harmonic distortion across feeds",
    ],
    specs: [
      { label: "Methodology", value: "Green Grid ISO/IEC 30134-2" },
      { label: "Target Band", value: "1.15 – 1.25 PUE" },
      { label: "Verification", value: "Automated Reconciliation" },
    ],
  },
  "thermal-efficiency": {
    purpose: "Evaluate cooling thermodynamics to minimize auxiliary parasitic energy overhead.",
    itemsLabel: "Thermal Envelopes",
    items: [
      "ASHRAE TC 9.9 thermal guideline compliance for high-density liquid loops",
      "Secondary loop heat capture operating at high supply temperatures (>40°C)",
      "Zero-compressor economizer cooling enabled across seasonal South India nights",
    ],
    specs: [
      { label: "Thermal Standard", value: "ASHRAE TC 9.9 W3/W4" },
      { label: "Economizer", value: "Dry-Cooler Free Cooling" },
      { label: "Delta-T", value: "10°C – 15°C Across Cold Plates" },
    ],
  },
  water: {
    purpose: "Incorporate local water conservation and strict regional resource safeguards.",
    itemsLabel: "Hydrological Safeguards",
    items: [
      "Zero-evaporative dry cooling architecture eliminating municipal water consumption",
      "Closed-loop dielectric/glycol fluid circulation with leak detection containment",
      "Water Usage Effectiveness (WUE) maintained at near-zero operating levels",
    ],
    specs: [
      { label: "Target WUE", value: "0.00 L/kWh (Closed-Loop)" },
      { label: "Fluid Type", value: "Inhibited Propylene Glycol" },
      { label: "Leak Sensor", value: "Continuous Rope Sensing" },
    ],
  },
  renewables: {
    purpose: "Model green power pairing with regional transmission and clean energy corridors.",
    itemsLabel: "Grid & PPA Pathways",
    items: [
      "Solar-wind hybrid PPA matching in southern Tamil Nadu and Karnataka corridors",
      "Battery Energy Storage System (BESS) peak-shaving and transient absorption",
      "Real-time grid emissions factor tracking to pace non-urgent batch AI training",
    ],
    specs: [
      { label: "Corridors", value: "Tirunelveli & Coimbatore Wind" },
      { label: "Contracting", value: "Wheeling & Group Captive PPAs" },
      { label: "Storage", value: "Lithium Iron Phosphate (LFP)" },
    ],
  },
  evidence: {
    purpose: "Make every sustainability statement verifiable, transparent, and auditable.",
    itemsLabel: "Audit & Verification",
    items: [
      "Transparent classification: Distinguish conceptual planning from live telemetry",
      "Clear boundary definitions for Scope 1, Scope 2, and Scope 3 carbon reporting",
      "Independent validation standards for energy performance claims",
    ],
    specs: [
      { label: "Governance", value: "GHG Protocol Corporate Standard" },
      { label: "Integrity", value: "No Unverified Offsets" },
      { label: "Reporting", value: "Third-Party Reconciled" },
    ],
  },
};

function StepDetailPanel({ step }: { step: InfographicStep }) {
  const detail = STEP_DETAILS[step.id] ?? {
    purpose: step.description,
    itemsLabel: "Planning Specifications",
    items: [],
  };

  return (
    <div className="rounded-xl border border-[#10B981]/30 bg-[#121824] p-5 sm:p-6 shadow-xl" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#10B981] font-semibold">
            Active Architectural Inspection
          </span>
          <h3 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">{step.title}</h3>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold">
          {step.evidence}
        </span>
      </div>

      <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#CBD5E1]">{detail.purpose}</p>

      {/* Technical Metric Badges if available */}
      {detail.specs && detail.specs.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {detail.specs.map((spec) => (
            <div key={spec.label} className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">{spec.label}</span>
              <span className="text-xs font-mono font-bold text-[#38BDF8] mt-0.5 block">{spec.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#10B981] font-semibold block mb-2">
          {detail.itemsLabel}
        </span>
        <ul className="grid gap-2 text-xs text-[#94A3B8] sm:grid-cols-3">
          {detail.items.map((item) => (
            <li key={item} className="flex items-start gap-2 p-2 rounded-lg bg-[#0B0F17]/60 border border-[#1E293B]/60">
              <span className="text-[#10B981] font-bold mt-0.5" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AI COMPUTE & COOLING ARCHITECTURE INFOGRAPHIC
// ─────────────────────────────────────────────────────────────────────────────

export function AiComputeCoolingInfographic() {
  const [selected, setSelected] = useState(AI_COMPUTE_COOLING_LAYERS[0]!.id);
  const selectedStep =
    AI_COMPUTE_COOLING_LAYERS.find((step) => step.id === selected) ?? AI_COMPUTE_COOLING_LAYERS[0]!;

  return (
    <section className={shell} aria-labelledby="ai-compute-cooling-title">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <span className={eyebrow}>Enterprise Technical Infographic</span>
          <span className="text-[10px] font-mono text-[#64748B]">&bull; Integrated Systems</span>
        </div>
        <h2 id="ai-compute-cooling-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          AI Compute, Power & Liquid Cooling Co-Design
        </h2>
        <p className={`mt-2 ${muted}`}>
          High-density AI workloads require coordinated planning across accelerator chassis, 415V power distribution, direct-to-chip liquid cooling, and lossless network fabrics.
        </p>
      </div>

      {/* Modern High-Tech Diagram Flow */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6">
        {AI_COMPUTE_COOLING_LAYERS.map((step, index) => {
          const isSelected = step.id === selected;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setSelected(step.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                isSelected
                  ? "bg-[#12261F] border-[#10B981] shadow-lg shadow-[#10B981]/15 ring-1 ring-[#10B981]"
                  : "bg-[#121824] border-[#1E293B] hover:border-[#334155] hover:bg-[#161E2E]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#10B981]" : "text-[#64748B]"}`}>
                    0{index + 1}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#10B981] transition-colors leading-tight">
                  {step.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1E293B]/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#94A3B8] truncate max-w-[85px]">{step.id}</span>
                <ChevronRight size={12} className={isSelected ? "text-[#10B981]" : "text-[#475569]"} />
              </div>
            </button>
          );
        })}
      </div>

      <StepDetailPanel step={selectedStep} />

      <div className="mt-6 pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#10B981]" />
          <span>Factual standard: Conceptual engineering model based on industry reference architectures.</span>
        </div>
        <span className="font-mono">P_Total = P_IT + P_Cooling + P_Electrical_Loss</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POWER MONITORING HIERARCHY INFOGRAPHIC (SINGLE-LINE DIAGRAM)
// ─────────────────────────────────────────────────────────────────────────────

export function PowerMonitoringInfographic() {
  const [selected, setSelected] = useState(POWER_METERING_LEVELS[0]!.id);
  const selectedStep =
    POWER_METERING_LEVELS.find((step) => step.id === selected) ?? POWER_METERING_LEVELS[0]!;

  return (
    <section className={shell} aria-labelledby="power-metering-title">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <span className={eyebrow}>Electrical Distribution & Telemetry</span>
          <span className="text-[10px] font-mono text-[#64748B]">&bull; Single-Line Topology</span>
        </div>
        <h2 id="power-metering-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Four-Level Power Telemetry & Distribution Hierarchy
        </h2>
        <p className={`mt-2 ${muted}`}>
          Trace electrical flow from high-voltage substation feeds through 2N transformers, overhead track busways, and intelligent rack PDUs with clear PUE boundary instrumentation.
        </p>
      </div>

      {/* Visual Single-Line Electrical Steps */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {POWER_METERING_LEVELS.map((step, index) => {
          const isSelected = step.id === selected;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setSelected(step.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                isSelected
                  ? "bg-[#1E2117] border-[#F59E0B] shadow-lg shadow-[#F59E0B]/15 ring-1 ring-[#F59E0B]"
                  : "bg-[#121824] border-[#1E293B] hover:border-[#334155] hover:bg-[#161E2E]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#F59E0B]">
                    STAGE 0{index + 1}
                  </span>
                  <Zap size={15} className={isSelected ? "text-[#F59E0B]" : "text-[#64748B]"} />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#F59E0B] transition-colors leading-snug mb-1">
                  {step.title}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B]/80 flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                <span>METERING POINT</span>
                <span className={isSelected ? "text-[#F59E0B] font-bold" : "text-[#94A3B8]"}>
                  {isSelected ? "Active Inspect" : "Inspect →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <StepDetailPanel step={selectedStep} />

      <div className="mt-6 pt-4 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#F59E0B]" />
          <span>Metering accuracy standard: Revenue Class 0.2s at facility intertie, Class 1.0 at rack PDUs.</span>
        </div>
        <span className="font-mono text-[#F59E0B]">PUE = P_Total(Facility) / P_IT(Rack Level)</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REGIONAL NETWORK TOPOLOGY INFOGRAPHIC
// ─────────────────────────────────────────────────────────────────────────────

export function RegionalTopologyInfographic() {
  const [selected, setSelected] = useState("madurai");
  const selectedNode =
    REGIONAL_TOPOLOGY_NODES.find((node) => node.id === selected) ?? REGIONAL_TOPOLOGY_NODES[0]!;
  const nodeMap = new Map(REGIONAL_TOPOLOGY_NODES.map((node) => [node.id, node]));

  return (
    <section className={shell} aria-labelledby="regional-topology-title">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <span className={eyebrow}>South India Network Fabric</span>
          <span className="text-[10px] font-mono text-[#64748B]">&bull; 7 Regional Planning Nodes</span>
        </div>
        <h2 id="regional-topology-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Regional Interconnect & Digital Topology Map
        </h2>
        <p className={`mt-2 ${muted}`}>
          Examine conceptual inter-city transit paths connecting Madurai, Coimbatore, Trichy, Mangalore, Hosur, Tirunelveli, and Puducherry for low-latency decentralized compute.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* SVG Network Map (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#1E293B] bg-[#070A0E] p-4 sm:p-6 shadow-inner relative">
          <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-[#64748B]">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <Radio size={12} className="animate-pulse" />
              TOPOLOGY GRID REFERENCE
            </span>
            <span>SOUTH INDIA CORRIDORS</span>
          </div>

          <svg
            viewBox="0 0 100 90"
            className="h-auto w-full max-h-[380px]"
            role="img"
            aria-label="Conceptual relationship diagram connecting seven regional planning nodes"
          >
            <title>South India Regional Topology Map</title>
            {/* Ambient Background Grid Lines */}
            <defs>
              <pattern id="topoGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1E293B" strokeWidth="0.3" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100" height="90" fill="url(#topoGrid)" />

            {/* Inter-node corridors / edges */}
            {REGIONAL_TOPOLOGY_EDGES.map(([from, to]) => {
              const a = nodeMap.get(from)!;
              const b = nodeMap.get(to)!;
              const isRelevant = from === selected || to === selected;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isRelevant ? "#10B981" : "#1E293B"}
                  strokeWidth={isRelevant ? "1.2" : "0.7"}
                  strokeDasharray={isRelevant ? "none" : "2 2"}
                  opacity={isRelevant ? 1 : 0.6}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Nodes */}
            {REGIONAL_TOPOLOGY_NODES.map((node) => {
              const isSelected = node.id === selected;
              return (
                <g
                  key={node.id}
                  onClick={() => setSelected(node.id)}
                  className="cursor-pointer group"
                >
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r="6" fill="#10B981" opacity="0.25" className="animate-ping" />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 4 : 2.8}
                    fill={isSelected ? "#10B981" : "#121824"}
                    stroke={isSelected ? "#A7F3D0" : "#38BDF8"}
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="transition-all duration-200"
                  />
                  <text
                    x={node.x + 4.5}
                    y={node.y + 1.2}
                    fill={isSelected ? "#10B981" : "#CBD5E1"}
                    fontSize="3.2"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="mt-4 pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#64748B]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                Selected Node
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#121824] border border-[#38BDF8]" />
                Planning Node
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#10B981]" />
                Corridor Intertie
              </span>
            </div>
            <span className="font-mono">7 Verified Nodes</span>
          </div>
        </div>

        {/* Selected Node Profile (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-[#334155] bg-[#121824] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
              <span className="text-[10px] font-mono uppercase text-[#10B981] font-bold">
                Regional Node Dossier
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#070A0E] text-white border border-[#334155]">
                {selectedNode.code}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {selectedNode.name}
            </h3>

            <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
              {selectedNode.planningNote}
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="p-2.5 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Topology Tier</span>
                <span className="font-mono text-white font-semibold">Tier-3 Distributed Node</span>
              </div>
              <div className="p-2.5 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Interconnect Latency</span>
                <span className="font-mono text-[#10B981] font-semibold">&lt; 3.5ms to Chennai / BLR</span>
              </div>
              <div className="p-2.5 rounded-lg border border-[#1E293B] bg-[#0B0F17] flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Clean Power Access</span>
                <span className="font-mono text-[#F59E0B] font-semibold">Grid-Solar / Wind Corridor</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#1E293B] text-[10px] font-mono text-[#64748B]">
            Planning model &bull; Does not assert owned data centre facility.
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LIQUID COOLING ARCHITECTURE INFOGRAPHIC (DIRECT-TO-CHIP & CDU)
// ─────────────────────────────────────────────────────────────────────────────

export function LiquidCoolingArchitectureInfographic() {
  const [activeLoop, setActiveLoop] = useState<"primary" | "cdu" | "coldplate">("coldplate");

  const loops = [
    {
      id: "primary" as const,
      name: "01. Primary Facility Loop",
      desc: "Heat rejection to exterior dry coolers / cooling towers operating with high supply water temperature (30°C–32°C).",
      specs: [
        { label: "Supply Temp", val: "32°C Water" },
        { label: "Cooling Method", val: "Closed-Circuit Dry Coolers" },
        { label: "Water Loss", val: "Zero Evaporative Draw" },
      ],
    },
    {
      id: "cdu" as const,
      name: "02. Coolant Distribution Unit (CDU)",
      desc: "In-row plate heat exchanger separating facility water from high-purity secondary loop circulating to server racks.",
      specs: [
        { label: "Pumping Topology", val: "N+1 Redundant VFD" },
        { label: "Filtration", val: "50-Micron Continuous" },
        { label: "Capacity", val: "Up to 500kW per CDU" },
      ],
    },
    {
      id: "coldplate" as const,
      name: "03. Direct-to-Chip Cold Plates",
      desc: "Microchannel copper heat sinks clamped directly to GPU and CPU dies, capturing 80%–90% of total rack heat directly in liquid.",
      specs: [
        { label: "Capture Ratio", val: "85% Direct to Liquid" },
        { label: "Return Temp", val: "45°C – 55°C Fluid" },
        { label: "Coupling", val: "Dry-Break Drip-Less" },
      ],
    },
  ];

  const current = loops.find((l) => l.id === activeLoop) ?? loops[2]!;

  return (
    <section className={shell} aria-labelledby="liquid-cooling-title">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <span className={eyebrow}>Thermal Engineering</span>
          <span className="text-[10px] font-mono text-[#64748B]">&bull; Liquid Thermodynamics</span>
        </div>
        <h2 id="liquid-cooling-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Direct-to-Chip Liquid Cooling Closed-Loop Schematic
        </h2>
        <p className={`mt-2 ${muted}`}>
          High-density AI clusters generating 40kW–100kW per rack cannot be cooled by ambient air alone. Liquid transport captures concentrated thermal flux with high efficiency.
        </p>
      </div>

      {/* 3-Loop Selector */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {loops.map((loop) => {
          const isSelected = loop.id === activeLoop;
          return (
            <button
              key={loop.id}
              type="button"
              onClick={() => setActiveLoop(loop.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#0C222E] border-[#06B6D4] shadow-lg shadow-[#06B6D4]/15 ring-1 ring-[#06B6D4]"
                  : "bg-[#121824] border-[#1E293B] hover:border-[#334155]"
              }`}
            >
              <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#06B6D4]" : "text-[#64748B]"}`}>
                LOOP TIER
              </span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2 leading-tight">{loop.name}</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">{loop.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active Loop Detail Card */}
      <div className="rounded-xl border border-[#06B6D4]/30 bg-[#121824] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
          <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4] font-semibold">
            {current.name} Specifications
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] font-bold">
            ASHRAE W4 Compliant
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed mb-4">{current.desc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {current.specs.map((s) => (
            <div key={s.label} className="p-3 rounded-lg border border-[#1E293B] bg-[#0B0F17]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">{s.label}</span>
              <span className="text-xs font-mono font-bold text-[#06B6D4] mt-0.5 block">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-[#64748B]">
        <span>Reduces auxiliary cooling overhead from ~35% (legacy chillers) to &lt;8% of total facility energy.</span>
        <span className="font-mono text-[#06B6D4]">Target PUE &le; 1.20</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SUSTAINABILITY PLANNING INFOGRAPHIC
// ─────────────────────────────────────────────────────────────────────────────

export function SustainabilityPlanningInfographic() {
  const [selected, setSelected] = useState(SUSTAINABILITY_PILLARS[0]!.id);
  const selectedStep =
    SUSTAINABILITY_PILLARS.find((step) => step.id === selected) ?? SUSTAINABILITY_PILLARS[0]!;

  return (
    <section className={shell} aria-labelledby="sustainability-planning-title">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <span className={eyebrow}>Environmental Governance</span>
          <span className="text-[10px] font-mono text-[#64748B]">&bull; Verified Evidence Framework</span>
        </div>
        <h2 id="sustainability-planning-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Sustainable Digital Infrastructure Architecture
        </h2>
        <p className={`mt-2 ${muted}`}>
          A rigorous engineering cycle connecting energy visibility, water-free cooling, renewable energy wheeling, and auditable Scope 1–3 reporting standards.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {SUSTAINABILITY_PILLARS.map((step, index) => {
          const isSelected = step.id === selected;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setSelected(step.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#12261F] border-[#10B981] shadow-lg shadow-[#10B981]/15 ring-1 ring-[#10B981]"
                  : "bg-[#121824] border-[#1E293B] hover:border-[#334155]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#10B981]" : "text-[#64748B]"}`}>
                  PILLAR 0{index + 1}
                </span>
                {isSelected && <CheckCircle2 size={13} className="text-[#10B981]" />}
              </div>
              <h4 className="text-xs font-bold text-white leading-tight mb-2 group-hover:text-[#10B981]">
                {step.title}
              </h4>
              <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                {step.description}
              </p>
            </button>
          );
        })}
      </div>

      <StepDetailPanel step={selectedStep} />

      <div className="mt-6 grid gap-4 border-t border-[#1E293B] pt-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]">
          <ShieldCheck size={20} />
        </div>
        <p className="text-xs leading-relaxed text-[#94A3B8]">
          <span className="font-semibold text-white">Verification Standard:</span> GreenNext does not publish speculative carbon offsets. Metrics like PUE, WUE, and clean-energy utilization require physical instrumentation boundaries and auditable billing evidence.
        </p>
      </div>
    </section>
  );
}
