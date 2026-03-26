"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DollarSign,
  Check,
  ExternalLink,
  Clock,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  venmo_username: string | null;
}

interface Settlement {
  id: string;
  round_id: string | null;
  trip_id: string | null;
  payer_id: string;
  payee_id: string;
  amount: string;
  note: string | null;
  status: string;
  paid_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  payer: Profile;
  payee: Profile;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/40 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-400">
        <DollarSign className="h-3 w-3" />
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      Confirmed
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-[#242424] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-zinc-700" />
        <div className="h-5 w-16 rounded-full bg-zinc-700" />
      </div>
      <div className="h-3 w-48 rounded bg-zinc-700" />
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded-lg bg-zinc-700" />
      </div>
    </div>
  );
}

export default function SettlementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/settlements");
        return;
      }
      // Check subscription status
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const status = profile.subscription_status;
          if (status !== "active" && status !== "trialing") {
            router.push("/pricing");
            return;
          }
        }
      } catch {
        // Non-critical — allow access on error
      }
      setUserId(user.id);
    });
  }, [router]);

  const fetchSettlements = useCallback(async () => {
    try {
      const res = await fetch("/api/settlements");
      if (res.ok) {
        const data = await res.json();
        setSettlements(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSettlements();
    }
  }, [userId, fetchSettlements]);

  async function updateStatus(id: string, status: "paid" | "confirmed") {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/settlements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettlements((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function openVenmo(payee: Profile, amount: string, note: string | null) {
    const venmoUrl = `https://venmo.com/${payee.venmo_username}?txn=pay&amount=${amount}&note=${encodeURIComponent(note || "Nassau settlement")}`;
    window.open(venmoUrl, "_blank");
  }

  const owed = settlements.filter((s) => s.payee_id === userId);
  const owes = settlements.filter((s) => s.payer_id === userId);

  const hasAny = settlements.length > 0;

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-zinc-400 hover:bg-[#242424] hover:text-[#F3EDE4] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F3EDE4]">Settlements</h1>
            <p className="text-sm text-zinc-400">Track and settle up with your group</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-5 w-24 rounded bg-zinc-700 animate-pulse" />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-24 rounded bg-zinc-700 animate-pulse" />
              <SkeletonCard />
            </div>
          </div>
        ) : !hasAny ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#242424]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-lg font-medium text-[#F3EDE4]">
              No pending settlements.
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              You&apos;re all square!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* You're Owed */}
            {owed.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  You&apos;re Owed
                </h2>
                <div className="space-y-3">
                  {owed.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl bg-[#242424] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#F3EDE4] font-medium">
                            {s.payer.full_name || s.payer.email || "Unknown"}
                          </span>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 text-xl font-bold">
                          +${parseFloat(s.amount).toFixed(2)}
                        </span>
                      </div>

                      {s.note && (
                        <p className="text-sm text-zinc-400">{s.note}</p>
                      )}

                      {s.status === "paid" && (
                        <button
                          onClick={() => updateStatus(s.id, "confirmed")}
                          disabled={updatingId === s.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {updatingId === s.id ? "Confirming..." : "Confirm Payment"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* You Owe */}
            {owes.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#D94F2B]">
                  You Owe
                </h2>
                <div className="space-y-3">
                  {owes.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl bg-[#242424] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[#F3EDE4] font-medium">
                            {s.payee.full_name || s.payee.email || "Unknown"}
                          </span>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#D94F2B] text-xl font-bold">
                          -${parseFloat(s.amount).toFixed(2)}
                        </span>
                      </div>

                      {s.note && (
                        <p className="text-sm text-zinc-400">{s.note}</p>
                      )}

                      <div className="flex items-center gap-2">
                        {s.status === "pending" && (
                          <>
                            {s.payee.venmo_username && (
                              <button
                                onClick={() => openVenmo(s.payee, s.amount, s.note)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#008CFF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0070CC] transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Pay via Venmo
                              </button>
                            )}
                            <button
                              onClick={() => updateStatus(s.id, "paid")}
                              disabled={updatingId === s.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#C44425] transition-colors disabled:opacity-50"
                            >
                              <DollarSign className="h-4 w-4" />
                              {updatingId === s.id ? "Updating..." : "Mark as Paid"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
