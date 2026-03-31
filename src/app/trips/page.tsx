"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Plus, Home, Trophy, Map, User } from "lucide-react";
import TopBar from "@/components/TopBar";

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
      return "bg-[#2D5A3D] text-white";
    case "confirmed":
    case "upcoming":
      return "bg-[#2D5A3D] text-white";
    case "completed":
      return "bg-[#2A2A2A] text-[#8A8A8A]";
    default:
      return "bg-[#2A2A2A] text-[#8A8A8A]";
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
      <div className="flex min-h-screen items-center justify-center bg-[#111111]">
        <p className="text-sm text-[#8A8A8A]">Loading...</p>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-[#111111] pb-32"
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex flex-col h-full">
          <TopBar />
          <div className="mt-auto px-6 pb-5">
            <h1 className="text-[22px] font-headline font-medium text-[#F2F0EB] tracking-tight">My Trips</h1>
            <p className="text-[13px] text-[#8A8A8A]">
              {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── EXPLORE CTA ── */}
      <div className="px-6 mt-4">
        <Link
          href="/explore"
          className="flex items-center justify-between rounded-[10px] border border-[#2D5A3D]/20 bg-[#2D5A3D]/[0.06] p-4"
        >
          <div>
            <p className="text-sm font-semibold text-[#F2F0EB]">Explore 50+ golf destinations</p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">Browse curated trips and start planning</p>
          </div>
          <span className="text-[#2D5A3D] text-lg font-bold">→</span>
        </Link>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="px-6 mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`text-xs font-semibold uppercase px-4 py-2 rounded-full whitespace-nowrap ${
              activeFilter === filter
                ? "bg-[#2D5A3D] text-white"
                : "border border-[#2A2A2A] text-[#8A8A8A]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ── TRIP CARDS ── */}
      <div className="px-6 mt-4 space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-[10px] p-8 text-center shadow-sm">
            <p className="text-[#8A8A8A] mb-4">No trips yet</p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-[#2D5A3D] text-white font-bold text-sm px-5 py-2.5 rounded-lg"
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
                className="block bg-[#1A1A1A] rounded-[10px] overflow-hidden shadow-sm"
              >
                {/* Photo area */}
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] h-32 relative overflow-hidden">
                  <span className="font-headline font-medium text-xl uppercase text-[#F2F0EB] absolute bottom-4 left-4">
                    {trip.name}
                  </span>
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-semibold uppercase px-2 py-1 rounded ${statusColor(status)}`}
                  >
                    {status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4">
                  {(trip.destination || trip.start_date) && (
                    <p className="text-sm text-[#8A8A8A]">
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
                          className="h-6 w-6 rounded-full bg-[#2F4F4F] border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-[#F2F0EB]"
                        >
                          {(m.user?.full_name || m.user?.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      ))}
                      {memberCount > 4 && (
                        <div className="h-6 w-6 rounded-full bg-[#2F4F4F] border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-[#8A8A8A]">
                          +{memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#8A8A8A]">
                      {memberCount} golfer{memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {showProgress && (
                    <>
                      <div className="h-1.5 bg-[#2A2A2A] rounded-full mt-3">
                        <div
                          className="h-1.5 bg-[#2D5A3D] rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#2D5A3D] mt-1">
                        {paidCount} of {totalCount} paid
                      </p>
                    </>
                  )}

                  <p className="text-[#2D5A3D] font-bold text-sm mt-2">
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
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#2D5A3D] shadow-lg shadow-[#2D5A3D]/30"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <Home className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">Home</span>
          </Link>
          <Link href="/rounds" className="flex flex-col items-center gap-1">
            <Trophy className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">Rounds</span>
          </Link>
          <Link href="/trips" className="flex flex-col items-center gap-1">
            <Map className="h-5 w-5 text-[#2D5A3D]" />
            <span className="text-xs uppercase font-bold text-[#2D5A3D]">Trips</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1">
            <User className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
