"use client";

interface SkinsCalculatorProps {
  players: { id: string; name: string }[];
  scorecards: { playerId: string; holes: number[] }[];
  buyIn: number;
}

interface SkinResult {
  hole: number;
  winnerId: string | null;
  skinsValue: number;
  carryover: boolean;
}

function calculateSkins(
  scorecards: { playerId: string; holes: number[] }[],
  playerIds: string[],
  buyIn: number
) {
  const holeResults: SkinResult[] = [];
  const totals: Record<string, { skins: number; winnings: number }> = {};
  playerIds.forEach((id) => {
    totals[id] = { skins: 0, winnings: 0 };
  });

  let carryover = 0;

  for (let i = 0; i < 18; i++) {
    const scores: { playerId: string; score: number }[] = [];

    for (const sc of scorecards) {
      if (!playerIds.includes(sc.playerId)) continue;
      if (sc.holes[i] && sc.holes[i] > 0) {
        scores.push({ playerId: sc.playerId, score: sc.holes[i] });
      }
    }

    if (scores.length === 0) {
      holeResults.push({ hole: i + 1, winnerId: null, skinsValue: 0, carryover: false });
      continue;
    }

    const minScore = Math.min(...scores.map((s) => s.score));
    const winners = scores.filter((s) => s.score === minScore);

    if (winners.length === 1) {
      const winnerId = winners[0].playerId;
      const skinsValue = 1 + carryover;
      holeResults.push({ hole: i + 1, winnerId, skinsValue, carryover: false });
      totals[winnerId].skins += skinsValue;
      totals[winnerId].winnings += skinsValue * buyIn;
      carryover = 0;
    } else {
      carryover += 1;
      holeResults.push({ hole: i + 1, winnerId: null, skinsValue: 0, carryover: true });
    }
  }

  return { holeResults, totals };
}

export default function SkinsCalculator({
  players,
  scorecards,
  buyIn,
}: SkinsCalculatorProps) {
  const playerIds = players.map((p) => p.id);
  const { holeResults, totals } = calculateSkins(scorecards, playerIds, buyIn);
  const totalSkinsWon = Object.values(totals).reduce((s, t) => s + t.skins, 0);
  const pot = players.length * buyIn;

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name || "Unknown";
  }

  return (
    <div>
      <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
        <span>Pot: ${pot}</span>
        <span>{players.length} players</span>
        <span>${buyIn}/skin</span>
        <span>{totalSkinsWon} skin{totalSkinsWon !== 1 ? "s" : ""} won</span>
      </div>

      {/* Hole-by-hole results */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-2 py-2 text-left text-xs font-semibold text-zinc-500">
                Hole
              </th>
              {players.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-2 text-center text-xs font-semibold text-zinc-500"
                >
                  {p.name}
                </th>
              ))}
              <th className="px-2 py-2 text-center text-xs font-semibold text-zinc-500">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {holeResults.map((result, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-50 ${i === 8 ? "border-b-2 border-b-zinc-200" : ""}`}
              >
                <td className="px-2 py-1.5 text-xs font-medium text-zinc-600">
                  {result.hole}
                </td>
                {players.map((p) => {
                  const sc = scorecards.find((s) => s.playerId === p.id);
                  const score = sc?.holes[i] || 0;
                  const isWinner = result.winnerId === p.id;
                  return (
                    <td
                      key={p.id}
                      className={`px-2 py-1.5 text-center text-xs ${isWinner ? "font-bold text-emerald-600" : "text-zinc-600"}`}
                    >
                      {score || "-"}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center text-xs">
                  {result.winnerId ? (
                    <span className="font-semibold text-emerald-600">
                      {getPlayerName(result.winnerId)}
                      {result.skinsValue > 1 && ` (${result.skinsValue})`}
                    </span>
                  ) : result.carryover ? (
                    <span className="text-amber-500">Carry</span>
                  ) : (
                    <span className="text-zinc-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results Summary */}
      <div className="mt-4 rounded-lg bg-zinc-50 p-4">
        <h4 className="text-sm font-semibold text-zinc-700">Results</h4>
        <div className="mt-3 space-y-2">
          {players
            .sort(
              (a, b) => (totals[b.id]?.skins || 0) - (totals[a.id]?.skins || 0)
            )
            .map((player) => {
              const t = totals[player.id];
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-700">{player.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-400">
                      {t?.skins || 0} skin{(t?.skins || 0) !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={`text-sm font-semibold ${(t?.winnings || 0) > 0 ? "text-emerald-600" : "text-zinc-400"}`}
                    >
                      ${(t?.winnings || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
