"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getDestinationImageBySlugOrName } from "@/lib/destination-images";
import { MapPin, Calendar, Users, Check, Loader2 } from "lucide-react";

interface TripMember {
  id: string;
  name: string;
  role: string;
  userId: string | null;
  avatarUrl: string | null;
}

interface TripPreview {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  members: TripMember[];
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "";
  if (!startDate) return endDate;
  if (!endDate) return startDate;
  const s = new Date(startDate + "T12:00:00");
  const e = new Date(endDate + "T12:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return `${startDate} — ${endDate}`;
  }
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const year = s.getFullYear();
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()}–${e.getDate()}, ${year}`;
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${year}`;
}

function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] || "";
}

function initial(name: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [trip, setTrip] = useState<TripPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [maybeLoading, setMaybeLoading] = useState(false);
  const [maybeDone, setMaybeDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invite/${code}`);
      if (!res.ok) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setTrip(await res.json());

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
    sessionStorage.setItem("pendingInvite", code);
    router.push("/login");
  }

  async function handleMaybe() {
    if (!trip) return;
    if (needsLogin) {
      handleLogin();
      return;
    }
    setMaybeLoading(true);
    setError(null);
    const res = await fetch(`/api/trips/${trip.id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "MAYBE" }),
    });
    if (res.status === 401) {
      setNeedsLogin(true);
      setMaybeLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Couldn't save that. Try again?");
      setMaybeLoading(false);
      return;
    }
    setMaybeDone(true);
    setMaybeLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-ink/30" />
          <p className="text-sm text-ink/40">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
        <div className="text-center">
          <h1 className="font-headline text-3xl text-ink">Invalid Invite</h1>
          <p className="mt-2 text-sm text-ink/60">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 inline-block rounded-[10px] bg-nassau px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-nassau/90"
          >
            Go to Nassau
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const captain = trip.members.find((m) => m.role === "CAPTAIN");
  const captainFirstName = firstName(captain?.name || "");
  const heroSrc = trip.destination
    ? getDestinationImageBySlugOrName(trip.destination)
    : "/images/hero-backdrop.png";
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const memberNamesPreview = trip.members
    .slice(0, 3)
    .map((m) => firstName(m.name))
    .filter(Boolean)
    .join(", ");
  const extraMembers = Math.max(0, trip.members.length - 3);

  return (
    <div className="min-h-screen bg-parchment">
      <section className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-ink">
        <Image
          src={heroSrc}
          alt={trip.destination || trip.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 sm:pb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/70">
            You&apos;re invited
          </p>
          <h1 className="mt-2 font-headline text-[36px] leading-tight text-white sm:text-[44px]">
            {trip.name}
          </h1>
          {captainFirstName && (
            <p className="mt-1 text-[14px] text-white/70">
              Hosted by {captainFirstName}
            </p>
          )}
        </div>
      </section>

      <div className="px-4 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            {trip.destination && (
              <div className="flex items-center gap-3 text-[16px] text-ink">
                <MapPin className="h-4 w-4 shrink-0 text-nassau" />
                <span>{trip.destination}</span>
              </div>
            )}
            {dateRange && (
              <div className="flex items-center gap-3 text-[16px] text-ink">
                <Calendar className="h-4 w-4 shrink-0 text-nassau" />
                <span>{dateRange}</span>
              </div>
            )}
            {trip.members.length > 0 && (
              <div className="flex items-center gap-3 text-[16px] text-ink">
                <Users className="h-4 w-4 shrink-0 text-nassau" />
                <span>
                  {trip.members.length} going
                  {memberNamesPreview && (
                    <span className="text-ink/50">
                      {" "}
                      — {memberNamesPreview}
                      {extraMembers > 0 ? ` +${extraMembers}` : ""}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {trip.members.length > 0 && (
            <div className="mt-6 -mx-6 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
              <div className="flex gap-4 pb-1">
                {trip.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex w-[56px] shrink-0 flex-col items-center gap-1.5"
                  >
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nassau text-[14px] font-semibold text-white">
                        {initial(m.name)}
                      </div>
                    )}
                    <span className="w-full truncate text-center text-[11px] text-stone">
                      {firstName(m.name) || m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="my-6 h-px bg-stone/30" />

          {error && (
            <p className="mb-4 text-sm text-[#C4423B]">{error}</p>
          )}

          {maybeDone ? (
            <div className="rounded-[10px] bg-nassau/10 px-4 py-4 text-center text-[14px] text-nassau">
              <Check className="mx-auto mb-1.5 h-5 w-5" />
              Got it — we&apos;ll check in as dates get closer.
            </div>
          ) : (
            <div className="space-y-2.5">
              {needsLogin ? (
                <button
                  onClick={handleLogin}
                  className="flex w-full items-center justify-center rounded-[10px] bg-nassau px-4 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-nassau/90"
                >
                  Sign in to join
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || maybeLoading}
                  className="flex w-full items-center justify-center rounded-[10px] bg-nassau px-4 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-nassau/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>I&apos;m in →</>
                  )}
                </button>
              )}
              <button
                onClick={handleMaybe}
                disabled={joining || maybeLoading}
                className="flex w-full items-center justify-center rounded-[10px] px-4 py-2.5 text-[14px] text-stone transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {maybeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Not sure yet — RSVP Maybe"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
