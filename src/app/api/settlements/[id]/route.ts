import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const body = await req.json();
  const { status } = body as { status: string };

  if (status !== "paid" && status !== "confirmed") {
    return NextResponse.json(
      { error: "Status must be 'paid' or 'confirmed'" },
      { status: 400 }
    );
  }

  // Try the settlements table first
  const settlement = await prisma.settlements.findUnique({
    where: { id },
  });

  if (settlement) {
    // Only the payer can mark as paid
    if (status === "paid" && settlement.payer_id !== user.id) {
      return forbidden();
    }

    // Only the payee can confirm payment
    if (status === "confirmed" && settlement.payee_id !== user.id) {
      return forbidden();
    }

    const data: Record<string, unknown> = { status };

    if (status === "paid") {
      data.paid_at = new Date();
    } else if (status === "confirmed") {
      data.confirmed_at = new Date();
    }

    const updated = await prisma.settlements.update({
      where: { id },
      data,
      include: {
        payer: {
          select: { id: true, full_name: true, email: true, venmo_username: true },
        },
        payee: {
          select: { id: true, full_name: true, email: true, venmo_username: true },
        },
      },
    });

    return NextResponse.json(updated);
  }

  // Fallback: try the gameSettlements table
  const gameSettlement = await prisma.gameSettlements.findUnique({
    where: { id },
  });

  if (!gameSettlement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify the user is involved via their game player records
  const myPlayers = await prisma.gamePlayers.findMany({
    where: { user_id: user.id },
    select: { id: true },
  });
  const playerIds = new Set(myPlayers.map((p: { id: string }) => p.id));

  const isFromPlayer = playerIds.has(gameSettlement.from_player);
  const isToPlayer = playerIds.has(gameSettlement.to_player);

  if (status === "paid" && !isFromPlayer) {
    return forbidden();
  }
  if (status === "confirmed" && !isToPlayer) {
    return forbidden();
  }

  // Mark the game settlement as settled
  await prisma.gameSettlements.update({
    where: { id },
    data: {
      settled: true,
      settled_at: new Date(),
      settled_by: user.id,
    },
  });

  // Resolve player profiles to return the same shape the frontend expects
  const involvedPlayerIds = [gameSettlement.from_player, gameSettlement.to_player];
  const players = await prisma.gamePlayers.findMany({
    where: { id: { in: involvedPlayerIds } },
    select: { id: true, name: true, user_id: true },
  });

  const userIds = players
    .map((p: { user_id: string | null }) => p.user_id)
    .filter((uid: string | null): uid is string => uid !== null);

  const profiles = userIds.length > 0
    ? await prisma.profiles.findMany({
        where: { id: { in: userIds } },
        select: { id: true, full_name: true, email: true, venmo_username: true },
      })
    : [];

  type ProfileShape = { id: string; full_name: string; email: string | null; venmo_username: string | null };

  const profileMap = new Map<string, ProfileShape>(
    profiles.map((p: ProfileShape) => [p.id, p])
  );

  function buildProfile(playerId: string): ProfileShape {
    const player = players.find((p: { id: string }) => p.id === playerId);
    if (!player) {
      return { id: playerId, full_name: "Unknown", email: null, venmo_username: null };
    }
    if (player.user_id) {
      const profile = profileMap.get(player.user_id);
      if (profile) return profile;
    }
    return { id: player.user_id || playerId, full_name: player.name, email: null, venmo_username: null };
  }

  const fromProfile = buildProfile(gameSettlement.from_player);
  const toProfile = buildProfile(gameSettlement.to_player);

  return NextResponse.json({
    id: gameSettlement.id,
    round_id: gameSettlement.round_id,
    trip_id: null,
    payer_id: fromProfile.id,
    payee_id: toProfile.id,
    amount: gameSettlement.amount.toString(),
    note: gameSettlement.reason || null,
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
    confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    created_at: gameSettlement.created_at.toISOString(),
    payer: fromProfile,
    payee: toProfile,
    _source: "game" as const,
  });
}
