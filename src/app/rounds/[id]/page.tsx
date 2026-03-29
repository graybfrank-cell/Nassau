"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getGameRound,
  updateGameRound,
  addGamePlayer,
  removeGamePlayer,
  saveGameScorecard,
  addGameExpense,
  deleteGameExpense,
  markSettlement,
  recalculateSettlements,
  createGameSkins,
  deleteGameSkins,
  createGameNassauBet,
  deleteGameNassauBet,
} from "@/lib/game-store";
import { GameRound } from "@/lib/types";
import { generateRoundSummary } from "@/lib/round-summary";
import ScorecardGrid from "@/components/shared/ScorecardGrid";
import MobileScorecard from "@/components/shared/MobileScorecard";
import SkinsCalculator from "@/components/shared/SkinsCalculator";
import NassauBetCalculator from "@/components/shared/NassauBetCalculator";
import ExpenseList from "@/components/shared/ExpenseList";
import SettlementList from "@/components/shared/SettlementList";
import ScorecardScanner from "@/components/shared/ScorecardScanner";
import ReceiptScanner from "@/components/shared/ReceiptScanner";
import AwardsList from "@/components/shared/AwardsList";
import {
  ArrowLeft,
  Users,
  Plus,
  X,
  Link2,
  Check,
  Crown,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Share2,
  Trophy,
  DollarSign,
  ClipboardList,
  CheckCircle2,
  Trash2,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
} from "lucide-react";
import { isWeatherStale } from "@/lib/weather";

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center rounded-full bg-teal/15 px-3 py-1 text-[11px] font-medium text-teal">
        Upcoming
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1 text-[11px] font-medium text-coral">
        <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-cream/[0.08] px-3 py-1 text-[11px] font-medium text-cream/50">
      Completed
    </span>
  );
}

function WeatherIcon({ icon }: { icon: string }) {
  const cls = "h-8 w-8 text-cream/50";
  switch (icon) {
    case "sun":
      return <Sun className={cls} />;
    case "cloud-sun":
      return <CloudSun className={cls} />;
    case "cloud-rain":
      return <CloudRain className={cls} />;
    case "cloud-drizzle":
      return <CloudDrizzle className={cls} />;
    case "cloud-lightning":
      return <CloudLightning className={cls} />;
    case "snowflake":
      return <Snowflake className={cls} />;
    case "cloud-fog":
      return <Cloud className={cls} />;
    default:
      return <Cloud className={cls} />;
  }
}

export default function RoundDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;

  const [round, setRound] = useState<GameRound | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Weather
  const [weatherData, setWeatherData] = useState<any>(null);

  // Player form
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  // Copy states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Local scorecard state for realtime editing
  const [localScorecards, setLocalScorecards] = useState<
    Map<string, number[]>
  >(new Map());

  // Game toggle forms
  const [showAddSkins, setShowAddSkins] = useState(false);
  const [skinsBuyIn, setSkinsBuyIn] = useState("20");
  const [showAddNassau, setShowAddNassau] = useState(false);
  const [nassauBetAmount, setNassauBetAmount] = useState("10");

  // Start Round overlay state
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<"in" | "hold" | "out">("in");

  const refresh = useCallback(async () => {
    const r = await getGameRound(roundId);
    if (r) {
      setRound(r);
      // Sync local scorecards
      const map = new Map<string, number[]>();
      for (const sc of r.scorecards) {
        map.set(sc.playerId, [...sc.holes]);
      }
      setLocalScorecards(map);
    }
  }, [roundId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      try {
        await refresh();
      } catch {
        // API error (403, 404, network) — round will stay null, showing fallback
      }
      setLoading(false);
    }).catch(() => {
      router.push("/login");
    });
  }, [router, refresh]);

  useEffect(() => {
    if (!round?.courseLat || !round?.courseLng) return;
    // Check if round already has cached weather
    if (round.weatherData && !isWeatherStale(round.weatherData)) {
      setWeatherData(round.weatherData);
      return;
    }
    // Fetch fresh weather
    const dateStr = new Date(round.teeTime).toISOString().split('T')[0];
    fetch(`/api/weather?lat=${round.courseLat}&lng=${round.courseLng}&date=${dateStr}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setWeatherData(data); })
      .catch(() => {});
  }, [round]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-cream/40">Loading...</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-cream">
            Round not found
          </h2>
          <p className="mt-2 text-sm text-cream/50">
            This round doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link
            href="/rounds"
            className="mt-4 inline-block text-sm font-medium text-[#D94F2B]"
          >
            Back to Rounds
          </Link>
        </div>
      </div>
    );
  }

  const isCommissioner = round.commissionerId === userId;
  const confirmedPlayers = round.players.filter(
    (p: any) => p.status === "confirmed" || p.role === "COMMISSIONER"
  );

  // Build scorecard data for grid
  const gridScorecards = confirmedPlayers.map((player: any) => ({
    playerId: player.id,
    holes: localScorecards.get(player.id) || Array(18).fill(0),
    total: (localScorecards.get(player.id) || []).reduce(
      (a, b) => a + (b || 0),
      0
    ),
  }));

  // Skins data for calculator
  const skinsPlayers = round.skinsGame
    ? confirmedPlayers.map((p: any) => ({ id: p.id, name: p.name }))
    : [];
  const skinsScorecards = round.skinsGame
    ? confirmedPlayers.map((p: any) => ({
        playerId: p.id,
        holes: localScorecards.get(p.id) || Array(18).fill(0),
      }))
    : [];

  // Settlement data with player names
  const settlementData = round.settlements.map((s: any) => ({
    id: s.id,
    fromPlayer: {
      id: s.fromPlayer,
      name:
        round.players.find((p: any) => p.id === s.fromPlayer)?.name || "Unknown",
    },
    toPlayer: {
      id: s.toPlayer,
      name:
        round.players.find((p: any) => p.id === s.toPlayer)?.name || "Unknown",
    },
    amount: s.amount,
    reason: s.reason,
    settled: s.settled,
    settledAt: s.settledAt,
  }));

  // Expense data
  const expenseMembers = confirmedPlayers.map((p: any) => ({
    id: p.id,
    name: p.name,
  }));
  const expenseData = round.expenses.map((e: any) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    paidBy: e.paidBy,
    splitAmong: e.splitAmong,
    category: e.category,
  }));

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setError(null);
    try {
      await addGamePlayer(roundId, { name: newPlayerName.trim() });
      setNewPlayerName("");
      setShowAddPlayer(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    }
  }

  async function handleRemovePlayer(playerId: string) {
    setError(null);
    try {
      await removeGamePlayer(roundId, playerId);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove player"
      );
    }
  }

  function handleScoreChange(
    playerId: string,
    holeIndex: number,
    score: number
  ) {
    setLocalScorecards((prev) => {
      const next = new Map(prev);
      const holes = [...(next.get(playerId) || Array(18).fill(0))];
      holes[holeIndex] = score;
      next.set(playerId, holes);
      return next;
    });
  }

  async function handleSaveScorecard(playerId: string, holes: number[]) {
    setError(null);
    try {
      await saveGameScorecard(roundId, { playerId, holes });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scores");
    }
  }

  async function handleScorecardScanned(
    scannedPlayers: { name: string; holes: number[] }[]
  ) {
    setError(null);
    try {
      for (const scanned of scannedPlayers) {
        // Fuzzy match scanned name to confirmed players
        const match = confirmedPlayers.find((p: any) => {
          const pName = p.name.toLowerCase();
          const sName = scanned.name.toLowerCase();
          return (
            pName === sName ||
            pName.includes(sName) ||
            sName.includes(pName)
          );
        });
        if (match) {
          await saveGameScorecard(roundId, {
            playerId: match.id,
            holes: scanned.holes,
          });
        }
      }
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save scanned scores"
      );
    }
  }

  async function handleReceiptScanned(
    scannedExpenses: {
      description: string;
      amount: number;
      category: string;
    }[]
  ) {
    setError(null);
    try {
      // Find the current user's player id to use as paidBy
      const myPlayer = round!.players.find((p: any) => p.userId === userId);
      const paidBy = myPlayer?.id || confirmedPlayers[0]?.id;
      const splitAmong = confirmedPlayers.map((p: any) => p.id);

      for (const expense of scannedExpenses) {
        await addGameExpense(roundId, {
          description: expense.description,
          amount: expense.amount,
          paidBy,
          splitAmong,
          category: expense.category,
        });
      }
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save scanned expenses"
      );
    }
  }

  async function handleAddExpense(expense: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    category: string;
  }) {
    setError(null);
    try {
      await addGameExpense(roundId, expense);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add expense"
      );
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setError(null);
    try {
      await deleteGameExpense(roundId, expenseId);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete expense"
      );
    }
  }

  async function handleMarkSettlement(
    settlementId: string,
    settled: boolean
  ) {
    setError(null);
    try {
      await markSettlement(roundId, settlementId, settled);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settlement"
      );
    }
  }

  async function handleRecalculate() {
    setError(null);
    try {
      await recalculateSettlements(roundId);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to recalculate"
      );
    }
  }

  async function handleStatusChange(status: string) {
    setError(null);
    try {
      if (status === "completed") {
        // Use the complete endpoint for full post-round processing
        const res = await fetch(`/api/rounds/${roundId}/complete`, {
          method: "POST",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to complete round");
        }
      } else {
        await updateGameRound(roundId, { status });
      }
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    }
  }

  async function handleAddSkinsGame() {
    setError(null);
    try {
      await createGameSkins(roundId, { buyIn: parseFloat(skinsBuyIn) || 20 });
      setShowAddSkins(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add skins game");
    }
  }

  async function handleRemoveSkinsGame() {
    setError(null);
    try {
      await deleteGameSkins(roundId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove skins game");
    }
  }

  async function handleAddNassauBet() {
    setError(null);
    try {
      await createGameNassauBet(roundId, { betAmount: parseFloat(nassauBetAmount) || 10 });
      setShowAddNassau(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add Nassau bet");
    }
  }

  async function handleRemoveNassauBet() {
    setError(null);
    try {
      await deleteGameNassauBet(roundId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove Nassau bet");
    }
  }

  async function handleStartRound() {
    try {
      if (navigator?.vibrate) navigator.vibrate([100, 50, 100]);
    } catch { /* not supported */ }

    setShowStartOverlay(true);
    setOverlayPhase("in");

    // Hold phase after fade-in
    setTimeout(() => setOverlayPhase("hold"), 200);
    // Fade out
    setTimeout(() => setOverlayPhase("out"), 1200);
    // Dismiss and trigger status change
    setTimeout(async () => {
      setShowStartOverlay(false);
      await handleStatusChange("in_progress");
    }, 1500);
  }

  async function handleStartingHoleChange(hole: number) {
    setError(null);
    try {
      await updateGameRound(roundId, { startingHole: hole });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update starting hole");
    }
  }

  async function handleCopyInviteLink() {
    const link = `${window.location.origin}/round/${round!.shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleShareResults() {
    const text = generateRoundSummary(round!);
    await navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1.5 text-sm text-cream/50 transition-colors hover:text-cream/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rounds
        </Link>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Course Hero */}
        <div className="mt-6 relative h-48 rounded-xl overflow-hidden">
          {round.coursePhotoUrl ? (
            <img src={round.coursePhotoUrl} alt={round.courseName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-cream/[0.04]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h1 className="text-2xl font-bold text-white">{round.courseName}</h1>
            {round.courseLayout && (
              <span className="text-sm text-white/80">{round.courseLayout}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          {/* Weather card */}
          {weatherData && (
            <div className="flex items-center gap-3 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] px-4 py-2">
              <WeatherIcon icon={weatherData.weatherIcon} />
              <div>
                <p className="text-sm font-medium text-cream">{weatherData.tempHigh}&deg;/{weatherData.tempLow}&deg;F</p>
                <p className="text-xs text-cream/50">{weatherData.weatherLabel} &middot; Wind {weatherData.windSpeedMax}mph &middot; {weatherData.precipitationProbability}% rain</p>
              </div>
            </div>
          )}
          {/* Google Maps link */}
          {round.courseLat && round.courseLng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${round.courseLat},${round.courseLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] px-4 py-2 text-sm text-cream/80 hover:bg-cream/[0.06]"
            >
              <MapPin className="h-4 w-4" />
              Open in Google Maps
            </a>
          )}
          {/* Address */}
          {round.courseAddress && (
            <span className="inline-flex items-center gap-1.5 text-sm text-cream/50">
              <MapPin className="h-3.5 w-3.5" />
              {round.courseAddress}
            </span>
          )}
        </div>

        {/* Round Header */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-cream">
                  {round.courseName}
                </h1>
                {round.courseLayout && (
                  <span className="inline-flex items-center rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-medium text-teal">
                    {round.courseLayout}
                  </span>
                )}
                <StatusBadge status={round.status} />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-cream/50">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatFullDate(round.teeTime)}
                </div>
                {round.courseLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-cream/50">
                    <MapPin className="h-3.5 w-3.5" />
                    {round.courseLocation}
                  </div>
                )}
                {round.notes && (
                  <div className="flex items-center gap-1.5 text-sm text-cream/50">
                    <Clock className="h-3.5 w-3.5" />
                    {round.notes}
                  </div>
                )}
                {round.startingHole === 10 && (
                  <span className="inline-flex items-center rounded-full bg-cream/[0.08] px-2 py-0.5 text-xs font-medium text-cream/50">
                    Starting Hole 10
                  </span>
                )}
              </div>
              {isCommissioner && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-cream/40 mb-1">Starting Hole</label>
                  <div className="flex gap-1.5">
                    {[1, 10].map((hole) => (
                      <button
                        key={hole}
                        onClick={() => handleStartingHoleChange(hole)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          round.startingHole === hole
                            ? "bg-coral/15 text-coral"
                            : "bg-cream/[0.06] text-cream/50 hover:bg-cream/[0.08]"
                        }`}
                      >
                        Hole {hole}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCommissioner && round.status === "upcoming" && (
                <button
                  onClick={handleStartRound}
                  className="rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-[#B83D25]"
                >
                  Start Round
                </button>
              )}
              {isCommissioner && round.status === "in_progress" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  className="rounded-lg bg-cream/[0.08] px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/[0.12]"
                >
                  Complete Round
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">
                Players ({confirmedPlayers.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInviteLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cream/10 px-3 py-1.5 text-xs font-semibold text-cream/60 transition-colors hover:text-cream/80"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-coral" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="h-3.5 w-3.5" />
                    Copy Invite Link
                  </>
                )}
              </button>
              {isCommissioner && (
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal transition-colors hover:bg-teal/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Player
                </button>
              )}
            </div>
          </div>

          {showAddPlayer && (
            <form
              onSubmit={handleAddPlayer}
              className="mt-4 flex items-end gap-3 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-4"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-cream/40">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="mt-1 block w-full rounded-[10px] border border-cream/10 bg-transparent px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:border-coral/40 focus:outline-none focus:ring-2 focus:ring-coral/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-coral px-4 py-1.5 text-sm font-medium text-cream hover:bg-[#B83D25]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddPlayer(false)}
                className="rounded-md border border-cream/10 p-1.5 text-cream/40 hover:text-cream/60"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {round.players.map((player: any) => (
              <div
                key={player.id}
                className="group flex items-center justify-between rounded-lg border border-cream/[0.06] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {player.role === "COMMISSIONER" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-cream">
                    {player.name}
                  </span>
                  {player.status === "confirmed" || player.role === "COMMISSIONER" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-coral" />
                  ) : player.status === "declined" ? (
                    <X className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-cream/30" />
                  )}
                  <span className="text-xs text-cream/40">
                    {player.status === "confirmed" || player.role === "COMMISSIONER"
                      ? ""
                      : player.status}
                  </span>
                </div>
                {isCommissioner &&
                  player.role !== "COMMISSIONER" && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="rounded-md p-1 text-cream/30 opacity-0 transition-all hover:bg-coral/10 hover:text-coral group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Ready to Tee Off CTA */}
        {isCommissioner && round.status === "upcoming" && (
          <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6 text-center">
            <p className="text-sm font-medium text-cream/50">Ready to tee off?</p>
            <button
              onClick={handleStartRound}
              className="mt-3 w-full rounded-xl bg-coral py-5 text-lg font-bold text-cream transition-colors hover:bg-[#B83D25] active:scale-[0.98]"
            >
              Start Round 🏌️
            </button>
          </div>
        )}

        {/* Start Round Overlay */}
        {showStartOverlay && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{
              backgroundColor: "#0A0A0A",
              opacity: overlayPhase === "in" ? 0 : overlayPhase === "out" ? 0 : 1,
              transition: "opacity 200ms ease-in-out",
            }}
          >
            <div
              className="text-7xl font-extrabold"
              style={{
                color: "#D94F2B",
                animation: "pulse 0.6s ease-in-out infinite",
              }}
            >
              N
            </div>
            <p className="mt-4 text-lg font-bold" style={{ color: "#F3EDE4" }}>
              Round Started
            </p>
            <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.85; } }`}</style>
          </div>
        )}

        {/* Scorecard */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">Scorecard</h2>
            </div>
            {confirmedPlayers.length > 0 && (
              <ScorecardScanner
                scanEndpoint={`/api/game-rounds/${roundId}/scorecards/scan`}
                onScanned={handleScorecardScanned}
              />
            )}
          </div>

          {confirmedPlayers.length === 0 ? (
            <p className="text-sm text-cream/40">
              No confirmed players yet. Add players to start entering scores.
            </p>
          ) : (
            <>
              {/* Mobile: hole-by-hole swipeable scorecard */}
              <MobileScorecard
                players={confirmedPlayers.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                }))}
                scorecards={gridScorecards}
                onScoreChange={handleScoreChange}
                onSave={handleSaveScorecard}
                canEditAll={isCommissioner}
                startingHole={round.startingHole}
              />
              {/* Desktop: full 18-hole grid */}
              <div className="hidden sm:block">
                <ScorecardGrid
                  players={confirmedPlayers.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                  }))}
                  scorecards={gridScorecards}
                  onScoreChange={handleScoreChange}
                  onSave={handleSaveScorecard}
                  canEditAll={isCommissioner}
                  startingHole={round.startingHole}
                />
              </div>
            </>
          )}
        </div>

        {/* Skins Game */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">
                Skins Game
                {round.skinsGame && ` ($${round.skinsGame.buyIn} buy-in)`}
              </h2>
            </div>
            {isCommissioner && round.skinsGame && (
              <button
                onClick={handleRemoveSkinsGame}
                className="inline-flex items-center gap-1 text-xs text-coral/60 hover:text-coral"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            )}
          </div>

          {round.skinsGame ? (
            confirmedPlayers.length < 2 ? (
              <p className="text-sm text-cream/40">
                Need at least 2 confirmed players for skins.
              </p>
            ) : (
              <SkinsCalculator
                players={skinsPlayers}
                scorecards={skinsScorecards}
                buyIn={round.skinsGame.buyIn}
                startingHole={round.startingHole}
              />
            )
          ) : isCommissioner ? (
            showAddSkins ? (
              <div className="rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-4">
                <label className="block text-xs font-medium text-cream/40">Buy-in</label>
                <div className="mt-1.5 flex items-center gap-2">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSkinsBuyIn(String(amount))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        skinsBuyIn === String(amount)
                          ? "bg-coral/15 text-coral"
                          : "bg-cream/[0.06] text-cream/50 hover:bg-cream/[0.08]"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-cream/40">$</span>
                    <input
                      type="number"
                      min="1"
                      value={skinsBuyIn}
                      onChange={(e) => setSkinsBuyIn(e.target.value)}
                      className="w-20 rounded-lg border border-cream/10 bg-transparent py-1.5 pl-6 pr-2 text-xs text-cream focus:border-coral/40 focus:outline-none focus:ring-1 focus:ring-coral/20"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddSkinsGame}
                    className="rounded-md bg-coral px-4 py-1.5 text-xs font-medium text-cream hover:bg-[#B83D25]"
                  >
                    Create Skins Game
                  </button>
                  <button
                    onClick={() => setShowAddSkins(false)}
                    className="rounded-md border border-cream/10 px-4 py-1.5 text-xs font-medium text-cream/60 hover:bg-cream/[0.06]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSkins(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-cream/10 px-4 py-3 text-sm font-medium text-cream/50 transition-colors hover:border-teal/30 hover:text-teal w-full justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Skins Game
              </button>
            )
          ) : (
            <p className="text-sm text-cream/40">No skins game for this round.</p>
          )}
        </div>

        {/* Nassau Bet */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">
                Nassau Bet
                {round.nassauBet && ` ($${round.nassauBet.betAmount}/bet)`}
              </h2>
            </div>
            {isCommissioner && round.nassauBet && (
              <button
                onClick={handleRemoveNassauBet}
                className="inline-flex items-center gap-1 text-xs text-coral/60 hover:text-coral"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            )}
          </div>

          {round.nassauBet ? (
            confirmedPlayers.length < 2 ? (
              <p className="text-sm text-cream/40">
                Need at least 2 confirmed players for Nassau bet.
              </p>
            ) : (
              <NassauBetCalculator
                players={confirmedPlayers.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                }))}
                scorecards={confirmedPlayers.map((p: any) => ({
                  playerId: p.id,
                  holes: localScorecards.get(p.id) || Array(18).fill(0),
                }))}
                betAmount={round.nassauBet.betAmount}
                startingHole={round.startingHole}
              />
            )
          ) : isCommissioner ? (
            showAddNassau ? (
              <div className="rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-4">
                <label className="block text-xs font-medium text-cream/40">Per-bet amount</label>
                <div className="mt-1.5 flex items-center gap-2">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setNassauBetAmount(String(amount))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        nassauBetAmount === String(amount)
                          ? "bg-coral/15 text-coral"
                          : "bg-cream/[0.06] text-cream/50 hover:bg-cream/[0.08]"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-cream/40">$</span>
                    <input
                      type="number"
                      min="1"
                      value={nassauBetAmount}
                      onChange={(e) => setNassauBetAmount(e.target.value)}
                      className="w-20 rounded-lg border border-cream/10 bg-transparent py-1.5 pl-6 pr-2 text-xs text-cream focus:border-coral/40 focus:outline-none focus:ring-1 focus:ring-coral/20"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-cream/40">
                  3 bets: front 9, back 9, total 18 &middot; Total at risk: $
                  {(parseFloat(nassauBetAmount) || 0) * 3} per player
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddNassauBet}
                    className="rounded-md bg-coral px-4 py-1.5 text-xs font-medium text-cream hover:bg-[#B83D25]"
                  >
                    Create Nassau Bet
                  </button>
                  <button
                    onClick={() => setShowAddNassau(false)}
                    className="rounded-md border border-cream/10 px-4 py-1.5 text-xs font-medium text-cream/60 hover:bg-cream/[0.06]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddNassau(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-cream/10 px-4 py-3 text-sm font-medium text-cream/50 transition-colors hover:border-teal/30 hover:text-teal w-full justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Nassau Bet
              </button>
            )
          ) : (
            <p className="text-sm text-cream/40">No Nassau bet for this round.</p>
          )}
        </div>

        {/* Expenses */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">Expenses</h2>
            </div>
            {confirmedPlayers.length > 0 && (
              <ReceiptScanner
                scanEndpoint={`/api/game-rounds/${roundId}/expenses/scan-receipt`}
                onScanned={handleReceiptScanned}
              />
            )}
          </div>

          <ExpenseList
            members={expenseMembers}
            expenses={expenseData}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            canDelete={() => isCommissioner}
          />
        </div>

        {/* Settlements */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cream/40" />
              <h2 className="text-lg font-semibold text-cream">
                Settlements
              </h2>
            </div>
            {isCommissioner && (
              <button
                onClick={handleRecalculate}
                className="text-xs font-medium text-coral hover:text-coral/80"
              >
                Recalculate
              </button>
            )}
          </div>

          <SettlementList
            settlements={settlementData}
            currentUserId={userId}
            onMarkSettled={handleMarkSettlement}
            canManageAll={isCommissioner}
          />
        </div>

        {/* Awards */}
        {round.status === "completed" &&
          round.awards &&
          Array.isArray(round.awards) &&
          round.awards.length > 0 && (
            <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-cream">
                  Post-Round Awards
                </h2>
              </div>
              <AwardsList awards={round.awards} />
            </div>
          )}

        {/* Share */}
        <div className="mt-6 rounded-[10px] border border-cream/[0.08] bg-cream/[0.04] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-cream/40" />
            <h2 className="text-lg font-semibold text-cream">Share</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream/10 px-4 py-2 text-sm font-medium text-cream/60 transition-colors hover:text-cream/80"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-coral" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Copy Round Link
                </>
              )}
            </button>
            <button
              onClick={handleShareResults}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream/10 px-4 py-2 text-sm font-medium text-cream/60 transition-colors hover:text-cream/80"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-4 w-4 text-coral" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share Results
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
