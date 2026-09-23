# GreenNext — Content Implementation Specification
**Document type:** Content Implementation Specification (CIS)
**Source of truth:** GreenNext Website Content Document (approved)
**Status:** Implementation-ready · Pre-design phase
**Prepared for:** UI/UX Designer · Frontend Developer

---

> [!IMPORTANT]
> **This document does not include visual design decisions.**
> No colours, fonts, gradients, animations, illustrations, or decorative styles are specified here.
> The priority order is: **Approved Content → Information Architecture → Content Components → Data Structure → Design Handoff**

---

## TABLE OF CONTENTS

1. Website Sitemap
2. Global Navigation
3. Homepage Content Structure
4. About GreenNext
5. AI-Driven Infrastructure
6. Energy Efficiency
7. Intelligent Automation
8. Regional Infrastructure
9. Infrastructure Architecture
10. Sustainability
11. Regional Infrastructure Dashboard
12. Use Cases
13. GreenNext Approach
14. Contact / Final CTA
15. Footer
16. Microcopy
17. Content & Data Requirements
18. Content State Taxonomy
19. Final Content Validation Checklist

---

## PART 1 — WEBSITE SITEMAP

### IA Decision: Single-Page Architecture

**Decision:** All approved content sections are implemented as **homepage sections** (anchor-linked), not as separate pages.

**Rationale:**
- GreenNext is an infrastructure initiative, not a multi-product platform.
- The approved content forms a single continuous narrative from positioning through to contact.
- Users are enterprise decision-makers who benefit from a linear, scrollable content experience.
- The dashboard is an embedded interactive module within the page, not a dedicated application.

**Exception:** A dedicated contact/thank-you state may be handled via a modal or inline form confirmation, not a separate page.

---

### Full Sitemap

```
greennext.in/
│
├── [SECTION] #top          → Hero
├── [SECTION] #why          → Why GreenNext (About)
├── [SECTION] #infrastructure → AI-Driven Infrastructure
├── [SECTION] #energy       → Energy Efficiency
├── [SECTION] #automation   → Intelligent Automation
├── [SECTION] #regions      → Regional Infrastructure
├── [SECTION] #architecture → Infrastructure Architecture
├── [SECTION] #sustainability → Sustainability
├── [SECTION] #dashboard    → Regional Infrastructure Dashboard
├── [SECTION] #usecases     → Use Cases
├── [SECTION] #approach     → GreenNext Approach
└── [SECTION] #contact      → Contact / Final CTA
```

**Page-level metadata** (single document):
- `<title>`: GreenNext | Intelligent Data Center Infrastructure
- `<meta name="description">`: AI-ready data center infrastructure, energy efficiency, and intelligent automation for connected digital ecosystems across South India.
- `<link rel="canonical" href="/" />`

---

## PART 2 — GLOBAL NAVIGATION

### Component: `<SiteHeader>`

**Behaviour:** Fixed/sticky header. Collapses to mobile hamburger below breakpoint.

**Brand element:**
- Logo mark: Leaf icon + wordmark "Green**Next**"
- `aria-label="GreenNext home"`
- `href="#top"`

---

### Desktop Navigation

| Order | Label | href | Hover tooltip |
|-------|-------|------|---------------|
| 1 | Infrastructure | #infrastructure | AI-era infrastructure design across compute, power, cooling, and monitoring |
| 2 | Energy | #energy | Intelligent power and thermal management for efficient data center operations |
| 3 | Automation | #automation | Infrastructure monitoring and automation workflows |
| 4 | Regions | #regions | Madurai · Coimbatore · Trichy · Mangalore |
| 5 | Sustainability | #sustainability | Resource efficiency, energy awareness, and sustainable digital growth |

**Header CTA button:**
- Label: `Connect →`
- href: `#contact`
- Hover state: `Connect with GreenNext`
- Aria role: link styled as button

---

### Mobile Navigation

**Toggle button states:**
- Closed: hamburger icon · `aria-label="Open navigation"` · `aria-expanded="false"`
- Open: X (close) icon · `aria-label="Close navigation"` · `aria-expanded="true"`

**Mobile nav items** (full-label variants):
1. Infrastructure
2. Energy Efficiency
3. Automation
4. Regions
5. Sustainability
6. Contact

Each mobile nav item: `onClick → close mobile menu + scroll to anchor`

---

## PART 3 — HOMEPAGE CONTENT STRUCTURE

The homepage is the primary and only page. Sections appear in the following order:

```
1.  Hero
2.  Why GreenNext (Capabilities overview)
3.  AI-Driven Infrastructure
4.  Energy Efficiency
5.  Intelligent Automation
6.  Regional Infrastructure
7.  Infrastructure Architecture
8.  Sustainability
9.  Regional Infrastructure Dashboard
10. Use Cases
11. GreenNext Approach
12. Contact / Final CTA
13. Footer
```

---

### SECTION 1 — Hero

**Anchor:** `#top` (via `id="top"` on `<main>`)
**Component:** `<HeroSection>`
**Purpose:** First impression, brand positioning, primary CTA entry point

---

#### Content Blocks

**Block: Eyebrow / Kicker**
- Content: `South India · Intelligent Infrastructure`
- Element: `<p>` or `<span>` with status dot indicator
- Role: Contextual anchor — communicates geography and focus immediately

**Block: H1 Headline**
- Content: `Intelligent Infrastructure for a Sustainable Digital Future`
- Element: `<h1 id="hero-title">`
- `aria-labelledby="hero-title"` on section
- *Note: "Sustainable Digital Future" is an emphasis phrase — designer may apply typographic treatment such as italic or weight change*

**Block: Supporting Paragraph**
- Content: `GreenNext connects AI-driven data center infrastructure, energy efficiency, and intelligent automation to build resilient digital ecosystems across South India.`
- Element: `<p>`

**Block: CTA Group**

| CTA | Label | href | Type |
|-----|-------|------|------|
| Primary | `Explore Our Infrastructure →` | `#infrastructure` | Primary button |
| Secondary | `🌐 Explore Our Regions` | `#regions` | Ghost/outline button |

**Block: Capability Labels (4 items)**

| Order | Icon concept | Label |
|-------|-------------|-------|
| 1 | Circuit board / chip | AI-Ready Infrastructure |
| 2 | Gauge / meter | Energy Optimization |
| 3 | Bot / gear | Intelligent Automation |
| 4 | Network node | Regional Connectivity |

- Displayed as a horizontal row of icon + text pairs
- `aria-label="GreenNext focus areas"` on container

**Block: Scroll Cue**
- Content: `Discover` + down arrow icon (↓)
- href: `#why`
- `aria-label="Continue to Why GreenNext"`

**Background elements (structural, not decorative at this stage):**
- Hero image: `<img>` with `alt="Modern data center server racks and cooling infrastructure"` · `width=1920` · `height=1080`
- Shade overlay: `<div>` (for legibility — no colour specified yet)
- Grid overlay: `<div>` (structural texture element)

---

### SECTION 2 — Why GreenNext

**Anchor:** `#why`
**Component:** `<WhySection>`
**Purpose:** Bridge from hero to specific capabilities. Communicates what GreenNext addresses and why.

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Why GreenNext`
- H2: `Where Digital Infrastructure Meets Intelligence`
- Supporting paragraph: `Modern AI workloads demand more than raw compute. They require reliable systems, efficient energy management, scalable architecture, and intelligent operational control. GreenNext brings these requirements into a single, coherent infrastructure model.`

**Block: Capability Cards (4 cards)**

Each card contains:
- Card number (01–04)
- Icon (see below)
- H3 title
- Body paragraph
- Decorative line element

---

**Card 01 — AI-Ready Infrastructure**
- Icon concept: CPU / chip
- H3: `AI-Ready Infrastructure`
- Body: `Infrastructure designed to support increasingly demanding AI and high-performance computing workloads, where compute density, power requirements, and cooling loads behave differently from conventional enterprise applications.`

**Card 02 — Energy Efficiency**
- Icon concept: Zap / lightning
- H3: `Energy Efficiency`
- Body: `Intelligent monitoring and active optimization of power consumption and cooling requirements, ensuring that every unit of energy delivered to the infrastructure is used as effectively as possible.`

**Card 03 — Smart Automation**
- Icon concept: Bot / robot / cog
- H3: `Smart Automation`
- Body: `Automation of operational workflows — including monitoring, alert management, anomaly detection, and capacity signalling — to support consistent, timely infrastructure responses without relying solely on manual intervention.`

**Card 04 — Regional Connectivity**
- Icon concept: Network / nodes
- H3: `Regional Connectivity`
- Body: `A distributed regional approach designed around the infrastructure and connectivity requirements of Madurai, Coimbatore, Trichy, and Mangalore — four locations with distinct industrial, geographic, and technological relevance.`

---

## PART 4 — ABOUT GREENNEXT

**Anchor:** `#why` (shared with Why GreenNext section, or optionally `#about`)
**Component:** Embedded within `<WhySection>` or a standalone `<AboutSection>`
**Purpose:** Communicates what GreenNext is, the five key "why" rationales, and long-term direction.

**IA Decision:** The About content functions as an expansion of the Why GreenNext section. It does not require a dedicated page. The capability cards (Why GreenNext) serve as the scannable summary; the About text can appear beneath or be surfaced via an expandable block.

---

#### Content Blocks

**Block: Introduction**
- Eyebrow: `About GreenNext`
- H2: `Where Digital Infrastructure Meets Intelligence`
- Intro paragraph: `GreenNext is a digital infrastructure initiative focused on the design, intelligence, and operational management of AI-era data center infrastructure. It addresses the convergence of increasingly demanding compute workloads, rising energy requirements, and the need for regional digital capacity across South India.`

**Block: Why AI Workloads Change Infrastructure Requirements**
- Subheading: `Why AI Workloads Change Infrastructure Requirements`
- Body paragraph 1: `Modern AI training, inference, and data processing workloads behave fundamentally differently from conventional enterprise applications. They place concentrated demands on compute hardware, generate higher thermal loads per rack, require precise and responsive cooling systems, and consume significantly more power per unit of useful work. These characteristics mean that infrastructure designed for conventional workloads may not be suitable — in layout, power delivery, cooling architecture, or operational tooling — for AI-era demands.`
- Body paragraph 2: `Understanding these requirements at the infrastructure design stage, rather than after deployment, is one of the reasons infrastructure intelligence matters.`

**Block: Why Infrastructure Intelligence Matters**
- Subheading: `Why Infrastructure Intelligence Matters`
- Body: `Visibility is the foundation of operational control. Without accurate, timely data on how infrastructure is performing — across compute, storage, networking, power, and cooling — operators are responding to conditions they cannot fully see. Infrastructure intelligence means instrumenting systems to produce that data, processing it meaningfully, and making it available to operators and automation systems in a form they can act on.`

**Block: Why Energy Efficiency Matters**
- Subheading: `Why Energy Efficiency Matters`
- Body: `Energy is both an operational cost and an environmental consideration. As compute density increases and AI workloads grow in scale, energy efficiency becomes a more significant infrastructure discipline. Better monitoring, workload-aware resource management, and informed cooling strategies can reduce the gap between energy consumed and productive work delivered. These improvements compound over time: more efficient infrastructure requires fewer resources to deliver the same outcomes.`

**Block: Why Automation Matters**
- Subheading: `Why Automation Matters`
- Body: `Modern infrastructure environments generate more operational signals than human teams can effectively monitor in real time. Automation — well-designed and carefully bounded — allows operators to define expected conditions, detect deviations, and coordinate responses consistently and quickly. It also supports more structured operational reporting and capacity planning, reducing the risk of decisions made on incomplete information.`

**Block: Why Regional Infrastructure Planning Matters**
- Subheading: `Why Regional Infrastructure Planning Matters`
- Body: `Digital infrastructure is physical. It requires land, power, water for cooling, fibre connectivity, and operational personnel. Concentrating all infrastructure capacity in a single location creates dependencies — on power grids, on connectivity routes, and on local operational conditions. A regional approach distributes risk, brings capacity closer to the workloads and users that need it, and allows infrastructure to be shaped around local ecosystem strengths rather than forcing a single model everywhere.`

**Block: Long-Term Direction Statement**
- Display as a pull quote or highlighted closing statement
- Content: `GreenNext's long-term direction is to establish a technically credible, intelligently managed, and sustainably operated digital infrastructure presence across South India — one that grows with regional digital demand rather than ahead of it.`

---

## PART 5 — AI-DRIVEN INFRASTRUCTURE

**Anchor:** `#infrastructure`
**Component:** `<InfrastructureSection>`
**Purpose:** Communicates GreenNext's infrastructure design model, the relationship between AI workloads and infrastructure layers, and four core capability areas.
**Layout pattern:** Two-column (copy + principles left / architecture flow right)

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `AI-Driven Data Centers`
- H2: `Infrastructure Built for the AI Era`
- Supporting paragraph: `AI workloads create demanding and specific requirements across compute, cooling, power, networking, and reliability. GreenNext addresses these requirements as an integrated operational system, not as separate engineering concerns. The result is an infrastructure model where each layer is designed to understand and respond to what the layers above and below it require.`

**Block: Design Principles List**
- Display as a vertical list with check/tick icons
- Items:
  1. **System-aware design** across the full infrastructure stack
  2. **Operational visibility** from workloads to facilities
  3. **Continuous intelligence** for infrastructure decisions

**Block: AI Infrastructure Flow Panel**
- Panel label: `Conceptual architecture` · `Signal flow`
- State badge: `[CONCEPTUAL]`
- Diagram footnote: `Signals move in both directions. Demand informs infrastructure configuration; operational conditions inform workload scheduling and automation decisions.`
- Displayed as a vertical flow with connecting lines/arrows

**Flow steps (ordered, vertical):**

| Step | Node label | Supporting sub-label | Icon concept |
|------|-----------|---------------------|-------------|
| 1 | AI Workloads | Inference · Training · Data pipelines | Sparkles / star |
| 2 | Compute Infrastructure | High-density processing systems | CPU |
| 3 | Data Center Operations | Power · Cooling · Facility management | Server |
| 4 | Energy & Cooling Management | Thermal and power management | Snowflake |
| 5 | Intelligent Monitoring | Continuous instrumentation | Activity / waveform |
| 6 | Automated Optimization | Policy-driven operational responses | Cloud cog |

**Interaction:** Static display. No required interactivity at this stage.

---

**Block: Capability Cards (4 cards)**

**Capability 01 — AI-Ready Compute Infrastructure**
- Icon concept: CPU / chip
- Body: `AI training and inference workloads require compute systems that can sustain high utilisation for extended periods, with power delivery and cooling architectures capable of managing the resulting thermal loads. Infrastructure designed for these workloads considers not just processing capacity, but the physical and operational environment in which that capacity must operate reliably.`
- State: `[CONCEPTUAL]`

**Capability 02 — Infrastructure Monitoring**
- Icon concept: Activity / waveform
- Body: `Effective infrastructure management requires accurate, timely data on the state of every significant system: server health, network latency, storage throughput, power draw, and cooling performance. Monitoring is the instrumentation layer that makes this data available and meaningful.`
- State: `[CONCEPTUAL]`

**Capability 03 — Resource Optimization**
- Icon concept: Gauge
- Body: `Infrastructure resources — compute, power, cooling capacity, and network bandwidth — are finite. Resource optimization uses monitoring data and workload information to ensure that available capacity is allocated efficiently, that waste is minimised, and that headroom is maintained for demand peaks.`
- State: `[CONCEPTUAL]`

**Capability 04 — Intelligent Operational Management**
- Icon concept: Cloud cog / settings
- Body: `Operational management at the infrastructure level involves tracking conditions, identifying deviations, coordinating maintenance, managing capacity, and reporting on performance. Intelligent operational management brings automation and analytics into these workflows — reducing manual effort and improving the consistency of operational responses.`
- State: `[CONCEPTUAL]`

---

## PART 6 — ENERGY EFFICIENCY

**Anchor:** `#energy`
**Component:** `<EnergySection>`
**Purpose:** Communicates energy as an infrastructure discipline — not a marketing theme. Presents the Compute→Power→Cooling→Efficiency relationship and six coverage areas.
**Layout pattern:** Two-column (copy + tags left / conceptual relationship panel right)

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Energy Efficiency`
- H2: `Every Watt Matters`
- Supporting paragraph: `Energy performance is an infrastructure discipline, not an afterthought. GreenNext's approach connects workload demand signals with power consumption, thermal conditions, and operational patterns — creating the monitoring and analytics foundation needed for informed, continuous energy optimization.`

**Block: Energy Capability Tags**
- Display as a horizontal tag/pill list
- Tags:
  1. Power monitoring
  2. Cooling optimization
  3. Workload-aware resources
  4. Infrastructure visibility
  5. Automated alerts
  6. Energy analytics

**Block: Conceptual Relationship Panel**
- Panel overline: `SYSTEM RELATIONSHIP`
- Panel title: `Resource Intelligence`
- State badge: `[ILLUSTRATIVE]`

**Relationship model (visual centre):**
- Centre node: Efficiency / Orchestration (Leaf icon)
- Surrounding nodes (orbit):
  - Compute (CPU icon)
  - Power (Zap icon)
  - Cooling (Fan icon)

**Signal indicators (below orbit):**
- ⬤ Workload signal
- ⬤ Power signal
- ⬤ Thermal signal

**Explanatory copy (inline or tooltip):**
`Every computation produces heat. More intensive workloads — particularly AI inference and training at scale — generate substantially more heat per unit of useful output than conventional enterprise compute. This creates a direct relationship:`
- **Compute** determines what work is done and at what intensity
- **Power** determines how much energy is delivered to support that compute
- **Cooling** determines how effectively heat generated by compute is removed
- **Efficiency** is the outcome of how well these three are balanced

`Improving efficiency is not simply a matter of reducing power. It requires understanding the relationship between workload intensity, power draw, and thermal output at sufficient granularity to make meaningful operational adjustments. That understanding begins with monitoring.`

---

**Block: Energy Coverage Area Cards (6 items)**

**Coverage 01 — Power Monitoring**
`Continuous measurement of power consumption across the infrastructure environment, enabling operators to identify consumption patterns, peak demand periods, and inefficiencies at the system and facility level.`

**Coverage 02 — Cooling Efficiency**
`Thermal management in high-density compute environments is a significant operational challenge. Monitoring cooling system performance — airflow, temperature gradients, chiller efficiency, and response latency — gives operators the data they need to maintain thermal control without overcooling.`

**Coverage 03 — Workload-Aware Resource Management**
`Matching infrastructure resource allocation to actual workload demands — rather than provisioning for theoretical peak capacity at all times — can reduce idle energy consumption and improve effective utilisation.`

**Coverage 04 — Infrastructure Visibility**
`A consolidated view of energy flows, consumption patterns, and operational conditions across infrastructure domains enables faster identification of inefficiency and more informed decision-making.`

**Coverage 05 — Energy Analytics**
`Historical and trend-based analysis of energy consumption patterns provides the context for longer-term operational improvements, capacity planning, and sustainability reporting.`

**Coverage 06 — Operational Optimization**
`Using monitoring data and energy analytics together to systematically reduce the gap between energy consumed and productive work delivered — an ongoing operational discipline rather than a one-time project.`

---

## PART 7 — INTELLIGENT AUTOMATION

**Anchor:** `#automation`
**Component:** `<AutomationSection>`
**Purpose:** Communicates automation as an operational support system, not a replacement for human judgement. Presents the 6-step workflow and 6 conceptual capability areas.

> [!IMPORTANT]
> All capability areas in this section are `[CONCEPTUAL]`. The on-page footnote disclaimer must be displayed clearly. Do not remove or hide this disclaimer.

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Intelligent Automation`
- H2: `Infrastructure That Responds Intelligently`
- Supporting paragraph: `Automation supports infrastructure operators in identifying changing conditions, understanding their implications, and coordinating consistent responses across critical systems. It does not replace operational judgement — it makes that judgement better informed and more timely.`

**Block: Automation Workflow (6 steps)**
- Display as horizontal step sequence with arrows between steps

| Step # | Label | Description |
|--------|-------|-------------|
| 01 | Monitor | Continuous collection of operational signals across infrastructure layers |
| 02 | Detect | Identification of conditions that deviate from expected or defined baselines |
| 03 | Analyze | Contextual evaluation of detected conditions to determine significance |
| 04 | Decide | Selection of appropriate operational responses based on defined policies |
| 05 | Automate | Coordinated execution of operational responses without requiring manual intervention |
| 06 | Report | Documentation of events, responses, and outcomes for operational visibility and review |

**Block: Capability Area Grid (6 items)**
- Display as a grid of icon + label tiles

| Icon concept | Label | State |
|-------------|-------|-------|
| Activity / waveform | Infrastructure Alerts | [CONCEPTUAL] |
| Boxes / stack | Capacity Monitoring | [CONCEPTUAL] |
| Snowflake | Cooling-System Monitoring | [CONCEPTUAL] |
| Zap / lightning | Energy Anomaly Detection | [CONCEPTUAL] |
| Waves / pulse | Predictive Maintenance Workflows | [CONCEPTUAL — Future direction] |
| Bar chart | Operational Reporting | [CONCEPTUAL] |

**Block: Capability Detail Descriptions**
*(Available for expanded views, tooltips, or secondary content)*

- **Infrastructure Alerts:** When monitored conditions exceed defined thresholds — power draw, temperature, system availability — automated alerts route relevant information to operational teams in a structured and timely format.
- **Capacity Monitoring:** Tracking compute, storage, and network utilisation trends to identify capacity constraints before they affect service delivery.
- **Cooling-System Monitoring:** Continuous monitoring of thermal management systems to identify performance degradation, anomalous temperature profiles, or cooling efficiency changes before they escalate.
- **Energy Anomaly Detection:** Identification of unusual energy consumption patterns — such as unexpected load spikes or persistent inefficiencies — that may indicate hardware issues, misconfiguration, or workload changes.
- **Predictive Maintenance Workflows:** Using historical equipment performance data and operational patterns to anticipate maintenance requirements — reducing unplanned downtime and enabling scheduled interventions.
- **Operational Reporting:** Automated generation of structured operational reports covering infrastructure health, energy performance, alert history, and capacity trends — providing operators with consistent, comparable data over time.

**Block: Mandatory Disclaimer Footnote**
- Icon: Shield check
- Display as an inline note at the bottom of the section
- Content: `These represent conceptual capabilities and workflows — not claims of currently deployed production systems. GreenNext will clearly communicate which capabilities are live, in development, or on the product roadmap as the initiative progresses.`
- State badge: `[CONCEPTUAL]`

---

## PART 8 — REGIONAL INFRASTRUCTURE

**Anchor:** `#regions`
**Component:** `<RegionsSection>`
**Purpose:** Communicates the four focus regions with their individual relevance. Presents the regional distribution rationale.
**Layout pattern:** Interactive region selector (map + detail panel) + distribution rationale block

> [!IMPORTANT]
> The on-page disclaimer **must** be visible: *"This is a conceptual network view, not a claim of currently operating facilities at these locations."*

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Regional Presence`
- H2: `Building the Digital Infrastructure Network Across South India`
- Supporting paragraph: `Digital infrastructure serving a region effectively requires more than a single central location. A distributed approach allows capacity to be positioned closer to where workloads originate and users are located — reducing latency, distributing connectivity risk, and building on the distinct ecosystem strengths each location offers.`

**Block: Regional Disclaimer**
- Display as an inline note or map caption
- Content: `The regions described below represent GreenNext's infrastructure planning focus areas. This is a conceptual network view, not a claim of currently operating facilities at these locations.`
- Map caption (short form): `Conceptual network · Not a claim of operating sites`

---

**Block: Interactive Map Panel**
- Role: `aria-label="Conceptual map of GreenNext focus regions"`
- Contains: Schematic SVG map of South India with 4 pin markers
- Each pin: clickable → loads region detail panel
- Map caption: `Conceptual network · Not a claim of operating sites`

**Map pin data:**

| Region | IATA | Map position (CSS % reference) | Default active |
|--------|------|-------------------------------|----------------|
| Madurai | MDU | left: 54%, top: 72% | Yes |
| Coimbatore | CJB | left: 38%, top: 57% | No |
| Trichy | TRZ | left: 58%, top: 49% | No |
| Mangalore | IXE | left: 14%, top: 28% | No |

**Interaction:** Click pin → update region detail panel. Keyboard navigable.

---

**Block: Region Detail Panel**

Displayed dynamically based on selected region. Structure per region:

```
[IATA Code]          ← large code display
[Eyebrow: "Focus region"]
[H3: Region name]
[Body paragraph]
[Divider rule]
[H4: "Regional intent"]
[Intent paragraph]
[Region selector buttons: MDU | CJB | TRZ | IXE]
```

---

**Region data records:**

**MADURAI**
- IATA: `MDU`
- Category: Regional Technology & Infrastructure Hub
- Body: `Madurai is one of Tamil Nadu's most significant secondary cities, with a growing technology services presence, established educational institutions, and improving digital connectivity. Its position in southern Tamil Nadu makes it a relevant focus location for regional digital infrastructure that serves the broader southern part of the state. Infrastructure investment in Madurai can complement rather than duplicate capacity that exists in Chennai.`
- Regional intent: `Explore infrastructure requirements, connectivity pathways, local ecosystem strengths, and the opportunity to expand digital services capacity in southern Tamil Nadu.`

**COIMBATORE**
- IATA: `CJB`
- Category: Industrial & Technology Ecosystem
- Body: `Coimbatore has a well-established industrial base — particularly in manufacturing, textiles, and engineering — alongside a growing technology sector. The city has a strong engineering talent pool and increasing connectivity infrastructure. Its distinct industrial character makes it relevant for edge and regional compute infrastructure that serves both industrial digitisation and the broader technology ecosystem of western Tamil Nadu and the Nilgiris corridor.`
- Regional intent: `Understand how digital infrastructure can support industrial technology adoption and serve a technically capable regional workforce with increasing digital infrastructure needs.`

**TRICHY (Tiruchirappalli)**
- IATA: `TRZ`
- Category: Strategic Central Tamil Nadu Connectivity
- Body: `Trichy occupies a strategically important geographic position at approximately the centre of Tamil Nadu, making it a natural junction point for connectivity infrastructure between northern and southern parts of the state. It has an international airport, an established higher education sector including technical institutions, and improving connectivity to surrounding districts. Its centrality makes it particularly relevant for network routing and regional infrastructure resilience planning.`
- Regional intent: `Evaluate Trichy's role as a connectivity junction and regional distribution point within a distributed South India infrastructure network.`

**MANGALORE (Mangaluru)**
- IATA: `IXE`
- Category: Coastal Technology & Connectivity Gateway
- Body: `Mangalore is a significant port city and coastal technology hub with established connectivity advantages — including proximity to undersea cable landing infrastructure that is strategically relevant for internet connectivity. It serves as a gateway between Karnataka and Kerala, with a growing technology services presence and infrastructure that benefits from its coastal connectivity position. For regional infrastructure planning, Mangalore offers network diversity and geographic complementarity to inland Tamil Nadu locations.`
- Regional intent: `Explore Mangalore's connectivity assets, port infrastructure relevance, and its role as a coastal gateway for a distributed South India infrastructure approach.`

---

**Block: Regional Distribution Rationale**
- Intro: `Centralised digital infrastructure creates single points of dependency. A distributed regional model addresses this by:`
- Display as a 4-item list with bold lead terms:
  1. **Reducing latency** — bringing compute and connectivity closer to where workloads and users are located
  2. **Improving resilience** — distributing risk across geographically separate sites and independent power and connectivity feeds
  3. **Supporting local ecosystems** — building digital capacity where regional industrial and technology sectors can directly benefit from it
  4. **Enabling phased growth** — allowing infrastructure to expand in line with regional demand rather than requiring large upfront commitments in a single location

---

## PART 9 — INFRASTRUCTURE ARCHITECTURE

**Anchor:** `#architecture` (or inline after regions)
**Component:** `<ArchitectureSection>`
**Purpose:** Presents the 7-layer infrastructure stack as structured content. Communicates bidirectional signal flow.
**Layout pattern:** Two-column (explanatory copy left / layer stack right)

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Infrastructure Architecture`
- H2: `One Connected Operational Stack`
- Supporting paragraph: `Digital infrastructure is not a single system — it is a set of interdependent layers that must work together reliably. Understanding how each layer connects to and depends on the others is the basis for effective infrastructure design, monitoring, and operational management.`
- Architecture note (secondary paragraph): `Signals move in both directions: demand informs infrastructure configuration, while operational conditions inform workload scheduling and automation decisions.`

**Block: Architecture Stack (7 layers, ordered top to bottom)**

Each layer item contains: Index number · Icon · Layer name · Short title · Role description · Signal indicator

| # | Layer Name | Short Title | Icon concept | Role |
|---|-----------|-------------|-------------|------|
| 01 | Users / AI Applications | Demand Origin | Sparkles / star | The initiating layer — AI applications, cloud services, and end-user workloads that place demands on all layers below. The nature and intensity of these workloads determines the infrastructure requirements that cascade down the stack. |
| 02 | Network & Connectivity | Regional Fabric | Network / nodes | The connectivity layer that links users to infrastructure and infrastructure sites to each other. Network architecture — bandwidth, latency, routing diversity, and regional reach — determines how effectively the infrastructure can serve its intended workloads. |
| 03 | Compute Layer | AI-Ready Systems | CPU / chip | The processing core of the infrastructure — servers, accelerators, and compute clusters configured to handle the workload profiles they are intended to serve. AI workloads in particular require compute systems designed for sustained high utilisation and high power density. |
| 04 | Storage & Data Layer | Resilient Data Services | Database | Storage and data management infrastructure provides the persistent and working data environment for compute workloads. Performance, capacity, and resilience characteristics at this layer directly affect workload throughput and recovery capability. |
| 05 | Energy Management | Power Visibility | Zap / lightning | The power delivery and monitoring layer — from utility feeds and UPS systems through to per-rack power measurement. Energy management at this layer provides the data needed for efficiency optimization and the reliability needed for continuous operations. |
| 06 | Cooling Infrastructure | Thermal Control | Snowflake | Thermal management systems maintain safe and stable operating temperatures across the compute and storage environment. In high-density AI infrastructure, cooling architecture is a critical design and operational discipline, not a background concern. |
| 07 | Monitoring & Automation | Operational Intelligence | Activity / waveform | The observability and control layer that spans all layers above it. Monitoring collects operational signals; automation uses those signals to coordinate responses. Together, they provide the operational intelligence that makes the entire stack manageable at scale. |

**Signal indicators:** Each layer row has a visual signal pulse element to suggest bidirectional data flow.

---

## PART 10 — SUSTAINABILITY

**Anchor:** `#sustainability`
**Component:** `<SustainabilitySection>`
**Purpose:** Communicates sustainability as an operational discipline grounded in visibility and resource efficiency — not environmental marketing.
**Layout pattern:** Header with large leaf icon + two-column content area

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Sustainability`
- H2: `Digital Growth Without Ignoring Resource Efficiency`
- Supporting paragraph: `Responsible infrastructure begins with visibility: understanding where energy and resources are consumed, how systems interact across operational layers, and where informed decisions can lead to better resource outcomes. GreenNext's approach to sustainability is grounded in operational practicality — making infrastructure more efficient is both an environmental consideration and a sound operational objective.`

**Block: Sustainability Focus Areas (6 numbered items)**

Display as a numbered list with bold title + supporting sentence.

| # | Title | Body |
|---|-------|------|
| 01 | Energy-Aware Infrastructure | Infrastructure designed with energy visibility built in — not added after the fact. Knowing how and where energy is consumed is the prerequisite for using it more effectively. |
| 02 | Efficient Cooling | Cooling is often the largest variable energy consumer in a data center environment. Designing and operating cooling systems for efficiency — rather than simply for maximum capacity — reduces energy consumption without compromising thermal stability. |
| 03 | Resource Optimization | Preventing resource waste — idle compute, overprovisioned cooling, underutilised network capacity — reduces the energy and capital required to deliver a given level of service. |
| 04 | Intelligent Workload Management | Scheduling and managing workloads with awareness of current infrastructure conditions — including power availability, cooling headroom, and compute utilisation — can reduce peak demand and improve overall resource efficiency. |
| 05 | Infrastructure Visibility | A clear, consolidated view of infrastructure operations is the foundation of continuous improvement. Without visibility, inefficiencies persist because they are not observed, measured, or understood. |
| 06 | Sustainable Digital Growth | Digital infrastructure growth does not have to be proportional to energy growth. With better design, more intelligent operations, and continuous optimization, it is possible to deliver increasing digital capacity with improving energy efficiency over time. |

**Block: Sustainability Pull Quote / Callout**
- Content: `Better infrastructure visibility and optimization support more resource-aware operations. The goal is not to slow digital growth, but to ensure that growth is delivered as efficiently as the technology allows.`
- Display as a blockquote or highlighted callout element

---

## PART 11 — REGIONAL INFRASTRUCTURE DASHBOARD

**Anchor:** `#dashboard`
**Component:** `<DashboardSection>`
**Purpose:** Conceptual interactive interface demonstrating the operational signals GreenNext aims to connect. NOT a claim of live infrastructure.

> [!CAUTION]
> **Every metric and data value in this section is `[ILLUSTRATIVE / DEMO DATA]`.**
> The global disclaimer must be displayed prominently at the top of the dashboard.
> The regional status label must read: **Conceptual / Planning**
> Under no circumstances should these values be presented as real GreenNext operational measurements.

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Regional Infrastructure Dashboard`
- H2: `Operational Visibility Across Regions`
- Supporting paragraph: `A conceptual interface demonstrating the operational signals GreenNext aims to connect across regional infrastructure locations.`
- Global demo data badge: `Illustrative demo data`

---

**Block: Dashboard Shell**

**Dashboard top bar:**
- Region tab selector (4 tabs): `Madurai` · `Coimbatore` · `Trichy` · `Mangalore`
  - Each tab has a status dot + region name
  - Active tab is highlighted
- Dashboard health badge: `⬤ Systems view active`

---

**Block: Dashboard Sidebar (per selected region)**

```
[IATA Code — large display]
[Region name — H3]
[Region detail — short paragraph]
[Divider]
[REGIONAL STATUS label]
[Status value: "⬤ Conceptual / Planning"]
[Automation events count — Illustrative / 24h]
[Open alerts count — Illustrative]
[Region selector buttons: MDU | CJB | TRZ | IXE]
```

---

**Block: Dashboard Metric Grid (4 metrics per region)**

Each metric card contains:
- Icon
- Label
- Value (as % with progress bar)
- Footer label: `Illustrative signal`

| Metric | Icon concept | Description |
|--------|-------------|-------------|
| Compute Utilisation | CPU | Relative utilisation level of compute infrastructure |
| Energy Monitoring | Zap | Power consumption signal |
| Cooling Status | Snowflake | Thermal management performance |
| Network Connectivity | Network | Regional connectivity health |

---

**Block: Activity Chart**
- Overline: `CONNECTED INFRASTRUCTURE SIGNALS`
- Title: `24-hour operational pattern`
- Badge: `Illustrative`
- Display: Vertical bar chart with 24 hourly bars
- X-axis labels: `00:00` · `06:00` · `12:00` · `18:00` · `24:00`
- Bar heights: Illustrative values only (see data table below)

---

### Dashboard Data — Illustrative / Demo Values

> **Required UI label:** *"All figures are illustrative demo data. They do not represent real GreenNext operational measurements."*

**Region records:**

| Region | Code | Compute | Energy | Cooling | Network | Auto Events | Open Alerts | Detail |
|--------|------|---------|--------|---------|---------|-------------|-------------|--------|
| Madurai | MDU | 64% | 71% | 82% | 96% | 18 | 2 | Regional technology and infrastructure hub. |
| Coimbatore | CJB | 72% | 68% | 79% | 94% | 24 | 1 | Industrial and technology ecosystem. |
| Trichy | TRZ | 58% | 62% | 86% | 97% | 13 | 0 | Strategic central Tamil Nadu connectivity. |
| Mangalore | IXE | 69% | 74% | 77% | 93% | 21 | 3 | Coastal technology and connectivity gateway. |

**Illustrative 24-hour bar chart values (all regions, shared illustrative pattern):**
`[34, 42, 39, 51, 49, 62, 58, 73, 66, 79, 75, 84, 72, 68, 77, 64, 71, 55, 59, 47, 52, 39, 44, 35]`

**Regional status for all regions:** `Conceptual / Planning`

---

### Dashboard Category Microcopy

**Infrastructure Status**
- Label: Infrastructure Status
- Description: Overview of operational health across monitored infrastructure systems
- Status (Normal): Systems within expected parameters
- Status (Warning): One or more systems require attention
- Status (Alert): Critical condition detected — review required
- Empty state: No infrastructure data connected. Configure monitoring endpoints to begin.
- Tooltip: Current operational status across compute, power, cooling, and network layers for the selected region

**Energy Monitoring**
- Label: Energy Monitoring
- Description: Power consumption signals and consumption patterns across the infrastructure environment
- Status (Normal): Power draw within normal range
- Status (Elevated): Elevated power consumption detected — workload or system review recommended
- Status (Anomaly): Anomalous power signal identified
- Empty state: No energy monitoring data available. Connect power measurement systems to enable this view.
- Tooltip: Illustrative power consumption signal for the selected region. This is demo data, not a live operational measurement.

**Compute Utilisation**
- Label: Compute Utilisation
- Description: Relative utilisation level of compute infrastructure in the selected region
- Status (Low): Compute resources operating below expected demand
- Status (Normal): Compute utilisation within expected operating range
- Status (High): High utilisation — capacity planning review recommended
- Empty state: No compute utilisation data available for this region.
- Tooltip: Illustrative compute utilisation signal. This value represents demo data and does not reflect real infrastructure measurements.

**Cooling Status**
- Label: Cooling Status
- Description: Thermal management system performance and temperature stability indicators
- Status (Stable): Thermal conditions stable — cooling systems operating normally
- Status (Watch): Temperature variation detected — monitor for escalation
- Status (Alert): Thermal threshold breached — immediate review required
- Empty state: No cooling system data connected. Thermal monitoring integration required.
- Tooltip: Illustrative cooling performance signal. Demo data only — does not represent real thermal measurements.

**Network Connectivity**
- Label: Network Connectivity
- Description: Regional connectivity health and inter-site network performance signals
- Status (Healthy): Network connectivity operating normally across monitored paths
- Status (Degraded): Connectivity degradation detected on one or more paths
- Status (Offline): Connectivity loss detected — failover assessment required
- Empty state: No network monitoring data available. Configure network telemetry sources to enable this view.
- Tooltip: Illustrative network connectivity signal for the selected region. Demo data only.

**Automation Events**
- Label: Automation Events
- Description: Count and summary of automation workflow events in the last 24 hours
- Status (Active): `{N}` automation events logged in the last 24 hours *(Illustrative)*
- Status (Quiet): No automation events in the current period
- Empty state: No automation event data available. Automation workflows must be configured and active to generate events.
- Tooltip: Illustrative count of automation events. This number is demo data and does not represent real operational activity.

**Alerts**
- Label: Alerts
- Description: Open infrastructure alerts requiring operator review
- Status (None): No open alerts
- Status (Active): `{N}` open alert(s) — review recommended *(Illustrative)*
- Status (Critical): Critical alert active — immediate attention required
- Empty state: No alerts configured. Define alert thresholds to begin receiving infrastructure notifications.
- Tooltip: Illustrative open alert count. This is demo data and does not represent real GreenNext infrastructure conditions.

---

## PART 12 — USE CASES

**Anchor:** `#usecases`
**Component:** `<UseCasesSection>`
**Purpose:** Makes GreenNext's value proposition concrete through realistic operational scenarios. Not marketing claims.

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `Infrastructure Use Cases`
- H2: `Operational Scenarios GreenNext Is Designed to Address`
- Supporting paragraph: `The following use cases represent the operational problems GreenNext's infrastructure intelligence and automation approach is designed to help address. These are illustrative scenarios informed by common data center operational challenges.`

**Block: Use Case Cards (7 cards)**

Each card structure:
```
[Use Case number and title]
[Problem]
[GreenNext Approach]
[Expected Operational Value]
```

---

**UC-01 — Data Center Energy Monitoring**
- Problem: Infrastructure operators in high-density compute environments often lack granular, real-time visibility into where and how energy is being consumed across their facilities. Without this data, inefficiencies persist unnoticed and energy costs are difficult to attribute or optimise.
- Approach: Continuous power monitoring across infrastructure layers — from facility-level consumption to per-rack measurement — generates the operational data needed to understand energy consumption patterns, identify anomalies, and inform optimization decisions.
- Value: Operators gain a factual, continuously updated picture of energy consumption, enabling them to make informed decisions about workload placement, equipment configuration, and cooling strategy.

**UC-02 — Infrastructure Health Monitoring**
- Problem: In complex infrastructure environments, hardware degradation, configuration drift, and emerging faults are often detected only after they have caused service disruption. Reactive incident management is more costly and disruptive than early identification.
- Approach: Integrated monitoring across compute, network, storage, power, and cooling systems provides a continuous operational health picture. Defined thresholds and anomaly detection logic flag conditions that warrant attention before they escalate.
- Value: Earlier identification of developing infrastructure issues, supporting planned rather than emergency interventions and reducing unplanned downtime.

**UC-03 — AI Workload Management**
- Problem: AI workloads — particularly training runs and large-scale inference deployments — can place extreme and variable demands on compute, power, and cooling infrastructure. Managing these workloads without visibility into infrastructure conditions risks thermal incidents, power demand spikes, or under-provisioning.
- Approach: Workload-aware infrastructure management connects AI compute scheduling with real-time signals from the power and cooling infrastructure. This provides operators and scheduling systems with the contextual data needed to place, pace, and manage AI workloads in line with available infrastructure capacity.
- Value: More reliable AI workload execution, with infrastructure conditions visible to the teams managing both the workloads and the physical systems they run on.

**UC-04 — Cooling Optimization**
- Problem: Cooling represents a significant proportion of total data center energy consumption. Over-cooling is common — driven by conservative safety margins and limited real-time thermal visibility — and results in substantial unnecessary energy expenditure.
- Approach: Continuous thermal monitoring across the compute environment — combined with workload intensity data — provides the visibility needed to calibrate cooling systems to actual thermal load rather than worst-case assumptions.
- Value: Improved thermal management with reduced energy waste, without compromising the thermal stability required for reliable hardware operation.

**UC-05 — Capacity Planning**
- Problem: Infrastructure capacity decisions are often made on inadequate data — either overprovision leads to unnecessary capital expenditure, or under-provisioning creates operational bottlenecks. Neither is acceptable at scale.
- Approach: Historical utilisation data, trend analysis, and regional demand signals provide the quantitative foundation for capacity planning decisions — for compute, power delivery, cooling infrastructure, and network connectivity.
- Value: Capacity decisions informed by operational evidence rather than assumptions, enabling more efficient capital allocation and growth planning.

**UC-06 — Anomaly Detection**
- Problem: Infrastructure environments produce significant volumes of operational data. Identifying the specific signals that indicate genuine anomalies — rather than normal operational variation — requires context and analytical capability that is difficult to maintain manually at scale.
- Approach: Automated anomaly detection logic, calibrated to the normal operating envelope of specific infrastructure systems, flags deviations that warrant operator attention — filtering operational noise and surfacing genuinely significant conditions.
- Value: Faster identification of genuine infrastructure anomalies, with reduced alert fatigue compared to threshold-only approaches.

**UC-07 — Automated Operational Alerts**
- Problem: Manual monitoring of infrastructure systems at the granularity required for effective operational management is impractical at scale. Important conditions are missed, or identified too late for preventive action.
- Approach: Automated alert workflows route infrastructure conditions to the appropriate operational teams in structured, actionable formats — including context about the condition, its location in the infrastructure stack, and relevant operational history.
- Value: Operational teams receive timely, contextual alerts that support faster and more informed responses, without requiring continuous manual monitoring of every infrastructure signal.

---

## PART 13 — GREENNEXT APPROACH

**Anchor:** `#approach`
**Component:** `<ApproachSection>`
**Purpose:** Presents GreenNext's operational methodology as a 3-stage framework. Reusable as a brand differentiator block.
**Layout pattern:** 3-column article grid

---

#### Content Blocks

**Block: Section Header**
- Eyebrow: `The GreenNext Approach`
- H2: `From Understanding to Continuous Optimization`

**Block: Stage Cards (3 articles)**

**Stage 01 — Understand**
- Stage number: `01`
- Icon concept: Building / foundation
- H3: `Understand`
- Body paragraph 1: `GreenNext begins by developing a detailed understanding of the infrastructure, workload, energy, and operational environment it is designed to serve. This means assessing compute requirements, energy and thermal profiles, connectivity needs, regional context, and the specific operational challenges that the infrastructure must address. Without this understanding, design and operational decisions lack the context they need to be genuinely effective.`
- Body paragraph 2: `The outcome of this stage is a clear, grounded picture of what the infrastructure needs to do and what operational conditions it will face.`

**Stage 02 — Intelligence**
- Stage number: `02`
- Icon concept: Circuit board / analytics
- H3: `Intelligence`
- Body paragraph 1: `Intelligence means applying monitoring, analytics, AI-driven analysis, and automation to understand what is actually happening inside the infrastructure environment — in real time and over time. This is not a single tool or dashboard; it is a continuous operational capability that connects instrumented systems with analytical processes and makes the results available to operators and automation systems in a meaningful form.`
- Body paragraph 2: `The outcome of this stage is operational visibility — knowing what the infrastructure is doing, how it is performing, and where conditions are changing.`

**Stage 03 — Optimize**
- Stage number: `03`
- Icon concept: Gauge / improvement dial
- H3: `Optimize`
- Body paragraph 1: `Optimization uses the understanding and intelligence from the previous stages to make the infrastructure more efficient, more reliable, and better matched to the demands placed on it. This is a continuous process, not a one-time configuration exercise. As workloads change, as regional demand evolves, and as operational experience accumulates, the optimization process adapts.`
- Body paragraph 2: `The outcome of this stage is infrastructure that consistently delivers better resource efficiency, operational reliability, and management clarity — improving over time rather than degrading.`

---

## PART 14 — CONTACT / FINAL CTA

**Anchor:** `#contact`
**Component:** `<CTASection>`
**Purpose:** Enterprise-appropriate closing CTA. Entry point for enquiries. Contains contact form.

---

#### Content Blocks

**Block: CTA Header**
- Eyebrow: `Start a conversation`
- H2: `Build the Next Generation of Digital Infrastructure`
- Supporting paragraph: `If you are involved in infrastructure planning, data center operations, AI workload management, or regional digital development, we want to understand your requirements and explore where GreenNext's approach might be relevant.`

**Block: CTA Button Group**

| CTA | Label | href | Type |
|-----|-------|------|------|
| Primary | `Connect With GreenNext →` | `#contact` | Primary button |
| Secondary | `Explore Infrastructure` | `#infrastructure` | Outline/ghost button |

**Block: Contact Form**
- Form title: `Connect With GreenNext`
- Form intro: `Whether you are exploring infrastructure requirements, a potential partnership, or simply want to understand GreenNext's approach, we welcome the conversation.`

**Form fields:**

| Field | Type | Required | Label |
|-------|------|----------|-------|
| Name | text | Yes | Name |
| Organisation | text | Yes | Organisation |
| Email | email | Yes | Email |
| Interest / question | textarea | No | Your interest or question (optional) |

- Submit button: `Send Message →`
- Privacy note: `Your information will be used only to respond to your enquiry.`

**Form states:**
- Success: `Thank you. We've received your message and will be in touch shortly.`
- Error (missing field): `Please complete all required fields before submitting.`
- Error (invalid email): `Please enter a valid email address.`
- Error (submission failed): `Something went wrong. Please try again, or use the GreenNext inquiry form.`

---

### Alternative CTA Variants (for A/B testing or secondary placements)

**Variant A:**
- Heading: `Intelligent Infrastructure Starts With a Conversation`
- CTA: `Discuss Your Infrastructure Requirements →`

**Variant B:**
- Heading: `Shaping Smarter Digital Infrastructure Across South India`
- CTA: `Explore GreenNext's Approach →`

---

## PART 15 — FOOTER

**Component:** `<SiteFooter>`
**Purpose:** Navigation redundancy, brand reinforcement, legal, region listing.

---

#### Content Blocks

**Block: Footer Brand**
- Logo: Leaf icon + GreenNext wordmark
- Tagline: `Intelligent infrastructure for resilient, efficient digital ecosystems across South India.`

**Block: Footer Navigation — Column 1 (Explore)**
- Heading: `Explore`
- Links: About · Infrastructure · Energy Efficiency · Automation

**Block: Footer Navigation — Column 2 (Network)**
- Heading: `Network`
- Links: Regions · Contact · Sustainability

**Block: Footer Navigation — Column 3 (Regions)**
- Heading: `Regions`
- Items (not links — static text): Madurai · Coimbatore · Trichy · Mangalore

**Block: Footer Bottom Bar**
- Left: `© 2026 GreenNext. All rights reserved.`
- Centre-right: `Privacy` · `Terms` (placeholder links — `href="#"`)
- Right: `Madurai · Coimbatore · Trichy · Mangalore`

---

## PART 16 — MICROCOPY

### Buttons

| ID | Label | Context | href |
|----|-------|---------|------|
| btn-hero-primary | `Explore Our Infrastructure →` | Hero | #infrastructure |
| btn-hero-secondary | `🌐 Explore Our Regions` | Hero | #regions |
| btn-cta-primary | `Connect With GreenNext →` | CTA section | #contact |
| btn-cta-secondary | `Explore Infrastructure` | CTA section | #infrastructure |
| btn-nav-cta | `Connect →` | Site header | #contact |
| btn-form-submit | `Send Message →` | Contact form | — |
| btn-mobile-open | (hamburger icon) | Mobile header | — |
| btn-mobile-close | (X icon) | Mobile header | — |
| btn-scroll-cue | `↓ Discover` | Hero scroll | #why |
| btn-region-tab | `{Region Name}` | Dashboard tabs | — |
| btn-region-selector | `{IATA Code}` | Region detail panel | — |

---

### Navigation Hover Descriptions

| Item | Description |
|------|-------------|
| Infrastructure | AI-era infrastructure design across compute, power, cooling, and monitoring |
| Energy | Intelligent power and thermal management for efficient data center operations |
| Automation | Infrastructure monitoring and automation workflows |
| Regions | Madurai · Coimbatore · Trichy · Mangalore |
| Sustainability | Resource efficiency, energy awareness, and sustainable digital growth |
| Connect | Start a conversation with the GreenNext team |

---

### Dashboard Microcopy

| Element | Copy |
|---------|------|
| Health badge | ⬤ Systems view active |
| Demo data badge | Illustrative demo data |
| Regional status | Conceptual / Planning |
| Automation events sub-label | Illustrative / 24h |
| Open alerts sub-label | Illustrative |
| Metric card footer | Illustrative signal |
| Chart label | 24-hour operational pattern |
| Chart badge | Illustrative |
| Connected signals overline | CONNECTED INFRASTRUCTURE SIGNALS |
| System relationship overline | SYSTEM RELATIONSHIP |
| Energy console badge | Illustrative |
| Map caption | Conceptual network · Not a claim of operating sites |
| Architecture diagram label | Conceptual architecture · Signal flow |

---

### Loading States

| Context | Copy |
|---------|------|
| Dashboard loading | Loading infrastructure overview… |
| Region data loading | Fetching regional signals… |
| Chart loading | Building operational pattern… |
| General | Loading… |

---

### Empty States

| Context | Copy |
|---------|------|
| No infrastructure data | No infrastructure data connected. Configure monitoring endpoints to begin. |
| No energy data | No energy monitoring data available. Connect power measurement systems to enable this view. |
| No compute data | No compute utilisation data available for this region. |
| No cooling data | No cooling system data connected. Thermal monitoring integration required. |
| No network data | No network monitoring data available. Configure network telemetry sources to enable this view. |
| No automation events | No automation events in the current period. |
| No alerts | No open alerts. |
| No region selected | Select a region to view operational signals. |

---

### Concept / Disclaimer Notes (on-page display)

| Location | Disclaimer text |
|----------|----------------|
| Automation section (footnote) | These represent conceptual capabilities and workflows — not claims of currently deployed production systems. GreenNext will clearly communicate which capabilities are live, in development, or on the product roadmap as the initiative progresses. |
| Regions map caption | Conceptual network · Not a claim of operating sites |
| Regions section note | The regions described below represent GreenNext's infrastructure planning focus areas. This is a conceptual network view, not a claim of currently operating facilities at these locations. |
| Architecture flow label | Conceptual architecture · Signal flow |
| Energy console badge | Illustrative |
| Dashboard global label | All figures are illustrative demo data. They do not represent real GreenNext operational measurements. |

---

## PART 17 — CONTENT & DATA REQUIREMENTS

### Static Content
All body copy, headings, and labels are static strings — no API or CMS required.

### Dynamic / Interactive Data

| Feature | Data source | State |
|---------|-------------|-------|
| Region detail panel | JavaScript object (in-component) | Hardcoded illustrative data |
| Dashboard metric values | JavaScript object (in-component) | Hardcoded illustrative data |
| Dashboard activity chart | JavaScript array (in-component) | Hardcoded illustrative values |
| Region tab selector | React useState / vanilla JS | Client-side only |
| Map pin active state | React useState / vanilla JS | Client-side only |
| Mobile nav toggle | React useState / vanilla JS | Client-side only |
| Contact form | POST to email handler or third-party form service | TBD |

### Region Data Object Structure (JavaScript / TypeScript reference)

```typescript
type Region = "Madurai" | "Coimbatore" | "Trichy" | "Mangalore";

interface RegionData {
  code: string;          // IATA code (MDU, CJB, TRZ, IXE)
  category: string;      // Role label
  detail: string;        // Short description for detail panel
  compute: number;       // Illustrative % (0–100)
  power: number;         // Illustrative %
  cooling: number;       // Illustrative %
  network: number;       // Illustrative %
  events: number;        // Illustrative automation event count
  alerts: number;        // Illustrative open alert count
  position: string;      // CSS map pin position (left / top %)
}

const regions: Record<Region, RegionData> = {
  Madurai:    { code:"MDU", category:"Regional Technology & Infrastructure Hub",
                detail:"Regional technology and infrastructure hub.",
                compute:64, power:71, cooling:82, network:96,
                events:18, alerts:2, position:"left-[54%] top-[72%]" },
  Coimbatore: { code:"CJB", category:"Industrial & Technology Ecosystem",
                detail:"Industrial and technology ecosystem.",
                compute:72, power:68, cooling:79, network:94,
                events:24, alerts:1, position:"left-[38%] top-[57%]" },
  Trichy:     { code:"TRZ", category:"Strategic Central Tamil Nadu Connectivity",
                detail:"Strategic central Tamil Nadu connectivity.",
                compute:58, power:62, cooling:86, network:97,
                events:13, alerts:0, position:"left-[58%] top-[49%]" },
  Mangalore:  { code:"IXE", category:"Coastal Technology & Connectivity Gateway",
                detail:"Coastal technology and connectivity gateway.",
                compute:69, power:74, cooling:77, network:93,
                events:21, alerts:3, position:"left-[14%] top-[28%]" },
};
```

### Activity Chart Data
```typescript
const chartBars: number[] = [34,42,39,51,49,62,58,73,66,79,75,84,72,68,77,64,71,55,59,47,52,39,44,35];
// 24 values, one per hour (00:00–23:00). All illustrative.
```

### SEO Metadata

```html
<title>GreenNext | Intelligent Data Center Infrastructure</title>
<meta name="description" content="AI-ready data center infrastructure, energy efficiency, and intelligent automation for connected digital ecosystems across South India." />
<meta property="og:title" content="GreenNext | Intelligent Infrastructure for a Sustainable Digital Future" />
<meta property="og:description" content="AI-driven data center infrastructure, energy efficiency, and intelligent automation across South India." />
<meta property="og:type" content="website" />
<meta property="og:url" content="/" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="/" />
```

---

## PART 18 — CONTENT STATE TAXONOMY

Three content states are used throughout this specification. Every piece of content must have an assigned state.

---

### State 1: `[IMPLEMENTED]`
**Definition:** A capability, feature, or system that is actively deployed and operational.
**Usage rule:** Only apply this state if the approved content document explicitly states the capability is live.
**Current usage in this spec:** None. The approved content document does not assert any currently deployed production capabilities.

---

### State 2: `[CONCEPTUAL]`
**Definition:** A planned design concept, intended operational workflow, or proposed capability. Not yet deployed. Not yet operational.
**Display guidance:** Include a visible disclaimer wherever `[CONCEPTUAL]` content appears.
**Required disclaimer text:** *"These represent conceptual capabilities and workflows — not claims of currently deployed production systems."*
**Applies to:**
- All automation capability areas (Infrastructure Alerts, Capacity Monitoring, Cooling-System Monitoring, Energy Anomaly Detection, Operational Reporting)
- All AI infrastructure capability cards
- The AI infrastructure flow diagram
- The energy relationship panel
- All four region descriptions (conceptual network, not operating sites)
- The architecture stack diagram

---

### State 3: `[ILLUSTRATIVE / DEMO DATA]`
**Definition:** Sample numerical values used only to demonstrate an interface. Explicitly not real operational measurements.
**Display guidance:** Every data point in this state must be labelled visibly as "Illustrative" or "Demo Data" in the UI. Do not hide or minimise this label.
**Required disclaimer text:** *"All figures are illustrative demo data. They do not represent real GreenNext operational measurements."*
**Applies to:**
- All dashboard metric values (compute %, energy %, cooling %, network %)
- All automation event counts
- All open alert counts
- The activity chart bar values
- Any numerical figure appearing in a dashboard context

---

### State Conversion Rules

| Conversion | Allowed? | Condition |
|-----------|----------|-----------|
| `[CONCEPTUAL]` → `[IMPLEMENTED]` | ✅ Yes | Only when approved content explicitly confirms live deployment |
| `[ILLUSTRATIVE]` → real data | ✅ Yes | Only when connected to a real, authorised data source |
| `[CONCEPTUAL]` → `[ILLUSTRATIVE]` | ❌ No | These are distinct state types |
| Silent removal of disclaimer | ❌ Never | Disclaimers must be present whenever their state applies |

---

## PART 19 — FINAL CONTENT VALIDATION CHECKLIST

Performed against the approved GreenNext Website Content Document.

### Completeness Checks

| Check | Status | Notes |
|-------|--------|-------|
| All four regions represented | ✅ Pass | Madurai (MDU), Coimbatore (CJB), Trichy (TRZ), Mangalore (IXE) — all present in Regions section and Dashboard |
| AI infrastructure is a primary theme | ✅ Pass | Present in Hero, Why GreenNext, AI Infrastructure section, Architecture, Use Cases |
| Energy efficiency is a primary theme | ✅ Pass | Present in Hero, Why GreenNext, Energy section, Sustainability, Use Cases, Architecture |
| Intelligent automation is a primary theme | ✅ Pass | Present in Hero, Why GreenNext, Automation section, Use Cases, Architecture |
| Hero H1 present | ✅ Pass | `Intelligent Infrastructure for a Sustainable Digital Future` |
| Both hero CTAs present | ✅ Pass | Primary + Secondary |
| 4 capability labels in hero | ✅ Pass | AI-Ready Infrastructure · Energy Optimization · Intelligent Automation · Regional Connectivity |
| 4 why-GreenNext capability cards | ✅ Pass | Cards 01–04 all present |
| 6-step automation workflow | ✅ Pass | Monitor → Detect → Analyze → Decide → Automate → Report |
| 6 automation capability areas | ✅ Pass | Including Predictive Maintenance as `[CONCEPTUAL — Future direction]` |
| 7 architecture layers | ✅ Pass | All 7 layers with short title, icon, role description |
| 6 sustainability focus areas | ✅ Pass | Items 01–06 all present |
| 7 use cases | ✅ Pass | UC-01 through UC-07 all present with Problem/Approach/Value structure |
| 3 approach stages | ✅ Pass | 01 Understand · 02 Intelligence · 03 Optimize |
| Final CTA present | ✅ Pass | Build the Next Generation of Digital Infrastructure |
| Footer navigation complete | ✅ Pass | 3 columns: Explore · Network · Regions |

---

### Accuracy / Integrity Checks

| Check | Status | Notes |
|-------|--------|-------|
| No invented statistics | ✅ Pass | No percentages or numerical claims outside clearly labelled illustrative dashboard data |
| No invented customers | ✅ Pass | No customer names or case studies |
| No invented partnerships | ✅ Pass | No third-party partners mentioned |
| No invented certifications | ✅ Pass | No ISO, Uptime Institute, or similar certifications claimed |
| No unsupported operational claims | ✅ Pass | No statement asserts GreenNext currently operates facilities |
| Illustrative dashboard data labelled | ✅ Pass | All metric values carry `[ILLUSTRATIVE / DEMO DATA]` state |
| Conceptual capabilities distinguished | ✅ Pass | All automation and infrastructure capabilities carry `[CONCEPTUAL]` state |
| Predictive maintenance marked as future | ✅ Pass | Labelled `[CONCEPTUAL — Future direction]` |
| Regional network disclaimer present | ✅ Pass | On-page note: Conceptual network · Not a claim of operating sites |
| Automation disclaimer present | ✅ Pass | Footnote on Automation section |
| Dashboard global disclaimer present | ✅ Pass | Header-level: all figures are illustrative demo data |

---

### Navigation & CTA Checks

| Check | Status | Notes |
|-------|--------|-------|
| All nav items link to correct anchors | ✅ Pass | #infrastructure · #energy · #automation · #regions · #sustainability · #contact |
| Header CTA links to #contact | ✅ Pass | |
| Primary hero CTA links to #infrastructure | ✅ Pass | |
| Secondary hero CTA links to #regions | ✅ Pass | |
| Final CTA primary links to /contact | ✅ Pass | |
| Final CTA secondary links to #infrastructure | ✅ Pass | |
| Scroll cue links to #why | ✅ Pass | |
| No placeholder [TBD] links in critical paths | ✅ Pass | Privacy/Terms use href="#" as acknowledged placeholders |

---

### Terminology Consistency Checks

| Term | Usage note |
|------|-----------|
| GreenNext | Capitalised as one word throughout |
| AI workloads | Consistent (not "AI jobs" or "ML workloads") |
| Data center | Two words, no hyphen — consistent throughout |
| Compute utilisation | British spelling (consistent) |
| Optimise / Optimize | American spelling "Optimize" used consistently (per approved content) |
| Conceptual / Planning | Dashboard regional status label — consistent |
| Illustrative / Demo Data | Dashboard metric label — consistent |
| South India | Capitalised geographic term — consistent |

---

*Document ends.*
*GreenNext Content Implementation Specification — Pre-design phase*
*Source of truth: GreenNext Website Content Document (approved)*
*Next phase: Visual Design*
