"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, getExpenses, addExpense, deleteExpense } from "@/lib/store";
import { Trip, Expense, Member } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, DollarSign } from "lucide-react";

function calculateSettlements(
  expenses: Expense[],
  members: Member[]
): { from: string; to: string; amount: number }[] {
  const balances: Record<string, number> = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  for (const expense of expenses) {
    if (expense.splitAmong.length === 0) continue;
    const splitAmount = expense.amount / expense.splitAmong.length;
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
    for (const memberId of expense.splitAmong) {
      balances[memberId] = (balances[memberId] || 0) - splitAmount;
    }
  }

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.01)
    .map(([id, b]) => ({ id, amount: -b }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.01)
    .map(([id, b]) => ({ id, amount: b }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(payment * 100) / 100,
    });
    debtors[i].amount -= payment;
    creditors[j].amount -= payment;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function refresh() {
    const t = await getTrip(tripId);
    if (t) {
      setTrip(t);
      setExpenses(await getExpenses(tripId));
    }
  }

  function getMemberName(memberId: string): string {
    return trip?.members.find((m) => m.id === memberId)?.name || "Unknown";
  }

  function handleSplitToggle(memberId: string) {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function handleSelectAll() {
    if (!trip) return;
    if (splitAmong.length === trip.members.length) {
      setSplitAmong([]);
    } else {
      setSplitAmong(trip.members.map((m) => m.id));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy || splitAmong.length === 0)
      return;
    await addExpense({
      tripId,
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy,
      splitAmong,
    });
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitAmong([]);
    setShowForm(false);
    await refresh();
  }

  async function handleDeleteExpense(expenseId: string) {
    await deleteExpense(expenseId);
    await refresh();
  }

  if (!trip) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Trip not found</p>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const settlements = calculateSettlements(expenses, trip.members);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trip.name}
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Expenses
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Total: ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {trip.members.length === 0 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            Add members to your trip before logging expenses.{" "}
            <Link
              href={`/trips/${tripId}`}
              className="font-medium underline hover:no-underline"
            >
              Go to trip
            </Link>
          </div>
        )}

        {/* Add Expense Form */}
        {showForm && trip.members.length > 0 && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              New Expense
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Greens fees at TPC"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="120.00"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Paid By *
                </label>
                <select
                  required
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select who paid</option>
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700">
                    Split Among *
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {splitAmong.length === trip.members.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trip.members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSplitToggle(m.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        splitAmong.includes(m.id)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Expense List */}
        {expenses.length === 0 ? (
          <div className="mt-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">No expenses yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {expense.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Paid by{" "}
                    <span className="font-medium text-zinc-600">
                      {getMemberName(expense.paidBy)}
                    </span>{" "}
                    · Split {expense.splitAmong.length} way
                    {expense.splitAmong.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-900">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settlements */}
        {settlements.length > 0 && (
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              Settle Up
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Simplified payments to settle all debts.
            </p>
            <div className="mt-4 space-y-3">
              {settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3"
                >
                  <p className="text-sm text-zinc-700">
                    <span className="font-medium">{getMemberName(s.from)}</span>
                    {" pays "}
                    <span className="font-medium">{getMemberName(s.to)}</span>
                  </p>
                  <span className="text-sm font-semibold text-emerald-600">
                    ${s.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
