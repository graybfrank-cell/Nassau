"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Calendar, Users, Check, AlertCircle, Vote, Loader2 } from "lucide-react";

interface TripMember {
  id: string;
  name: string;
  role: string;
  rsvpStatus: string;
  handicap: number;
  userId: string | null;
}

interface PollOption {
  id: string;
  startDate: string;
  endDate: string;
  label: string | null;
  votes: { userId: string; vote: string }[];
}

interface DatePollData {
  id: string;
  status: string;
  deadline: string;
  lockedOptionId: string | null;
  options: PollOption[];
}

interface TripData {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  vibe: string | null;
  shareCode: string;
  members: TripMember[];
  datePoll: DatePollData | null;
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  GOING: { label: "Going", color: "bg-green-100 text-green-700", icon: "\uD83D\uDFE2" },
  MAYBE: { label: "Maybe", color: "bg-yellow-100 text-yellow-700", icon: "\uD83D\uDFE1" },
  DECLINED: { label: "Can't Make It", color: "bg-red-100 text-red-700", icon: "\uD83D\uDD34" },
  PENDING: { label: "Pending", color: "bg-zinc-100 text-zinc-500", icon: "\u2B1C" },
};

function formatCountdown(deadline: string | Date): string {
  const dl = new Date(deadline);
  const now = new Date();
  const diff = dl.getTime() - now.getTime();
  if (diff <= 0) return "Voting closed";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  if (days > 0) return `${days}d ${remainHours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

export default function TripSharePage() {
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [trip, setTrip] = useState<TripData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Poll voting state
  const [draftVotes, setDraftVotes] = useState<Record<string, string>>({});
  const [pollVoting, setPollVoting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const res = await fetch(`/api/trip/${shareCode}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [shareCode]);

  async function handleRSVP(status: "GOING" | "MAYBE" | "DECLINED") {
    if (!trip) return;
    if (!userId) {
      setError("You must be signed in to RSVP.");
      return;
    }

    setRsvpLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trips/${trip.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to RSVP");
      }

      setSuccess(
        status === "GOING"
          ? "You're in! See you on the course."
          : status === "MAYBE"
            ? "Noted as maybe. Update anytime."
            : "No worries. Hope to see you next time!"
      );

      const tripRes = await fetch(`/api/trip/${shareCode}`);
      if (tripRes.ok) {
        const refreshed = await tripRes.json();
        setTrip(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to RSVP");
    }
    setRsvpLoading(false);
  }

  async function handleSubmitPollVotes() {
    if (!trip || !trip.datePoll) return;
    setPollVoting(true);
    setError(null);
    try {
      const votes = Object.entries(draftVotes).map(([option_id, vote]) => ({ option_id, vote }));
      const res = await fetch(`/api/trips/${trip.id}/date-poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cast vote");
      }
      // Refresh
      const tripRes = await fetch(`/api/trip/${shareCode}`);
      if (tripRes.ok) setTrip(await tripRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setPollVoting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">{"\uD83C\uDFCC\uFE0F"}</span>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">
            Trip Not Found
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            This invite link may be expired or invalid.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const goingCount = trip.members.filter((m) => m.rsvpStatus === "GOING").length;
  const totalMembers = trip.members.length;

  const myMember = userId
    ? trip.members.find((m) => m.userId === userId)
    : null;
  const isCaptain = myMember?.role === "CAPTAIN";

  const duration = (() => {
    if (!trip.startDate || !trip.endDate) return null;
    const s = new Date(trip.startDate + "T12:00:00");
    const e = new Date(trip.endDate + "T12:00:00");
    const d = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    if (d <= 0) return null;
    return `${d} night${d !== 1 ? "s" : ""}, ${d + 1} day${d + 1 !== 1 ? "s" : ""}`;
  })();

  const poll = trip.datePoll;
  const pollActive = poll?.status === "active" && new Date(poll.deadline) > new Date();
  const isMember = !!myMember;

  function getMemberNameByUserId(uid: string): string {
    const m = trip?.members.find((m) => m.userId === uid);
    return m?.name?.split(" ")[0] || "?";
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-lg">
        {/* Trip card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <span className="text-4xl">{"\uD83C\uDFCC\uFE0F"}</span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
              {trip.name}
            </h1>
          </div>

          <div className="mt-6 space-y-3">
            {trip.destination && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {trip.destination}
              </div>
            )}
            {(trip.startDate || trip.endDate) && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Calendar className="h-4 w-4 text-zinc-400" />
                {trip.startDate && trip.endDate
                  ? `${trip.startDate} \u2014 ${trip.endDate}`
                  : trip.startDate || trip.endDate}
                {duration && (
                  <span className="text-xs text-zinc-400">({duration})</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Users className="h-4 w-4 text-zinc-400" />
              {goingCount} of {totalMembers} confirmed
            </div>
          </div>

          {/* Errors / Success */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Check className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* RSVP section */}
          {userId ? (
            <div className="mt-6">
              {isCaptain ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
                  You&apos;re the captain of this trip &mdash; you&apos;re locked in as Going!
                </div>
              ) : (
                <>
                  {myMember && myMember.rsvpStatus !== "PENDING" && (
                    <p className="mb-3 text-center text-sm text-zinc-500">
                      Your current status:{" "}
                      <span className="font-medium">
                        {STATUS_BADGE[myMember.rsvpStatus]?.label || myMember.rsvpStatus}
                      </span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRSVP("GOING")}
                      disabled={rsvpLoading}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        myMember?.rsvpStatus === "GOING"
                          ? "bg-green-600 text-white"
                          : "border border-green-300 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {rsvpLoading ? "..." : "I'm In!"}
                    </button>
                    <button
                      onClick={() => handleRSVP("MAYBE")}
                      disabled={rsvpLoading}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        myMember?.rsvpStatus === "MAYBE"
                          ? "bg-yellow-500 text-white"
                          : "border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      }`}
                    >
                      {rsvpLoading ? "..." : "Maybe"}
                    </button>
                    <button
                      onClick={() => handleRSVP("DECLINED")}
                      disabled={rsvpLoading}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        myMember?.rsvpStatus === "DECLINED"
                          ? "bg-red-600 text-white"
                          : "border border-red-300 text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {rsvpLoading ? "..." : "Can't Make It"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="mb-3 text-sm text-zinc-500">
                Sign in to RSVP for this trip.
              </p>
              <Link
                href={`/login?returnTo=/trip/${shareCode}`}
                className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Sign Up to RSVP
              </Link>
            </div>
          )}
        </div>

        {/* Date Poll Section */}
        {poll && poll.status !== "locked" && poll.options.length > 0 && (
          <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-semibold text-zinc-900">Vote on Trip Dates</h2>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                pollActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
              }`}>
                {pollActive ? formatCountdown(poll.deadline) : "Voting closed"}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {poll.options.map((opt, idx) => {
                const startDate = new Date(opt.startDate);
                const endDate = new Date(opt.endDate);
                const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const startDay = startDate.toLocaleDateString("en-US", { weekday: "short" });
                const endDay = endDate.toLocaleDateString("en-US", { weekday: "short" });
                const currentVote = draftVotes[opt.id] || "";

                const yesVotes = opt.votes.filter((v) => v.vote === "yes");
                const maybeVotes = opt.votes.filter((v) => v.vote === "maybe");
                const noVotes = opt.votes.filter((v) => v.vote === "no");

                return (
                  <div key={opt.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {startStr} — {endStr}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {startDay}–{endDay} · {nights} night{nights !== 1 ? "s" : ""}
                          {opt.label ? ` · "${opt.label}"` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Vote buttons — only for logged-in members during active poll */}
                    {pollActive && isMember && userId && (
                      <div className="mt-2 flex gap-2">
                        {[
                          { value: "yes", label: "Works", emoji: "\u2705", bg: "bg-green-50 text-green-700 border-green-200", active: "bg-green-100 ring-2 ring-green-500/30" },
                          { value: "maybe", label: "Maybe", emoji: "\u26A0\uFE0F", bg: "bg-yellow-50 text-yellow-700 border-yellow-200", active: "bg-yellow-100 ring-2 ring-yellow-500/30" },
                          { value: "no", label: "Can't", emoji: "\u274C", bg: "bg-red-50 text-red-700 border-red-200", active: "bg-red-100 ring-2 ring-red-500/30" },
                        ].map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => setDraftVotes((prev) => ({ ...prev, [opt.id]: btn.value }))}
                            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                              currentVote === btn.value ? btn.active : `${btn.bg} hover:opacity-80`
                            }`}
                          >
                            {btn.emoji} {btn.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Voter badges */}
                    {opt.votes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {yesVotes.map((v) => (
                          <span key={v.userId} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            {"\u2705"} {getMemberNameByUserId(v.userId)}
                          </span>
                        ))}
                        {maybeVotes.map((v) => (
                          <span key={v.userId} className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                            {"\u26A0\uFE0F"} {getMemberNameByUserId(v.userId)}
                          </span>
                        ))}
                        {noVotes.map((v) => (
                          <span key={v.userId} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            {"\u274C"} {getMemberNameByUserId(v.userId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit votes */}
            {pollActive && isMember && userId && Object.keys(draftVotes).length > 0 && (
              <button
                onClick={handleSubmitPollVotes}
                disabled={pollVoting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
              >
                {pollVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {pollVoting ? "Submitting..." : "Submit Votes"}
              </button>
            )}

            {/* Not logged in CTA */}
            {!userId && pollActive && (
              <div className="mt-4 text-center">
                <Link
                  href={`/login?returnTo=/trip/${shareCode}`}
                  className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Sign In to Vote
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Who's going */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-600">The Crew</h2>
          <div className="mt-3 space-y-2">
            {trip.members.map((m) => {
              const badge = STATUS_BADGE[m.rsvpStatus] || STATUS_BADGE.PENDING;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      {m.name}
                    </span>
                    {m.role === "CAPTAIN" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Captain
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
                  >
                    {badge.icon} {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
