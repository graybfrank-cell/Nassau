"use client";

import Link from "next/link";
import ScorecardGrid from "@/components/shared/ScorecardGrid";
import { HeroBackdrop } from "@/components/HeroBackdrop";
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
    <div className="min-h-screen bg-zinc-50">
      <HeroBackdrop
        src="/heroes/bandon-dunes.png"
        alt="Pacific Dunes coastal cliffs"
        height="md"
        priority
      >
        <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur rounded-full text-xs uppercase tracking-wider mb-3">
          Final
        </span>
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
          Pacific Dunes
        </h1>
        <p className="mt-2 text-white/80">Sunday, May 10, 2026</p>
      </HeroBackdrop>

      <div className="mx-auto max-w-7xl px-4 py-6">
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
