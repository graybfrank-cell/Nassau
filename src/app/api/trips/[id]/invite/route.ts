import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getTripMembership, unauthorized, forbidden } from "@/lib/auth";
import crypto from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const membership = await getTripMembership(id, user.id);
  if (!membership) return forbidden();

  const inviteCode = crypto.randomBytes(6).toString("base64url");

  const updated = await prisma.trip.update({
    where: { id },
    data: { inviteCode },
  });

  return NextResponse.json({ inviteCode: updated.inviteCode });
}
