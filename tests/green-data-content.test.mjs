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
