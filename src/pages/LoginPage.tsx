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
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm tracking-tight text-neutral-900 w-fit">
          <img src="/logo.png" alt="Human in the Loop" className="h-6 w-6" />
          HUMAN IN THE LOOP
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
                E-Mail pr&uuml;fen
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Wir haben einen Anmeldelink an <span className="font-semibold text-neutral-700">{email}</span> gesendet. Klicke auf den Link in der E-Mail, um dich anzumelden.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-center mb-1 text-neutral-900">
                Willkommen zur&uuml;ck
              </h2>
              <p className="text-xs text-neutral-500 text-center mb-8">
                Gib deine E-Mail-Adresse ein, um einen Anmeldelink zu erhalten
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    E-Mail
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
                  {loading ? "Wird gesendet..." : "Anmeldelink senden"}
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
