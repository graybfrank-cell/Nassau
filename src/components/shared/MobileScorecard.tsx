"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MobileScorecardProps {
  players: { id: string; name: string }[];
  scorecards: {
    playerId: string;
    holes: number[];
    total?: number;
  }[];
  pars?: number[];
  onScoreChange: (playerId: string, holeIndex: number, score: number) => void;
  onSave: (playerId: string, holes: number[]) => void;
  readOnly?: boolean;
  canEditAll?: boolean;
  startingHole?: number;
  skinsStatus?: Record<number, { winnerId: string | null; carryover: boolean }>;
  nassauStatus?: {
    front: Record<string, number>;
    back: Record<string, number>;
    total: Record<string, number>;
  } | null;
}

function getScoreLabel(score: number, par: number): string {
  if (!score || !par) return "";
  const diff = score - par;
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  return `+${diff}`;
}

function getScoreColor(score: number, par: number): string {
  if (!score || !par) return "border-zinc-700 bg-zinc-800 text-zinc-400";
  const diff = score - par;
  if (diff <= -2) return "border-amber-500 bg-amber-950/50";
  if (diff === -1) return "border-emerald-500 bg-emerald-950/50";
  if (diff === 0) return "border-zinc-600 bg-zinc-800";
  if (diff === 1) return "border-red-700 bg-red-950/50";
  if (diff === 2) return "border-red-500 bg-red-950/50";
  return "border-red-800 bg-red-950/50";
}

function getScoreTextStyle(score: number, par: number): React.CSSProperties {
  if (!score || !par) return { color: "#9ca3af" };
  const diff = score - par;
  if (diff <= -2) return { color: "#FFD700", filter: "drop-shadow(0 0 6px #FFD700)" };
  if (diff === -1) return { color: "#22C55E" };
  if (diff === 0) return { color: "#F3EDE4" };
  if (diff === 1) return { color: "#FCA5A5" };
  if (diff === 2) return { color: "#EF4444" };
  return { color: "#991B1B" };
}

function triggerHaptic(pattern: number | number[]) {
  try {
    if (navigator?.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Not supported
  }
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

export default function MobileScorecard({
  players,
  scorecards,
  pars,
  onScoreChange,
  onSave,
  readOnly = false,
  canEditAll = false,
  startingHole = 1,
  skinsStatus,
  nassauStatus,
}: MobileScorecardProps) {
  const [currentHolePosition, setCurrentHolePosition] = useState(0);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  const defaultPars = pars || [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
  const holeOrder = getHoleOrder(startingHole);
  const currentHoleIndex = holeOrder[currentHolePosition];
  const currentPar = defaultPars[currentHoleIndex];
  const isFirstHalf = currentHolePosition < 9;

  const getPlayerScores = useCallback(
    (playerId: string): number[] => {
      const sc = scorecards.find((s) => s.playerId === playerId);
      return sc?.holes || Array(18).fill(0);
    },
    [scorecards]
  );

  // Auto-advance: when all players have a score for the current hole, advance after 800ms
  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setAutoAdvanceCountdown(false);

    const allScored = players.every((p) => {
      const sc = scorecards.find((s) => s.playerId === p.id);
      return (sc?.holes[currentHoleIndex] || 0) > 0;
    });

    if (allScored && currentHolePosition < 17) {
      setAutoAdvanceCountdown(true);
      autoAdvanceTimer.current = setTimeout(() => {
        setAutoAdvanceCountdown(false);
        setCurrentHolePosition((prev) => Math.min(prev + 1, 17));
      }, 800);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecards, currentHoleIndex, currentHolePosition, players]);

  function handleScoreInput(playerId: string, value: number) {
    if (readOnly && !canEditAll) return;
    triggerHaptic(30);
    onScoreChange(playerId, currentHoleIndex, value);

    // Debounced save
    if (saveTimers.current[playerId]) {
      clearTimeout(saveTimers.current[playerId]);
    }
    saveTimers.current[playerId] = setTimeout(() => {
      const holes = [...getPlayerScores(playerId)];
      holes[currentHoleIndex] = value;
      triggerHaptic([50, 30, 50]);
      onSave(playerId, holes);
    }, 600);
  }

  function handleQuickScore(playerId: string, score: number) {
    handleScoreInput(playerId, score);
  }

  function goToHole(position: number) {
    if (position >= 0 && position < 18) {
      setCurrentHolePosition(position);
    }
  }

  // Swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) {
        goToHole(currentHolePosition + 1);
      } else {
        goToHole(currentHolePosition - 1);
      }
    }
    touchDeltaX.current = 0;
  }

  // Running totals
  function getRunningTotal(playerId: string): number {
    const scores = getPlayerScores(playerId);
    let total = 0;
    for (let i = 0; i <= currentHolePosition; i++) {
      total += scores[holeOrder[i]] || 0;
    }
    return total;
  }

  function getRunningPar(): number {
    let total = 0;
    for (let i = 0; i <= currentHolePosition; i++) {
      total += defaultPars[holeOrder[i]];
    }
    return total;
  }

  function getFullTotal(playerId: string): number {
    const scores = getPlayerScores(playerId);
    return scores.reduce((a, b) => a + (b || 0), 0);
  }

  const runningPar = getRunningPar();

  return (
    <div className="sm:hidden" ref={containerRef}>
      {/* ── Hole Selector Strip ── */}
      <div className="flex items-center gap-0.5 overflow-x-auto pb-2 scrollbar-hide">
        {holeOrder.map((holeIdx, position) => {
          const allScored = players.every((p) => {
            const scores = getPlayerScores(p.id);
            return scores[holeIdx] > 0;
          });
          return (
            <button
              key={position}
              onClick={() => goToHole(position)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                position === currentHolePosition
                  ? "bg-[#D94F2B] text-white"
                  : allScored
                    ? "bg-zinc-700 text-zinc-300"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {holeIdx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Hole Card ── */}
      <div
        className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hole header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToHole(currentHolePosition - 1)}
            disabled={currentHolePosition === 0}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {isFirstHalf ? "Front 9" : "Back 9"}
            </p>
            <p className="text-3xl font-bold text-white">
              Hole {currentHoleIndex + 1}
            </p>
            <p className="text-sm text-zinc-400">Par {currentPar}</p>
          </div>

          <button
            onClick={() => goToHole(currentHolePosition + 1)}
            disabled={currentHolePosition === 17}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Skins status for this hole */}
        {skinsStatus && skinsStatus[currentHoleIndex] && (
          <div className="mt-2 text-center">
            {skinsStatus[currentHoleIndex].carryover ? (
              <span className="inline-flex items-center rounded-full bg-amber-950/50 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                Skin carries over
              </span>
            ) : skinsStatus[currentHoleIndex].winnerId ? (
              <span className="inline-flex items-center rounded-full bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                Skin won by{" "}
                {players.find((p) => p.id === skinsStatus[currentHoleIndex].winnerId)
                  ?.name || "—"}
              </span>
            ) : null}
          </div>
        )}

        {/* Player scores */}
        <div className="mt-4 space-y-3">
          {players.map((player) => {
            const scores = getPlayerScores(player.id);
            const currentScore = scores[currentHoleIndex] || 0;
            const runTotal = getRunningTotal(player.id);
            const fullTotal = getFullTotal(player.id);

            return (
              <div
                key={player.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {player.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Thru {currentHolePosition + 1}: {runTotal || "—"}
                      {runTotal > 0 && (
                        <span
                          className={
                            runTotal - runningPar > 0
                              ? " text-red-400"
                              : runTotal - runningPar < 0
                                ? " text-emerald-400"
                                : ""
                          }
                        >
                          {" "}
                          ({runTotal - runningPar > 0 ? "+" : ""}
                          {runTotal - runningPar})
                        </span>
                      )}
                      {fullTotal > 0 && (
                        <span className="text-zinc-600">
                          {" "}&middot; Total: {fullTotal}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Score display */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-bold ${getScoreColor(currentScore, currentPar)}`}
                    style={getScoreTextStyle(currentScore, currentPar)}
                  >
                    {currentScore || "—"}
                  </div>
                </div>

                {/* Score label */}
                {currentScore > 0 && (
                  <p className="mt-1 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {getScoreLabel(currentScore, currentPar)}
                  </p>
                )}

                {/* Quick tap buttons */}
                {!(readOnly && !canEditAll) && (
                  <div className="mt-2 flex gap-1.5">
                    {Array.from({ length: 7 }, (_, i) => {
                      const score = currentPar - 2 + i;
                      if (score < 1) return null;
                      const isActive = currentScore === score;
                      return (
                        <button
                          key={score}
                          onClick={() => handleQuickScore(player.id, score)}
                          className={`flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-bold transition-all active:scale-95 ${
                            isActive
                              ? "bg-[#D94F2B] text-white ring-2 ring-[#D94F2B]/30"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Auto-advance countdown bar */}
        {autoAdvanceCountdown && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: "#D94F2B",
                animation: "shrinkBar 800ms linear forwards",
              }}
            />
            <style>{`@keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }`}</style>
          </div>
        )}

        {/* Nassau status */}
        {nassauStatus && (
          <div className="mt-4 flex gap-2">
            {["front", "back", "total"].map((segment) => {
              const label =
                segment === "front"
                  ? "Front"
                  : segment === "back"
                    ? "Back"
                    : "18";
              const data = nassauStatus[segment as keyof typeof nassauStatus];
              if (!data) return null;
              const entries = Object.entries(data);
              const leader = entries.length > 0
                ? entries.reduce((a, b) => (b[1] < a[1] ? b : a))
                : null;
              const leaderName = leader
                ? players.find((p) => p.id === leader[0])?.name || "—"
                : "—";
              return (
                <div
                  key={segment}
                  className="flex-1 rounded-lg bg-zinc-800/50 px-2 py-1.5 text-center"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {label}
                  </p>
                  <p className="text-xs font-medium text-zinc-300 truncate">
                    {leaderName}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Running Totals Strip ── */}
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          Leaderboard
        </p>
        <div className="space-y-1.5">
          {players
            .map((p) => ({
              ...p,
              total: getFullTotal(p.id),
              runTotal: getRunningTotal(p.id),
            }))
            .sort((a, b) => {
              if (a.total === 0 && b.total === 0) return 0;
              if (a.total === 0) return 1;
              if (b.total === 0) return -1;
              return a.total - b.total;
            })
            .map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      idx === 0 && p.total > 0
                        ? "bg-[#D94F2B] text-white"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">
                    {p.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-white">
                  {p.total || "—"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
