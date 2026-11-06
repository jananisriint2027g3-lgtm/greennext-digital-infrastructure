import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InternalLink as Link } from "../../components/common/InternalLink";
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { firebaseSendPasswordReset } from "../../lib/firebase-auth";

export const Route = createFileRoute("/ebook/forgot-password")({
  head: () => ({
    meta: [
      { title: "Password Reset | GreenNext Ebook" },
      {
        name: "description",
        content: "Reset your password for the GreenNext Ebook portal.",
      },
    ],
  }),
  component: EbookForgotPasswordPage,
});

export function EbookForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await firebaseSendPasswordReset(email.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Unable to process password reset.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0E] text-[#E2E8F0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Security & Recovery
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Enter your registered GreenNext reader email to receive password reset instructions.
          </p>
        </div>

        <div className="border border-[#1E293B] bg-[#0A0F1D]/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-[#10B981]/15 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Reset Email Sent</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, a password reset link has been dispatched.
              </p>
              <div className="pt-2">
                <Link
                  to="/ebook/auth"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Registered Email</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#070A0E] text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-[#10B981]/20 flex items-center justify-center gap-2"
              >
                {loading ? "Sending Link..." : "Send Password Reset Link"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link to="/ebook/auth" className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
