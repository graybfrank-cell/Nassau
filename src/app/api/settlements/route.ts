import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const status = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {
    OR: [{ payer_id: user.id }, { payee_id: user.id }],
  };

  if (status) {
    where.status = status;
  }

  const settlements = await prisma.settlements.findMany({
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

  return NextResponse.json(settlements);
}
