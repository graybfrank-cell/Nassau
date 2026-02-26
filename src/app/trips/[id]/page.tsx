"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getTrip,
  updateTrip,
  addMember,
  removeMember,
  addItineraryItem,
  removeItineraryItem,
  updateItineraryItem,
  getExpenses,
  getRounds,
  getSkinsGames,
  getScorecards,
} from "@/lib/store";
import { Trip, Lodging, ScheduleItem, Scorecard, Round, SkinsGame } from "@/lib/types";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Shuffle,
  Trophy,
  Plus,
  X,
  ChevronRight,
  Link2,
  Check,
  ClipboardList,
  Medal,
  Hotel,
  CalendarDays,
  Clock,
  Pencil,
  MapPin,
  Phone,
  Hash,
  Trash2,
  PlaneTakeoff,
  PlaneLanding,
  AlertCircle,
  Mail,
  Send,
  RotateCw,
  Globe,
  ExternalLink,
  CheckCircle2,
  Circle,
} from "lucide-react";
import RoundHub from "@/components/RoundHub";

const SCHEDULE_TYPES = [
  { value: "tee_time", label: "Tee Time", color: "bg-emerald-100 text-emerald-700" },
  { value: "dinner", label: "Dinner", color: "bg-rose-100 text-rose-700" },
  { value: "activity", label: "Activity", color: "bg-blue-100 text-blue-700" },
  { value: "travel", label: "Travel", color: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", color: "bg-zinc-100 text-zinc-700" },
] as const;

const EMPTY_LODGING: Lodging = {
  name: "",
  address: "",
  checkIn: "",
  checkOut: "",
  confirmationNumber: "",
  phone: "",
  notes: "",
};

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [expenseCount, setExpenseCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [skinsCount, setSkinsCount] = useState(0);
  const [scorecardCount, setScorecardCount] = useState(0);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [skinsGames, setSkinsGames] = useState<SkinsGame[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberHandicap, setMemberHandicap] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Travel
  const [editingTravel, setEditingTravel] = useState(false);
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");

  // Lodging
  const [editingLodging, setEditingLodging] = useState(false);
  const [lodgingForm, setLodgingForm] = useState<Lodging>(EMPTY_LODGING);

  // Schedule
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventType, setEventType] = useState<ScheduleItem["type"]>("tee_time");
  const [error, setError] = useState<string | null>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await refresh();
    })().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function refresh() {
    const t = await getTrip(tripId);
    if (t) {
      setTrip(t);
      setLodgingForm(t.lodging);
      setArrivalTime(t.arrivalTime);
      setDepartureTime(t.departureTime);
      const [expenses, rds, skins, sc] = await Promise.all([
        getExpenses(tripId),
        getRounds(tripId),
        getSkinsGames(tripId),
        getScorecards({ tripId }),
      ]);
      setExpenseCount(expenses.length);
      setRounds(rds);
      setRoundCount(rds.length);
      setSkinsGames(skins);
      setSkinsCount(skins.length);
      setScorecardCount(sc.length);
      setScorecards(sc);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !memberName.trim()) return;
    setError(null);
    try {
      await addMember(tripId, {
        name: memberName.trim(),
        handicap: parseInt(memberHandicap) || 0,
      });
      setMemberName("");
      setMemberHandicap("");
      setShowAddMember(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function handleShareInvite() {
    setInviteLoading(true);
    let code = trip?.inviteCode;
    if (!code) {
      const res = await fetch(`/api/trips/${tripId}/invite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        code = data.inviteCode;
        await refresh();
      }
    }
    if (code) {
      const link = `${window.location.origin}/invite/${code}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setInviteLoading(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!trip) return;
    setError(null);
    try {
      await removeMember(tripId, memberId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function handleSaveTravel(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateTrip(tripId, { arrivalTime, departureTime } as Partial<Trip>);
      setEditingTravel(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save travel info");
    }
  }

  async function handleSaveLodging(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateTrip(tripId, { lodging: lodgingForm } as Partial<Trip>);
      setEditingLodging(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lodging");
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !eventTitle.trim()) return;
    setError(null);
    try {
      await addItineraryItem(tripId, {
        date: eventDate,
        time: eventTime,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        type: eventType,
      });
      setEventDate("");
      setEventTime("");
      setEventTitle("");
      setEventDesc("");
      setEventType("tee_time");
      setShowAddEvent(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!trip) return;
    setError(null);
    try {
      await removeItineraryItem(tripId, eventId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  async function handleToggleBooking(eventId: string, currentStatus: string) {
    if (!trip) return;
    setError(null);
    try {
      const newStatus = currentStatus === "booked" ? "needs_booking" : "booked";
      await updateItineraryItem(tripId, eventId, { booking_status: newStatus });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking status");
    }
  }

  async function handleUpdateContactField(
    eventId: string,
    field: "phone" | "website" | "email",
    value: string
  ) {
    if (!trip) return;
    try {
      await updateItineraryItem(tripId, eventId, { [field]: value });
      await refresh();
    } catch {
      // silent — field reverts on next refresh
    }
  }

  async function handleSaveName() {
    if (!trip || !nameDraft.trim() || nameDraft.trim() === trip.name) {
      setEditingName(false);
      return;
    }
    setError(null);
    try {
      await updateTrip(tripId, { name: nameDraft.trim() } as Partial<Trip>);
      setEditingName(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trip name");
    }
  }

  async function handleInviteEmails(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !inviteEmails.trim()) return;
    setInviteSending(true);
    setError(null);
    setInviteSuccess(null);
    try {
      const emails = inviteEmails
        .split(/[,\n]+/)
        .map((e) => e.trim())
        .filter(Boolean);
      if (emails.length === 0) return;

      const res = await fetch(`/api/trips/${tripId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send invites");
      }
      const data = await res.json();
      const invited = data.results.filter(
        (r: { status: string }) => r.status === "invited"
      ).length;
      const alreadyInvited = data.results.filter(
        (r: { status: string }) => r.status === "already_invited"
      ).length;

      const parts = [];
      if (invited > 0)
        parts.push(`Invited ${invited} member${invited > 1 ? "s" : ""}`);
      if (alreadyInvited > 0)
        parts.push(`${alreadyInvited} already invited`);
      setInviteSuccess(parts.join(". ") || "Done!");
      setInviteEmails("");
      setShowInvite(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invites");
    }
    setInviteSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">Trip not found</h2>
          <p className="mt-2 text-sm text-zinc-500">This trip may have been deleted.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Determine if the current user is the trip captain
  const isCaptain = currentUserId
    ? trip.members.some((m) => m.userId === currentUserId && m.role === "CAPTAIN")
    : false;

  // Leaderboard preview
  const leaderboard = buildLeaderboardPreview(scorecards);

  // Group schedule by date
  const sortedSchedule = [...trip.schedule].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
  const scheduleDates = Array.from(new Set(sortedSchedule.map((s) => s.date))).sort();

  const hasLodging = trip.lodging.name || trip.lodging.address;

  // Booking checklist: items that need booking
  const bookableItems = trip.schedule.filter(
    (s) => s.bookingStatus === "needs_booking" || s.bookingStatus === "booked"
  );
  const bookedCount = bookableItems.filter((s) => s.bookingStatus === "booked").length;
  const totalBookable = bookableItems.length;
  const allBooked = totalBookable > 0 && bookedCount === totalBookable;

  // Group by type category
  const checklistGroups: { label: string; icon: string; items: ScheduleItem[] }[] = [];
  const teeTimeItems = bookableItems.filter((i) => i.type === "tee_time");
  const dinnerItems = bookableItems.filter((i) => i.type === "dinner");
  const activityItems = bookableItems.filter((i) => i.type === "activity" || i.type === "travel" || i.type === "other");
  if (teeTimeItems.length > 0) checklistGroups.push({ label: "TEE TIMES", icon: "\uD83C\uDFCC\uFE0F", items: teeTimeItems });
  if (dinnerItems.length > 0) checklistGroups.push({ label: "DINNER RESERVATIONS", icon: "\uD83C\uDF7D\uFE0F", items: dinnerItems });
  if (activityItems.length > 0) checklistGroups.push({ label: "ACTIVITIES", icon: "\uD83C\uDFAF", items: activityItems });

  // Compute "book by" deadline based on trip start and item type
  function getBookByDate(item: ScheduleItem): string | null {
    if (!trip?.startDate) return null;
    if (item.type === "activity" || item.type === "travel" || item.type === "other") return null;
    const start = new Date(trip.startDate + "T12:00:00");
    const weeksBeforeMap: Record<string, number> = {
      tee_time: 1,
      dinner: 1,
    };
    const weeksBefore = weeksBeforeMap[item.type] ?? 1;
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() - weeksBefore * 7);
    return deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Find which day number an item falls on
  function getDayLabel(item: ScheduleItem): string {
    if (!trip?.startDate || !item.date) return "";
    const start = new Date(trip.startDate + "T12:00:00");
    const itemDate = new Date(item.date + "T12:00:00");
    const dayNum = Math.round((itemDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return dayNum > 0 ? `Day ${dayNum}` : "";
  }

  const featureCards = [
    {
      icon: DollarSign,
      title: "Expenses",
      desc: `${expenseCount} expense${expenseCount !== 1 ? "s" : ""} logged`,
      href: `/trips/${tripId}/expenses`,
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: Shuffle,
      title: "Pairings",
      desc: `${roundCount} round${roundCount !== 1 ? "s" : ""} created`,
      href: `/trips/${tripId}/pairings`,
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: Trophy,
      title: "Skins",
      desc: `${skinsCount} game${skinsCount !== 1 ? "s" : ""} played`,
      href: `/trips/${tripId}/skins`,
      color: "bg-amber-100 text-amber-700",
    },
    {
      icon: ClipboardList,
      title: "Scorecards",
      desc: `${scorecardCount} round${scorecardCount !== 1 ? "s" : ""} scored`,
      href: `/trips/${tripId}/scorecards`,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: Medal,
      title: "Leaderboard",
      desc: "Standings & rankings",
      href: `/trips/${tripId}/leaderboard`,
      color: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trips
        </Link>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Trip Header */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={() => handleSaveName()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") { setEditingName(false); }
                    }}
                    className="w-full rounded-md border border-emerald-300 px-2 py-1 text-2xl font-bold tracking-tight text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ) : (
                <h1
                  className={`text-2xl font-bold tracking-tight text-zinc-900${isCaptain ? " cursor-pointer hover:text-emerald-700" : ""}`}
                  onClick={isCaptain ? () => { setNameDraft(trip.name); setEditingName(true); } : undefined}
                  title={isCaptain ? "Click to edit trip name" : undefined}
                >
                  {trip.name}
                  {isCaptain && (
                    <Pencil className="ml-2 inline h-4 w-4 text-zinc-300" />
                  )}
                </h1>
              )}
              {trip.destination && (
                <p className="mt-1 text-sm text-zinc-500">{trip.destination}</p>
              )}
              {(trip.startDate || trip.endDate) && (
                <p className="mt-1 text-sm text-zinc-400">
                  {trip.startDate && trip.endDate
                    ? `${trip.startDate} — ${trip.endDate}`
                    : trip.startDate || trip.endDate}
                </p>
              )}
              {(trip.arrivalTime || trip.departureTime) && !editingTravel && (
                <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
                  {trip.arrivalTime && (
                    <span className="inline-flex items-center gap-1">
                      <PlaneLanding className="h-3.5 w-3.5" />
                      {trip.arrivalTime}
                    </span>
                  )}
                  {trip.departureTime && (
                    <span className="inline-flex items-center gap-1">
                      <PlaneTakeoff className="h-3.5 w-3.5" />
                      {trip.departureTime}
                    </span>
                  )}
                  <button
                    onClick={() => setEditingTravel(true)}
                    className="text-zinc-300 hover:text-zinc-500"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
              {!trip.arrivalTime && !trip.departureTime && !editingTravel && (
                <button
                  onClick={() => setEditingTravel(true)}
                  className="mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-600"
                >
                  + Add arrival / departure times
                </button>
              )}
              {editingTravel && (
                <form
                  onSubmit={handleSaveTravel}
                  className="mt-3 flex items-end gap-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Arrival
                    </label>
                    <input
                      type="text"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      placeholder="Fri 3/14 at 2:30 PM"
                      className="mt-1 block w-44 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Departure
                    </label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      placeholder="Sun 3/16 at 6:00 PM"
                      className="mt-1 block w-44 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTravel(false)}
                    className="rounded-md border border-zinc-300 p-1.5 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
            <button
              onClick={handleShareInvite}
              disabled={inviteLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : inviteLoading ? (
                "..."
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Invite Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Round Hub Cards */}
        <RoundHub
          trip={trip}
          rounds={rounds}
          scorecards={scorecards}
          skinsGames={skinsGames}
          currentUserId={currentUserId}
          onRefresh={refresh}
        />

        {/* Two-column layout for lodging + leaderboard */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Lodging */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-900">Lodging</h2>
              </div>
              <button
                onClick={() => setEditingLodging(!editingLodging)}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
              >
                {editingLodging ? "Cancel" : hasLodging ? <Pencil className="h-3.5 w-3.5" /> : "Add"}
              </button>
            </div>

            {editingLodging ? (
              <form onSubmit={handleSaveLodging} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={lodgingForm.name}
                  onChange={(e) =>
                    setLodgingForm({ ...lodgingForm, name: e.target.value })
                  }
                  placeholder="Hotel / Rental name"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  type="text"
                  value={lodgingForm.address}
                  onChange={(e) =>
                    setLodgingForm({ ...lodgingForm, address: e.target.value })
                  }
                  placeholder="Address"
                  className="block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Check-in
                    </label>
                    <input
                      type="text"
                      value={lodgingForm.checkIn}
                      onChange={(e) =>
                        setLodgingForm({ ...lodgingForm, checkIn: e.target.value })
                      }
                      placeholder="3:00 PM"
                      className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">
                      Check-out
                    </label>
                    <input
                      type="text"
                      value={lodgingForm.checkOut}
                      onChange={(e) =>
                        setLodgingForm({ ...lodgingForm, checkOut: e.target.value })
                      }
                      placeholder="11:00 AM"
                      className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={lodgingForm.confirmationNumber}
                    onChange={(e) =>
                      setLodgingForm({
                        ...lodgingForm,
                        confirmationNumber: e.target.value,
                      })
                    }
                    placeholder="Confirmation #"
                    className="block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <input
                    type="text"
                    value={lodgingForm.phone}
                    onChange={(e) =>
                      setLodgingForm({ ...lodgingForm, phone: e.target.value })
                    }
                    placeholder="Phone"
                    className="block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <textarea
                  value={lodgingForm.notes}
                  onChange={(e) =>
                    setLodgingForm({ ...lodgingForm, notes: e.target.value })
                  }
                  placeholder="Notes (WiFi password, gate code, etc.)"
                  rows={2}
                  className="block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Save
                </button>
              </form>
            ) : hasLodging ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-zinc-900">
                  {trip.lodging.name}
                </p>
                {trip.lodging.address && (
                  <div className="flex items-start gap-1.5 text-sm text-zinc-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {trip.lodging.address}
                  </div>
                )}
                {(trip.lodging.checkIn || trip.lodging.checkOut) && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    {trip.lodging.checkIn && `In: ${trip.lodging.checkIn}`}
                    {trip.lodging.checkIn && trip.lodging.checkOut && " · "}
                    {trip.lodging.checkOut && `Out: ${trip.lodging.checkOut}`}
                  </div>
                )}
                {trip.lodging.confirmationNumber && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Hash className="h-3.5 w-3.5" />
                    {trip.lodging.confirmationNumber}
                  </div>
                )}
                {trip.lodging.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Phone className="h-3.5 w-3.5" />
                    {trip.lodging.phone}
                  </div>
                )}
                {trip.lodging.notes && (
                  <p className="mt-1 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                    {trip.lodging.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">
                No lodging info yet. Click Add to enter details.
              </p>
            )}
          </div>

          {/* Leaderboard Preview */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Leaderboard
                </h2>
              </div>
              {leaderboard.length > 0 && (
                <Link
                  href={`/trips/${tripId}/leaderboard`}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View Full
                </Link>
              )}
            </div>

            {leaderboard.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-400">
                No scores yet. Start a scorecard to see standings.
              </p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <div
                    key={entry.name}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      idx === 0 ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 text-center text-xs font-bold ${
                          idx === 0
                            ? "text-yellow-500"
                            : idx === 1
                              ? "text-zinc-400"
                              : idx === 2
                                ? "text-amber-600"
                                : "text-zinc-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">
                        {entry.rounds}R
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          entry.vsPar > 0
                            ? "text-blue-600"
                            : entry.vsPar < 0
                              ? "text-red-600"
                              : "text-zinc-700"
                        }`}
                      >
                        {entry.vsPar > 0
                          ? `+${entry.vsPar}`
                          : entry.vsPar === 0
                            ? "E"
                            : entry.vsPar}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Checklist */}
        {totalBookable > 0 && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-900">Booking Checklist</h2>
              </div>
              <span className="text-xs font-medium text-zinc-500">
                {bookedCount} of {totalBookable} booked
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    allBooked ? "bg-emerald-500" : "bg-emerald-400"
                  }`}
                  style={{ width: `${totalBookable > 0 ? (bookedCount / totalBookable) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Celebration state */}
            {allBooked ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                <p className="text-base font-semibold text-emerald-800">
                  {"\uD83C\uDF89"} Everything&apos;s booked! Your crew is all set.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                {checklistGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {group.icon} {group.label}
                    </h3>
                    <div className="mt-2 space-y-3">
                      {group.items.map((item) => {
                        const isBooked = item.bookingStatus === "booked";
                        const dayLabel = getDayLabel(item);
                        const bookBy = getBookByDate(item);
                        const weeksBefore = item.type === "tee_time" ? "1 week" : "1 week";
                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border px-4 py-3 transition-colors ${
                              isBooked
                                ? "border-emerald-200 bg-emerald-50/50"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            {/* Top row: checkbox + title + cost + day/time */}
                            <div className="flex items-start gap-3">
                              {isCaptain ? (
                                <button
                                  onClick={() => handleToggleBooking(item.id, item.bookingStatus)}
                                  className="mt-0.5 shrink-0"
                                  title={isBooked ? "Mark as needs booking" : "Mark as booked"}
                                >
                                  {isBooked ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-zinc-300 hover:text-emerald-400" />
                                  )}
                                </button>
                              ) : (
                                <span className="mt-0.5 shrink-0">
                                  {isBooked ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-zinc-300" />
                                  )}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${
                                      isBooked ? "text-emerald-800 line-through" : "text-zinc-900"
                                    }`}
                                  >
                                    {item.title}
                                  </span>
                                  {isBooked && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      Booked
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                                  {item.cost > 0 && <span>${item.cost}/pp</span>}
                                  {dayLabel && item.time && (
                                    <span>
                                      {dayLabel}, {formatTime(item.time)}
                                    </span>
                                  )}
                                  {dayLabel && !item.time && <span>{dayLabel}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Contact info row — inline editable for captain, read-only for members */}
                            {!isBooked && (
                              <div className="mt-2 ml-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                                {isCaptain ? (
                                  <>
                                    <InlineContactField
                                      icon={<Phone className="h-3 w-3" />}
                                      label="Phone"
                                      value={item.phone}
                                      onSave={(v) => handleUpdateContactField(item.id, "phone", v)}
                                    />
                                    <InlineContactField
                                      icon={<Globe className="h-3 w-3" />}
                                      label="Website"
                                      value={item.website}
                                      isUrl
                                      onSave={(v) => handleUpdateContactField(item.id, "website", v)}
                                    />
                                    <InlineContactField
                                      icon={<Mail className="h-3 w-3" />}
                                      label="Email"
                                      value={item.email}
                                      onSave={(v) => handleUpdateContactField(item.id, "email", v)}
                                    />
                                  </>
                                ) : (
                                  <>
                                    {item.phone && (
                                      <span className="inline-flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {item.phone}
                                      </span>
                                    )}
                                    {item.website && (
                                      <span className="inline-flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        <a
                                          href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 underline hover:text-emerald-700"
                                        >
                                          {item.website.replace(/^https?:\/\//, "")}
                                          <ExternalLink className="ml-0.5 inline h-2.5 w-2.5" />
                                        </a>
                                      </span>
                                    )}
                                    {item.email && (
                                      <span className="inline-flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {item.email}
                                      </span>
                                    )}
                                  </>
                                )}
                                {bookBy && (
                                  <span className="text-zinc-400">
                                    {"\u23F0"} Book by: {bookBy} ({weeksBefore} before trip)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lodging booking reminder */}
            {hasLodging && trip.lodging.name && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {"\uD83C\uDFE8"} LODGING
                </h3>
                <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Hotel className="h-4 w-4 text-zinc-400" />
                    <span className="font-semibold text-zinc-900">{trip.lodging.name}</span>
                  </div>
                  {trip.lodging.phone && (
                    <div className="mt-1 ml-6 flex items-center gap-1.5 text-xs text-zinc-500">
                      <Phone className="h-3 w-3" />
                      {trip.lodging.phone}
                    </div>
                  )}
                  {trip.lodging.notes && (
                    <p className="mt-1 ml-6 text-xs text-zinc-400">{trip.lodging.notes}</p>
                  )}
                  {trip.startDate && (
                    <p className="mt-1 ml-6 text-xs text-zinc-400">
                      {"\u23F0"} Book by: {(() => {
                        const start = new Date(trip.startDate + "T12:00:00");
                        start.setDate(start.getDate() - 14);
                        return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      })()} (2 weeks before trip)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">Schedule</h2>
            </div>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
          </div>

          {showAddEvent && (
            <form
              onSubmit={handleAddEvent}
              className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="TPC Scottsdale - Round 1"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">
                    Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) =>
                      setEventType(e.target.value as ScheduleItem["type"])
                    }
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {SCHEDULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">
                    Description
                  </label>
                  <input
                    type="text"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Optional details"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {trip.schedule.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">
              No events scheduled yet. Add tee times, dinners, and activities.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {scheduleDates.map((date) => {
                const events = sortedSchedule.filter((e) => e.date === date);
                return (
                  <div key={date}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {formatDate(date)}
                    </h3>
                    <div className="mt-2 space-y-1.5">
                      {events.map((event) => {
                        const typeConfig = SCHEDULE_TYPES.find(
                          (t) => t.value === event.type
                        );
                        const hasBookingStatus = event.bookingStatus === "needs_booking" || event.bookingStatus === "booked";
                        const isBooked = event.bookingStatus === "booked";
                        return (
                          <div
                            key={event.id}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50"
                          >
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                typeConfig?.color || "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {typeConfig?.label || event.type}
                            </span>
                            {event.time && (
                              <span className="shrink-0 text-xs font-medium text-zinc-500">
                                {formatTime(event.time)}
                              </span>
                            )}
                            <span className="flex-1 text-sm font-medium text-zinc-900">
                              {event.title}
                            </span>
                            {event.description && (
                              <span className="hidden max-w-48 truncate text-xs text-zinc-400 sm:block">
                                {event.description}
                              </span>
                            )}
                            {event.cost > 0 && (
                              <span className="shrink-0 text-xs font-medium text-zinc-500">
                                ${event.cost}/pp
                              </span>
                            )}
                            {hasBookingStatus && isCaptain && (
                              <button
                                onClick={() => handleToggleBooking(event.id, event.bookingStatus)}
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  isBooked
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                                title={isBooked ? "Click to mark as needs booking" : "Click to mark as booked"}
                              >
                                {isBooked ? "\u2705 Booked" : "\uD83D\uDD34 Needs Booking"}
                              </button>
                            )}
                            {hasBookingStatus && !isCaptain && (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  isBooked
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isBooked ? "\u2705 Booked" : "\uD83D\uDD34 Needs Booking"}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="shrink-0 rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members & Invite Section */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Members ({trip.members.length})
              </h2>
              {(() => {
                const going = trip.members.filter(
                  (m) => m.rsvpStatus === "GOING"
                ).length;
                return going > 0 ? (
                  <span className="text-xs text-zinc-400">
                    {going} confirmed
                  </span>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Mail className="h-3.5 w-3.5" />
                Invite Crew
              </button>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </button>
            </div>
          </div>

          {/* Invite success toast */}
          {inviteSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
              <Check className="h-4 w-4 shrink-0" />
              {inviteSuccess}
              <button
                onClick={() => setInviteSuccess(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Email Invite Form */}
          {showInvite && (
            <form
              onSubmit={handleInviteEmails}
              className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <label className="block text-xs font-medium text-zinc-600">
                Email addresses (comma or newline separated)
              </label>
              <textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                rows={3}
                placeholder={"john@example.com, mike@example.com\nor paste multiple emails..."}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="mt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={inviteSending || !inviteEmails.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {inviteSending ? (
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {inviteSending ? "Sending..." : "Send Invites"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Add Member Form (manual) */}
          {showAddMember && (
            <form
              onSubmit={handleAddMember}
              className="mt-4 flex items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-600">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-zinc-600">
                  Handicap
                </label>
                <input
                  type="number"
                  value={memberHandicap}
                  onChange={(e) => setMemberHandicap(e.target.value)}
                  placeholder="12"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="rounded-md border border-zinc-300 p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Member List */}
          {trip.members.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              No members yet. Add players or invite by email.
            </p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {trip.members.map((member) => {
                const rsvp = member.rsvpStatus || "PENDING";
                const badgeMap: Record<string, { color: string; label: string }> = {
                  GOING: { color: "bg-green-100 text-green-700", label: "Going" },
                  MAYBE: { color: "bg-yellow-100 text-yellow-700", label: "Maybe" },
                  DECLINED: { color: "bg-red-100 text-red-700", label: "Declined" },
                  PENDING: { color: "bg-zinc-100 text-zinc-500", label: "Pending" },
                };
                const badge = badgeMap[rsvp] || badgeMap.PENDING;

                return (
                  <div
                    key={member.id}
                    className="group flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {member.name}
                      </span>
                      {member.role === "CAPTAIN" && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          {"\uD83D\uDC51"}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        HCP {member.handicap}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">{card.title}</h3>
                <p className="text-xs text-zinc-400">{card.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Inline Editable Contact Field ---

function InlineContactField({
  icon,
  label,
  value,
  isUrl,
  onSave,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isUrl?: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleBlur() {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        {icon}
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={label}
          className="w-40 rounded border border-emerald-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700 outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </span>
    );
  }

  if (value) {
    return (
      <span className="inline-flex items-center gap-1">
        {icon}
        {isUrl ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 underline hover:text-emerald-700"
          >
            {value.replace(/^https?:\/\//, "")}
            <ExternalLink className="ml-0.5 inline h-2.5 w-2.5" />
          </a>
        ) : (
          <span>{value}</span>
        )}
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="text-zinc-300 hover:text-zinc-500"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => { setDraft(""); setEditing(true); }}
      className="inline-flex items-center gap-1 text-zinc-300 hover:text-zinc-500"
    >
      {icon}
      <span className="underline">{label}</span>
    </button>
  );
}

// --- Helpers ---

function buildLeaderboardPreview(
  scorecards: Scorecard[]
): { name: string; rounds: number; vsPar: number }[] {
  const map = new Map<string, { rounds: number; totalGross: number; totalPar: number }>();

  for (const sc of scorecards) {
    const cardPar = sc.pars.reduce((a, b) => a + b, 0);
    for (const player of sc.players) {
      const hasScores = player.scores.some((s) => s !== null);
      if (!hasScores) continue;
      const gross = player.scores.reduce((a: number, b) => a + (b ?? 0), 0);
      const existing = map.get(player.name) || {
        rounds: 0,
        totalGross: 0,
        totalPar: 0,
      };
      existing.rounds += 1;
      existing.totalGross += gross;
      existing.totalPar += cardPar;
      map.set(player.name, existing);
    }
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      rounds: data.rounds,
      vsPar: data.totalGross - data.totalPar,
    }))
    .sort((a, b) => a.vsPar - b.vsPar);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  // If already formatted with AM/PM, return as-is
  if (/[AaPp][Mm]/.test(timeStr)) return timeStr.trim();
  // Parse 24h format like "14:30"
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Convert a time string to minutes for sorting (e.g. "2:00 PM" → 840) */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  // Try "H:MM AM/PM" format
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const isPM = /[Pp][Mm]/.test(ampmMatch[3]);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }
  // Try 24h "HH:MM" format
  const parts = timeStr.split(":").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 9999;
}
