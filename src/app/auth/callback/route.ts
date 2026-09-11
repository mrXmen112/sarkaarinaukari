import { NextResponse } from "next/server";

import { bootstrapAdminOrThrow } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback — exchanges the OAuth/email-verification code for a session
 * cookie, then redirects the user onward.
 *
 * Redirect target comes from the `next` query param (defaults to /profile).
 * Used by signUp's emailRedirectTo and any OAuth providers.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) await bootstrapAdminOrThrow(user.id, user.email);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}