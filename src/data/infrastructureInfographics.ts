export type EvidenceLabel =
  "CONCEPTUAL ARCHITECTURE" | "PLANNING REFERENCE" | "ILLUSTRATIVE / DEMO DATA" | "SOURCE-REPORTED";

export interface InfographicStep {
  id: string;
  title: string;
  description: string;
  evidence: EvidenceLabel;
}

export const AI_COMPUTE_COOLING_LAYERS: InfographicStep[] = [
  {
    id: "workloads",
    title: "AI workloads",
    description: "Training and inference demand establishes the planning envelope.",
    evidence: "CONCEPTUAL ARCHITECTURE",
  },
  {
    id: "accelerators",
    title: "AI compute / GPU accelerator systems",
    description: "Accelerated platforms are evaluated with their power and thermal requirements.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "compute",
    title: "Compute infrastructure",
    description: "Servers, racks, storage, and fabric are co-designed as one system.",
    evidence: "CONCEPTUAL ARCHITECTURE",
  },
  {
    id: "power",
    title: "Power distribution",
    description: "Distribution paths are planned to support resilient, observable delivery.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "cooling",
    title: "Cooling infrastructure",
    description:
      "Air and liquid cooling choices are matched to heat density and operating context.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "automation",
    title: "Monitoring and automation",
    description: "Telemetry and control workflows connect engineering signals to decisions.",
    evidence: "CONCEPTUAL ARCHITECTURE",
  },
  {
    id: "network",
    title: "Network and connectivity",
    description: "Lossless fabrics and regional paths are considered alongside compute placement.",
    evidence: "PLANNING REFERENCE",
  },
];

export const POWER_METERING_LEVELS: InfographicStep[] = [
  {
    id: "facility",
    title: "Facility-level monitoring",
    description: "Utility interface and whole-facility energy context.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "substation",
    title: "Substation / transformer-level monitoring",
    description: "Incoming distribution equipment and transformer telemetry points.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "electrical-room",
    title: "Electrical room / row PDU monitoring",
    description: "Switchgear, busway, branch circuits, and room-level distribution context.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "rack",
    title: "Rack-level power monitoring",
    description: "Rack and server power signals for capacity and workload correlation.",
    evidence: "PLANNING REFERENCE",
  },
];

export interface RegionalTopologyNode {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  planningNote: string;
}

export const REGIONAL_TOPOLOGY_NODES: RegionalTopologyNode[] = [
  {
    id: "coimbatore",
    name: "Coimbatore",
    code: "CJB",
    x: 18,
    y: 42,
    planningNote: "Western Tamil Nadu planning reference in the conceptual seven-node portfolio.",
  },
  {
    id: "hosur",
    name: "Hosur",
    code: "HSR",
    x: 35,
    y: 20,
    planningNote: "Northern Tamil Nadu planning reference near the Bengaluru corridor.",
  },
  {
    id: "madurai",
    name: "Madurai",
    code: "MDU",
    x: 52,
    y: 66,
    planningNote: "Southern Tamil Nadu planning reference and default selected node.",
  },
  {
    id: "trichy",
    name: "Trichy",
    code: "TRZ",
    x: 55,
    y: 40,
    planningNote: "Central Tamil Nadu planning reference in the conceptual relationship view.",
  },
  {
    id: "mangalore",
    name: "Mangalore",
    code: "IXE",
    x: 5,
    y: 16,
    planningNote: "Coastal Karnataka planning reference in the regional portfolio.",
  },
  {
    id: "tirunelveli",
    name: "Tirunelveli",
    code: "TNV",
    x: 48,
    y: 88,
    planningNote: "Southern Tamil Nadu planning reference in the conceptual portfolio.",
  },
  {
    id: "puducherry",
    name: "Puducherry",
    code: "PDY",
    x: 82,
    y: 37,
    planningNote: "Puducherry planning reference in the conceptual regional view.",
  },
];

export const REGIONAL_TOPOLOGY_EDGES: [string, string][] = [
  ["mangalore", "coimbatore"],
  ["coimbatore", "hosur"],
  ["coimbatore", "trichy"],
  ["hosur", "puducherry"],
  ["trichy", "puducherry"],
  ["trichy", "madurai"],
  ["madurai", "tirunelveli"],
];

export const SUSTAINABILITY_PILLARS: InfographicStep[] = [
  {
    id: "energy",
    title: "Energy efficiency",
    description: "Measure electrical demand and efficiency at a planning-appropriate boundary.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "thermal-efficiency",
    title: "Cooling efficiency",
    description: "Assess air, liquid, heat-rejection, and control choices together.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "water",
    title: "Water management",
    description: "Consider water availability, reuse, treatment, and operational safeguards.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "renewables",
    title: "Renewable energy planning",
    description: "Evaluate renewable procurement and on-site options without asserting delivery.",
    evidence: "PLANNING REFERENCE",
  },
  {
    id: "evidence",
    title: "Measurement and evidence verification",
    description: "Separate source-reported values, assumptions, and unavailable measurements.",
    evidence: "SOURCE-REPORTED",
  },
];
