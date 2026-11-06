import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  BookOpen,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  loginEbookEmail,
  registerEbookEmail,
  loginEbookGoogle,
  isEbookDevPreview,
} from "../../lib/ebook-session.server-fn";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (listener?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

export const Route = createFileRoute("/ebook/auth")({
  head: () => ({
    meta: [
      { title: "Reader Access & Sign In | GreenNext Ebook" },
      {
        name: "description",
        content: "Sign in or register for verified access to GreenNext Intelligent Infrastructure Ebook (Edition 2.0).",
      },
    ],
  }),
  component: EbookAuthPage,
});

export function EbookAuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "register">("signin");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Setup Google Identity Services if client ID is configured
  const googleClientId = typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined)?.trim()
    : undefined;

  const handleGoogleCredentialResponse = async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginEbookGoogle(credential);
      if (!res.success) {
        setError(res.error || "Google Sign-In failed.");
      } else {
        navigate({ to: "/ebook/reader" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Sign-In error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setError(null);

    if (!googleClientId) {
      setError(
        "Google Sign-In is not yet configured on this instance. Please set VITE_GOOGLE_CLIENT_ID in your environment variables, or sign in using your Email and Password below."
      );
      return;
    }

    setLoading(true);
    try {
      // Ensure Google Identity Services script is loaded
      if (!window.google?.accounts?.id) {
        await new Promise<void>((resolve, reject) => {
          const existingScript = document.getElementById("google-gis-script");
          if (existingScript) {
            existingScript.addEventListener("load", () => resolve());
            existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
            return;
          }
          const script = document.createElement("script");
          script.id = "google-gis-script";
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to connect to Google Identity Services. Check your network."));
          document.head.appendChild(script);
        });
      }

      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) {
              void handleGoogleCredentialResponse(response.credential);
            } else {
              setLoading(false);
              setError("No credential returned by Google Sign-In.");
            }
          },
          cancel_on_tap_outside: false,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            setLoading(false);
          }
        });
      } else {
        throw new Error("Google Identity Services library could not be initialized.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate Google Sign-In.");
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === "register") {
        if (!name.trim()) {
          setError("Please provide your full name.");
          setLoading(false);
          return;
        }

        const res = await registerEbookEmail(email.trim(), password, name.trim());

        if (!res.success) {
          setError(res.error || "Registration failed. Please verify your details.");
        } else {
          setSuccessMsg("Account created! Redirecting to email verification...");
          setTimeout(() => {
            navigate({ to: "/ebook/verify-otp" });
          }, 800);
        }
      } else {
        const res = await loginEbookEmail(email.trim(), password);

        if (!res.success) {
          setError(res.error || "Invalid email or password.");
        } else if (!res.emailVerified) {
          // Unverified email: redirect to OTP verification (server holds email in session)
          navigate({ to: "/ebook/verify-otp" });
        } else {
          // Success
          navigate({ to: "/ebook/reader" });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            GreenNext Reader Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {tab === "signin" ? "Sign In to Read Ebook" : "Register Reader Account"}
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Edition 2.0 &bull; Intelligent Infrastructure for a Sustainable Digital Future
          </p>
        </div>

        {/* Local Developer Preview Banner */}
        {isEbookDevPreview() && (
          <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/40 rounded-xl text-xs text-[#10B981] flex items-center justify-between shadow-lg shadow-[#10B981]/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-semibold">Local Dev Preview Mode Active</span>
            </div>
            <Link
              to="/ebook/reader"
              className="font-bold underline hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Open Reader &rarr;</span>
            </Link>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex bg-[#0A0F1D] border border-[#1E293B] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setTab("signin"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "signin"
                ? "bg-[#10B981] text-[#070A0E] shadow"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "register"
                ? "bg-[#10B981] text-[#070A0E] shadow"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="border border-[#1E293B] bg-[#0A0F1D]/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[#334155] bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#1E293B] w-full" />
            <span className="bg-[#0A0F1D] px-3 text-[11px] font-mono text-[#64748B] uppercase">Or with Email</span>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Asha Rao"
                    className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asha@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#94A3B8]">Password</label>
                {tab === "signin" && (
                  <Link to="/ebook/forgot-password" className="text-[11px] text-[#10B981] hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : tab === "signin" ? (
                <>
                  Sign In &bull; Open Reader
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Create Account &bull; Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/ebook" className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
              &larr; Back to Ebook Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
