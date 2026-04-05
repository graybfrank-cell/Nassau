-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'landing';
