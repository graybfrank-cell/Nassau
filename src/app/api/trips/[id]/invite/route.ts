import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate a short, URL-safe invite code
  const inviteCode = crypto.randomBytes(6).toString("base64url");

  const updated = await prisma.trip.update({
    where: { id },
    data: { inviteCode },
  });

  return NextResponse.json({ inviteCode: updated.inviteCode });
}
