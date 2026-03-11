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

  const settlement = await prisma.settlements.findUnique({
    where: { id },
  });

  if (!settlement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { status } = body as { status: string };

  if (status !== "paid" && status !== "confirmed") {
    return NextResponse.json(
      { error: "Status must be 'paid' or 'confirmed'" },
      { status: 400 }
    );
  }

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
