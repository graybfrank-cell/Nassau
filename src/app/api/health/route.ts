export async function GET() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "ANTHROPIC_API_KEY",
    "RESEND_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOLF_COURSE_API_KEY",
    "CRON_SECRET",
  ];

  const optional = [
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_PREMIUM_PRICE_ID",
    "GOOGLE_PLACES_API_KEY",
    "UNSPLASH_ACCESS_KEY",
  ];

  const missing = required.filter((k) => !process.env[k]);
  const missingOptional = optional.filter((k) => !process.env[k]);

  return Response.json({
    status: missing.length === 0 ? "healthy" : "unhealthy",
    app: "nassau",
    missing_required: missing,
    missing_optional: missingOptional,
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = "force-dynamic";
