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
    tagline: "Southern Tamil Nadu Digital Infrastructure Hub",
    role: "Southern Anchor & Regional Service Node",
    category: "Regional Technology & Infrastructure Hub",
    intro:
      "Madurai serves as the commercial, educational, and logistics capital of southern Tamil Nadu. As digital compute demands surge across non-metropolitan corridors, Madurai provides an advantageous strategic geography to decentralize digital infrastructure away from grid-constrained Tier-1 coastal metros like Chennai.",
    infrastructureRelevance:
      "Madurai offers compelling infrastructure fundamentals for distributed digital infrastructure: robust high-voltage transmission corridors managed by TANTRANSCO, lower seismic vulnerability, and favorable land availability for high-footprint modular facility designs. From a sustainability perspective, southern Tamil Nadu's high solar irradiation presents strategic opportunities for dedicated renewable power wheeling via open-access Power Purchase Agreements (PPAs). Additionally, local water table considerations make Madurai an ideal candidate for closed-loop dry heat-rejection and direct-to-chip liquid cooling architectures that minimize operational water consumption without depleting municipal aquifers.",
    ecosystem:
      "Madurai hosts an established academic and engineering talent ecosystem anchored by Madurai Kamaraj University, Thiagarajar College of Engineering, and specialized polytechnics producing thousands of engineering graduates annually. The regional economy is diversifying rapidly from agro-commerce and textiles into precision engineering, automotive component fabrication, and enterprise IT services across the Madurai-Dindigul industrial corridor.",
    connectivity:
      "Civil aviation connectivity is anchored by Madurai International Airport (IATA: IXM), with direct domestic flights to Chennai, Bengaluru, Mumbai, and Delhi, alongside international connections to Colombo, Dubai, and Singapore. The city sits at the convergence of key national transportation corridors (NH-44 North-South Highway and NH-38), supported by high-capacity terrestrial dark-fiber routes that link southern Tamil Nadu with carrier-neutral peering exchanges in Chennai and Kochi.",
    networkRole:
      "Within GreenNext's conceptual regional architecture, Madurai represents the southern anchor node. It is designed to evaluate regional edge compute distribution, reduce metropolitan backhaul transit latency for southern enterprises, and anchor disaster recovery compute capacity for coastal Tamil Nadu.",
    regionalIntent:
      "GreenNext's focus in Madurai encompasses regional site feasibility due diligence, evaluating utility substation feeder capacities, modeling open-access solar PPA wheeling pathways, and assessing edge compute demands across southern Tamil Nadu's expanding industrial and educational institutions.",
    position: { left: "54%", top: "72%" },
    transitInfo: [
      "Madurai International Airport (IXM)",
      "Southern Tamil Nadu Rail Junction & Freight Corridor",
      "NH-44 (Kanyakumari-Srinagar) & NH-38 Highway Conduits",
      "Carrier-Neutral Terrestrial Dark-Fiber Transit Arteries",
    ],
    image: "madurai",
  },
  coimbatore: {
    id: "coimbatore",
    name: "Coimbatore",
    code: "CJB",
    tagline: "Industrial Engineering & Advanced Manufacturing Hub",
    role: "Western Anchor & Industrial Edge Compute Node",
    category: "Industrial & Technology Ecosystem",
    intro:
      "Coimbatore is the industrial manufacturing and engineering powerhouse of Western Tamil Nadu. Characterized by high concentrations of precision engineering, automotive casting, textile automation, and aerospace component manufacturing, the city represents a premier market for industrial edge AI compute and sovereign on-premise operational intelligence.",
    infrastructureRelevance:
      "Industrial digitisation — including computer vision, predictive robotics, and SCADA analytics — can benefit from localized on-premise and edge computing to reduce network transit latency and support application-specific response-time requirements. Coimbatore possesses robust industrial electrical infrastructure, with dedicated medium-to-high voltage industrial feeders and proximity to the Palakkad Gap's wind energy generation corridor. To support 40 kW to 100 kW+ industrial AI training pods, modular liquid cooling reference designs provide precise thermal rejection without competing with industrial manufacturing processes for cooling water resources.",
    ecosystem:
      "The city is globally recognized for its technical workforce, housing premier institutions such as PSG College of Technology, Coimbatore Institute of Technology (CIT), Government College of Technology (GCT), and Amrita Vishwa Vidyapeetham. Over 25,000 active small, medium, and heavy engineering enterprises in the Coimbatore-Tirupur manufacturing corridor form an active testbed for industrial digital transformation and automated operations.",
    connectivity:
      "Coimbatore International Airport (IATA: CJB) connects directly to major national metropolises and international air hubs. The city occupies a pivotal logistics gateway at the Palakkad Gap, connecting Tamil Nadu directly to Kerala and Karnataka via the NH-544 interstate highway, high-density electrified rail lines, and carrier-neutral fiber routes along the Chennai-Bengaluru-Coimbatore technology golden triangle.",
    networkRole:
      "Within GreenNext's conceptual regional network, Coimbatore represents the western anchor — an operational node tailored to support low-latency manufacturing automation, industrial edge compute clusters, and cross-state network resilience toward Kerala and Karnataka.",
    regionalIntent:
      "GreenNext's focus in Coimbatore is centered on industrial edge data center architectures, exploring brownfield manufacturing facility retrofits, evaluating hybrid air-liquid cooling pod designs, and structuring private edge AI reference models for advanced manufacturing enterprises.",
    position: { left: "38%", top: "57%" },
    transitInfo: [
      "Coimbatore International Airport (CJB)",
      "Palakkad Gap Strategic Multi-State Transit Gateway",
      "NH-544 (Salem-Kochi) High-Capacity Logistics Corridor",
      "Tri-State Inter-Exchange Dark Fiber Terrestrial Rings",
    ],
    image: "coimbatore",
  },
  trichy: {
    id: "trichy",
    name: "Trichy",
    code: "TRZ",
    tagline: "Central Tamil Nadu Transit & Routing Crossroads",
    role: "Central Routing Junction & Network Aggregation Node",
    category: "Strategic Central Tamil Nadu Connectivity",
    intro:
      "Tiruchirappalli (Trichy) occupies the exact geographic center of Tamil Nadu, functioning as the natural transit crossroads of the state. Its central location positions it as a strategic transit and routing junction for distributed digital infrastructure, connecting the northern industrial corridors with southern and western economic centers.",
    infrastructureRelevance:
      "Trichy's geographic midpoint provides distinct engineering advantages for digital infrastructure resilience: network packets routed through central Tamil Nadu achieve balanced round-trip propagation times across Chennai, Bengaluru, Madurai, and Coimbatore. The region features elevated, flood-resilient terrain along the Cauvery basin periphery, access to robust 230kV/400kV high-voltage substation feeds from central state grids, and substantial industrial land reserves with lower land acquisition and civil development costs compared to Tier-1 metros.",
    ecosystem:
      "Trichy is anchored by national premier educational institutions including the National Institute of Technology (NIT Trichy), the Indian Institute of Management (IIM Trichy), and Bharathidasan University. It also maintains a heavy industrial fabrication legacy through public enterprises such as Bharat Heavy Electricals Limited (BHEL) and the Golden Rock Railway Workshops, providing an established regional mechanical and electrical engineering technician workforce.",
    connectivity:
      "Tiruchirappalli International Airport (IATA: TRZ) is the second-largest international passenger airport in Tamil Nadu by passenger volume, offering direct flights across Southeast Asia and the Middle East. Geographically, Trichy represents the convergence point of NH-45 (Grand Southern Trunk Road connecting Chennai to the south), NH-81, and NH-83, supplemented by the Southern Railway Divisional Headquarters rail junction and dual-path national terrestrial dark-fiber conduits.",
    networkRole:
      "Within GreenNext's conceptual regional topology, Trichy functions as the central routing junction and data aggregation node — balancing east-west and north-south data transit, providing optical path diversity, and mitigating single-point-of-failure vulnerabilities in coastal metropolitan fiber networks.",
    regionalIntent:
      "GreenNext's focus in Trichy involves evaluating optical latency aggregation across Tamil Nadu's secondary corridors, studying high-voltage grid interconnect capacities, and modeling modular disaster recovery facilities for public-sector and enterprise institutions.",
    position: { left: "58%", top: "49%" },
    transitInfo: [
      "Tiruchirappalli International Airport (TRZ)",
      "Southern Railway Central Divisional Headquarters Junction",
      "Convergence of NH-45 (GST Corridor), NH-81 & NH-83",
      "Dual-Path High-Throughput Backbone Fiber Intersects",
    ],
    image: "trichy",
  },
  mangalore: {
    id: "mangalore",
    name: "Mangalore",
    code: "IXE",
    tagline: "Coastal Gateway & Regional Telecommunications Corridor",
    role: "Coastal Gateway & Regional Network Diversity Node",
    category: "Coastal Technology & Connectivity Gateway",
    intro:
      "Mangalore (Mangaluru) is the premier coastal port city and technology center of southwest Karnataka. Positioned on the Arabian Sea coastline between Goa and Kerala, Mangalore combines maritime commercial logistics with regional telecommunications infrastructure connecting to wider national networks.",
    infrastructureRelevance:
      "Mangalore offers critical network diversity for Indian digital infrastructure, mitigating the concentration risk of compute facilities clustered exclusively in inland or single-metro hubs. Mangalore's coastal location and regional telecommunications infrastructure may offer opportunities for terrestrial connectivity to wider national networks. Specific fiber routes, carrier diversity, and access to international subsea cable landing stations require site- and provider-specific verification. From a physical facility engineering perspective, coastal environmental conditions — characterized by elevated ambient relative humidity and marine salinity — necessitate specialized infrastructure designs: closed-loop direct-to-chip cooling or indirect systems with sealed heat exchangers and anti-corrosive coatings to protect sensitive AI compute silicon from airborne salt aerosol degradation.",
    ecosystem:
      "Mangalore is recognized as a major educational and healthcare hub in South India, supported by the National Institute of Technology Karnataka (NITK Surathkal), Manipal Academy of Higher Education, and leading medical institutions. The regional economy hosts major commercial banking corporate back-offices, a growing software development presence, and heavy port-related petrochemical, shipping, and export enterprises anchored by the New Mangalore Port Authority (NMPA).",
    connectivity:
      "Mangalore International Airport (IATA: IXE) provides domestic connections and direct international flights to major Gulf destinations. Logistics and ground transit are supported by the New Mangalore all-weather deep-water port, the Konkan Railway network running north toward Mumbai and south through Kerala, and the NH-66 coastal highway corridor, alongside regional terrestrial telecommunications routes.",
    networkRole:
      "Within GreenNext's conceptual network view, Mangalore represents a coastal gateway and cross-state diversity node — evaluating regional network resilience, interconnecting coastal Karnataka with the broader South India grid, and providing geographic separation from inland Tamil Nadu facilities.",
    regionalIntent:
      "GreenNext's focus in Mangalore centers on exploring coastal data center thermal engineering requirements, assessing terrestrial interconnection pathways with carrier-neutral operators, and analyzing industrial power tariffs under the Karnataka Electricity Regulatory Commission (KERC).",
    position: { left: "14%", top: "28%" },
    transitInfo: [
      "Mangalore International Airport (IXE)",
      "Regional Terrestrial Fiber Corridors & Carrier Interconnects",
      "New Mangalore Port (NMPA) All-Weather Deep-Water Gateway",
      "Konkan Railway & NH-66 Multi-Modal Coastal Transit Corridors",
    ],
    image: "mangalore",
  },
};

export const REGIONAL_NETWORK_DISCLAIMER =
  "The regions described represent GreenNext's infrastructure planning focus areas. This is a conceptual network view, not a claim of currently operating GreenNext facilities at these locations.";
