"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  ChevronLeft,
  ChevronUp,
  ChevronDown,
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
  GripVertical,
  Loader2,
  Vote,
  Lock,
  Download,
} from "lucide-react";
import RoundHub from "@/components/RoundHub";

const SCHEDULE_TYPES = [
  { value: "tee_time", label: "Tee Time", emoji: "\u26F3", color: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500" },
  { value: "dinner", label: "Dining", emoji: "\uD83C\uDF7D\uFE0F", color: "bg-rose-100 text-rose-700", border: "border-l-rose-500" },
  { value: "activity", label: "Activity", emoji: "\uD83C\uDFAF", color: "bg-blue-100 text-blue-700", border: "border-l-blue-500" },
  { value: "travel", label: "Travel", emoji: "\u2708\uFE0F", color: "bg-purple-100 text-purple-700", border: "border-l-purple-500" },
  { value: "lodging", label: "Lodging", emoji: "\uD83C\uDFE8", color: "bg-amber-100 text-amber-700", border: "border-l-amber-500" },
  { value: "entertainment", label: "Entertainment", emoji: "\uD83C\uDF89", color: "bg-pink-100 text-pink-700", border: "border-l-pink-500" },
  { value: "other", label: "Other", emoji: "\uD83D\uDCCC", color: "bg-zinc-100 text-zinc-700", border: "border-l-zinc-400" },
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

  // Edit modal
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", time: "", type: "activity" as string, date: "", cost: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Add per-day
  const [addForDate, setAddForDate] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    title: "", time: "", type: "activity" as string, cost: "", notes: "",
  });
  const [addSaving, setAddSaving] = useState(false);
  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Optimistic schedule
  const [optimisticSchedule, setOptimisticSchedule] = useState<ScheduleItem[] | null>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Date Poll
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datePoll, setDatePoll] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pollOptions, setPollOptions] = useState<any[]>([]);
  const [pollUserVotes, setPollUserVotes] = useState<Record<string, string>>({});
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollNights, setPollNights] = useState(3);
  const [pollStep, setPollStep] = useState(1); // 1=nights, 2=suggestions, 3=confirm
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pollSuggestions, setPollSuggestions] = useState<any>(null);
  const [pollDraftOptions, setPollDraftOptions] = useState<{ start_date: string; end_date: string; label: string }[]>([]);
  const [pollCreating, setPollCreating] = useState(false);
  const [pollLoadingSuggestions, setPollLoadingSuggestions] = useState(false);
  const [pollVoting, setPollVoting] = useState(false);
  const [pollLocking, setPollLocking] = useState(false);
  const [pollLockConfirm, setPollLockConfirm] = useState<string | null>(null);

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
      // Fetch date poll
      try {
        const pollRes = await fetch(`/api/trips/${tripId}/date-poll`);
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          setDatePoll(pollData.poll);
          setPollOptions(pollData.options || []);
          setPollUserVotes(pollData.userVotes || {});
        }
      } catch {
        // Poll fetch failure is non-critical
      }
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
      // Optimistic remove with fade
      setOptimisticSchedule((prev) =>
        (prev ?? trip.schedule).filter((s) => s.id !== eventId)
      );
      await removeItineraryItem(tripId, eventId);
      await refresh();
      setOptimisticSchedule(null);
    } catch (err) {
      setOptimisticSchedule(null);
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  // --- Edit modal handlers ---
  function openEditModal(item: ScheduleItem) {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      time: item.time,
      type: item.type,
      date: item.date,
      cost: item.cost > 0 ? String(item.cost) : "",
      notes: item.notes || "",
    });
    setDeleteConfirm(null);
  }

  async function handleEditSave() {
    if (!editingItem || !trip) return;
    setEditSaving(true);
    setError(null);
    try {
      // Optimistic update
      const updated: ScheduleItem = {
        ...editingItem,
        title: editForm.title,
        time: editForm.time,
        type: editForm.type as ScheduleItem["type"],
        date: editForm.date,
        cost: parseFloat(editForm.cost) || 0,
        notes: editForm.notes,
      };
      setOptimisticSchedule((prev) =>
        (prev ?? trip.schedule).map((s) => (s.id === updated.id ? updated : s))
      );
      await updateItineraryItem(tripId, editingItem.id, {
        title: editForm.title,
        time: editForm.time,
        type: editForm.type,
        date: editForm.date,
        cost: parseFloat(editForm.cost) || 0,
        notes: editForm.notes,
      });
      setEditingItem(null);
      await refresh();
      setOptimisticSchedule(null);
    } catch (err) {
      setOptimisticSchedule(null);
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setEditSaving(false);
  }

  async function handleEditDelete() {
    if (!editingItem) return;
    setEditSaving(true);
    await handleDeleteEvent(editingItem.id);
    setEditingItem(null);
    setEditSaving(false);
    setDeleteConfirm(null);
  }

  // --- Add per-day handlers ---
  function openAddForDay(date: string, existingEvents: ScheduleItem[]) {
    setAddForDate(date);
    // Default time: 2 hours after last event, or 08:00
    let defaultTime = "08:00";
    if (existingEvents.length > 0) {
      const last = existingEvents[existingEvents.length - 1];
      const mins = timeToMinutes(last.time);
      if (mins < 9999) {
        const next = mins + 120;
        const h = Math.floor(next / 60);
        const m = next % 60;
        if (h < 24) {
          defaultTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        }
      }
    }
    setAddForm({ title: "", time: defaultTime, type: "activity", cost: "", notes: "" });
  }

  async function handleAddForDay() {
    if (!trip || !addForDate || !addForm.title.trim()) return;
    setAddSaving(true);
    setError(null);
    try {
      await addItineraryItem(tripId, {
        date: addForDate,
        time: addForm.time,
        title: addForm.title.trim(),
        description: "",
        type: addForm.type as ScheduleItem["type"],
        cost: parseFloat(addForm.cost) || 0,
        notes: addForm.notes,
      });
      setAddForDate(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    }
    setAddSaving(false);
  }

  // --- Reorder handlers ---
  async function handleMoveItem(itemId: string, direction: "up" | "down", dayEvents: ScheduleItem[]) {
    const idx = dayEvents.findIndex((e) => e.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dayEvents.length) return;

    const reordered = [...dayEvents];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    // Optimistic update
    const allSchedule = optimisticSchedule ?? trip!.schedule;
    const otherEvents = allSchedule.filter((s) => s.date !== dayEvents[0].date);
    const updatedDayEvents = reordered.map((e, i) => ({ ...e, sortOrder: i }));
    setOptimisticSchedule([...otherEvents, ...updatedDayEvents]);

    try {
      await fetch(`/api/trips/${tripId}/itinerary/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedDayEvents.map((e, i) => ({ id: e.id, sort_order: i })),
        }),
      });
      await refresh();
      setOptimisticSchedule(null);
    } catch {
      setOptimisticSchedule(null);
    }
  }

  // --- Drag-and-drop handlers ---
  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDragId(itemId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, itemId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(itemId);
  }

  async function handleDrop(e: React.DragEvent, targetId: string, dayEvents: ScheduleItem[]) {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = dayEvents.findIndex((e) => e.id === dragId);
    const toIdx = dayEvents.findIndex((e) => e.id === targetId);
    if (fromIdx < 0 || toIdx < 0) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...dayEvents];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const allSchedule = optimisticSchedule ?? trip!.schedule;
    const otherEvents = allSchedule.filter((s) => s.date !== dayEvents[0].date);
    const updatedDayEvents = reordered.map((e, i) => ({ ...e, sortOrder: i }));
    setOptimisticSchedule([...otherEvents, ...updatedDayEvents]);
    setDragId(null);
    setDragOverId(null);

    try {
      await fetch(`/api/trips/${tripId}/itinerary/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedDayEvents.map((e, i) => ({ id: e.id, sort_order: i })),
        }),
      });
      await refresh();
      setOptimisticSchedule(null);
    } catch {
      setOptimisticSchedule(null);
    }
  }

  // --- Quick move between days ---
  async function handleQuickMove(item: ScheduleItem, targetDate: string) {
    if (!trip) return;
    // Optimistic
    const allSchedule = optimisticSchedule ?? trip.schedule;
    setOptimisticSchedule(
      allSchedule.map((s) => (s.id === item.id ? { ...s, date: targetDate } : s))
    );
    try {
      await updateItineraryItem(tripId, item.id, { date: targetDate });
      await refresh();
      setOptimisticSchedule(null);
    } catch {
      setOptimisticSchedule(null);
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

  // --- Date Poll Handlers ---
  async function handleFetchSuggestions() {
    setPollLoadingSuggestions(true);
    try {
      const dest = encodeURIComponent(trip?.destination || "");
      const res = await fetch(`/api/trips/${tripId}/date-poll/suggestions?duration=${pollNights}&destination=${dest}`);
      if (res.ok) {
        const data = await res.json();
        setPollSuggestions(data);
        // Pre-fill draft options from suggestions
        const drafts = (data.suggestions || []).map((s: { start_date: string; end_date: string; tag: string }) => ({
          start_date: s.start_date,
          end_date: s.end_date,
          label: "",
        }));
        setPollDraftOptions(drafts.length > 0 ? drafts : [
          { start_date: "", end_date: "", label: "" },
          { start_date: "", end_date: "", label: "" },
        ]);
      }
    } catch {
      // Suggestions non-critical — user can enter manually
      setPollDraftOptions([
        { start_date: "", end_date: "", label: "" },
        { start_date: "", end_date: "", label: "" },
        { start_date: "", end_date: "", label: "" },
      ]);
    }
    setPollLoadingSuggestions(false);
    setPollStep(2);
  }

  function handlePollOptionDateChange(idx: number, startDate: string) {
    setPollDraftOptions((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        start_date: startDate,
        end_date: startDate ? addDaysISO(startDate, pollNights) : "",
      };
      return next;
    });
  }

  function handleRemovePollOption(idx: number) {
    setPollDraftOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleAddPollOption() {
    if (pollDraftOptions.length >= 5) return;
    setPollDraftOptions((prev) => [...prev, { start_date: "", end_date: "", label: "" }]);
  }

  async function handleCreatePoll() {
    const validOptions = pollDraftOptions.filter((o) => o.start_date && o.end_date);
    if (validOptions.length < 2) return;
    setPollCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/date-poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: validOptions, duration_nights: pollNights }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create poll");
      }
      setShowCreatePoll(false);
      setPollStep(1);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    }
    setPollCreating(false);
  }

  async function handleCastVotes(votes: { option_id: string; vote: string }[]) {
    setPollVoting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/date-poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cast vote");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setPollVoting(false);
  }

  async function handleLockDates(optionId: string) {
    setPollLocking(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/date-poll/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: optionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to lock dates");
      }
      const data = await res.json();
      // Download .ics file
      if (data.ics) {
        const blob = new Blob([data.ics], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${trip?.name || "trip"}.ics`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setPollLockConfirm(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lock dates");
    }
    setPollLocking(false);
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

  // Determine if the current user is the trip captain or co-captain (can edit)
  const isCaptain = currentUserId
    ? trip.members.some(
        (m) =>
          m.userId === currentUserId &&
          (m.role === "CAPTAIN" || m.role === "CO_CAPTAIN")
      )
    : false;

  // Leaderboard preview
  const leaderboard = buildLeaderboardPreview(scorecards);

  // Group schedule by date — use optimistic if available
  const liveSchedule = optimisticSchedule ?? trip.schedule;
  const sortedSchedule = [...liveSchedule].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
  const scheduleDates = Array.from(new Set(sortedSchedule.map((s) => s.date))).sort();

  // Compute day number from trip start for date labels & day dropdown
  function dayNumberFor(date: string): number {
    if (!trip?.startDate || !date) return 0;
    const start = new Date(trip.startDate + "T12:00:00");
    const d = new Date(date + "T12:00:00");
    return Math.round((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Generate list of trip dates for the day dropdown in the edit modal
  const tripDates: { date: string; label: string }[] = [];
  if (trip.startDate && trip.endDate) {
    const s = new Date(trip.startDate + "T12:00:00");
    const e = new Date(trip.endDate + "T12:00:00");
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      const dayNum = dayNumberFor(iso);
      const label = `Day ${dayNum} \u2014 ${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
      tripDates.push({ date: iso, label });
    }
  }
  // Also add any schedule dates not covered by start/end
  for (const sd of scheduleDates) {
    if (!tripDates.find((t) => t.date === sd)) {
      const dayNum = dayNumberFor(sd);
      const d = new Date(sd + "T12:00:00");
      const label = dayNum > 0
        ? `Day ${dayNum} \u2014 ${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      tripDates.push({ date: sd, label });
    }
  }
  tripDates.sort((a, b) => a.date.localeCompare(b.date));

  const hasLodging = trip.lodging.name || trip.lodging.address;

  // Booking checklist: items that need booking
  const bookableItems = liveSchedule.filter(
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

        {/* ─── Date Poll Section ─── */}
        {datePoll?.status === "locked" && trip.startDate && trip.endDate ? (
          /* Locked dates display */
          <div className="mt-6 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-zinc-900">Trip Dates Locked</h2>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              <span className="font-semibold">{formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}</span>
              {" "}({nightsBetween(trip.startDate, trip.endDate)} night{nightsBetween(trip.startDate, trip.endDate) !== 1 ? "s" : ""})
            </p>
          </div>
        ) : datePoll?.status === "active" || datePoll?.status === "closed" ? (
          /* Active / Closed poll — voting UI */
          <DatePollVotingCard
            poll={datePoll}
            options={pollOptions}
            userVotes={pollUserVotes}
            members={trip.members}
            currentUserId={currentUserId}
            isCaptain={currentUserId ? trip.members.some((m) => m.userId === currentUserId && (m.role === "CAPTAIN" || m.role === "CO_CAPTAIN")) : false}
            voting={pollVoting}
            locking={pollLocking}
            lockConfirm={pollLockConfirm}
            onVote={handleCastVotes}
            onLockConfirm={setPollLockConfirm}
            onLock={handleLockDates}
          />
        ) : !trip.startDate && !trip.endDate && !datePoll ? (
          /* No dates, no poll — prompt captain */
          currentUserId && trip.members.some((m) => m.userId === currentUserId && (m.role === "CAPTAIN" || m.role === "CO_CAPTAIN")) ? (
            <div className="mt-6 rounded-xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center shadow-sm">
              <CalendarDays className="mx-auto h-8 w-8 text-zinc-400" />
              <h2 className="mt-3 text-lg font-semibold text-zinc-900">When&apos;s the trip?</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Pick a few possible date windows and let the crew vote.
              </p>
              <button
                onClick={() => { setShowCreatePoll(true); setPollStep(1); }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Vote className="h-4 w-4" />
                Set Up Date Poll
              </button>
            </div>
          ) : null
        ) : null}

        {/* Create Poll Modal */}
        {showCreatePoll && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreatePoll(false)}
          >
            <div
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_200ms_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">
                  {pollStep === 1 ? "Trip Duration" : pollStep === 2 ? "Pick Date Windows" : "Confirm & Send"}
                </h3>
                <button onClick={() => setShowCreatePoll(false)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step 1: Nights */}
              {pollStep === 1 && (
                <div>
                  <p className="text-sm text-zinc-500 mb-4">How many nights is this trip?</p>
                  <div className="flex flex-wrap gap-2">
                    {[2, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPollNights(n)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                          pollNights === n
                            ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {n} night{n !== 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleFetchSuggestions}
                    disabled={pollLoadingSuggestions}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {pollLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {pollLoadingSuggestions ? "Getting suggestions..." : "Next — Pick Dates"}
                  </button>
                </div>
              )}

              {/* Step 2: Suggestions + Edit */}
              {pollStep === 2 && (
                <div>
                  {/* KB suggestions info */}
                  {pollSuggestions?.bestMonths?.length > 0 && (
                    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
                      <p className="font-medium text-blue-800">
                        {"\uD83D\uDCA1"} Best months for {pollSuggestions.destination || trip.destination}: {pollSuggestions.bestMonths.join(", ")}
                      </p>
                      {pollSuggestions.avoidMonths?.length > 0 && (
                        <p className="mt-1 text-blue-600">
                          {"\u26A0\uFE0F"} Avoid: {pollSuggestions.avoidMonths.join(", ")}{pollSuggestions.avoidReason ? ` — ${pollSuggestions.avoidReason}` : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pre-filled suggestion chips */}
                  {pollSuggestions?.suggestions?.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Suggested windows</p>
                      <div className="flex flex-wrap gap-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {pollSuggestions.suggestions.map((s: any, i: number) => {
                          const isSelected = pollDraftOptions.some((o) => o.start_date === s.start_date);
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                if (isSelected) {
                                  setPollDraftOptions((prev) => prev.filter((o) => o.start_date !== s.start_date));
                                } else {
                                  setPollDraftOptions((prev) => [...prev, { start_date: s.start_date, end_date: s.end_date, label: "" }]);
                                }
                              }}
                              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                              }`}
                            >
                              <span className="font-medium">{s.label}</span>
                              {s.tag && (
                                <span className="ml-2 text-xs text-zinc-500">{s.tag}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Editable options */}
                  <div className="space-y-3">
                    {pollDraftOptions.map((opt, idx) => (
                      <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-zinc-500">Option {String.fromCharCode(65 + idx)}</span>
                          {pollDraftOptions.length > 2 && (
                            <button onClick={() => handleRemovePollOption(idx)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs text-zinc-500">Start date</label>
                            <input
                              type="date"
                              value={opt.start_date}
                              onChange={(e) => handlePollOptionDateChange(idx, e.target.value)}
                              min={addDaysISO(new Date().toISOString().split("T")[0], 7)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500">End date</label>
                            <input
                              type="date"
                              value={opt.end_date}
                              readOnly
                              className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => {
                            setPollDraftOptions((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], label: e.target.value };
                              return next;
                            });
                          }}
                          placeholder='Optional label (e.g. "Spring Break")'
                          className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    ))}
                  </div>

                  {pollDraftOptions.length < 5 && (
                    <button
                      onClick={handleAddPollOption}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Option
                    </button>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setPollStep(1)}
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setPollStep(3)}
                      disabled={pollDraftOptions.filter((o) => o.start_date && o.end_date).length < 2}
                      className="flex-1 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Review & Send
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {pollStep === 3 && (
                <div>
                  <p className="text-sm text-zinc-500 mb-4">
                    Your crew will have <strong>72 hours</strong> to vote. Everyone with an email on file gets notified.
                  </p>
                  <div className="space-y-2">
                    {pollDraftOptions.filter((o) => o.start_date && o.end_date).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {formatDateShort(opt.start_date)} — {formatDateShort(opt.end_date)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {pollNights} night{pollNights !== 1 ? "s" : ""}
                            {opt.label ? ` · "${opt.label}"` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setPollStep(2)}
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreatePoll}
                      disabled={pollCreating}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {pollCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {pollCreating ? "Creating..." : "Send Poll to Crew"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            {isCaptain && (
              <button
                onClick={() => {
                  setShowAddEvent(!showAddEvent);
                  if (!showAddEvent && trip.startDate) setEventDate(trip.startDate);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            )}
          </div>

          {showAddEvent && isCaptain && (
            <form
              onSubmit={handleAddEvent}
              className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Date *</label>
                  <input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Time</label>
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Title *</label>
                  <input type="text" required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="TPC Scottsdale - Round 1" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Type</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value as ScheduleItem["type"])} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    {SCHEDULE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.emoji} {t.label}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600">Description</label>
                  <input type="text" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Optional details" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Add</button>
                <button type="button" onClick={() => setShowAddEvent(false)} className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
              </div>
            </form>
          )}

          {liveSchedule.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">
              No events scheduled yet.{isCaptain ? " Add tee times, dinners, and activities." : ""}
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {scheduleDates.map((date, dateIdx) => {
                const dayEvents = sortedSchedule.filter((e) => e.date === date);
                const dayNum = dayNumberFor(date);
                const dayLabel = dayNum > 0 ? `Day ${dayNum}` : "";
                const prevDate = dateIdx > 0 ? scheduleDates[dateIdx - 1] : null;
                const nextDate = dateIdx < scheduleDates.length - 1 ? scheduleDates[dateIdx + 1] : null;
                return (
                  <div key={date}>
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {dayLabel && <span className="text-zinc-500">{dayLabel}</span>}
                      {dayLabel && <span>&mdash;</span>}
                      {formatDate(date)}
                    </h3>
                    <div className="mt-2 space-y-1.5">
                      {dayEvents.map((event, idx) => {
                        const typeConfig = SCHEDULE_TYPES.find((t) => t.value === event.type);
                        const isDragging = dragId === event.id;
                        const isDragOver = dragOverId === event.id;
                        return (
                          <div
                            key={event.id}
                            draggable={isCaptain}
                            onDragStart={isCaptain ? (e) => handleDragStart(e, event.id) : undefined}
                            onDragOver={isCaptain ? (e) => handleDragOver(e, event.id) : undefined}
                            onDrop={isCaptain ? (e) => handleDrop(e, event.id, dayEvents) : undefined}
                            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                            className={`group relative rounded-lg border-l-4 ${typeConfig?.border || "border-l-zinc-300"} border border-zinc-200 bg-white px-3 py-2.5 transition-all ${
                              isDragging ? "opacity-40" : ""
                            } ${isDragOver ? "ring-2 ring-emerald-400 ring-offset-1" : ""} ${
                              isCaptain ? "cursor-pointer hover:shadow-sm" : ""
                            }`}
                            onClick={isCaptain ? () => openEditModal(event) : undefined}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Drag handle — captain only */}
                              {isCaptain && (
                                <span
                                  className="shrink-0 cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing min-w-[20px]"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </span>
                              )}
                              {/* Type emoji + time + title */}
                              <span className="shrink-0 text-base">{typeConfig?.emoji || "\uD83D\uDCCC"}</span>
                              {event.time && (
                                <span className="shrink-0 text-xs font-semibold text-zinc-500">
                                  {formatTime(event.time)}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-zinc-900">
                                {event.title}
                              </span>
                              <span className="flex-1" />
                              {/* Cost + type label */}
                              {event.cost > 0 && (
                                <span className="hidden shrink-0 text-xs font-medium text-zinc-500 sm:block">
                                  ${event.cost}/person
                                </span>
                              )}
                              <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline ${typeConfig?.color || "bg-zinc-100 text-zinc-700"}`}>
                                {typeConfig?.label || event.type}
                              </span>
                              {/* Captain edit/delete + reorder */}
                              {isCaptain && (
                                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                  {/* Reorder arrows */}
                                  <button
                                    onClick={() => handleMoveItem(event.id, "up", dayEvents)}
                                    disabled={idx === 0}
                                    className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 min-w-[28px] min-h-[28px] flex items-center justify-center"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveItem(event.id, "down", dayEvents)}
                                    disabled={idx === dayEvents.length - 1}
                                    className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 min-w-[28px] min-h-[28px] flex items-center justify-center"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                  {/* Quick day move */}
                                  {prevDate && (
                                    <button
                                      onClick={() => handleQuickMove(event, prevDate)}
                                      className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 min-w-[28px] min-h-[28px] flex items-center justify-center"
                                      title={`Move to ${formatDate(prevDate)}`}
                                    >
                                      <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {nextDate && (
                                    <button
                                      onClick={() => handleQuickMove(event, nextDate)}
                                      className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 min-w-[28px] min-h-[28px] flex items-center justify-center"
                                      title={`Move to ${formatDate(nextDate)}`}
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {/* Edit icon */}
                                  <button
                                    onClick={() => openEditModal(event)}
                                    className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 min-w-[28px] min-h-[28px] flex items-center justify-center"
                                    title="Edit"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  {/* Delete icon */}
                                  <button
                                    onClick={() => {
                                      if (deleteConfirm === event.id) {
                                        handleDeleteEvent(event.id);
                                        setDeleteConfirm(null);
                                      } else {
                                        setDeleteConfirm(event.id);
                                        setTimeout(() => setDeleteConfirm(null), 3000);
                                      }
                                    }}
                                    className={`rounded p-1 min-w-[28px] min-h-[28px] flex items-center justify-center transition-colors ${
                                      deleteConfirm === event.id
                                        ? "bg-red-100 text-red-600"
                                        : "text-zinc-300 hover:bg-red-50 hover:text-red-500"
                                    }`}
                                    title={deleteConfirm === event.id ? "Click again to confirm" : "Delete"}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {/* Second row: cost (mobile) + description/notes */}
                            {(event.cost > 0 || event.description || event.notes) && (
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-0 text-xs text-zinc-500" style={{ paddingLeft: isCaptain ? "28px" : "0" }}>
                                {event.cost > 0 && (
                                  <span className="sm:hidden">${event.cost}/person</span>
                                )}
                                {event.description && <span>{event.description}</span>}
                                {event.notes && <span className="italic text-zinc-400">{event.notes}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Add to this day — captain only */}
                    {isCaptain && (
                      <>
                        {addForDate === date ? (
                          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <input
                                type="text"
                                autoFocus
                                value={addForm.title}
                                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                placeholder="Event title *"
                                className="col-span-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <input
                                type="time"
                                value={addForm.time}
                                onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <select
                                value={addForm.type}
                                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              >
                                {SCHEDULE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.emoji} {t.label}</option>))}
                              </select>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <input
                                type="number"
                                value={addForm.cost}
                                onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
                                placeholder="$ Cost per person (optional)"
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <input
                                type="text"
                                value={addForm.notes}
                                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={handleAddForDay}
                                disabled={addSaving || !addForm.title.trim()}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {addSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                Add
                              </button>
                              <button
                                onClick={() => setAddForDate(null)}
                                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAddForDay(date, dayEvents)}
                            className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                          >
                            <Plus className="h-3 w-3" />
                            Add to {dayLabel || formatDate(date)}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Modal / Drawer */}
        {editingItem && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingItem(null)}
          >
            <div
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_200ms_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Edit Event</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Title *</label>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Time</label>
                    <input type="time" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600">Type</label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {SCHEDULE_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, type: t.value })}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all min-h-[32px] ${
                            editForm.type === t.value
                              ? `${t.color} ring-2 ring-offset-1 ring-current`
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {t.emoji} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Day</label>
                  {tripDates.length > 0 ? (
                    <select value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      {tripDates.map((td) => (<option key={td.date} value={td.date}>{td.label}</option>))}
                    </select>
                  ) : (
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Est. cost per person</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                    <input type="number" value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} placeholder="0" className="block w-full rounded-md border border-zinc-300 pl-7 pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Notes</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editForm.title.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
                >
                  {editSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>

              {/* Delete */}
              <div className="mt-4 border-t border-zinc-100 pt-4">
                {deleteConfirm === editingItem.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-600">Delete &ldquo;{editingItem.title}&rdquo;?</span>
                    <button
                      onClick={handleEditDelete}
                      disabled={editSaving}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(editingItem.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete this event
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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

// --- Date Poll helpers ---

function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function nightsBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
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

// --- Date Poll Voting Card ---

function DatePollVotingCard({
  poll,
  options,
  userVotes,
  members,
  currentUserId,
  isCaptain,
  voting,
  locking,
  lockConfirm,
  onVote,
  onLockConfirm,
  onLock,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poll: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any[];
  userVotes: Record<string, string>;
  members: { id: string; userId?: string; name: string }[];
  currentUserId: string | null;
  isCaptain: boolean;
  voting: boolean;
  locking: boolean;
  lockConfirm: string | null;
  onVote: (votes: { option_id: string; vote: string }[]) => void;
  onLockConfirm: (id: string | null) => void;
  onLock: (optionId: string) => void;
}) {
  const [draftVotes, setDraftVotes] = useState<Record<string, string>>({});
  const isActive = poll.status === "active" && new Date(poll.deadline) > new Date();
  const isClosed = poll.status === "closed" || (poll.status === "active" && new Date(poll.deadline) <= new Date());

  // Init draft votes from existing
  useEffect(() => {
    if (Object.keys(userVotes).length > 0) {
      setDraftVotes(userVotes);
    }
  }, [userVotes]);

  const hasChanges = JSON.stringify(draftVotes) !== JSON.stringify(userVotes);
  const allVoted = options.every((opt) => draftVotes[opt.id]);

  // Find best option
  const optionScores = options.map((opt) => {
    const yesCount = (opt.votes || []).filter((v: { vote: string }) => v.vote === "yes").length;
    const noCount = (opt.votes || []).filter((v: { vote: string }) => v.vote === "no").length;
    return { id: opt.id, yesCount, noCount, score: yesCount * 2 - noCount };
  });
  const bestOption = optionScores.length > 0
    ? optionScores.reduce((a, b) => (b.score > a.score || (b.score === a.score && b.noCount < a.noCount) ? b : a))
    : null;

  // Count unique voters
  const allVoteUsers = new Set<string>();
  for (const opt of options) {
    for (const v of opt.votes || []) {
      allVoteUsers.add(v.userId);
    }
  }
  const votedCount = allVoteUsers.size;
  const totalMembers = members.length;

  function getMemberNameByUserId(userId: string): string {
    const m = members.find((m) => m.userId === userId);
    return m?.name?.split(" ")[0] || "?";
  }

  function handleSubmitVotes() {
    const votes = Object.entries(draftVotes).map(([option_id, vote]) => ({ option_id, vote }));
    if (votes.length > 0) onVote(votes);
  }

  return (
    <div className={`mt-6 rounded-xl border-2 ${isActive ? "border-emerald-200" : "border-zinc-200"} bg-white p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-zinc-900">
            {isActive ? "Vote on Trip Dates" : "Date Poll Results"}
          </h2>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
        }`}>
          {isActive ? formatCountdown(poll.deadline) : "Voting closed"}
        </span>
      </div>

      {/* Voter progress */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${totalMembers > 0 ? (votedCount / totalMembers) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">{votedCount} of {totalMembers} voted</span>
      </div>

      {/* Options */}
      <div className="mt-4 space-y-3">
        {options.map((opt, idx) => {
          const startDate = new Date(opt.start_date);
          const endDate = new Date(opt.end_date);
          const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const startDay = startDate.toLocaleDateString("en-US", { weekday: "short" });
          const endDay = endDate.toLocaleDateString("en-US", { weekday: "short" });
          const currentVote = draftVotes[opt.id] || "";
          const isBest = bestOption?.id === opt.id;
          const yesVotes = (opt.votes || []).filter((v: { vote: string }) => v.vote === "yes");
          const maybeVotes = (opt.votes || []).filter((v: { vote: string }) => v.vote === "maybe");
          const noVotes = (opt.votes || []).filter((v: { vote: string }) => v.vote === "no");

          return (
            <div
              key={opt.id}
              className={`rounded-lg border ${
                isBest && (isClosed || votedCount >= 2) ? "border-emerald-300 bg-emerald-50/30" : "border-zinc-200"
              } p-4`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="text-sm font-semibold text-zinc-900">
                      {startStr} — {endStr}
                    </p>
                  </div>
                  <p className="mt-0.5 ml-8 text-xs text-zinc-500">
                    {startDay}–{endDay} · {nights} night{nights !== 1 ? "s" : ""}
                    {opt.label ? ` · "${opt.label}"` : ""}
                  </p>
                </div>
                {isBest && (isClosed || votedCount >= 2) && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Best match
                  </span>
                )}
              </div>

              {/* Vote buttons */}
              {isActive && (
                <div className="mt-3 flex gap-2">
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

              {/* Voter names */}
              {(opt.votes?.length > 0) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {yesVotes.map((v: { userId: string }) => (
                    <span key={v.userId} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      {"\u2705"} {getMemberNameByUserId(v.userId)}
                    </span>
                  ))}
                  {maybeVotes.map((v: { userId: string }) => (
                    <span key={v.userId} className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                      {"\u26A0\uFE0F"} {getMemberNameByUserId(v.userId)}
                    </span>
                  ))}
                  {noVotes.map((v: { userId: string }) => (
                    <span key={v.userId} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      {"\u274C"} {getMemberNameByUserId(v.userId)}
                    </span>
                  ))}
                </div>
              )}

              {/* Lock button for captain */}
              {isCaptain && (isClosed || votedCount === totalMembers) && (
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  {lockConfirm === opt.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">Lock in these dates?</span>
                      <button
                        onClick={() => onLock(opt.id)}
                        disabled={locking}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {locking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                        {locking ? "Locking..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => onLockConfirm(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onLockConfirm(opt.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Lock className="h-3 w-3" />
                      Lock In These Dates
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Best match summary */}
      {bestOption && votedCount >= 2 && (
        <p className="mt-3 text-xs text-zinc-500">
          {"\uD83D\uDCA1"} Best match: Option {String.fromCharCode(65 + options.findIndex((o) => o.id === bestOption.id))}
          {" "}({bestOption.yesCount} {"\u2705"}{bestOption.noCount > 0 ? `, ${bestOption.noCount} \u274C` : ""})
        </p>
      )}

      {/* Submit votes button */}
      {isActive && allVoted && hasChanges && (
        <button
          onClick={handleSubmitVotes}
          disabled={voting}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
        >
          {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {voting ? "Submitting..." : "Submit Votes"}
        </button>
      )}

      {/* All voted message */}
      {votedCount === totalMembers && totalMembers > 0 && isActive && (
        <p className="mt-3 text-center text-xs text-emerald-600 font-medium">
          Everyone&apos;s voted! {isCaptain ? "You can lock in dates now." : "Waiting for the captain to lock in dates."}
        </p>
      )}
    </div>
  );
}
