"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTrips, deleteTrip } from "@/lib/store";
import { Trip } from "@/lib/types";
import { Plus, MapPin, Users, Calendar, Trash2, ClipboardList, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Check for pending invite redirect
        const pendingInvite = sessionStorage.getItem("pendingInvite");
        if (pendingInvite) {
          sessionStorage.removeItem("pendingInvite");
          router.push(`/invite/${pendingInvite}`);
          return;
        }

        setTrips(await getTrips());
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              My Trips
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Plan and manage your golf getaways.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/scorecards"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <ClipboardList className="h-4 w-4" />
              Scorecards
            </Link>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
          </div>
        </div>

        {/* Trip List */}
        {trips.length === 0 ? (
          <div className="mt-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-zinc-300" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">
              No trips yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Create your first golf trip to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Delete trip"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link href={`/trips/${trip.id}`} className="block">
                  <h3 className="font-semibold text-zinc-900">{trip.name}</h3>
                  {trip.destination && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.destination}
                    </div>
                  )}
                  {(trip.startDate || trip.endDate) && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {trip.startDate && trip.endDate
                        ? `${trip.startDate} \u2014 ${trip.endDate}`
                        : trip.startDate || trip.endDate}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                    <Users className="h-3.5 w-3.5" />
                    {trip.members.length} member
                    {trip.members.length !== 1 ? "s" : ""}
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
