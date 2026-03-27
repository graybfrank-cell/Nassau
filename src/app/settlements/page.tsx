"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  DollarSign,
  Check,
  ExternalLink,
  CheckCircle2,
  Bell,
  Home,
  Trophy,
  Map,
  User,
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

const FILTERS = ["All", "Pending", "Paid"] as const;

export default function SettlementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

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

  const youOweTotal = settlements
    .filter((s) => s.payer_id === userId && s.status === "pending")
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const owedToYouTotal = settlements
    .filter((s) => s.payee_id === userId && s.status === "pending")
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const filtered = settlements.filter((s) => {
    if (activeFilter === "Pending") return s.status === "pending";
    if (activeFilter === "Paid") return s.status === "paid" || s.status === "confirmed";
    return true;
  });

  return (
    <div
      className="min-h-screen bg-[#18181B] pb-32"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-black text-xl uppercase tracking-tighter text-[#F3EDE4]">
          NASSAU
        </span>
        <div className="flex items-center gap-4">
          <Bell className="h-5 w-5 text-[#71717A]" />
          <div className="h-8 w-8 rounded-full bg-[#3F3F46] flex items-center justify-center text-xs font-bold text-[#F3EDE4]">
            U
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="px-6 mt-2">
        <h1 className="font-black text-3xl uppercase text-[#F3EDE4]">
          Settlements
        </h1>
        <p className="text-sm text-[#71717A]">
          Who owes who. Settle up fast.
        </p>
      </div>

      {/* Summary Card */}
      {!loading && (
        <div className="bg-[#27272A] rounded-xl p-4 mx-6 mt-4">
          <div className="grid grid-cols-2">
            <div>
              <p className="text-xs uppercase text-[#71717A] font-bold">
                You Owe
              </p>
              <p className="font-black text-2xl text-[#D94F2B]">
                ${youOweTotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-[#71717A] font-bold">
                Owed to You
              </p>
              <p className="font-black text-2xl text-[#0D7377]">
                ${owedToYouTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="px-6 mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`text-xs font-black uppercase px-4 py-2 rounded-full whitespace-nowrap ${
              activeFilter === filter
                ? "bg-[#D94F2B] text-white"
                : "border border-[#3F3F46] text-[#71717A]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Settlements List */}
      <div className="px-6 mt-4 space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-[#27272A] p-4 space-y-3"
              >
                <div className="h-4 w-32 rounded bg-zinc-700" />
                <div className="h-6 w-20 rounded bg-zinc-700" />
                <div className="h-8 w-28 rounded bg-zinc-700" />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-[#71717A]">All settled up 🤝</p>
          </div>
        ) : (
          filtered.map((s) => {
            const isOwed = s.payee_id === userId;
            const otherPerson = isOwed ? s.payer : s.payee;
            const isPaid =
              s.status === "paid" || s.status === "confirmed";

            return (
              <div
                key={s.id}
                className="bg-[#27272A] rounded-xl p-4 border border-[#3F3F46]"
              >
                {/* Top: Name + round/trip */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F3EDE4]">
                    {otherPerson.full_name ||
                      otherPerson.email ||
                      "Unknown"}
                  </span>
                  <span className="text-xs text-[#71717A]">
                    {s.note || (s.round_id ? "Round" : s.trip_id ? "Trip" : "")}
                  </span>
                </div>

                {/* Middle: Amount */}
                <p
                  className={`text-xl font-black mt-2 ${
                    isOwed ? "text-[#0D7377]" : "text-[#D94F2B]"
                  }`}
                >
                  {isOwed ? "+" : "-"}$
                  {parseFloat(s.amount).toFixed(2)}
                </p>

                {/* Bottom: Actions */}
                <div className="mt-3">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 text-[#0D7377]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-bold">Paid</span>
                    </div>
                  ) : s.payer_id === userId && s.status === "pending" ? (
                    <div className="flex items-center gap-3">
                      {s.payee.venmo_username && (
                        <button
                          onClick={() =>
                            openVenmo(s.payee, s.amount, s.note)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44425] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Settle via Venmo →
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(s.id, "paid")}
                        disabled={updatingId === s.id}
                        className="text-sm text-[#71717A] hover:text-[#F3EDE4] transition-colors disabled:opacity-50"
                      >
                        {updatingId === s.id
                          ? "Updating..."
                          : "Mark as Paid"}
                      </button>
                    </div>
                  ) : s.payee_id === userId && s.status === "paid" ? (
                    <button
                      onClick={() => updateStatus(s.id, "confirmed")}
                      disabled={updatingId === s.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D7377] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#0B6165] transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      {updatingId === s.id
                        ? "Confirming..."
                        : "Confirm Payment"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#18181B] border-t border-[#27272A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1"
          >
            <Home className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Home
            </span>
          </Link>
          <Link
            href="/rounds"
            className="flex flex-col items-center gap-1"
          >
            <Trophy className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Rounds
            </span>
          </Link>
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1"
          >
            <Map className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Trips
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1"
          >
            <User className="h-5 w-5 text-[#71717A]" />
            <span className="text-xs uppercase font-bold text-[#71717A]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
