export interface RegionInfo {
  id: string;
  name: string;
  code: string;
  tagline: string;
  role: string;
  category: string;
  intro: string;
  infrastructureRelevance: string;
  ecosystem: string;
  connectivity: string;
  networkRole: string;
  regionalIntent: string;
  position: { left: string; top: string };
  transitInfo: string[];
  /** Regional context image – factual disclaimer: illustrative infrastructure/connectivity context only */
  image: string;
}

// Regional image imports are handled at the consumer level (RegionalExplorer, RegionalPageTemplate)
// to keep this data file free of asset module dependencies.

export const REGION_IMAGE_KEYS: Record<string, string> = {
  madurai: "madurai",
  coimbatore: "coimbatore",
  trichy: "trichy",
  mangalore: "mangalore",
};

export const REGIONS_DATA: Record<string, RegionInfo> = {
  madurai: {
    id: "madurai",
    name: "Madurai",
    code: "MDU",
    tagline: "Regional Technology & Infrastructure Hub",
    role: "Southern Anchor & Regional Service Hub",
    category: "Regional Technology & Infrastructure Hub",
    intro:
      "Madurai is one of Tamil Nadu's most significant secondary cities, with a growing technology services presence, established educational institutions, and improving digital connectivity. Its position in southern Tamil Nadu makes it a relevant focus location for regional digital infrastructure that serves the broader southern part of the state.",
    infrastructureRelevance:
      "Infrastructure investment in Madurai can complement rather than duplicate capacity that exists in Chennai. As the primary large city in southern Tamil Nadu, Madurai has the characteristics of a location where regional digital infrastructure investment would serve a meaningful addressable geography — including the districts of Madurai, Dindigul, Virudhunagar, Ramanathapuram, and surrounding areas.",
    ecosystem:
      "Madurai has an established presence in technology services and higher education, with institutions that produce engineering and technology graduates. This talent availability is a relevant operational consideration for infrastructure requiring skilled technical personnel.",
    connectivity:
      "Madurai has civil aviation connectivity (Madurai International Airport — IATA: IXM) and improving road and rail infrastructure. Digital connectivity — fibre and broadband — has been developing, establishing a dedicated regional transit baseline.",
    networkRole:
      "Within GreenNext's conceptual regional network, Madurai serves as the southernmost focus location — a node that extends digital infrastructure coverage into southern Tamil Nadu and complements the network's northern and western locations.",
    regionalIntent:
      "GreenNext's focus in Madurai is to explore infrastructure requirements, connectivity pathways, local ecosystem strengths, and the opportunity to expand digital services capacity in southern Tamil Nadu.",
    position: { left: "54%", top: "72%" },
    transitInfo: [
      "Madurai International Airport (IXM)",
      "Southern Tamil Nadu Rail Junction",
      "NH-44 & NH-38 Transport Corridors",
      "Expanding Regional Terrestrial Fiber Conduits",
    ],
    image: "madurai",
  },
  coimbatore: {
    id: "coimbatore",
    name: "Coimbatore",
    code: "CJB",
    tagline: "Industrial & Technology Ecosystem",
    role: "Western Anchor & Industrial Edge Compute Hub",
    category: "Industrial & Technology Ecosystem",
    intro:
      "Coimbatore has a well-established industrial base — particularly in manufacturing, textiles, and engineering — alongside a growing technology sector. The city has a strong engineering talent pool and increasing connectivity infrastructure, making it a relevant location for digital infrastructure that serves both industrial and technology ecosystem needs.",
    infrastructureRelevance:
      "Coimbatore's distinct industrial character makes it relevant for edge and regional compute infrastructure that serves industrial digitisation — manufacturing automation, supply chain management, and the digital transformation of established industrial businesses — as well as the broader technology ecosystem of western Tamil Nadu and the Nilgiris corridor.",
    ecosystem:
      "Coimbatore is home to a substantial manufacturing and engineering sector, with a workforce that includes significant technical and industrial engineering expertise. The city has a thriving technology services presence alongside its manufacturing base.",
    connectivity:
      "Coimbatore International Airport (IATA: CJB) provides aviation connectivity, and the city has direct road and rail connections to Chennai, Bangalore, and Kerala. Its position in western Tamil Nadu makes it a connectivity gateway between Tamil Nadu, Karnataka, and Kerala.",
    networkRole:
      "Within GreenNext's conceptual regional network, Coimbatore represents the western anchor — a node positioned to serve industrial and technology ecosystems and provide cross-state connectivity relevance toward Karnataka and Kerala.",
    regionalIntent:
      "GreenNext's focus in Coimbatore is to understand how digital infrastructure can support industrial technology adoption and serve a technically capable regional workforce with increasing digital infrastructure needs.",
    position: { left: "38%", top: "57%" },
    transitInfo: [
      "Coimbatore International Airport (CJB)",
      "Palakkad Gap Strategic Transit Corridor",
      "Direct High-Speed Rail to Chennai & Bengaluru",
      "Cross-State Interstate Highway Junction",
    ],
    image: "coimbatore",
  },
  trichy: {
    id: "trichy",
    name: "Trichy",
    code: "TRZ",
    tagline: "Strategic Central Tamil Nadu Connectivity",
    role: "Central Routing & Transit Junction",
    category: "Strategic Central Tamil Nadu Connectivity",
    intro:
      "Trichy (Tiruchirappalli) occupies a strategically important geographic position at approximately the centre of Tamil Nadu, making it a natural junction point for connectivity infrastructure between the northern and southern parts of the state.",
    infrastructureRelevance:
      "Trichy's central location in Tamil Nadu gives it a distinctive infrastructure relevance: a location at the intersection of north-south connectivity routes can serve as a distribution or routing point for both physical and digital infrastructure. Network routing, fibre connectivity, and data routing all benefit from the presence of infrastructure at central geographic positions.",
    ecosystem:
      "Trichy has an established higher education sector, including premier national technical institutions that contribute to regional engineering talent. This educational presence is directly relevant to infrastructure operations requiring technical personnel.",
    connectivity:
      "Tiruchirappalli International Airport (IATA: TRZ) provides connectivity across India and international destinations. Road and rail infrastructure connects Trichy to Chennai, Madurai, Coimbatore, and other Tamil Nadu cities.",
    networkRole:
      "Within GreenNext's conceptual regional network, Trichy serves as the central connectivity node — a location whose geographic position makes it relevant for network routing and resilience planning across the north-south axis of Tamil Nadu's digital infrastructure.",
    regionalIntent:
      "GreenNext's focus in Trichy is to evaluate its role as a connectivity junction and regional distribution point within a distributed South India infrastructure network.",
    position: { left: "58%", top: "49%" },
    transitInfo: [
      "Tiruchirappalli International Airport (TRZ)",
      "Central Tamil Nadu Railway Headquarters",
      "Golden Rock Engineering Cluster Proximity",
      "Intersection of NH-45 & Central Highway Grid",
    ],
    image: "trichy",
  },
  mangalore: {
    id: "mangalore",
    name: "Mangalore",
    code: "IXE",
    tagline: "Coastal Technology & Connectivity Gateway",
    role: "Coastal Gateway & Undersea Cable Interconnect",
    category: "Coastal Technology & Connectivity Gateway",
    intro:
      "Mangalore (Mangaluru) is a significant port city and coastal technology hub with established connectivity advantages — including proximity to undersea cable landing infrastructure that is strategically relevant for internet connectivity. It serves as a gateway between Karnataka and Kerala, with a growing technology services presence.",
    infrastructureRelevance:
      "Mangalore's coastal position gives it proximity to undersea cable landing station infrastructure — a connectivity asset of strategic importance for internet infrastructure. Undersea cables are the primary physical layer of international internet connectivity, and proximity to landing points provides potential connectivity advantages for regional digital infrastructure.",
    ecosystem:
      "Mangalore has a growing technology services sector alongside its established port, trade, and commercial industries. The city has prominent educational institutions with technology programmes, contributing to a skilled regional workforce.",
    connectivity:
      "Mangalore International Airport (IATA: IXE) provides domestic and international connectivity. The city has road and rail connections to Bangalore, Mumbai, and Kerala, and its port is one of India's major commercial gateways.",
    networkRole:
      "Within GreenNext's conceptual regional network, Mangalore serves as the coastal and cross-state gateway node — providing network diversity relative to inland Tamil Nadu locations and connectivity complementarity through its coastal assets.",
    regionalIntent:
      "GreenNext's focus in Mangalore is to explore its connectivity assets, port infrastructure relevance, and its role as a coastal gateway for a distributed South India infrastructure approach.",
    position: { left: "14%", top: "28%" },
    transitInfo: [
      "Mangalore International Airport (IXE)",
      "Proximity to Coastal Undersea Cable Landings",
      "New Mangalore Port Commercial Connectivity",
      "Konkan Railway & Coastal Highway Conduits",
    ],
    image: "mangalore",
  },
};

export const REGIONAL_NETWORK_DISCLAIMER =
  "The regions described represent GreenNext's infrastructure planning focus areas. This is a conceptual network view, not a claim of currently operating GreenNext facilities at these locations.";
