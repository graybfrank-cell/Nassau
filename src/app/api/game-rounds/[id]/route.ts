import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id },
    include: {
      players: { orderBy: { joined_at: "asc" } },
      scorecards: true,
      skins_game: true,
      nassau_bet: true,
      expenses: { orderBy: { created_at: "desc" } },
      settlements: { orderBy: { created_at: "asc" } },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPlayer = round.players.some((p) => p.user_id === user.id);
  if (!isPlayer) return forbidden();

  return NextResponse.json(round);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const round = await prisma.gameRounds.findUnique({
    where: { id },
    include: { players: true },
  });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  const body = await req.json();

  const updated = await prisma.gameRounds.update({
    where: { id },
    data: {
      ...(body.courseName !== undefined && { course_name: body.courseName }),
      ...(body.teeTime !== undefined && { tee_time: new Date(body.teeTime) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.startingHole !== undefined && { starting_hole: body.startingHole === 10 ? 10 : 1 }),
    },
    include: {
      players: { orderBy: { joined_at: "asc" } },
      scorecards: true,
      skins_game: true,
      nassau_bet: true,
      expenses: { orderBy: { created_at: "desc" } },
      settlements: { orderBy: { created_at: "asc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const round = await prisma.gameRounds.findUnique({ where: { id } });
  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (round.commissioner_id !== user.id) return forbidden();

  await prisma.gameRounds.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
