import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scorecard = await prisma.scorecard.findUnique({ where: { id } });
  if (!scorecard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(scorecard);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const scorecard = await prisma.scorecard.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(scorecard);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.scorecard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
