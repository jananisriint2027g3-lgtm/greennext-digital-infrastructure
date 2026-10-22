import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function loadTsModule(relativePath) {
  let source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  source = source.replace(/import\s*\{[^}]*\}\s*from\s*["'][^"']+["'];?/g, "const SOUTH_INDIA_INFRASTRUCTURE_DATASET = [];");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const miningModule = await loadTsModule("../src/lib/web-mining.ts");
const datasetModule = await loadTsModule("../src/data/infrastructureMiningData.ts");

const {
  validateAndCleanRecord,
  checkRobotsCompliance,
  filterInfrastructureData,
  sortInfrastructureData,
  calculateAggregateSummary,
} = miningModule;

const { SOUTH_INDIA_INFRASTRUCTURE_DATASET } = datasetModule;

test("WebMining: Record Validation & Sanitization", () => {
  // Valid record
  const clean = validateAndCleanRecord({
    id: "test-node-1",
    name: "Test Solar Node",
    category: "renewable_grid",
    state: "Tamil Nadu",
    capacityMw: 150.555,
    pue: 1.254,
    cleanEnergySharePct: 95.8,
    carbonIntensityGco2: 50.1,
  });

  assert.ok(clean);
  assert.equal(clean.id, "test-node-1");
  assert.equal(clean.capacityMw, 150.6);
  assert.equal(clean.pue, 1.25);
  assert.equal(clean.cleanEnergySharePct, 96);

  // Missing or invalid ID
  assert.equal(validateAndCleanRecord({ name: "No ID" }), null);

  // Invalid negative capacity
  assert.equal(validateAndCleanRecord({ id: "x", name: "X", category: "datacenter", capacityMw: -5 }), null);

  // Out of bound PUE clamped or ignored
  const outOfBoundPue = validateAndCleanRecord({
    id: "y",
    name: "Y",
    category: "datacenter",
    capacityMw: 10,
    pue: 9.5, // impossible PUE
  });
  assert.equal(outOfBoundPue.pue, null);
});

test("WebMining: Robots.txt & Terms Compliance Checker", () => {
  const robotsSample = `
# Public Registry Robots Rules
User-agent: *
Crawl-delay: 10
Disallow: /admin/
Disallow: /internal/
Disallow: /private/api/
  `;

  // 1. Allowed path
  const allowed = checkRobotsCompliance("https://cea.nic.in/open-data/capacity.json", robotsSample);
  assert.equal(allowed.isAllowed, true);
  assert.equal(allowed.crawlDelaySeconds, 10);

  // 2. Disallowed path
  const disallowed = checkRobotsCompliance("https://cea.nic.in/internal/substation-telemetry", robotsSample);
  assert.equal(disallowed.isAllowed, false);
  assert.ok(disallowed.reason.includes("blocked by robots.txt"));

  // 3. No robots.txt content defaults safely to polite crawling
  const fallback = checkRobotsCompliance("https://kptcl.karnataka.gov.in/feeder-reports");
  assert.equal(fallback.isAllowed, true);
  assert.equal(fallback.crawlDelaySeconds, 5);
});

test("WebMining: Filtering, Searching & Missing Data Handling", () => {
  // 1. Filter by category
  const datacenters = filterInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, { category: "datacenter" });
  assert.ok(datacenters.length > 0);
  assert.ok(datacenters.every((d) => d.category === "datacenter"));

  // 2. Filter by state
  const tnNodes = filterInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, { state: "Tamil Nadu" });
  assert.ok(tnNodes.length > 0);
  assert.ok(tnNodes.every((d) => d.state === "Tamil Nadu"));

  // 3. Search query
  const searchResults = filterInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, { searchQuery: "Madurai" });
  assert.ok(searchResults.some((d) => d.name.includes("Madurai")));

  // 4. Missing data handling: grid substations have null PUE without crashing filters
  const solarParks = filterInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, { category: "renewable_grid" });
  assert.ok(solarParks.some((s) => s.pue === null));
});

test("WebMining: Sorting and Aggregate Analytics", () => {
  // 1. Sort by Capacity DESC
  const sortedByCap = sortInfrastructureData(SOUTH_INDIA_INFRASTRUCTURE_DATASET, "capacityMw", "desc");
  assert.ok(sortedByCap[0].capacityMw >= sortedByCap[1].capacityMw);

  // 2. Aggregate Summary
  const summary = calculateAggregateSummary(SOUTH_INDIA_INFRASTRUCTURE_DATASET);
  assert.ok(summary.totalTrackedCapacityMw > 0);
  assert.ok(summary.monitoredNodesCount > 0);
  assert.ok(summary.averageCleanEnergyPct > 0);
  assert.ok(summary.averagePue !== null && summary.averagePue >= 1.0 && summary.averagePue <= 2.0);
  assert.ok(summary.capacityWeightedPue !== null && summary.capacityWeightedPue >= 1.0 && summary.capacityWeightedPue <= 2.0);
  assert.ok(summary.statesCovered.includes("Tamil Nadu"));
  assert.ok(summary.statesCovered.includes("Karnataka"));
});
