import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFC] text-[#1A1A1A]">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-neutral-900 w-fit">
          <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-black rotate-45"></div>
          </div>
          SYNTAX.AI
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded border border-neutral-200 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 mb-2">
                Check your email
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We sent a sign-in link to <span className="font-semibold text-neutral-700">{email}</span>. Click the link in the email to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-center mb-1 text-neutral-900">
                Welcome back
              </h2>
              <p className="text-xs text-neutral-500 text-center mb-8">
                Enter your email to receive a sign-in link
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:bg-white transition-all text-neutral-900 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 border border-yellow-500 text-black font-bold text-xs py-2 rounded mt-2 hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send sign-in link"}
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
