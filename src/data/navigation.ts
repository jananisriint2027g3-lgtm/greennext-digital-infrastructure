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

export const NAVIGATION_STRUCTURE: NavigationCategory[] = [
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
        description: "High-density hardware clusters and scheduling architecture.",
        isConceptual: true,
      },
      {
        id: "storage",
        label: "Storage & Data",
        path: "/infrastructure/storage",
        description: "Resilient data infrastructure for intensive training pipelines.",
        isConceptual: true,
      },
      {
        id: "network",
        label: "Network & Connectivity",
        path: "/infrastructure/network",
        description: "Regional network fabric and low-latency node interconnects.",
        isConceptual: true,
      },
      {
        id: "architecture",
        label: "Infrastructure Architecture",
        path: "/infrastructure/architecture",
        description: "The 7-layer connected operational stack and signal flows.",
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
    ],
  },
  {
    id: "regions",
    label: "Regions",
    path: "/regions",
    description: "A distributed digital infrastructure network across South India.",
    items: [
      {
        id: "overview",
        label: "Regional Overview",
        path: "/regions/overview",
        description: "Strategic rationale for regional distribution and network topology.",
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
        description: "Granular real-time power visibility across infrastructure layers.",
        isConceptual: true,
      },
      {
        id: "health-monitoring",
        label: "Infrastructure Health Monitoring",
        path: "/solutions/health-monitoring",
        description: "Early detection of degradation and drift before service disruption.",
        isConceptual: true,
      },
      {
        id: "ai-workload-management",
        label: "AI Workload Management",
        path: "/solutions/ai-workload-management",
        description: "Connecting compute scheduling with power and thermal headroom.",
        isConceptual: true,
      },
      {
        id: "cooling-optimization",
        label: "Cooling Optimization",
        path: "/solutions/cooling-optimization",
        description: "Calibrating cooling to actual heat loads to eliminate over-cooling waste.",
        isConceptual: true,
      },
      {
        id: "capacity-planning",
        label: "Capacity Planning",
        path: "/solutions/capacity-planning",
        description: "Data-driven expansion planning based on quantitative utilisation trends.",
        isConceptual: true,
      },
      {
        id: "anomaly-detection",
        label: "Anomaly Detection",
        path: "/solutions/anomaly-detection",
        description: "Filtering telemetry noise to surface genuinely significant conditions.",
        isConceptual: true,
      },
      {
        id: "automated-alerts",
        label: "Automated Operational Alerts",
        path: "/solutions/automated-alerts",
        description: "Timely, contextual alerts that reduce response latency and fatigue.",
        isConceptual: true,
      },
    ],
  },
  {
    id: "sustainability",
    label: "Sustainability",
    path: "/sustainability",
    description: "Enabling digital growth as efficiently as technology allows.",
    items: [
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
        description: "Cooling systems calibrated for actual thermal load.",
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
    id: "contact",
    label: "Contact",
    path: "/contact",
    description: "Connect with the GreenNext infrastructure planning team.",
    isDirectLink: true,
  },
];
