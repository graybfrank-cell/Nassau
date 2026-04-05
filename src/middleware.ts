import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/",
  "/api",
  "/_next",
  "/static",
  "/admin",
  "/auth",
  "/privacy",
  "/terms",
  "/blog",
  "/explore",
  "/pricing",
  "/founding",
  "/trip/preview",
  "/favicon.ico",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Only gate /login and /signup for unauthenticated users
  if (pathname === "/login" || pathname === "/signup") {
    // Check if user is authenticated
    const res = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Authenticated users pass through to login/signup normally
    if (user) {
      return res;
    }

    // Unauthenticated users get redirected to landing page waitlist
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.hash = "waitlist";
    return NextResponse.redirect(url);
  }

  // All other routes pass through (authenticated app routes have their own auth checks)
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup"],
};
