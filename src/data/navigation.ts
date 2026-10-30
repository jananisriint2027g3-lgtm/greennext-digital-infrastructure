export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  description: string;
  isConceptual?: boolean;
}

export interface NavigationCategory {
  id: string;
  label: string;
  path: string;
  description: string;
  items?: NavigationItem[];
  isDirectLink?: boolean;
}

const NAVIGATION_CATALOG: NavigationCategory[] = [
  {
    id: "about",
    label: "About",
    path: "/about",
    description: "The GreenNext initiative, mission, methodology, and long-term direction.",
    items: [
      {
        id: "what-we-are",
        label: "What GreenNext Is",
        path: "/about/what-we-are",
        description: "An AI-driven digital infrastructure initiative for South India.",
      },
      {
        id: "why-we-exist",
        label: "Why GreenNext Exists",
        path: "/about/why-we-exist",
        description: "The infrastructure challenges of AI-era workloads.",
      },
      {
        id: "our-approach",
        label: "The GreenNext Approach",
        path: "/about/our-approach",
        description: "The Understand → Intelligence → Optimize methodology.",
      },
      {
        id: "direction",
        label: "Long-Term Direction",
        path: "/about/direction",
        description: "Building sustainable digital infrastructure across South India.",
      },
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    path: "/infrastructure",
    description: "Integrated infrastructure architecture built for demanding AI workloads.",
    items: [
      {
        id: "ai-ready",
        label: "AI-Ready Infrastructure",
        path: "/infrastructure/ai-ready",
        description: "Power density, thermal loads, and sustained compute design.",
        isConceptual: true,
      },
      {
        id: "compute",
        label: "Compute Systems",
        path: "/infrastructure/compute",
        description: "High-density accelerator clusters, memory bandwidth, and scheduling architecture.",
        isConceptual: true,
      },
      {
        id: "storage",
        label: "Storage & Data",
        path: "/infrastructure/storage",
        description: "Resilient parallel storage and data lifecycle architecture for intensive training pipelines.",
        isConceptual: true,
      },
      {
        id: "network",
        label: "Network & Connectivity",
        path: "/infrastructure/network",
        description: "Lossless cluster fabrics, regional transit, and low-latency interconnects.",
        isConceptual: true,
      },
      {
        id: "architecture",
        label: "Infrastructure Architecture",
        path: "/infrastructure/architecture",
        description: "The 7-layer connected stack linking applications, compute, power, cooling, and operations.",
        isConceptual: true,
      },
      {
        id: "cybersecurity",
        label: "Cybersecurity & Protection",
        path: "/infrastructure/cybersecurity",
        description: "Zero Trust access, confidential compute, and defense-in-depth.",
        isConceptual: true,
      },
      {
        id: "facility-engineering",
        label: "Facility Engineering",
        path: "/infrastructure/facility-engineering",
        description: "Civil, structural slab loading, envelopes, and substation yards.",
        isConceptual: true,
      },
      {
        id: "fire-safety",
        label: "Fire Protection & Safety",
        path: "/infrastructure/fire-safety",
        description: "Aspirating smoke detection, clean-agent gas, and BESS safeguards.",
        isConceptual: true,
      },
      {
        id: "commissioning",
        label: "Commissioning & Testing",
        path: "/infrastructure/commissioning",
        description: "The 5-level commissioning lifecycle, load banking, and IST.",
        isConceptual: true,
      },
      {
        id: "environmental-monitoring",
        label: "Environmental Monitoring",
        path: "/infrastructure/environmental-monitoring",
        description: "Inlet temperature, relative humidity, and ASHRAE TC 9.9 compliance.",
        isConceptual: true,
      },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    path: "/energy",
    description: "Workload-aware power and thermal management as an infrastructure discipline.",
    items: [
      {
        id: "overview",
        label: "Overview",
        path: "/energy",
        description: "Explore the complete conceptual energy and power infrastructure model.",
        isConceptual: true,
      },
      {
        id: "monitoring",
        label: "Power Monitoring",
        path: "/energy/monitoring",
        description: "Continuous power measurement across facility, row, and rack levels.",
        isConceptual: true,
      },
      {
        id: "cooling",
        label: "Cooling Efficiency",
        path: "/energy/cooling",
        description: "Thermal management calibrated to actual compute workload load.",
        isConceptual: true,
      },
      {
        id: "workload-aware",
        label: "Workload-Aware Resources",
        path: "/energy/workload-aware",
        description: "Matching provisioned resources to actual operational demand.",
        isConceptual: true,
      },
      {
        id: "analytics",
        label: "Energy Analytics",
        path: "/energy/analytics",
        description: "Historical analysis and directional trends for capacity planning.",
        isConceptual: true,
      },
      {
        id: "optimization",
        label: "Operational Optimization",
        path: "/energy/optimization",
        description: "Ongoing calibration cycle of Monitor → Analyze → Act.",
        isConceptual: true,
      },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    path: "/automation",
    description: "Event-driven workflows that provide operational support to human teams.",
    items: [
      {
        id: "monitoring",
        label: "Intelligent Monitoring",
        path: "/automation/monitoring",
        description: "Continuous operational signal collection across infrastructure.",
        isConceptual: true,
      },
      {
        id: "anomaly",
        label: "Anomaly Detection",
        path: "/automation/anomaly",
        description: "Calibrated baselines to distinguish anomalies from signal noise.",
        isConceptual: true,
      },
      {
        id: "alerts",
        label: "Automated Alerts",
        path: "/automation/alerts",
        description: "Structured notifications routed with actionable operational context.",
        isConceptual: true,
      },
      {
        id: "capacity",
        label: "Capacity Management",
        path: "/automation/capacity",
        description: "Anticipating resource constraints across compute, power, and cooling.",
        isConceptual: true,
      },
      {
        id: "reporting",
        label: "Operational Reporting",
        path: "/automation/reporting",
        description: "Automated, structured reports for institutional consistency.",
        isConceptual: true,
      },
      {
        id: "operations",
        label: "Operations & Maintenance",
        path: "/automation/operations",
        description: "24/7 staffing models, MOP/SOP change governance, and field safety.",
        isConceptual: true,
      },
    ],
  },
  {
    id: "regions-sustainability",
    label: "Regions & Sustainability",
    path: "/regions",
    description:
      "Distributed regional digital infrastructure and sustainable operational practices across South India.",
    items: [
      {
        id: "regional-overview",
        label: "Regional Network Overview",
        path: "/regions/overview",
        description: "Strategic rationale for regional distribution and network topology.",
        isConceptual: true,
      },
      {
        id: "regional-portfolio",
        label: "Data Centre Portfolio",
        path: "/regions#regional-portfolio",
        description:
          "Seven source-referenced regional locations with transparent infrastructure fields.",
        isConceptual: true,
      },
      {
        id: "madurai",
        label: "Madurai (MDU)",
        path: "/regions/madurai",
        description: "Regional technology & infrastructure hub for southern Tamil Nadu.",
        isConceptual: true,
      },
      {
        id: "coimbatore",
        label: "Coimbatore (CJB)",
        path: "/regions/coimbatore",
        description: "Industrial & technology ecosystem and cross-state transit gateway.",
        isConceptual: true,
      },
      {
        id: "trichy",
        label: "Trichy (TRZ)",
        path: "/regions/trichy",
        description: "Strategic central Tamil Nadu connectivity and distribution junction.",
        isConceptual: true,
      },
      {
        id: "mangalore",
        label: "Mangalore (IXE)",
        path: "/regions/mangalore",
        description: "Coastal technology gateway with undersea cable landing proximity.",
        isConceptual: true,
      },
      {
        id: "hosur",
        label: "Hosur (HSR)",
        path: "/regions/hosur",
        description: "Bengaluru-border EV, robotics, and industrial edge corridor.",
        isConceptual: true,
      },
      {
        id: "tirunelveli",
        label: "Tirunelveli (TNV)",
        path: "/regions/tirunelveli",
        description: "Renewable-energy and proposed high-density compute corridor.",
        isConceptual: true,
      },
      {
        id: "puducherry",
        label: "Puducherry (PDY)",
        path: "/regions/puducherry",
        description: "Coastal edge, innovation, and regional resilience corridor.",
        isConceptual: true,
      },
      {
        id: "sustainability-framework",
        label: "Sustainability Framework",
        path: "/sustainability",
        description: "Enabling digital capacity expansion with rigorous energy efficiency.",
      },
      {
        id: "energy-aware",
        label: "Energy-Aware Infrastructure",
        path: "/sustainability/energy-aware",
        description: "Design-stage instrumentation rather than retrospective additions.",
      },
      {
        id: "efficient-cooling",
        label: "Efficient Cooling",
        path: "/sustainability/efficient-cooling",
        description: "Thermal management calibrated to actual compute workload load.",
      },
      {
        id: "resource-optimization",
        label: "Resource Optimization",
        path: "/sustainability/resource-optimization",
        description: "Eliminating idle compute and provisioned overhead waste.",
      },
      {
        id: "sustainable-growth",
        label: "Sustainable Digital Growth",
        path: "/sustainability/sustainable-growth",
        description: "Growing digital capacity without proportional growth in resource use.",
      },
    ],
  },
  {
    id: "solutions",
    label: "Solutions",
    path: "/solutions",
    description: "Operational scenarios GreenNext is designed to address.",
    items: [
      {
        id: "energy-monitoring",
        label: "Data Center Energy Monitoring",
        path: "/solutions/energy-monitoring",
        description: "Reference telemetry planning for power visibility across infrastructure layers.",
        isConceptual: true,
      },
      {
        id: "health-monitoring",
        label: "Infrastructure Health Monitoring",
        path: "/solutions/health-monitoring",
        description: "Conceptual health-monitoring workflows for investigating degradation and drift.",
        isConceptual: true,
      },
      {
        id: "ai-workload-management",
        label: "AI Workload Management",
        path: "/solutions/ai-workload-management",
        description: "Reference workload planning that considers power and thermal headroom.",
        isConceptual: true,
      },
      {
        id: "cooling-optimization",
        label: "Cooling Optimization",
        path: "/solutions/cooling-optimization",
        description: "Reference cooling optimization based on modeled heat loads and operating conditions.",
        isConceptual: true,
      },
      {
        id: "capacity-planning",
        label: "Capacity Planning",
        path: "/solutions/capacity-planning",
        description: "Illustrative expansion planning based on workload, capacity, and site assumptions.",
        isConceptual: true,
      },
      {
        id: "anomaly-detection",
        label: "Anomaly Detection",
        path: "/solutions/anomaly-detection",
        description: "Conceptual anomaly-analysis workflows for investigating significant conditions.",
        isConceptual: true,
      },
      {
        id: "automated-alerts",
        label: "Automated Operational Alerts",
        path: "/solutions/automated-alerts",
        description: "Proposed alerting workflows for contextual response and reduced alert fatigue.",
        isConceptual: true,
      },
      {
        id: "configurator",
        label: "Infrastructure Configurator",
        path: "/solutions/configurator",
        description:
          "Build an illustrative starting profile for workload, scale, and planning priority.",
        isConceptual: true,
      },
      {
        id: "architecture-explorer",
        label: "Architecture Explorer",
        path: "/solutions/architecture-explorer",
        description: "Explore the conceptual compute, network, storage, cooling, and power layers.",
        isConceptual: true,
      },
      {
        id: "energy-calculator",
        label: "Energy Impact Calculator",
        path: "/solutions/energy-calculator",
        description: "Create a transparent, illustrative workload energy estimate.",
        isConceptual: true,
      },
      {
        id: "infrastructure-index",
        label: "Infrastructure & Grid Index",
        path: "/solutions/infrastructure-index",
        description: "Structured illustrative reference data for capacity, PUE, and clean-energy planning.",
        isConceptual: true,
      },
    ],
  },

  {
    id: "icp",
    label: "ICP",
    path: "/icp",
    description:
      "Ideal Customer Profiles, operational qualification frameworks, and alignment matrix.",
    items: [
      {
        id: "data-center-operators",
        label: "Data Center Operators & Colocation",
        path: "/icp/data-center-operators",
        description:
          "Wholesale & colocation facility expansion, 2N power distribution, and PUE transparency.",
        isConceptual: true,
      },
      {
        id: "ai-hyperscale",
        label: "AI & Hyperscale Infrastructure",
        path: "/icp/ai-hyperscale",
        description: "High-density GPU racks, direct-to-chip cooling, and dynamic load scheduling.",
        isConceptual: true,
      },
      {
        id: "enterprise-edge",
        label: "Enterprise & Edge Infrastructure",
        path: "/icp/enterprise-edge",
        description:
          "Brownfield facility modernization and distributed regional nodes across South India.",
        isConceptual: true,
      },
      {
        id: "sustainability-energy",
        label: "Sustainability & Energy Stakeholders",
        path: "/icp/sustainability-energy",
        description:
          "PUE/WUE measurement integrity, Scope 1-3 carbon accounting, and clean energy PPAs.",
        isConceptual: true,
      },
    ],
  },

  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    description: "Connect with the GreenNext infrastructure planning team.",
    isDirectLink: true,
  },
];

const navigationById = (id: string) => {
  const category = NAVIGATION_CATALOG.find((item) => item.id === id);
  if (!category) throw new Error(`Missing navigation category: ${id}`);
  return category;
};

const regionsAndSustainability = navigationById("regions-sustainability");
const industries = navigationById("icp");

/**
 * Public navigation order. Keep the catalog above intact so existing routes and
 * submenu definitions remain available while the header presents visitor-friendly
 * top-level categories.
 */
export const NAVIGATION_STRUCTURE: NavigationCategory[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    description: "Return to the GreenNext digital infrastructure overview.",
    isDirectLink: true,
  },
  navigationById("infrastructure"),
  navigationById("energy"),
  navigationById("automation"),
  {
    ...navigationById("solutions"),
    id: "offerings",
    label: "Offerings",
    description:
      "Conceptual infrastructure offerings spanning compute, power, cooling, monitoring, connectivity, and regional planning.",
  },
  {
    ...industries,
    id: "industries",
    label: "Industries",
    description:
      "Industry and infrastructure stakeholder profiles, qualification frameworks, and alignment criteria.",
  },
  {
    ...regionsAndSustainability,
    id: "sustainability",
    label: "Sustainability",
    path: "/sustainability",
    description: "Sustainable digital infrastructure and energy-aware operating practices.",
    items: regionsAndSustainability.items!.filter((item) =>
      item.path.startsWith("/sustainability"),
    ),
  },
  {
    ...regionsAndSustainability,
    id: "region",
    label: "Regions",
    path: "/regions",
    description:
      "Regional digital infrastructure planning and network topology across South India.",
    items: regionsAndSustainability.items!.filter((item) => item.path.startsWith("/regions")),
  },
  navigationById("about"),
];
