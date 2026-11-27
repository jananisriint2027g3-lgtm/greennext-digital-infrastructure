export interface GlanceStat {
  id: string;
  numericValue: number;
  prefix?: string;
  suffix?: string;
  displayValue: string;
  label: string;
  description: string;
  /** Disable count-up animation for calendar years like 1985 if desired, or animate subtly */
  animateCount?: boolean;
}

export interface LegacyHighlight {
  label: string;
  value: string;
  detail: string;
}

export interface DirectorProfile {
  id: string;
  name: string;
  designation: string;
  bio: string;
  imageSrc?: string;
  imageAlt?: string;
  isPlaceholder: boolean;
}

export interface MissionTheme {
  id: string;
  title: string;
  description: string;
}

export interface CoreValue {
  id: "innovation" | "reliability" | "security" | "sustainability";
  title: string;
  description: string;
}

export interface CustomerLogo {
  id: string;
  name: string;
  logoSrc: string;
  alt: string;
  href?: string;
}

export const LEGACY_HIGHLIGHTS: LegacyHighlight[] = [
  {
    label: "Established",
    value: "1985",
    detail: "Group founding year",
  },
  {
    label: "Experience",
    value: "40+ Years",
    detail: "Group business legacy",
  },
  {
    label: "Group Workforce",
    value: "7,000+ Employees",
    detail: "Across group companies",
  },
];

export const GROUP_GLANCE_STATS: GlanceStat[] = [
  {
    id: "established-year",
    numericValue: 1985,
    displayValue: "1985",
    label: "Year of Group Establishment",
    description: "Four decades of foundational enterprise trust and operational discipline.",
    animateCount: false,
  },
  {
    id: "group-legacy",
    numericValue: 40,
    suffix: "+",
    displayValue: "40+",
    label: "Years of Group Legacy",
    description: "Setting industry standards and building lasting customer relationships.",
    animateCount: true,
  },
  {
    id: "group-workforce",
    numericValue: 7000,
    suffix: "+",
    displayValue: "7,000+",
    label: "Employees Across Group Companies",
    description: "Dedicated professionals driving excellence across group operations.",
    animateCount: true,
  },
];

/**
 * Group Leadership – Board of Directors profiles.
 * Sourced from the official ISI Security About Us page (https://www.isisecurity.in/about).
 * These profiles represent group-level leadership.
 */
export const BOARD_OF_DIRECTORS: DirectorProfile[] = [
  {
    id: "s-vijayakumar",
    name: "S. Vijayakumar",
    designation: "Managing Director & Founder",
    bio: "A highly decorated former Indian Air Force officer and Founder of ISI, widely respected as 'SIR' Vijayakumar. Recipient of the Marusthal Seva Medal for meritorious service in desert terrain. Holds qualifications in Business Management and Law. Founded Security & Intelligence Resources (SIR) in 1994, which later took over ISI, building a professionally managed organisation delivering integrated security, loss-prevention, facilities management, and manpower solutions. An acknowledged industry leader with extensive contributions to security operations, personnel training, SOP development, and disaster management.",
    imageSrc: "/images/leadership/s-vijayakumar.jpg",
    imageAlt: "S. Vijayakumar, Managing Director & Founder",
    isPlaceholder: false,
  },
  {
    id: "indiradevi",
    name: "Indiradevi",
    designation: "Director",
    bio: "Director of ISI, playing an active role in financial oversight and strategic decision-making. Contributes valuable inputs to the finance function, supporting sound and sustainable business decisions. With a strong commitment to social service and employee welfare, she is an active member of the Inner Wheel Club. Instrumental in conceptualising and establishing ISI's Staff Welfare Corpus Fund, through which numerous employees have benefited, reflecting the organisation's people-centric values.",
    imageSrc: "/images/leadership/indiradevi.jpeg",
    imageAlt: "Indiradevi, Director",
    isPlaceholder: false,
  },
  {
    id: "v-vishalkumar",
    name: "V. Vishalkumar",
    designation: "Director",
    bio: "Director at ISI, representing the next generation of leadership. Brings international corporate experience from Accenture (PMO professional) and Forest Coach Lines, Sydney (Transport Analyst). His multidisciplinary academic foundation includes Computer Engineering, Master's in Logistics & Transport Management (University of Sydney), Law, Human Resources Management, Fire & Industrial Safety, and NEBOSH certification. This unique blend enables him to design robust, compliant, and risk-aware operational frameworks.",
    imageSrc: "/images/leadership/v-vishalkumar.jpg",
    imageAlt: "V. Vishalkumar, Director",
    isPlaceholder: false,
  },
  {
    id: "v-varshithkumar",
    name: "V. Varshithkumar",
    designation: "Executive Director",
    bio: "Executive Director leading initiatives focused on strengthening systems, compliance, and scalable growth. With global academic exposure and international experience, he brings a structured, technology-driven approach. Education: B.Sc. Mechanical Engineering (SUNY), M.Sc. Transport & Logistics (TUM Germany), Postgraduate Diploma in Fire & Industrial Safety, NEBOSH IGC, and LL.B (Government Law College, Madurai).",
    imageSrc: "/images/leadership/v-varshithkumar.jpg",
    imageAlt: "V. Varshithkumar, Executive Director",
    isPlaceholder: false,
  },
  {
    id: "rajkumar-sankaran",
    name: "Rajkumar Sankaran",
    designation: "Executive Director",
    bio: "Executive Director since 2017, leading strategic growth across manpower solutions, security services, and facility management. Over 25 years of experience in operations, compliance, and global project delivery with clients including Barry-Wehmiller, Henry Schein, and BOC. Holds MBA (ICFAI) in Supply Chain Management & Operations, and Bachelor of Law (BL) focused on Company Law and Labour Legislation. Emphasizes operational excellence, data-driven decision-making, and employee welfare.",
    imageSrc: "/images/leadership/rajkumar-sankaran.jpeg",
    imageAlt: "Rajkumar Sankaran, Executive Director",
    isPlaceholder: false,
  },
  {
    id: "s-yuvaraj",
    name: "S. Yuvaraj",
    designation: "CEO",
    bio: "MBA, LLB, a seasoned leader with deep expertise in administration, governance, and statutory compliance. Drives strategic direction with a strong focus on operational integrity, risk management, and regulatory adherence. With prior service in the Indian Air Force and as Assistant Commissioner at EPFO, he brings proven experience in labour laws, audits, and enforcement, strengthening organizational governance and sustainable growth.",
    imageSrc: "/images/leadership/s-yuvaraj.jpg",
    imageAlt: "S. Yuvaraj, CEO",
    isPlaceholder: false,
  },
];

export const MISSION_THEMES: MissionTheme[] = [
  {
    id: "ai-ready",
    title: "AI-Ready Infrastructure",
    description:
      "Purpose-engineered facility topologies designed for high-density AI training and inference workloads.",
  },
  {
    id: "hpc",
    title: "High-Performance Computing",
    description:
      "Compute environments built to sustain demanding parallel processing, low latency, and heavy thermal loads.",
  },
  {
    id: "secure-resilient",
    title: "Secure & Resilient Environments",
    description:
      "Multi-layered physical and operational safeguards supporting continuous availability and data protection.",
  },
  {
    id: "scalable",
    title: "Scalable Infrastructure Solutions",
    description:
      "Modular architecture engineered to grow seamlessly alongside evolving enterprise and cloud demands.",
  },
  {
    id: "sustainable",
    title: "Sustainable Technology Development",
    description:
      "Energy-conscious engineering and responsible resource management integrated into core facility design.",
  },
  {
    id: "customer-centric",
    title: "Customer-Centric Innovation",
    description:
      "Tailored infrastructure partnerships focused on long-term reliability, transparency, and client outcomes.",
  },
];

export const CORE_VALUES: CoreValue[] = [
  {
    id: "innovation",
    title: "Innovation",
    description:
      "Advancing next-generation AI, cloud, and high-performance computing infrastructure.",
  },
  {
    id: "reliability",
    title: "Reliability",
    description:
      "Building dependable infrastructure designed to support business continuity and operational excellence.",
  },
  {
    id: "security",
    title: "Security",
    description:
      "Prioritising infrastructure protection, data security, resilience, and operational integrity.",
  },
  {
    id: "sustainability",
    title: "Sustainability",
    description:
      "Promoting responsible infrastructure development and energy-efficient technology practices.",
  },
];

/**
 * Approved customer brand logos.
 * Populate with verified SVG or transparent PNG assets from /public/images/customers/.
 * When empty, Section 8 displays the Coming Soon partnership showcase.
 */
export const TRUSTED_CUSTOMERS: CustomerLogo[] = [];
