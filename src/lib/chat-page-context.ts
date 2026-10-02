export type ChatPageKey =
  | "home"
  | "about"
  | "infrastructure"
  | "energy"
  | "automation"
  | "regions"
  | "solutions"
  | "sustainability"
  | "contact"
  | "general";

export interface ChatPageContext {
  key: ChatPageKey;
  topic: string;
  welcomeMessage: string;
  returningMessage: string;
  suggestedQuestions: string[];
  primaryHref: string;
}

const PAGE_CONTEXTS: Record<ChatPageKey, ChatPageContext> = {
  home: {
    key: "home",
    topic: "GreenNext overview and AI-ready data centers",
    welcomeMessage: "I can help you explore GreenNext's AI-ready data center capabilities.",
    returningMessage: "I can help you continue exploring GreenNext's AI-ready data center capabilities.",
    suggestedQuestions: [
      "What is GreenNext?",
      "How does GreenNext build AI-ready data centers?",
      "What capabilities does GreenNext provide?",
    ],
    primaryHref: "/",
  },
  about: {
    key: "about",
    topic: "GreenNext's company, mission, and capabilities",
    welcomeMessage: "I can help you understand GreenNext's mission, capabilities, and approach to AI-ready infrastructure.",
    returningMessage: "I can help you continue exploring GreenNext's mission and capabilities.",
    suggestedQuestions: [
      "What is GreenNext's mission?",
      "What capabilities does GreenNext provide?",
      "How does GreenNext approach AI-ready infrastructure?",
    ],
    primaryHref: "/about",
  },
  infrastructure: {
    key: "infrastructure",
    topic: "AI-ready data center infrastructure",
    welcomeMessage: "I can help you understand AI-ready infrastructure design, scalability, and workload requirements.",
    returningMessage: "I can help you continue exploring AI-ready infrastructure design and scalability.",
    suggestedQuestions: [
      "What makes infrastructure AI-ready?",
      "How does GreenNext design AI-ready infrastructure?",
      "How does GreenNext support scalable data center infrastructure?",
    ],
    primaryHref: "/infrastructure",
  },
  energy: {
    key: "energy",
    topic: "energy efficiency, cooling, power optimization, and sustainable energy",
    welcomeMessage: "I can help you understand energy efficiency, cooling optimization, and sustainable power strategies.",
    returningMessage: "I can help you continue exploring GreenNext's energy optimization and cooling capabilities.",
    suggestedQuestions: [
      "How does GreenNext improve energy efficiency?",
      "How does GreenNext optimize data center cooling?",
      "What energy metrics can be monitored?",
      "How can renewable energy support data center operations?",
    ],
    primaryHref: "/energy",
  },
  automation: {
    key: "automation",
    topic: "intelligent automation, monitoring, and predictive maintenance",
    welcomeMessage: "I can help you understand monitoring, intelligent automation, and predictive operations.",
    returningMessage: "I can help you continue exploring GreenNext's monitoring and predictive automation capabilities.",
    suggestedQuestions: [
      "How does GreenNext automate data center operations?",
      "What can intelligent monitoring detect?",
      "How can automation support predictive maintenance?",
      "How does GreenNext use automation to improve operations?",
    ],
    primaryHref: "/automation",
  },
  regions: {
    key: "regions",
    topic: "regional data center infrastructure and requirements",
    welcomeMessage: "I can help you understand regional infrastructure planning and data center requirements.",
    returningMessage: "I can help you continue exploring GreenNext's regional infrastructure planning.",
    suggestedQuestions: [
      "What regions does GreenNext support?",
      "What are the infrastructure considerations for different regions?",
      "How can data center planning vary by region?",
    ],
    primaryHref: "/regions",
  },
  solutions: {
    key: "solutions",
    topic: "GreenNext solutions and data center use cases",
    welcomeMessage: "I can help you connect GreenNext solutions to AI-ready data center challenges.",
    returningMessage: "I can help you continue exploring GreenNext solutions for data center challenges.",
    suggestedQuestions: [
      "What solutions does GreenNext provide?",
      "Which GreenNext solution fits AI-ready infrastructure?",
      "How do GreenNext solutions address data center challenges?",
    ],
    primaryHref: "/solutions",
  },
  sustainability: {
    key: "sustainability",
    topic: "sustainable data center operations",
    welcomeMessage: "I can help you understand energy efficiency, environmental impact, and sustainable data center operations.",
    returningMessage: "I can help you continue exploring GreenNext's sustainable data center operations.",
    suggestedQuestions: [
      "How does GreenNext improve data center sustainability?",
      "How can data centers reduce their environmental impact?",
      "How does energy efficiency support sustainability?",
      "What sustainable practices can GreenNext implement?",
    ],
    primaryHref: "/sustainability",
  },
  contact: {
    key: "contact",
    topic: "consultation, technical discussion, and partnership pathways",
    welcomeMessage: "I can help you find the right GreenNext contact pathway for a consultation, project, or partnership.",
    returningMessage: "I can help you continue toward a GreenNext consultation or technical discussion.",
    suggestedQuestions: [
      "How can I contact GreenNext?",
      "Can I request a technical consultation?",
      "How can I discuss a data center project?",
      "How can I collaborate with GreenNext?",
    ],
    primaryHref: "/contact",
  },
  general: {
    key: "general",
    topic: "GreenNext's digital infrastructure capabilities",
    welcomeMessage: "I can help you explore GreenNext's digital infrastructure capabilities.",
    returningMessage: "I can help you continue exploring GreenNext's digital infrastructure capabilities.",
    suggestedQuestions: [
      "What is GreenNext?",
      "How does GreenNext support AI-ready infrastructure?",
      "How can I contact GreenNext?",
    ],
    primaryHref: "/",
  },
};

function normalizePath(pathname: string): string {
  const path = pathname.trim().split("?")[0]?.split("#")[0] || "/";
  if (path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`.toLowerCase();
}

export function getChatPageContext(pathname: string): ChatPageContext {
  const path = normalizePath(pathname);
  if (path === "/") return PAGE_CONTEXTS.home;
  if (path === "/contact") return PAGE_CONTEXTS.contact;
  if (path === "/about" || path.startsWith("/about/")) return PAGE_CONTEXTS.about;
  if (path === "/infrastructure" || path.startsWith("/infrastructure/")) return PAGE_CONTEXTS.infrastructure;
  if (path === "/energy" || path.startsWith("/energy/")) return PAGE_CONTEXTS.energy;
  if (path === "/automation" || path.startsWith("/automation/")) return PAGE_CONTEXTS.automation;
  if (path === "/regions" || path.startsWith("/regions/")) return PAGE_CONTEXTS.regions;
  if (path === "/solutions" || path.startsWith("/solutions/")) return PAGE_CONTEXTS.solutions;
  if (path === "/sustainability" || path.startsWith("/sustainability/")) return PAGE_CONTEXTS.sustainability;
  return PAGE_CONTEXTS.general;
}

export function getPageTopic(pathname: string): string {
  return getChatPageContext(pathname).topic;
}

export function getPageSuggestedQuestions(pathname: string): string[] {
  return getChatPageContext(pathname).suggestedQuestions;
}

export function getPageWelcomeMessage(pathname: string): string {
  return getChatPageContext(pathname).welcomeMessage;
}
