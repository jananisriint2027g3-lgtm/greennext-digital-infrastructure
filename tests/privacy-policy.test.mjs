import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Privacy Policy: Route file exists and is registered correctly", () => {
  const routePath = path.join(rootDir, "src", "routes", "privacy-policy.tsx");
  assert.ok(fs.existsSync(routePath), "src/routes/privacy-policy.tsx must exist");

  const routeContent = fs.readFileSync(routePath, "utf-8");
  assert.match(
    routeContent,
    /createFileRoute\(["']\/privacy-policy["']\)/,
    "Must register createFileRoute for /privacy-policy"
  );
  assert.match(
    routeContent,
    /Privacy Policy \| GreenNext Digital Infrastructure/,
    "Must specify correct page title"
  );
});

test("Privacy Policy: Public privacy contact uses the supplied TRUSTGRID compliance email", () => {
  const routePath = path.join(rootDir, "src", "routes", "privacy-policy.tsx");
  const routeContent = fs.readFileSync(routePath, "utf-8");

  const expectedEmail = "compliance@trustgrid.ai";
  assert.ok(
    routeContent.includes(expectedEmail),
    `Must include the public privacy contact email (${expectedEmail})`
  );
  assert.doesNotMatch(
    routeContent,
    /jananisri\.int2027g3@gmail\.com/,
    "Must not expose the report-notification address as the public privacy contact"
  );
  assert.ok(
    routeContent.includes("https://greennext-ai.vercel.app"),
    "Must reference the official GreenNext production URL"
  );
});

test("Privacy Policy: Core sections adapted from TRUSTGRID reference are present", () => {
  const routePath = path.join(rootDir, "src", "routes", "privacy-policy.tsx");
  const content = fs.readFileSync(routePath, "utf-8");

  // Verify adapted sections
  assert.match(content, /Data Controller & Scope/i, "Must have Data Controller section");
  assert.match(content, /Categories of Personal Data/i, "Must cover data categories");
  assert.match(content, /Purposes of Processing/i, "Must cover processing purposes");
  assert.match(content, /Email Communications & Automated Reporting/i, "Must cover email workflow");
  assert.match(content, /Information Disclosure & Service Providers/i, "Must cover service providers");
  assert.match(content, /Data Security/i, "Must cover data security");
  assert.match(content, /Data Retention/i, "Must cover retention");
  assert.match(content, /Data Principal Rights/i, "Must cover DPDP Act rights");
  assert.match(content, /Cookies, Diagnostics & Analytics/i, "Must cover analytics & cookies");
  assert.match(content, /Third-Party Links/i, "Must cover third-party integrations");
  assert.match(content, /Children/i, "Must cover children's privacy");
  assert.match(content, /Breach/i, "Must cover breach notification");
  assert.match(content, /Limitations of Liability/i, "Must include disclaimers and limitations");
  assert.match(content, /Digital Personal Data Protection Act, 2023/i, "Must align with DPDP Act 2023");
});

test("Privacy Policy: Footer contains functional link to /privacy-policy", () => {
  const footerPath = path.join(rootDir, "src", "components", "layout", "SiteFooter.tsx");
  assert.ok(fs.existsSync(footerPath), "SiteFooter.tsx must exist");

  const footerContent = fs.readFileSync(footerPath, "utf-8");
  assert.match(
    footerContent,
    /to=["']\/privacy-policy["']/,
    "SiteFooter must include link to /privacy-policy"
  );
  assert.match(
    footerContent,
    /value:\s*["']\/privacy-policy["']/,
    "SiteFooter link must include analytics tracking for /privacy-policy"
  );
});

test("Privacy Policy: TanStack route tree includes /privacy-policy", () => {
  const treePath = path.join(rootDir, "src", "routeTree.gen.ts");
  assert.ok(fs.existsSync(treePath), "routeTree.gen.ts must exist");

  const treeContent = fs.readFileSync(treePath, "utf-8");
  assert.match(
    treeContent,
    /['"]\/privacy-policy['"]/,
    "routeTree.gen.ts must contain /privacy-policy route"
  );
});
