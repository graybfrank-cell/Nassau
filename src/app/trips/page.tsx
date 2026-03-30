"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Plus, Bell, Home, Trophy, Map, User } from "lucide-react";

interface TripMember {
  user_id: string;
  user: { full_name: string | null; email: string | null } | null;
}

interface Trip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  members: TripMember[];
  created_at: string;
  status?: string;
  amount_paid?: number;
  amount_total?: number;
}

const FILTERS = ["All", "Planning", "Upcoming", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts);
  if (!end) return startStr;
  const e = new Date(end);
  return `${startStr}–${e.toLocaleDateString("en-US", opts)}`;
}

function tripStatus(trip: Trip): string {
  if (trip.status) return trip.status;
  if (!trip.start_date) return "Planning";
  const now = new Date();
  const start = new Date(trip.start_date);
  const end = trip.end_date ? new Date(trip.end_date) : start;
  if (now > end) return "Completed";
  if (now >= start) return "Upcoming";
  return "Upcoming";
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "planning":
      return "bg-[#0D7377] text-white";
    case "confirmed":
    case "upcoming":
      return "bg-[#D94F2B] text-white";
    case "completed":
      return "bg-[#3F3F46] text-[#71717A]";
    default:
      return "bg-[#3F3F46] text-[#71717A]";
  }
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login?redirect=/trips"); return; }
      // Check subscription status
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const status = profile.subscription_status;
          if (status !== "active" && status !== "trialing") {
            router.push("/pricing");
            return;
          }
        }
      } catch {
        // Non-critical — allow access on error
      }
      try {
        const res = await fetch("/api/trips");
        if (res.ok) {
          setTrips(await res.json());
        }
      } catch {
        console.error("[Trips] Failed to fetch trips");
      }
      setLoading(false);
    });
  }, [router]);

  const totalSpent = useMemo(
    () => trips.reduce((sum, t) => sum + (t.amount_paid ?? 0), 0),
    [trips]
  );

  const filteredTrips = useMemo(() => {
    if (activeFilter === "All") return trips;
    return trips.filter(
      (t) => tripStatus(t).toLowerCase() === activeFilter.toLowerCase()
    );
  }, [trips, activeFilter]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#18181B]">
        <p className="text-sm text-[#71717A]">Loading...</p>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-[#18181B] pb-32"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1629293821782-4746e8921c75?q=80&w=2070&auto=format&fit=crop"
          alt="Golf trip planning"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/60 to-dark" />
        <div className="relative z-10 flex h-full items-end px-6 pb-5">
          <div>
            <h1 className="text-[22px] font-medium text-[#F3EDE4] tracking-tight">My Trips</h1>
            <p className="text-[13px] text-[#F3EDE4]/50">
              {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="px-6 mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`text-xs font-black uppercase px-4 py-2 rounded-full whitespace-nowrap ${
              activeFilter === filter
                ? "bg-[#D94F2B] text-white"
                : "border border-[#3F3F46] text-[#71717A]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ── TRIP CARDS ── */}
      <div className="px-6 mt-4 space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="bg-[#27272A] rounded-xl p-8 text-center border border-[#3F3F46]">
            <p className="text-[#71717A] mb-4">No trips yet</p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-[#D94F2B] text-white font-bold text-sm px-5 py-2.5 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Plan Your First Trip
            </Link>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const status = tripStatus(trip);
            const memberCount = trip.members.length;
            const paid = trip.amount_paid ?? 0;
            const total = trip.amount_total ?? 0;
            const paidCount = paid;
            const totalCount = total;
            const progressPct =
              totalCount > 0
                ? Math.min(100, Math.round((paidCount / totalCount) * 100))
                : 0;
            const showProgress =
              (status === "Planning" || status === "Upcoming") && totalCount > 0;

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block bg-[#27272A] rounded-xl overflow-hidden border border-[#3F3F46]"
              >
                {/* Photo area */}
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] h-32 relative overflow-hidden">
                  <span className="font-black text-xl uppercase text-[#F3EDE4] absolute bottom-4 left-4">
                    {trip.name}
                  </span>
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-black uppercase px-2 py-1 rounded ${statusColor(status)}`}
                  >
                    {status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  {(trip.destination || trip.start_date) && (
                    <p className="text-sm text-[#71717A]">
                      {trip.destination}
                      {trip.destination && trip.start_date && " · "}
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                  )}

                  {/* Player row */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      {trip.members.slice(0, 4).map((m, i) => (
                        <div
                          key={m.user_id || i}
                          className="h-6 w-6 rounded-full bg-[#3F3F46] border-2 border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#F3EDE4]"
                        >
                          {(m.user?.full_name || m.user?.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      ))}
                      {memberCount > 4 && (
                        <div className="h-6 w-6 rounded-full bg-[#3F3F46] border-2 border-[#27272A] flex items-center justify-center text-[10px] font-bold text-[#71717A]">
                          +{memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#71717A]">
                      {memberCount} golfer{memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {showProgress && (
                    <>
                      <div className="h-1.5 bg-[#3F3F46] rounded-full mt-3">
                        <div
                          className="h-1.5 bg-[#0D7377] rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#0D7377] mt-1">
                        {paidCount} of {totalCount} paid
                      </p>
                    </>
                  )}

                  <p className="text-[#0D7377] font-bold text-sm mt-2">
                    View Trip →
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── NEW TRIP BUTTON ── */}
      <Link
        href="/trips/new"
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#D94F2B] shadow-lg shadow-[#D94F2B]/30"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#18181B] border-t border-[#27272A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Home</span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Rounds</span>
          </Link>
          <Link href="/trips" className="flex flex-col items-center gap-1">
            <Map className="h-5 w-5 text-[#D94F2B]" />
            <span className="text-xs uppercase font-bold text-[#D94F2B]">Trips</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
