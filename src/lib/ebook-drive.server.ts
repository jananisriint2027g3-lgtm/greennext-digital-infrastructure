/**
 * GreenNext Private Ebook Storage & PDF Streaming Engine (Server-Side)
 *
 * Requirements:
 * - PDF is never publicly accessible via any static URL
 * - In production: fetches from private Google Drive using service account JWT auth
 * - In development: falls back to local root master file (outside public/ dir)
 * - Streams PDF with binary headers, no-store cache headers
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { createSign } from "node:crypto";

export interface EbookPdfStreamResult {
  success: boolean;
  streamBuffer?: Buffer;
  contentLength?: number;
  contentType: string;
  error?: string;
  source: "drive" | "local_secure_master";
}

function getDriveCredentials() {
  const email = process.env["GOOGLE_SERVICE_ACCOUNT_EMAIL"]?.trim();
  let rawKey = process.env["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]?.trim();
  if (rawKey) {
    if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
      rawKey = rawKey.slice(1, -1);
    }
    rawKey = rawKey.replace(/\\n/g, "\n");
  }
  const fileId = process.env["GOOGLE_DRIVE_EBOOK_FILE_ID"]?.trim();
  return { email, privateKey: rawKey, fileId };
}

/**
 * Creates a signed Google OAuth2 JWT for service account authentication.
 * Uses RS256 / native node:crypto — no external SDK needed.
 */
async function fetchDriveAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        iss: serviceAccountEmail,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url");

    const signingInput = `${header}.${payload}`;
    const sign = createSign("RSA-SHA256");
    sign.update(signingInput);
    const signature = sign.sign(privateKey, "base64url");
    const assertion = `${signingInput}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.warn("[Ebook Drive] Failed to obtain service account token:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Retrieves the master Ebook PDF for an authenticated and verified reader.
 * Production: Google Drive (private, service-account authenticated).
 * Development: local root master file.
 */
export async function fetchPrivateEbookPdf(): Promise<EbookPdfStreamResult> {
  const { email, privateKey, fileId } = getDriveCredentials();
  const isProd = process.env["NODE_ENV"] === "production";

  // 1. If Google Drive Service Account credentials are fully configured, fetch from Drive
  if (email && privateKey && fileId) {
    try {
      console.info("[Ebook Drive] Authenticating service account for Drive access...");
      const accessToken = await fetchDriveAccessToken(email, privateKey);

      if (!accessToken) {
        console.warn("[Ebook Drive] Service account token exchange failed.");
        if (isProd) {
          return {
            success: false,
            contentType: "application/pdf",
            error: "Ebook resource temporarily unavailable. Please try again shortly.",
            source: "drive",
          };
        }
      } else {
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
        const driveRes = await fetch(driveUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!driveRes.ok) {
          console.warn("[Ebook Drive] Drive file fetch failed with status:", driveRes.status);
          if (isProd) {
            return {
              success: false,
              contentType: "application/pdf",
              error: "Ebook resource temporarily unavailable. Please try again shortly.",
              source: "drive",
            };
          }
        } else {
          const buffer = Buffer.from(await driveRes.arrayBuffer());
          return {
            success: true,
            streamBuffer: buffer,
            contentLength: buffer.length,
            contentType: "application/pdf",
            source: "drive",
          };
        }
      }
    } catch (driveErr) {
      console.warn("[Ebook Drive] Exception fetching from Drive:", driveErr instanceof Error ? driveErr.message : driveErr);
      if (isProd) {
        return {
          success: false,
          contentType: "application/pdf",
          error: "Ebook resource temporarily unavailable. Please try again shortly.",
          source: "drive",
        };
      }
    }
  }

  // 2. Local Master Fallback — strictly disabled in production when Drive is not configured
  if (isProd) {
    return {
      success: false,
      contentType: "application/pdf",
      error:
        "Private Google Drive storage must be configured in production. " +
        "Set GOOGLE_DRIVE_EBOOK_FILE_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
      source: "drive",
    };
  }

  // Local development fallback — searches root-relative paths only (outside public/)
  const candidatePaths = [
    resolve(process.cwd(), "GreenNext_Ebook_v2.pdf"),
  ];

  for (const filePath of candidatePaths) {
    if (existsSync(filePath)) {
      try {
        const stats = statSync(filePath);
        const buffer = readFileSync(filePath);
        return {
          success: true,
          streamBuffer: buffer,
          contentLength: stats.size,
          contentType: "application/pdf",
          source: "local_secure_master",
        };
      } catch {
        return {
          success: false,
          contentType: "application/pdf",
          error: "Failed to read local ebook master file.",
          source: "local_secure_master",
        };
      }
    }
  }

  return {
    success: false,
    contentType: "application/pdf",
    error: "Ebook PDF not found. Please configure GOOGLE_DRIVE_EBOOK_FILE_ID for production or place GreenNext_Ebook_v2.pdf in the project root for development.",
    source: "drive",
  };
}
