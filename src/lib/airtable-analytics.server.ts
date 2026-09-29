const AIRTABLE_BASE_ID = "appFek2Mm1ztlCT5D";
const AIRTABLE_TABLE_NAME = "Website_Behaviour";

export interface AirtableBehaviorEvent {
  sessionId: string;
  sessionKind: string;
  page: string;
  event: string;
  value: string;
  sourceTab: string;
}

function getAirtablePat(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env["AIRTABLE_PAT"]?.trim() || undefined;
}

export async function createAirtableBehaviorEvent(event: AirtableBehaviorEvent): Promise<void> {
  const pat = getAirtablePat();
  if (!pat) throw new Error("Airtable is not configured on the server.");

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Timestamp: new Date().toISOString(),
          "Session ID": event.sessionId,
          "Session Kind": event.sessionKind,
          Page: event.page,
          Event: event.event,
          Value: event.value,
          "Source Tab": event.sourceTab,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Airtable request failed with status ${response.status}.`);
  }
}
