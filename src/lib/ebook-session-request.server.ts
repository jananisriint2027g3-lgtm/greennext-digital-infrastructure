import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import type { EbookSessionState } from "./ebook-session.server-fn";

/** Server-only SSR session read. The incoming HttpOnly cookie is forwarded to the protected API. */
export async function readEbookSessionFromSsrRequest(): Promise<EbookSessionState | null> {
  try {
    const request = getRequest();
    const cookieHeader = getRequestHeader("cookie");
    const response = await fetch(new URL("/api/ebook/session", request.url), {
      method: "GET",
      headers: { Accept: "application/json", ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
    });
    const data = (await response.json()) as EbookSessionState;
    if (response.ok && data?.authenticated && data.user) return data;
    if (data?.sessionExpired) return data;
  } catch {
    // The caller supplies the normal unauthenticated/dev-preview fallback.
  }
  return null;
}
