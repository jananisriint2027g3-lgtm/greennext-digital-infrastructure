import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const contextSource = fs.readFileSync(new URL("../src/lib/chat-page-context.ts", import.meta.url), "utf8");
const contextCompiled = ts.transpileModule(contextSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const pageContext = await import(`data:text/javascript;base64,${Buffer.from(contextCompiled).toString("base64")}`);

test("resolves the configured page domains", () => {
  assert.equal(pageContext.getChatPageContext("/").key, "home");
  assert.equal(pageContext.getChatPageContext("/energy/monitoring").key, "energy");
  assert.equal(pageContext.getChatPageContext("/infrastructure/ai-ready").key, "infrastructure");
  assert.equal(pageContext.getChatPageContext("/automation/monitoring").key, "automation");
  assert.equal(pageContext.getChatPageContext("/regions/overview").key, "regions");
  assert.equal(pageContext.getChatPageContext("/sustainability/carbon").key, "sustainability");
});

test("energy suggestions remain specific to energy and cooling", () => {
  const context = pageContext.getChatPageContext("/energy");
  assert.equal(context.suggestedQuestions.some((question) => question.toLowerCase().includes("automation")), false);
  assert.equal(context.suggestedQuestions.some((question) => question.toLowerCase().includes("region")), false);
  assert.equal(context.suggestedQuestions.some((question) => question.toLowerCase().includes("cooling")), true);
});

test("unknown routes use a safe general fallback", () => {
  const context = pageContext.getChatPageContext("/not-a-real-page");
  assert.equal(context.key, "general");
  assert.equal(context.suggestedQuestions.length > 0, true);
  assert.equal(context.primaryHref, "/");
});

const serviceSource = fs.readFileSync(new URL("../src/components/chatbot/chatService.ts", import.meta.url), "utf8")
  .replace('import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER } from "../../data/regions";', 'const REGIONS_DATA = {}; const REGIONAL_NETWORK_DISCLAIMER = "";')
  .replace('import { getChatPageContext, type ChatPageContext } from "../../lib/chat-page-context";', 'const getChatPageContext = () => ({ topic: "GreenNext", key: "general", welcomeMessage: "", returningMessage: "", suggestedQuestions: [], primaryHref: "/" });');
const serviceCompiled = ts.transpileModule(serviceSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const chatService = await import(`data:text/javascript;base64,${Buffer.from(serviceCompiled).toString("base64")}`);

test("returning behavior is combined with the current page context", () => {
  const energy = pageContext.getChatPageContext("/energy");
  const opening = chatService.getAssistantOpening({
    returningVisitor: true,
    dominantInterest: "energy",
    engagedSections: ["energy"],
    recentPages: ["/energy"],
    meaningfulCta: "",
    converted: false,
    currentPage: "/energy",
    currentSessionEngaged: true,
  }, energy);
  assert.equal(opening.includes("Welcome back"), true);
  assert.equal(opening.toLowerCase().includes("energy"), true);
  assert.equal(opening.toLowerCase().includes("cooling"), true);
});
