"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Calendar, Users } from "lucide-react";

interface TripPreview {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  members: { id: string; name: string }[];
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [trip, setTrip] = useState<TripPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function load() {
      // Fetch trip preview (public, no auth needed)
      const res = await fetch(`/api/invite/${code}`);
      if (!res.ok) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setTrip(await res.json());

      // Check if user is logged in
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setNeedsLogin(true);
      }

      setLoading(false);
    }
    load();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    setError(null);

    const res = await fetch(`/api/invite/${code}/join`, { method: "POST" });

    if (res.status === 401) {
      setNeedsLogin(true);
      setJoining(false);
      return;
    }

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setJoining(false);
      return;
    }

    const data = await res.json();
    router.push(`/trips/${data.tripId}`);
  }

  function handleLogin() {
    // Store the invite code so we can redirect back after login
    sessionStorage.setItem("pendingInvite", code);
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900">Invalid Invite</h1>
          <p className="mt-2 text-sm text-zinc-500">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Go to Nassau
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          {/* Branding */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Nassau
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              You&apos;ve been invited to join a trip
            </p>
          </div>

          {/* Trip Info */}
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-5">
            <h2 className="text-lg font-semibold text-zinc-900">{trip.name}</h2>

            {trip.destination && (
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="h-4 w-4" />
                {trip.destination}
              </div>
            )}

            {(trip.startDate || trip.endDate) && (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
                <Calendar className="h-4 w-4" />
                {trip.startDate && trip.endDate
                  ? `${trip.startDate} — ${trip.endDate}`
                  : trip.startDate || trip.endDate}
              </div>
            )}

            {trip.members.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
                <Users className="h-4 w-4" />
                {trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
                <span className="text-zinc-400">
                  ({trip.members.map((m) => m.name).join(", ")})
                </span>
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* Action */}
          <div className="mt-6">
            {needsLogin ? (
              <button
                onClick={handleLogin}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Sign in to join this trip
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join Trip"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
