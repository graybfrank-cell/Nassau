import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Configure pg.Pool for Supabase pgBouncer + Vercel serverless:
// - max:1 prevents exhausting pgBouncer slots across many serverless instances
// - SSL required by Supabase
// - Short idle timeout so connections are released quickly
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: false },
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
