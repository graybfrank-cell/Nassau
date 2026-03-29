import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const status = req.nextUrl.searchParams.get("status");

  // 1. Fetch user-level settlements (the existing behavior)
  const where: Record<string, unknown> = {
    OR: [{ payer_id: user.id }, { payee_id: user.id }],
  };

  if (status) {
    where.status = status;
  }

  const userSettlements = await prisma.settlements.findMany({
    where,
    include: {
      payer: {
        select: { id: true, full_name: true, email: true, venmo_username: true },
      },
      payee: {
        select: { id: true, full_name: true, email: true, venmo_username: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // 2. Fetch unsettled game-level settlements (from gameSettlements)
  //    Only include these when showing pending or all settlements
  if (status === "paid" || status === "confirmed") {
    return NextResponse.json(userSettlements);
  }

  const myPlayers = await prisma.gamePlayers.findMany({
    where: { user_id: user.id },
    select: { id: true },
  });
  const playerIds = myPlayers.map((p: { id: string }) => p.id);

  if (playerIds.length === 0) {
    return NextResponse.json(userSettlements);
  }

  const unsettledGameSettlements = await prisma.gameSettlements.findMany({
    where: {
      settled: false,
      OR: [
        { from_player: { in: playerIds } },
        { to_player: { in: playerIds } },
      ],
    },
    select: {
      id: true,
      round_id: true,
      from_player: true,
      to_player: true,
      amount: true,
      reason: true,
      created_at: true,
    },
  });

  if (unsettledGameSettlements.length === 0) {
    return NextResponse.json(userSettlements);
  }

  // Resolve player IDs to profiles
  const allPlayerIdsInSettlements = new Set<string>();
  for (const s of unsettledGameSettlements) {
    allPlayerIdsInSettlements.add(s.from_player);
    allPlayerIdsInSettlements.add(s.to_player);
  }

  const settlementPlayers = await prisma.gamePlayers.findMany({
    where: { id: { in: Array.from(allPlayerIdsInSettlements) } },
    select: { id: true, name: true, user_id: true },
  });

  const playerMap = new Map<string, { name: string; userId: string | null }>();
  for (const p of settlementPlayers) {
    playerMap.set(p.id, { name: p.name, userId: p.user_id });
  }

  // Fetch profiles for players that have user accounts
  const userIdsInGame = new Set<string>();
  for (const p of settlementPlayers) {
    if (p.user_id) userIdsInGame.add(p.user_id);
  }

  const profiles = await prisma.profiles.findMany({
    where: { id: { in: Array.from(userIdsInGame) } },
    select: { id: true, full_name: true, email: true, venmo_username: true },
  });

  const profileMap = new Map<string, { id: string; full_name: string; email: string | null; venmo_username: string | null }>();
  for (const p of profiles) {
    profileMap.set(p.id, p);
  }

  // Build a profile-like object from a game player ID
  function buildProfile(playerId: string) {
    const player = playerMap.get(playerId);
    if (!player) {
      return { id: playerId, full_name: "Unknown", email: null, venmo_username: null };
    }
    if (player.userId) {
      const profile = profileMap.get(player.userId);
      if (profile) return profile;
    }
    return { id: player.userId || playerId, full_name: player.name, email: null, venmo_username: null };
  }

  // Transform game settlements into the same shape as user settlements
  const myPlayerIdSet = new Set(playerIds);
  const gameSettlementsTransformed = unsettledGameSettlements.map((s: { id: string; round_id: string; from_player: string; to_player: string; amount: { toString(): string }; reason: string | null; created_at: Date }) => {
    const fromPlayer = playerMap.get(s.from_player);
    const toPlayer = playerMap.get(s.to_player);

    return {
      id: s.id,
      round_id: s.round_id,
      trip_id: null,
      payer_id: fromPlayer?.userId || s.from_player,
      payee_id: toPlayer?.userId || s.to_player,
      amount: s.amount.toString(),
      note: s.reason || null,
      status: "pending" as const,
      paid_at: null,
      confirmed_at: null,
      created_at: s.created_at.toISOString(),
      payer: buildProfile(s.from_player),
      payee: buildProfile(s.to_player),
      _source: "game" as const,
    };
  });

  // Deduplicate: skip game settlements that already have a matching user-level settlement
  const existingSettlementKeys = new Set(
    userSettlements.map((s: { payer_id: string; payee_id: string; round_id: string | null }) => `${s.payer_id}:${s.payee_id}:${s.round_id}`)
  );

  const deduped = gameSettlementsTransformed.filter(
    (s: { payer_id: string; payee_id: string; round_id: string | null }) => !existingSettlementKeys.has(`${s.payer_id}:${s.payee_id}:${s.round_id}`)
  );

  // Combine and sort by created_at desc
  const combined = [...userSettlements, ...deduped].sort(
    (a: { created_at: string | Date }, b: { created_at: string | Date }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json(combined);
}
