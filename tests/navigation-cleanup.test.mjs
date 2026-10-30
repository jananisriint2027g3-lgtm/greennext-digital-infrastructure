import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

test("main navigation keeps the requested seven-item order", () => {
  const navFile = fs.readFileSync(path.join(rootDir, "src/data/navigation.ts"), "utf8");
  const publicNavigation = navFile.slice(navFile.indexOf("export const NAVIGATION_STRUCTURE"));

  const entries = [
    'id: "home"',
    'navigationById("infrastructure")',
    'navigationById("energy")',
    'navigationById("automation")',
    'navigationById("solutions")',
    'id: "industries"',
    'id: "sustainability"',
    'id: "region"',
    'navigationById("about")',
  ];
  const positions = entries.map((entry) => publicNavigation.indexOf(entry));

  assert.ok(
    positions.every((position) => position >= 0),
    "All seven navigation entries must exist",
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
    "Navigation entries must remain ordered",
  );
  assert.equal(publicNavigation.includes('label: "Cyber Security"'), false);
  assert.equal(publicNavigation.includes('label: "Contact"'), false);
});

test("restores the approved Energy and Automation submenu definitions", () => {
  const navFile = fs.readFileSync(path.join(rootDir, "src/data/navigation.ts"), "utf8");
  const catalog = navFile.slice(0, navFile.indexOf("const navigationById"));

  const energyBlock = catalog.slice(catalog.indexOf('id: "energy"'), catalog.indexOf('id: "automation"'));
  assert.deepEqual(
    [...energyBlock.matchAll(/label: "([^"]+)"/g)].map((match) => match[1]),
    [
      "Energy",
      "Overview",
      "Power Monitoring",
      "Cooling Efficiency",
      "Workload-Aware Resources",
      "Energy Analytics",
      "Operational Optimization",
    ],
  );

  for (const entry of [
    ['label: "Overview"', "/energy"],
    ['label: "Energy"', "/energy"],
    ['label: "Automation"', "/automation"],
    ['label: "Power Monitoring"', "/energy/monitoring"],
    ['label: "Cooling Efficiency"', "/energy/cooling"],
    ['label: "Workload-Aware Resources"', "/energy/workload-aware"],
    ['label: "Energy Analytics"', "/energy/analytics"],
    ['label: "Operational Optimization"', "/energy/optimization"],
    ['label: "Intelligent Monitoring"', "/automation/monitoring"],
    ['label: "Anomaly Detection"', "/automation/anomaly"],
    ['label: "Automated Alerts"', "/automation/alerts"],
    ['label: "Capacity Management"', "/automation/capacity"],
    ['label: "Operational Reporting"', "/automation/reporting"],
    ['label: "Operations & Maintenance"', "/automation/operations"],
  ]) {
    assert.ok(catalog.includes(entry[0]) && catalog.includes(`path: "${entry[1]}"`));
  }
});
test("header keeps Connect but no longer renders WhatsApp navigation actions", () => {
  const headerFile = fs.readFileSync(
    path.join(rootDir, "src/components/layout/SiteHeader.tsx"),
    "utf8",
  );

  assert.ok(headerFile.includes('value: "Header Connect Button -> /contact"'));
  assert.equal(headerFile.includes("WHATSAPP_CONFIG"), false);
  assert.equal(headerFile.includes("WhatsApp Inquiry"), false);
  assert.equal(headerFile.includes("Discuss on WhatsApp"), false);
});
