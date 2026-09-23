import { REGIONS_DATA, REGIONAL_NETWORK_DISCLAIMER } from "../../data/regions";

export interface AssistantLink {
  label: string;
  href: string;
}

export interface AssistantResponse {
  text: string;
  links?: AssistantLink[];
}

const REGION_IDS = ["madurai", "coimbatore", "trichy", "mangalore"] as const;

function regionResponse(id: (typeof REGION_IDS)[number]): AssistantResponse {
  const region = REGIONS_DATA[id];

  return {
    text: `${region.name} (${region.code}) is one of GreenNext's conceptual regional focus locations.\n\n${region.intro}\n\n${region.networkRole}\n\n${REGIONAL_NETWORK_DISCLAIMER}`,
    links: [
      { label: `Explore ${region.name}`, href: `/regions/${region.id}` },
      { label: "Regional overview", href: "/regions/overview" },
    ],
  };
}

export function getAssistantResponse(message: string): AssistantResponse {
  const query = message.toLowerCase().trim();

  if (!query) {
    return {
      text: "Ask me about GreenNext, AI-ready infrastructure, regional focus locations, energy efficiency, automation, or contact information.",
    };
  }

  if (query.includes("madurai") || query.includes("mdu")) {
    return regionResponse("madurai");
  }

  if (query.includes("coimbatore") || query.includes("cjb")) {
    return regionResponse("coimbatore");
  }

  if (query.includes("trichy") || query.includes("tiruchirappalli") || query.includes("trz")) {
    return regionResponse("trichy");
  }

  if (query.includes("mangalore") || query.includes("mangaluru") || query.includes("ixe")) {
    return regionResponse("mangalore");
  }

  if (
    query.includes("region") ||
    query.includes("location") ||
    query.includes("south india") ||
    query.includes("focus area")
  ) {
    return {
      text: "GreenNext presents four conceptual regional infrastructure focus locations:\n\n• Madurai — MDU\n• Coimbatore — CJB\n• Trichy — TRZ\n• Mangalore — IXE\n\nThese locations represent GreenNext's planning focus areas, not claims of currently operating GreenNext facilities.",
      links: [{ label: "Explore the regions", href: "/regions/overview" }],
    };
  }

  if (
    query.includes("what is greennext") ||
    query === "greennext" ||
    query.includes("about greennext")
  ) {
    return {
      text: "GreenNext explores AI-driven digital infrastructure for the next generation of compute, connectivity, energy, monitoring, and automation. The website presents infrastructure concepts, solutions, and regional planning focus areas for AI-ready operations.",
      links: [{ label: "Explore infrastructure", href: "/infrastructure" }],
    };
  }

  if (
    query.includes("ai-ready") ||
    query.includes("ai ready") ||
    query.includes("ai infrastructure") ||
    query.includes("data center")
  ) {
    return {
      text: "AI-ready infrastructure brings compute, power, cooling, connectivity, observability, and operational automation into one planning conversation. GreenNext frames this as an integrated digital infrastructure challenge rather than a single hardware purchase.",
      links: [{ label: "Explore AI infrastructure", href: "/infrastructure/ai-ready" }],
    };
  }

  if (query.includes("energy") || query.includes("efficiency") || query.includes("cooling")) {
    return {
      text: "Energy efficiency is a core part of responsible digital infrastructure planning. GreenNext connects energy-aware operations with monitoring, optimization, cooling considerations, and a broader sustainability mindset.",
      links: [{ label: "Explore energy solutions", href: "/energy" }],
    };
  }

  if (
    query.includes("automation") ||
    query.includes("monitoring") ||
    query.includes("analytics") ||
    query.includes("intelligent")
  ) {
    return {
      text: "GreenNext's automation and infrastructure intelligence concepts focus on making operational signals easier to observe, interpret, and act on. Monitoring, analytics, alerts, and workflow automation help teams manage complex digital infrastructure more consistently.",
      links: [{ label: "Explore automation", href: "/automation" }],
    };
  }

  if (query.includes("cloud") || query.includes("edge")) {
    return {
      text: "Cloud and edge infrastructure are complementary ways to place and operate digital capacity. GreenNext explores how regional infrastructure, connectivity, and distributed compute can support services closer to the environments they serve.",
      links: [{ label: "Explore cloud solutions", href: "/solutions" }],
    };
  }

  if (query.includes("solution") || query.includes("service") || query.includes("offer")) {
    return {
      text: "GreenNext covers AI data centers, automation solutions, cloud solutions, edge computing, energy optimization, infrastructure analytics, and smart infrastructure concepts.",
      links: [{ label: "Explore solutions", href: "/solutions" }],
    };
  }

  if (
    query.includes("contact") ||
    query.includes("email") ||
    query.includes("inquiry") ||
    query.includes("get in touch")
  ) {
    return {
      text: "You can reach GreenNext through the Contact page or the site's inquiry flow. The published contact email is 953623104039@gmail.com.",
      links: [{ label: "Open Contact", href: "/contact" }],
    };
  }

  return {
    text: "I can help with GreenNext's infrastructure, regional focus areas, energy efficiency, automation, solutions, and contact information. Could you rephrase your question around one of these areas?",
  };
}
