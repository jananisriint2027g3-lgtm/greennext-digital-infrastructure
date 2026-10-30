# GreenNext Comprehensive UI/UX Audit

Audit date: 2026-10-30  
Local project: `E:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main`  
Branch: `feature/visitor-confirmation-emails`  
Live site: <https://greennext-ai.vercel.app/>

## Scope and method

This was a read-only audit. The working tree was inspected before testing and contained substantial unrelated staged/unstaged/untracked work. No existing file was edited, formatted, renamed, deleted, staged, committed, pushed, or deployed. `docs/UX_AUDIT_REPORT.md` did not exist before this audit and is the only file created.

The local application was already available at `http://localhost:8080/`. Browser inspection used actual rendered DOM, accessibility trees, computed layout checks, screenshots, keyboard interaction, and responsive viewport overrides. The public Vercel site was inspected separately because its copy and rendered build are not identical to the local branch.

## Executive summary

GreenNext presents a coherent enterprise-infrastructure identity: deep slate surfaces, emerald/cyan functional accents, monospace metadata, structured cards, technical diagrams, and clear conceptual/demo boundaries. The major route families are discoverable, local navigation loaded successfully across the discovered routes, and the required desktop/tablet/mobile viewport checks found no horizontal overflow on the representative pages tested.

No critical navigation or rendering blocker was reproduced. The most important improvement is accessibility hardening: five capacity-planning range controls have no accessible name, and the contact form's topic select and message textarea are not programmatically associated with their visible labels. These are real WCAG risks even though the controls remain visually understandable.

The other recurring concern is consistency rather than breakage. The specification defines a 1280px global container, while the implementation mixes 1340px and 1480px containers. Fixed visitor/contact/chat controls also occupy or overlay valuable mobile viewport space. Finally, the public Vercel build and local source contain different copy and content variants; this must be treated as release drift, not as evidence that the local branch is what visitors currently see.

## Overall scores

| Area | Score | Evidence-based rationale |
| --- | ---: | --- |
| Visual design | 8.3/10 | Strong, consistent industrial-dark visual language, structured cards, and restrained accent use. Some container-width and floating-widget inconsistencies reduce polish. |
| Navigation | 8.2/10 | All discovered route families loaded locally; desktop navigation exposes active states and conceptual badges; mobile drawer and regional submenu opened by keyboard. Focus containment and full keyboard traversal were not exhaustively verified. |
| Usability | 7.8/10 | Clear CTAs, calculators, regional comparison, dashboard, and map controls. Dense technical pages and fixed widgets can increase cognitive or viewport load. |
| Responsiveness | 8.4/10 | No horizontal overflow was found on representative pages at 1440×900, 1366×768, 768×1024, 390×844, or 360×800. Mobile stacking was visually checked on the regional page. |
| Accessibility | 7.2/10 | Strong focus-visible baseline, many accessible names, alt text, and reduced-motion CSS. Unlabelled capacity sliders and two unassociated contact fields are high-priority gaps. |
| Content hierarchy | 8.0/10 | Page heroes, breadcrumbs, section eyebrows, H1/H2/H3 structure, and lifecycle narratives are clear. Long pages can become scan-heavy without stronger in-page navigation or summaries. |
| Enterprise credibility | 8.8/10 | Conceptual/planning labels, demo telemetry disclaimers, unavailable fields, and source-status boundaries are unusually clear. A few marketing-style operational statements should continue to be reviewed against evidence. |
| Overall UI/UX | 8.0/10 | Strong foundation suitable for enterprise review, with a focused accessibility and consistency backlog rather than a redesign need. |

## Route and page-by-page audit

All routes below were discovered from `src/routes`, `src/data/navigation.ts`, and the route-linked page content. Each listed local route rendered a title and a page H1 during the audit unless noted in the testing limitations section.

### Homepage

`/`

The hero slider, capability pillars, journey links, operational pipeline, energy flow, automation workflow, regional explorer, dashboard, use cases, sustainability, methodology, CTA, and footer form a credible briefing sequence. The visual hierarchy is strongest at desktop. On mobile, the hero remains readable and the sticky header, visitor banner, and floating controls consume a large amount of the first viewport; this is a usability consideration, not a rendering failure.

### Infrastructure

`/infrastructure`  
`/infrastructure/ai-ready`  
`/infrastructure/compute`  
`/infrastructure/storage`  
`/infrastructure/network`  
`/infrastructure/architecture`  
`/infrastructure/cybersecurity`  
`/infrastructure/facility-engineering`  
`/infrastructure/fire-safety`  
`/infrastructure/commissioning`  
`/infrastructure/environmental-monitoring`

The pages share a stable hero/template language and route users through related architecture content. The 7-layer stack and technical diagrams communicate relationships well. The architecture page is information-dense, so a compact sticky section index or “current layer” affordance would improve long-page orientation on smaller screens.

### Energy

`/energy`  
`/energy/monitoring`  
`/energy/cooling`  
`/energy/workload-aware`  
`/energy/analytics`  
`/energy/optimization`

The energy family has a coherent workflow from measurement to optimization. PUE and cooling calculators expose inputs and assumptions clearly. The energy impact calculator rendered successfully after navigation and its keyboard-operable sliders updated outputs; the what-if chart includes units, axes, legend labels, and an illustrative-data disclaimer.

### Automation

`/automation`  
`/automation/monitoring`  
`/automation/anomaly`  
`/automation/alerts`  
`/automation/capacity`  
`/automation/reporting`  
`/automation/operations`

The monitoring → detect → analyze → decide → automate → report narrative is clear and appropriate for the product positioning. The capacity page is the accessibility exception: its five sliders are visually paired with labels but lack `id`, `aria-label`, `aria-labelledby`, or associated `<label for>` relationships.

### Offerings and planning tools

`/solutions`  
`/solutions/energy-monitoring`  
`/solutions/health-monitoring`  
`/solutions/ai-workload-management`  
`/solutions/cooling-optimization`  
`/solutions/capacity-planning`  
`/solutions/anomaly-detection`  
`/solutions/automated-alerts`  
`/solutions/configurator`  
`/solutions/architecture-explorer`  
`/solutions/energy-calculator`  
`/solutions/infrastructure-index`

The offering/use-case pages use a consistent problem/approach/value structure and route to related capabilities. The configurator and calculator make illustrative assumptions visible, which supports enterprise credibility. The infrastructure index is useful as a structured data explorer, but it is visually and conceptually denser than the surrounding offering pages and benefits from a short “how to read this index” orientation near the controls.

### Industries

`/icp`  
`/icp/data-center-operators`  
`/icp/ai-hyperscale`  
`/icp/enterprise-edge`  
`/icp/sustainability-energy`

The ICP pages are clear about audience and qualification context. Their cards and frameworks fit the shared design language. They should retain the explicit distinction between planning qualification and customer proof; no unsupported customer evidence was observed in the audited rendered content.

### Sustainability

`/sustainability`  
`/sustainability/energy-aware`  
`/sustainability/efficient-cooling`  
`/sustainability/resource-optimization`  
`/sustainability/sustainable-growth`

The sustainability doctrine is presented with appropriate caution around measured versus conceptual performance. The factual-discipline language is a strength. Some pages carry long explanatory copy blocks; adding compact takeaways before the detail would improve executive scanning without changing the substance.

### Regions

`/regions`  
`/regions/overview`  
`/regions/madurai`  
`/regions/coimbatore`  
`/regions/trichy`  
`/regions/mangalore`  
`/regions/hosur`  
`/regions/tirunelveli`  
`/regions/puducherry`

The regional overview has a strong information architecture: explanatory rationale, portfolio, comparison, dashboard, seven-node map/dossier, CTA, then footer. The local and public rendered overview showed the map controls, the map caption below rather than over the geography, and the complete Madurai dossier with source/status disclaimers. The seven regional detail pages share a coherent template and retain region-specific content.

One content/UI point deserves continued review: Madurai visibly reports both `75+ acres` and `93+ acres` and explicitly flags the discrepancy. This is correct from a factual-integrity standpoint; it should not be silently normalized until the source conflict is resolved.

### About

`/about`  
`/about/what-we-are`  
`/about/why-we-exist`  
`/about/our-approach`  
`/about/direction`

The about pages explain the initiative, methodology, and boundaries clearly. The “what GreenNext is / is not” framing supports enterprise trust and should remain prominent.

### Contact and utility pages

`/contact`  
`/privacy-policy`  
`/redis-demo`

Contact pathway selection and empty-form validation were tested locally. Submitting an empty technical inquiry produced the expected client-side errors for full name, work email, and requirements. The contact form has the label-association issue documented below. Privacy and Redis demo pages rendered successfully; Redis live-service behavior was not tested because that would require external service access.

## Prioritised issue register

### High priority

#### H-01 — Capacity sliders have no accessible names

- Route: `/automation/capacity`
- Component: `src/components/kpi/CapacityUtilizationModel.tsx:178,204,230,256,282`
- Evidence: Browser DOM inspection found five `input[type="range"]` elements with no `id`, `aria-label`, `aria-labelledby`, or associated label. The visible text appears in a sibling `<span>`, which is not a programmatic name.
- Impact: Screen-reader users encounter unlabeled sliders and cannot know whether a control changes IT power, rack space, cooling, GPU, or storage capacity.
- Recommendation: Give each slider a stable `id` and pair it with a `<label htmlFor>` or `aria-labelledby` referencing the visible control title. Expose current value and units in the accessible description.

#### H-02 — Contact topic and message fields are not label-associated

- Route: `/contact`
- Component: `src/components/common/LeadInquiryForm.tsx:440-466`
- Evidence: The rendered `<select>` and `<textarea>` are preceded by visible labels, but those labels have no `htmlFor` and do not wrap the controls. Browser `getByLabel` found the name field but not the inquiry-topic or message fields.
- Impact: Screen-reader and voice-control users may not receive the intended field names; placeholder text is not a substitute for a label.
- Recommendation: Add unique IDs and `htmlFor` attributes, or wrap each control in its label. Keep the existing validation message association with `aria-describedby`.

### Medium priority

#### M-01 — Fixed visitor/contact/chat controls compete with mobile content

- Routes: homepage and all pages; most visible on `/` and `/regions/overview` at 390×844.
- Components: `VisitorWelcomeBanner`, `FloatingContact`, `GreenNextChatbot`.
- Evidence: Mobile screenshots showed the sticky header, welcome banner, and two fixed circular actions occupying the first viewport and sitting over the page edge. Source uses fixed bottom-right widgets at `src/components/common/FloatingContact.tsx:535` and `src/components/chatbot/GreenNextChatbot.tsx:172`.
- Impact: The controls can obscure page content, reduce the visible hero area, and create competing calls to action on small screens.
- Recommendation: Coordinate the fixed stack into one expandable action, add safe-area-aware offsets, and reduce or defer the welcome banner when a floating tool is open.

#### M-02 — Container widths are inconsistent with the documented design system

- Routes/components: shared header, footer, PageHero, PageTemplate, regional overview, detail pages, and solution pages.
- Evidence: The design specification defines a 1280px global container. The implementation mixes `max-w-[1480px]` and `max-w-[1340px]` across `SiteHeader`, `SiteFooter`, `PageHero`, `PageTemplate`, regional routes, and solution routes.
- Impact: Alignment lines and readable text widths vary between page families; the difference is visible in desktop screenshots even though no overflow occurs.
- Recommendation: Establish one documented container token with intentional exceptions for wide diagrams. Use a narrower measure for long-form prose while retaining wider bounds for maps/tables.

#### M-03 — Mobile drawer semantics and focus containment need a dedicated accessibility pass

- Component: `src/components/layout/SiteHeader.tsx:322-424`.
- Evidence: Keyboard testing opened the drawer and expanded the Regions submenu; the body scroll lock and `aria-expanded` state worked. The drawer is implemented as a fixed `<div>` rather than a dialog/nav landmark with explicit focus containment or `aria-modal` semantics. Full focus traversal and return-focus behavior were not verified with a screen reader.
- Impact: Keyboard and assistive-technology users may tab behind the open drawer or lose context in a long menu.
- Recommendation: Add a labeled navigation region or dialog semantics, trap focus while open, return focus to the hamburger on close, and test Escape and focus order with NVDA/VoiceOver.

#### M-04 — Local source and production content are not identical

- Evidence: The local homepage and public `https://greennext-ai.vercel.app/` rendered different hero and operational copy during this audit. The public regional overview was audited separately from the local branch.
- Impact: Design review, QA screenshots, and stakeholder feedback can target different content builds.
- Recommendation: Record the deployed commit/build identifier in release notes or expose a non-public diagnostic build marker. Audit the exact deployment URL when approving visual changes.

### Low priority

#### L-01 — Long technical pages need stronger scan aids

- Routes: infrastructure architecture, regional overview, sustainability, and the homepage.
- Evidence: Browser accessibility trees contain many consecutive sections and repeated card-level headings before the footer. The content is meaningful, but executive visitors must scroll through large technical narratives to find the next decision point.
- Impact: Lower scan efficiency and increased cognitive load, especially on mobile.
- Recommendation: Add compact in-page section navigation, summary callouts, or “jump to” links while keeping the detailed content intact.

#### L-02 — Design specification and current information architecture have diverged

- Evidence: The specification describes a `Solutions` top-level menu, four regional hubs, and a 1280px container. The current implementation presents `Offerings`, `Industries`, `Sustainability`, and `Regions` as separate public categories and covers seven regional planning locations.
- Impact: Designers and QA reviewers may incorrectly treat approved current behavior as a defect or implement outdated menu assumptions.
- Recommendation: Update the specification as a documentation task after product approval; do not regress the current navigation solely to match the older document.

## Navigation and interaction audit

- Desktop navigation rendered with active states, conceptual badges, keyboard focus handlers, and route links.
- Mobile navigation opened with the keyboard; the Regions accordion reported `aria-expanded="true"` and exposed the Madurai link.
- Regional comparison selectors rendered with accessible labels.
- Regional map rendered with accessible zoom-in, zoom-out, and reset names; the live and local DOM placed the conceptual relationship caption outside the map viewport.
- The energy calculator exposed labeled inputs, updated its output when a range control was adjusted with the keyboard, and displayed the illustrative what-if chart with units and a clear disclaimer.
- Contact empty-form validation displayed required-field errors without requiring a live submission.
- No broken route or horizontal overflow was reproduced in the discovered local route set during navigation testing.

## Responsive audit

Required viewport sizes were checked on representative `/`, `/regions/overview`, `/solutions/energy-calculator`, `/contact`, and `/infrastructure/architecture` pages:

| Viewport | Result |
| --- | --- |
| 1440×900 | No horizontal overflow detected; desktop header and regional hero visually inspected. |
| 1366×768 | No horizontal overflow detected. |
| 768×1024 | No horizontal overflow detected; hamburger layout present. |
| 390×844 | No horizontal overflow detected; regional page visually inspected; fixed controls consume notable space. |
| 360×800 | No horizontal overflow detected. |

This is strong evidence for the shared layout but is not a pixel-perfect screenshot comparison of every route at every size.

## Accessibility audit

Positive evidence:

- Global `:focus-visible` styling is defined in `src/styles.css:130-133`.
- Reduced-motion rules are present in `src/styles.css:168-177`.
- Header, hero slider, regional map, dashboard controls, floating actions, and chatbot controls generally expose accessible names.
- Images inspected in the route sweep had non-empty `alt` attributes.
- Mobile controls use minimum-size classes in several shared components.

Gaps:

- H-01 and H-02 above are confirmed field-label failures.
- Focus containment for the mobile drawer and chatbot was not confirmed with a screen reader.
- A full WCAG contrast audit using a dedicated analyzer was not performed; the documented palette has strong primary/secondary contrast, but muted metadata and small mono labels should still be spot-checked against their exact surface colors.
- Touch/pointer map panning was not fully reproducible through the available browser automation in this audit; the DOM controls and source handlers were inspected, while zoom/reset were previously verified in the local browser.

## Enterprise credibility and content presentation

Strengths:

- Regional and dashboard content repeatedly says conceptual, planning, illustrative, or demo where appropriate.
- The dashboard explicitly says it is not live telemetry.
- Unavailable fields remain unavailable rather than being filled with fabricated values.
- The Madurai land-area discrepancy is surfaced as a confirmation warning.
- Portfolio copy separates site power from data-centre IT load.
- CTAs are generally purposeful and route to technical conversations or deeper architecture content.

Keep these boundaries in all future visual work. Avoid adding decorative “live” gauges, customer logos, operational percentages, or deployment language without verified sources.

## Design specification comparison

### Implemented well

- Deep slate/charcoal canvas and emerald/cyan functional accents.
- Technical metadata, structural borders, cards, diagrams, and system-oriented copy.
- Hero slider with five themes and accessible control names.
- Conceptual regional map and dashboard with explicit data-status boundaries.
- Three-stage and multi-step operational narratives.
- Reduced-motion CSS, focus-visible styling, and broad route coverage.
- Enterprise footer with a crawlable sitemap and factual-status disclaimer.

### Inconsistent or outdated

- The documented global container is 1280px; implementation uses 1340px and 1480px variants.
- The specification's `Solutions` naming is now represented as `Offerings` in the public navigation.
- The specification's four regional hubs are outdated relative to the current seven-node planning model.
- The specification claims full WCAG conformance, but the current form/slider DOM contradicts that claim until H-01 and H-02 are fixed.
- The specification describes a right-side mobile drawer; the implementation uses a full-width fixed top drawer. This is a documentation mismatch, not a reproduced functional failure.

## Recommended roadmap

### Phase 1 — Critical/high-value quality work

1. Add accessible names and value descriptions to the five capacity sliders.
2. Associate contact topic and message labels with their controls.
3. Run a keyboard-only and screen-reader pass through the mobile drawer, chatbot, floating contact form, calculators, and map.

### Phase 2 — High-confidence usability improvements

1. Coordinate or consolidate fixed mobile widgets and welcome messaging.
2. Add an in-page contents/jump mechanism to long infrastructure, regional, and sustainability pages.
3. Add a reliable local/deployed build identifier to prevent release-review drift.

### Phase 3 — Consistency refinement

1. Decide and document the container-width system.
2. Normalize prose measure, card padding, and section spacing across 1340px/1480px page families.
3. Refresh the UI/UX specification to reflect Offerings, Industries, seven regional locations, and current mobile behavior.

### Phase 4 — Final polish

1. Run automated contrast checks and manual low-vision checks on muted mono labels.
2. Add screenshot regression coverage for the five required viewports on representative high-risk pages.
3. Validate reduced-motion behavior and focus return across all animated overlays.

## Existing strengths to preserve

- The industrial-dark design language and restrained emerald/cyan palette.
- Conceptual/demo/source-status labeling.
- The regional map/dossier hierarchy and explicit source discrepancy warning.
- The dashboard's visible illustrative-data disclaimer.
- Hero slider controls and technical narrative sequencing.
- The footer sitemap and clear contact pathways.
- Responsive stacking behavior and current no-overflow baseline.

## Verification record and limitations

- Local browser-tested route families: homepage; all discovered Infrastructure, Energy, Automation, Offerings, Industries, Sustainability, Regions, About, Contact, Privacy, and Redis routes.
- Local screenshots visually inspected: homepage at desktop; regional overview at desktop and mobile.
- Live browser-tested: homepage and `/regions/overview` at `https://greennext-ai.vercel.app/`.
- Required responsive sizes tested on representative pages: 1440×900, 1366×768, 768×1024, 390×844, and 360×800.
- Existing automated suite: 305 tests, 303 passed, 2 skipped, 0 failed. The skipped tests require live Redis configuration.
- No project files other than this report were created or modified.
- A dedicated screen-reader session, colorimeter/contrast analyzer, full touch gesture trace, and live Redis integration were not available or not performed.
- The audit does not claim every hover/focus state on every route was individually exercised; source inspection and representative browser checks were used for shared components.
