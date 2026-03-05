import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json();

  try {
    const data = await prisma.marketingPartnerships.update({
      where: { id },
      data: {
        marketing_contact_name: body.marketing_contact_name ?? undefined,
        marketing_contact_email: body.marketing_contact_email ?? undefined,
        booking_email: body.booking_email ?? undefined,
        website_url: body.website_url ?? undefined,
        confidence: body.confidence ?? undefined,
        source_notes: body.source_notes ?? undefined,
        needs_review: body.needs_review ?? false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
