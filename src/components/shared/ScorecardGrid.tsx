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

export default function ScorecardGrid({
  players,
  scorecards,
  pars,
  onScoreChange,
  onSave,
  readOnly = false,
  canEditAll = false,
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

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left text-xs font-semibold text-zinc-500">
              Hole
            </th>
            {Array.from({ length: 9 }, (_, i) => (
              <th
                key={i}
                className="px-1 py-2 text-center text-xs font-semibold text-zinc-500 min-w-[36px]"
              >
                {i + 1}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
              OUT
            </th>
            {Array.from({ length: 9 }, (_, i) => (
              <th
                key={i + 9}
                className="px-1 py-2 text-center text-xs font-semibold text-zinc-500 min-w-[36px]"
              >
                {i + 10}
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
            {defaultPars.slice(0, 9).map((p, i) => (
              <td key={i} className="px-1 py-1 text-center text-xs text-zinc-400">
                {p}
              </td>
            ))}
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-50">
              {defaultPars.slice(0, 9).reduce((a, b) => a + b, 0)}
            </td>
            {defaultPars.slice(9, 18).map((p, i) => (
              <td key={i + 9} className="px-1 py-1 text-center text-xs text-zinc-400">
                {p}
              </td>
            ))}
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-50">
              {defaultPars.slice(9, 18).reduce((a, b) => a + b, 0)}
            </td>
            <td className="px-2 py-1 text-center text-xs font-semibold text-zinc-500 bg-zinc-100">
              {defaultPars.reduce((a, b) => a + b, 0)}
            </td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const scores = getPlayerScores(player.id);
            const front = scores.slice(0, 9).reduce((a, b) => a + (b || 0), 0);
            const back = scores.slice(9, 18).reduce((a, b) => a + (b || 0), 0);
            const total = front + back;

            return (
              <tr
                key={player.id}
                className="border-b border-zinc-50"
              >
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 whitespace-nowrap">
                  {player.name}
                </td>
                {scores.slice(0, 9).map((score, i) => (
                  <td key={i} className="px-0.5 py-0.5">
                    {readOnly && !canEditAll ? (
                      <div
                        className={`flex items-center justify-center h-8 w-full rounded text-xs ${getScoreColor(score, defaultPars[i])}`}
                      >
                        {score || "-"}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={score || ""}
                        onChange={(e) =>
                          handleChange(player.id, i, e.target.value)
                        }
                        className={`w-full h-8 rounded border border-zinc-200 px-0.5 text-center text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${getScoreColor(score, defaultPars[i])}`}
                        placeholder="-"
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center text-xs font-bold text-zinc-700 bg-zinc-50">
                  {front || "-"}
                </td>
                {scores.slice(9, 18).map((score, i) => (
                  <td key={i + 9} className="px-0.5 py-0.5">
                    {readOnly && !canEditAll ? (
                      <div
                        className={`flex items-center justify-center h-8 w-full rounded text-xs ${getScoreColor(score, defaultPars[i + 9])}`}
                      >
                        {score || "-"}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={score || ""}
                        onChange={(e) =>
                          handleChange(player.id, i + 9, e.target.value)
                        }
                        className={`w-full h-8 rounded border border-zinc-200 px-0.5 text-center text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 ${getScoreColor(score, defaultPars[i + 9])}`}
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
