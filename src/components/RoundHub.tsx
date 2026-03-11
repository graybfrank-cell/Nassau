"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  createRound,
  updateRound,
  createScorecard,
  updateScorecard,
  createSkinsGame,
  updateSkinsGame,
} from "@/lib/store";
import {
  Trip,
  ScheduleItem,
  Round,
  Scorecard,
  SkinsGame,
  SkinsHole,
} from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  Shuffle,
  ClipboardList,
  Trophy,
  Medal,
  Users,
  Camera,
  Check,
  X,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type TabKey = "pairings" | "scorecard" | "leaderboard" | "skins";

interface RoundHubProps {
  trip: Trip;
  rounds: Round[];
  scorecards: Scorecard[];
  skinsGames: SkinsGame[];
  currentUserId: string | null;
  onRefresh: () => Promise<void>;
}

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

// ─── Helpers ────────────────────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeGroups(memberIds: string[], groupSize: number): string[][] {
  const shuffled = shuffle(memberIds);
  const groups: string[][] = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }
  return groups;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  if (/[AaPp][Mm]/.test(timeStr)) return timeStr.trim();
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const isPM = /[Pp][Mm]/.test(ampmMatch[3]);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }
  const parts = timeStr.split(":").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 9999;
}

function scoreClass(score: number | null, par: number): string {
  if (score === null || score === 0) return "";
  const diff = score - par;
  if (diff <= -2) return "bg-yellow-100 text-yellow-800 font-bold"; // eagle+
  if (diff === -1) return "bg-emerald-100 text-[#1A1A1A] font-bold"; // birdie
  if (diff === 1) return "bg-red-50 text-red-700"; // bogey
  if (diff >= 2) return "bg-red-100 text-red-800"; // double+
  return ""; // par
}

// ─── Main Component ─────────────────────────────────────────────

export default function RoundHub({
  trip,
  rounds,
  scorecards,
  skinsGames,
  currentUserId,
  onRefresh,
}: RoundHubProps) {
  // Get all tee time items, sorted by date then time
  const teeTimeItems = trip.schedule
    .filter((s) => s.type === "tee_time")
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, TabKey>>({});

  if (teeTimeItems.length === 0) return null;

  function toggleCard(itemId: string) {
    setExpandedCard((prev) => (prev === itemId ? null : itemId));
  }

  function selectTab(itemId: string, tab: TabKey) {
    setActiveTab((prev) => ({ ...prev, [itemId]: tab }));
  }

  function getMemberName(memberId: string): string {
    return trip.members.find((m) => m.id === memberId)?.name || "Unknown";
  }

  function getMemberHandicap(memberId: string): number {
    return trip.members.find((m) => m.id === memberId)?.handicap || 0;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏌️</span>
        <h2 className="text-lg font-semibold text-zinc-900">Your Rounds</h2>
        <span className="text-xs text-zinc-400">
          {teeTimeItems.length} round{teeTimeItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {teeTimeItems.map((item, idx) => {
          const isExpanded = expandedCard === item.id;
          const tab = activeTab[item.id] || "pairings";
          const linkedRound = rounds.find(
            (r) => r.itineraryItemId === item.id
          );
          const linkedScorecard = scorecards.find(
            (sc) => sc.itineraryItemId === item.id
          );
          const linkedSkins = skinsGames.find(
            (sg) => sg.itineraryItemId === item.id
          );
          const isBooked = item.bookingStatus === "booked";

          return (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => toggleCard(item.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D94F2B]">
                      Round {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      — {item.title}
                    </span>
                    {isBooked ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-[#D94F2B]">
                        Booked
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Needs Booking
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    {item.date && <span>{formatDate(item.date)}</span>}
                    {item.time && <span>{formatTime(item.time)}</span>}
                    {item.cost > 0 && <span>${item.cost}/pp</span>}
                    {item.description && (
                      <span className="hidden sm:inline text-zinc-400 truncate max-w-48">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-400 shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-100">
                  {/* Tab Buttons */}
                  <div className="flex overflow-x-auto border-b border-zinc-100">
                    {(
                      [
                        { key: "pairings" as TabKey, label: "Pairings", icon: Users },
                        { key: "scorecard" as TabKey, label: "Scorecard", icon: ClipboardList },
                        { key: "leaderboard" as TabKey, label: "Leaderboard", icon: Medal },
                        { key: "skins" as TabKey, label: "Skins", icon: Trophy },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => selectTab(item.id, t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                          tab === t.key
                            ? "border-[#D94F2B] text-[#D94F2B]"
                            : "border-transparent text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-5">
                    {tab === "pairings" && (
                      <PairingsTab
                        trip={trip}
                        item={item}
                        round={linkedRound}
                        getMemberName={getMemberName}
                        getMemberHandicap={getMemberHandicap}
                        onRefresh={onRefresh}
                      />
                    )}
                    {tab === "scorecard" && (
                      <ScorecardTab
                        trip={trip}
                        item={item}
                        scorecard={linkedScorecard}
                        round={linkedRound}
                        currentUserId={currentUserId}
                        getMemberName={getMemberName}
                        onRefresh={onRefresh}
                      />
                    )}
                    {tab === "leaderboard" && (
                      <LeaderboardTab
                        scorecards={scorecards}
                      />
                    )}
                    {tab === "skins" && (
                      <SkinsTab
                        trip={trip}
                        item={item}
                        skinsGame={linkedSkins}
                        round={linkedRound}
                        getMemberName={getMemberName}
                        onRefresh={onRefresh}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pairings Tab ───────────────────────────────────────────────

function PairingsTab({
  trip,
  item,
  round,
  getMemberName,
  getMemberHandicap,
  onRefresh,
}: {
  trip: Trip;
  item: ScheduleItem;
  round: Round | undefined;
  getMemberName: (id: string) => string;
  getMemberHandicap: (id: string) => number;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const memberIds = trip.members.map((m) => m.id);
      const groups = makeGroups(memberIds, 4);
      await createRound({
        tripId: trip.id,
        name: `Round — ${item.title}`,
        courseName: item.title,
        date: item.date,
        groupSize: 4,
        groups,
        itineraryItemId: item.id,
      });
      await onRefresh();
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleReshuffle() {
    if (!round) return;
    setLoading(true);
    try {
      const memberIds = trip.members.map((m) => m.id);
      const groups = makeGroups(memberIds, round.groups[0]?.length || 4);
      await updateRound(round.id, { groups });
      await onRefresh();
    } catch {
      // silent
    }
    setLoading(false);
  }

  if (!round) {
    return (
      <div className="text-center py-4">
        <Users className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm text-zinc-500">
          No pairings yet for this round.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading || trip.members.length < 2}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B83D25] disabled:opacity-50"
        >
          <Shuffle className="h-3.5 w-3.5" />
          {loading ? "Generating..." : "Generate Pairings"}
        </button>
        {trip.members.length < 2 && (
          <p className="mt-2 text-xs text-zinc-400">
            Need at least 2 members
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {round.groups.length} group{round.groups.length !== 1 ? "s" : ""} ·{" "}
          {trip.members.length} players
        </p>
        <button
          onClick={handleReshuffle}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          <Shuffle className="h-3.5 w-3.5" />
          {loading ? "..." : "Reshuffle"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {round.groups.map((group, gi) => (
          <div
            key={gi}
            className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Group {gi + 1}
            </p>
            <div className="mt-2 space-y-1.5">
              {group.map((memberId) => (
                <div
                  key={memberId}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-700">
                    {getMemberName(memberId)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    HCP {getMemberHandicap(memberId)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scorecard Tab ──────────────────────────────────────────────

function ScorecardTab({
  trip,
  item,
  scorecard,
  round,
  currentUserId,
  getMemberName,
  onRefresh,
}: {
  trip: Trip;
  item: ScheduleItem;
  scorecard: Scorecard | undefined;
  round: Round | undefined;
  currentUserId: string | null;
  getMemberName: (id: string) => string;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for scores — this is the key fix: controlled inputs need local state
  // so typing works immediately without waiting for API round-trips
  const [localScores, setLocalScores] = useState<(number | null)[][]>([]);
  const [localPars, setLocalPars] = useState<number[]>(DEFAULT_PARS);

  // ─── OCR photo upload state ─────────────────────────────────
  const [ocrUploading, setOcrUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    players: { name: string; scores: (number | null)[]; total: number | null }[];
    pars?: (number | null)[];
    confidence?: string;
    notes?: string;
  } | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrConfirming, setOcrConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(file: File) {
    if (!scorecard || !trip) return;
    setOcrUploading(true);
    setOcrError(null);
    setOcrResult(null);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(
        `/api/trips/${trip.id}/scorecards/${scorecard.id}/upload-photo`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        setOcrError(data.error || "Failed to process photo");
        return;
      }
      setOcrResult(data.extracted);
    } catch {
      setOcrError("Network error. Check your connection and try again.");
    } finally {
      setOcrUploading(false);
    }
  }

  async function handleOcrConfirm() {
    if (!scorecard || !trip || !ocrResult) return;
    setOcrConfirming(true);
    try {
      const res = await fetch(
        `/api/trips/${trip.id}/scorecards/${scorecard.id}/confirm-ocr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            players: ocrResult.players,
            pars: ocrResult.pars,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setOcrError(data.error || "Failed to save scores");
        return;
      }
      setOcrResult(null);
      await onRefresh();
    } catch {
      setOcrError("Network error. Check your connection and try again.");
    } finally {
      setOcrConfirming(false);
    }
  }

  // Refs for Tab navigation across all score inputs
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Sync local state when scorecard prop changes (initial load, external refresh)
  useEffect(() => {
    if (scorecard) {
      setLocalScores(scorecard.players.map((p) => [...p.scores]));
      setLocalPars(
        scorecard.pars.length === 18 ? [...scorecard.pars] : [...DEFAULT_PARS]
      );
    }
  }, [scorecard]);

  const refKey = (pi: number, hi: number) => `${pi}-${hi}`;

  const setInputRef = useCallback(
    (pi: number, hi: number) => (el: HTMLInputElement | null) => {
      const key = refKey(pi, hi);
      if (el) inputRefs.current.set(key, el);
      else inputRefs.current.delete(key);
    },
    []
  );

  // Focus the next hole input (same player) on Tab / Enter
  function focusNextHole(playerIdx: number, holeIdx: number) {
    const nextHole = holeIdx + 1;
    if (nextHole < 18) {
      const next = inputRefs.current.get(refKey(playerIdx, nextHole));
      if (next) {
        next.focus();
        next.select();
      }
    }
  }

  async function handleCreate() {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const playerIds = round
        ? round.groups.flat()
        : trip.members.map((m) => m.id);

      const players = trip.members
        .filter((m) => playerIds.includes(m.id))
        .map((m) => ({
          id: m.id,
          name: m.name,
          handicap: m.handicap,
          scores: Array(18).fill(null),
        }));

      await createScorecard({
        userId: currentUserId,
        tripId: trip.id,
        courseName: item.title,
        courseApiId: null,
        teeName: "",
        date: item.date,
        pars: DEFAULT_PARS,
        yardages: [],
        handicaps: [],
        players,
        itineraryItemId: item.id,
      });
      await onRefresh();
    } catch {
      // silent
    }
    setLoading(false);
  }

  // Save a single score via the granular PATCH endpoint
  async function saveScore(
    playerIdx: number,
    holeIdx: number,
    value: string
  ) {
    if (!scorecard) return;
    const parsed =
      value === "" ? null : Math.min(Math.max(parseInt(value) || 1, 1), 15);

    // Update local state immediately so the UI reflects the validated value
    setLocalScores((prev) => {
      const next = prev.map((row) => [...row]);
      if (next[playerIdx]) next[playerIdx][holeIdx] = parsed;
      return next;
    });

    setSaving(true);
    try {
      const res = await fetch(
        `/api/scorecards/${scorecard.id}/entries/${playerIdx}/${holeIdx}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: parsed }),
        }
      );
      if (!res.ok) throw new Error("Save failed");
    } catch {
      // Revert on error by refreshing from server
      await onRefresh();
    }
    setSaving(false);
  }

  async function handleParChange(holeIdx: number, value: string) {
    if (!scorecard) return;
    const parsed = parseInt(value) || 4;
    setLocalPars((prev) => {
      const next = [...prev];
      next[holeIdx] = parsed;
      return next;
    });
    setSaving(true);
    try {
      const newPars = [...localPars];
      newPars[holeIdx] = parsed;
      await updateScorecard(scorecard.id, { pars: newPars });
    } catch {
      await onRefresh();
    }
    setSaving(false);
  }

  if (!scorecard) {
    return (
      <div className="text-center py-4">
        <ClipboardList className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm text-zinc-500">
          No scorecard started for this round.
        </p>
        <button
          onClick={handleCreate}
          disabled={loading || !currentUserId}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B83D25] disabled:opacity-50"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          {loading ? "Creating..." : "Start Scorecard"}
        </button>
      </div>
    );
  }

  const pars = localPars;
  const front9Par = pars.slice(0, 9).reduce((a, b) => a + b, 0);
  const back9Par = pars.slice(9, 18).reduce((a, b) => a + b, 0);
  const totalPar = front9Par + back9Par;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {scorecard.players.length} player
          {scorecard.players.length !== 1 ? "s" : ""} · Par {totalPar}
        </p>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-amber-500 animate-pulse">
              Saving...
            </span>
          )}
          {/* Photo upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhotoUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrUploading}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition"
            title="Upload scorecard photo for AI score extraction"
          >
            {ocrUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {ocrUploading ? "Reading..." : "Scan Photo"}
          </button>
        </div>
      </div>

      {/* OCR error */}
      {ocrError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-700">{ocrError}</p>
          </div>
          <button
            onClick={() => setOcrError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* OCR confirmation modal */}
      {ocrResult && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#D94F2B]" />
              <h4
                className="text-sm font-semibold text-[#1A1A1A]"
              >
                Scores Extracted from Photo
              </h4>
            </div>
            {ocrResult.confidence && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ocrResult.confidence === "high"
                    ? "bg-emerald-100 text-[#D94F2B]"
                    : ocrResult.confidence === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {ocrResult.confidence} confidence
              </span>
            )}
          </div>

          {ocrResult.notes && (
            <p className="text-xs text-zinc-500 mb-3 italic">
              {ocrResult.notes}
            </p>
          )}

          {/* Preview extracted scores */}
          <div className="overflow-x-auto -mx-1 px-1 mb-3">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-emerald-200">
                  <th className="px-1 py-1 text-left font-semibold text-[#D94F2B] min-w-[70px]">
                    Player
                  </th>
                  {Array.from({ length: 18 }, (_, i) => (
                    <th
                      key={i}
                      className="px-0.5 py-1 text-center font-medium text-[#D94F2B] w-6"
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-1 py-1 text-center font-bold text-[#D94F2B]">
                    TOT
                  </th>
                </tr>
              </thead>
              <tbody>
                {ocrResult.players.map((player, pi) => {
                  const total = player.scores.reduce(
                    (a: number, b) => a + (b ?? 0),
                    0
                  );
                  return (
                    <tr key={pi} className="border-b border-emerald-100">
                      <td className="px-1 py-1 font-medium text-zinc-700 truncate max-w-[70px]">
                        {player.name}
                      </td>
                      {player.scores.map((s, hi) => (
                        <td
                          key={hi}
                          className={`px-0.5 py-1 text-center ${
                            s !== null
                              ? "text-zinc-800"
                              : "text-zinc-300"
                          }`}
                        >
                          {s ?? "-"}
                        </td>
                      ))}
                      <td className="px-1 py-1 text-center font-bold text-zinc-700">
                        {total || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Confirm / Cancel buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOcrConfirm}
              disabled={ocrConfirming}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B83D25] disabled:opacity-50 transition"
            >
              {ocrConfirming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {ocrConfirming ? "Saving..." : "Apply Scores"}
            </button>
            <button
              onClick={() => setOcrResult(null)}
              disabled={ocrConfirming}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              <X className="h-3.5 w-3.5" />
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-1 py-1.5 text-left font-semibold text-zinc-500 sticky left-0 bg-white z-10 min-w-[80px]">
                Hole
              </th>
              {Array.from({ length: 9 }, (_, i) => (
                <th
                  key={i}
                  className="px-0.5 py-1.5 text-center font-semibold text-zinc-500 min-w-[36px]"
                >
                  {i + 1}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-bold text-zinc-700 bg-zinc-50 min-w-[40px]">
                OUT
              </th>
              {Array.from({ length: 9 }, (_, i) => (
                <th
                  key={i + 9}
                  className="px-0.5 py-1.5 text-center font-semibold text-zinc-500 min-w-[36px]"
                >
                  {i + 10}
                </th>
              ))}
              <th className="px-1 py-1.5 text-center font-bold text-zinc-700 bg-zinc-50 min-w-[40px]">
                IN
              </th>
              <th className="px-1 py-1.5 text-center font-bold text-zinc-700 bg-zinc-50 min-w-[40px]">
                TOT
              </th>
            </tr>
            {/* Par row */}
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <td className="px-1 py-1 text-left font-medium text-zinc-400 sticky left-0 bg-zinc-50/50 z-10">
                Par
              </td>
              {pars.slice(0, 9).map((p, i) => (
                <td key={i} className="px-0.5 py-0.5 text-center">
                  <input
                    type="number"
                    min="3"
                    max="6"
                    value={p}
                    onChange={(e) => handleParChange(i, e.target.value)}
                    className="min-w-[32px] min-h-[32px] w-8 rounded border border-zinc-200 px-0 py-0.5 text-center text-xs text-zinc-600 focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                  />
                </td>
              ))}
              <td className="px-1 py-1 text-center font-bold text-zinc-600 bg-zinc-50">
                {front9Par}
              </td>
              {pars.slice(9, 18).map((p, i) => (
                <td key={i + 9} className="px-0.5 py-0.5 text-center">
                  <input
                    type="number"
                    min="3"
                    max="6"
                    value={p}
                    onChange={(e) => handleParChange(i + 9, e.target.value)}
                    className="min-w-[32px] min-h-[32px] w-8 rounded border border-zinc-200 px-0 py-0.5 text-center text-xs text-zinc-600 focus:border-[#D94F2B] focus:outline-none focus:ring-1 focus:ring-[#D94F2B]/30"
                  />
                </td>
              ))}
              <td className="px-1 py-1 text-center font-bold text-zinc-600 bg-zinc-50">
                {back9Par}
              </td>
              <td className="px-1 py-1 text-center font-bold text-zinc-600 bg-zinc-50">
                {totalPar}
              </td>
            </tr>
          </thead>
          <tbody>
            {scorecard.players.map((player, pi) => {
              const scores = localScores[pi] ?? player.scores;
              const front9 = scores
                .slice(0, 9)
                .reduce((a: number, b) => a + (b ?? 0), 0);
              const back9 = scores
                .slice(9, 18)
                .reduce((a: number, b) => a + (b ?? 0), 0);
              const total = front9 + back9;
              const hasAnyScores = scores.some((s) => s !== null);

              return (
                <tr
                  key={player.id}
                  className="border-b border-zinc-50"
                >
                  <td className="px-1 py-1 text-left font-medium text-zinc-700 sticky left-0 bg-white z-10 truncate max-w-[80px]">
                    {player.name}
                  </td>
                  {/* Front 9 */}
                  {scores.slice(0, 9).map((score, hi) => (
                    <td key={hi} className="px-0.5 py-0.5 text-center">
                      <ScoreInput
                        value={score}
                        par={pars[hi]}
                        ref={setInputRef(pi, hi)}
                        onChange={(val) => {
                          setLocalScores((prev) => {
                            const next = prev.map((row) => [...row]);
                            if (next[pi]) next[pi][hi] = val;
                            return next;
                          });
                        }}
                        onSave={(val) => saveScore(pi, hi, val)}
                        onAdvance={() => focusNextHole(pi, hi)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center font-bold text-zinc-700 bg-zinc-50">
                    {hasAnyScores ? front9 : "-"}
                  </td>
                  {/* Back 9 */}
                  {scores.slice(9, 18).map((score, hi) => (
                    <td key={hi + 9} className="px-0.5 py-0.5 text-center">
                      <ScoreInput
                        value={score}
                        par={pars[hi + 9]}
                        ref={setInputRef(pi, hi + 9)}
                        onChange={(val) => {
                          setLocalScores((prev) => {
                            const next = prev.map((row) => [...row]);
                            if (next[pi]) next[pi][hi + 9] = val;
                            return next;
                          });
                        }}
                        onSave={(val) => saveScore(pi, hi + 9, val)}
                        onAdvance={() => focusNextHole(pi, hi + 9)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center font-bold text-zinc-700 bg-zinc-50">
                    {hasAnyScores ? back9 : "-"}
                  </td>
                  <td className="px-1 py-1 text-center font-bold text-zinc-900 bg-zinc-50">
                    {hasAnyScores ? total : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Score Input Cell ───────────────────────────────────────────

import React from "react";

const ScoreInput = React.forwardRef<
  HTMLInputElement,
  {
    value: number | null;
    par: number;
    onChange: (val: number | null) => void;
    onSave: (rawValue: string) => void;
    onAdvance: () => void;
  }
>(function ScoreInput({ value, par, onChange, onSave, onAdvance }, ref) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function handleFocus() {
    setEditing(true);
    setDraft(value !== null ? String(value) : "");
  }

  function commitAndBlur() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === "" && value === null) return; // no change
    if (trimmed !== "" && parseInt(trimmed) === value) return; // no change
    onSave(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAndBlur();
      onAdvance();
    }
    if (e.key === "Tab") {
      // Let default Tab behavior fire, but save first
      commitAndBlur();
      // After a tick, advance to next hole (same player row)
      setTimeout(() => onAdvance(), 0);
      e.preventDefault();
    }
  }

  const colorClass = scoreClass(value, par);

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      min={1}
      max={15}
      value={editing ? draft : value !== null ? String(value) : ""}
      placeholder="-"
      onFocus={handleFocus}
      onBlur={commitAndBlur}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
        setDraft(raw);
        const n = parseInt(raw);
        if (!isNaN(n) && n >= 1 && n <= 15) {
          onChange(n);
        } else if (raw === "") {
          onChange(null);
        }
      }}
      onKeyDown={handleKeyDown}
      className={`min-w-[32px] min-h-[32px] w-8 h-8 rounded border px-0 py-0.5 text-center text-xs transition-colors focus:border-[#D94F2B] focus:outline-none focus:ring-2 focus:ring-[#D94F2B]/30 ${
        editing
          ? "border-emerald-400 bg-white"
          : colorClass
            ? `border-transparent ${colorClass}`
            : "border-zinc-200"
      }`}
    />
  );
});

// ─── Leaderboard Tab ────────────────────────────────────────────

function LeaderboardTab({ scorecards }: { scorecards: Scorecard[] }) {
  const entries = buildLeaderboard(scorecards);

  if (entries.length === 0) {
    return (
      <div className="text-center py-4">
        <Medal className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm text-zinc-500">
          No scores yet. Complete a scorecard to see standings.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-3 py-2 text-left font-semibold text-zinc-700">
              #
            </th>
            <th className="px-3 py-2 text-left font-semibold text-zinc-700">
              Player
            </th>
            <th className="px-3 py-2 text-center font-semibold text-zinc-700">
              Rnds
            </th>
            <th className="px-3 py-2 text-center font-semibold text-zinc-700">
              Total
            </th>
            <th className="px-3 py-2 text-center font-semibold text-zinc-700">
              +/-
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const vsPar = entry.totalGross - entry.totalPar;
            const vsParStr =
              vsPar > 0 ? `+${vsPar}` : vsPar === 0 ? "E" : `${vsPar}`;
            return (
              <tr
                key={entry.name}
                className={`border-b border-zinc-50 ${
                  idx === 0 ? "bg-emerald-50/50" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium text-zinc-500">
                  {idx === 0 && "🏆 "}
                  {idx + 1}
                </td>
                <td className="px-3 py-2 font-semibold text-zinc-900">
                  {entry.name}
                </td>
                <td className="px-3 py-2 text-center text-zinc-500">
                  {entry.rounds}
                </td>
                <td className="px-3 py-2 text-center text-zinc-700 font-medium">
                  {entry.totalGross}
                </td>
                <td
                  className={`px-3 py-2 text-center font-bold ${
                    vsPar > 0
                      ? "text-blue-600"
                      : vsPar < 0
                        ? "text-red-600"
                        : "text-zinc-700"
                  }`}
                >
                  {vsParStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function buildLeaderboard(
  scorecards: Scorecard[]
): {
  name: string;
  rounds: number;
  totalGross: number;
  totalPar: number;
}[] {
  const map = new Map<
    string,
    { rounds: number; totalGross: number; totalPar: number }
  >();

  for (const sc of scorecards) {
    const cardPar = sc.pars.reduce((a, b) => a + b, 0);
    for (const player of sc.players) {
      const hasScores = player.scores.some((s) => s !== null);
      if (!hasScores) continue;
      const gross = player.scores.reduce(
        (a: number, b) => a + (b ?? 0),
        0
      );
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
      totalGross: data.totalGross,
      totalPar: data.totalPar,
    }))
    .sort((a, b) => a.totalGross - a.totalPar - (b.totalGross - b.totalPar));
}

// ─── Skins Tab ──────────────────────────────────────────────────

function SkinsTab({
  trip,
  item,
  skinsGame,
  round,
  getMemberName,
  onRefresh,
}: {
  trip: Trip;
  item: ScheduleItem;
  skinsGame: SkinsGame | undefined;
  round: Round | undefined;
  getMemberName: (id: string) => string;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [stake, setStake] = useState("5");

  async function handleCreate() {
    setLoading(true);
    try {
      // Use players from round pairings if available, otherwise all trip members
      const playerIds = round
        ? round.groups.flat()
        : trip.members.map((m) => m.id);

      const holes: SkinsHole[] = Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        scores: {},
      }));

      await createSkinsGame({
        tripId: trip.id,
        name: `Skins — ${item.title}`,
        stake: parseFloat(stake) || 5,
        players: playerIds,
        holes,
        itineraryItemId: item.id,
      });
      await onRefresh();
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleScoreChange(
    holeIndex: number,
    playerId: string,
    value: string
  ) {
    if (!skinsGame) return;
    try {
      const updatedHoles = [...skinsGame.holes];
      const hole = { ...updatedHoles[holeIndex] };
      hole.scores = { ...hole.scores };
      if (value === "" || value === "0") {
        delete hole.scores[playerId];
      } else {
        hole.scores[playerId] = parseInt(value) || 0;
      }
      updatedHoles[holeIndex] = hole;
      await updateSkinsGame(skinsGame.id, { holes: updatedHoles });
      await onRefresh();
    } catch {
      // silent
    }
  }

  if (!skinsGame) {
    return (
      <div className="text-center py-4">
        <Trophy className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-sm text-zinc-500">
          No skins game for this round.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <label className="text-xs text-zinc-500">Stake $</label>
          <input
            type="number"
            min="1"
            step="1"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm text-center text-zinc-900 focus:border-[#D94F2B] focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B83D25] disabled:opacity-50"
          >
            <Trophy className="h-3.5 w-3.5" />
            {loading ? "Creating..." : "Start Skins Game"}
          </button>
        </div>
      </div>
    );
  }

  // Calculate results
  const { holeResults, totals } = calculateSkinsResults(skinsGame);
  const totalSkinsWon = Object.values(totals).reduce(
    (sum, t) => sum + t.skins,
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {skinsGame.players.length} players · ${skinsGame.stake.toFixed(2)}/skin
          · {totalSkinsWon} skin{totalSkinsWon !== 1 ? "s" : ""} won
        </p>
      </div>

      {/* Scorecard grid */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-1.5 py-1.5 text-left font-semibold text-zinc-500">
                Hole
              </th>
              {skinsGame.players.map((playerId) => (
                <th
                  key={playerId}
                  className="px-1 py-1.5 text-center font-semibold text-zinc-500"
                >
                  {getMemberName(playerId).split(" ")[0]}
                </th>
              ))}
              <th className="px-1.5 py-1.5 text-center font-semibold text-zinc-500">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }, (_, i) => {
              const hole = skinsGame.holes[i];
              const result = holeResults[i];
              return (
                <tr
                  key={i}
                  className={`border-b border-zinc-50 ${
                    i === 8 ? "border-b-2 border-b-zinc-200" : ""
                  }`}
                >
                  <td className="px-1.5 py-1 font-medium text-zinc-600">
                    {i + 1}
                  </td>
                  {skinsGame.players.map((playerId) => (
                    <td key={playerId} className="px-0.5 py-0.5">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={hole?.scores[playerId] || ""}
                        onBlur={(e) =>
                          handleScoreChange(i, playerId, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleScoreChange(
                              i,
                              playerId,
                              (e.target as HTMLInputElement).value
                            );
                          }
                        }}
                        className="w-10 rounded border border-zinc-200 px-1 py-0.5 text-center text-xs text-zinc-900 focus:border-[#D94F2B] focus:outline-none"
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="px-1.5 py-1 text-center">
                    {result?.winner ? (
                      <span className="font-semibold text-[#D94F2B]">
                        {getMemberName(result.winner).split(" ")[0]}
                        {result.skinsValue > 1 && ` (${result.skinsValue})`}
                      </span>
                    ) : result?.carryover ? (
                      <span className="text-amber-500">Carry</span>
                    ) : (
                      <span className="text-zinc-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Results summary */}
      <div className="mt-4 rounded-lg bg-zinc-50 p-3">
        <h4 className="text-xs font-semibold text-zinc-700">Results</h4>
        <div className="mt-2 space-y-1.5">
          {skinsGame.players
            .sort(
              (a, b) => (totals[b]?.skins || 0) - (totals[a]?.skins || 0)
            )
            .map((playerId) => {
              const t = totals[playerId];
              return (
                <div
                  key={playerId}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-zinc-700">
                    {getMemberName(playerId)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">
                      {t?.skins || 0} skin
                      {(t?.skins || 0) !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        (t?.winnings || 0) > 0
                          ? "text-[#D94F2B]"
                          : "text-zinc-400"
                      }`}
                    >
                      ${(t?.winnings || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Settlements */}
      {(() => {
        const settlements = calculateSkinsSettlements(skinsGame, totals);
        if (settlements.length === 0) return null;
        return (
          <div className="mt-3 rounded-lg bg-zinc-50 p-3">
            <h4 className="text-xs font-semibold text-zinc-700">Settlement</h4>
            <div className="mt-2 space-y-1.5">
              {settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5"
                >
                  <p className="text-xs text-zinc-700">
                    <span className="font-medium">
                      {getMemberName(s.from)}
                    </span>
                    {" owes "}
                    <span className="font-medium">{getMemberName(s.to)}</span>
                  </p>
                  <span className="text-xs font-semibold text-[#D94F2B]">
                    ${s.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Skins Calculation Helpers ──────────────────────────────────

function calculateSkinsResults(game: SkinsGame) {
  const totals: Record<string, { skins: number; winnings: number }> = {};
  game.players.forEach((p) => {
    totals[p] = { skins: 0, winnings: 0 };
  });

  const holeResults: {
    number: number;
    winner: string | null;
    skinsValue: number;
    carryover: boolean;
  }[] = [];
  let carryover = 0;

  for (let i = 0; i < 18; i++) {
    const hole = game.holes[i];
    if (!hole || Object.keys(hole.scores).length === 0) {
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: false,
      });
      continue;
    }

    const scores = Object.entries(hole.scores).filter(
      ([id]) => game.players.includes(id) && hole.scores[id] > 0
    );

    if (scores.length === 0) {
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: false,
      });
      continue;
    }

    const minScore = Math.min(...scores.map(([, s]) => s));
    const winners = scores.filter(([, s]) => s === minScore);

    if (winners.length === 1) {
      const winnerId = winners[0][0];
      const skinsValue = 1 + carryover;
      holeResults.push({
        number: i + 1,
        winner: winnerId,
        skinsValue,
        carryover: false,
      });
      if (totals[winnerId]) {
        totals[winnerId].skins += skinsValue;
        totals[winnerId].winnings += skinsValue * game.stake;
      }
      carryover = 0;
    } else {
      carryover += 1;
      holeResults.push({
        number: i + 1,
        winner: null,
        skinsValue: 0,
        carryover: true,
      });
    }
  }

  return { holeResults, totals };
}

function calculateSkinsSettlements(
  game: SkinsGame,
  totals: Record<string, { skins: number; winnings: number }>
): { from: string; to: string; amount: number }[] {
  const totalSkinsWon = Object.values(totals).reduce(
    (sum, t) => sum + t.skins,
    0
  );
  if (totalSkinsWon === 0) return [];

  const totalPot = totalSkinsWon * game.stake;
  const costPerPlayer = totalPot / game.players.length;

  const debtors: { id: string; remaining: number }[] = [];
  const creditors: { id: string; remaining: number }[] = [];

  for (const id of game.players) {
    const net = (totals[id]?.skins || 0) * game.stake - costPerPlayer;
    if (net < -0.005) {
      debtors.push({ id, remaining: -net });
    } else if (net > 0.005) {
      creditors.push({ id, remaining: net });
    }
  }

  debtors.sort((a, b) => b.remaining - a.remaining);
  creditors.sort((a, b) => b.remaining - a.remaining);

  const settlements: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].remaining, creditors[j].remaining);
    settlements.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(payment * 100) / 100,
    });
    debtors[i].remaining -= payment;
    creditors[j].remaining -= payment;
    if (debtors[i].remaining < 0.005) i++;
    if (creditors[j].remaining < 0.005) j++;
  }

  return settlements;
}
