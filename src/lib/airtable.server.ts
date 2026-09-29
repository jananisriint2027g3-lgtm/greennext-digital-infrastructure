const AIRTABLE_BASE_ID = "appFek2Mm1ztlCT5D";
const AIRTABLE_TABLE_NAME = "Sessions";

export interface AirtableSessionRecord {
  sessionId: string;
  startedAt: string;
  deviceType: string;
  entryPage: string;
  referrer: string;
  sessionOutcome: string;
}

function getAirtablePat(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env["AIRTABLE_PAT"]?.trim() || undefined;
}

export function isAirtableEnabled(): boolean {
  return Boolean(getAirtablePat());
}

export async function createAirtableSessionRecord(
  record: AirtableSessionRecord,
): Promise<{ recordId: string }> {
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
          "Session ID": record.sessionId,
          "Started At": record.startedAt,
          "Device Type": record.deviceType,
          "Entry Page": record.entryPage,
          Referrer: record.referrer,
          "Session Outcome": record.sessionOutcome,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Airtable request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as { id?: unknown };
  if (typeof result.id !== "string" || !result.id) {
    throw new Error("Airtable returned an invalid record response.");
  }

  return { recordId: result.id };
}
