import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Resolution for a job slug that has no live job row.
 *
 *   { kind: "redirect", to } -> serve a permanent redirect to `to`
 *   { kind: "gone" }         -> serve 410 Gone
 *   null                     -> no idea; let the real 404 happen
 *
 * Returning null is the common case and is NOT a failure. There is no
 * catch-all route on this site, so a null falls through to Next's real 404,
 * which is the correct answer for a junk URL. A junk probe must never resolve.
 */

export type SlugResolution =
  | { kind: "redirect"; to: string }
  | { kind: "gone" }
  | null;

/**
 * A trailing dedupe counter: "-3", "-17", "-0".
 *
 * Slugs legitimately end in a year ("ssc-gd-2026"), so this only matches a
 * number that comes AFTER such a year or after any other slug tail. It is
 * anchored to the end and requires the base to be non-empty, so plain slugs
 * are never mangled.
 */
const DEDUPE_SUFFIX = /-(\d{1,2})$/;

/** Strip a trailing dedupe counter: "ibps-po-17-5" -> "ibps-po-17". */
export function stripDedupeSuffix(slug: string): string | null {
  const m = DEDUPE_SUFFIX.exec(slug);
  if (!m) return null;
  const base = slug.slice(0, m.index);
  return base.length > 0 ? base : null;
}

/**
 * Look up one explicit row in public.slug_redirects.
 *
 * Reads through the anon static client: the public job page is statically
 * generated and must not become dynamic just to resolve a legacy slug. The
 * table has an anon SELECT policy (migration 0019) precisely so this works on
 * cached pages. Writes are service_role only.
 */
async function lookupExplicit(slug: string): Promise<SlugResolution> {
  const { data, error } = await createStaticClient()
    .from("slug_redirects")
    .select("to_slug, target_kind")
    .eq("from_slug", slug)
    .maybeSingle();

  // A missing table (migration not yet applied) must not break the 404 path.
  if (error) {
    console.error("[slugRedirects] lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  if (data.target_kind === "gone") return { kind: "gone" };
  if (typeof data.to_slug === "string" && data.to_slug.length > 0) {
    return { kind: "redirect", to: destination(data.target_kind, data.to_slug) };
  }
  return null;
}

/**
 * Build the redirect destination.
 *
 * `job` targets are bare slugs and become /jobs/<slug>. `path` targets are
 * already in-repo paths (e.g. /exams/rrb-alp) and are used verbatim, which is
 * how a withdrawn job can be pointed at the exam hub that still covers it.
 */
function destination(targetKind: string, target: string): string {
  if (target.startsWith("/")) return target;
  return targetKind === "path" ? `/${target}` : `/jobs/${target}`;
}

/** Is this base slug a live, published job we can safely redirect to? */
async function baseSlugIsLive(base: string): Promise<boolean> {
  const { data, error } = await createStaticClient()
    .from("jobs")
    .select("slug")
    .eq("slug", base)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[slugRedirects] base check failed:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Resolve a slug that produced no job row.
 *
 * Step 1 is an explicit mapping from public.slug_redirects.
 * Step 2 is the general rule that covers the whole "-N" family: strip the
 * dedupe counter and, if the base is a live published job, redirect there.
 * This is why we do not have to enumerate every variant of every slug.
 *
 * Step 2 deliberately does NOT require a database row for the suffixed slug —
 * that is the entire point, since the suffixed rows no longer exist anywhere.
 */
export async function resolveSlug(slug: string): Promise<SlugResolution> {
  if (!isSupabaseConfigured || !slug) return null;

  const explicit = await lookupExplicit(slug);
  if (explicit) return explicit;

  const base = stripDedupeSuffix(slug);
  if (!base) return null;

  if (await baseSlugIsLive(base)) {
    return { kind: "redirect", to: `/jobs/${base}` };
  }
  return null;
}