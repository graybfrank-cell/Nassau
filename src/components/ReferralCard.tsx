"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";

export default function ReferralCard() {
  const [referralUrl, setReferralUrl] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferral() {
      try {
        const res = await fetch("/api/referral/generate");
        if (res.ok) {
          const data = await res.json();
          setReferralUrl(data.referral_url);
          setReferralCode(data.code);
        }

        // Fetch referral count
        const statsRes = await fetch("/api/referral/generate");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReferralCount(statsData.referral_count || 0);
        }
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSMS = () => {
    const text = `Check out Nassau — it makes planning golf trips way easier. Sign up here: ${referralUrl}`;
    window.open(`sms:?&body=${encodeURIComponent(text)}`);
  };

  const handleWhatsApp = () => {
    const text = `Check out Nassau — it makes planning golf trips way easier. Sign up here: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-40 rounded bg-zinc-200" />
        <div className="mt-4 h-10 rounded bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">
          Invite your crew
        </h3>
        {referralCount > 0 && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            {referralCount} friend{referralCount !== 1 ? "s" : ""} joined
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Share your link and get your golf crew on Nassau.
      </p>

      {/* Referral link */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 font-mono truncate">
          {referralUrl || `nassau.golf/r/${referralCode}`}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Share buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSMS}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          iMessage / SMS
        </button>
        <button
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
