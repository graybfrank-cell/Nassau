"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getTrip,
  updateTrip,
  addMember,
  removeMember,
  addItineraryItem,
  removeItineraryItem,
  getExpenses,
  getRounds,
  getSkinsGames,
  getScorecards,
} from "@/lib/store";
import { Trip, Lodging, ScheduleItem, Scorecard } from "@/lib/types";
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
} from "lucide-react";

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
  const [expenseCount, setExpenseCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [skinsCount, setSkinsCount] = useState(0);
  const [scorecardCount, setScorecardCount] = useState(0);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
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

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function refresh() {
    const t = await getTrip(tripId);
    if (t) {
      setTrip(t);
      setLodgingForm(t.lodging);
      setArrivalTime(t.arrivalTime);
      setDepartureTime(t.departureTime);
      const [expenses, rounds, skins, sc] = await Promise.all([
        getExpenses(tripId),
        getRounds(tripId),
        getSkinsGames(tripId),
        getScorecards({ tripId }),
      ]);
      setExpenseCount(expenses.length);
      setRoundCount(rounds.length);
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

  // Leaderboard preview
  const leaderboard = buildLeaderboardPreview(scorecards);

  // Group schedule by date
  const sortedSchedule = [...trip.schedule].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  const scheduleDates = Array.from(new Set(sortedSchedule.map((s) => s.date))).sort();

  const hasLodging = trip.lodging.name || trip.lodging.address;

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
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {trip.name}
              </h1>
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
                        return (
                          <div
                            key={event.id}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50"
                          >
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                typeConfig?.color || "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {typeConfig?.label || event.type}
                            </span>
                            {event.time && (
                              <span className="text-xs font-medium text-zinc-500">
                                {formatTime(event.time)}
                              </span>
                            )}
                            <span className="flex-1 text-sm font-medium text-zinc-900">
                              {event.title}
                            </span>
                            {event.description && (
                              <span className="hidden text-xs text-zinc-400 sm:block">
                                {event.description}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
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

        {/* Members Section */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Members ({trip.members.length})
              </h2>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Member
            </button>
          </div>

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

          {trip.members.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              No members yet. Add players to get started.
            </p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="group flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-zinc-900">
                      {member.name}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400">
                      HCP {member.handicap}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
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
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}
