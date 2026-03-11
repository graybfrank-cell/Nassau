"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrips, createTrip, deleteTrip } from "@/lib/store";
import { getGameRounds } from "@/lib/game-store";
import { Trip, GameRound } from "@/lib/types";
import { Plus, MapPin, Users, Calendar, Trash2, AlertCircle, Trophy } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentRounds, setRecentRounds] = useState<GameRound[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const pendingInvite = sessionStorage.getItem("pendingInvite");
        if (pendingInvite) {
          sessionStorage.removeItem("pendingInvite");
          router.push(`/invite/${pendingInvite}`);
          return;
        }
        const [t, r] = await Promise.all([getTrips(), getGameRounds()]);
        setTrips(t);
        setRecentRounds(r.slice(0, 3));
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

  async function refresh() {
    const [t, r] = await Promise.all([getTrips(), getGameRounds()]);
    setTrips(t);
    setRecentRounds(r.slice(0, 3));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await createTrip({ name: name.trim(), destination: destination.trim(), startDate, endDate });
      setName(""); setDestination(""); setStartDate(""); setEndDate("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
    }
  }

  async function handleDelete(tripId: string) {
    setError(null);
    try {
      await deleteTrip(tripId);
      setTrips(await getTrips());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Trips</h1>
            <p className="mt-1 text-sm text-zinc-400">Plan and manage your golf getaways.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/rounds/new" className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800">
              <Trophy className="h-4 w-4" />
              Quick Round
            </Link>
            <Link href="/trips/new" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Create a New Trip</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Trip Name *", value: name, setter: setName, placeholder: "Scottsdale 2026", required: true },
                { label: "Destination", value: destination, setter: setDestination, placeholder: "Scottsdale, AZ", required: false },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
                  <input type="text" required={field.required} value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder}
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20" />
                </div>
              ))}
              {[
                { label: "Start Date", value: startDate, setter: setStartDate },
                { label: "End Date", value: endDate, setter: setEndDate },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-zinc-300">{field.label}</label>
                  <input type="date" value={field.value} onChange={(e) => field.setter(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/20" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "#D94F2B" }}>
                Create Trip
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800">
                Cancel
              </button>
            </div>
          </form>
        )}

        {recentRounds.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Rounds</h2>
              <Link href="/rounds" className="text-sm font-medium text-[#D94F2B] hover:text-[#B83D25]">
                View All &rarr;
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {recentRounds.map((round) => {
                const bestScore = round.scorecards
                  .filter((sc: any) => sc.total && sc.total > 0)
                  .sort((a: any, b: any) => (a.total || 999) - (b.total || 999))[0];
                return (
                  <Link key={round.id} href={`/rounds/${round.id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-shadow hover:border-zinc-700">
                    <p className="text-sm font-semibold text-white">{round.courseName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(round.teeTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {bestScore && (
                      <p className="mt-1 text-xs text-[#D94F2B]">Low: {bestScore.total}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="mt-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-zinc-700" />
            <h2 className="mt-4 text-lg font-semibold text-white">No trips yet</h2>
            <p className="mt-2 text-sm text-zinc-400">Create your first golf trip to get started.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "#D94F2B" }}>
              <Plus className="h-4 w-4" />
              New Trip
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <div key={trip.id} className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:shadow-lg">
                <button onClick={() => handleDelete(trip.id)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-600 opacity-0 transition-all hover:bg-red-950 hover:text-red-500 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link href={`/trips/${trip.id}`} className="block">
                  <h3 className="font-semibold text-white">{trip.name}</h3>
                  {trip.destination && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.destination}
                    </div>
                  )}
                  {(trip.startDate || trip.endDate) && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {trip.startDate && trip.endDate ? `${trip.startDate} — ${trip.endDate}` : trip.startDate || trip.endDate}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
