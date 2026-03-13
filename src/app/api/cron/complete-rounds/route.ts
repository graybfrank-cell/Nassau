import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    const staleRounds = await prisma.gameRounds.findMany({
      where: {
        status: { in: ["active", "in_progress"] },
        tee_time: { lt: cutoff },
      },
      select: { id: true },
    });

    if (staleRounds.length === 0) {
      return NextResponse.json({ completed: 0, roundIds: [] });
    }

    const ids = staleRounds.map((r: { id: string }) => r.id);

    await prisma.gameRounds.updateMany({
      where: { id: { in: ids } },
      data: { status: "completed" },
    });

    console.log(
      `[complete-rounds] Marked ${ids.length} round(s) as completed:`,
      ids
    );

    return NextResponse.json({ completed: ids.length, roundIds: ids });
  } catch (err) {
    console.error("[complete-rounds] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to complete rounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
