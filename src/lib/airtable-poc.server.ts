const AIRTABLE_BASE_ID = "appFek2Mm1ztlCT5D";
const AIRTABLE_TABLE_NAME = "Leads";

export interface AirtableLeadRecord {
  name: string;
  email: string;
  phone: string;
  organization: string;
  region: string;
  inquiryType: string;
  message: string;
  timestamp: string;
}

function getAirtablePat(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env["AIRTABLE_PAT"]?.trim() || undefined;
}

export async function createAirtableLeadRecord(record: AirtableLeadRecord): Promise<void> {
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
      body: JSON.stringify({ fields: record }),
    },
  );

  if (!response.ok) {
    throw new Error(`Airtable request failed with status ${response.status}.`);
  }
}
