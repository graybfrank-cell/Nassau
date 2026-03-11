import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, unauthorized } from "@/lib/auth";

// POST /api/admin/migrate
// Adds missing columns to the database that were added to the Prisma schema
// but not yet pushed via `prisma db push`.
// Safe to run multiple times — uses IF NOT EXISTS.
export async function POST() {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    // Add new columns to trips table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS vibe TEXT;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget_tier TEXT;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size_target INTEGER;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // Add new columns to trip_members table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
      ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS rsvp_at TIMESTAMPTZ;
    `);

    // Add course_layout column to game_rounds table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS course_layout TEXT;
    `);

    // Add new columns to scorecards table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS course_api_id INTEGER;
      ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS tee_name TEXT DEFAULT '';
      ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS yardages JSONB DEFAULT '[]';
      ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS handicaps JSONB DEFAULT '[]';
    `);

    return NextResponse.json({ ok: true, message: "Migration complete" });
  } catch (err) {
    console.error("Migration error:", err);
    const message =
      err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
