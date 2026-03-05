"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, getExpenses, addExpense, deleteExpense } from "@/lib/store";
import { Trip, Expense, Member } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, DollarSign, AlertCircle, Camera, Loader2, X, Check, Receipt } from "lucide-react";

const CATEGORIES = [
  { emoji: "⛳", label: "Green Fees" },
  { emoji: "🍔", label: "Food & Drinks" },
  { emoji: "🏨", label: "Lodging" },
  { emoji: "⛽", label: "Gas/Transport" },
  { emoji: "🎰", label: "Skins/Bets" },
  { emoji: "🍺", label: "Bar Tab" },
  { emoji: "🛒", label: "Supplies" },
  { emoji: "📦", label: "Other" },
] as const;

const QUICK_AMOUNTS = [10, 20, 25, 50, 75, 100, 150, 200];

type SplitMode = "equal" | "custom" | "self";

interface ScannedReceipt {
  merchant: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  date: string;
  category: string;
  items: { name: string; amount: number; qty: number }[];
  confidence: string;
  notes: string;
}

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Receipt scanning state
  const [scanning, setScanning] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ScannedReceipt | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanPaidBy, setScanPaidBy] = useState("");
  const [scanSplitMode, setScanSplitMode] = useState<SplitMode>("equal");
  const [scanSplitAmong, setScanSplitAmong] = useState<string[]>([]);
  const [scanDescription, setScanDescription] = useState("");
  const [scanAmount, setScanAmount] = useState("");
  const [scanCategory, setScanCategory] = useState<string | null>(null);
  const [scanSaving, setScanSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function resetForm() {
    setSelectedCategory(null);
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitMode("equal");
    setSplitAmong([]);
    setShowForm(false);
  }

  function openForm() {
    setSelectedCategory(null);
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitMode("equal");
    setSplitAmong(trip?.members.map((m) => m.id) || []);
    setShowForm(true);
  }

  function handleCategorySelect(label: string) {
    if (selectedCategory === label) {
      setSelectedCategory(null);
      setDescription("");
    } else {
      setSelectedCategory(label);
      if (label !== "Other") {
        setDescription(label);
      } else {
        setDescription("");
      }
    }
  }

  function handleSplitModeChange(mode: SplitMode) {
    setSplitMode(mode);
    if (!trip) return;
    if (mode === "equal") {
      setSplitAmong(trip.members.map((m) => m.id));
    } else if (mode === "self") {
      setSplitAmong(paidBy ? [paidBy] : []);
    } else {
      setSplitAmong([]);
    }
  }

  function handlePaidByChange(memberId: string) {
    setPaidBy(memberId);
    if (splitMode === "self" && memberId) {
      setSplitAmong([memberId]);
    }
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
    setError(null);
    try {
      await addExpense({
        tripId,
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitAmong,
      });
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setError(null);
    try {
      await deleteExpense(expenseId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  }

  // ─── Receipt Scanning ───────────────────────────────────────

  function handleScanClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so same file can be re-selected
    e.target.value = "";

    setScanError(null);
    setScannedReceipt(null);
    setScanning(true);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/scan-receipt`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Failed to scan receipt");
        setScanning(false);
        return;
      }

      const r = data.extracted as ScannedReceipt;
      setScannedReceipt(r);
      setScanDescription(r.merchant || "Receipt");
      setScanAmount(r.total > 0 ? String(r.total) : "");
      setScanCategory(r.category || null);
      // Preserve split settings from last scan if available, otherwise default
      if (!scanPaidBy) {
        setScanPaidBy("");
      }
      if (scanSplitAmong.length === 0) {
        setScanSplitMode("equal");
        setScanSplitAmong(trip?.members.map((m) => m.id) || []);
      }
    } catch {
      setScanError("Failed to scan receipt. Check your connection and try again.");
    } finally {
      setScanning(false);
    }
  }

  function handleScanSplitModeChange(mode: SplitMode) {
    setScanSplitMode(mode);
    if (!trip) return;
    if (mode === "equal") {
      setScanSplitAmong(trip.members.map((m) => m.id));
    } else if (mode === "self") {
      setScanSplitAmong(scanPaidBy ? [scanPaidBy] : []);
    } else {
      setScanSplitAmong([]);
    }
  }

  function handleScanPaidByChange(memberId: string) {
    setScanPaidBy(memberId);
    if (scanSplitMode === "self" && memberId) {
      setScanSplitAmong([memberId]);
    }
  }

  function handleScanSplitToggle(memberId: string) {
    setScanSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function dismissScan() {
    setScannedReceipt(null);
    setScanError(null);
    setScanDescription("");
    setScanAmount("");
    setScanCategory(null);
  }

  async function handleConfirmScan() {
    if (!scanDescription.trim() || !scanAmount || !scanPaidBy || scanSplitAmong.length === 0)
      return;
    setScanSaving(true);
    setError(null);
    try {
      await addExpense({
        tripId,
        description: scanDescription.trim(),
        amount: parseFloat(scanAmount),
        paidBy: scanPaidBy,
        splitAmong: scanSplitAmong,
      });
      // Keep split settings for next scan
      const savedPaidBy = scanPaidBy;
      const savedSplitMode = scanSplitMode;
      const savedSplitAmong = [...scanSplitAmong];
      setScannedReceipt(null);
      setScanDescription("");
      setScanAmount("");
      setScanCategory(null);
      // Restore split settings
      setScanPaidBy(savedPaidBy);
      setScanSplitMode(savedSplitMode);
      setScanSplitAmong(savedSplitAmong);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setScanSaving(false);
    }
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

  const isFormValid =
    description.trim() && amount && paidBy && splitAmong.length > 0;

  const isScanFormValid =
    scanDescription.trim() && scanAmount && scanPaidBy && scanSplitAmong.length > 0;

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

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Expenses
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Total: ${totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Hidden file input for receipt scanning */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={handleScanClick}
              disabled={scanning || trip.members.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {scanning ? "Scanning..." : "Scan Receipt"}
            </button>
            <button
              onClick={() => (showForm ? resetForm() : openForm())}
              disabled={trip.members.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Scan Error */}
        {scanError && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {scanError}
            </div>
            <button onClick={() => setScanError(null)} className="ml-2 text-amber-500 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Scanned Receipt Confirmation */}
        {scannedReceipt && (
          <div className="mt-6 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-zinc-900">
                  Receipt Scanned
                </h2>
                {scannedReceipt.confidence && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    scannedReceipt.confidence === "high"
                      ? "bg-emerald-100 text-emerald-700"
                      : scannedReceipt.confidence === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}>
                    {scannedReceipt.confidence} confidence
                  </span>
                )}
              </div>
              <button onClick={dismissScan} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Line items preview */}
            {scannedReceipt.items.length > 0 && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">Line Items</p>
                <div className="space-y-1">
                  {scannedReceipt.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600">{item.qty > 1 ? `${item.qty}x ` : ""}{item.name}</span>
                      <span className="font-medium text-zinc-900">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {scannedReceipt.tax != null && scannedReceipt.tax > 0 && (
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-sm">
                      <span className="text-zinc-400">Tax</span>
                      <span className="text-zinc-600">${scannedReceipt.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {scannedReceipt.tip != null && scannedReceipt.tip > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Tip</span>
                      <span className="text-zinc-600">${scannedReceipt.tip.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {scannedReceipt.notes && (
              <p className="mt-2 text-xs text-zinc-400 italic">{scannedReceipt.notes}</p>
            )}

            {/* Editable fields */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Title *</label>
                <input
                  type="text"
                  value={scanDescription}
                  onChange={(e) => setScanDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Amount ($) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={scanAmount}
                  onChange={(e) => setScanAmount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">Category</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setScanCategory(scanCategory === cat.label ? null : cat.label)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      scanCategory === cat.label
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">Paid By *</label>
              <select
                value={scanPaidBy}
                onChange={(e) => handleScanPaidByChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select who paid</option>
                {trip.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Split Options */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">Split</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleScanSplitModeChange("equal")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    scanSplitMode === "equal"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Split equally
                </button>
                <button
                  type="button"
                  onClick={() => handleScanSplitModeChange("custom")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    scanSplitMode === "custom"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Split with...
                </button>
                <button
                  type="button"
                  onClick={() => handleScanSplitModeChange("self")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    scanSplitMode === "self"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  I paid for myself
                </button>
              </div>

              {scanSplitMode === "equal" && (
                <p className="mt-2 text-xs text-zinc-400">
                  Divided evenly among all {trip.members.length} member
                  {trip.members.length !== 1 ? "s" : ""}
                  {scanAmount
                    ? ` — $${(parseFloat(scanAmount) / trip.members.length).toFixed(2)} each`
                    : ""}
                </p>
              )}

              {scanSplitMode === "self" && (
                <p className="mt-2 text-xs text-zinc-400">
                  No split — just tracking this expense
                </p>
              )}

              {scanSplitMode === "custom" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Select members to split with</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!trip) return;
                        if (scanSplitAmong.length === trip.members.length) {
                          setScanSplitAmong([]);
                        } else {
                          setScanSplitAmong(trip.members.map((m) => m.id));
                        }
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {scanSplitAmong.length === trip.members.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trip.members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleScanSplitToggle(m.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          scanSplitAmong.includes(m.id)
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                  {scanSplitAmong.length > 0 && scanAmount && (
                    <p className="mt-2 text-xs text-zinc-400">
                      ${(parseFloat(scanAmount) / scanSplitAmong.length).toFixed(2)} each
                      {" "}({scanSplitAmong.length} member
                      {scanSplitAmong.length !== 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleConfirmScan}
                disabled={!isScanFormValid || scanSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {scanSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {scanSaving ? "Saving..." : "Add Expense"}
              </button>
              <button
                onClick={handleScanClick}
                disabled={scanning}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
              >
                <Camera className="h-4 w-4" />
                Scan Another
              </button>
              <button
                onClick={dismissScan}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Scanning indicator (when no receipt is loaded yet) */}
        {scanning && !scannedReceipt && (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-zinc-900">Reading receipt...</p>
              <p className="text-xs text-zinc-400">This usually takes a few seconds</p>
            </div>
          </div>
        )}

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

            {/* Category Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">
                Category
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => handleCategorySelect(cat.label)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      selectedCategory === cat.label
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description — always shown, auto-filled by category */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">
                {selectedCategory === "Other" ? "Custom Title *" : "Title *"}
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  selectedCategory === "Other"
                    ? "e.g. Cooler of beer"
                    : selectedCategory
                      ? `e.g. ${selectedCategory} at...`
                      : "Pick a category or type a title"
                }
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Amount + Quick Amount Buttons */}
            <div className="mt-4">
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
                placeholder="0.00"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((qa) => (
                  <button
                    key={qa}
                    type="button"
                    onClick={() => setAmount(String(qa))}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      amount === String(qa)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    ${qa}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">
                Paid By *
              </label>
              <select
                required
                value={paidBy}
                onChange={(e) => handlePaidByChange(e.target.value)}
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

            {/* Split Options */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700">
                Split
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSplitModeChange("equal")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    splitMode === "equal"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Split equally
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitModeChange("custom")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    splitMode === "custom"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Split with...
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitModeChange("self")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    splitMode === "self"
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/30"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  I paid for myself
                </button>
              </div>

              {/* Split summary */}
              {splitMode === "equal" && (
                <p className="mt-2 text-xs text-zinc-400">
                  Divided evenly among all {trip.members.length} member
                  {trip.members.length !== 1 ? "s" : ""}
                  {amount
                    ? ` — $${(parseFloat(amount) / trip.members.length).toFixed(2)} each`
                    : ""}
                </p>
              )}

              {splitMode === "self" && (
                <p className="mt-2 text-xs text-zinc-400">
                  No split — just tracking this expense
                </p>
              )}

              {/* Custom member picker */}
              {splitMode === "custom" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      Select members to split with
                    </span>
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
                  {splitAmong.length > 0 && amount && (
                    <p className="mt-2 text-xs text-zinc-400">
                      ${(parseFloat(amount) / splitAmong.length).toFixed(2)} each
                      {" "}({splitAmong.length} member
                      {splitAmong.length !== 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={!isFormValid}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={resetForm}
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
