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
} from "@/lib/game-store";
import { GameRound } from "@/lib/types";
import { generateRoundSummary } from "@/lib/round-summary";
import ScorecardGrid from "@/components/shared/ScorecardGrid";
import SkinsCalculator from "@/components/shared/SkinsCalculator";
import NassauBetCalculator from "@/components/shared/NassauBetCalculator";
import ExpenseList from "@/components/shared/ExpenseList";
import SettlementList from "@/components/shared/SettlementList";
import ScorecardScanner from "@/components/shared/ScorecardScanner";
import ReceiptScanner from "@/components/shared/ReceiptScanner";
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
} from "lucide-react";

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
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Upcoming
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      Completed
    </span>
  );
}

export default function RoundDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;

  const [round, setRound] = useState<GameRound | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      await refresh();
      setLoading(false);
    });
  }, [router, refresh]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            Round not found
          </h2>
          <Link
            href="/rounds"
            className="mt-4 inline-block text-sm font-medium text-emerald-600"
          >
            Back to Rounds
          </Link>
        </div>
      </div>
    );
  }

  const isCommissioner = round.commissionerId === userId;
  const confirmedPlayers = round.players.filter(
    (p) => p.status === "confirmed" || p.role === "COMMISSIONER"
  );

  // Build scorecard data for grid
  const gridScorecards = confirmedPlayers.map((player) => ({
    playerId: player.id,
    holes: localScorecards.get(player.id) || Array(18).fill(0),
    total: (localScorecards.get(player.id) || []).reduce(
      (a, b) => a + (b || 0),
      0
    ),
  }));

  // Skins data for calculator
  const skinsPlayers = round.skinsGame
    ? confirmedPlayers.map((p) => ({ id: p.id, name: p.name }))
    : [];
  const skinsScorecards = round.skinsGame
    ? confirmedPlayers.map((p) => ({
        playerId: p.id,
        holes: localScorecards.get(p.id) || Array(18).fill(0),
      }))
    : [];

  // Settlement data with player names
  const settlementData = round.settlements.map((s) => ({
    id: s.id,
    fromPlayer: {
      id: s.fromPlayer,
      name:
        round.players.find((p) => p.id === s.fromPlayer)?.name || "Unknown",
    },
    toPlayer: {
      id: s.toPlayer,
      name:
        round.players.find((p) => p.id === s.toPlayer)?.name || "Unknown",
    },
    amount: s.amount,
    reason: s.reason,
    settled: s.settled,
    settledAt: s.settledAt,
  }));

  // Expense data
  const expenseMembers = confirmedPlayers.map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const expenseData = round.expenses.map((e) => ({
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
        const match = confirmedPlayers.find((p) => {
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
      const myPlayer = round!.players.find((p) => p.userId === userId);
      const paidBy = myPlayer?.id || confirmedPlayers[0]?.id;
      const splitAmong = confirmedPlayers.map((p) => p.id);

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
      await updateGameRound(roundId, { status });
      if (status === "completed") {
        await recalculateSettlements(roundId);
      }
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
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
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rounds
        </Link>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Round Header */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {round.courseName}
                </h1>
                <StatusBadge status={round.status} />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatFullDate(round.teeTime)}
                </div>
                {round.courseLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {round.courseLocation}
                  </div>
                )}
                {round.notes && (
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    {round.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCommissioner && round.status === "upcoming" && (
                <button
                  onClick={() => handleStatusChange("in_progress")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Start Round
                </button>
              )}
              {isCommissioner && round.status === "in_progress" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
                >
                  Complete Round
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Players ({confirmedPlayers.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInviteLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
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
              className="mt-4 flex items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-600">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
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
                onClick={() => setShowAddPlayer(false)}
                className="rounded-md border border-zinc-300 p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {round.players.map((player) => (
              <div
                key={player.id}
                className="group flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {player.role === "COMMISSIONER" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-zinc-900">
                    {player.name}
                  </span>
                  {player.status === "confirmed" || player.role === "COMMISSIONER" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : player.status === "declined" ? (
                    <X className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-zinc-300" />
                  )}
                  <span className="text-xs text-zinc-400">
                    {player.status === "confirmed" || player.role === "COMMISSIONER"
                      ? ""
                      : player.status}
                  </span>
                </div>
                {isCommissioner &&
                  player.role !== "COMMISSIONER" && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Scorecard */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">Scorecard</h2>
            </div>
            {confirmedPlayers.length > 0 && (
              <ScorecardScanner
                scanEndpoint={`/api/game-rounds/${roundId}/scorecards/scan`}
                onScanned={handleScorecardScanned}
              />
            )}
          </div>

          {confirmedPlayers.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No confirmed players yet. Add players to start entering scores.
            </p>
          ) : (
            <ScorecardGrid
              players={confirmedPlayers.map((p) => ({
                id: p.id,
                name: p.name,
              }))}
              scorecards={gridScorecards}
              onScoreChange={handleScoreChange}
              onSave={handleSaveScorecard}
              canEditAll={isCommissioner}
            />
          )}
        </div>

        {/* Skins Game */}
        {round.skinsGame && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Skins Game (${round.skinsGame.buyIn} buy-in)
              </h2>
            </div>

            {confirmedPlayers.length < 2 ? (
              <p className="text-sm text-zinc-400">
                Need at least 2 confirmed players for skins.
              </p>
            ) : (
              <SkinsCalculator
                players={skinsPlayers}
                scorecards={skinsScorecards}
                buyIn={round.skinsGame.buyIn}
              />
            )}
          </div>
        )}

        {/* Nassau Bet */}
        {round.nassauBet && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Nassau Bet (${round.nassauBet.betAmount}/bet &middot; $
                {round.nassauBet.betAmount * 3} total at risk)
              </h2>
            </div>

            {confirmedPlayers.length < 2 ? (
              <p className="text-sm text-zinc-400">
                Need at least 2 confirmed players for Nassau bet.
              </p>
            ) : (
              <NassauBetCalculator
                players={confirmedPlayers.map((p) => ({
                  id: p.id,
                  name: p.name,
                }))}
                scorecards={confirmedPlayers.map((p) => ({
                  playerId: p.id,
                  holes: localScorecards.get(p.id) || Array(18).fill(0),
                }))}
                betAmount={round.nassauBet.betAmount}
              />
            )}
          </div>
        )}

        {/* Expenses */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">Expenses</h2>
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
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Settlements
              </h2>
            </div>
            {isCommissioner && (
              <button
                onClick={handleRecalculate}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
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

        {/* Share */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900">Share</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
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
