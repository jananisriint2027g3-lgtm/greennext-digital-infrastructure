import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

test("ICP Navigation Structure: Top-level category and 4 segment items", () => {
  const navFile = fs.readFileSync(path.join(rootDir, "src/data/navigation.ts"), "utf8");

  // Verify category exists
  assert.ok(navFile.includes('id: "icp"'), "Navigation must include 'icp' category id");
  assert.ok(navFile.includes('path: "/icp"'), "Navigation must link to '/icp'");
  assert.ok(navFile.includes('label: "Industries"'), "Navigation must have label 'Industries'");

  // Verify all 4 segment items
  const expectedItems = [
    { id: "data-center-operators", path: "/icp/data-center-operators" },
    { id: "ai-hyperscale", path: "/icp/ai-hyperscale" },
    { id: "enterprise-edge", path: "/icp/enterprise-edge" },
    { id: "sustainability-energy", path: "/icp/sustainability-energy" },
  ];

  for (const item of expectedItems) {
    assert.ok(navFile.includes(`id: "${item.id}"`), `Navigation must include item ${item.id}`);
    assert.ok(navFile.includes(`path: "${item.path}"`), `Navigation must link to ${item.path}`);
  }
});

test("ICP Route Files: Route handlers exist for /icp and /icp/$slug", () => {
  const indexPath = path.join(rootDir, "src/routes/icp/index.tsx");
  const slugPath = path.join(rootDir, "src/routes/icp/$slug.tsx");

  assert.ok(fs.existsSync(indexPath), "src/routes/icp/index.tsx must exist");
  assert.ok(fs.existsSync(slugPath), "src/routes/icp/$slug.tsx must exist");

  const indexContent = fs.readFileSync(indexPath, "utf8");
  const slugContent = fs.readFileSync(slugPath, "utf8");

  assert.ok(indexContent.includes('createFileRoute("/icp/")'), "Index must define /icp/ route");
  assert.ok(
    indexContent.includes("CustomerFitFramework"),
    "Index must render CustomerFitFramework",
  );
  assert.ok(
    slugContent.includes('createFileRoute("/icp/$slug")'),
    "Slug route must define /icp/$slug route",
  );
});

test("ICP Content Registry: All 5 pages registered in PAGES_CONTENT", () => {
  const pagesFile = fs.readFileSync(path.join(rootDir, "src/data/pagesContent.ts"), "utf8");

  const expectedKeys = [
    "icp",
    "icp/data-center-operators",
    "icp/ai-hyperscale",
    "icp/enterprise-edge",
    "icp/sustainability-energy",
  ];

  for (const key of expectedKeys) {
    assert.ok(
      pagesFile.includes(`"${key}":`) || pagesFile.includes(`${key}:`),
      `PAGES_CONTENT must include entry for '${key}'`,
    );
  }

  // Verify qualification framework and stakeholder coverage in /icp
  assert.ok(pagesFile.includes("Who GreenNext Serves"), "Overview must cover Who GreenNext Serves");
  assert.ok(
    pagesFile.includes("Customer Qualification Framework"),
    "Overview must cover Qualification Framework",
  );
  assert.ok(
    pagesFile.includes("Core Pain Points and Buying Triggers"),
    "Overview must cover Pain Points and Buying Triggers",
  );
  assert.ok(
    pagesFile.includes("Decision-Makers and Stakeholder Alignment"),
    "Overview must cover Decision-Makers",
  );
  assert.ok(
    pagesFile.includes("Qualification & Discovery Questions"),
    "Overview must cover Discovery Questions",
  );

  // Verify internal link integrity in overview
  assert.ok(
    pagesFile.includes("/solutions/energy-calculator"),
    "Must link to Energy Impact Calculator",
  );
  assert.ok(
    pagesFile.includes("/infrastructure/facility-engineering"),
    "Must link to Facility Engineering",
  );
  assert.ok(pagesFile.includes("/energy/cooling"), "Must link to Cooling Efficiency");
  assert.ok(pagesFile.includes("/automation/operations"), "Must link to Operations & Maintenance");
  assert.ok(pagesFile.includes("/contact"), "Must link to Contact");
});

test("ICP Footer Integration: Footer renders ICP links", () => {
  const footerFile = fs.readFileSync(
    path.join(rootDir, "src/components/layout/SiteFooter.tsx"),
    "utf8",
  );

  assert.ok(footerFile.includes('to="/icp"'), "Footer must link to /icp");
  assert.ok(
    footerFile.includes('to="/icp/data-center-operators"'),
    "Footer must link to /icp/data-center-operators",
  );
  assert.ok(
    footerFile.includes('to="/icp/ai-hyperscale"'),
    "Footer must link to /icp/ai-hyperscale",
  );
  assert.ok(
    footerFile.includes('to="/icp/enterprise-edge"'),
    "Footer must link to /icp/enterprise-edge",
  );
  assert.ok(
    footerFile.includes('to="/icp/sustainability-energy"'),
    "Footer must link to /icp/sustainability-energy",
  );
});

test("Customer Fit Framework: Qualitative tiers without fabricated numerical thresholds", () => {
  const frameworkFile = fs.readFileSync(
    path.join(rootDir, "src/components/icp/CustomerFitFramework.tsx"),
    "utf8",
  );

  assert.ok(frameworkFile.includes("Tier 1 • Strong Fit"), "Must include Tier 1 Strong Fit");
  assert.ok(
    frameworkFile.includes("Tier 2 • Discovery Required"),
    "Must include Tier 2 Discovery Required",
  );
  assert.ok(
    frameworkFile.includes("Tier 3 • Lower Current Fit"),
    "Must include Tier 3 Lower Current Fit",
  );
  assert.ok(
    frameworkFile.includes("arbitrary corporate revenue thresholds"),
    "Must explicitly disclaim arbitrary revenue thresholds",
  );
  assert.ok(
    frameworkFile.includes("Qualify Your Infrastructure Fit"),
    "Must have interactive qualification tool",
  );
  assert.ok(
    frameworkFile.includes("Stakeholder Priorities & Engagement Value"),
    "Must have stakeholder alignment matrix",
  );
});
