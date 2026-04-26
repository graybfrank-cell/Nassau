"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getDestinationImageBySlugOrName } from "@/lib/destination-images";
import {
  MapPin,
  Calendar,
  Users,
  Check,
  AlertCircle,
  Vote,
  Loader2,
  Clock,
  ChevronRight,
} from "lucide-react";

interface TripMember {
  id: string;
  name: string;
  role: string;
  rsvpStatus: string;
  handicap: number;
  userId: string | null;
}

interface ScheduleItem {
  date: string;
  title: string;
  type: string;
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
  unlocked: boolean;
  groupSizeTarget: number | null;
  members: TripMember[];
  schedule: ScheduleItem[];
  datePoll: DatePollData | null;
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return startDate || endDate || "";
  const s = new Date(startDate + "T12:00:00");
  const e = new Date(endDate + "T12:00:00");
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const sDay = s.getDate();
  const eDay = e.getDate();
  const year = s.getFullYear();
  if (sMonth === eMonth) {
    return `${sMonth} ${sDay}-${eDay}, ${year}`;
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`;
}

function getDaysUntil(startDate: string): number | null {
  if (!startDate) return null;
  const s = new Date(startDate + "T12:00:00");
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = Math.ceil((s.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function getNightsAndDays(
  startDate: string,
  endDate: string
): { nights: number; days: number } | null {
  if (!startDate || !endDate) return null;
  const s = new Date(startDate + "T12:00:00");
  const e = new Date(endDate + "T12:00:00");
  const nights = Math.round(
    (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights <= 0) return null;
  return { nights, days: nights + 1 };
}

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
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [trip, setTrip] = useState<TripData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Poll voting state
  const [draftVotes, setDraftVotes] = useState<Record<string, string>>({});
  const [pollVoting, setPollVoting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      // Redirect to login, come back after
      router.push(`/login?returnTo=/trip/${shareCode}`);
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
      const votes = Object.entries(draftVotes).map(([option_id, vote]) => ({
        option_id,
        vote,
      }));
      const res = await fetch(`/api/trips/${trip.id}/date-poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cast vote");
      }
      const tripRes = await fetch(`/api/trip/${shareCode}`);
      if (tripRes.ok) setTrip(await tripRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setPollVoting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]/30" />
          <p className="text-sm text-[#1A1A1A]/40">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <AlertCircle className="h-8 w-8 text-[#C4423B]" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-[#1A1A1A]">
            Trip Not Found
          </h1>
          <p className="mt-2 text-sm text-[#1A1A1A]/50">
            This invite link may be expired or invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-[10px] bg-[#2D5A3D] px-6 py-3 text-sm font-semibold text-[#F2F0EB] hover:bg-[#244A32] transition-colors"
          >
            Go to Nassau
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  if (!trip.unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB] px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Clock className="h-8 w-8 text-[#1A1A1A]/40" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-[#1A1A1A]">
            This trip is still being planned
          </h1>
          <p className="mt-2 text-sm text-[#1A1A1A]/50">
            The captain hasn&apos;t shared this trip yet. Check back soon.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-[10px] bg-[#2D5A3D] px-6 py-3 text-sm font-semibold text-[#F2F0EB] hover:bg-[#244A32] transition-colors"
          >
            Go to Nassau
          </Link>
        </div>
      </div>
    );
  }

  const goingCount = trip.members.filter((m) => m.rsvpStatus === "GOING").length;
  const totalMembers = trip.members.length;
  const targetSize = trip.groupSizeTarget || totalMembers;

  const myMember = userId
    ? trip.members.find((m) => m.userId === userId)
    : null;
  const isCaptain = myMember?.role === "CAPTAIN";
  const isMember = !!myMember;

  const daysUntil = getDaysUntil(trip.startDate);
  const duration = getNightsAndDays(trip.startDate, trip.endDate);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  const teeTimeCount = trip.schedule.filter(
    (s) => s.type === "tee_time"
  ).length;

  // Group schedule items by date for itinerary preview
  const scheduleByDate = trip.schedule.reduce(
    (acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    },
    {} as Record<string, ScheduleItem[]>
  );
  const scheduleDates = Object.keys(scheduleByDate).sort();

  const poll = trip.datePoll;
  const pollActive =
    poll?.status === "active" && new Date(poll.deadline) > new Date();

  function getMemberNameByUserId(uid: string): string {
    const m = trip?.members.find((m) => m.userId === uid);
    return m?.name?.split(" ")[0] || "?";
  }

  // Sort members: captain first, then going, then pending, then rest
  const sortedMembers = [...trip.members].sort((a, b) => {
    if (a.role === "CAPTAIN") return -1;
    if (b.role === "CAPTAIN") return 1;
    const order: Record<string, number> = {
      GOING: 0,
      MAYBE: 1,
      PENDING: 2,
      DECLINED: 3,
    };
    return (order[a.rsvpStatus] ?? 2) - (order[b.rsvpStatus] ?? 2);
  });

  return (
    <div className="min-h-screen bg-[#F2F0EB]">
      {/* A. Hero Banner */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-[#1A1A1A]">
        {trip.destination && (
          <Image
            src={getDestinationImageBySlugOrName(trip.destination)}
            alt={trip.destination}
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8">
          <h1 className="text-[24px] font-headline font-medium text-white leading-tight">
            {trip.name}
          </h1>
          <p className="mt-1 text-[14px] text-white/70">
            {[trip.destination, dateRange].filter(Boolean).join(" \u00B7 ")}
          </p>
          {daysUntil && (
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[12px] font-medium text-white">
              <Clock className="h-3 w-3" />
              {daysUntil} days away
            </span>
          )}
        </div>
      </div>

      {/* B. Trip Info Card */}
      <div className="bg-white rounded-[10px] shadow-sm mx-5 -mt-6 relative z-10 p-5">
        <div className="grid grid-cols-2 gap-3">
          {teeTimeCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A3D]/10">
                <span className="text-[14px]">&#9971;</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A]">
                  {teeTimeCount} round{teeTimeCount !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-[#1A1A1A]/40">planned</p>
              </div>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A3D]/10">
                <Calendar className="h-4 w-4 text-[#2D5A3D]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A]">
                  {duration.days} day{duration.days !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-[#1A1A1A]/40">
                  {duration.nights} night{duration.nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A3D]/10">
              <Users className="h-4 w-4 text-[#2D5A3D]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1A1A1A]">
                {targetSize} golfer{targetSize !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-[#1A1A1A]/40">invited</p>
            </div>
          </div>
          {trip.destination && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D5A3D]/10">
                <MapPin className="h-4 w-4 text-[#2D5A3D]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                  {trip.destination}
                </p>
                <p className="text-[11px] text-[#1A1A1A]/40">destination</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* C. Who's In (Social Proof) */}
      <div className="bg-white rounded-[10px] shadow-sm mx-5 mt-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
            Who&apos;s In
          </h2>
          <span className="text-[12px] font-medium text-[#2D5A3D]">
            {goingCount} of {targetSize} committed
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[#1A1A1A]/5 mb-4">
          <div
            className="h-1.5 rounded-full bg-[#2D5A3D] transition-all duration-500"
            style={{
              width: `${Math.min(100, (goingCount / targetSize) * 100)}%`,
            }}
          />
        </div>
        <div className="space-y-1">
          {sortedMembers.map((m) => {
            const isGoing = m.rsvpStatus === "GOING";
            const isPending =
              m.rsvpStatus === "PENDING" || m.rsvpStatus === "MAYBE";
            const isDeclined = m.rsvpStatus === "DECLINED";
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                      isGoing
                        ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
                        : isPending
                          ? "bg-[#1A1A1A]/5 text-[#1A1A1A]/30"
                          : "bg-red-50 text-red-400"
                    }`}
                  >
                    {isGoing ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isPending ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : (
                      "\u2014"
                    )}
                  </span>
                  <span
                    className={`text-[14px] font-medium ${
                      isGoing
                        ? "text-[#1A1A1A]"
                        : isDeclined
                          ? "text-[#1A1A1A]/30 line-through"
                          : "text-[#1A1A1A]/60"
                    }`}
                  >
                    {m.name}
                  </span>
                  {m.role === "CAPTAIN" && (
                    <span className="rounded-full bg-[#B8976A]/15 px-2 py-0.5 text-[10px] font-semibold text-[#B8976A]">
                      Captain
                    </span>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isGoing
                      ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
                      : isPending
                        ? "bg-[#1A1A1A]/5 text-[#1A1A1A]/40"
                        : "bg-red-50 text-red-400"
                  }`}
                >
                  {isGoing
                    ? "Going"
                    : m.rsvpStatus === "MAYBE"
                      ? "Maybe"
                      : isPending
                        ? "Pending"
                        : "Declined"}
                </span>
              </div>
            );
          })}
          {/* "You?" placeholder for non-members */}
          {!isMember && !userId && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 border border-dashed border-[#2D5A3D]/30">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2D5A3D]/10 text-[#2D5A3D]">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
                <span className="text-[15px] font-semibold text-[#2D5A3D]">
                  You?
                </span>
              </div>
              <span className="text-[11px] text-[#1A1A1A]/30">&mdash;</span>
            </div>
          )}
        </div>
      </div>

      {/* D. Itinerary Preview */}
      {scheduleDates.length > 0 && (
        <div className="bg-white rounded-[10px] shadow-sm mx-5 mt-4 p-5">
          <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C] mb-4">
            The Plan
          </h2>
          <div className="space-y-3">
            {scheduleDates.map((date, idx) => {
              const items = scheduleByDate[date];
              const d = new Date(date + "T12:00:00");
              const dayLabel = `Day ${idx + 1}`;
              const dateLabel = d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] font-bold text-[#2D5A3D]">
                      {dayLabel}
                    </span>
                    <span className="text-[11px] text-[#1A1A1A]/30">
                      {dateLabel}
                    </span>
                  </div>
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 pl-4 py-1"
                    >
                      <span className="text-[12px]">
                        {item.type === "tee_time"
                          ? "\u26F3"
                          : item.type === "dinner"
                            ? "\uD83C\uDF7D\uFE0F"
                            : item.type === "travel"
                              ? "\u2708\uFE0F"
                              : item.type === "lodging"
                                ? "\uD83C\uDFE8"
                                : item.type === "entertainment"
                                  ? "\uD83C\uDF89"
                                  : "\u2022"}
                      </span>
                      <span className="text-[13px] text-[#1A1A1A]/80">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Poll Section */}
      {poll && poll.status !== "locked" && poll.options.length > 0 && (
        <div className="bg-white rounded-[10px] shadow-sm mx-5 mt-4 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-[#2D5A3D]" />
              <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
                Vote on Dates
              </h2>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                pollActive
                  ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
                  : "bg-[#1A1A1A]/5 text-[#1A1A1A]/40"
              }`}
            >
              {pollActive ? formatCountdown(poll.deadline) : "Voting closed"}
            </span>
          </div>

          <div className="space-y-3">
            {poll.options.map((opt, idx) => {
              const startDate = new Date(opt.startDate);
              const endDate = new Date(opt.endDate);
              const nights = Math.round(
                (endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const startStr = startDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const endStr = endDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const startDay = startDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const endDay = endDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const currentVote = draftVotes[opt.id] || "";
              const yesVotes = opt.votes.filter((v) => v.vote === "yes");
              const maybeVotes = opt.votes.filter((v) => v.vote === "maybe");
              const noVotes = opt.votes.filter((v) => v.vote === "no");

              return (
                <div
                  key={opt.id}
                  className="rounded-lg border border-[#1A1A1A]/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2D5A3D]/10 text-[11px] font-bold text-[#2D5A3D]">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">
                        {startStr} &mdash; {endStr}
                      </p>
                      <p className="text-[11px] text-[#1A1A1A]/40">
                        {startDay}&ndash;{endDay} &middot; {nights} night
                        {nights !== 1 ? "s" : ""}
                        {opt.label ? ` \u00B7 "${opt.label}"` : ""}
                      </p>
                    </div>
                  </div>

                  {pollActive && isMember && userId && (
                    <div className="mt-2 flex gap-2">
                      {[
                        {
                          value: "yes",
                          label: "Works",
                          bg: "bg-[#2D5A3D]/5 text-[#2D5A3D] border-[#2D5A3D]/20",
                          active:
                            "bg-[#2D5A3D]/15 ring-2 ring-[#2D5A3D]/30 text-[#2D5A3D]",
                        },
                        {
                          value: "maybe",
                          label: "Maybe",
                          bg: "bg-yellow-50 text-yellow-700 border-yellow-200",
                          active:
                            "bg-yellow-100 ring-2 ring-yellow-500/30 text-yellow-700",
                        },
                        {
                          value: "no",
                          label: "Can't",
                          bg: "bg-red-50 text-red-500 border-red-200",
                          active:
                            "bg-red-100 ring-2 ring-red-500/30 text-red-600",
                        },
                      ].map((btn) => (
                        <button
                          key={btn.value}
                          onClick={() =>
                            setDraftVotes((prev) => ({
                              ...prev,
                              [opt.id]: btn.value,
                            }))
                          }
                          className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-all min-h-[44px] ${
                            currentVote === btn.value
                              ? btn.active
                              : `${btn.bg} hover:opacity-80`
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {opt.votes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {yesVotes.map((v) => (
                        <span
                          key={v.userId}
                          className="rounded-full bg-[#2D5A3D]/10 px-2 py-0.5 text-[10px] font-medium text-[#2D5A3D]"
                        >
                          {getMemberNameByUserId(v.userId)}
                        </span>
                      ))}
                      {maybeVotes.map((v) => (
                        <span
                          key={v.userId}
                          className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700"
                        >
                          {getMemberNameByUserId(v.userId)}
                        </span>
                      ))}
                      {noVotes.map((v) => (
                        <span
                          key={v.userId}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-500"
                        >
                          {getMemberNameByUserId(v.userId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pollActive && isMember && userId && Object.keys(draftVotes).length > 0 && (
            <button
              onClick={handleSubmitPollVotes}
              disabled={pollVoting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2D5A3D] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#244A32] disabled:opacity-50 min-h-[44px]"
            >
              {pollVoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {pollVoting ? "Submitting..." : "Submit Votes"}
            </button>
          )}

          {!userId && pollActive && (
            <div className="mt-4 text-center">
              <Link
                href={`/login?returnTo=/trip/${shareCode}`}
                className="inline-block rounded-[10px] bg-[#2D5A3D] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#244A32] transition-colors"
              >
                Sign In to Vote
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Errors / Success */}
      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-[10px] bg-[#2D5A3D]/10 border border-[#2D5A3D]/20 px-4 py-3 text-[13px] text-[#2D5A3D]">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* E. CTA Section */}
      <div className="mx-5 mt-6">
        {userId ? (
          isCaptain ? (
            <div className="rounded-[10px] bg-[#B8976A]/10 border border-[#B8976A]/20 px-5 py-4 text-center">
              <p className="text-[14px] font-semibold text-[#B8976A]">
                You&apos;re the captain &mdash; you&apos;re locked in!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myMember && myMember.rsvpStatus !== "PENDING" && (
                <p className="text-center text-[13px] text-[#1A1A1A]/50">
                  Your status:{" "}
                  <span className="font-semibold">
                    {myMember.rsvpStatus === "GOING"
                      ? "Going"
                      : myMember.rsvpStatus === "MAYBE"
                        ? "Maybe"
                        : myMember.rsvpStatus === "DECLINED"
                          ? "Declined"
                          : myMember.rsvpStatus}
                  </span>
                </p>
              )}
              <button
                onClick={() => handleRSVP("GOING")}
                disabled={rsvpLoading}
                className={`w-full rounded-[10px] py-4 text-[18px] font-bold transition-colors disabled:opacity-50 shadow-lg ${
                  myMember?.rsvpStatus === "GOING"
                    ? "bg-[#2D5A3D] text-white"
                    : "bg-[#2D5A3D] text-[#F2F0EB] hover:bg-[#244A32]"
                }`}
              >
                {rsvpLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : myMember?.rsvpStatus === "GOING" ? (
                  "You're In!"
                ) : (
                  "I'M IN"
                )}
              </button>
              {myMember?.rsvpStatus !== "GOING" && (
                <p className="text-[12px] text-[#1A1A1A]/40 text-center">
                  Free to join
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRSVP("MAYBE")}
                  disabled={rsvpLoading}
                  className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 border ${
                    myMember?.rsvpStatus === "MAYBE"
                      ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                      : "border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:bg-[#1A1A1A]/5"
                  }`}
                >
                  Maybe
                </button>
                <button
                  onClick={() => handleRSVP("DECLINED")}
                  disabled={rsvpLoading}
                  className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 border ${
                    myMember?.rsvpStatus === "DECLINED"
                      ? "bg-red-50 border-red-300 text-red-600"
                      : "border-[#1A1A1A]/10 text-[#1A1A1A]/40 hover:bg-[#1A1A1A]/5"
                  }`}
                >
                  Can&apos;t Make It
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-2">
            <Link
              href={`/login?returnTo=/trip/${shareCode}`}
              className="flex w-full items-center justify-center rounded-[10px] bg-[#2D5A3D] py-4 text-[18px] font-bold text-[#F2F0EB] shadow-lg hover:bg-[#244A32] transition-colors"
            >
              I&apos;M IN
            </Link>
            <p className="text-[12px] text-[#1A1A1A]/40 text-center">
              Free to join
            </p>
            <button
              onClick={() => router.push(`/login?returnTo=/trip/${shareCode}&action=decline`)}
              className="w-full text-center text-[13px] text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50 transition-colors py-2"
            >
              Can&apos;t make it? Decline
            </button>
          </div>
        )}
      </div>

      {/* F. Footer */}
      <div className="text-center mt-8 pb-8">
        <p className="text-[12px] text-[#1A1A1A]/30">
          Powered by{" "}
          <span className="font-semibold">Nassau</span> &mdash; The operating
          system for golf trips.
        </p>
        <p className="text-[11px] text-[#1A1A1A]/20 mt-1">nassau.golf</p>
      </div>
    </div>
  );
}
