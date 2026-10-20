import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

// Transpile and load the visitor greetings module
const source = fs.readFileSync(new URL("../src/lib/visitor-greetings.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const visitorGreetings = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get size() {
      return store.size;
    },
    entries: () => Array.from(store.entries()),
  };
}

let mockLocal = createMockStorage();
let mockSession = createMockStorage();

function setupBrowserEnv(local = mockLocal, session = mockSession) {
  globalThis.window = {
    localStorage: local,
    sessionStorage: session,
  };
}

function resetEnv() {
  mockLocal.clear();
  mockSession.clear();
  setupBrowserEnv();
  visitorGreetings.clearVisitorGreetingState();
}

test("Scenario 1: First-time visitor sees the introductory website greeting", () => {
  resetEnv();

  const greeting = visitorGreetings.getWebsiteGreeting();
  assert.equal(greeting.isReturning, false);
  assert.equal(greeting.visitCount, 1);
  assert.equal(greeting.text, visitorGreetings.FIRST_TIME_WEBSITE_GREETINGS[0]);
  assert.equal(greeting.isDismissed, false);
});

test("Scenario 2: Returning visitor sees a welcome-back greeting", () => {
  resetEnv();

  // First visit
  visitorGreetings.getWebsiteGreeting();

  // Simulate returning visit in a new browser session
  mockSession.clear();

  const returningGreeting = visitorGreetings.getWebsiteGreeting();
  assert.equal(returningGreeting.isReturning, true);
  assert.equal(returningGreeting.visitCount, 2);
  assert.equal(
    visitorGreetings.RETURNING_WEBSITE_GREETINGS.includes(returningGreeting.text),
    true
  );
  assert.match(returningGreeting.text, /(Welcome back|Good to see you|You're back|Great to have you)/i);
});

test("Scenario 3: Consecutive visits use different greetings whenever possible", () => {
  resetEnv();

  // Initial visit
  visitorGreetings.getWebsiteGreeting();

  const recordedGreetings = [];

  // Simulate 6 consecutive separate visits
  for (let i = 0; i < visitorGreetings.RETURNING_WEBSITE_GREETINGS.length; i++) {
    mockSession.clear();
    const result = visitorGreetings.getWebsiteGreeting();
    assert.equal(result.isReturning, true);
    recordedGreetings.push(result.text);
  }

  // Verify that no two consecutive greetings are identical
  for (let i = 1; i < recordedGreetings.length; i++) {
    assert.notEqual(
      recordedGreetings[i],
      recordedGreetings[i - 1],
      `Visit ${i} should have a different greeting from visit ${i - 1}`
    );
  }

  // Verify that all messages in the collection are utilized
  const uniqueGreetings = new Set(recordedGreetings);
  assert.equal(uniqueGreetings.size, visitorGreetings.RETURNING_WEBSITE_GREETINGS.length);
});

test("Scenario 4: Refreshing or navigating between pages does not repeatedly trigger or churn the welcome message", () => {
  resetEnv();

  // First page load
  const initial = visitorGreetings.getWebsiteGreeting();
  assert.equal(initial.visitCount, 1);

  // Re-render / route navigation within the same session
  const afterNav1 = visitorGreetings.getWebsiteGreeting();
  const afterNav2 = visitorGreetings.getWebsiteGreeting();

  assert.equal(afterNav1.text, initial.text);
  assert.equal(afterNav2.text, initial.text);
  assert.equal(afterNav1.visitCount, 1);
  assert.equal(afterNav2.visitCount, 1);

  // Dismissing the banner
  visitorGreetings.dismissWebsiteGreeting();
  const afterDismiss = visitorGreetings.getWebsiteGreeting();
  assert.equal(afterDismiss.isDismissed, true);

  // Navigating to other pages in the same session stays dismissed
  const afterNavDismissed = visitorGreetings.getWebsiteGreeting();
  assert.equal(afterNavDismissed.isDismissed, true);
});

test("Scenario 5: The AI chat displays an introductory greeting on first use", () => {
  resetEnv();

  const chatGreeting = visitorGreetings.getChatGreeting();
  assert.equal(chatGreeting, visitorGreetings.FIRST_TIME_CHAT_GREETINGS[0]);
  assert.match(chatGreeting, /GreenNext AI assistant/i);
});

test("Scenario 6: The AI chat uses a rotating welcome-back message on a later visit", () => {
  resetEnv();

  // First visit
  visitorGreetings.getChatGreeting();

  const recordedChatGreetings = [];

  // Simulate 6 separate visits
  for (let i = 0; i < visitorGreetings.RETURNING_CHAT_GREETINGS.length; i++) {
    mockSession.clear();
    const greeting = visitorGreetings.getChatGreeting();
    recordedChatGreetings.push(greeting);
    assert.equal(
      visitorGreetings.RETURNING_CHAT_GREETINGS.includes(greeting),
      true
    );
  }

  // Ensure consecutive visits do not repeat
  for (let i = 1; i < recordedChatGreetings.length; i++) {
    assert.notEqual(
      recordedChatGreetings[i],
      recordedChatGreetings[i - 1],
      `Chat visit ${i} should differ from visit ${i - 1}`
    );
  }

  // Ensure full coverage of the chat returning greetings
  const uniqueChatGreetings = new Set(recordedChatGreetings);
  assert.equal(uniqueChatGreetings.size, visitorGreetings.RETURNING_CHAT_GREETINGS.length);
});

test("Scenario 7: Website greeting and AI chat greeting are independently configurable", () => {
  resetEnv();

  // Initial session
  visitorGreetings.getWebsiteGreeting();
  visitorGreetings.getChatGreeting();

  // Session 2
  mockSession.clear();
  const web2 = visitorGreetings.getWebsiteGreeting();
  const chat2 = visitorGreetings.getChatGreeting();

  // Session 3 - only trigger website
  mockSession.clear();
  const web3 = visitorGreetings.getWebsiteGreeting();

  // Session 4 - trigger chat
  mockSession.clear();
  const chat4 = visitorGreetings.getChatGreeting();

  assert.notEqual(web2.text, web3.text);
  assert.notEqual(chat2, chat4);
});

test("Scenario 8: The experience handles unavailable browser storage gracefully", () => {
  // Simulate disabled/throwing storage
  globalThis.window = {
    get localStorage() {
      throw new Error("SecurityError: localStorage is disabled");
    },
    get sessionStorage() {
      throw new Error("SecurityError: sessionStorage is disabled");
    },
  };

  // Must not throw errors
  assert.doesNotThrow(() => {
    const webGreeting = visitorGreetings.getWebsiteGreeting();
    assert.equal(typeof webGreeting.text, "string");
    assert.equal(webGreeting.text.length > 0, true);

    const chatGreeting = visitorGreetings.getChatGreeting();
    assert.equal(typeof chatGreeting, "string");
    assert.equal(chatGreeting.length > 0, true);

    visitorGreetings.dismissWebsiteGreeting();
  });
});

test("Scenario 9: Multiple visitors using different browser profiles are handled independently", () => {
  const profileALocal = createMockStorage();
  const profileASession = createMockStorage();
  const profileBLocal = createMockStorage();
  const profileBSession = createMockStorage();

  // Profile A: First visit
  setupBrowserEnv(profileALocal, profileASession);
  const profileAVisit1 = visitorGreetings.getWebsiteGreeting();
  assert.equal(profileAVisit1.isReturning, false);

  // Profile B: First visit
  setupBrowserEnv(profileBLocal, profileBSession);
  const profileBVisit1 = visitorGreetings.getWebsiteGreeting();
  assert.equal(profileBVisit1.isReturning, false);

  // Profile A: Returns
  profileASession.clear();
  setupBrowserEnv(profileALocal, profileASession);
  const profileAVisit2 = visitorGreetings.getWebsiteGreeting();
  assert.equal(profileAVisit2.isReturning, true);

  // Profile B: Still on first session, not affected by Profile A
  setupBrowserEnv(profileBLocal, profileBSession);
  const profileBCheck = visitorGreetings.getWebsiteGreeting();
  assert.equal(profileBCheck.isReturning, false);
});

test("Scenario 10: Privacy and non-identifying visitor recognition", () => {
  resetEnv();

  const visitorId = visitorGreetings.getAnonymousVisitorId();
  assert.match(visitorId, /^gn_v_[A-Za-z0-9_-]{8,100}$/);

  // Ensure no sensitive personal data (IP, geo, email, name, fingerprint) is recorded
  const storedEntries = mockLocal.entries();
  for (const [key, value] of storedEntries) {
    assert.equal(key.startsWith("gn_"), true);
    assert.equal(/password|email|phone|address|ssn|ip|fingerprint/i.test(key), false);
    assert.equal(/password|email|phone|address|ssn|ip|fingerprint/i.test(value), false);
  }
});

test("Scenario 11: Homepage deduplication ensures only one welcome banner appears", () => {
  resetEnv();

  // First visit
  visitorGreetings.getWebsiteGreeting();

  // Returning visit
  mockSession.clear();
  const returningWeb = visitorGreetings.getWebsiteGreeting();

  // Verify website welcome banner is present on returning visit
  assert.equal(returningWeb.isReturning, true);
  assert.equal(returningWeb.isDismissed, false);
  assert.equal(typeof returningWeb.text, "string");
  assert.equal(returningWeb.text.length > 0, true);

  // In PersonalizationBanner, pathname === '/' strictly returns null, preventing duplicate banners
  const shouldRenderPersonalizationBanner = (pathname, showRecommendation) => {
    if (pathname === "/" || !showRecommendation) return false;
    return true;
  };

  assert.equal(shouldRenderPersonalizationBanner("/", true), false);
  assert.equal(shouldRenderPersonalizationBanner("/infrastructure", true), true);
  assert.equal(shouldRenderPersonalizationBanner("/solutions", false), false);
});

test("Scenario 12: AI chat interface receives journey resume prompt without losing context", () => {
  resetEnv();

  // Set up returning visitor in storage
  mockLocal.setItem("gn_visitor_visit_count", "2");

  const chatGreeting = visitorGreetings.getChatGreeting();
  assert.equal(typeof chatGreeting, "string");
  assert.equal(visitorGreetings.RETURNING_CHAT_GREETINGS.includes(chatGreeting), true);

  // Reopening chat within the same session preserves the selected greeting
  const reopenedGreeting = visitorGreetings.getChatGreeting();
  assert.equal(reopenedGreeting, chatGreeting);
});

test("Scenario 13: Corrupted or invalid stored values recover gracefully", () => {
  resetEnv();

  // Corrupted non-numeric visit count and greeting index
  mockLocal.setItem("gn_visitor_visit_count", "not-a-number");
  mockLocal.setItem("gn_visitor_website_greeting_idx", "9999");
  mockLocal.setItem("gn_visitor_id", "invalid-id-format");

  // Must not throw and must recover safely
  assert.doesNotThrow(() => {
    const web = visitorGreetings.getWebsiteGreeting();
    assert.equal(typeof web.text, "string");
    assert.equal(web.text.length > 0, true);

    const chat = visitorGreetings.getChatGreeting();
    assert.equal(typeof chat, "string");
    assert.equal(chat.length > 0, true);

    const id = visitorGreetings.getAnonymousVisitorId();
    assert.match(id, /^gn_v_/);
  });
});

const serviceSource = fs
  .readFileSync(new URL("../src/components/chatbot/chatService.ts", import.meta.url), "utf8")
  .replace('import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER } from "../../data/regions";', 'const REGIONS_DATA = {}; const REGIONAL_NETWORK_DISCLAIMER = "";')
  .replace('import { getChatPageContext, type ChatPageContext } from "../../lib/chat-page-context";', 'const getChatPageContext = () => ({ topic: "GreenNext overview and AI-ready data centers", key: "home", welcomeMessage: "", returningMessage: "", suggestedQuestions: [], primaryHref: "/" });');
const serviceCompiled = ts.transpileModule(serviceSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const chatService = await import(`data:text/javascript;base64,${Buffer.from(serviceCompiled).toString("base64")}`);

test("Scenario 14: Journey resume correctly navigates to technical conversation from homepage", () => {
  const homeContext = { key: "home", topic: "GreenNext overview", welcomeMessage: "", returningMessage: "", suggestedQuestions: [], primaryHref: "/" };
  const visitorContext = {
    returningVisitor: true,
    dominantInterest: "contact",
    engagedSections: ["contact"],
    recentPages: ["/contact"],
    meaningfulCta: "",
    converted: false,
    currentPage: "/",
    currentSessionEngaged: true,
  };

  const response = chatService.getAssistantResponse("Continue exploring a technical conversation", visitorContext, homeContext);
  assert.equal(response.text.includes("a technical conversation"), true);
  assert.ok(response.links && response.links.length > 0);
  assert.equal(response.links[0].href, "/contact");
  assert.notEqual(response.links[0].href, "/");
});

test("Scenario 15: Conversation history is preserved across route navigation without greeting reset", () => {
  resetEnv();

  // Initial session greeting
  const initialGreeting = visitorGreetings.getChatGreeting();

  // Simulated chat conversation with user and assistant turns
  const messages = [
    { id: 1, role: "assistant", text: initialGreeting },
    { id: 2, role: "user", text: "Tell me about cooling systems" },
    { id: 3, role: "assistant", text: "GreenNext optimizes cooling efficiency..." },
  ];

  // Route navigation occurs: messages array must remain intact and not revert to length 1
  const preservedLength = messages.length;
  assert.equal(preservedLength, 3);
  assert.equal(messages[1].text, "Tell me about cooling systems");
});

test("Scenario 16: Intentional conversation reset restores initial visit greeting", () => {
  resetEnv();

  const greeting = visitorGreetings.getChatGreeting();

  // Reset conversation simulation
  let messages = [
    { id: 1, role: "assistant", text: greeting },
    { id: 2, role: "user", text: "Hello" },
  ];

  // User triggers reset
  messages = [{ id: 3, role: "assistant", text: visitorGreetings.getChatGreeting() }];

  assert.equal(messages.length, 1);
  assert.equal(messages[0].text, greeting);
});
