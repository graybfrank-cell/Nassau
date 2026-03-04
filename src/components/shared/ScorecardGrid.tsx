"use client";

import { useState, useCallback } from "react";

interface ScorecardGridProps {
  players: { id: string; name: string }[];
  scorecards: {
    playerId: string;
    holes: number[];
    total?: number;
    frontNine?: number;
    backNine?: number;
  }[];
  pars?: number[];
  onScoreChange: (playerId: string, holeIndex: number, score: number) => void;
  onSave: (playerId: string, holes: number[]) => void;
  readOnly?: boolean;
  canEditAll?: boolean;
  startingHole?: number;
}

function getScoreColor(score: number, par: number): string {
  if (!score || !par) return "";
  const diff = score - par;
  if (diff <= -2) return "bg-yellow-100 text-yellow-800 font-bold"; // eagle+
  if (diff === -1) return "bg-emerald-100 text-emerald-700"; // birdie
  if (diff === 0) return ""; // par
  if (diff === 1) return "bg-red-50 text-red-600"; // bogey
  return "bg-red-100 text-red-700 font-bold"; // double+
}

// Build ordered indices: if startingHole=10, first half is [9..17], second half is [0..8]
function getHoleOrder(startingHole: number): number[] {
  if (startingHole === 10) {
    return [...Array.from({ length: 9 }, (_, i) => i + 9), ...Array.from({ length: 9 }, (_, i) => i)];
  }
  return Array.from({ length: 18 }, (_, i) => i);
}

export default function ScorecardGrid({
  players,
  scorecards,
  pars,
  onScoreChange,
  onSave,
  readOnly = false,
  canEditAll = false,
  startingHole = 1,
}: ScorecardGridProps) {
  const [saveTimers, setSaveTimers] = useState<Record<string, NodeJS.Timeout>>(
    {}
  );

  const getPlayerScores = useCallback(
    (playerId: string): number[] => {
      const sc = scorecards.find((s) => s.playerId === playerId);
      return sc?.holes || Array(18).fill(0);
    },
    [scorecards]
  );

  function handleChange(playerId: string, holeIndex: number, value: string) {
    if (readOnly) return;
    const score = parseInt(value) || 0;
    onScoreChange(playerId, holeIndex, score);

    // Debounced save
    const key = playerId;
    if (saveTimers[key]) clearTimeout(saveTimers[key]);
    const timer = setTimeout(() => {
      const holes = getPlayerScores(playerId);
      const updated = [...holes];
      updated[holeIndex] = score;
      onSave(playerId, updated);
    }, 800);
    setSaveTimers((prev) => ({ ...prev, [key]: timer }));
  }

  const defaultPars = pars || [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
  const holeOrder = getHoleOrder(startingHole);
  const firstHalf = holeOrder.slice(0, 9);
  const secondHalf = holeOrder.slice(9, 18);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left text-xs font-semibold text-zinc-500">
              Hole
            </th>
            {firstHalf.map((idx) => (
              <th
                key={idx}
                className="px-1 py-2 text-center text-xs font-semibold text-zinc-500 min-w-[36px]"
              >
                {idx + 1}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
              OUT
            </th>
            {secondHalf.map((idx) => (
              <th
                key={idx}
                className="px-1 py-2 text-center text-xs font-semibold text-zinc-500 min-w-[36px]"
              >
                {idx + 1}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
              IN
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-zinc-700 bg-zinc-100">
              TOT
            </th>
          </tr>
          {/* Par row */}
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <td className="sticky left-0 z-10 bg-zinc-50/50 px-2 py-1 text-xs font-medium text-zinc-400">
              Par
            </td>
            {firstHalf.map((idx) => (
              <td key={idx} className="px-1 py-1 text-center text-xs text-zinc-400">
                {defaultPars[idx]}
              </td>
            ))}
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-50">
              {firstHalf.reduce((a, idx) => a + defaultPars[idx], 0)}
            </td>
            {secondHalf.map((idx) => (
              <td key={idx} className="px-1 py-1 text-center text-xs text-zinc-400">
                {defaultPars[idx]}
              </td>
            ))}
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-50">
              {secondHalf.reduce((a, idx) => a + defaultPars[idx], 0)}
            </td>
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-100">
              {defaultPars.reduce((a, b) => a + b, 0)}
            </td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const scores = getPlayerScores(player.id);
            const front = firstHalf.reduce((a, idx) => a + (scores[idx] || 0), 0);
            const back = secondHalf.reduce((a, idx) => a + (scores[idx] || 0), 0);
            const total = front + back;

            return (
              <tr
                key={player.id}
                className="border-b border-zinc-50"
              >
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 whitespace-nowrap">
                  {player.name}
                </td>
                {firstHalf.map((idx) => (
                  <td key={idx} className="px-0.5 py-0.5">
                    {readOnly && !canEditAll ? (
                      <div
                        className={`flex items-center justify-center h-8 w-full rounded text-xs ${getScoreColor(scores[idx], defaultPars[idx])}`}
                      >
                        {scores[idx] || "-"}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={scores[idx] || ""}
                        onChange={(e) =>
                          handleChange(player.id, idx, e.target.value)
                        }
                        className={`w-full h-8 rounded border border-zinc-200 px-0.5 text-center text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${getScoreColor(scores[idx], defaultPars[idx])}`}
                        placeholder="-"
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
                  {front || "-"}
                </td>
                {secondHalf.map((idx) => (
                  <td key={idx} className="px-0.5 py-0.5">
                    {readOnly && !canEditAll ? (
                      <div
                        className={`flex items-center justify-center h-8 w-full rounded text-xs ${getScoreColor(scores[idx], defaultPars[idx])}`}
                      >
                        {scores[idx] || "-"}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={scores[idx] || ""}
                        onChange={(e) =>
                          handleChange(player.id, idx, e.target.value)
                        }
                        className={`w-full h-8 rounded border border-zinc-200 px-0.5 text-center text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${getScoreColor(scores[idx], defaultPars[idx])}`}
                        placeholder="-"
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
                  {back || "-"}
                </td>
                <td className="px-2 py-1.5 text-center text-xs font-bold text-zinc-900 bg-zinc-100">
                  {total || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
