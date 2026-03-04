import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { shareCode } = await params;

  try {
    const round = await prisma.gameRounds.findUnique({
      where: { share_code: shareCode },
      include: { players: true },
    });

    if (!round) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if already a player
    const existing = round.players.find((p) => p.user_id === user.id);
    if (existing) {
      // Update status to confirmed if they were invited
      if (existing.status === "invited") {
        await prisma.gamePlayers.update({
          where: { id: existing.id },
          data: { status: "confirmed" },
        });
      }
      return NextResponse.json({ roundId: round.id });
    }

    // Check if invited by email
    const emailInvite = user.email
      ? round.players.find(
          (p) => p.email === user.email && !p.user_id
        )
      : null;

    if (emailInvite) {
      // Link the account and confirm
      await prisma.gamePlayers.update({
        where: { id: emailInvite.id },
        data: { user_id: user.id, status: "confirmed" },
      });
      return NextResponse.json({ roundId: round.id });
    }

    // Create new player record
    await prisma.gamePlayers.create({
      data: {
        round_id: round.id,
        user_id: user.id,
        name:
          user.email?.split("@")[0] ||
          "Player",
        status: "confirmed",
        role: "PLAYER",
      },
    });

    return NextResponse.json({ roundId: round.id });
  } catch {
    return NextResponse.json(
      { error: "Unable to join round" },
      { status: 500 }
    );
  }
}
