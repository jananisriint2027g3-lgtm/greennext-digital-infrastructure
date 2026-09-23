export interface HeroSlide {
  id: string;
  theme: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: {
    label: string;
    path: string;
  };
  secondaryCta: {
    label: string;
    path: string;
  };
  conceptTag: string;
  schematicType: "foundation" | "ai" | "energy" | "automation" | "regional";
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "brand-foundation",
    theme: "Brand Foundation",
    eyebrow: "South India · Intelligent Infrastructure",
    headline: "Intelligent Infrastructure for a Sustainable Digital Future",
    description:
      "GreenNext connects AI-driven data center infrastructure, energy efficiency, and intelligent automation to build resilient digital ecosystems across South India.",
    primaryCta: {
      label: "Explore Our Infrastructure →",
      path: "/infrastructure",
    },
    secondaryCta: {
      label: "Explore Our Regions",
      path: "/regions/overview",
    },
    conceptTag: "CONCEPTUAL INFRASTRUCTURE MODEL",
    schematicType: "foundation",
  },
  {
    id: "ai-ready",
    theme: "AI-Ready Infrastructure",
    eyebrow: "AI-Driven Data Centers",
    headline: "Infrastructure Built for the AI Era",
    description:
      "AI workloads place structurally different demands on compute, power, cooling, and operations. GreenNext approaches these requirements as an integrated infrastructure system — not as separate engineering concerns.",
    primaryCta: {
      label: "Explore AI-Ready Infrastructure →",
      path: "/infrastructure/ai-ready",
    },
    secondaryCta: {
      label: "View Infrastructure Architecture",
      path: "/infrastructure/architecture",
    },
    conceptTag: "HIGH-DENSITY COMPUTE ARCHITECTURE",
    schematicType: "ai",
  },
  {
    id: "energy-efficiency",
    theme: "Energy Efficiency",
    eyebrow: "Energy Efficiency",
    headline: "Every Watt Matters",
    description:
      "Energy performance is an infrastructure discipline. GreenNext connects workload demand signals with power, thermal, and operational data — creating the visibility needed for informed, continuous energy optimisation.",
    primaryCta: {
      label: "Explore Energy Efficiency →",
      path: "/energy/monitoring",
    },
    secondaryCta: {
      label: "Explore Cooling Efficiency",
      path: "/energy/cooling",
    },
    conceptTag: "WORKLOAD-AWARE THERMAL & POWER LOOP",
    schematicType: "energy",
  },
  {
    id: "intelligent-automation",
    theme: "Intelligent Automation",
    eyebrow: "Intelligent Automation",
    headline: "Infrastructure That Responds Intelligently",
    description:
      "Automation supports infrastructure operators in identifying changing conditions, understanding their implications, and coordinating consistent responses across critical systems — without replacing operational judgement.",
    primaryCta: {
      label: "Explore Automation →",
      path: "/automation/monitoring",
    },
    secondaryCta: {
      label: "View Automation Workflow",
      path: "/automation/monitoring",
    },
    conceptTag: "CLOSED-LOOP OPERATIONAL SUPPORT",
    schematicType: "automation",
  },
  {
    id: "regional-infrastructure",
    theme: "Regional Digital Infrastructure",
    eyebrow: "Regional Presence · South India",
    headline: "A Regional Approach to Digital Infrastructure",
    description:
      "Digital infrastructure serving a region effectively requires more than a single central location. GreenNext focuses on Madurai, Coimbatore, Trichy, and Mangalore — four locations with distinct and complementary infrastructure relevance.",
    primaryCta: {
      label: "Explore Our Regions →",
      path: "/regions/overview",
    },
    secondaryCta: {
      label: "View Regional Dashboard",
      path: "/regions/overview#dashboard",
    },
    conceptTag: "FOUR-NODE DISTRIBUTED TOPOLOGY",
    schematicType: "regional",
  },
];
