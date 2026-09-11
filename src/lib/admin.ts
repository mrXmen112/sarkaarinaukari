import { redirect } from "next/navigation";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * Admin gate for /admin pages.
 *
 * Requires a signed-in session whose user is listed in public.admin_users
 * (checked via the security-definer public.is_admin() function). Non-admins
 * are redirected to /login; logged-in non-admins are bounced to the home page.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  return { supabase, user };
}

/**
 * Env-var bootstrap: when a signed-in user's email matches ADMIN_EMAIL,
 * upsert them into public.admin_users via the service-role client (RLS
 * bypass). Idempotent — safe to call on every sign-in.
 */
export async function bootstrapAdminOrThrow(userId: string, email: string) {
  if (env.adminEmail && email.trim().toLowerCase() === env.adminEmail) {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("admin_users")
      .upsert({ user_id: userId }, { onConflict: "user_id" });
    if (error) throw error;
  }
}