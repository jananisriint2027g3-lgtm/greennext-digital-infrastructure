import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import {
  verifyEbookOtp,
  requestEbookOtp,
  getEbookSession,
} from "../../lib/ebook-session.server-fn";

export const Route = createFileRoute("/ebook/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify Your Email | GreenNext Ebook" },
      {
        name: "description",
        content: "Enter your 6-digit single-use verification code to activate your GreenNext Ebook access.",
      },
    ],
  }),
  loader: async () => {
    return await getEbookSession();
  },
  component: EbookVerifyOtpPage,
});

export function EbookVerifyOtpPage() {
  const session = Route.useLoaderData();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Server uses session-bound email/uid — no client-supplied email needed
      const res = await verifyEbookOtp(otp.trim());

      if (!res.success) {
        setError(res.error || "Verification failed. Check your code.");
      } else {
        setSuccessMsg("Email verified successfully! Opening your reader...");
        setTimeout(() => {
          navigate({ to: "/ebook/reader" });
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Server uses session-bound email/name — no client params needed
      const res = await requestEbookOtp();

      if (!res.success) {
        setError(res.error || "Failed to resend code.");
        if (res.cooldownRemaining) setCooldown(res.cooldownRemaining);
      } else {
        setSuccessMsg("A new 6-digit code has been dispatched to your email.");
        setCooldown(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend request failed.");
    } finally {
      setResending(false);
    }
  };

  // Display email from session (server-authoritative), never from URL params
  const displayEmail = session?.user?.email ?? "your email";

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Security Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Enter 6-Digit Code
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            We sent a single-use verification code to{" "}
            <strong className="text-white">{displayEmail}</strong>. It expires in 5 minutes.
          </p>
        </div>

        <div className="border border-[#1E293B] bg-[#0A0F1D]/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
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

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-2 text-center uppercase tracking-wider font-mono">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full py-3.5 px-4 bg-[#0F172A] border border-[#1E293B] focus:border-[#10B981] rounded-xl text-center font-mono text-2xl font-bold tracking-[0.4em] text-white focus:outline-none"
              />
              <div className="text-[11px] text-[#64748B] text-center mt-2">
                Code expires in 5 minutes &bull; Max 5 attempts
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying Code...</span>
              ) : (
                <>
                  Verify &amp; Unlock Ebook Access
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="font-medium text-[#10B981] hover:text-[#34D399] disabled:opacity-40 disabled:hover:text-[#10B981] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link to="/ebook/auth" className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
              &larr; Switch Account or Re-enter Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
