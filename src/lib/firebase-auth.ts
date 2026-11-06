/**
 * GreenNext Firebase Authentication Client & Server Engine
 *
 * Implements Google Identity Toolkit REST API integration for Firebase Auth:
 * - Google Sign-In verification via trusted server-side signInWithIdp
 * - Email/Password Registration and Login
 * - Password Reset
 * - Server-side ID Token verification via :lookup endpoint
 * - Email verification flag update via :update endpoint
 * - Zero external SDK installation (standard HTTPS REST + native crypto only)
 */

export interface FirebaseUserRecord {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  photoUrl?: string;
  providerId: string;
}

export interface AuthResponse<T = FirebaseUserRecord> {
  success: boolean;
  user?: T;
  error?: string;
  code?: string;
}

function getFirebaseApiKey(): string {
  if (typeof process !== "undefined" && process.env) {
    // Server-only key (not VITE_ prefixed) is preferred for server-side calls
    const s = process.env["FIREBASE_API_KEY"] || process.env["VITE_FIREBASE_API_KEY"];
    if (s && s.trim()) return s.trim();
  }
  return "";
}

const IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

/**
 * Sanitizes user display name — strips control chars, limits length.
 */
function sanitizeDisplayName(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 128);
}

/**
 * Registers a new reader with Email and Password using Firebase Auth.
 * Returns emailVerified: false (always — email must be verified via OTP first).
 * Does NOT return idToken or refreshToken to callers — those remain server-only.
 */
export async function firebaseRegisterEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "Authentication service is not configured.",
      code: "AUTH_NOT_CONFIGURED",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^@]+@[^@]+\.[^@]+$/.test(normalizedEmail)) {
    return { success: false, error: "A valid email address is required.", code: "INVALID_EMAIL" };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters.", code: "WEAK_PASSWORD" };
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:signUp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || "Registration failed";
      if (msg.includes("EMAIL_EXISTS")) {
        return { success: false, error: "An account with this email address already exists.", code: "EMAIL_EXISTS" };
      }
      if (msg.includes("WEAK_PASSWORD")) {
        return { success: false, error: "Password must be at least 8 characters.", code: "WEAK_PASSWORD" };
      }
      if (msg.includes("INVALID_EMAIL")) {
        return { success: false, error: "A valid email address is required.", code: "INVALID_EMAIL" };
      }
      // Do not expose raw Firebase error message to client
      return { success: false, error: "Registration failed. Please check your details.", code: "REGISTRATION_FAILED" };
    }

    const sanitizedName = sanitizeDisplayName(displayName);

    // Set displayName if provided — fire and forget, non-critical
    if (sanitizedName && data.idToken) {
      void fetch(`${IDENTITY_TOOLKIT_URL}:update?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: data.idToken,
          displayName: sanitizedName,
          returnSecureToken: false,
        }),
      }).catch(() => {});
    }

    // Store idToken only as a temporary server-side reference — NEVER expose in API response body
    // We store it in a module-level weak map so verify-otp can call serverMarkEmailVerified
    storeTemporaryIdToken(data.localId, data.idToken);

    return {
      success: true,
      user: {
        uid: data.localId,
        email: normalizedEmail,
        displayName: sanitizedName,
        emailVerified: false, // always false at registration — requires OTP
        providerId: "password",
        // idToken and refreshToken deliberately omitted
      },
    };
  } catch (err) {
    return {
      success: false,
      error: "Unable to reach the authentication service. Please try again.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Authenticates an existing reader with Email and Password.
 * Checks emailVerified status server-side via :lookup; never trusts client claims.
 * Does NOT return idToken or refreshToken to callers.
 */
export async function firebaseLoginEmail(email: string, password: string): Promise<AuthResponse> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "Authentication service is not configured.",
      code: "AUTH_NOT_CONFIGURED",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { success: false, error: "Email and password are required.", code: "INVALID_INPUT" };
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error?.message || "";
      if (
        msg.includes("EMAIL_NOT_FOUND") ||
        msg.includes("INVALID_PASSWORD") ||
        msg.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        return { success: false, error: "Invalid email address or password.", code: "INVALID_CREDENTIALS" };
      }
      if (msg.includes("USER_DISABLED")) {
        return { success: false, error: "This account has been suspended.", code: "USER_DISABLED" };
      }
      if (msg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        return { success: false, error: "Too many sign-in attempts. Please try again later.", code: "RATE_LIMITED" };
      }
      return { success: false, error: "Sign-in failed. Please try again.", code: "SIGNIN_FAILED" };
    }

    // Check email verification status server-side via :lookup — never trust login response
    const verified = await checkEmailVerifiedStatus(data.idToken, apiKey);

    // Store idToken temporarily for potential OTP → verified upgrade
    storeTemporaryIdToken(data.localId, data.idToken);

    return {
      success: true,
      user: {
        uid: data.localId,
        email: normalizedEmail,
        displayName: sanitizeDisplayName(data.displayName),
        emailVerified: verified,
        providerId: "password",
        // idToken and refreshToken deliberately omitted
      },
    };
  } catch (err) {
    return {
      success: false,
      error: "Unable to reach the authentication service. Please try again.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Authenticates with a Google Identity token.
 * Passes the token to Firebase's signInWithIdp for server-side validation.
 * Reads emailVerified from Firebase's trusted response — never hardcodes true.
 * Does NOT return idToken or refreshToken to callers.
 */
export async function firebaseLoginWithGoogleIdToken(googleIdToken: string): Promise<AuthResponse> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "Authentication service is not configured.",
      code: "AUTH_NOT_CONFIGURED",
    };
  }

  if (!googleIdToken || googleIdToken.length < 10) {
    return { success: false, error: "A valid Google identity token is required.", code: "INVALID_TOKEN" };
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:signInWithIdp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
        // requestUri must match Firebase Console authorized domains
        requestUri: process.env["SITE_URL"] || "https://greennext-ai.vercel.app",
        returnIdpCredential: true,
        returnSecureToken: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.message || "";
      if (errMsg.includes("OPERATION_NOT_ALLOWED")) {
        return {
          success: false,
          error: "Google Sign-In is not enabled in Firebase Console. Please enable Google under Sign-in Providers.",
          code: "PROVIDER_DISABLED",
        };
      }
      if (errMsg.includes("INVALID_IDP_RESPONSE") || errMsg.includes("INVALID_TOKEN")) {
        return {
          success: false,
          error: "Invalid or expired Google identity token.",
          code: "INVALID_TOKEN",
        };
      }
      return {
        success: false,
        error: "Google authentication failed. Please try again.",
        code: "GOOGLE_AUTH_FAILED",
      };
    }

    // Read emailVerified from Firebase's trusted response — NEVER hardcode true
    // Firebase returns emailVerified: true for all verified Google accounts
    const emailVerified = Boolean(data.emailVerified);

    if (!emailVerified) {
      // Google accounts should always be verified — if not, refuse access
      return {
        success: false,
        error: "Google account email is not verified. Please verify your Google account first.",
        code: "EMAIL_NOT_VERIFIED",
      };
    }

    return {
      success: true,
      user: {
        uid: data.localId,
        email: (data.email || "").trim().toLowerCase(),
        displayName: sanitizeDisplayName(data.displayName),
        emailVerified: true,
        photoUrl: data.photoUrl,
        providerId: "google.com",
        // idToken and refreshToken deliberately omitted
      },
    };
  } catch (err) {
    return {
      success: false,
      error: "Unable to reach the authentication service. Please try again.",
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Sends a password reset email via Firebase.
 */
export async function firebaseSendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    return { success: false, error: "Authentication service is not configured." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: "A valid email address is required." };
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:sendOobCode?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: normalizedEmail,
      }),
    });

    if (!res.ok) {
      // Don't reveal whether the email exists
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Unable to send password reset email. Please try again." };
  }
}

/**
 * Server-side helper: Verifies a Firebase ID token and returns the full user record.
 * Uses the :lookup endpoint — trusted server-side only.
 */
export async function serverVerifyFirebaseIdToken(idToken: string): Promise<FirebaseUserRecord | null> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey || !idToken) return null;

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const u = data.users?.[0];
    if (!u) return null;

    return {
      uid: u.localId,
      email: (u.email || "").trim().toLowerCase(),
      displayName: sanitizeDisplayName(u.displayName),
      emailVerified: Boolean(u.emailVerified),
      photoUrl: u.photoUrl,
      providerId: u.providerUserInfo?.[0]?.providerId || "password",
    };
  } catch {
    return null;
  }
}

/**
 * Server-side helper: Marks a user's email as verified in Firebase Authentication.
 * MUST only be called after successful OTP validation — never before.
 * Requires the Firebase idToken stored temporarily after registration/login.
 */
export async function serverMarkEmailVerified(uid: string): Promise<boolean> {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) return false;

  const idToken = consumeTemporaryIdToken(uid);
  if (!idToken) {
    // idToken expired or not found — cannot mark verified without it
    return false;
  }

  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:update?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        emailVerified: true,       // ← the missing field that was never sent before
        returnSecureToken: false,  // do not return a new token
      }),
    });

    if (!res.ok) return false;

    // Confirm the change by looking up the account
    const confirmed = await checkEmailVerifiedStatus(idToken, apiKey);
    return confirmed;
  } catch {
    return false;
  }
}

/**
 * Server-side helper: Checks if the email associated with an ID token is verified.
 */
async function checkEmailVerifiedStatus(idToken: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${IDENTITY_TOOLKIT_URL}:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.users?.[0]?.emailVerified);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Temporary ID Token Store — server-side only, short-lived
// Stores uid → idToken so serverMarkEmailVerified can call :update with it.
// Entries expire after 10 minutes (OTP TTL + buffer).
// ---------------------------------------------------------------------------

interface TempTokenEntry {
  idToken: string;
  expiresAt: number;
}
const _tempTokenStore = new Map<string, TempTokenEntry>();

function storeTemporaryIdToken(uid: string, idToken: string): void {
  if (!uid || !idToken) return;
  // Purge expired entries before inserting
  const now = Date.now();
  for (const [k, v] of _tempTokenStore.entries()) {
    if (v.expiresAt <= now) _tempTokenStore.delete(k);
  }
  _tempTokenStore.set(uid, { idToken, expiresAt: now + 10 * 60 * 1000 }); // 10 min
}

function consumeTemporaryIdToken(uid: string): string | null {
  const entry = _tempTokenStore.get(uid);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    _tempTokenStore.delete(uid);
    return null;
  }
  _tempTokenStore.delete(uid); // consume once — single-use
  return entry.idToken;
}
