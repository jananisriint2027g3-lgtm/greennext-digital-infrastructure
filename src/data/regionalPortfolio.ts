export type PortfolioDataStatus =
  "Source-reported" | "Proposed" | "To be confirmed" | "Unavailable";

export interface PortfolioField {
  label: string;
  value: string;
  status: PortfolioDataStatus;
  note?: string;
}

export interface RegionalPortfolioLocation {
  id: string;
  name: string;
  area: string;
  state: string;
  tagline: string;
  overview: string;
  status: PortfolioDataStatus;
  facilityType: string;
  land: PortfolioField;
  buildingArea: PortfolioField;
  sitePower: PortfolioField;
  itLoad: PortfolioField;
  substation: PortfolioField;
  renewable: PortfolioField;
  water: PortfolioField;
  cooling: PortfolioField;
  pue: PortfolioField;
  connectivity: PortfolioField;
  travel: PortfolioField;
  zoning: PortfolioField;
  ecosystems: string[];
  focus: string[];
  conflicts: string[];
  sources: string[];
}

// Internal data-quality meaning: Not specified in available source data.
// The public value stays concise so visitors see a clear unavailable state.
const unavailable = (label: string): PortfolioField => ({
  label,
  value: "Unavailable for this region",
  status: "Unavailable",
});

/**
 * Normalized from the supplied Green Data reference project's
 * src/data/locationsData.js and checked against its locations.html / V2 page.
 * These are portfolio claims, not independent site, utility, or facility verification.
 */
export const REGIONAL_PORTFOLIO: RegionalPortfolioLocation[] = [
  {
    id: "coimbatore",
    name: "Coimbatore",
    area: "Tamil Nadu",
    state: "Western Tamil Nadu",
    tagline: "Engineering, DeepTech and advanced manufacturing corridor",
    overview:
      "The reference positions Coimbatore as a proposed integrated IT, knowledge, engineering, and enterprise-compute campus serving manufacturing, aerospace, GCC, and AI use cases.",
    status: "Proposed",
    facilityType: "Proposed enterprise, AI-optimised and industrial edge development",
    land: {
      label: "Portfolio land",
      value: "85+ acres; 98+ acres",
      status: "Source-reported",
      note: "Conflicting source-reported figures; do not treat either as verified.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "100 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: unavailable("Data-centre IT load"),
    substation: {
      label: "Substation",
      value: "230/110 kV dedicated GIS; 110 kV reference ingress",
      status: "To be confirmed",
    },
    renewable: {
      label: "Renewable readiness",
      value: "Reference mentions renewable/open-access planning",
      status: "Proposed",
    },
    water: {
      label: "Water",
      value: "3.5 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Six diverse telecommunication conduits connecting Chennai and Kochi cable landings; NH-544 / Avinashi Road corridor described",
      status: "Source-reported",
      note: "Carrier count and route diversity require provider confirmation.",
    },
    travel: {
      label: "Airport / transit",
      value: "25 minutes to Coimbatore International Airport; NH-544 and rail corridor",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "IT park / aerospace / hi-tech industrial suitability described",
      status: "Proposed",
    },
    ecosystems: [
      "Precision engineering",
      "Aerospace and defence",
      "Manufacturing automation",
      "GCC and software services",
    ],
    focus: [
      "AI and enterprise compute",
      "Industrial edge",
      "Aerospace and robotics",
      "IT and knowledge parks",
    ],
    conflicts: ["Land: 85+ acres in locationsData.js versus 98+ acres in locations.html."],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
      "Green Data reference/V2-GreenNext-Technologies.html",
    ],
  },
  {
    id: "hosur",
    name: "Hosur",
    area: "Tamil Nadu",
    state: "Tamil Nadu–Karnataka border",
    tagline: "Bengaluru-border EV, robotics and precision technology gateway",
    overview:
      "The reference positions Hosur as a proposed industrial and hyperscale-edge corridor close to Bengaluru, with EV, drone, robotics, and precision-electronics demand.",
    status: "Proposed",
    facilityType: "Proposed industrial, AI edge and hyperscale-edge development",
    land: {
      label: "Portfolio land",
      value: "90+ acres; 65 acres",
      status: "Source-reported",
      note: "Conflicting source-reported figures; do not treat either as verified.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "120 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: {
      label: "Reference compute claim",
      value: "80+ MW hyperscale compute parcel",
      status: "Proposed",
      note: "Reference claim only; not confirmed IT load or secured capacity.",
    },
    substation: {
      label: "Substation",
      value: "230/110 kV dedicated hookup",
      status: "Source-reported",
      note: "Connection, redundancy, and approval status require confirmation.",
    },
    renewable: {
      label: "Renewable readiness",
      value: "100% green open-access power described in reference",
      status: "Proposed",
    },
    water: {
      label: "Water",
      value: "2.5 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Carrier-neutral fibre loop with six Tier-1 backbones; NH-44, Electronic City proximity and rail-freight connectivity described",
      status: "Source-reported",
    },
    travel: {
      label: "Airport / transit",
      value: "60 minutes to Bengaluru International Airport; 35 km from Electronic City",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "Industrial / IT-SEZ suitability described",
      status: "Proposed",
    },
    ecosystems: [
      "EV and battery",
      "Robotics and mechatronics",
      "Drone and avionics",
      "Bengaluru technology corridor",
    ],
    focus: ["AI edge", "Hyperscale edge", "Precision industrial", "GPU and high-density workloads"],
    conflicts: ["Land: 90+ acres in locationsData.js versus 65 acres in locations.html."],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
    ],
  },
  {
    id: "madurai",
    name: "Madurai",
    area: "Tamil Nadu",
    state: "Southern Tamil Nadu",
    tagline: "Enterprise IT, BFSI and southern technology expansion hub",
    overview:
      "The reference positions Madurai as a proposed ELCOT-adjacent technology and enterprise-compute cluster serving southern Tamil Nadu, with GCC, BFSI/FinTech, colocation, and regional IT demand.",
    status: "Proposed",
    facilityType: "Proposed IT park, GCC, colocation and regional computing development",
    land: {
      label: "Portfolio land",
      value: "75+ acres; 93+ acres",
      status: "Source-reported",
      note: "Conflicting source-reported figures; do not treat either as verified.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "90 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: unavailable("Data-centre IT load"),
    substation: {
      label: "Substation",
      value: "230/110 kV substation described; HTML separately describes a 110 kV dedicated feed",
      status: "To be confirmed",
    },
    renewable: {
      label: "Renewable readiness",
      value: "Solar/open-access planning opportunity described",
      status: "Proposed",
    },
    water: {
      label: "Water",
      value: "2.2 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Direct carrier routing via BSNL, Airtel, Jio and Tata Communications; NH-44, Ring Road, ELCOT and the Madurai-Tuticorin corridor described",
      status: "Source-reported",
    },
    travel: {
      label: "Airport / transit",
      value: "20 minutes to Madurai International Airport",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "IT park, commercial and institutional suitability described",
      status: "Proposed",
    },
    ecosystems: [
      "IT/ITES and GCC",
      "BFSI and FinTech",
      "Healthcare",
      "Education and engineering talent",
    ],
    focus: ["Enterprise IT", "Colocation", "Regional edge", "Disaster recovery"],
    conflicts: ["Land: 75+ acres in locationsData.js versus 93+ acres in locations.html."],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
      "Green Data reference/V2-GreenNext-Technologies.html",
    ],
  },
  {
    id: "trichy",
    name: "Tiruchirappalli (Trichy)",
    area: "Tamil Nadu",
    state: "Central Tamil Nadu",
    tagline: "Knowledge, research and central connectivity node",
    overview:
      "The reference describes Trichy as a proposed knowledge and technology corridor linked to education, heavy engineering, enterprise IT, research, and central Tamil Nadu connectivity.",
    status: "Proposed",
    facilityType: "Proposed IT, GCC, research and regional disaster-recovery development",
    land: {
      label: "Portfolio land",
      value: "45+ acres",
      status: "Source-reported",
      note: "The supplied location sources do not independently verify title or development status.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "80 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: unavailable("Data-centre IT load"),
    substation: {
      label: "Substation",
      value: "230/110 kV substation described",
      status: "To be confirmed",
    },
    renewable: unavailable("Renewable readiness"),
    water: {
      label: "Water",
      value: "2.0 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Dual underground fibre ring with four diverse national carriers; NH-45, NH-83, NH-67, rail junction, airport and international connectivity described",
      status: "Source-reported",
    },
    travel: {
      label: "Airport / transit",
      value: "15 minutes to Tiruchirappalli International Airport",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "Commercial, IT-SEZ and institutional suitability described",
      status: "Proposed",
    },
    ecosystems: [
      "NIT Trichy and IIM Trichy",
      "BHEL and heavy engineering",
      "Research and DeepTech",
      "GCC and software services",
    ],
    focus: ["Knowledge city", "Research computing", "Regional aggregation", "Disaster recovery"],
    conflicts: [],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
    ],
  },
  {
    id: "tirunelveli",
    name: "Tirunelveli",
    area: "Tamil Nadu",
    state: "Southern Tamil Nadu",
    tagline: "Renewable-energy and proposed AI hyperscale corridor",
    overview:
      "The reference positions Tirunelveli/Gangaikondan as a proposed renewable-energy and high-density AI data-centre corridor connected to southern logistics and industrial ecosystems.",
    status: "Proposed",
    facilityType: "Proposed renewable-energy, hyperscale AI and high-density compute development",
    land: {
      label: "Portfolio land",
      value: "50+ acres; 40 acres",
      status: "Source-reported",
      note: "Conflicting source-reported figures; do not treat either as verified.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "150 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: {
      label: "Reference compute claim",
      value: "100+ MW renewable data-centre park",
      status: "Proposed",
      note: "Reference claim only; not confirmed IT load or secured capacity.",
    },
    substation: {
      label: "Substation",
      value: "400/230 kV grid; 230 kV reference substation within 800 m",
      status: "To be confirmed",
    },
    renewable: {
      label: "Renewable readiness",
      value: "Wind/solar corridor and renewable wheeling described",
      status: "Proposed",
    },
    water: {
      label: "Water",
      value: "3.0 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Redundant underground optical fibre conduits on dual diverse highway paths; NH-44, rail and Tuticorin port connectivity described",
      status: "Source-reported",
    },
    travel: {
      label: "Airport / transit",
      value: "35 minutes to Tuticorin Airport; 45 km reference to port",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "IT/data-centre and heavy-engineering suitability described",
      status: "Proposed",
    },
    ecosystems: ["Renewable energy", "AI and HPC", "SpaceTech", "Clean-tech manufacturing"],
    focus: ["AI hyperscale", "GPU training", "Green power planning", "High-density thermal design"],
    conflicts: [
      "Land: 50+ acres in locationsData.js versus 40 acres in locations.html.",
      "Site power and reference 100+ MW data-centre claims are separate and must not be combined as IT load.",
    ],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
    ],
  },
  {
    id: "puducherry",
    name: "Puducherry (Pondicherry)",
    area: "Union Territory of Puducherry",
    state: "East Coast corridor",
    tagline: "Coastal edge, innovation and regional resilience corridor",
    overview:
      "The reference describes Puducherry as a proposed coastal knowledge, executive, edge-compute, and innovation corridor linked to Chennai and the East Coast Road.",
    status: "Proposed",
    facilityType: "Proposed edge, disaster-recovery, R&D and technology campus development",
    land: {
      label: "Portfolio land",
      value: "45+ acres; 35 acres",
      status: "Source-reported",
      note: "Conflicting source-reported figures; do not treat either as verified.",
    },
    buildingArea: unavailable("Data-centre building area"),
    sitePower: {
      label: "Site power",
      value: "60 MW scalable",
      status: "Source-reported",
      note: "Site/portfolio power claim; not equivalent to data-centre IT load.",
    },
    itLoad: unavailable("Data-centre IT load"),
    substation: {
      label: "Substation",
      value: "110/33 kV dedicated substation described",
      status: "To be confirmed",
    },
    renewable: unavailable("Renewable readiness"),
    water: {
      label: "Water",
      value: "1.8 MLD",
      status: "Source-reported",
      note: "Allocation and continuity require utility confirmation.",
    },
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "ECR, NH-32, Chennai backhaul and port connectivity described; reference also claims a 1.2 ms route to Chennai subsea cable landings",
      status: "Source-reported",
      note: "The reference latency claim is not independently validated.",
    },
    travel: {
      label: "Airport / transit",
      value: "15 minutes to Puducherry Airport; 90 minutes to Chennai International Airport",
      status: "Source-reported",
    },
    zoning: {
      label: "Zoning",
      value: "Tourism-commercial-IT mixed suitability described",
      status: "Proposed",
    },
    ecosystems: [
      "Software and R&D",
      "AI edge and disaster recovery",
      "Biotech and precision instruments",
      "Executive technology services",
    ],
    focus: ["AI edge", "Disaster recovery", "Innovation districts", "Regional connectivity"],
    conflicts: ["Land: 45+ acres in locationsData.js versus 35 acres in locations.html."],
    sources: [
      "Green Data reference/src/data/locationsData.js",
      "Green Data reference/locations.html",
    ],
  },
  {
    id: "mangalore",
    name: "Mangalore",
    area: "Karnataka",
    state: "Coastal Karnataka",
    tagline: "Coastal connectivity and regional resilience planning node",
    overview:
      "Mangalore is retained as a conceptual coastal Karnataka node for regional connectivity, enterprise resilience, and technology ecosystem assessment. Location-specific campus and data-centre specifications are not present in the supplied reference data.",
    status: "To be confirmed",
    facilityType:
      "Conceptual coastal connectivity, enterprise resilience and edge-infrastructure planning",
    land: unavailable("Portfolio land"),
    buildingArea: unavailable("Data-centre building area"),
    sitePower: unavailable("Site power"),
    itLoad: unavailable("Data-centre IT load"),
    substation: unavailable("Substation"),
    renewable: unavailable("Renewable readiness"),
    water: unavailable("Water"),
    cooling: unavailable("Cooling system"),
    pue: unavailable("PUE"),
    connectivity: {
      label: "Connectivity",
      value:
        "Coastal Karnataka gateway; carrier, fibre, port and route specifications require confirmation",
      status: "To be confirmed",
    },
    travel: {
      label: "Airport / transit",
      value: "Mangalore International Airport; port and rail specifications require confirmation",
      status: "To be confirmed",
    },
    zoning: unavailable("Zoning"),
    ecosystems: [
      "Coastal Karnataka",
      "Port and logistics",
      "Enterprise resilience",
      "Regional network diversity",
    ],
    focus: ["Connectivity assessment", "Coastal thermal resilience", "Enterprise edge planning"],
    conflicts: [
      "No location-specific land, power, water, facility or IT-load figure is available in the supplied reference data.",
    ],
    sources: ["Green Data reference regional planning data"],
  },
];

export const REGIONAL_PORTFOLIO_DISCLAIMER =
  "Portfolio figures are planning references. They do not confirm GreenNext-owned land, operating facilities, secured utility capacity, customer deployments, or data-centre IT load.";
