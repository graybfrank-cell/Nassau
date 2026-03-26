"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, MapPin, Users, Calendar, ArrowLeft } from "lucide-react";

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
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts);
  if (!end) return startStr;
  const e = new Date(end);
  return `${startStr} – ${e.toLocaleDateString("en-US", opts)}`;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-400">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Trips</h1>
            <p className="mt-1 text-sm text-zinc-400">Plan and manage your golf getaways.</p>
          </div>
          <Link href="/trips/new" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
            <Plus className="h-4 w-4" />New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="text-4xl">✈️</div>
            <h2 className="mt-4 text-lg font-semibold text-white">No trips yet</h2>
            <p className="mt-2 text-sm text-zinc-400">Plan your first golf trip.<br />Destinations, deposits, and pairings — all in one place.</p>
            <Link href="/trips/new" className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
              <Plus className="h-4 w-4" />Plan Your First Trip
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{trip.name}</h3>
                    {trip.destination && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <MapPin className="h-3.5 w-3.5" />{trip.destination}
                      </div>
                    )}
                    {(trip.start_date || trip.end_date) && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />{formatDateRange(trip.start_date, trip.end_date)}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                      <Users className="h-3.5 w-3.5" />{trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className="text-sm text-zinc-500">View &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
