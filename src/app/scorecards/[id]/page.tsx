"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getScorecard, updateScorecard } from "@/lib/store";
import { Scorecard, ScorecardPlayer } from "@/lib/types";
import { ArrowLeft, Save, Pencil, AlertCircle } from "lucide-react";

function scoreColor(score: number | null, par: number): string {
  if (score === null || !par) return "";
  if (score <= par - 2) return "bg-amber-100 text-amber-800"; // eagle or better
  if (score === par - 1) return "bg-green-100 text-green-700"; // birdie
  if (score === par) return "text-zinc-900"; // par
  if (score === par + 1) return "bg-red-50 text-red-600"; // bogey
  return "bg-red-100 text-red-700"; // double bogey+
}

export default function ScorecardDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [players, setPlayers] = useState<ScorecardPlayer[]>([]);
  const [pars, setPars] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingHandicap, setEditingHandicap] = useState<string | null>(null);
  const [editingPar, setEditingPar] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getScorecard(id).then((sc) => {
      if (sc) {
        setScorecard(sc);
        setPlayers(sc.players);
        setPars(sc.pars);
      }
    });
  }, [id]);

  const save = useCallback(
    async (updatedPlayers: ScorecardPlayer[], updatedPars?: number[]) => {
      setSaving(true);
      try {
        await updateScorecard(id, {
          players: updatedPlayers,
          ...(updatedPars ? { pars: updatedPars } : {}),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
      setSaving(false);
    },
    [id]
  );

  function handleScoreChange(
    playerIdx: number,
    holeIdx: number,
    value: string
  ) {
    const updated = players.map((p, i) => {
      if (i !== playerIdx) return p;
      const scores = [...p.scores];
      scores[holeIdx] = value === "" ? null : parseInt(value) || 0;
      return { ...p, scores };
    });
    setPlayers(updated);
    save(updated);
  }

  function handleParChange(holeIdx: number, value: string) {
    const updated = [...pars];
    updated[holeIdx] = parseInt(value) || 0;
    setPars(updated);
    save(players, updated);
  }

  function handleHandicapChange(playerIdx: number, value: string) {
    const updated = players.map((p, i) => {
      if (i !== playerIdx) return p;
      return { ...p, handicap: parseInt(value) || 0 };
    });
    setPlayers(updated);
    setEditingHandicap(null);
    save(updated);
  }

  if (!scorecard) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  const backHref = scorecard.tripId
    ? `/trips/${scorecard.tripId}/scorecards`
    : "/scorecards";

  const yardages = scorecard.yardages || [];
  const hcps = scorecard.handicaps || [];
  const hasYardages = yardages.length === 18 && yardages.some((y) => y > 0);
  const hasHcps = hcps.length === 18 && hcps.some((h) => h > 0);

  const frontPars = pars.slice(0, 9);
  const backPars = pars.slice(9, 18);
  const frontParTotal = frontPars.reduce((a, b) => a + b, 0);
  const backParTotal = backPars.reduce((a, b) => a + b, 0);
  const totalPar = frontParTotal + backParTotal;

  const frontYardages = yardages.slice(0, 9);
  const backYardages = yardages.slice(9, 18);
  const frontYardTotal = frontYardages.reduce((a, b) => a + b, 0);
  const backYardTotal = backYardages.reduce((a, b) => a + b, 0);

  const frontHcps = hcps.slice(0, 9);
  const backHcps = hcps.slice(9, 18);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {saving && (
              <>
                <Save className="h-3.5 w-3.5" />
                Saving...
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {scorecard.courseName || "Scorecard"}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            {scorecard.teeName && (
              <span className="text-sm text-emerald-600">{scorecard.teeName} tees</span>
            )}
            {scorecard.date && (
              <span className="text-sm text-zinc-400">{scorecard.date}</span>
            )}
          </div>
        </div>

        {/* Front 9 */}
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-600">Front 9</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="sticky left-0 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700">
                    Hole
                  </th>
                  {frontPars.map((_, i) => (
                    <th
                      key={i}
                      className="min-w-[48px] px-2 py-2 text-center font-semibold text-zinc-700"
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th className="min-w-[52px] bg-zinc-100 px-2 py-2 text-center font-semibold text-zinc-700">
                    OUT
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Yardage row */}
                {hasYardages && (
                  <tr className="border-b border-zinc-100 bg-blue-50/40">
                    <td className="sticky left-0 bg-blue-50/40 px-3 py-1 text-xs font-medium text-zinc-500">
                      Yards
                    </td>
                    {frontYardages.map((yds, i) => (
                      <td key={i} className="px-1 py-1 text-center text-xs text-zinc-400">
                        {yds}
                      </td>
                    ))}
                    <td className="bg-blue-50/60 px-2 py-1 text-center text-xs font-semibold text-zinc-500">
                      {frontYardTotal}
                    </td>
                  </tr>
                )}
                {/* Handicap row */}
                {hasHcps && (
                  <tr className="border-b border-zinc-100 bg-purple-50/30">
                    <td className="sticky left-0 bg-purple-50/30 px-3 py-1 text-xs font-medium text-zinc-500">
                      HCP
                    </td>
                    {frontHcps.map((hcp, i) => (
                      <td key={i} className="px-1 py-1 text-center text-xs text-zinc-400">
                        {hcp}
                      </td>
                    ))}
                    <td className="bg-purple-50/40 px-2 py-1 text-center text-xs text-zinc-400">
                      &nbsp;
                    </td>
                  </tr>
                )}
                {/* Par row */}
                <tr className="border-b border-zinc-100">
                  <td className="sticky left-0 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500">
                    Par
                  </td>
                  {frontPars.map((par, i) => (
                    <td key={i} className="px-1 py-1 text-center">
                      {editingPar === i ? (
                        <input
                          type="number"
                          defaultValue={par}
                          autoFocus
                          onBlur={(e) => {
                            handleParChange(i, e.target.value);
                            setEditingPar(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleParChange(i, (e.target as HTMLInputElement).value);
                              setEditingPar(null);
                            }
                          }}
                          className="w-10 rounded border border-zinc-300 px-1 py-0.5 text-center text-xs"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingPar(i)}
                          className="w-full text-xs text-zinc-400 hover:text-zinc-700"
                        >
                          {par}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="bg-zinc-50 px-2 py-1.5 text-center text-xs font-semibold text-zinc-600">
                    {frontParTotal}
                  </td>
                </tr>
                {/* Player rows */}
                {players.map((player, pIdx) => {
                  const frontScores = player.scores.slice(0, 9);
                  const frontTotal = frontScores.reduce(
                    (a: number, b) => a + (b ?? 0),
                    0
                  );
                  return (
                    <tr key={player.id} className="border-b border-zinc-50">
                      <td className="sticky left-0 bg-white px-3 py-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-zinc-900">
                            {player.name}
                          </span>
                          {editingHandicap === player.id ? (
                            <input
                              type="number"
                              defaultValue={player.handicap}
                              autoFocus
                              onBlur={(e) =>
                                handleHandicapChange(pIdx, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleHandicapChange(
                                    pIdx,
                                    (e.target as HTMLInputElement).value
                                  );
                              }}
                              className="w-10 rounded border border-zinc-300 px-1 py-0.5 text-center text-xs"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingHandicap(player.id)}
                              className="inline-flex items-center gap-0.5 text-xs text-zinc-400 hover:text-zinc-600"
                            >
                              ({player.handicap})
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      {frontScores.map((score, hIdx) => {
                        const par = pars[hIdx];
                        const cellColor = scoreColor(score, par);
                        return (
                          <td key={hIdx} className="px-1 py-1 text-center">
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={score ?? ""}
                              onChange={(e) =>
                                handleScoreChange(pIdx, hIdx, e.target.value)
                              }
                              className={`w-10 rounded border border-zinc-200 px-1 py-0.5 text-center text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 ${cellColor}`}
                            />
                          </td>
                        );
                      })}
                      <td className="bg-zinc-50 px-2 py-1.5 text-center text-sm font-bold text-zinc-900">
                        {frontTotal || "\u2013"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back 9 */}
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-600">Back 9</h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="sticky left-0 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700">
                    Hole
                  </th>
                  {backPars.map((_, i) => (
                    <th
                      key={i}
                      className="min-w-[48px] px-2 py-2 text-center font-semibold text-zinc-700"
                    >
                      {i + 10}
                    </th>
                  ))}
                  <th className="min-w-[52px] bg-zinc-100 px-2 py-2 text-center font-semibold text-zinc-700">
                    IN
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Yardage row */}
                {hasYardages && (
                  <tr className="border-b border-zinc-100 bg-blue-50/40">
                    <td className="sticky left-0 bg-blue-50/40 px-3 py-1 text-xs font-medium text-zinc-500">
                      Yards
                    </td>
                    {backYardages.map((yds, i) => (
                      <td key={i} className="px-1 py-1 text-center text-xs text-zinc-400">
                        {yds}
                      </td>
                    ))}
                    <td className="bg-blue-50/60 px-2 py-1 text-center text-xs font-semibold text-zinc-500">
                      {backYardTotal}
                    </td>
                  </tr>
                )}
                {/* Handicap row */}
                {hasHcps && (
                  <tr className="border-b border-zinc-100 bg-purple-50/30">
                    <td className="sticky left-0 bg-purple-50/30 px-3 py-1 text-xs font-medium text-zinc-500">
                      HCP
                    </td>
                    {backHcps.map((hcp, i) => (
                      <td key={i} className="px-1 py-1 text-center text-xs text-zinc-400">
                        {hcp}
                      </td>
                    ))}
                    <td className="bg-purple-50/40 px-2 py-1 text-center text-xs text-zinc-400">
                      &nbsp;
                    </td>
                  </tr>
                )}
                {/* Par row */}
                <tr className="border-b border-zinc-100">
                  <td className="sticky left-0 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500">
                    Par
                  </td>
                  {backPars.map((par, i) => (
                    <td key={i} className="px-1 py-1 text-center">
                      {editingPar === i + 9 ? (
                        <input
                          type="number"
                          defaultValue={par}
                          autoFocus
                          onBlur={(e) => {
                            handleParChange(i + 9, e.target.value);
                            setEditingPar(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleParChange(i + 9, (e.target as HTMLInputElement).value);
                              setEditingPar(null);
                            }
                          }}
                          className="w-10 rounded border border-zinc-300 px-1 py-0.5 text-center text-xs"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingPar(i + 9)}
                          className="w-full text-xs text-zinc-400 hover:text-zinc-700"
                        >
                          {par}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="bg-zinc-50 px-2 py-1.5 text-center text-xs font-semibold text-zinc-600">
                    {backParTotal}
                  </td>
                </tr>
                {/* Player rows */}
                {players.map((player, pIdx) => {
                  const backScores = player.scores.slice(9, 18);
                  const backTotal = backScores.reduce(
                    (a: number, b) => a + (b ?? 0),
                    0
                  );
                  return (
                    <tr key={player.id} className="border-b border-zinc-50">
                      <td className="sticky left-0 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900">
                        {player.name}
                      </td>
                      {backScores.map((score, hIdx) => {
                        const par = pars[hIdx + 9];
                        const cellColor = scoreColor(score, par);
                        return (
                          <td key={hIdx} className="px-1 py-1 text-center">
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={score ?? ""}
                              onChange={(e) =>
                                handleScoreChange(
                                  pIdx,
                                  hIdx + 9,
                                  e.target.value
                                )
                              }
                              className={`w-10 rounded border border-zinc-200 px-1 py-0.5 text-center text-sm font-medium focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 ${cellColor}`}
                            />
                          </td>
                        );
                      })}
                      <td className="bg-zinc-50 px-2 py-1.5 text-center text-sm font-bold text-zinc-900">
                        {backTotal || "\u2013"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-600">Totals</h2>
          {hasYardages && (
            <p className="mt-1 text-xs text-zinc-400">
              Total yardage: {frontYardTotal + backYardTotal}
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-3 py-2 text-left font-semibold text-zinc-700">
                    Player
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    OUT
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    IN
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    Gross
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    HCP
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    Net
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">
                    vs Par
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const front = player.scores
                    .slice(0, 9)
                    .reduce((a: number, b) => a + (b ?? 0), 0);
                  const back = player.scores
                    .slice(9, 18)
                    .reduce((a: number, b) => a + (b ?? 0), 0);
                  const gross = front + back;
                  const net = gross - player.handicap;
                  const vsPar = gross - totalPar;
                  const vsParStr =
                    vsPar > 0 ? `+${vsPar}` : vsPar === 0 ? "E" : `${vsPar}`;

                  return (
                    <tr key={player.id} className="border-b border-zinc-50">
                      <td className="px-3 py-2 font-medium text-zinc-900">
                        {player.name}
                      </td>
                      <td className="px-3 py-2 text-center text-zinc-600">
                        {front || "\u2013"}
                      </td>
                      <td className="px-3 py-2 text-center text-zinc-600">
                        {back || "\u2013"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-zinc-900">
                        {gross || "\u2013"}
                      </td>
                      <td className="px-3 py-2 text-center text-zinc-400">
                        {player.handicap}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-emerald-700">
                        {gross ? net : "\u2013"}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          vsPar > 0
                            ? "text-red-600"
                            : vsPar < 0
                              ? "text-green-600"
                              : "text-zinc-600"
                        }`}
                      >
                        {gross ? vsParStr : "\u2013"}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-zinc-50">
                  <td className="px-3 py-2 text-xs font-medium text-zinc-500">
                    Par
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-zinc-400">
                    {frontParTotal}
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-zinc-400">
                    {backParTotal}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-500">
                    {totalPar}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
