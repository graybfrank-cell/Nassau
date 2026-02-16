import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trip = await prisma.trip.findUnique({
    where: { inviteCode: code },
  });

  if (!trip) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  // Check if user is already a member (by email or name match)
  const members = (trip.members as { id: string; name: string; handicap: number }[]) || [];
  const alreadyMember = members.some(
    (m) => m.id === user.id || m.name === user.email
  );

  if (alreadyMember) {
    return NextResponse.json({ tripId: trip.id, alreadyMember: true });
  }

  // Add the user as a new member
  const newMember = {
    id: user.id,
    name: user.email?.split("@")[0] || "Guest",
    handicap: 0,
  };

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      members: [...members, newMember],
    },
  });

  return NextResponse.json({ tripId: trip.id, alreadyMember: false });
}
