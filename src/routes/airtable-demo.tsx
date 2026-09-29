import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  getCurrentPage,
  getSessionId,
  getSessionKind,
  trackEvent,
} from "../lib/analytics";
import { submitAirtableBehaviorEvent } from "../lib/airtable-behavior-poc.server-fn";

const BEHAVIOR_EVENTS = [
  { event: "page_view", value: "airtable-demo" },
  { event: "scroll_50", value: "50%" },
  { event: "cta_block_click", value: "Airtable behaviour POC" },
] as const;

export const Route = createFileRoute("/airtable-demo")({
  head: () => ({
    meta: [{ title: "Airtable Behaviour Demo | GreenNext" }],
  }),
  component: AirtableDemoPage,
});

function AirtableDemoPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");

  const sendBehaviorEvent = async (event: (typeof BEHAVIOR_EVENTS)[number]) => {
    setStatus("loading");

    const page = getCurrentPage();
    const sessionId = getSessionId();
    const sessionKind = getSessionKind();

    // Keep the existing Google Sheets analytics event active for this demo event.
    trackEvent({ tab: "CTA Interactions", event: event.event, value: event.value, page });

    try {
      const result = await submitAirtableBehaviorEvent({
        data: {
          sessionId,
          sessionKind,
          page,
          event: event.event,
          value: event.value,
          sourceTab: "CTA Interactions",
        },
      });
      setStatus(result.success ? "success" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main className="min-h-screen bg-[#070A0E] px-4 py-16 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-[#10B981]">
          Airtable behaviour proof of concept
        </p>
        <h1 className="mb-3 text-3xl font-bold">Send one website behaviour event</h1>
        <p className="mb-8 text-sm leading-relaxed text-[#94A3B8]">
          This isolated demo sends the same anonymous event shape used by GreenNext analytics to
          Google Sheets and to Airtable. It does not collect or store lead information.
        </p>

        <div className="space-y-3 rounded-2xl border border-[#1E293B] bg-[#0B0F17] p-6">
          <p className="text-sm text-[#CBD5E1]">Choose one existing behaviour event to copy to Airtable:</p>
          {BEHAVIOR_EVENTS.map((event) => (
            <button
              key={event.event}
              type="button"
              disabled={status === "loading"}
              onClick={() => void sendBehaviorEvent(event)}
              className="block w-full rounded-lg bg-[#10B981] px-5 py-2.5 text-left text-sm font-semibold text-[#070A0E] disabled:opacity-50"
            >
              {event.event} ({event.value})
            </button>
          ))}
          {status === "loading" && <p className="text-sm text-[#CBD5E1]">Sending event…</p>}
          {status === "success" && <p className="text-sm text-[#86EFAC]">Behaviour event copied to Airtable.</p>}
          {status === "failed" && <p className="text-sm text-[#FCA5A5]">Behaviour event could not be copied to Airtable.</p>}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[#64748B]">
          Airtable table: Website_Behaviour. Fields: Timestamp, Session ID, Session Kind, Page,
          Event, Value, and Source Tab.
        </p>
      </div>
    </main>
  );
}
