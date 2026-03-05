"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  { value: "golf", label: "Golf" },
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  golf: "⛳",
  food: "🍔",
  drinks: "🍺",
  transport: "🚗",
  other: "🛒",
};

interface ExpenseListProps {
  members: { id: string; name: string }[];
  expenses: {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    category: string;
  }[];
  onAddExpense: (expense: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    category: string;
  }) => void;
  onDeleteExpense: (expenseId: string) => void;
  canDelete: (expenseId: string) => boolean;
}

export default function ExpenseList({
  members,
  expenses,
  onAddExpense,
  onDeleteExpense,
  canDelete,
}: ExpenseListProps) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [category, setCategory] = useState("other");

  function getMemberName(id: string): string {
    return members.find((m) => m.id === id)?.name || "Unknown";
  }

  function handleSplitToggle(memberId: string) {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function handleSelectAll() {
    if (splitAmong.length === members.length) {
      setSplitAmong([]);
    } else {
      setSplitAmong(members.map((m) => m.id));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy || splitAmong.length === 0)
      return;
    onAddExpense({
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy,
      splitAmong,
      category,
    });
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitAmong([]);
    setCategory("other");
    setShowForm(false);
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">
          Total: ${totalExpenses.toFixed(2)}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Expense
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cart fee"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Amount ($) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="60.00"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Category
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      category === c.value
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Paid By *
              </label>
              <select
                required
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select who paid</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-600">
                  Split Among *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {splitAmong.length === members.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSplitToggle(m.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
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
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-zinc-400 py-4 text-center">
          No expenses yet.
        </p>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">
                  {CATEGORY_EMOJI[expense.category] || "🛒"}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {expense.description}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Paid by{" "}
                    <span className="font-medium text-zinc-600">
                      {getMemberName(expense.paidBy)}
                    </span>{" "}
                    · Split {expense.splitAmong.length} way
                    {expense.splitAmong.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-900">
                  ${expense.amount.toFixed(2)}
                </span>
                {canDelete(expense.id) && (
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="rounded-md p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
