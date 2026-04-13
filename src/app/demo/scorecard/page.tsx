"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ScorecardGrid from "@/components/shared/ScorecardGrid";
import { PACIFIC_DUNES_PARS, DEMO_SCORECARD_PLAYERS, DEMO_ROUNDS } from "@/lib/demo-data";

const round = DEMO_ROUNDS[1]; // Pacific Dunes

const players = DEMO_SCORECARD_PLAYERS.map((p) => ({ id: p.id, name: p.name }));

const scorecards = DEMO_SCORECARD_PLAYERS.map((p) => {
  const holes = p.scores.map((s) => s ?? 0);
  const front = holes.slice(0, 9).reduce((a, b) => a + b, 0);
  const back = holes.slice(9).reduce((a, b) => a + b, 0);
  return { playerId: p.id, holes, total: front + back, frontNine: front, backNine: back };
});

const totalPar = PACIFIC_DUNES_PARS.reduce((a, b) => a + b, 0);

export default function DemoScorecardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{round.courseName}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {new Date(round.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-[10px] font-bold text-white">FINAL</span>
          </div>
        </div>

        {/* Scorecard — reuses production ScorecardGrid */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <ScorecardGrid
            players={players}
            scorecards={scorecards}
            pars={PACIFIC_DUNES_PARS}
            onScoreChange={() => {}}
            onSave={() => {}}
            readOnly
          />
        </div>

        {/* Totals */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-600">Totals</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-3 py-2 text-left font-semibold text-zinc-700">Player</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">OUT</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">IN</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">Gross</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">HCP</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">Net</th>
                  <th className="px-3 py-2 text-center font-semibold text-zinc-700">vs Par</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SCORECARD_PLAYERS.map((p) => {
                  const holes = p.scores.map((s) => s ?? 0);
                  const front = holes.slice(0, 9).reduce((a, b) => a + b, 0);
                  const back = holes.slice(9).reduce((a, b) => a + b, 0);
                  const gross = front + back;
                  const net = gross - p.handicap;
                  const vsPar = gross - totalPar;
                  return (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="px-3 py-2 font-medium text-zinc-900">{p.name}</td>
                      <td className="px-3 py-2 text-center text-zinc-600">{front}</td>
                      <td className="px-3 py-2 text-center text-zinc-600">{back}</td>
                      <td className="px-3 py-2 text-center font-bold text-zinc-900">{gross}</td>
                      <td className="px-3 py-2 text-center text-zinc-400">{p.handicap}</td>
                      <td className="px-3 py-2 text-center font-bold text-[#2D5A3D]">{net}</td>
                      <td className={`px-3 py-2 text-center font-semibold ${vsPar > 0 ? "text-red-600" : vsPar < 0 ? "text-green-600" : "text-zinc-600"}`}>
                        {vsPar > 0 ? `+${vsPar}` : vsPar === 0 ? "E" : `${vsPar}`}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-zinc-50">
                  <td className="px-3 py-2 text-xs font-medium text-zinc-500">Par</td>
                  <td className="px-3 py-2 text-center text-xs text-zinc-400">{PACIFIC_DUNES_PARS.slice(0, 9).reduce((a, b) => a + b, 0)}</td>
                  <td className="px-3 py-2 text-center text-xs text-zinc-400">{PACIFIC_DUNES_PARS.slice(9).reduce((a, b) => a + b, 0)}</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-500">{totalPar}</td>
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
