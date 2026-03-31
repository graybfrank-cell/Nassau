"use client";

import { NassauBetResults } from "@/lib/types";

interface NassauBetCalculatorProps {
  players: { id: string; name: string }[];
  scorecards: { playerId: string; holes: number[] }[];
  betAmount: number;
  startingHole?: number;
}

// Get front/back 9 indices based on starting hole
function getNassauIndices(startingHole: number): { front: number[]; back: number[] } {
  if (startingHole === 10) {
    // Front 9 = holes 10-18 (first 9 played), Back 9 = holes 1-9 (last 9 played)
    return {
      front: Array.from({ length: 9 }, (_, i) => i + 9),
      back: Array.from({ length: 9 }, (_, i) => i),
    };
  }
  return {
    front: Array.from({ length: 9 }, (_, i) => i),
    back: Array.from({ length: 9 }, (_, i) => i + 9),
  };
}

export function calculateNassauBet(
  scorecards: { playerId: string; holes: number[] }[],
  playerIds: string[],
  betAmount: number,
  startingHole: number = 1
): NassauBetResults {
  const { front: frontIndices, back: backIndices } = getNassauIndices(startingHole);

  const frontScores: Record<string, number> = {};
  const backScores: Record<string, number> = {};
  const overallScores: Record<string, number> = {};

  let frontComplete = false;
  let backComplete = false;

  // Calculate scores for each player
  const activeScorecards = scorecards.filter((sc) =>
    playerIds.includes(sc.playerId)
  );

  if (activeScorecards.length >= 2) {
    // Check front 9 completeness
    const frontReady = activeScorecards.every((sc) =>
      frontIndices.every((idx) => sc.holes[idx] > 0)
    );
    // Check back 9 completeness
    const backReady = activeScorecards.every((sc) =>
      backIndices.every((idx) => sc.holes[idx] > 0)
    );

    if (frontReady) {
      frontComplete = true;
      for (const sc of activeScorecards) {
        frontScores[sc.playerId] = frontIndices.reduce(
          (a, idx) => a + (sc.holes[idx] || 0), 0
        );
      }
    }

    if (backReady) {
      backComplete = true;
      for (const sc of activeScorecards) {
        backScores[sc.playerId] = backIndices.reduce(
          (a, idx) => a + (sc.holes[idx] || 0), 0
        );
      }
    }
  }

  // Overall is only complete if both front and back are complete
  if (frontComplete && backComplete) {
    for (const sc of activeScorecards) {
      overallScores[sc.playerId] =
        (frontScores[sc.playerId] || 0) + (backScores[sc.playerId] || 0);
    }
  }

  // Find winners for each segment
  function findWinner(
    scores: Record<string, number>
  ): string | null {
    const entries = Object.entries(scores);
    if (entries.length < 2) return null;
    const minScore = Math.min(...entries.map(([, s]) => s));
    const winners = entries.filter(([, s]) => s === minScore);
    // Tie = push (no winner)
    return winners.length === 1 ? winners[0][0] : null;
  }

  const frontWinner = frontComplete ? findWinner(frontScores) : null;
  const backWinner = backComplete ? findWinner(backScores) : null;
  const overallWinner =
    frontComplete && backComplete ? findWinner(overallScores) : null;

  // Calculate payouts
  const payouts: Record<string, number> = {};
  for (const id of playerIds) {
    payouts[id] = 0;
  }

  const numPlayers = playerIds.length;

  // Front 9 payout
  if (frontWinner) {
    payouts[frontWinner] += betAmount * (numPlayers - 1);
    for (const id of playerIds) {
      if (id !== frontWinner) {
        payouts[id] -= betAmount;
      }
    }
  }

  // Back 9 payout
  if (backWinner) {
    payouts[backWinner] += betAmount * (numPlayers - 1);
    for (const id of playerIds) {
      if (id !== backWinner) {
        payouts[id] -= betAmount;
      }
    }
  }

  // Overall payout
  if (overallWinner) {
    payouts[overallWinner] += betAmount * (numPlayers - 1);
    for (const id of playerIds) {
      if (id !== overallWinner) {
        payouts[id] -= betAmount;
      }
    }
  }

  return {
    frontNine: { winnerId: frontWinner, scores: frontScores },
    backNine: { winnerId: backWinner, scores: backScores },
    overall: { winnerId: overallWinner, scores: overallScores },
    payouts,
  };
}

function SegmentSection({
  label,
  winnerId,
  scores,
  players,
  complete,
  waitingLabel,
}: {
  label: string;
  winnerId: string | null;
  scores: Record<string, number>;
  players: { id: string; name: string }[];
  complete: boolean;
  waitingLabel: string;
}) {
  if (!complete) {
    return (
      <div className="py-2">
        <span className="text-xs font-semibold text-zinc-500">{label}</span>
        <p className="mt-1 text-xs text-zinc-400">
          Waiting for {waitingLabel} scores
        </p>
      </div>
    );
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b);
  const minScore = sorted.length > 0 ? sorted[0][1] : 0;
  const tiedWinners =
    sorted.filter(([, s]) => s === minScore).length > 1;

  return (
    <div className="py-2">
      <span className="text-xs font-semibold text-zinc-500">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {sorted.map(([playerId, score]) => {
          const player = players.find((p) => p.id === playerId);
          const isWinner = winnerId === playerId;
          const isTied = tiedWinners && score === minScore;
          return (
            <span
              key={playerId}
              className={`text-sm ${isWinner ? "font-bold text-[#2D5A3D]" : "text-zinc-700"}`}
            >
              {isWinner && "\u{1F3C6} "}
              {player?.name}: {score}
              {isTied && (
                <span className="ml-1 text-xs text-amber-500">(push)</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function NassauBetCalculator({
  players,
  scorecards,
  betAmount,
  startingHole = 1,
}: NassauBetCalculatorProps) {
  const playerIds = players.map((p) => p.id);
  const results = calculateNassauBet(scorecards, playerIds, betAmount, startingHole);

  const frontComplete = Object.keys(results.frontNine.scores).length >= 2;
  const backComplete = Object.keys(results.backNine.scores).length >= 2;
  const overallComplete = Object.keys(results.overall.scores).length >= 2;

  const totalAtRisk = betAmount * 3;

  // Labels adjust based on starting hole
  const frontLabel = startingHole === 10 ? "Front 9 (Holes 10\u201318)" : "Front 9";
  const backLabel = startingHole === 10 ? "Back 9 (Holes 1\u20139)" : "Back 9";

  return (
    <div>
      <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
        <span>${betAmount}/bet</span>
        <span>${totalAtRisk} total at risk</span>
        <span>{players.length} players</span>
      </div>

      <div className="space-y-1 divide-y divide-zinc-100">
        <SegmentSection
          label={frontLabel}
          winnerId={results.frontNine.winnerId}
          scores={results.frontNine.scores}
          players={players}
          complete={frontComplete}
          waitingLabel="front 9"
        />
        <SegmentSection
          label={backLabel}
          winnerId={results.backNine.winnerId}
          scores={results.backNine.scores}
          players={players}
          complete={backComplete}
          waitingLabel="back 9"
        />
        <SegmentSection
          label="Overall (18)"
          winnerId={results.overall.winnerId}
          scores={results.overall.scores}
          players={players}
          complete={overallComplete}
          waitingLabel="all"
        />
      </div>

      {/* Net Results */}
      <div className="mt-4 rounded-lg bg-zinc-50 p-4">
        <h4 className="text-sm font-semibold text-zinc-700">Net Results</h4>
        <div className="mt-3 space-y-2">
          {players
            .sort(
              (a, b) =>
                (results.payouts[b.id] || 0) - (results.payouts[a.id] || 0)
            )
            .map((player) => {
              const net = results.payouts[player.id] || 0;
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-700">{player.name}</span>
                  <span
                    className={`text-sm font-semibold ${
                      net > 0
                        ? "text-[#2D5A3D]"
                        : net < 0
                          ? "text-red-500"
                          : "text-zinc-400"
                    }`}
                  >
                    {net > 0 ? "+" : ""}${net.toFixed(2)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
