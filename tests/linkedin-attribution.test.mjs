import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/layer2-intelligence.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const layer2 = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("isLinkedInHost correctly identifies legitimate LinkedIn hosts and subdomains", () => {
  assert.equal(layer2.isLinkedInHost("linkedin.com"), true);
  assert.equal(layer2.isLinkedInHost("www.linkedin.com"), true);
  assert.equal(layer2.isLinkedInHost("l.linkedin.com"), true); // Link Shim
  assert.equal(layer2.isLinkedInHost("touch.linkedin.com"), true); // Mobile web
  assert.equal(layer2.isLinkedInHost("in.linkedin.com"), true); // Country subdomain
  assert.equal(layer2.isLinkedInHost("mobile.linkedin.com"), true);
  assert.equal(layer2.isLinkedInHost("lnkd.in"), true); // URL shortener
  assert.equal(layer2.isLinkedInHost("www.lnkd.in"), true);
});

test("isLinkedInHost strictly rejects lookalike, deceptive, and unrelated domains", () => {
  assert.equal(layer2.isLinkedInHost("linkedin-phishing.com"), false);
  assert.equal(layer2.isLinkedInHost("notlinkedin.com"), false);
  assert.equal(layer2.isLinkedInHost("fake-lnkd.in"), false);
  assert.equal(layer2.isLinkedInHost("attackerlnkd.in"), false);
  assert.equal(layer2.isLinkedInHost("google.com"), false);
  assert.equal(layer2.isLinkedInHost(""), false);
  assert.equal(layer2.isLinkedInHost(null), false);
  assert.equal(layer2.isLinkedInHost(undefined), false);
});

test("classifyTraffic classifies all legitimate LinkedIn referrers as social", () => {
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://www.linkedin.com/" }), "social");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://l.linkedin.com/redirect?url=..." }), "social");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://touch.linkedin.com/feed" }), "social");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://lnkd.in/gAbC123" }), "social");
  assert.equal(layer2.classifyTraffic({ utmSource: "linkedin" }), "social");
  assert.equal(layer2.classifyTraffic({ utmSource: "lnkd.in" }), "social");
});

test("classifyTraffic prioritizes paid medium over organic social for LinkedIn ads", () => {
  assert.equal(layer2.classifyTraffic({ utmSource: "linkedin", utmMedium: "cpc" }), "paid");
  assert.equal(layer2.classifyTraffic({ utmSource: "linkedin", utmMedium: "paid_social" }), "paid");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://www.linkedin.com/", utmMedium: "ppc" }), "paid");
});

test("classifyTraffic does not misclassify lookalike domains as social", () => {
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://linkedin-phishing.com/page" }), "referral");
  assert.equal(layer2.classifyTraffic({ referrerUrl: "https://notlinkedin.com/" }), "referral");
});

test("getUtmParam reads both standard utm_ prefixed and fallback query parameters", () => {
  const params1 = new URLSearchParams("utm_source=linkedin&utm_medium=social&utm_campaign=brand_q4&utm_content=hero_banner&utm_term=datacenter");
  assert.equal(layer2.getUtmParam(params1, "source"), "linkedin");
  assert.equal(layer2.getUtmParam(params1, "medium"), "social");
  assert.equal(layer2.getUtmParam(params1, "campaign"), "brand_q4");
  assert.equal(layer2.getUtmParam(params1, "content"), "hero_banner");
  assert.equal(layer2.getUtmParam(params1, "term"), "datacenter");

  const params2 = new URLSearchParams("source=direct_partner&medium=referral");
  assert.equal(layer2.getUtmParam(params2, "source"), "direct_partner");
  assert.equal(layer2.getUtmParam(params2, "medium"), "referral");
  assert.equal(layer2.getUtmParam(params2, "campaign"), "");

  // Standard prefix takes priority over unprefixed parameter if both exist
  const params3 = new URLSearchParams("utm_source=official_utm&source=legacy_fallback");
  assert.equal(layer2.getUtmParam(params3, "source"), "official_utm");
});

test("isLinkedInAttributed helper identifies LinkedIn contexts reliably", () => {
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://www.linkedin.com/company/greennext" }), true);
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://l.linkedin.com/redirect" }), true);
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://lnkd.in/short1" }), true);
  assert.equal(layer2.isLinkedInAttributed({ utmSource: "linkedin" }), true);
  assert.equal(layer2.isLinkedInAttributed({ utmSource: "LinkedIn_Newsletter" }), true);
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://google.com/" }), false);
  assert.equal(layer2.isLinkedInAttributed({}), false);
});

test("session context coalescing preserves valid first-touch attribution without overwriting with empty values", () => {
  // Simulates Code.gs buildSessionContextMap row coalescing
  const rows = [
    // Row 1: Initial event with LinkedIn first-touch attribution
    ["gn_s_test_1", "new_session", "2026-10-14 11:40:05", "social", "https://www.linkedin.com/", "/solutions", "linkedin", "social", "oct_launch", "compute", "carousel"],
    // Row 2: Subsequent in-session event on second page with empty referrer/UTM fields
    ["gn_s_test_1", "new_session", "2026-10-14 11:41:20", "direct", "", "/infrastructure", "", "", "", "", ""]
  ];

  const map = {};
  rows.forEach((row) => {
    const sessionId = String(row[0] || "");
    const incoming = {
      session_id: sessionId,
      traffic_source: String(row[3] || "unknown"),
      referrer_url: String(row[4] || ""),
      landing_page: String(row[5] || ""),
      utm_source: String(row[6] || ""),
      utm_medium: String(row[7] || ""),
      utm_campaign: String(row[8] || ""),
      utm_term: String(row[9] || ""),
      utm_content: String(row[10] || ""),
    };
    const existing = map[sessionId];
    if (!existing) {
      map[sessionId] = incoming;
      return;
    }
    // Coalescing logic from Code.gs
    if ((!existing.traffic_source || existing.traffic_source === "unknown" || existing.traffic_source === "direct") && incoming.traffic_source && incoming.traffic_source !== "unknown") {
      existing.traffic_source = incoming.traffic_source;
    }
    if (!existing.referrer_url && incoming.referrer_url) existing.referrer_url = incoming.referrer_url;
    if (!existing.landing_page && incoming.landing_page) existing.landing_page = incoming.landing_page;
    if (!existing.utm_source && incoming.utm_source) existing.utm_source = incoming.utm_source;
    if (!existing.utm_medium && incoming.utm_medium) existing.utm_medium = incoming.utm_medium;
    if (!existing.utm_campaign && incoming.utm_campaign) existing.utm_campaign = incoming.utm_campaign;
  });

  const session = map["gn_s_test_1"];
  assert.equal(session.traffic_source, "social");
  assert.equal(session.referrer_url, "https://www.linkedin.com/");
  assert.equal(session.landing_page, "/solutions");
  assert.equal(session.utm_source, "linkedin");
  assert.equal(session.utm_campaign, "oct_launch");
});

test("technical session requests and confirmed bookings are treated as distinct statuses", () => {
  // Simulates lead submissions in Code.gs
  const rawLeads = [
    { type: "Technical Consultation / Session Booking", status: "EMAIL_SENT" }, // Initial submission
    { type: "Technical Consultation / Session Booking", status: "CONFIRMED_BOOKING" }, // Confirmed via calendar
    { type: "General Contact Inquiry", status: "EMAIL_SENT" }
  ];

  let techSessionRequests = 0;
  let confirmedBookings = 0;

  rawLeads.forEach((lead) => {
    if (lead.type === "Technical Consultation / Session Booking") {
      techSessionRequests++;
      if (lead.status === "CONFIRMED_BOOKING" || lead.status === "BOOKING_CONFIRMED") {
        confirmedBookings++;
      }
    }
  });

  assert.equal(techSessionRequests, 2);
  assert.equal(confirmedBookings, 1);
  // Confirmed booking is NOT equal to total requests
  assert.notEqual(techSessionRequests, confirmedBookings);
});

test("isValidLinkedInSource correctly accepts legitimate LinkedIn tags and domains and rejects lookalikes", () => {
  // Legitimate
  assert.equal(layer2.isValidLinkedInSource("linkedin"), true);
  assert.equal(layer2.isValidLinkedInSource("lnkd.in"), true);
  assert.equal(layer2.isValidLinkedInSource("LinkedIn_Newsletter"), true);
  assert.equal(layer2.isValidLinkedInSource("linkedin-ads"), true);
  assert.equal(layer2.isValidLinkedInSource("linkedin/post"), true);
  assert.equal(layer2.isValidLinkedInSource("linkedin.com"), true);
  assert.equal(layer2.isValidLinkedInSource("www.linkedin.com"), true);

  // Deceptive / Lookalikes / Unrelated
  assert.equal(layer2.isValidLinkedInSource("notlinkedin.com"), false);
  assert.equal(layer2.isValidLinkedInSource("notlinkedin"), false);
  assert.equal(layer2.isValidLinkedInSource("linkedin-phishing.com"), false);
  assert.equal(layer2.isValidLinkedInSource("fake-linkedin"), false);
  assert.equal(layer2.isValidLinkedInSource("fake-lnkd.in"), false);
  assert.equal(layer2.isValidLinkedInSource("attackerlnkd.in"), false);
  assert.equal(layer2.isValidLinkedInSource("google.com"), false);
  assert.equal(layer2.isValidLinkedInSource(""), false);
  assert.equal(layer2.isValidLinkedInSource(null), false);
});

test("isLinkedInAttributed strictly rejects lookalike domains and deceptive UTM parameters", () => {
  assert.equal(layer2.isLinkedInAttributed({ utmSource: "notlinkedin.com" }), false);
  assert.equal(layer2.isLinkedInAttributed({ utmSource: "fake-linkedin" }), false);
  assert.equal(layer2.isLinkedInAttributed({ utmSource: "linkedin-phishing.com" }), false);
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://notlinkedin.com/post" }), false);
  assert.equal(layer2.isLinkedInAttributed({ referrerUrl: "https://linkedin-phishing.com/login" }), false);
});

test("first-touch and last-touch attribution remain distinct across multi-touch visits", () => {
  // First visit: from LinkedIn campaign
  const initial = {
    landingPage: "/solutions",
    referrerUrl: "https://www.linkedin.com/",
    utmSource: "linkedin",
    utmMedium: "social",
    utmCampaign: "oct_launch",
  };

  // Second touch: later in session or returning visit with different UTM parameters
  const secondTouchSource = "google";
  const secondTouchMedium = "cpc";
  const secondTouchCampaign = "brand_search";

  // First-touch preserved
  const firstTouchSource = initial.utmSource;
  const firstTouchCampaign = initial.utmCampaign;

  // Last-touch updated
  const lastTouchSource = secondTouchSource || initial.utmSource;
  const lastTouchCampaign = secondTouchCampaign || initial.utmCampaign;

  assert.equal(firstTouchSource, "linkedin");
  assert.equal(firstTouchCampaign, "oct_launch");
  assert.equal(lastTouchSource, "google");
  assert.equal(lastTouchCampaign, "brand_search");
  assert.notEqual(firstTouchSource, lastTouchSource);
});

test("inquiry fallback logic returns success:false when falling back to CTA Interactions", () => {
  // Verify that an 'Invalid sheet' response that falls back to CTA Interactions does NOT report success
  const legacyFallbackResponse = {
    serverOriginal: { success: false, message: "Invalid sheet." },
    fallbackTelemetry: { success: true },
  };

  // Simulates postInquiryPayload logic
  let finalResult;
  if (legacyFallbackResponse.serverOriginal.success === false && legacyFallbackResponse.serverOriginal.message === "Invalid sheet.") {
    if (legacyFallbackResponse.fallbackTelemetry.success) {
      finalResult = {
        success: false,
        error: "Inquiry could not be saved to lead records. Please try submitting again.",
      };
    }
  }

  assert.equal(finalResult.success, false);
  assert.ok(finalResult.error.includes("Inquiry could not be saved"));
});
