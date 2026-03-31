"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  DollarSign,
  Check,
  ExternalLink,
  CheckCircle2,
  Home,
  Trophy,
  Map,
  User,
} from "lucide-react";
import TopBar from "@/components/TopBar";

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
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
    const venmoUrl = `https://venmo.com/pay?txn=pay&recipients=${payee.venmo_username}&amount=${amount}&note=${encodeURIComponent("Nassau - " + (note || "settlement"))}`;
    window.open(venmoUrl, "_blank");
  }

  function handleMarkAsPaid(id: string) {
    if (confirmingId === id) {
      setConfirmingId(null);
      updateStatus(id, "paid");
    } else {
      setConfirmingId(id);
    }
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
      className="min-h-screen bg-[#111111] pb-32"
    >
      {/* ── BANNER ── */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop"
          alt="Golf course clubhouse"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]" />
        <div className="relative z-10 flex flex-col h-full">
          <TopBar />
          <div className="mt-auto px-6 pb-5">
            <h1 className="text-[22px] font-headline font-medium text-[#F2F0EB] tracking-tight">Settlements</h1>
            <p className="text-[13px] text-[#F2F0EB]/50">Who owes who. Settle up fast.</p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {!loading && (
        <div className="bg-[#1A1A1A] rounded-[10px] shadow-sm p-4 mx-6 mt-4">
          <div className="grid grid-cols-2">
            <div>
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
                You Owe
              </p>
              <p className="font-semibold text-2xl text-[#C4423B]">
                ${youOweTotal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-[#5C5C5C]">
                Owed to You
              </p>
              <p className="font-semibold text-2xl text-[#2D5A3D]">
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
            className={`text-xs font-medium uppercase px-4 py-2 rounded-full whitespace-nowrap ${
              activeFilter === filter
                ? "bg-[#2D5A3D] text-white"
                : "border border-[#2A2A2A] text-[#8A8A8A]"
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
                className="animate-pulse rounded-[10px] bg-[#1A1A1A] p-4 space-y-3"
              >
                <div className="h-4 w-32 rounded bg-zinc-700" />
                <div className="h-6 w-20 rounded bg-zinc-700" />
                <div className="h-8 w-28 rounded bg-zinc-700" />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-[#8A8A8A]">All settled up 🤝</p>
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
                className="bg-[#1A1A1A] rounded-[10px] shadow-sm p-4"
              >
                {/* Top: Name + Amount */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F2F0EB]">
                    {otherPerson.full_name ||
                      otherPerson.email ||
                      "Unknown"}
                  </span>
                  <span
                    className={`text-xl font-semibold ${
                      isOwed ? "text-[#2D5A3D]" : "text-[#C4423B]"
                    }`}
                  >
                    {isOwed ? "+" : "-"}$
                    {parseFloat(s.amount).toFixed(2)}
                  </span>
                </div>

                {/* Round/trip note */}
                {(s.note || s.round_id || s.trip_id) && (
                  <p className="text-[12px] text-[#F2F0EB]/40 mt-1">
                    {s.note || (s.round_id ? "Round" : s.trip_id ? "Trip" : "")}
                  </p>
                )}

                {/* Bottom: Actions */}
                <div className="mt-3">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5 text-[#2D5A3D]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-bold">Paid</span>
                    </div>
                  ) : s.payer_id === userId && s.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      {s.payee.venmo_username && (
                        <button
                          onClick={() =>
                            openVenmo(s.payee, s.amount, s.note)
                          }
                          className="bg-[#C4423B] text-[#F2F0EB] rounded-[10px] py-2.5 px-4 text-[13px] font-medium"
                        >
                          Settle Up via Venmo
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkAsPaid(s.id)}
                        disabled={updatingId === s.id}
                        className="border border-[#F2F0EB]/10 text-[#F2F0EB]/50 rounded-[10px] py-2.5 px-4 text-[13px] font-medium hover:text-[#F2F0EB]/80 transition-colors disabled:opacity-50"
                      >
                        {updatingId === s.id
                          ? "Updating..."
                          : confirmingId === s.id
                            ? "Are you sure?"
                            : "Mark as Paid"}
                      </button>
                    </div>
                  ) : s.payee_id === userId && s.status === "paid" ? (
                    <button
                      onClick={() => updateStatus(s.id, "confirmed")}
                      disabled={updatingId === s.id}
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#2D5A3D] px-4 py-2.5 text-[13px] font-medium text-[#F2F0EB] hover:opacity-90 transition-colors disabled:opacity-50"
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
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#1A1A1A] px-6 py-3">
        <div className="grid grid-cols-4">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1"
          >
            <Home className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Home
            </span>
          </Link>
          <Link
            href="/rounds"
            className="flex flex-col items-center gap-1"
          >
            <Trophy className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Rounds
            </span>
          </Link>
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1"
          >
            <Map className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Trips
            </span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1"
          >
            <User className="h-5 w-5 text-[#8A8A8A]" />
            <span className="text-xs uppercase font-bold text-[#8A8A8A]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
