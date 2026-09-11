import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cookie-aware Supabase client for Server Components, Route Handlers and
 * Server Actions.
 *
 * IMPORTANT: reading cookies opts the route into dynamic rendering. Use this
 * only where the signed-in user matters (/profile, /admin, auth callbacks).
 * For public content that should be statically generated + revalidated, use
 * `createStaticClient()` below instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // middleware.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Cookie-free anon client for public, cacheable content.
 *
 * Because it never touches `cookies()`, pages using it stay statically
 * generated and can be revalidated on an ISR schedule (Section 5). RLS still
 * applies — the anon role can only read published public content.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * SERVER ONLY — never import this into a Client Component. Used by the Phase 10
 * admin panel and by sitemap/cron jobs.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl,
    env.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
