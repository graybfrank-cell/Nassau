import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const trip = await prisma.trips.findUnique({
      where: { invite_code: code },
      select: {
        id: true,
        name: true,
        destination: true,
        start_date: true,
        end_date: true,
        members: {
          select: {
            id: true,
            name: true,
            handicap: true,
            user_id: true,
            role: true,
            user: { select: { avatar_url: true, full_name: true } },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      members: trip.members.map(
        (m: {
          id: string;
          name: string;
          role: string;
          user_id: string | null;
          user: { avatar_url: string; full_name: string } | null;
        }) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          userId: m.user_id,
          avatarUrl: m.user?.avatar_url || null,
        })
      ),
    });
  } catch (err) {
    return apiError(err, "GET /api/invite/[code]");
  }
}
