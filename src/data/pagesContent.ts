export interface ContentSection {
  title: string;
  body: string[];
  cards?: Array<{
    title: string;
    description: string;
    meta?: string;
  }>;
  list?: string[];
  callout?: string;
}

export interface DedicatedPageData {
  slug: string;
  category: string;
  parentPath: string;
  route: string;
  title: string;
  eyebrow: string;
  h1: string;
  intro: string;
  isConceptual?: boolean;
  sections: ContentSection[];
  cta: {
    label: string;
    path: string;
  };
  relatedPages: Array<{
    title: string;
    path: string;
  }>;
}

export const PAGES_CONTENT: Record<string, DedicatedPageData> = {
  // ----------------------------------------------------
  // ABOUT SECTION
  // ----------------------------------------------------
  about: {
    slug: "about",
    category: "About",
    parentPath: "/",
    route: "/about",
    title: "About GreenNext",
    eyebrow: "About GreenNext",
    h1: "Where Digital Infrastructure Meets Intelligence",
    intro:
      "GreenNext is a digital infrastructure initiative focused on the design, intelligence, and operational management of AI-era data center infrastructure. It addresses the convergence of increasingly demanding compute workloads, rising energy requirements, and the need for regional digital capacity across South India.",
    sections: [
      {
        title: "The GreenNext Mandate",
        body: [
          "Modern AI workloads, large-scale inference deployments, and data-intensive applications place requirements on digital infrastructure that conventional designs were not optimised for.",
          "GreenNext approaches these requirements as an integrated system: where compute, power, cooling, networking, monitoring, and automation are designed and managed together, not as separate engineering concerns.",
        ],
        cards: [
          {
            title: "Infrastructure Intelligence",
            description:
              "Visibility across compute, network, storage, power, and cooling through connected telemetry.",
          },
          {
            title: "Energy Efficiency",
            description:
              "Workload-aware power and thermal management that treats energy as an operational discipline.",
          },
          {
            title: "Intelligent Automation",
            description:
              "Event-driven automation workflows that support consistent, timely operational responses.",
          },
          {
            title: "Regional Digital Infrastructure",
            description:
              "A distributed regional model focused on Madurai, Coimbatore, Trichy, and Mangalore.",
          },
        ],
      },
      {
        title: "Who GreenNext Is For",
        body: [
          "GreenNext is designed for technology teams, infrastructure operators, enterprise architects, and regional decision-makers preparing digital operations for compute environments that behave fundamentally differently from conventional infrastructure.",
        ],
        list: [
          "Data center operators managing increasingly dense compute environments",
          "Infrastructure decision-makers planning capacity for AI workloads",
          "Technology and AI companies assessing regional infrastructure options",
          "Enterprise technology teams requiring reliable, efficient systems",
          "Sustainability teams evaluating infrastructure resource efficiency",
        ],
      },
    ],
    cta: { label: "Explore What GreenNext Is →", path: "/about/what-we-are" },
    relatedPages: [
      { title: "Why GreenNext Exists", path: "/about/why-we-exist" },
      { title: "The GreenNext Approach", path: "/about/our-approach" },
      { title: "Long-Term Direction", path: "/about/direction" },
    ],
  },
  "about/what-we-are": {
    slug: "what-we-are",
    category: "About",
    parentPath: "/about",
    route: "/about/what-we-are",
    title: "What GreenNext Is",
    eyebrow: "About GreenNext",
    h1: "A Digital Infrastructure Initiative for the AI Era",
    intro:
      "GreenNext is a digital infrastructure initiative focused on the design, intelligence, and operational management of data center infrastructure for increasingly demanding AI-era workloads. It brings together infrastructure intelligence, energy efficiency, intelligent automation, and a distributed regional approach across South India.",
    sections: [
      {
        title: "What GreenNext Addresses",
        body: [
          "Modern AI workloads, large-scale inference deployments, and data-intensive applications place requirements on digital infrastructure that conventional designs were not optimised for. Higher compute density, greater power draw per rack, more responsive cooling demands, and the need for intelligent operational visibility are structural characteristics of AI-era infrastructure.",
          "GreenNext approaches these requirements as an integrated system: where compute, power, cooling, networking, monitoring, and automation are designed and managed together, not as separate engineering concerns.",
        ],
      },
      {
        title: "Who GreenNext Is For",
        body: [
          "GreenNext is relevant to data center operators, enterprise architects, and infrastructure decision-makers who must plan capacity around power and cooling constraints.",
        ],
        list: [
          "Data center operators managing high-density GPU and accelerator hardware",
          "Infrastructure decision-makers planning capacity for AI and cloud workloads",
          "Technology and AI enterprises assessing regional infrastructure options across South India",
          "Sustainability teams evaluating real resource efficiency without speculative offsets",
        ],
      },
      {
        title: "What GreenNext Is Not",
        body: [
          "GreenNext does not claim to be an established large-scale data center operator. It is an infrastructure initiative — one that brings a clearly defined technical approach, regional focus, and operational model to the question of how digital infrastructure for the AI era should be built and managed across South India.",
        ],
        callout:
          "GreenNext's aim is to make AI-era digital infrastructure smarter, more efficient, and more intelligently managed — starting from the region, not despite it.",
      },
    ],
    cta: { label: "Learn Why GreenNext Exists →", path: "/about/why-we-exist" },
    relatedPages: [
      { title: "Why GreenNext Exists", path: "/about/why-we-exist" },
      { title: "The GreenNext Approach", path: "/about/our-approach" },
    ],
  },
  "about/why-we-exist": {
    slug: "why-we-exist",
    category: "About",
    parentPath: "/about",
    route: "/about/why-we-exist",
    title: "Why GreenNext Exists",
    eyebrow: "The Infrastructure Challenge",
    h1: "Why Modern Infrastructure Requires a Different Approach",
    intro:
      "The infrastructure requirements of AI workloads, high-density compute, and large-scale data processing have changed significantly. Infrastructure models built for conventional enterprise applications are encountering structural limits. Understanding why these limits exist is where GreenNext begins.",
    sections: [
      {
        title: "Why AI Workloads Change Infrastructure Requirements",
        body: [
          "Modern AI training, inference, and data processing workloads behave fundamentally differently from conventional enterprise applications. They place concentrated demands on compute hardware, generate higher thermal loads per rack, require precise and responsive cooling systems, and consume significantly more power per unit of useful work.",
          "Understanding these requirements at the infrastructure design stage, rather than after deployment, is one of the reasons infrastructure intelligence matters.",
        ],
      },
      {
        title: "Why Infrastructure Intelligence Matters",
        body: [
          "Visibility is the foundation of operational control. Without accurate, timely data on how infrastructure is performing — across compute, storage, networking, power, and cooling — operators are responding to conditions they cannot fully see.",
          "Infrastructure intelligence means instrumenting systems to produce operational data, processing it meaningfully, and making it available to operators and automation systems in a form they can act on.",
        ],
      },
      {
        title: "Why Energy Efficiency & Automation Matter",
        body: [
          "Energy is both an operational cost and an environmental consideration. As compute density increases, energy efficiency becomes a more significant infrastructure discipline. Better monitoring and informed cooling strategies can reduce the gap between energy consumed and productive work delivered.",
          "Modern environments generate more operational signals than human teams can effectively monitor in real time. Automation allows operators to define expected conditions, detect deviations, and coordinate responses consistently and quickly.",
        ],
      },
      {
        title: "Why Regional Infrastructure Planning Matters",
        body: [
          "Digital infrastructure is physical. It requires land, power, water for cooling, fibre connectivity, and operational personnel. Concentrating all infrastructure capacity in a single location creates dependencies — on power grids, on connectivity routes, and on local conditions.",
          "A regional approach distributes risk, brings capacity closer to workloads and users, and allows infrastructure to be shaped around local ecosystem strengths.",
        ],
      },
    ],
    cta: { label: "See How GreenNext Addresses These Challenges →", path: "/about/our-approach" },
    relatedPages: [
      { title: "The GreenNext Approach", path: "/about/our-approach" },
      { title: "AI-Ready Infrastructure", path: "/infrastructure/ai-ready" },
    ],
  },
  "about/our-approach": {
    slug: "our-approach",
    category: "About",
    parentPath: "/about",
    route: "/about/our-approach",
    title: "The GreenNext Approach",
    eyebrow: "Methodology",
    h1: "From Understanding to Continuous Optimization",
    intro:
      "GreenNext operates on a three-stage approach that moves from requirements understanding through intelligence and into ongoing optimization. This is not a one-time design exercise — it is a continuous operational discipline.",
    sections: [
      {
        title: "The Three Operational Stages",
        body: [
          "Each stage represents a fundamental operational capability, ensuring infrastructure remains aligned with real-world workloads.",
        ],
        cards: [
          {
            title: "Stage 01 — Understand",
            meta: "Foundation",
            description:
              "Develop a detailed understanding of the infrastructure, workload, energy, and regional operational environment. Assess compute density, thermal dissipation profiles, and connectivity needs.",
          },
          {
            title: "Stage 02 — Intelligence",
            meta: "Instrumentation",
            description:
              "Apply telemetry, analytics, and AI-driven analysis to understand operational states across the full stack. Connect instrumented hardware with analytical intelligence in real time.",
          },
          {
            title: "Stage 03 — Optimize",
            meta: "Calibration",
            description:
              "Use insights from understanding and intelligence to continuously improve resource efficiency, cooling calibration, and operational reliability as workloads evolve.",
          },
        ],
      },
      {
        title: "Interdependence of the Framework",
        body: [
          "Understanding without intelligence is planning without feedback. Intelligence without optimization is data without action. Optimization without understanding risks improving the wrong things.",
          "The three stages are interdependent, and GreenNext's operational model is designed to maintain all three simultaneously.",
        ],
      },
    ],
    cta: { label: "Explore Our Long-Term Direction →", path: "/about/direction" },
    relatedPages: [
      { title: "Long-Term Direction", path: "/about/direction" },
      { title: "Infrastructure Architecture", path: "/infrastructure/architecture" },
    ],
  },
  "about/direction": {
    slug: "direction",
    category: "About",
    parentPath: "/about",
    route: "/about/direction",
    title: "Long-Term Direction",
    eyebrow: "Strategic Direction",
    h1: "Infrastructure That Grows With Regional Digital Demand",
    intro:
      "GreenNext's long-term direction is to establish a technically credible, intelligently managed, and sustainably operated digital infrastructure presence across South India — one that grows with regional digital demand rather than ahead of it.",
    sections: [
      {
        title: "The Scale of the Regional Infrastructure Opportunity",
        body: [
          "South India's technology ecosystem — spanning established industrial cities like Coimbatore, emerging regional hubs like Madurai, strategically positioned locations like Trichy, and coastal connectivity gateways like Mangalore — represents a meaningful digital infrastructure opportunity.",
          "As AI workloads expand and data-intensive applications scale, the demand for locally available, reliably operated, and energy-efficient digital capacity will continue to develop.",
        ],
      },
      {
        title: "What GreenNext Is Building Toward",
        body: [
          "GreenNext aims to foster infrastructure that is technically appropriate for AI compute densities, operationally intelligent through continuous telemetry, and regionally distributed across South India.",
        ],
        list: [
          "Technically appropriate — designed for sustained high-density AI workload profiles",
          "Operationally intelligent — instrumented, monitored, and continuously calibrated",
          "Energy-efficient — treating power as an engineering discipline rather than overhead",
          "Regionally distributed — positioned to serve workloads closer to source and users",
          "Sustainably operated — scaling digital capacity without proportional resource degradation",
        ],
      },
      {
        title: "Factual Boundaries & Progress",
        body: [
          "GreenNext does not claim to have already established the infrastructure described above. This is a direction — a technically grounded, operationally considered vision for what regional digital infrastructure across South India can become.",
          "Progress will be measured transparently against this direction as the initiative develops.",
        ],
      },
    ],
    cta: { label: "Connect With GreenNext →", path: "/contact" },
    relatedPages: [
      { title: "Regional Overview", path: "/regions/overview" },
      { title: "Contact", path: "/contact" },
    ],
  },

  // ----------------------------------------------------
  // INFRASTRUCTURE SECTION
  // ----------------------------------------------------
  infrastructure: {
    slug: "infrastructure",
    category: "Infrastructure",
    parentPath: "/",
    route: "/infrastructure",
    title: "Infrastructure",
    eyebrow: "AI-Driven Data Centers",
    h1: "Infrastructure Built for the AI Era",
    intro:
      "AI workloads create demanding and specific requirements across compute, cooling, power, networking, and reliability. GreenNext addresses these requirements as an integrated operational system, not as separate engineering concerns.",
    isConceptual: true,
    sections: [
      {
        title: "The Integrated Stack Approach",
        body: [
          "Conventional data center designs treat server racks, electrical distribution, chillers, and network switches as isolated domains. For modern AI workloads, these systems interact directly in real time.",
          "GreenNext approaches the physical and logical layers of the data center as a unified operational stack.",
        ],
        cards: [
          {
            title: "AI-Ready Infrastructure",
            description:
              "Handling high sustained compute density and concentrated thermal dissipation.",
            meta: "Compute Design",
          },
          {
            title: "Compute Systems",
            description:
              "Accelerator clusters engineered for sustained throughput and workload scheduling.",
            meta: "Processing Core",
          },
          {
            title: "Storage & Data",
            description:
              "High-throughput NVMe tiers and durable data orchestration for AI pipelines.",
            meta: "Data Layer",
          },
          {
            title: "Network & Connectivity",
            description: "Regional fabric and low-latency interconnects linking distributed sites.",
            meta: "Transit Layer",
          },
          {
            title: "Infrastructure Architecture",
            description: "The 7-layer connected stack with bidirectional operational signal flow.",
            meta: "7-Layer Stack",
          },
        ],
      },
    ],
    cta: { label: "Explore AI-Ready Infrastructure →", path: "/infrastructure/ai-ready" },
    relatedPages: [
      { title: "Infrastructure Architecture", path: "/infrastructure/architecture" },
      { title: "Compute Systems", path: "/infrastructure/compute" },
    ],
  },
  "infrastructure/ai-ready": {
    slug: "ai-ready",
    category: "Infrastructure",
    parentPath: "/infrastructure",
    route: "/infrastructure/ai-ready",
    title: "AI-Ready Infrastructure",
    eyebrow: "AI-Driven Data Centers",
    h1: "Infrastructure Built for the AI Era",
    intro:
      "AI workloads place structurally different demands on digital infrastructure compared with conventional enterprise applications. Understanding these differences is the starting point for designing infrastructure that can support them reliably, efficiently, and over time.",
    isConceptual: true,
    sections: [
      {
        title: "How AI Workloads Differ from Conventional Systems",
        body: [
          "Conventional enterprise compute is characterised by moderate, predictable power density and bursty utilisation patterns.",
          "AI training and inference workloads are characterised by sustained high compute utilisation, elevated power draw per rack, immediate thermal spikes, and extreme sensitivity to network latency across distributed clusters.",
        ],
        cards: [
          {
            title: "Sustained High Utilisation",
            description:
              "Accelerators running at peak compute throughput for days or weeks without interruption.",
          },
          {
            title: "Elevated Rack Power Density",
            description:
              "Concentrated power delivery far exceeding conventional 5–10 kW enterprise rack norms.",
          },
          {
            title: "Responsive Thermal Loads",
            description:
              "Dynamic heat output requiring precision cooling loops that adapt within seconds.",
          },
          {
            title: "Cluster Interconnect Fabric",
            description:
              "High-bandwidth, low-latency inter-node communication essential for distributed models.",
          },
        ],
      },
      {
        title: "Infrastructure as an Integrated System",
        body: [
          "Workload demand drives power draw. Power draw generates heat. Heat must be extracted by cooling systems. Cooling systems consume additional power. The efficiency of this chain depends on how well each element is managed in relation to the others.",
          "GreenNext treats this loop as an integrated operational system.",
        ],
      },
    ],
    cta: { label: "View Infrastructure Architecture →", path: "/infrastructure/architecture" },
    relatedPages: [
      { title: "Compute Systems", path: "/infrastructure/compute" },
      { title: "Infrastructure Architecture", path: "/infrastructure/architecture" },
    ],
  },
  "infrastructure/compute": {
    slug: "compute",
    category: "Infrastructure",
    parentPath: "/infrastructure",
    route: "/infrastructure/compute",
    title: "Compute Systems",
    eyebrow: "Compute Infrastructure",
    h1: "Compute Systems Designed for Demanding Workload Profiles",
    intro:
      "The compute layer is where digital work happens. In AI-era infrastructure, the compute environment must be capable of sustaining intensive, high-density processing for extended periods — with the power delivery and cooling support to match.",
    isConceptual: true,
    sections: [
      {
        title: "Compute Density & Hardware Topology",
        body: [
          "Modern AI accelerator hardware packs unprecedented compute throughput into compact rack dimensions. While operationally efficient, high-density racks demand power delivery and heat dissipation systems sized for sustained draw rather than brief peaks.",
        ],
        cards: [
          {
            title: "Server & Accelerator Hardware",
            description:
              "CPUs, GPUs, and specialized AI processors configured for continuous processing.",
          },
          {
            title: "Rack Layout Architecture",
            description:
              "High-density physical chassis configurations designed for optimal airflow and power distribution.",
          },
          {
            title: "Workload Scheduling",
            description:
              "Context-aware orchestrators that schedule jobs with awareness of power and thermal headroom.",
          },
        ],
      },
      {
        title: "Interdependency Across the Stack",
        body: [
          "Compute does not operate in isolation. Its performance depends on stable voltage feeds, responsive thermal control, high-throughput storage pipelines, and low-latency clustering.",
        ],
      },
    ],
    cta: { label: "Explore Storage & Data Infrastructure →", path: "/infrastructure/storage" },
    relatedPages: [
      { title: "AI-Ready Infrastructure", path: "/infrastructure/ai-ready" },
      { title: "Storage & Data", path: "/infrastructure/storage" },
    ],
  },
  "infrastructure/storage": {
    slug: "storage",
    category: "Infrastructure",
    parentPath: "/infrastructure",
    route: "/infrastructure/storage",
    title: "Storage & Data",
    eyebrow: "Storage & Data Layer",
    h1: "Resilient Data Infrastructure for Demanding Workloads",
    intro:
      "Storage is the persistent and working data environment for compute workloads. For AI applications, large datasets must be accessible at the speeds required by training pipelines, and persistent storage must provide the durability that long-duration runs depend on.",
    isConceptual: true,
    sections: [
      {
        title: "High-Throughput Storage Architecture",
        body: [
          "AI training workloads are inherently I/O intensive. Insufficient storage throughput creates bottlenecks where expensive accelerator hardware sits idle waiting for training batches.",
          "GreenNext's conceptual storage model incorporates tiered NVMe flash for active working datasets combined with resilient object storage for checkpoints and historical data.",
        ],
        cards: [
          {
            title: "Tiered Storage Hierarchy",
            description: "High-speed NVMe scratch storage paired with durable persistent tiers.",
          },
          {
            title: "Data I/O Pipeline Optimization",
            description:
              "Maximizing sequential read throughput to keep compute pipelines saturated.",
          },
          {
            title: "Checkpoint Resilience",
            description:
              "Rapid snapshotting to minimize costly restarts during multi-day training executions.",
          },
        ],
      },
    ],
    cta: { label: "Explore Network & Connectivity →", path: "/infrastructure/network" },
    relatedPages: [
      { title: "Compute Systems", path: "/infrastructure/compute" },
      { title: "Network & Connectivity", path: "/infrastructure/network" },
    ],
  },
  "infrastructure/network": {
    slug: "network",
    category: "Infrastructure",
    parentPath: "/infrastructure",
    route: "/infrastructure/network",
    title: "Network & Connectivity",
    eyebrow: "Network Infrastructure",
    h1: "The Connectivity Layer That Holds the Stack Together",
    intro:
      "Network and connectivity infrastructure links users and applications to compute resources, connects storage to compute, and ties infrastructure sites to each other. For AI workloads and regional digital presence, connectivity decisions have direct consequences for latency, resilience, and operational cost.",
    isConceptual: true,
    sections: [
      {
        title: "Internal Cluster Fabric & Regional Routing",
        body: [
          "Distributed AI training requires high-bandwidth, ultra-low latency fabric between compute nodes. At the regional level, diversified routing ensures resilient communication between focus hubs across South India.",
        ],
        cards: [
          {
            title: "Cluster Interconnects",
            description: "Low-latency fabric supporting high-throughput node synchronization.",
          },
          {
            title: "Regional Network Fabric",
            description:
              "Connecting Madurai, Coimbatore, Trichy, and Mangalore across diverse transit paths.",
          },
          {
            title: "Carrier Neutrality & Resilience",
            description:
              "Multiple independent physical fiber conduits to avoid single points of failure.",
          },
        ],
      },
    ],
    cta: { label: "View Infrastructure Architecture →", path: "/infrastructure/architecture" },
    relatedPages: [
      { title: "Infrastructure Architecture", path: "/infrastructure/architecture" },
      { title: "Regional Overview", path: "/regions/overview" },
    ],
  },
  "infrastructure/architecture": {
    slug: "architecture",
    category: "Infrastructure",
    parentPath: "/infrastructure",
    route: "/infrastructure/architecture",
    title: "Infrastructure Architecture",
    eyebrow: "Infrastructure Architecture",
    h1: "One Connected Operational Stack",
    intro:
      "Digital infrastructure is not a single system — it is a set of interdependent layers that must work together reliably. Signals move in both directions: demand informs infrastructure configuration, while operational conditions inform workload scheduling and automation decisions.",
    isConceptual: true,
    sections: [
      {
        title: "The 7-Layer Connected Architecture",
        body: [
          "GreenNext structures the infrastructure into 7 functional operational layers, from demand origin down to monitoring and automation.",
        ],
        cards: [
          {
            title: "Layer 01: Users / AI Applications",
            meta: "Demand Origin",
            description:
              "AI applications, inference serving, and end-user workloads driving requirements down the stack.",
          },
          {
            title: "Layer 02: Network & Connectivity",
            meta: "Regional Fabric",
            description:
              "Low-latency interconnects, edge routing, and diversified carrier links across South India.",
          },
          {
            title: "Layer 03: Compute Layer",
            meta: "AI-Ready Systems",
            description:
              "Server hardware and accelerator clusters engineered for high sustained utilisation.",
          },
          {
            title: "Layer 04: Storage & Data Layer",
            meta: "Resilient Data Services",
            description:
              "High-throughput NVMe tiers and persistent data services supporting compute pipelines.",
          },
          {
            title: "Layer 05: Energy Management",
            meta: "Power Visibility",
            description:
              "Utility feeds, UPS systems, and granular per-rack power monitoring instrumentation.",
          },
          {
            title: "Layer 06: Cooling Infrastructure",
            meta: "Thermal Control",
            description:
              "Airflow management and precision thermal loops maintaining safe operating conditions.",
          },
          {
            title: "Layer 07: Monitoring & Automation",
            meta: "Operational Intelligence",
            description:
              "Cross-stack telemetry collection, anomaly detection, and automated operational response.",
          },
        ],
      },
      {
        title: "Bidirectional Signal Flow",
        body: [
          "Demand flows downward: application intensity dictates compute load, compute load dictates power draw, and power draw creates heat loads.",
          "Telemetry flows upward: thermal sensors and power meters inform automation engines, which in turn signal schedulers to pace or relocate workloads.",
        ],
      },
    ],
    cta: { label: "Explore Intelligent Monitoring →", path: "/automation/monitoring" },
    relatedPages: [
      { title: "Power Monitoring", path: "/energy/monitoring" },
      { title: "Intelligent Monitoring", path: "/automation/monitoring" },
    ],
  },

  // ----------------------------------------------------
  // ENERGY SECTION
  // ----------------------------------------------------
  energy: {
    slug: "energy",
    category: "Energy",
    parentPath: "/",
    route: "/energy",
    title: "Energy Efficiency",
    eyebrow: "Energy Efficiency",
    h1: "Every Watt Matters",
    intro:
      "Energy performance is an infrastructure discipline, not an afterthought. GreenNext connects workload demand signals with power consumption and thermal conditions to create actionable operational visibility.",
    isConceptual: true,
    sections: [
      {
        title: "Energy as an Operational Discipline",
        body: [
          "Data centers cannot manage what they cannot measure. As compute density scales, energy efficiency directly dictates operational capacity, hardware longevity, and environmental footprint.",
        ],
        cards: [
          {
            title: "Power Monitoring",
            description: "Continuous measurement across facility, row, and rack levels.",
            meta: "Visibility",
          },
          {
            title: "Cooling Efficiency",
            description: "Calibrating cooling to actual heat loads to eliminate over-cooling.",
            meta: "Thermal Control",
          },
          {
            title: "Workload-Aware Resources",
            description: "Matching compute scheduling to live power and thermal headroom.",
            meta: "Resource Matching",
          },
          {
            title: "Energy Analytics",
            description: "Historical trend analysis for evidence-based capacity planning.",
            meta: "Intelligence",
          },
          {
            title: "Operational Optimization",
            description: "The ongoing operational cycle of Monitor → Analyze → Act.",
            meta: "Continuous Loop",
          },
        ],
      },
    ],
    cta: { label: "Explore Power Monitoring →", path: "/energy/monitoring" },
    relatedPages: [
      { title: "Cooling Efficiency", path: "/energy/cooling" },
      { title: "Energy Analytics", path: "/energy/analytics" },
    ],
  },
  "energy/monitoring": {
    slug: "monitoring",
    category: "Energy",
    parentPath: "/energy",
    route: "/energy/monitoring",
    title: "Power Monitoring",
    eyebrow: "Energy Efficiency",
    h1: "Knowing Where Every Watt Goes",
    intro:
      "Power monitoring is the instrumentation foundation of energy efficiency — the continuous, granular measurement of power consumption across infrastructure that makes informed operational management possible.",
    isConceptual: true,
    sections: [
      {
        title: "Granular Monitoring Tiers",
        body: [
          "Without granular telemetry, data center operators rely on monthly utility bills that arrive weeks after inefficiency has compounded.",
        ],
        cards: [
          {
            title: "Facility-Level Monitoring",
            description:
              "Total substation feeds, transformer distribution, and UPS efficiency metrics.",
          },
          {
            title: "Row & Zone Monitoring",
            description:
              "Isolating consumption across specific server rows and thermal containment aisles.",
          },
          {
            title: "Rack-Level Measurement",
            description: "Per-chassis power draw identifying high-consumption compute nodes.",
          },
          {
            title: "System-Level Telemetry",
            description: "Individual hardware power draws correlated with active software tasks.",
          },
        ],
      },
      {
        title: "Operational Value of Continuous Monitoring",
        body: [
          "Continuous power monitoring uncovers anomalous consumption profiles, identifies stranded power capacity, and validates whether operational adjustments achieved intended efficiency goals.",
        ],
      },
    ],
    cta: { label: "Explore Cooling Efficiency →", path: "/energy/cooling" },
    relatedPages: [
      { title: "Cooling Efficiency", path: "/energy/cooling" },
      { title: "Energy Analytics", path: "/energy/analytics" },
      { title: "Data Center Energy Monitoring Solution", path: "/solutions/energy-monitoring" },
    ],
  },
  "energy/cooling": {
    slug: "cooling",
    category: "Energy",
    parentPath: "/energy",
    route: "/energy/cooling",
    title: "Cooling Efficiency",
    eyebrow: "Energy Efficiency",
    h1: "Thermal Management as an Energy Discipline",
    intro:
      "Cooling is frequently the largest variable energy consumer in a data center environment. Managing it efficiently — without compromising the thermal stability that hardware reliability requires — is one of the most consequential decisions an operator makes.",
    isConceptual: true,
    sections: [
      {
        title: "The Problem of Over-Cooling",
        body: [
          "In the absence of granular thermal telemetry, operators run chillers at maximum capacity to maintain conservative safety buffers. This over-cooling expends substantial energy with no reliability benefit.",
          "GreenNext connects thermal monitoring directly with compute workload signals, enabling cooling systems to adjust based on measured heat output.",
        ],
        cards: [
          {
            title: "Airflow Rate Optimization",
            description: "Delivering cooling air directly to heat-generating hardware.",
          },
          {
            title: "Thermal Gradient Visibility",
            description: "Eliminating hot spots while maintaining safe operational temperatures.",
          },
          {
            title: "Return Air Temperature Monitoring",
            description: "Assessing heat extraction effectiveness across cooling loops.",
          },
        ],
      },
    ],
    cta: { label: "Explore Workload-Aware Resources →", path: "/energy/workload-aware" },
    relatedPages: [
      { title: "Workload-Aware Resources", path: "/energy/workload-aware" },
      { title: "Cooling Optimization Solution", path: "/solutions/cooling-optimization" },
    ],
  },
  "energy/workload-aware": {
    slug: "workload-aware",
    category: "Energy",
    parentPath: "/energy",
    route: "/energy/workload-aware",
    title: "Workload-Aware Resources",
    eyebrow: "Energy Efficiency",
    h1: "Matching Infrastructure Resources to Actual Demand",
    intro:
      "Infrastructure resources — compute capacity, power delivery, cooling capacity, and network bandwidth — are provisioned based on anticipated demand. Workload-aware resource management uses real operational data to close the gap between provisioned capacity and actual load.",
    isConceptual: true,
    sections: [
      {
        title: "Eliminating the Overprovisioning Gap",
        body: [
          "Different workloads have different operational profiles: batch training jobs require sustained high throughput, while inference workloads follow end-user traffic curves.",
          "Workload-aware systems orchestrate tasks with awareness of current electrical feeds, ambient thermal headroom, and system availability.",
        ],
      },
    ],
    cta: { label: "Explore Energy Analytics →", path: "/energy/analytics" },
    relatedPages: [
      { title: "Energy Analytics", path: "/energy/analytics" },
      { title: "AI Workload Management Solution", path: "/solutions/ai-workload-management" },
    ],
  },
  "energy/analytics": {
    slug: "analytics",
    category: "Energy",
    parentPath: "/energy",
    route: "/energy/analytics",
    title: "Energy Analytics",
    eyebrow: "Energy Intelligence",
    h1: "Understanding Energy Consumption Over Time",
    intro:
      "Real-time power monitoring tells operators what is happening now. Energy analytics tells operators what has been happening, how consumption patterns have changed, and what trends indicate about future requirements.",
    isConceptual: true,
    sections: [
      {
        title: "Historical Analysis & Trend Modeling",
        body: [
          "Energy analytics aggregates telemetry into structured baselines, establishing the empirical foundation for efficiency calibration and capital expansion planning.",
        ],
        cards: [
          {
            title: "Consumption Attribution",
            description:
              "Attributing power usage to specific compute clusters and operational workloads.",
          },
          {
            title: "Trend Identification",
            description:
              "Detecting gradual efficiency degradation indicative of equipment wear or airflow obstruction.",
          },
          {
            title: "Capacity Projection",
            description: "Modeling future power requirements against anticipated workload growth.",
          },
        ],
      },
    ],
    cta: { label: "Explore Operational Optimization →", path: "/energy/optimization" },
    relatedPages: [
      { title: "Operational Optimization", path: "/energy/optimization" },
      { title: "Capacity Planning Solution", path: "/solutions/capacity-planning" },
    ],
  },
  "energy/optimization": {
    slug: "optimization",
    category: "Energy",
    parentPath: "/energy",
    route: "/energy/optimization",
    title: "Operational Optimization",
    eyebrow: "Energy Efficiency",
    h1: "Energy Efficiency as an Ongoing Operational Discipline",
    intro:
      "Energy optimization is not a one-time project with a completion date. Infrastructure environments change — workloads evolve, hardware ages, and operational patterns shift. Effective energy management requires continuous calibration.",
    isConceptual: true,
    sections: [
      {
        title: "The Closed-Loop Optimization Cycle",
        body: [
          "GreenNext frames energy optimization as an iterative cycle:",
          "1. Monitor: Collect accurate, granular telemetry.",
          "2. Analyze: Identify efficiency gaps and consumption deviations.",
          "3. Act: Calibrate cooling parameters and workload distribution.",
          "4. Verify: Measure resulting efficiency gains without compromising reliability.",
        ],
      },
    ],
    cta: { label: "Explore Intelligent Automation →", path: "/automation/monitoring" },
    relatedPages: [
      { title: "Intelligent Monitoring", path: "/automation/monitoring" },
      { title: "Sustainability", path: "/sustainability" },
    ],
  },

  // ----------------------------------------------------
  // AUTOMATION SECTION
  // ----------------------------------------------------
  automation: {
    slug: "automation",
    category: "Automation",
    parentPath: "/",
    route: "/automation",
    title: "Intelligent Automation",
    eyebrow: "Intelligent Automation",
    h1: "Infrastructure That Responds Intelligently",
    intro:
      "Automation supports infrastructure operators in identifying changing conditions, understanding their implications, and coordinating consistent responses across critical systems — without replacing operational judgement.",
    isConceptual: true,
    sections: [
      {
        title: "The 6-Step Operational Workflow",
        body: [
          "GreenNext's conceptual automation framework organizes operational tasks into a reliable closed-loop workflow: Monitor → Detect → Analyze → Decide → Automate → Report.",
        ],
        cards: [
          {
            title: "01. Monitor",
            description: "Continuous operational signal collection across infrastructure systems.",
          },
          {
            title: "02. Detect",
            description: "Identifying deviations from calibrated operating envelopes.",
          },
          {
            title: "03. Analyze",
            description: "Correlating multi-system signals to determine underlying causes.",
          },
          {
            title: "04. Decide",
            description: "Evaluating severity and matching against predefined protocols.",
          },
          {
            title: "05. Automate",
            description: "Executing bounded operational adjustments or routing structured alerts.",
          },
          {
            title: "06. Report",
            description: "Documenting telemetry events and resolutions for institutional audit.",
          },
        ],
      },
    ],
    cta: { label: "Explore Intelligent Monitoring →", path: "/automation/monitoring" },
    relatedPages: [
      { title: "Anomaly Detection", path: "/automation/anomaly" },
      { title: "Automated Alerts", path: "/automation/alerts" },
    ],
  },
  "automation/monitoring": {
    slug: "monitoring",
    category: "Automation",
    parentPath: "/automation",
    route: "/automation/monitoring",
    title: "Intelligent Monitoring",
    eyebrow: "Intelligent Automation",
    h1: "Continuous Operational Visibility Across Infrastructure",
    intro:
      "Monitoring is the foundation of every automation capability. Without accurate, continuous collection of operational signals, anomaly detection has no baseline, alerts have no trigger, and capacity planning has no data.",
    isConceptual: true,
    sections: [
      {
        title: "Cross-System Telemetry Scope",
        body: [
          "Intelligent monitoring connects hardware health, network latency, power draw, and thermal sensors into a unified operational console.",
        ],
        cards: [
          {
            title: "Compute & Accelerator Health",
            description:
              "Tracking core utilisation, memory temperatures, and PCIe error indicators.",
          },
          {
            title: "Network State Telemetry",
            description:
              "Monitoring switch port utilization, buffer drops, and inter-node latency.",
          },
          {
            title: "Power Distribution Health",
            description: "Real-time voltage stability, phase balance, and UPS status.",
          },
          {
            title: "Thermal Sensor Arrays",
            description:
              "Dense temperature mapping across server racks and cooling distribution units.",
          },
        ],
      },
    ],
    cta: { label: "Explore Anomaly Detection →", path: "/automation/anomaly" },
    relatedPages: [
      { title: "Anomaly Detection", path: "/automation/anomaly" },
      { title: "Automated Alerts", path: "/automation/alerts" },
    ],
  },
  "automation/anomaly": {
    slug: "anomaly",
    category: "Automation",
    parentPath: "/automation",
    route: "/automation/anomaly",
    title: "Anomaly Detection",
    eyebrow: "Intelligent Automation",
    h1: "Identifying What Matters in a High-Volume Signal Environment",
    intro:
      "Infrastructure environments generate substantial volumes of operational data. Anomaly detection is the analytical capability that distinguishes genuine operational risks from the normal variations that characterise healthy infrastructure operation.",
    isConceptual: true,
    sections: [
      {
        title: "Filtering Signal Noise & Reducing Alert Fatigue",
        body: [
          "A monitored data center generates thousands of telemetry readings every second. Simple threshold triggers cause alert fatigue when minor spikes trigger false alarms.",
          "GreenNext's conceptual anomaly detection models compare live signals against historical baselines, taking workload context into account.",
        ],
      },
    ],
    cta: { label: "Explore Automated Alerts →", path: "/automation/alerts" },
    relatedPages: [
      { title: "Automated Alerts", path: "/automation/alerts" },
      { title: "Anomaly Detection Solution", path: "/solutions/anomaly-detection" },
    ],
  },
  "automation/alerts": {
    slug: "alerts",
    category: "Automation",
    parentPath: "/automation",
    route: "/automation/alerts",
    title: "Automated Alerts",
    eyebrow: "Intelligent Automation",
    h1: "Routing the Right Information to the Right People at the Right Time",
    intro:
      "An alert is only operationally useful if it is accurate, timely, contextual, and directed to someone with the ability to act on it. Automated alerting provides the routing and formatting layer that turns raw signals into actionable notifications.",
    isConceptual: true,
    sections: [
      {
        title: "Structured, Contextual Notifications",
        body: [
          "Generic alerts such as 'system error' require extensive investigation before action can occur.",
          "GreenNext conceptual alerts include location in the infrastructure stack, current sensor readings, recent historical trends, and potential root causes.",
        ],
      },
    ],
    cta: { label: "Explore Capacity Management →", path: "/automation/capacity" },
    relatedPages: [
      { title: "Capacity Management", path: "/automation/capacity" },
      { title: "Automated Operational Alerts Solution", path: "/solutions/automated-alerts" },
    ],
  },
  "automation/capacity": {
    slug: "capacity",
    category: "Automation",
    parentPath: "/automation",
    route: "/automation/capacity",
    title: "Capacity Management",
    eyebrow: "Intelligent Automation",
    h1: "Understanding Infrastructure Headroom Before It Becomes a Constraint",
    intro:
      "Capacity management is the operational discipline of tracking infrastructure utilisation trends, identifying constraints before they affect service delivery, and planning expansion to maintain adequate operational headroom.",
    isConceptual: true,
    sections: [
      {
        title: "Proactive Headroom Planning",
        body: [
          "Reactive capacity management responds after performance degrades. Proactive capacity management tracks trendlines weeks or months ahead across compute, power, cooling, and network links.",
        ],
      },
    ],
    cta: { label: "Explore Operational Reporting →", path: "/automation/reporting" },
    relatedPages: [
      { title: "Operational Reporting", path: "/automation/reporting" },
      { title: "Capacity Planning Solution", path: "/solutions/capacity-planning" },
    ],
  },
  "automation/reporting": {
    slug: "reporting",
    category: "Automation",
    parentPath: "/automation",
    route: "/automation/reporting",
    title: "Operational Reporting",
    eyebrow: "Intelligent Automation",
    h1: "Consistent, Structured Visibility Into Infrastructure Operations",
    intro:
      "Operational reporting provides the documented record of how infrastructure has performed, what conditions have been detected, and what actions have been taken. Consistent reporting maintains institutional knowledge and supports regulatory accountability.",
    isConceptual: true,
    sections: [
      {
        title: "Standardized Reporting Streams",
        body: [
          "Automated operational reports aggregate infrastructure uptime, energy efficiency profiles, alert resolution times, and capacity forecasts into standardized periodic reviews.",
        ],
      },
    ],
    cta: { label: "View Regional Infrastructure Overview →", path: "/regions/overview" },
    relatedPages: [
      { title: "Regional Overview", path: "/regions/overview" },
      { title: "Intelligent Monitoring", path: "/automation/monitoring" },
    ],
  },

  // ----------------------------------------------------
  // REGIONS SECTION
  // ----------------------------------------------------
  regions: {
    slug: "regions",
    category: "Regions",
    parentPath: "/",
    route: "/regions",
    title: "Regional Digital Infrastructure",
    eyebrow: "Regional Presence · South India",
    h1: "A Regional Approach to Digital Infrastructure",
    intro:
      "Digital infrastructure serving a region effectively requires more than a single central location. GreenNext focuses on Madurai, Coimbatore, Trichy, and Mangalore — four locations with distinct and complementary infrastructure relevance across South India.",
    isConceptual: true,
    sections: [
      {
        title: "The South India Distributed Network",
        body: [
          "Centralised digital infrastructure concentrates grid and network risks. A distributed regional model brings compute closer to industrial and technological demand centres.",
        ],
        cards: [
          {
            title: "Madurai (MDU)",
            meta: "Regional Tech Hub",
            description:
              "Southern Tamil Nadu regional services anchor with expanding educational and tech presence.",
          },
          {
            title: "Coimbatore (CJB)",
            meta: "Industrial Ecosystem",
            description:
              "Western anchor serving manufacturing automation and cross-state transport corridors.",
          },
          {
            title: "Trichy (TRZ)",
            meta: "Strategic Junction",
            description:
              "Central Tamil Nadu routing node at the natural intersection of north-south transit routes.",
          },
          {
            title: "Mangalore (IXE)",
            meta: "Coastal Gateway",
            description:
              "Strategic coastal gateway with proximity to undersea cable landing infrastructure.",
          },
        ],
      },
    ],
    cta: { label: "Explore Regional Overview & Dashboard →", path: "/regions/overview" },
    relatedPages: [
      { title: "Madurai (MDU)", path: "/regions/madurai" },
      { title: "Coimbatore (CJB)", path: "/regions/coimbatore" },
      { title: "Trichy (TRZ)", path: "/regions/trichy" },
      { title: "Mangalore (IXE)", path: "/regions/mangalore" },
    ],
  },
  "regions/overview": {
    slug: "overview",
    category: "Regions",
    parentPath: "/regions",
    route: "/regions/overview",
    title: "Regional Overview",
    eyebrow: "Regional Digital Infrastructure",
    h1: "Building a Distributed Digital Infrastructure Network Across South India",
    intro:
      "Digital infrastructure serving a region effectively requires more than a single central location. A distributed approach allows capacity to be positioned closer to where workloads originate and users are located — reducing latency and building on local ecosystem strengths.",
    isConceptual: true,
    sections: [
      {
        title: "Why Regional Distribution Matters",
        body: [
          "Centralising all infrastructure capacity in a single metropolitan hub creates dependencies on local power grids and transit bottlenecks.",
          "GreenNext's regional approach distributes capacity across four complementary focus locations across South India.",
        ],
        cards: [
          {
            title: "Reducing Latency",
            description:
              "Locating compute closer to regional industrial operations, users, and data generation points.",
          },
          {
            title: "Improving Resilience",
            description:
              "Distributing risk across geographically separate sites, substations, and fiber routes.",
          },
          {
            title: "Supporting Local Ecosystems",
            description:
              "Enabling regional tier-2 cities to develop autonomous technical capacity.",
          },
        ],
      },
    ],
    cta: { label: "Explore Madurai Hub →", path: "/regions/madurai" },
    relatedPages: [
      { title: "Coimbatore", path: "/regions/coimbatore" },
      { title: "Trichy", path: "/regions/trichy" },
      { title: "Mangalore", path: "/regions/mangalore" },
    ],
  },

  // ----------------------------------------------------
  // SOLUTIONS SECTION (OVERVIEW)
  // ----------------------------------------------------
  solutions: {
    slug: "solutions",
    category: "Solutions",
    parentPath: "/",
    route: "/solutions",
    title: "Solutions & Use Cases",
    eyebrow: "Infrastructure Use Cases",
    h1: "Operational Scenarios GreenNext Is Designed to Address",
    intro:
      "The following use cases represent the operational problems GreenNext's infrastructure intelligence and automation approach is designed to help address. These are illustrative scenarios informed by common data center operational challenges.",
    isConceptual: true,
    sections: [
      {
        title: "Enterprise Infrastructure Scenarios",
        body: [
          "Each solution is structured around an operational problem, the GreenNext conceptual approach, and the expected operational value delivered.",
        ],
        cards: [
          {
            title: "UC-01: Data Center Energy Monitoring",
            description: "Granular power telemetry from facility down to per-rack levels.",
          },
          {
            title: "UC-02: Infrastructure Health Monitoring",
            description: "Early detection of hardware degradation and configuration drift.",
          },
          {
            title: "UC-03: AI Workload Management",
            description:
              "Connecting compute scheduling with real-time electrical and thermal headroom.",
          },
          {
            title: "UC-04: Cooling Optimization",
            description:
              "Calibrating chillers to actual heat loads to eliminate over-cooling waste.",
          },
          {
            title: "UC-05: Capacity Planning",
            description: "Evidence-based forecasting for compute, power, and cooling expansion.",
          },
          {
            title: "UC-06: Anomaly Detection",
            description:
              "Filtering signal noise to surface genuine deviations requiring human attention.",
          },
          {
            title: "UC-07: Automated Operational Alerts",
            description: "Structured notifications with complete infrastructure context.",
          },
        ],
      },
    ],
    cta: { label: "Explore Data Center Energy Monitoring →", path: "/solutions/energy-monitoring" },
    relatedPages: [
      { title: "Energy Monitoring", path: "/solutions/energy-monitoring" },
      { title: "AI Workload Management", path: "/solutions/ai-workload-management" },
      { title: "Contact Our Team", path: "/contact" },
    ],
  },

  // ----------------------------------------------------
  // SUSTAINABILITY SECTION
  // ----------------------------------------------------
  sustainability: {
    slug: "sustainability",
    category: "Sustainability",
    parentPath: "/",
    route: "/sustainability",
    title: "Sustainability",
    eyebrow: "Sustainability",
    h1: "Digital Growth Without Ignoring Resource Efficiency",
    intro:
      "Responsible infrastructure starts with visibility: understanding where energy and resources are used, how systems interact, and where operational decisions can create better outcomes.",
    sections: [
      {
        title: "The GreenNext Sustainability Doctrine",
        body: [
          "Better infrastructure visibility and optimization support more resource-aware operations. The goal is not to slow digital growth, but to ensure that growth is delivered as efficiently as the technology allows.",
        ],
        callout:
          "GreenNext does not publish speculative carbon offset figures or unverified environmental marketing claims. Our sustainability model is grounded in measurable physical efficiency: power monitoring, thermal calibration, and eliminating idle compute waste.",
      },
      {
        title: "Six Foundational Focus Areas",
        body: ["Our sustainability approach integrates six operational principles:"],
        cards: [
          {
            title: "01. Energy-Aware Infrastructure",
            description: "Design-stage instrumentation rather than retrospective additions.",
          },
          {
            title: "02. Efficient Cooling",
            description:
              "Cooling systems calibrated for actual thermal load rather than worst-case buffers.",
          },
          {
            title: "03. Resource Optimization",
            description:
              "Eliminating idle compute, overprovisioned chillers, and stranded capacity.",
          },
          {
            title: "04. Intelligent Workload Management",
            description:
              "Pacing compute intensive tasks against available power and thermal margins.",
          },
          {
            title: "05. Infrastructure Visibility",
            description: "Continuous operational insight as the prerequisite for waste reduction.",
          },
          {
            title: "06. Sustainable Digital Growth",
            description:
              "Scaling regional digital capacity without proportional resource degradation.",
          },
        ],
      },
    ],
    cta: { label: "Explore Energy-Aware Infrastructure →", path: "/sustainability/energy-aware" },
    relatedPages: [
      { title: "Energy-Aware Infrastructure", path: "/sustainability/energy-aware" },
      { title: "Sustainable Digital Growth", path: "/sustainability/sustainable-growth" },
    ],
  },
  "sustainability/energy-aware": {
    slug: "energy-aware",
    category: "Sustainability",
    parentPath: "/sustainability",
    route: "/sustainability/energy-aware",
    title: "Energy-Aware Infrastructure",
    eyebrow: "Sustainability",
    h1: "Infrastructure Designed With Energy Visibility Built In",
    intro:
      "Energy visibility cannot be added to infrastructure as an afterthought. Understanding where and how energy is consumed requires instrumentation that is designed into the infrastructure from the outset — not retrospectively fitted to legacy systems.",
    sections: [
      {
        title: "Design Stage vs. Retrofit",
        body: [
          "Retrofitting monitoring hardware to live facilities disrupts operations and often lacks granular sensor endpoints.",
          "GreenNext's conceptual model embeds energy monitoring as a foundational tier of physical facility design.",
        ],
      },
    ],
    cta: { label: "Explore Efficient Cooling →", path: "/sustainability/efficient-cooling" },
    relatedPages: [
      { title: "Efficient Cooling", path: "/sustainability/efficient-cooling" },
      { title: "Resource Optimization", path: "/sustainability/resource-optimization" },
    ],
  },
  "sustainability/efficient-cooling": {
    slug: "efficient-cooling",
    category: "Sustainability",
    parentPath: "/sustainability",
    route: "/sustainability/efficient-cooling",
    title: "Efficient Cooling",
    eyebrow: "Sustainability",
    h1: "Cooling Systems Designed for Efficiency, Not Excess Capacity",
    intro:
      "Cooling is often the largest variable energy consumer in a data center environment. How cooling systems are designed, operated, and monitored has a direct and substantial effect on total infrastructure energy consumption.",
    sections: [
      {
        title: "Calibrating Heat Extraction to Actual Load",
        body: [
          "Operating cooling systems at theoretical worst-case maximums wastes power continuously. With real-time thermal gradient monitoring, cooling output dynamically follows workload intensity.",
        ],
      },
    ],
    cta: {
      label: "Explore Resource Optimization →",
      path: "/sustainability/resource-optimization",
    },
    relatedPages: [
      { title: "Resource Optimization", path: "/sustainability/resource-optimization" },
      { title: "Cooling Efficiency (Energy)", path: "/energy/cooling" },
    ],
  },
  "sustainability/resource-optimization": {
    slug: "resource-optimization",
    category: "Sustainability",
    parentPath: "/sustainability",
    route: "/sustainability/resource-optimization",
    title: "Resource Optimization",
    eyebrow: "Sustainability",
    h1: "Using What Is Needed, Not What Is Provisioned",
    intro:
      "Resource waste in digital infrastructure has a real cost — in energy, in capital expenditure, and in the environmental footprint of operating systems that are not delivering proportional value.",
    sections: [
      {
        title: "Identifying and Eliminating Waste",
        body: [
          "Idle compute drawing standby power, overprovisioned chillers cooling empty aisles, and underutilised network interfaces represent preventable waste.",
          "Continuous infrastructure telemetry provides operators the data needed to eliminate waste while preserving high reliability margins.",
        ],
      },
    ],
    cta: {
      label: "Explore Sustainable Digital Growth →",
      path: "/sustainability/sustainable-growth",
    },
    relatedPages: [
      { title: "Sustainable Digital Growth", path: "/sustainability/sustainable-growth" },
      { title: "Workload-Aware Resources", path: "/energy/workload-aware" },
    ],
  },
  "sustainability/sustainable-growth": {
    slug: "sustainable-growth",
    category: "Sustainability",
    parentPath: "/sustainability",
    route: "/sustainability/sustainable-growth",
    title: "Sustainable Digital Growth",
    eyebrow: "Sustainability",
    h1: "Growing Digital Capacity Without Proportional Growth in Resource Use",
    intro:
      "The growth of digital infrastructure does not have to be proportional to the growth of energy consumption and resource use. With better design, more intelligent operations, and continuous optimisation, it is possible to deliver increasing digital capacity with improving energy efficiency over time.",
    sections: [
      {
        title: "Responsible Scaling for Regional Hubs",
        body: [
          "As AI workloads and data services expand across South India, building infrastructure that treats energy as an engineering discipline ensures regional expansion remains resilient and sustainable.",
        ],
      },
    ],
    cta: { label: "Connect With GreenNext →", path: "/contact" },
    relatedPages: [
      { title: "Energy-Aware Infrastructure", path: "/sustainability/energy-aware" },
      { title: "The GreenNext Approach", path: "/about/our-approach" },
    ],
  },

  // ----------------------------------------------------
  // CONTACT SECTION
  // ----------------------------------------------------
  contact: {
    slug: "contact",
    category: "Contact",
    parentPath: "/",
    route: "/contact",
    title: "Contact GreenNext",
    eyebrow: "Start a Conversation",
    h1: "Build the Next Generation of Digital Infrastructure",
    intro:
      "If you are involved in infrastructure planning, data center operations, AI workload management, or regional digital development across South India, we want to understand your requirements.",
    sections: [
      {
        title: "Infrastructure Collaboration",
        body: [
          "Connect with our team to discuss regional planning, high-density compute specifications, power monitoring, or intelligent automation architectures.",
          "For technical discussions, infrastructure planning, and strategic inquiries, use the GreenNext inquiry interface.",
        ],
      },
    ],
    cta: { label: "Explore Infrastructure Architecture →", path: "/infrastructure/architecture" },
    relatedPages: [
      { title: "About GreenNext", path: "/about/what-we-are" },
      { title: "Regional Overview", path: "/regions/overview" },
    ],
  },
};
