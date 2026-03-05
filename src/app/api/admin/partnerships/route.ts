import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "25");
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";
  const sortBy = url.searchParams.get("sortBy") || "destination";
  const sortDir = (url.searchParams.get("sortDir") || "asc") as "asc" | "desc";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { course_name: { contains: search, mode: "insensitive" } },
      { destination: { contains: search, mode: "insensitive" } },
    ];
  }

  switch (filter) {
    case "no_contact":
      where.marketing_contact_email = null;
      where.booking_email = null;
      break;
    case "has_email":
      where.OR = [
        { marketing_contact_email: { not: null } },
        { booking_email: { not: null } },
      ];
      break;
    case "needs_review":
      where.needs_review = true;
      break;
    case "contacted":
      where.outreach_status = "contacted";
      break;
    case "replied":
      where.outreach_status = "replied";
      break;
  }

  const orderBy: Record<string, string> = {};
  if (sortBy === "destination") orderBy.destination = sortDir;
  else if (sortBy === "tier") orderBy.tier = sortDir;
  else if (sortBy === "status") orderBy.outreach_status = sortDir;
  else if (sortBy === "updated") orderBy.updated_at = sortDir;
  else orderBy.destination = sortDir;

  try {
    const [partnerships, total] = await Promise.all([
      prisma.marketingPartnerships.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.marketingPartnerships.count({ where }),
    ]);

    // Get stats
    const [totalCourses, hasEmail, contacted, replied, active] = await Promise.all([
      prisma.marketingPartnerships.count(),
      prisma.marketingPartnerships.count({
        where: {
          OR: [
            { marketing_contact_email: { not: null } },
            { booking_email: { not: null } },
          ],
        },
      }),
      prisma.marketingPartnerships.count({ where: { outreach_status: "contacted" } }),
      prisma.marketingPartnerships.count({ where: { outreach_status: "replied" } }),
      prisma.marketingPartnerships.count({ where: { outreach_status: "active" } }),
    ]);

    return NextResponse.json({
      partnerships,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: { totalCourses, hasEmail, contacted, replied, active },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch partnerships" },
      { status: 500 }
    );
  }
}
