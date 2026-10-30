import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("public navigation exposes Offerings, Industries, Infrastructure, and Regions", () => {
  const navigation = read("src/data/navigation.ts");
  assert.match(navigation, /id: "offerings"[\s\S]*label: "Offerings"/);
  assert.match(navigation, /id: "industries"[\s\S]*label: "Industries"/);
  assert.match(navigation, /id: "region"[\s\S]*label: "Regions"/);
  assert.match(navigation, /navigationById\("infrastructure"\)/);
});

test("Infrastructure submenu labels match destination content and related links stay valid", () => {
  const navigation = read("src/data/navigation.ts");
  const pages = read("src/data/pagesContent.ts");
  const expected = [
    ["AI-Ready Infrastructure", "/infrastructure/ai-ready"],
    ["Compute Systems", "/infrastructure/compute"],
    ["Storage & Data", "/infrastructure/storage"],
    ["Network & Connectivity", "/infrastructure/network"],
    ["Infrastructure Architecture", "/infrastructure/architecture"],
    ["Cybersecurity & Protection", "/infrastructure/cybersecurity"],
    ["Facility Engineering", "/infrastructure/facility-engineering"],
    ["Fire Protection & Safety", "/infrastructure/fire-safety"],
    ["Commissioning & Testing", "/infrastructure/commissioning"],
    ["Environmental Monitoring", "/infrastructure/environmental-monitoring"],
  ];
  for (const [label, route] of expected) {
    assert.match(navigation, new RegExp(`label: "${label}"[\\s\\S]*path: "${route}"`));
    assert.match(pages, new RegExp(`route: "${route}"[\\s\\S]*title: "${label}"`));
  }
  assert.doesNotMatch(pages, /path: "\/infrastructure\/power-systems"/);
  for (const relatedTitle of [
    "Compute Systems",
    "Cooling Efficiency",
    "Infrastructure Architecture",
    "Facility Engineering",
  ]) {
    assert.match(pages, new RegExp(`title: "${relatedTitle}"`));
  }
});

test("all public submenu destinations are represented and data-driven titles match their labels", () => {
  const navigation = read("src/data/navigation.ts");
  const pages = read("src/data/pagesContent.ts");
  const publicMenus = [
    ["About", [
      ["What GreenNext Is", "/about/what-we-are"],
      ["Why GreenNext Exists", "/about/why-we-exist"],
      ["The GreenNext Approach", "/about/our-approach"],
      ["Long-Term Direction", "/about/direction"],
    ]],
    ["Infrastructure", [
      ["AI-Ready Infrastructure", "/infrastructure/ai-ready"],
      ["Compute Systems", "/infrastructure/compute"],
      ["Storage & Data", "/infrastructure/storage"],
      ["Network & Connectivity", "/infrastructure/network"],
      ["Infrastructure Architecture", "/infrastructure/architecture"],
      ["Cybersecurity & Protection", "/infrastructure/cybersecurity"],
      ["Facility Engineering", "/infrastructure/facility-engineering"],
      ["Fire Protection & Safety", "/infrastructure/fire-safety"],
      ["Commissioning & Testing", "/infrastructure/commissioning"],
      ["Environmental Monitoring", "/infrastructure/environmental-monitoring"],
    ]],
    ["Energy", [
      ["Overview", "/energy"],
      ["Power Monitoring", "/energy/monitoring"],
      ["Cooling Efficiency", "/energy/cooling"],
      ["Workload-Aware Resources", "/energy/workload-aware"],
      ["Energy Analytics", "/energy/analytics"],
      ["Operational Optimization", "/energy/optimization"],
    ]],
    ["Automation", [
      ["Intelligent Monitoring", "/automation/monitoring"],
      ["Anomaly Detection", "/automation/anomaly"],
      ["Automated Alerts", "/automation/alerts"],
      ["Capacity Management", "/automation/capacity"],
      ["Operational Reporting", "/automation/reporting"],
      ["Operations & Maintenance", "/automation/operations"],
    ]],
    ["Offerings", [
      ["Data Center Energy Monitoring", "/solutions/energy-monitoring"],
      ["Infrastructure Health Monitoring", "/solutions/health-monitoring"],
      ["AI Workload Management", "/solutions/ai-workload-management"],
      ["Cooling Optimization", "/solutions/cooling-optimization"],
      ["Capacity Planning", "/solutions/capacity-planning"],
      ["Anomaly Detection", "/solutions/anomaly-detection"],
      ["Automated Operational Alerts", "/solutions/automated-alerts"],
      ["Infrastructure Configurator", "/solutions/configurator"],
      ["Architecture Explorer", "/solutions/architecture-explorer"],
      ["Energy Impact Calculator", "/solutions/energy-calculator"],
      ["Infrastructure & Grid Index", "/solutions/infrastructure-index"],
    ]],
    ["Industries", [
      ["Data Center Operators & Colocation", "/icp/data-center-operators"],
      ["AI & Hyperscale Infrastructure", "/icp/ai-hyperscale"],
      ["Enterprise & Edge Infrastructure", "/icp/enterprise-edge"],
      ["Sustainability & Energy Stakeholders", "/icp/sustainability-energy"],
    ]],
    ["Sustainability", [
      ["Sustainability Framework", "/sustainability"],
      ["Energy-Aware Infrastructure", "/sustainability/energy-aware"],
      ["Efficient Cooling", "/sustainability/efficient-cooling"],
      ["Resource Optimization", "/sustainability/resource-optimization"],
      ["Sustainable Digital Growth", "/sustainability/sustainable-growth"],
    ]],
    ["Regions", [
      ["Regional Network Overview", "/regions/overview"],
      ["Data Centre Portfolio", "/regions#regional-portfolio"],
      ["Madurai (MDU)", "/regions/madurai"],
      ["Coimbatore (CJB)", "/regions/coimbatore"],
      ["Trichy (TRZ)", "/regions/trichy"],
      ["Mangalore (IXE)", "/regions/mangalore"],
      ["Hosur (HSR)", "/regions/hosur"],
      ["Tirunelveli (TNV)", "/regions/tirunelveli"],
      ["Puducherry (PDY)", "/regions/puducherry"],
    ]],
  ];
  const titleBackedRoutes = new Map([
    ["/about/what-we-are", "What GreenNext Is"],
    ["/about/why-we-exist", "Why GreenNext Exists"],
    ["/about/our-approach", "The GreenNext Approach"],
    ["/about/direction", "Long-Term Direction"],
    ["/infrastructure/ai-ready", "AI-Ready Infrastructure"],
    ["/infrastructure/compute", "Compute Systems"],
    ["/infrastructure/storage", "Storage & Data"],
    ["/infrastructure/network", "Network & Connectivity"],
    ["/infrastructure/architecture", "Infrastructure Architecture"],
    ["/infrastructure/cybersecurity", "Cybersecurity & Protection"],
    ["/infrastructure/facility-engineering", "Facility Engineering"],
    ["/infrastructure/fire-safety", "Fire Protection & Safety"],
    ["/infrastructure/commissioning", "Commissioning & Testing"],
    ["/infrastructure/environmental-monitoring", "Environmental Monitoring"],
    ["/energy", "Energy Efficiency & Power Infrastructure"],
    ["/energy/monitoring", "Power Monitoring"],
    ["/energy/cooling", "Cooling Efficiency"],
    ["/energy/workload-aware", "Workload-Aware Resources"],
    ["/energy/analytics", "Energy Analytics"],
    ["/energy/optimization", "Operational Optimization"],
    ["/automation/monitoring", "Intelligent Monitoring"],
    ["/automation/anomaly", "Anomaly Detection"],
    ["/automation/alerts", "Automated Alerts"],
    ["/automation/capacity", "Capacity Management"],
    ["/automation/reporting", "Operational Reporting"],
    ["/automation/operations", "Operations & Maintenance"],
    ["/regions/overview", "Regional Network Overview"],
    ["/sustainability", "Sustainability Framework"],
    ["/sustainability/energy-aware", "Energy-Aware Infrastructure"],
    ["/sustainability/efficient-cooling", "Efficient Cooling"],
    ["/sustainability/resource-optimization", "Resource Optimization"],
    ["/sustainability/sustainable-growth", "Sustainable Digital Growth"],
    ["/icp/data-center-operators", "Data Center Operators & Colocation"],
    ["/icp/ai-hyperscale", "AI & Hyperscale Infrastructure"],
    ["/icp/enterprise-edge", "Enterprise & Edge Infrastructure"],
    ["/icp/sustainability-energy", "Sustainability & Energy Stakeholders"],
  ]);
  for (const [, entries] of publicMenus) {
    for (const [label, route] of entries) {
      assert.equal(navigation.includes(`label: "${label}"`), true, `Missing menu label: ${label}`);
      assert.equal(navigation.includes(`path: "${route}"`), true, `Missing menu path: ${route}`);
    }
  }
  for (const [route, title] of titleBackedRoutes) {
    assert.match(pages, new RegExp(`route: "${route}"[\\s\\S]{0,180}?title: "${title}"`));
  }
  const publicNavigation = navigation.slice(navigation.indexOf("export const NAVIGATION_STRUCTURE"));
  assert.match(publicNavigation, /id: "home"[\s\S]*navigationById\("infrastructure"\)[\s\S]*navigationById\("energy"\)[\s\S]*navigationById\("automation"\)/);
  assert.match(publicNavigation, /id: "offerings"[\s\S]*id: "industries"[\s\S]*id: "sustainability"[\s\S]*id: "region"[\s\S]*navigationById\("about"\)/);
});

test("Offerings landing page exposes all eleven advertised destinations", () => {
  const navigation = read("src/data/navigation.ts");
  const landing = read("src/routes/solutions/index.tsx");
  const solutions = read("src/data/solutions.ts");
  const expected = [
    "/solutions/energy-monitoring",
    "/solutions/health-monitoring",
    "/solutions/ai-workload-management",
    "/solutions/cooling-optimization",
    "/solutions/capacity-planning",
    "/solutions/anomaly-detection",
    "/solutions/automated-alerts",
    "/solutions/configurator",
    "/solutions/architecture-explorer",
    "/solutions/energy-calculator",
    "/solutions/infrastructure-index",
  ];
  assert.equal(expected.filter((destination) => navigation.includes(`path: "${destination}"`)).length, 11);
  assert.match(landing, /const OFFERING_GROUPS/);
  for (const id of [
    "energy-monitoring",
    "health-monitoring",
    "ai-workload-management",
    "cooling-optimization",
    "capacity-planning",
    "anomaly-detection",
    "automated-alerts",
    "configurator",
    "architecture-explorer",
    "energy-calculator",
    "infrastructure-index",
  ]) {
    assert.match(landing, new RegExp(`"${id}"`));
  }
  for (const id of [
    "energy-monitoring",
    "health-monitoring",
    "ai-workload-management",
    "cooling-optimization",
    "capacity-planning",
    "anomaly-detection",
    "automated-alerts",
  ]) {
    assert.match(solutions, new RegExp(`"${id}": \\{`));
  }
  for (const route of [
    "src/routes/solutions/configurator.tsx",
    "src/routes/solutions/architecture-explorer.tsx",
    "src/routes/solutions/energy-calculator.tsx",
    "src/routes/solutions/infrastructure-index.tsx",
  ]) {
    assert.equal(fs.existsSync(path.join(root, route)), true, `Missing explicit route: ${route}`);
  }
});

test("priority regional dossiers carry evidence status and source boundaries", () => {
  const regions = read("src/data/regions.ts");
  for (const city of ["madurai", "coimbatore", "trichy"]) {
    const block = regions.slice(
      regions.indexOf(`${city}: {`),
      regions.indexOf(`${city}: {`) + 6000,
    );
    assert.match(block, /evidenceStatus: "Under Validation"/);
    assert.match(block, /referenceSource:/);
    assert.match(block, /referenceClaims:/);
  }
});

test("regional UI renders a concise planning status without source details", () => {
  const template = read("src/components/templates/RegionalPageTemplate.tsx");
  assert.match(template, /\{region\.evidenceStatus\}/);
  assert.doesNotMatch(template, /referenceSource|Source note|referenceClaims/);
  assert.match(template, /Relevant GreenNext offerings/);
});

test("regional portfolio contains all six source-referenced locations and separates site power from IT load", () => {
  const portfolio = read("src/data/regionalPortfolio.ts");
  const publicComponent = read("src/components/regional/RegionalPortfolio.tsx");
  for (const city of [
    "Coimbatore",
    "Hosur",
    "Madurai",
    "Tiruchirappalli",
    "Tirunelveli",
    "Puducherry",
  ]) {
    assert.match(portfolio, new RegExp(`name: "${city}`));
  }
  assert.match(portfolio, /sitePower: /);
  assert.match(portfolio, /itLoad: /);
  assert.match(portfolio, /Conflicting source-reported figures/);
  assert.match(portfolio, /Not specified in available source data/);
  assert.doesNotMatch(
    publicComponent,
    /selected\.sources|selected\.conflicts|Source trail|locationsData|locations\.html/,
  );
});
