import { prisma } from "./prisma";

/**
 * Self-healing migration: adds any missing columns to the database.
 *
 * Prisma 7 generates SELECT statements with explicit column names from the
 * schema. If columns were added to the Prisma schema but `prisma db push`
 * hasn't been run against the live database, all queries fail. This function
 * runs ALTER TABLE ... ADD COLUMN IF NOT EXISTS for each new column, which is
 * safe to call repeatedly and fixes the mismatch on the first request.
 *
 * Cached per server instance — runs at most once.
 */
let migrated = false;

export async function ensureDbColumns(): Promise<void> {
  if (migrated) return;

  const statements = [
    // trips table — new wizard fields
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_code TEXT",
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS vibe TEXT",
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget_tier TEXT",
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size_target INTEGER",
    "ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT",

    // trip_members table — invite/RSVP fields
    "ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ",
    "ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS rsvp_at TIMESTAMPTZ",

    // itinerary_items table — booking status + contact fields
    "ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT ''",
    "ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''",
    "ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS website TEXT DEFAULT ''",
    "ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS email TEXT DEFAULT ''",

    // scorecards table — golf course API fields
    "ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS course_api_id INTEGER",
    "ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS tee_name TEXT DEFAULT ''",
    "ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS yardages JSONB DEFAULT '[]'",
    "ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS handicaps JSONB DEFAULT '[]'",

    // Round Hub — link rounds, skins, scorecards to itinerary tee times
    "ALTER TABLE rounds ADD COLUMN IF NOT EXISTS itinerary_item_id TEXT",
    "ALTER TABLE skins_games ADD COLUMN IF NOT EXISTS itinerary_item_id TEXT",
    "ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS itinerary_item_id TEXT",
  ];

  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }

  // Add unique index for share_code (safe if it already exists)
  try {
    await prisma.$executeRawUnsafe(
      "CREATE UNIQUE INDEX IF NOT EXISTS trips_share_code_key ON trips (share_code)"
    );
  } catch {
    // Ignore — constraint may already exist
  }

  migrated = true;
}
