"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Calendar, Users, Trophy, AlertCircle } from "lucide-react";

interface RoundInvite {
  id: string;
  course_name: string;
  course_location?: string;
  tee_time: string;
  status: string;
  share_code: string;
  notes?: string;
  commissioner_name: string;
  players: { id: string; name: string; status: string; role: string }[];
  skins_buy_in: number | null;
  nassau_bet_amount: number | null;
}

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
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export default function RoundInvitePage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [roundInfo, setRoundInfo] = useState<RoundInvite | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlayer, setIsPlayer] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get round info (public)
        const res = await fetch(`/api/game-rounds/invite/${shareCode}`);
        if (!res.ok) {
          setError(res.status === 404 ? null : "Unable to load round details");
          setLoading(false);
          return;
        }
        const info: RoundInvite = await res.json();
        setRoundInfo(info);

        // Check auth
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Try to join (handles already-a-player case)
          try {
            const joinRes = await fetch(
              `/api/game-rounds/invite/${shareCode}/join`,
              { method: "POST" }
            );
            if (joinRes.ok) {
              const data = await joinRes.json();
              setIsPlayer(true);
              router.push(`/rounds/${data.roundId}`);
              return;
            }
          } catch {
            // Not a big deal — they can try the join button
          }
        }
      } catch {
        setError("Unable to load round details. Please try again.");
      }

      setLoading(false);
    }
    load();
  }, [shareCode, router]);

  async function handleJoin() {
    if (!userId) {
      // Redirect to login, then come back
      sessionStorage.setItem("pendingRoundInvite", shareCode);
      router.push("/login");
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/game-rounds/invite/${shareCode}/join`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }
      const data = await res.json();
      router.push(`/rounds/${data.roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join round");
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!roundInfo) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            Round not found
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
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

  const confirmedPlayers = roundInfo.players.filter(
    (p) => p.status === "confirmed" || p.role === "COMMISSIONER"
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">⛳</div>

          <h1 className="text-xl font-bold text-zinc-900">
            {roundInfo.course_name}
          </h1>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
              <Calendar className="h-4 w-4" />
              {formatDateTime(roundInfo.tee_time)}
            </div>

            {roundInfo.course_location && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                <MapPin className="h-4 w-4" />
                {roundInfo.course_location}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
              <Users className="h-4 w-4" />
              Commissioner: {roundInfo.commissioner_name}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
              <Users className="h-4 w-4" />
              {confirmedPlayers.length} player
              {confirmedPlayers.length !== 1 ? "s" : ""}:{" "}
              {confirmedPlayers.map((p) => p.name).join(", ")}
            </div>

            {roundInfo.skins_buy_in && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                <Trophy className="h-4 w-4" />
                ${roundInfo.skins_buy_in} Skins Game
              </div>
            )}

            {roundInfo.nassau_bet_amount && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                <Trophy className="h-4 w-4" />
                ${roundInfo.nassau_bet_amount}/bet Nassau
              </div>
            )}

            {roundInfo.notes && (
              <p className="text-sm text-zinc-400 italic">
                {roundInfo.notes}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!isPlayer && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="mt-6 w-full rounded-lg bg-[#D94F2B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B83D25] disabled:opacity-50"
            >
              {joining
                ? "Joining..."
                : userId
                  ? "Join This Round"
                  : "Sign Up to Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
