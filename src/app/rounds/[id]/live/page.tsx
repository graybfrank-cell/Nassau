"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getGameRound,
  saveGameScorecard,
} from "@/lib/game-store";
import { GameRound } from "@/lib/types";
import { calculateNassauBet } from "@/components/shared/NassauBetCalculator";
import {
  Home,
  Flag,
  Map as MapIcon,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  bg: "#111111",
  cream: "#F2F0EB",
  coral: "#2D5A3D",
  teal: "#2D5A3D",
  gold: "#B8976A",
  surface: "#1A1A1A",
  muted: "#8A8A8A",
  dimmed: "#2A2A2A",
} as const;

// Font handled by Tailwind config

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
const DEFAULT_YARDAGES = [
  385, 410, 370, 185, 520, 405, 175, 430, 540, 395, 420, 165, 510, 390, 415,
  195, 445, 530,
];

// ---------------------------------------------------------------------------
// Skins calculation — preserved from SkinsCalculator.tsx
// ---------------------------------------------------------------------------
interface SkinResult {
  hole: number;
  holeIndex: number;
  winnerId: string | null;
  skinsValue: number;
  carryover: boolean;
}

function getHoleOrder(startingHole: number): number[] {
  if (startingHole === 10) {
    return [
      ...Array.from({ length: 9 }, (_, i) => i + 9),
      ...Array.from({ length: 9 }, (_, i) => i),
    ];
  }
  return Array.from({ length: 18 }, (_, i) => i);
}

function calculateSkins(
  scorecards: { playerId: string; holes: number[] }[],
  playerIds: string[],
  buyIn: number,
  startingHole: number = 1,
) {
  const holeOrder = getHoleOrder(startingHole);
  const holeResults: SkinResult[] = [];
  const totals: Record<string, { skins: number; winnings: number }> = {};
  playerIds.forEach((id) => {
    totals[id] = { skins: 0, winnings: 0 };
  });

  let carryover = 0;

  for (let i = 0; i < 18; i++) {
    const idx = holeOrder[i];
    const displayHole = idx + 1;

    const allPlayersPosted = playerIds.every((id) => {
      const sc = scorecards.find((s) => s.playerId === id);
      return sc && sc.holes[idx] != null && sc.holes[idx] > 0;
    });

    if (!allPlayersPosted) {
      holeResults.push({
        hole: displayHole,
        holeIndex: idx,
        winnerId: null,
        skinsValue: 0,
        carryover: false,
      });
      continue;
    }

    const scores: { playerId: string; score: number }[] = [];

    for (const sc of scorecards) {
      if (!playerIds.includes(sc.playerId)) continue;
      const score = sc.holes[idx];
      if (score != null && score > 0) {
        scores.push({ playerId: sc.playerId, score });
      }
    }

    const minScore = Math.min(...scores.map((s) => s.score));
    const winners = scores.filter((s) => s.score === minScore);

    if (winners.length === 1) {
      const winnerId = winners[0].playerId;
      const skinsValue = 1 + carryover;
      holeResults.push({
        hole: displayHole,
        holeIndex: idx,
        winnerId,
        skinsValue,
        carryover: false,
      });
      totals[winnerId].skins += skinsValue;
      totals[winnerId].winnings += skinsValue * buyIn;
      carryover = 0;
    } else {
      carryover += 1;
      holeResults.push({
        hole: displayHole,
        holeIndex: idx,
        winnerId: null,
        skinsValue: 0,
        carryover: true,
      });
    }
  }

  return { holeResults, totals, carryoverCount: carryover };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getScoreCellClasses(
  score: number,
  par: number,
): { bg: string; text: string } {
  if (!score || !par) return { bg: "transparent", text: C.dimmed };
  const diff = score - par;
  if (diff <= -2) return { bg: C.teal, text: "#FFFFFF" };
  if (diff === -1)
    return { bg: `${C.teal}66`, text: C.teal };
  if (diff === 0) return { bg: "transparent", text: C.muted };
  if (diff === 1) return { bg: `${C.coral}33`, text: C.cream };
  return { bg: "rgba(127,29,29,0.4)", text: "#F87171" };
}

function getScoreLabel(diff: number): string {
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "+2";
  if (diff === 3) return "+3";
  if (diff === 4) return "+4";
  return "8+";
}

function getPlayerInitial(name: string): string {
  return (name || "?").charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LiveScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.id as string;

  const [round, setRound] = useState<GameRound | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Local scorecard state for realtime editing
  const [localScorecards, setLocalScorecards] = useState<
    Map<string, number[]>
  >(new Map());

  // Score entry sheet
  const [scoreSheet, setScoreSheet] = useState<{
    open: boolean;
    playerIndex: number;
    holeIndex: number;
  }>({ open: false, playerIndex: 0, holeIndex: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Refresh round data
  const refresh = useCallback(async () => {
    const r = await getGameRound(roundId);
    if (r) {
      setRound(r);
      const map = new Map<string, number[]>();
      for (const sc of r.scorecards) {
        map.set(sc.playerId, [...sc.holes]);
      }
      setLocalScorecards(map);
    }
  }, [roundId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);
        try {
          await refresh();
        } catch {
          // API error — round will stay null
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router, refresh]);

  // Polling for live updates every 10s
  useEffect(() => {
    if (!round) return;
    const interval = setInterval(() => {
      refresh();
    }, 10_000);
    return () => clearInterval(interval);
  }, [round, refresh]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: C.bg }}
      >
        <p style={{ color: C.muted }} className="text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!round) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: C.bg }}
      >
        <h2 className="text-lg font-semibold" style={{ color: C.cream }}>
          Round not found
        </h2>
        <Link
          href="/rounds"
          className="text-sm font-medium"
          style={{ color: C.coral }}
        >
          Back to Rounds
        </Link>
      </div>
    );
  }

  // Derived data
  const confirmedPlayers = round.players.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => p.status === "confirmed" || p.role === "COMMISSIONER",
  );
  const pars = DEFAULT_PARS;
  const yardages = DEFAULT_YARDAGES;
  const startingHole: number = round.startingHole ?? 1;
  const holeOrder = getHoleOrder(startingHole);

  // Determine current hole (first hole in play order where not all players posted)
  let currentHoleIndex = holeOrder[17]; // default to last
  for (let i = 0; i < 18; i++) {
    const idx = holeOrder[i];
    const allPosted = confirmedPlayers.every(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => {
        const holes = localScorecards.get(p.id) || [];
        return holes[idx] != null && holes[idx] > 0;
      },
    );
    if (!allPosted) {
      currentHoleIndex = idx;
      break;
    }
  }
  const currentHoleNumber = currentHoleIndex + 1;

  // Scorecards for calculations
  const calcScorecards = confirmedPlayers.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => ({
      playerId: p.id as string,
      holes: localScorecards.get(p.id) || Array(18).fill(0),
    }),
  );

  // Skins calculation
  const hasSkins = !!round.skinsGame;
  const skinsBuyIn = round.skinsGame?.buyIn ?? 20;
  const skinsResult = hasSkins
    ? calculateSkins(
        calcScorecards,
        confirmedPlayers.map((p: { id: string }) => p.id),
        skinsBuyIn,
        startingHole,
      )
    : null;

  // Nassau calculation
  const hasNassau = !!round.nassauBet;
  const nassauAmount = round.nassauBet?.betAmount ?? 10;
  const nassauResult = hasNassau
    ? calculateNassauBet(
        calcScorecards,
        confirmedPlayers.map((p: { id: string }) => p.id),
        nassauAmount,
        startingHole,
      )
    : null;

  // Skins derived data
  const skinsPot = hasSkins ? confirmedPlayers.length * skinsBuyIn : 0;
  const skinsCarryoverCount = skinsResult?.carryoverCount ?? 0;

  // Score entry handler
  async function handlePostScore(playerId: string, holeIdx: number, score: number) {
    setLocalScorecards((prev) => {
      const next = new Map(prev);
      const holes = [...(next.get(playerId) || Array(18).fill(0))];
      holes[holeIdx] = score;
      next.set(playerId, holes);
      return next;
    });
    try {
      const holes = [...(localScorecards.get(playerId) || Array(18).fill(0))];
      holes[holeIdx] = score;
      await saveGameScorecard(roundId, { playerId, holes });
      await refresh();
    } catch {
      // Revert on error handled by next refresh
    }
  }

  // Open score sheet for POST SCORES button
  function openPostScores() {
    // Find the first player who hasn't posted for current hole
    const firstUnposted = confirmedPlayers.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => {
        const holes = localScorecards.get(p.id) || [];
        return !holes[currentHoleIndex] || holes[currentHoleIndex] <= 0;
      },
    );
    setScoreSheet({
      open: true,
      playerIndex: firstUnposted >= 0 ? firstUnposted : 0,
      holeIndex: currentHoleIndex,
    });
  }

  // Navigate score sheet between players
  function sheetPrev() {
    setScoreSheet((s) => ({
      ...s,
      playerIndex: Math.max(0, s.playerIndex - 1),
    }));
  }
  function sheetNext() {
    const nextIdx = scoreSheet.playerIndex + 1;
    if (nextIdx >= confirmedPlayers.length) {
      setScoreSheet((s) => ({ ...s, open: false }));
    } else {
      setScoreSheet((s) => ({ ...s, playerIndex: nextIdx }));
    }
  }

  // Nassau helper: find leader and amount for a segment
  function getNassauSegment(
    segment: { winnerId: string | null; scores: Record<string, number> } | undefined,
  ): { leader: string; amount: string } | null {
    if (!segment || Object.keys(segment.scores).length === 0)
      return null;
    if (segment.winnerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const player = confirmedPlayers.find((p: any) => p.id === segment.winnerId);
      return {
        leader: player?.name ?? "Unknown",
        amount: `+$${nassauAmount * (confirmedPlayers.length - 1)}`,
      };
    }
    return { leader: "Push", amount: "—" };
  }

  return (
    <div
      className="min-h-screen pb-36"
      style={{ backgroundColor: C.bg }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* TOP BAR                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between">
          {/* Left: Course name + live indicator */}
          <div>
            <h1
              className="text-lg font-semibold uppercase tracking-wide"
              style={{ color: C.cream }}
            >
              {round.courseName || "LIVE ROUND"}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: C.coral }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: C.coral }}
              >
                LIVE
              </span>
            </div>
          </div>

          {/* Right: Current hole */}
          <div className="text-right">
            <span
              className="text-xl font-semibold"
              style={{ color: C.coral }}
            >
              HOLE {currentHoleNumber}
            </span>
            <div
              className="text-sm"
              style={{ color: C.muted }}
            >
              OF 18
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SCORECARD GRID                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-4">
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: C.surface }}
        >
          <div
            ref={scrollRef}
            className="overflow-x-auto"
          >
            <table className="w-full" style={{ minWidth: 800 }}>
              {/* Header row */}
              <thead>
                <tr style={{ backgroundColor: C.bg }}>
                  <th
                    className="sticky left-0 z-20 px-3 py-2 text-left text-xs uppercase"
                    style={{
                      color: C.muted,
                      backgroundColor: C.bg,
                      minWidth: 100,
                    }}
                  >
                    Player
                  </th>
                  {Array.from({ length: 18 }, (_, i) => {
                    const isCurrent = i === currentHoleIndex;
                    return (
                      <th
                        key={i}
                        className="px-0 py-2 text-center"
                        style={{
                          minWidth: 36,
                          backgroundColor: isCurrent ? C.coral : C.bg,
                        }}
                      >
                        <div
                          className="text-xs"
                          style={{
                            color: isCurrent ? "#FFFFFF" : C.muted,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: isCurrent ? "rgba(255,255,255,0.7)" : C.muted,
                          }}
                        >
                          {pars[i]}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Player rows */}
              <tbody>
                {confirmedPlayers.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (player: any, pIdx: number) => {
                    const holes =
                      localScorecards.get(player.id) || Array(18).fill(0);

                    return (
                      <tr
                        key={player.id}
                        className="border-t"
                        style={{ borderColor: `${C.dimmed}44` }}
                      >
                        <td
                          className="sticky left-0 z-10 px-3 py-2 text-sm font-bold"
                          style={{
                            color: C.cream,
                            backgroundColor: C.surface,
                          }}
                        >
                          {player.name}
                        </td>
                        {Array.from({ length: 18 }, (_, i) => {
                          const score = holes[i] || 0;
                          const par = pars[i];
                          const isCurrent = i === currentHoleIndex;
                          const { bg, text } = getScoreCellClasses(score, par);
                          const isEmpty = !score || score <= 0;
                          const isFuture =
                            holeOrder.indexOf(i) >
                            holeOrder.indexOf(currentHoleIndex);

                          return (
                            <td
                              key={i}
                              className="px-0 py-1 text-center"
                              style={{
                                borderLeft: isCurrent
                                  ? `2px solid ${C.coral}`
                                  : undefined,
                                borderRight: isCurrent
                                  ? `2px solid ${C.coral}`
                                  : undefined,
                              }}
                            >
                              <button
                                onClick={() =>
                                  setScoreSheet({
                                    open: true,
                                    playerIndex: pIdx,
                                    holeIndex: i,
                                  })
                                }
                                className="mx-auto flex h-7 w-7 items-center justify-center rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: isEmpty
                                    ? "transparent"
                                    : bg,
                                  color: isEmpty
                                    ? C.dimmed
                                    : text,
                                }}
                              >
                                {isEmpty
                                  ? isFuture || isCurrent
                                    ? "\u00B7"
                                    : "\u2013"
                                  : score}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SKINS TRACKER CARD                                                 */}
      {/* ----------------------------------------------------------------- */}
      {hasSkins && skinsResult && (
        <div
          className="mx-4 mt-4 rounded-xl p-4"
          style={{ backgroundColor: C.surface }}
        >
          <h3
            className="mb-3 text-xs font-semibold uppercase"
            style={{ color: C.teal }}
          >
            SKINS
          </h3>

          {/* Row of 18 circles */}
          <div className="flex flex-wrap gap-1.5">
            {skinsResult.holeResults.map((result) => {
              const isWon = !!result.winnerId;
              const isCarryover = result.carryover;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const winner = isWon
                ? confirmedPlayers.find(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (p: any) => p.id === result.winnerId,
                  )
                : null;

              return (
                <div
                  key={result.hole}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={
                    isWon
                      ? {
                          backgroundColor: C.teal,
                          color: "#FFFFFF",
                          fontSize: 10,
                          fontWeight: 900,
                        }
                      : isCarryover
                        ? {
                            border: `2px solid ${C.gold}`,
                            color: C.gold,
                            fontSize: 10,
                            fontWeight: 900,
                          }
                        : {
                            backgroundColor: C.dimmed,
                            fontSize: 10,
                          }
                  }
                >
                  {isWon
                    ? getPlayerInitial(winner?.name ?? "")
                    : isCarryover
                      ? "C"
                      : ""}
                </div>
              );
            })}
          </div>

          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: C.coral }}
          >
            Pot: ${skinsPot} &middot; {skinsCarryoverCount} carryover
            {skinsCarryoverCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* NASSAU STATUS CARD                                                 */}
      {/* ----------------------------------------------------------------- */}
      {hasNassau && nassauResult && (
        <div
          className="mx-4 mt-3 rounded-xl p-4"
          style={{ backgroundColor: C.surface }}
        >
          <h3
            className="mb-3 text-xs font-semibold uppercase"
            style={{ color: C.teal }}
          >
            NASSAU
          </h3>

          {[
            { label: "Front 9", segment: nassauResult.frontNine },
            { label: "Back 9", segment: nassauResult.backNine },
            { label: "Overall", segment: nassauResult.overall },
          ].map(({ label, segment }) => {
            const data = getNassauSegment(segment);
            return (
              <div
                key={label}
                className="flex items-center justify-between py-1.5"
              >
                <span
                  className="text-sm"
                  style={{ color: C.muted }}
                >
                  {label}
                </span>
                {data ? (
                  <span
                    className="text-sm font-bold"
                    style={{ color: C.cream }}
                  >
                    {data.leader}{" "}
                    <span
                      style={{
                        color: data.amount.startsWith("+")
                          ? C.coral
                          : "#EF4444",
                      }}
                    >
                      {data.amount}
                    </span>
                  </span>
                ) : (
                  <span
                    className="text-sm"
                    style={{ color: C.muted }}
                  >
                    In progress
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* POST SCORES BUTTON — fixed                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <button
          onClick={openPostScores}
          className="w-full rounded-xl py-4 font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: C.coral }}
        >
          POST SCORES FOR HOLE {currentHoleNumber} &rarr;
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SCORE ENTRY BOTTOM SHEET                                           */}
      {/* ----------------------------------------------------------------- */}
      {scoreSheet.open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ backgroundColor: `${C.bg}E6` }}
          onClick={(e) => {
            if (e.target === e.currentTarget)
              setScoreSheet((s) => ({ ...s, open: false }));
          }}
        >
          <div
            className="rounded-t-2xl p-6"
            style={{ backgroundColor: C.surface }}
          >
            {(() => {
              const player = confirmedPlayers[scoreSheet.playerIndex] as {
                id: string;
                name: string;
              } | undefined;
              const hIdx = scoreSheet.holeIndex;
              const par = pars[hIdx];
              const yds = yardages[hIdx];
              const currentScore =
                (localScorecards.get(player?.id ?? "") || [])[hIdx] || 0;

              // Score options: eagle through 8+
              const scoreOptions = [
                { score: Math.max(1, par - 2), label: "Eagle" },
                { score: Math.max(1, par - 1), label: "Birdie" },
                { score: par, label: "Par" },
                { score: par + 1, label: "Bogey" },
                { score: par + 2, label: "+2" },
                { score: par + 3, label: "+3" },
                { score: par + 4, label: "+4" },
                { score: Math.max(par + 5, 8), label: "8+" },
              ];

              return (
                <>
                  {/* Header */}
                  <p
                    className="mb-2 text-center text-xs uppercase tracking-wider"
                    style={{ color: C.muted }}
                  >
                    HOLE {hIdx + 1} &middot; PAR {par} &middot; {yds} YDS
                  </p>
                  <p
                    className="mb-6 text-center text-2xl font-semibold"
                    style={{ color: C.coral }}
                  >
                    {player?.name ?? "Player"}
                  </p>

                  {/* Score buttons grid 2x4 */}
                  <div className="grid grid-cols-4 gap-2">
                    {scoreOptions.map(({ score, label }) => {
                      const isSelected = currentScore === score;
                      return (
                        <button
                          key={label}
                          onClick={() => {
                            if (player) {
                              handlePostScore(player.id, hIdx, score);
                            }
                          }}
                          className="rounded-xl py-4 text-center"
                          style={{
                            backgroundColor: isSelected ? C.coral : C.dimmed,
                            color: isSelected ? "#FFFFFF" : C.cream,
                          }}
                        >
                          <div className="text-xl font-semibold">{score}</div>
                          <div
                            className="mt-0.5 text-[10px] uppercase"
                            style={{
                              color: isSelected
                                ? "rgba(255,255,255,0.8)"
                                : C.muted,
                            }}
                          >
                            {label}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={sheetPrev}
                      disabled={scoreSheet.playerIndex === 0}
                      className="flex items-center gap-1 text-sm font-bold disabled:opacity-30"
                      style={{ color: C.teal }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={sheetNext}
                      className="flex items-center gap-1 text-sm font-bold"
                      style={{ color: C.coral }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cancel */}
                  <button
                    onClick={() =>
                      setScoreSheet((s) => ({ ...s, open: false }))
                    }
                    className="mt-3 w-full text-center text-sm"
                    style={{ color: C.muted }}
                  >
                    Cancel
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BOTTOM NAV                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-4 py-2"
        style={{
          backgroundColor: C.bg,
          borderColor: C.dimmed,
        }}
      >
        {[
          { icon: Home, label: "Home", href: "/dashboard", active: false },
          { icon: Flag, label: "Rounds", href: "/rounds", active: true },
          { icon: MapIcon, label: "Trips", href: "/trips", active: false },
          { icon: User, label: "Profile", href: "/profile", active: false },
        ].map(({ icon: Icon, label, href, active }) => (
          <Link
            key={label}
            href={href}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-2"
          >
            <Icon
              className="h-5 w-5"
              style={{ color: active ? C.coral : C.muted }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? C.coral : C.muted }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
