"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  MapPin,
  Calendar,
  Share2,
  Check,
  DollarSign,
  ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrors invite API response)
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
  id: string;
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  reason: string | null;
  settled: boolean;
  toPlayerVenmo?: string | null;
}

interface Award {
  title: string;
  playerId: string;
  playerName: string;
  description: string;
}

interface RoundRecap {
  id: string;
  course_name: string;
  course_location?: string;
  course_photo_url?: string | null;
  tee_time: string;
  status: string;
  share_code: string;
  notes?: string;
  commissioner_name: string;
  players: Player[];
  scorecards: Scorecard[];
  settlements: Settlement[];
  skins_buy_in: number | null;
  skins_results: any;
  nassau_bet_amount: number | null;
  nassau_results: any;
  awards: Award[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const AWARD_EMOJIS: Record<string, string> = {
  "Skins Assassin": "🎯",
  "Comeback Kid": "💪",
  "Money Player": "💰",
  "Snowman Club": "☃️",
  "Low Round": "🏆",
  "Hot Streak": "🔥",
  "Iron Man": "🦾",
  "Steady Eddie": "⚖️",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name || "Unknown";
}

function formatRelativePar(total: number, coursePar: number): string {
  if (!total) return "—";
  const diff = total - coursePar;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function RecapPage() {
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [data, setData] = useState<RoundRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/game-rounds/invite/${shareCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shareCode]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB]">
        <p className="text-sm text-[#6A6058]">Loading recap...</p>
      </div>
    );
  }

  if (!data || data.status !== "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F0EB]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Recap not available
          </h2>
          <p className="mt-2 text-sm text-[#6A6058]">
            This round hasn&apos;t been completed yet.
          </p>
          <Link
            href={`/round/${shareCode}`}
            className="mt-4 inline-block text-sm font-medium text-[#2D5A3D]"
          >
            View Round
          </Link>
        </div>
      </div>
    );
  }

  const confirmedPlayers = data.players.filter(
    (p) => p.status === "confirmed" || p.role === "COMMISSIONER"
  );

  // Use 72 as default course par (standard 18-hole)
  const coursePar = 72;

  // Sort leaderboard by total score
  const leaderboard = confirmedPlayers
    .map((p) => {
      const sc = data.scorecards.find((s) => s.playerId === p.id);
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
    });

  // Skins results
  const skinsPayouts =
    data.skins_results?.payouts as Record<string, number> | undefined;
  const skinsHoles =
    data.skins_results?.holes as
      | { hole: number; winnerId: string }[]
      | undefined;

  // Nassau results
  const nassauResults = data.nassau_results as {
    frontNine?: { winnerId: string | null; scores: Record<string, number> };
    backNine?: { winnerId: string | null; scores: Record<string, number> };
    overall?: { winnerId: string | null; scores: Record<string, number> };
    payouts?: Record<string, number>;
  } | null;

  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  async function handleSettle(settlementId: string) {
    if (!data) return;
    setSettlingId(settlementId);
    try {
      const res = await fetch(`/api/rounds/${data.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId }),
      });
      if (res.ok) {
        setSettledIds((prev) => new Set([...prev, settlementId]));
      }
    } catch (err) {
      console.error("Failed to settle:", err);
    } finally {
      setSettlingId(null);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F2F0EB] pb-12">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {data.course_photo_url ? (
          <div className="relative h-56">
            <img
              src={data.course_photo_url}
              alt={data.course_name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-56 bg-gradient-to-r from-emerald-800 to-emerald-600" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-lg">
            <span className="inline-flex items-center rounded-full bg-[#1A1A1A] px-3 py-1 text-xs font-bold text-white">
              FINAL
            </span>
            <h1 className="mt-2 text-3xl font-bold text-white">
              {data.course_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
              {data.course_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.course_location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(data.tee_time)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* ── Final Leaderboard ── */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[#E2D9CC] bg-white">
          <div className="border-b border-[#E2D9CC] bg-[#1A1A1A] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">
              Final Leaderboard
            </p>
          </div>
          <div className="divide-y divide-[#F2F0EB]">
            {leaderboard.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  idx === 0 ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0
                        ? "bg-[#2D5A3D] text-white"
                        : "bg-[#F2F0EB] text-[#8A8078]"
                    }`}
                  >
                    {idx === 0 ? (
                      <Trophy className="h-4 w-4" />
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
                <div className="text-right">
                  <span className="text-xl font-bold text-[#1A1A1A]">
                    {p.total || "—"}
                  </span>
                  {p.total > 0 && (
                    <p className="text-xs text-[#8A8078]">
                      {formatRelativePar(p.total, coursePar)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Skins Results ── */}
        {data.skins_buy_in && skinsPayouts && (
          <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
              Skins — ${data.skins_buy_in} buy-in
            </p>

            {/* Holes won */}
            {skinsHoles && skinsHoles.length > 0 && (
              <div className="mb-3 space-y-1">
                {skinsHoles
                  .filter((h) => h.winnerId)
                  .map((h) => (
                    <div
                      key={h.hole}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#6A6058]">Hole {h.hole}</span>
                      <span className="font-medium text-[#1A1A1A]">
                        {getPlayerName(data.players, h.winnerId)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Payouts */}
            <div className="border-t border-[#F2F0EB] pt-3 space-y-1.5">
              {Object.entries(skinsPayouts)
                .filter(([, v]) => v !== 0)
                .sort(([, a], [, b]) => b - a)
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
                        amount > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {amount > 0 ? "+" : ""}${Math.abs(amount).toFixed(0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Nassau Results ── */}
        {data.nassau_bet_amount && nassauResults && (
          <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
              Nassau — ${data.nassau_bet_amount}/bet
            </p>

            <div className="space-y-2">
              {/* Front 9 */}
              {nassauResults.frontNine && (
                <div className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2">
                  <span className="text-xs font-semibold text-[#8A8078]">
                    Front 9
                  </span>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {nassauResults.frontNine.winnerId
                      ? getPlayerName(
                          data.players,
                          nassauResults.frontNine.winnerId
                        )
                      : "Push"}
                  </span>
                </div>
              )}
              {/* Back 9 */}
              {nassauResults.backNine && (
                <div className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2">
                  <span className="text-xs font-semibold text-[#8A8078]">
                    Back 9
                  </span>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {nassauResults.backNine.winnerId
                      ? getPlayerName(
                          data.players,
                          nassauResults.backNine.winnerId
                        )
                      : "Push"}
                  </span>
                </div>
              )}
              {/* Total */}
              {nassauResults.overall && (
                <div className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2">
                  <span className="text-xs font-semibold text-[#8A8078]">
                    Overall
                  </span>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {nassauResults.overall.winnerId
                      ? getPlayerName(
                          data.players,
                          nassauResults.overall.winnerId
                        )
                      : "Push"}
                  </span>
                </div>
              )}
            </div>

            {/* Nassau payouts */}
            {nassauResults.payouts && (
              <div className="mt-3 border-t border-[#F2F0EB] pt-3 space-y-1.5">
                {Object.entries(nassauResults.payouts)
                  .filter(([, v]) => v !== 0)
                  .sort(([, a], [, b]) => b - a)
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
                          amount > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {amount > 0 ? "+" : ""}${Math.abs(amount).toFixed(0)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ── Awards ── */}
        {data.awards && data.awards.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
              Awards
            </p>
            <div className="space-y-2">
              {data.awards.map((award, idx) => {
                const emoji =
                  AWARD_EMOJIS[award.title] || "🏅";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-[#F2F0EB] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#2D5A3D]">
                        {emoji} {award.title}
                      </p>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {award.playerName}
                      </p>
                    </div>
                    <p className="text-xs text-[#8A8078] max-w-[140px] text-right">
                      {award.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Settlements ── */}
        {data.settlements.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#E2D9CC] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8A8078] mb-3">
              Settlements
            </p>
            <div className="space-y-2">
              {data.settlements.map((s) => {
                const isSettled = s.settled || settledIds.has(s.id);
                const venmoNote = `Nassau - ${data.course_name}`;
                const venmoLink = s.toPlayerVenmo
                  ? isMobile
                    ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(s.toPlayerVenmo)}&amount=${s.amount.toFixed(2)}&note=${encodeURIComponent(venmoNote)}`
                    : `https://venmo.com/${encodeURIComponent(s.toPlayerVenmo)}?txn=pay&amount=${s.amount.toFixed(2)}&note=${encodeURIComponent(venmoNote)}`
                  : null;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                      isSettled ? "bg-emerald-50" : "bg-[#F2F0EB]"
                    }`}
                  >
                    <div className="text-sm">
                      <span className={`font-medium ${isSettled ? "text-[#8A8078] line-through" : "text-[#1A1A1A]"}`}>
                        {getPlayerName(data.players, s.fromPlayer)}
                      </span>
                      <span className="text-[#8A8078]"> → </span>
                      <span className={`font-medium ${isSettled ? "text-[#8A8078] line-through" : "text-[#1A1A1A]"}`}>
                        {getPlayerName(data.players, s.toPlayer)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isSettled ? "text-[#8A8078] line-through" : "text-[#1A1A1A]"}`}>
                        ${s.amount.toFixed(2)}
                      </span>
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Check className="h-2.5 w-2.5" />
                          Paid
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {venmoLink && (
                            <a
                              href={venmoLink}
                              target={isMobile ? undefined : "_blank"}
                              rel={isMobile ? undefined : "noopener noreferrer"}
                              className="inline-flex items-center gap-1 rounded-full bg-[#2D5A3D] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#244A32]"
                            >
                              <DollarSign className="h-2.5 w-2.5" />
                              Pay ${s.amount.toFixed(0)} on Venmo
                            </a>
                          )}
                          <button
                            onClick={() => handleSettle(s.id)}
                            disabled={settlingId === s.id}
                            className="inline-flex items-center gap-1 rounded-full border border-[#E2D9CC] bg-white px-2 py-0.5 text-[10px] font-bold text-[#6A6058] transition-colors hover:bg-[#F2F0EB] disabled:opacity-50"
                          >
                            <Check className="h-2.5 w-2.5" />
                            {settlingId === s.id ? "..." : "Mark Paid"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 rounded-xl border border-[#E2D9CC] bg-white py-3.5 text-sm font-bold text-[#1A1A1A] transition-colors hover:bg-[#F2F0EB] active:scale-[0.98]"
          >
            {copied ? (
              <span className="inline-flex items-center justify-center gap-1">
                <Check className="h-4 w-4 text-[#2D5A3D]" />
                Copied!
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-1">
                <Share2 className="h-4 w-4" />
                Share This Recap
              </span>
            )}
          </button>
          <Link
            href="/rounds/new"
            className="flex-1 rounded-xl bg-[#2D5A3D] py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#244A32] active:scale-[0.98]"
          >
            Play Again
          </Link>
        </div>

        {/* ── Branding ── */}
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
