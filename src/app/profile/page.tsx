"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  ChevronRight,
  Home,
  Trophy,
  Map,
  User,
  LogOut,
  Loader2,
} from "lucide-react";

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

const ACCOUNT_ROWS = ["Edit Profile", "Change Email", "Notifications"];
const GAME_ROWS = ["Default Handicap", "Home Course", "Preferred Tee"];
const PAYMENT_ROWS = [
  "Venmo Username",
  "Payment History",
  "Nassau Pro Subscription",
];

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
  const [stats, setStats] = useState<Stats>({ rounds: 0, avgScore: 0, won: 0 });
  const [signingOut, setSigningOut] = useState(false);

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

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#18181B]"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#18181B] pb-32"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-black text-xl uppercase tracking-tighter text-[#F3EDE4]">
          NASSAU
        </span>
        <Bell className="h-5 w-5 text-[#71717A]" />
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mt-8">
        <div className="w-20 h-20 bg-[#27272A] rounded-full flex items-center justify-center">
          <span className="font-black text-2xl text-[#F3EDE4]">
            {getInitials(profile?.full_name)}
          </span>
        </div>
        <h1 className="mt-4 font-black text-2xl text-[#F3EDE4]">
          {profile?.full_name || "User"}
        </h1>
        <p className="text-sm text-[#71717A]">{profile?.email}</p>
        <div className="flex gap-2 mt-3">
          <span className="bg-[#27272A] px-3 py-1 rounded-full text-xs text-[#71717A]">
            Handicap —
          </span>
          <span className="bg-[#27272A] px-3 py-1 rounded-full text-xs text-[#71717A]">
            Location —
          </span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-[#27272A] rounded-xl p-4 mx-6 mt-6">
        <div className="grid grid-cols-3 divide-x divide-[#3F3F46]">
          <div className="text-center">
            <p className="font-black text-2xl text-[#F3EDE4]">
              {stats.rounds}
            </p>
            <p className="text-xs text-[#71717A] uppercase font-bold mt-1">
              Rounds
            </p>
          </div>
          <div className="text-center">
            <p className="font-black text-2xl text-[#F3EDE4]">
              {stats.avgScore || "—"}
            </p>
            <p className="text-xs text-[#71717A] uppercase font-bold mt-1">
              Avg Score
            </p>
          </div>
          <div className="text-center">
            <p className="font-black text-2xl text-[#D94F2B]">
              {stats.won}
            </p>
            <p className="text-xs text-[#71717A] uppercase font-bold mt-1">
              Won
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      {profile?.subscription_status &&
        profile.subscription_status !== "free" && (
          <div className="bg-[#27272A] rounded-xl p-4 mx-6 mt-4 border-l-4 border-[#D94F2B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-[#D94F2B]">
                  Nassau Pro
                </p>
                <p className="text-sm text-[#71717A] mt-0.5">
                  Founding Member
                </p>
              </div>
              <span className="text-[#0D7377] font-bold text-sm">
                Manage →
              </span>
            </div>
          </div>
        )}

      {/* Settings Sections */}
      <div className="mx-6 mt-6 space-y-6">
        {/* Account */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0D7377]">
            Account
          </h3>
          <div className="mt-2">
            {ACCOUNT_ROWS.map((label) => (
              <div
                key={label}
                className="flex justify-between items-center py-4 border-b border-[#3F3F46]"
              >
                <span className="font-bold text-[#F3EDE4] text-sm">
                  {label}
                </span>
                <ChevronRight className="text-[#71717A] w-4 h-4" />
              </div>
            ))}
          </div>
        </section>

        {/* Game */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0D7377]">
            Game
          </h3>
          <div className="mt-2">
            {GAME_ROWS.map((label) => (
              <div
                key={label}
                className="flex justify-between items-center py-4 border-b border-[#3F3F46]"
              >
                <span className="font-bold text-[#F3EDE4] text-sm">
                  {label}
                </span>
                <ChevronRight className="text-[#71717A] w-4 h-4" />
              </div>
            ))}
          </div>
        </section>

        {/* Payments */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0D7377]">
            Payments
          </h3>
          <div className="mt-2">
            {PAYMENT_ROWS.map((label) => (
              <div
                key={label}
                className="flex justify-between items-center py-4 border-b border-[#3F3F46]"
              >
                <span className="font-bold text-[#F3EDE4] text-sm">
                  {label}
                </span>
                <ChevronRight className="text-[#71717A] w-4 h-4" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sign Out */}
      <div className="mx-6 mt-8">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full border border-[#3F3F46] text-[#71717A] font-black uppercase py-3 rounded-lg hover:border-[#D94F2B] hover:text-[#D94F2B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>

      {/* Bottom Nav — Profile active */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#18181B] border-t border-[#27272A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1"
          >
            <Home className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Home
            </span>
          </Link>
          <Link
            href="/rounds"
            className="flex flex-col items-center gap-1"
          >
            <Trophy className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Rounds
            </span>
          </Link>
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1"
          >
            <Map className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Trips
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1"
          >
            <User className="h-5 w-5 text-[#D94F2B]" />
            <span className="text-xs uppercase font-bold text-[#D94F2B]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
