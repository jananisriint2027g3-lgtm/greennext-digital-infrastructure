import { useEffect, useRef, useState } from "react";

import { getCurrentPage, getSessionId } from "../../lib/analytics";
import { submitAnonymousSessionToAirtable } from "../../lib/airtable-session.server-fn";

function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|android(?!.*mobile)/.test(userAgent)) return "tablet";
  if (/android|iphone|ipod|mobile/.test(userAgent)) return "mobile";
  return "desktop";
}

export function AirtablePrototypeTest() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "created" | "failed">("idle");
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).get("airtablePrototype") === "1");
  }, []);

  if (!enabled) return null;

  const createRecord = async () => {
    setStatus("loading");
    const result = await submitAnonymousSessionToAirtable({
      data: {
        sessionId: getSessionId(),
        startedAt: startedAt.current,
        deviceType: getDeviceType(),
        entryPage: getCurrentPage(),
        referrer: document.referrer || "",
        sessionOutcome: "airtable_prototype_test",
      },
    });
    setStatus(result.status === "created" ? "created" : "failed");
  };

  return (
    <section className="mx-auto mt-6 max-w-[1340px] px-4 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/5 p-4 text-sm text-[#CBD5E1]">
        <p className="mb-3 font-semibold text-[#06B6D4]">Airtable prototype test</p>
        <button
          type="button"
          onClick={createRecord}
          disabled={status === "loading"}
          className="rounded-lg border border-[#06B6D4]/60 px-3 py-2 text-xs font-semibold text-[#67E8F9] disabled:opacity-50"
        >
          {status === "loading" ? "Creating session record…" : "Create anonymous Airtable session"}
        </button>
        {status === "created" && <p className="mt-2 text-xs text-[#86EFAC]">Airtable record created.</p>}
        {status === "failed" && <p className="mt-2 text-xs text-[#FCA5A5]">Airtable record creation failed.</p>}
      </div>
    </section>
  );
}
