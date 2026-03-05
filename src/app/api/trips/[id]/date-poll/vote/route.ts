import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";

// POST /api/trips/[id]/date-poll/vote
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id: tripId } = await params;
  const membership = await getTripMembership(tripId, user.id);
  if (!membership) return forbidden();

  const poll = await prisma.datePolls.findFirst({
    where: { trip_id: tripId, status: "active" },
    orderBy: { created_at: "desc" },
  });

  if (!poll) {
    return NextResponse.json({ error: "No active poll found" }, { status: 404 });
  }

  // Check deadline
  if (new Date() > new Date(poll.deadline)) {
    return NextResponse.json({ error: "Voting has closed" }, { status: 400 });
  }

  const body = await req.json();
  const votes: { option_id: string; vote: string }[] = body.votes;

  if (!votes || !Array.isArray(votes)) {
    return NextResponse.json({ error: "votes array required" }, { status: 400 });
  }

  // Validate vote values
  const validVotes = ["yes", "maybe", "no"];
  for (const v of votes) {
    if (!validVotes.includes(v.vote)) {
      return NextResponse.json({ error: `Invalid vote value: ${v.vote}` }, { status: 400 });
    }
  }

  // Upsert each vote
  const results = [];
  for (const v of votes) {
    const result = await prisma.datePollVotes.upsert({
      where: {
        poll_id_option_id_user_id: {
          poll_id: poll.id,
          option_id: v.option_id,
          user_id: user.id,
        },
      },
      update: {
        vote: v.vote,
        voted_at: new Date(),
      },
      create: {
        poll_id: poll.id,
        option_id: v.option_id,
        user_id: user.id,
        vote: v.vote,
      },
    });
    results.push(result);
  }

  return NextResponse.json({ votes: results });
}
