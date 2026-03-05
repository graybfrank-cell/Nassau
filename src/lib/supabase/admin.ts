import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-side operations
 * that don't have a user session (e.g. cron jobs).
 * Bypasses RLS — use only in trusted server contexts.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Accept either env var name
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    console.error("[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL");
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!serviceRoleKey) {
    console.error(
      "[supabase-admin] Missing SUPABASE_SERVICE_ROLE_KEY — falling back to anon key"
    );
    // Fall back to anon key so queries still work (subject to RLS)
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error(
        "Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    return createSupabaseClient(supabaseUrl, anonKey);
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}
