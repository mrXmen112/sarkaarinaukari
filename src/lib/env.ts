/**
 * Environment variable access with fail-fast validation.
 *
 * Kept in one place so a missing key produces a clear error at the call site
 * rather than an opaque Supabase 401 at runtime.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[env] Missing ${name}. Copy .env.local.example to .env.local and fill in your Supabase credentials.`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get supabaseServiceRoleKey(): string {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  /**
   * Optional email of the site owner. On sign-in this account is
   * auto-granted admin in public.admin_users (see adminBootstrap in
   * the auth actions). Leave unset to prevent any auto-grant.
   */
  get adminEmail(): string | undefined {
    return process.env.ADMIN_EMAIL?.trim().toLowerCase() || undefined;
  },
};

/**
 * True when Supabase credentials are present.
 *
 * Phase 1 ships before the Supabase project is provisioned, so pages check
 * this and render an empty state instead of crashing the build.
 */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
