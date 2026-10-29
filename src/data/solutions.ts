export interface SolutionItem {
  id: string;
  code: string;
  title: string;
  eyebrow: string;
  problem: string;
  approach: string;
  expectedValue: string;
  relatedCapabilities: Array<{ label: string; path: string }>;
  cta: { label: string; path: string };
}

export const SOLUTIONS_DATA: Record<string, SolutionItem> = {
  "energy-monitoring": {
    id: "energy-monitoring",
    code: "UC-01",
    title: "Data Center Energy Monitoring",
    eyebrow: "Infrastructure Use Cases · UC-01",
    problem:
      "In high-density AI and cloud compute environments drawing 40 kW to 100+ kW per rack, facility operators frequently lack granular, real-time power visibility at the sub-rack and branch circuit level. Monthly utility billing and aggregate substation meters arrive weeks too late and mask localized phase imbalances, harmonic distortions, and stranded electrical capacity — often forcing conservative 30–40% electrical over-provisioning. In foundation model training clusters and high-throughput transaction engines, unmonitored power swings risk tripping upstream circuit breakers or causing localized voltage sags.",
    approach:
      "Continuous multi-tier power telemetry ingestion standardizes physical sensory streams across substation medium-voltage switchgear, static double-conversion UPS modules, intelligent track busways, and rack-level PDUs. The telemetry engine normalizes Modbus TCP/RTU, BACnet/IP, and SNMPv3 meter registers into synchronized time-series streams, isolating IT compute draw from auxiliary mechanical cooling energy. This feeds automated ISO/IEC 30134-2 Category 1 and Category 2 PUE calculation engines that correlate instantaneous kilowatt consumption with active GPU and CPU server workloads.",
    expectedValue:
      "Operators gain a transparent, continuous electrical profile of facility and rack-level demand, uncovering stranded power margins to safely increase rack compute density without expanding substation interconnect capacity. Note: Measurable energy savings and PUE reductions depend on physical baseline efficiency, IT load factor, and revenue-grade meter calibration; GreenNext presents these as engineering targets rather than guaranteed performance outcomes.",
    relatedCapabilities: [
      { label: "Power Monitoring", path: "/energy/monitoring" },
      { label: "Energy Analytics", path: "/energy/analytics" },
      { label: "Operational Optimization", path: "/energy/optimization" },
    ],
    cta: {
      label: "Discuss Energy Monitoring Requirements →",
      path: "/contact",
    },
  },
  "health-monitoring": {
    id: "health-monitoring",
    code: "UC-02",
    title: "Infrastructure Health Monitoring",
    eyebrow: "Infrastructure Use Cases · UC-02",
    problem:
      "Modern accelerated computing clusters pack dense silicon (700W+ GPUs and high-TDP host processors) into tightly coupled chassis where component degradation, fluid micro-leaks, optical transceiver attenuation, or fan degradation can escalate from a minor warning to catastrophic node failure within minutes. In large-scale distributed AI training runs, a single node hardware crash halts the entire multi-node AllReduce synchronization job, idling megawatts of compute and wasting expensive training hours.",
    approach:
      "Multi-domain telemetry integration pulls out-of-band management signals via Redfish APIs, IPMI 2.0, OpenBMC, and facility environmental sensors into a centralized telemetry pipeline. The system monitors silicon junction temperatures, VRM power phases, memory error-correcting code (ECC) rates, PCIe bandwidth errors, CDU secondary loop flow rates, and rack supply/return air temperatures. Automated cross-layer correlation pinpoints developing hardware faults before they trigger kernel panics or thermal emergency shutdowns.",
    expectedValue:
      "Enables proactive transition from reactive crisis firefighting to planned, orderly node cordon-and-drain maintenance, eliminating silent performance degradation from thermal or power throttling during critical computing operations. Limitations: Out-of-band telemetry depends on server vendor API support and physical sensor calibration; diagnostic signals provide advisory visibility and do not replace mechanical safety fail-safes.",
    relatedCapabilities: [
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Automated Alerts", path: "/automation/alerts" },
    ],
    cta: {
      label: "Discuss Health Monitoring Solutions →",
      path: "/contact",
    },
  },
  "ai-workload-management": {
    id: "ai-workload-management",
    code: "UC-03",
    title: "AI Workload Management",
    eyebrow: "Infrastructure Use Cases · UC-03",
    problem:
      "Large-scale deep learning workloads exhibit extreme operational duality: distributed pre-training runs cause sustained multi-megawatt baseboard power draws and massive heat dissipation, while bursty batch inference generates instantaneous power step-changes (di/dt) that strain facility transformers and secondary fluid loops. Operating AI accelerators without real-time synchronization between cluster orchestrators (Slurm / Kubernetes) and physical facility cooling capacity risks localized thermal runaway, circuit breaker trips, or severe silicon thermal throttling.",
    approach:
      "Telemetry-informed workload orchestration connects compute job queues with real-time facility thermal and electrical headroom signals. The framework evaluates secondary coolant supply temperatures, CDU heat exchange saturation, and rack power limits before dispatching high-TDP model training jobs. For deferrable batch workloads, scheduling algorithms model time-of-use electricity tariffs and grid carbon intensity signals, dynamically pacing compute execution to align with favorable thermal conditions and renewable power availability.",
    expectedValue:
      "Supports cluster operational stability and hardware protection, reducing thermal-induced job interruptions and maximizing compute throughput per megawatt-hour consumed. Factual boundary: Carbon-aware workload shifting and automated scheduler throttling represent conceptual reference frameworks and simulation models; live deployment requires direct integration with tenant cluster schedulers and facility BMS controllers.",
    relatedCapabilities: [
      { label: "AI-Ready Infrastructure", path: "/infrastructure/ai-ready" },
      { label: "Workload-Aware Resources", path: "/energy/workload-aware" },
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
    ],
    cta: {
      label: "Discuss AI Workload Infrastructure →",
      path: "/contact",
    },
  },
  "cooling-optimization": {
    id: "cooling-optimization",
    code: "UC-04",
    title: "Cooling Optimization",
    eyebrow: "Infrastructure Use Cases · UC-04",
    problem:
      "Cooling represents the largest variable auxiliary energy consumer in high-density data centers, frequently accounting for 25% to 40% of non-IT facility power. Fear of thermal throttling causes operators to maintain conservative safety buffers — running chillers at artificially depressed setpoints (e.g., 7°C chilled water) and pumping coolant at maximum volume regardless of compute utilization. In 40 kW to 100 kW+ racks utilizing hybrid air-liquid cooling, this uncalibrated operation wastes megawatts of mechanical power and strains regional water supplies through excessive cooling tower blowdown.",
    approach:
      "Continuous closed-loop thermal calibration connects rack-level heat rejection dynamics with facility chiller plants and secondary fluid networks (SFNs). By monitoring Coolant Distribution Unit (CDU) approach temperatures, plate heat exchanger Delta-T (Return Temp minus Supply Temp), and server chassis cold-plate fluid flow, the system calculates precise heat extraction requirements. Variable-frequency drives (VFD) modulate pump speeds and cooling tower fan velocities to match actual thermodynamic dissipation rather than assumed peak capacities.",
    expectedValue:
      "Eliminates the over-cooling penalty while maintaining strict thermal compliance with ASHRAE TC 9.9 liquid cooling guidelines. Literature benchmarks indicate that optimized liquid-cooled secondary loops can reduce auxiliary mechanical cooling energy by 15% to 25% compared to baseline air-cooled facilities. Factual disclaimer: Energy reductions represent theoretical engineering models; actual operational savings depend heavily on local ambient wet-bulb temperatures, facility heat rejection equipment, and continuous flowmeter calibration.",
    relatedCapabilities: [
      { label: "Cooling Efficiency", path: "/energy/cooling" },
      { label: "Power Monitoring", path: "/energy/monitoring" },
      { label: "Efficient Cooling", path: "/sustainability/efficient-cooling" },
    ],
    cta: {
      label: "Discuss Cooling Optimization →",
      path: "/contact",
    },
  },
  "capacity-planning": {
    id: "capacity-planning",
    code: "UC-05",
    title: "Capacity Planning",
    eyebrow: "Infrastructure Use Cases · UC-05",
    problem:
      "Infrastructure engineering teams face high financial and operational risks when expanding compute capacity. High-voltage utility substation interconnections require 24 to 48 months of lead time, while AI hardware generational shifts escalate power densities 3x to 5x every few years. Relying on spreadsheet extrapolations or delayed utility bills results either in costly over-provisioning (stranded electrical substations and underutilized chillers) or catastrophic under-provisioning where physical power and cooling limits choke compute expansion.",
    approach:
      "Quantitative multi-variate capacity modeling driven by longitudinal telemetry, workload growth trajectories, and regional power grid availability. The framework analyzes continuous kilowatt trends, transformer load factors, rack space-power density distributions, and CDU fluid velocity ceilings. Across the seven regional South India planning nodes, capacity models evaluate local utility substation capacities, industrial power tariffs, and fiber transit corridors to guide right-sized modular expansion.",
    expectedValue:
      "Provides fact-based capital expenditure and phased capacity roadmaps that protect capital investment while ensuring facilities are architecturally prepared for 100 kW+ liquid-cooled rack transitions. Limitations: Capacity forecasting models depend on the availability of historical telemetry and regional utility grid expansion transparency; GreenNext does not guarantee grid interconnect approvals or utility tariff stability.",
    relatedCapabilities: [
      { label: "Capacity Management", path: "/automation/capacity" },
      { label: "Energy Analytics", path: "/energy/analytics" },
      { label: "Operational Reporting", path: "/automation/reporting" },
    ],
    cta: {
      label: "Discuss Capacity Planning →",
      path: "/contact",
    },
  },
  "anomaly-detection": {
    id: "anomaly-detection",
    code: "UC-06",
    title: "Anomaly Detection",
    eyebrow: "Infrastructure Use Cases · UC-06",
    problem:
      "Enterprise data center environments generate tens of thousands of sensory data points every minute across electrical switchgear, UPS batteries, cooling pumps, and server BMCs. Traditional static-threshold monitoring creates severe operational liabilities: thresholds set too tight flood Network Operations Centers (NOC) with hundreds of false alarms during normal bursty compute workloads, while thresholds set too loose fail to catch subtle multi-variate degradation (such as gradual coolant flow degradation paired with creeping return fluid temperatures).",
    approach:
      "Multi-variate anomaly detection calibrated to the specific operational baseline of high-density infrastructure. The analytical engine establishes baseline operating envelopes across correlated telemetry streams — such as correlating active GPU wattage with cold plate Delta-T and pump differential pressure. By identifying statistical drift, rate-of-rise thermal gradients, and abnormal harmonic distortion, the system flags genuine system distress before catastrophic thresholds are breached.",
    expectedValue:
      "Enables rapid detection of developing mechanical, electrical, and thermal anomalies, dramatically cutting false alarm noise and reducing operator alert fatigue. Supports proactive maintenance during scheduled change windows. Factual boundary: Anomaly detection models represent software-level diagnostic advisory tools; they do not replace hardwired mechanical safety shutoffs, fire suppression trip circuits, or emergency power off (EPO) interlocks.",
    relatedCapabilities: [
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Intelligent Monitoring", path: "/automation/monitoring" },
      { label: "Automated Alerts", path: "/automation/alerts" },
    ],
    cta: {
      label: "Discuss Anomaly Detection →",
      path: "/contact",
    },
  },
  "automated-alerts": {
    id: "automated-alerts",
    code: "UC-07",
    title: "Automated Operational Alerts",
    eyebrow: "Infrastructure Use Cases · UC-07",
    problem:
      "When physical infrastructure anomalies or threshold violations occur, alerting workflows frequently break down due to fragmented tools: facility alerts stay trapped in proprietary Building Management System (BMS) screens, network alarms remain isolated in switch logs, and compute faults stay buried in hypervisor consoles. Unstructured email notifications and un-prioritized alarm storms lead to cognitive overload, delayed emergency responses, and prolonged Mean Time to Resolution (MTTR).",
    approach:
      "Structured, event-driven operational alert orchestration that correlates raw sensory events and formats them into actionable diagnostic packages. Notifications include exact stack layer location (e.g., Row 4, Rack 12, PDU B, CDU Loop 2), severity level, instantaneous telemetry values against baseline thresholds, and 15-minute historical trend context. Alerts are dispatched to designated operational response channels (ITSM ticketing, Webhooks, SMS, secure email) according to role-based on-call escalation policies.",
    expectedValue:
      "Supports decreased Mean Time to Detection (MTTD) and faster, more coordinated engineering interventions during critical thermal and electrical events. Eliminates alert fatigue by enforcing strict event de-duplication and threshold hysteresis. Limitations: Alert delivery and operational effectiveness depend on customer network infrastructure, active integration gateways, and defined organizational incident response procedures.",
    relatedCapabilities: [
      { label: "Automated Alerts", path: "/automation/alerts" },
      { label: "Anomaly Detection", path: "/automation/anomaly" },
      { label: "Operational Reporting", path: "/automation/reporting" },
    ],
    cta: {
      label: "Discuss Automated Operational Alerting →",
      path: "/contact",
    },
  },
};
