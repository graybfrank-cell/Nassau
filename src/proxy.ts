import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, let the request through
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the auth token on every request
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If / has auth query params, forward to /auth/callback so the
    // existing handler can exchange them for a session. This catches
    // cases where Supabase ignores emailRedirectTo and sends users
    // back to the Site URL with ?code= or ?token_hash= attached.
    if (request.nextUrl.pathname === "/") {
      const code = request.nextUrl.searchParams.get("code");
      const tokenHash = request.nextUrl.searchParams.get("token_hash");
      if (code || tokenHash) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/callback";
        return NextResponse.redirect(url);
      }
    }

    // Search engine crawlers bypass all gates so they see real content
    const ua = request.headers.get("user-agent") || "";
    if (/googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp/i.test(ua)) {
      return supabaseResponse;
    }

    // Demo routes bypass auth entirely
    if (request.nextUrl.pathname.startsWith("/demo")) {
      return supabaseResponse;
    }

    // Protected routes — redirect to /login if not authenticated
    const isProtected =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/trips") ||
      request.nextUrl.pathname.startsWith("/scorecards");

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Private beta gate: only allowlisted emails can access authenticated app
    const allowedEmailsEnv = process.env.PRIVATE_BETA_ALLOWED_EMAILS;

    if (allowedEmailsEnv && allowedEmailsEnv.trim().length > 0) {
      const allowedEmails = allowedEmailsEnv
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);

      // Public paths that bypass the gate entirely
      const publicPaths = [
        "/",                   // landing page
        "/pricing",
        "/explore",
        "/founding",
        "/partnerships",
        "/private-beta",       // the gated message page itself
      ];
      const publicPathPrefixes = [
        "/blog",               // /blog and /blog/[slug]
        "/trip/",              // /trip/[shareCode] previews (read-only)
        "/api/partnerships/",  // partnerships contact form
        "/api/waitlist",       // legacy waitlist endpoint, harmless
        "/api/auth/",          // Supabase auth callbacks
        "/_next/",             // Next.js internals
        "/auth/",              // Supabase auth pages
      ];

      const path = request.nextUrl.pathname;

      const isPublic =
        publicPaths.includes(path) ||
        publicPathPrefixes.some((p) => path.startsWith(p)) ||
        path.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|css|js|map)$/);

      if (!isPublic) {
        if (user) {
          const userEmail = (user.email || "").toLowerCase();
          if (!allowedEmails.includes(userEmail)) {
            const url = request.nextUrl.clone();
            url.pathname = "/private-beta";
            url.search = "";
            return NextResponse.redirect(url);
          }
        }
      }
    }

    // If authenticated user visits / or /login, redirect to /dashboard
    if (
      (request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/") &&
      user
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
