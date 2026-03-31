"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  Trophy,
  Map,
  User,
  LogOut,
  Loader2,
  Check,
} from "lucide-react";
import TopBar from "@/components/TopBar";

interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  avatar_url: string;
  venmo_username: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
}

interface Stats {
  rounds: number;
  avgScore: number;
  won: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [stats, setStats] = useState<Stats>({ rounds: 0, avgScore: 0, won: 0 });

  // Form fields
  const [fullName, setFullName] = useState("");
  const [venmoUsername, setVenmoUsername] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/profile");
      if (res.ok) {
        const p: Profile = await res.json();
        setProfile(p);
        setFullName(p.full_name || "");
        setVenmoUsername(p.venmo_username || "");
      }

      // Fetch stats
      try {
        const statsRes = await fetch("/api/profile/stats");
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({
            rounds: s.rounds ?? 0,
            avgScore: s.avgScore ?? s.avg_score ?? 0,
            won: s.won ?? s.bets_won ?? 0,
          });
        }
      } catch {
        // Stats are non-critical
      }

      setLoading(false);
    });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          venmo_username: venmoUsername,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#111111]"
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#8A8A8A]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#111111] pb-32"
    >
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1611374243147-44a702c2d44c?q=80&w=2070&auto=format&fit=crop"
          alt="Golfer at golden hour"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex flex-col h-full">
          <TopBar />
          <div className="mt-auto px-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#2F4F4F] rounded-full flex items-center justify-center border-2 border-dark/50">
                <span className="font-semibold text-xl text-[#F2F0EB]">
                  {getInitials(profile?.full_name)}
                </span>
              </div>
              <div>
                <h1 className="text-[22px] font-headline font-medium text-[#F2F0EB] tracking-tight">
                  {profile?.full_name || "User"}
                </h1>
                <p className="text-[13px] text-[#F2F0EB]/50">12 HDCP · Austin, TX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mx-6 mt-6 bg-[#1A1A1A] rounded-[10px] shadow-sm p-4">
        <div className="grid grid-cols-3 divide-x divide-[#2A2A2A]">
          <div className="text-center">
            <p className="font-semibold text-2xl text-[#F2F0EB]">
              {stats.rounds}
            </p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mt-1">
              Rounds
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-2xl text-[#F2F0EB]">
              {stats.avgScore || "—"}
            </p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mt-1">
              Avg Score
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-2xl text-[#2D5A3D]">
              {stats.won}
            </p>
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mt-1">
              Won
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      {profile?.subscription_status &&
        profile.subscription_status !== "free" && (
          <div className="mx-6 mt-4 bg-[#1A1A1A] rounded-[10px] shadow-sm p-4 border-l-4 border-[#B8976A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[#B8976A]">
                  Nassau Pro
                </p>
                <p className="text-sm text-[#B8976A] mt-1">
                  Founding Member
                </p>
              </div>
              <span className="text-[#2D5A3D] font-bold text-sm">
                Manage →
              </span>
            </div>
          </div>
        )}

      {/* Editable Fields */}
      <form onSubmit={handleSave}>
        <div className="mx-6 mt-6">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-3">
            Account
          </p>

          {/* Full Name */}
          <div className="mb-4">
            <label className="text-xs text-[#8A8A8A] uppercase mb-1 block">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Grayson Frank"
              className="w-full bg-[#1A1A1A] rounded-[10px] shadow-sm px-4 py-3 text-[#F2F0EB] font-bold focus:border-[#2D5A3D] focus:outline-none focus:ring-0 placeholder:text-[#8A8A8A]"
            />
          </div>

          {/* Venmo Username */}
          <div>
            <label className="text-xs text-[#8A8A8A] uppercase mb-1 block">
              Venmo Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] font-bold">
                @
              </span>
              <input
                type="text"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value)}
                placeholder="John-Doe-42"
                className="w-full bg-[#1A1A1A] rounded-[10px] shadow-sm pl-8 pr-4 py-3 text-[#F2F0EB] font-bold focus:border-[#2D5A3D] focus:outline-none focus:ring-0 placeholder:text-[#8A8A8A]"
              />
            </div>
            <p className="text-xs text-[#8A8A8A] mt-1">
              Used for quick settlements
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mx-6 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#2D5A3D] text-white font-medium uppercase py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              "Save Changes"
            )}
          </button>
          {saved && (
            <p className="text-sm text-[#2D5A3D] text-center mt-2 flex items-center justify-center gap-1">
              <Check className="h-4 w-4" />
              Changes saved
            </p>
          )}
        </div>
      </form>

      {/* Sign Out */}
      <div className="mx-6 mt-4">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full border border-[#2A2A2A] text-[#8A8A8A] font-medium uppercase py-3 rounded-lg mb-24 hover:border-[#C4423B] hover:text-[#C4423B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>

      {/* Bottom Nav — Profile active */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1"
          >
            <Home className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Home
            </span>
          </Link>
          <Link
            href="/rounds"
            className="flex flex-col items-center gap-1"
          >
            <Trophy className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Rounds
            </span>
          </Link>
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1"
          >
            <Map className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Trips
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1"
          >
            <User className="h-5 w-5 text-[#2D5A3D]" />
            <span className="text-xs uppercase font-bold text-[#2D5A3D]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
