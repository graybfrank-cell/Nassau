import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Auto-complete rounds past their tee time.
 * Runs every 15 minutes via Vercel Cron (GET) or manually (POST).
 *
 * Logic: Find all GameRounds where status != 'completed' AND tee_time + 4h < now.
 * The 4-hour buffer accounts for a full round of golf before auto-completing.
 */

export async function GET(req: NextRequest) {
  return handleCompleteRounds(req);
}

export async function POST(req: NextRequest) {
  return handleCompleteRounds(req);
}

async function handleCompleteRounds(req: NextRequest) {
  // Verify Vercel cron secret (supports both header patterns)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const vercelHeader = req.headers.get("x-vercel-cron-secret");
    if (authHeader !== `Bearer ${cronSecret}` && vercelHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // 4-hour buffer after tee time before auto-completing
    const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const staleRounds = await prisma.gameRounds.findMany({
      where: {
        status: { in: ["upcoming", "active", "in_progress"] },
        tee_time: { lt: cutoff },
      },
      select: { id: true, course_name: true, tee_time: true, status: true },
    });

    if (staleRounds.length === 0) {
      return NextResponse.json({ completed: 0, roundIds: [] });
    }

    const ids = staleRounds.map(
      (r: { id: string; course_name: string; tee_time: Date; status: string }) => r.id
    );

    await prisma.gameRounds.updateMany({
      where: { id: { in: ids } },
      data: { status: "completed" },
    });

    // Also mark associated skins games and nassau bets as completed
    await Promise.all([
      prisma.gameSkinsGames.updateMany({
        where: { round_id: { in: ids }, status: "active" },
        data: { status: "completed" },
      }),
      prisma.gameNassauBets.updateMany({
        where: { round_id: { in: ids }, status: "active" },
        data: { status: "completed" },
      }),
    ]);

    console.log(
      `[complete-rounds] Auto-completed ${ids.length} round(s):`,
      staleRounds.map(
        (r: { id: string; course_name: string }) => `${r.course_name} (${r.id})`
      )
    );

    return NextResponse.json({ completed: ids.length, roundIds: ids });
  } catch (err) {
    console.error("[complete-rounds] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to complete rounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
