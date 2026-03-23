"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  CloudSun,
  Wind,
  DollarSign,
  Crown,
  ChevronRight,
  RefreshCw,
  Share2,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Player {
  id: string;
  name: string;
  status: string;
  role: string;
}

interface Scorecard {
  playerId: string;
  holes: number[];
  total: number;
}

interface Settlement {
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  reason: string | null;
  settled: boolean;
}

interface Award {
  title: string;
  playerId: string;
  playerName: string;
  description: string;
}

interface RoundShare {
  id: string;
  course_name: string;
  course_location?: string;
  course_photo_url?: string | null;
  tee_time: string;
  status: string;
  share_code: string;
  notes?: string;
  weather_data?: any;
  commissioner_name: string;
  players: Player[];
  scorecards: Scorecard[];
  settlements: Settlement[];
  skins_buy_in: number | null;
  skins_results: any;
  nassau_bet_amount: number | null;
  awards: Award[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor(diff / (1000 * 60))}m`;
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name || "Unknown";
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RoundSharePage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [data, setData] = useState<RoundShare | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [requiresVenmo, setRequiresVenmo] = useState(false);
  const [venmoInput, setVenmoInput] = useState("");
  const [savingVenmo, setSavingVenmo] = useState(false);

  async function fetchRound() {
    try {
      const res = await fetch(`/api/game-rounds/invite/${shareCode}`);
      if (!res.ok) {
        if (res.status !== 404) setError("Unable to load round details");
        setLoading(false);
        return;
      }
      const info: RoundShare = await res.json();
      setData(info);
    } catch {
      setError("Unable to load round details.");
    }
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      await fetchRound();

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Clear pending invite if it matches this round
        if (typeof window !== "undefined") {
          const pending = sessionStorage.getItem("pendingRoundInvite");
          if (pending === shareCode) {
            sessionStorage.removeItem("pendingRoundInvite");
          }
        }
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode]);

  // Auto-refresh live rounds every 30s
  useEffect(() => {
    if (!data || data.status !== "in_progress") return;
    const interval = setInterval(fetchRound, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  async function handleJoin() {
    if (!userId) {
      sessionStorage.setItem("pendingRoundInvite", shareCode);
      router.push("/login");
      return;
    }
    setJoining(true);
    setError(null);
    setRequiresVenmo(false);
    try {
      const res = await fetch(
        `/api/game-rounds/invite/${shareCode}/join`,
        { method: "POST" }
      );
      const d: { roundId?: string; requiresVenmo?: boolean; message?: string; error?: string } = await res.json();

      if (d.requiresVenmo) {
        setRequiresVenmo(true);
        setJoining(false);
        return;
      }

      if (!res.ok) {
        throw new Error(d.error || "Failed to join");
      }

      router.push(`/rounds/${d.roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join round");
      setJoining(false);
    }
  }

  async function handleSaveVenmoAndJoin() {
    if (!venmoInput.trim()) {
      setError("Please enter your Venmo username");
      return;
    }
    setSavingVenmo(true);
    setError(null);
    try {
      const venmoRes = await fetch("/api/profile/venmo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venmoUsername: venmoInput.trim() }),
      });
      if (!venmoRes.ok) {
        throw new Error("Failed to save Venmo username");
      }
      setRequiresVenmo(false);
      setSavingVenmo(false);
      // Retry join
      await handleJoin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Venmo");
      setSavingVenmo(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.course_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#F3EDE4]">
        <p className="text-sm text-[#6A6058]">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#F3EDE4]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Round not found
          </h2>
          <p className="mt-2 text-sm text-[#6A6058]">
            {error || "This invite link may have expired or is invalid."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-[#D94F2B]"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const confirmedPlayers = data.players.filter(
    (p) => p.status === "confirmed" || p.role === "COMMISSIONER"
  );
  const state: "invite" | "live" | "recap" =
    data.status === "completed"
      ? "recap"
      : data.status === "in_progress"
        ? "live"
        : "invite";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F3EDE4] px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* ── Course Hero ── */}
        <div className="overflow-hidden rounded-2xl">
          {data.course_photo_url ? (
            <div className="relative h-44">
              <img
                src={data.course_photo_url}
                alt={data.course_name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <StateBadge state={state} />
                <h1 className="mt-1 text-2xl font-bold text-white">
                  {data.course_name}
                </h1>
                {data.course_location && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-white/70">
                    <MapPin className="h-3.5 w-3.5" />
                    {data.course_location}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-6">
              <StateBadge state={state} />
              <h1 className="mt-1 text-2xl font-bold text-white">
                {data.course_name}
              </h1>
              {data.course_location && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-white/70">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.course_location}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Info Strip ── */}
        <div className="mt-4 flex flex-wrap gap-2">
          <InfoPill icon={<Calendar className="h-3.5 w-3.5" />}>
            {formatShortDate(data.tee_time)}
          </InfoPill>
          <InfoPill icon={<Users className="h-3.5 w-3.5" />}>
            {confirmedPlayers.length} player
            {confirmedPlayers.length !== 1 ? "s" : ""}
          </InfoPill>
          {data.skins_buy_in && (
            <InfoPill icon={<Trophy className="h-3.5 w-3.5" />}>
              ${data.skins_buy_in} Skins
            </InfoPill>
          )}
          {data.nassau_bet_amount && (
            <InfoPill icon={<DollarSign className="h-3.5 w-3.5" />}>
              ${data.nassau_bet_amount} Nassau
            </InfoPill>
          )}
          {state === "invite" && getCountdown(data.tee_time) && (
            <InfoPill icon={<RefreshCw className="h-3.5 w-3.5" />}>
              {getCountdown(data.tee_time)}
            </InfoPill>
          )}
        </div>

        {/* ── Weather ── */}
        {data.weather_data && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#E2D9CC] bg-white/50 px-3 py-2 text-sm text-[#6A6058]">
            <CloudSun className="h-4 w-4" />
            {data.weather_data.tempHigh}&deg;F
            <Wind className="ml-1 h-3.5 w-3.5" />
            {data.weather_data.windSpeedMax}mph
            {data.weather_data.precipitationProbability > 0 && (
              <span> &middot; {data.weather_data.precipitationProbability}% rain</span>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── STATE: INVITE ── */}
        {state === "invite" && (
          <>
            {/* Players */}
            <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8078]">
                Players Joined
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.players.map((p) => (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                      p.status === "confirmed" || p.role === "COMMISSIONER"
                        ? "bg-[#F3EDE4] text-[#1A1A1A]"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {p.role === "COMMISSIONER" && (
                      <Crown className="h-3 w-3 text-amber-600" />
                    )}
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {data.notes && (
              <p className="mt-3 text-sm italic text-[#8A8078]">{data.notes}</p>
            )}

            {/* Venmo required inline prompt */}
            {requiresVenmo && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Add your Venmo username to join
                </p>
                <p className="mt-1 text-xs text-[#6A6058]">
                  Required to settle bets with your group after the round.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-[#8A8078]">@</span>
                  <input
                    type="text"
                    value={venmoInput}
                    onChange={(e) => setVenmoInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveVenmoAndJoin()}
                    placeholder="username"
                    className="flex-1 rounded-lg border border-[#E2D9CC] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#8A8078] outline-none focus:border-[#D94F2B]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveVenmoAndJoin}
                    disabled={savingVenmo}
                    className="rounded-lg bg-[#D94F2B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c4442a] disabled:opacity-50"
                  >
                    {savingVenmo ? "..." : "Save & Join"}
                  </button>
                </div>
              </div>
            )}

            {!requiresVenmo && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="mt-6 w-full rounded-xl bg-[#D94F2B] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#c4442a] disabled:opacity-50 active:scale-[0.98]"
              >
                {joining
                  ? "Joining..."
                  : userId
                    ? "Join This Round"
                    : "Sign Up to Join"}
              </button>
            )}
          </>
        )}

        {/* ── STATE: LIVE ── */}
        {state === "live" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D94F2B] animate-pulse" />
              <span className="text-sm font-semibold text-[#D94F2B]">
                Round in progress
              </span>
            </div>

            {/* Live Leaderboard */}
            <div className="mt-3 rounded-xl border border-[#E2D9CC] bg-white overflow-hidden">
              <div className="border-b border-[#E2D9CC] bg-[#F3EDE4] px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078]">
                  Leaderboard
                </p>
              </div>
              <div className="divide-y divide-[#F3EDE4]">
                {confirmedPlayers
                  .map((p) => {
                    const sc = data.scorecards.find(
                      (s) => s.playerId === p.id
                    );
                    return { ...p, total: sc?.total ?? 0 };
                  })
                  .sort((a, b) => {
                    if (a.total === 0 && b.total === 0) return 0;
                    if (a.total === 0) return 1;
                    if (b.total === 0) return -1;
                    return a.total - b.total;
                  })
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0 && p.total > 0
                              ? "bg-[#D94F2B] text-white"
                              : "bg-[#F3EDE4] text-[#8A8078]"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-[#1A1A1A]">
                        {p.total || "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Skins status */}
            {data.skins_buy_in && data.skins_results?.payouts && (
              <div className="mt-3 rounded-xl border border-[#E2D9CC] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078]">
                  Skins
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(
                    data.skins_results.payouts as Record<string, number>
                  )
                    .filter(([, v]) => (v as number) !== 0)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([playerId, amount]) => (
                      <div
                        key={playerId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-[#1A1A1A]">
                          {getPlayerName(data.players, playerId)}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            (amount as number) > 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {(amount as number) > 0 ? "+" : ""}$
                          {Math.abs(amount as number).toFixed(0)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              className="mt-6 w-full rounded-xl bg-[#D94F2B] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#c4442a] active:scale-[0.98]"
            >
              {userId ? "Open Round" : "Sign Up to Follow"}
            </button>
          </>
        )}

        {/* ── STATE: RECAP ── */}
        {state === "recap" && (
          <>
            {/* Final Leaderboard */}
            <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white overflow-hidden">
              <div className="border-b border-[#E2D9CC] bg-[#1A1A1A] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Final Scores
                </p>
              </div>
              <div className="divide-y divide-[#F3EDE4]">
                {confirmedPlayers
                  .map((p) => {
                    const sc = data.scorecards.find(
                      (s) => s.playerId === p.id
                    );
                    // Calculate net money
                    let moneyNet = 0;
                    for (const s of data.settlements) {
                      if (s.toPlayer === p.id) moneyNet += s.amount;
                      if (s.fromPlayer === p.id) moneyNet -= s.amount;
                    }
                    return { ...p, total: sc?.total ?? 0, moneyNet };
                  })
                  .sort((a, b) => {
                    if (a.total === 0 && b.total === 0) return 0;
                    if (a.total === 0) return 1;
                    if (b.total === 0) return -1;
                    return a.total - b.total;
                  })
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        idx === 0 ? "bg-amber-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-[#D94F2B] text-white"
                              : "bg-[#F3EDE4] text-[#8A8078]"
                          }`}
                        >
                          {idx === 0 ? (
                            <Trophy className="h-3.5 w-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <div>
                          <span className="text-sm font-semibold text-[#1A1A1A]">
                            {p.name}
                          </span>
                          {p.moneyNet !== 0 && (
                            <span
                              className={`ml-2 text-xs font-medium ${
                                p.moneyNet > 0
                                  ? "text-emerald-600"
                                  : "text-red-500"
                              }`}
                            >
                              {p.moneyNet > 0 ? "+" : ""}$
                              {Math.abs(p.moneyNet).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xl font-bold text-[#1A1A1A]">
                        {p.total || "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Awards */}
            {data.awards && data.awards.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
                  Awards
                </p>
                <div className="space-y-2">
                  {data.awards.map((award, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-[#F3EDE4] px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#D94F2B]">
                          {award.title}
                        </p>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {award.playerName}
                        </p>
                      </div>
                      <p className="text-xs text-[#8A8078] max-w-[140px] text-right">
                        {award.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settlements */}
            {data.settlements.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
                  Settlements
                </p>
                <div className="space-y-1.5">
                  {data.settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#1A1A1A]">
                        {getPlayerName(data.players, s.fromPlayer)} &rarr;{" "}
                        {getPlayerName(data.players, s.toPlayer)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">
                          ${s.amount.toFixed(2)}
                        </span>
                        {s.settled && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Recap link */}
            <Link
              href={`/round/${shareCode}/recap`}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[#D94F2B] bg-white py-3 text-sm font-bold text-[#D94F2B] transition-colors hover:bg-[#D94F2B]/5 active:scale-[0.98]"
            >
              View Full Recap
              <ChevronRight className="h-4 w-4" />
            </Link>

            {/* CTAs */}
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 rounded-xl border border-[#E2D9CC] bg-white py-3 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#F3EDE4] active:scale-[0.98]"
              >
                {copied ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4 text-[#D94F2B]" />
                    Copied!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    Share
                  </span>
                )}
              </button>
              <Link
                href="/rounds/new"
                className="flex-1 rounded-xl bg-[#D94F2B] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c4442a] active:scale-[0.98]"
              >
                Play Again
              </Link>
            </div>
          </>
        )}

        {/* ── Nassau branding ── */}
        <p className="mt-8 text-center text-xs text-[#8A8078]">
          Powered by{" "}
          <Link href="/" className="font-semibold text-[#1A1A1A]">
            Nassau
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StateBadge({ state }: { state: "invite" | "live" | "recap" }) {
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#D94F2B] px-2.5 py-0.5 text-xs font-bold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === "recap") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-bold text-white">
        FINAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
      INVITE
    </span>
  );
}

function InfoPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E2D9CC] bg-white px-3 py-1 text-xs font-medium text-[#6A6058]">
      {icon}
      {children}
    </span>
  );
}
