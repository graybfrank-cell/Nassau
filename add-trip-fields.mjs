/**
 * Run this script to add the new columns to the database.
 * Usage: node add-trip-fields.mjs
 *
 * This is needed because `npx prisma db push` requires direct DB access
 * which may not be available from all environments.
 *
 * You can run this from any environment that can reach the Supabase DB,
 * or paste these ALTER TABLE statements into the Supabase SQL editor.
 */

const SQL = `
-- Add new columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vibe TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS budget_tier TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_size_target INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add new columns to trip_members table
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE trip_members ADD COLUMN IF NOT EXISTS rsvp_at TIMESTAMPTZ;
`;

console.log("=== Run these SQL statements in the Supabase SQL Editor ===");
console.log("=== (Dashboard → SQL Editor → New query) ===\n");
console.log(SQL);

// If you want to run programmatically, uncomment below and set DATABASE_URL:
// import pg from "pg";
// const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
// await pool.query(SQL);
// console.log("Done!");
// await pool.end();
