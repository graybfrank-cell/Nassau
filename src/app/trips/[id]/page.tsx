"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, updateTrip, getExpenses, getRounds, getSkinsGames } from "@/lib/store";
import { Trip, Member } from "@/lib/types";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Shuffle,
  Trophy,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenseCount, setExpenseCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [skinsCount, setSkinsCount] = useState(0);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberHandicap, setMemberHandicap] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  function refresh() {
    const t = getTrip(tripId);
    if (t) {
      setTrip(t);
      setExpenseCount(getExpenses(tripId).length);
      setRoundCount(getRounds(tripId).length);
      setSkinsCount(getSkinsGames(tripId).length);
    }
  }

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !memberName.trim()) return;
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: memberName.trim(),
      handicap: parseInt(memberHandicap) || 0,
    };
    updateTrip(tripId, { members: [...trip.members, newMember] });
    setMemberName("");
    setMemberHandicap("");
    setShowAddMember(false);
    refresh();
  }

  function handleRemoveMember(memberId: string) {
    if (!trip) return;
    updateTrip(tripId, {
      members: trip.members.filter((m) => m.id !== memberId),
    });
    refresh();
  }

  if (!trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            Trip not found
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            This trip may have been deleted.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const featureCards = [
    {
      icon: DollarSign,
      title: "Expenses",
      desc: `${expenseCount} expense${expenseCount !== 1 ? "s" : ""} logged`,
      href: `/trips/${tripId}/expenses`,
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: Shuffle,
      title: "Pairings",
      desc: `${roundCount} round${roundCount !== 1 ? "s" : ""} created`,
      href: `/trips/${tripId}/pairings`,
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: Trophy,
      title: "Skins",
      desc: `${skinsCount} game${skinsCount !== 1 ? "s" : ""} played`,
      href: `/trips/${tripId}/skins`,
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trips
        </Link>

        {/* Trip Header */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {trip.name}
          </h1>
          {trip.destination && (
            <p className="mt-1 text-sm text-zinc-500">{trip.destination}</p>
          )}
          {(trip.startDate || trip.endDate) && (
            <p className="mt-1 text-sm text-zinc-400">
              {trip.startDate && trip.endDate
                ? `${trip.startDate} — ${trip.endDate}`
                : trip.startDate || trip.endDate}
            </p>
          )}
        </div>

        {/* Members Section */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Members ({trip.members.length})
              </h2>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Member
            </button>
          </div>

          {showAddMember && (
            <form
              onSubmit={handleAddMember}
              className="mt-4 flex items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-600">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-zinc-600">
                  Handicap
                </label>
                <input
                  type="number"
                  value={memberHandicap}
                  onChange={(e) => setMemberHandicap(e.target.value)}
                  placeholder="12"
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
                onClick={() => setShowAddMember(false)}
                className="rounded-md border border-zinc-300 p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          {trip.members.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              No members yet. Add players to get started.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-zinc-100">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <span className="text-sm font-medium text-zinc-900">
                      {member.name}
                    </span>
                    <span className="ml-3 text-xs text-zinc-400">
                      HCP {member.handicap}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-md p-1 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {featureCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-zinc-900">{card.title}</h3>
                <p className="text-xs text-zinc-400">{card.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
