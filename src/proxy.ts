import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Refreshes the Supabase auth session cookie.
 *
 * DELIBERATELY NARROW MATCHER: this site is overwhelmingly anonymous,
 * SEO-driven traffic. Running an auth round-trip on every job page would add
 * latency and force dynamic rendering; this only covers routes where a session
 * actually matters. Public content pages never hit the proxy.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching auth here is what actually refreshes an expiring token.
  await supabase.auth.getUser();

  // Block non-admins from /admin routes.
  if (pathname.startsWith("/admin")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/login", "/signup", "/auth/:path*"],
};
