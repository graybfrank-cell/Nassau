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
