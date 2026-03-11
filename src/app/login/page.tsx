"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: "https://nassau.golf/auth/callback" },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#F3EDE4" }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#E2D9CC] bg-[#FDFAF5] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D94F2B]/10">
              <span className="text-2xl font-extrabold text-[#D94F2B]">N</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Nassau</h1>
            <p className="mt-2 text-sm text-[#5A4F45]">The Golf Trip Companion</p>
          </div>
          {sent ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Check your email</h2>
              <p className="mt-2 text-sm text-[#5A4F45]">We sent a magic link to <span className="font-medium text-[#1A1A1A]">{email}</span>.</p>
              <button onClick={() => { setSent(false); setEmail(""); }} className="mt-6 text-sm font-medium text-[#D94F2B] hover:text-[#B83D25]">Use a different email</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A]">Email address</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 block w-full rounded-xl border border-[#E2D9CC] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#8A8078] focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20 transition" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50" style={{ backgroundColor: "#D94F2B" }}>
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-[#8A8078]">No password needed — we&apos;ll email you a secure link.</p>
      </div>
    </div>
  );
}
