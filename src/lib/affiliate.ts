/**
 * W5.7 — Amazon Associates handling.
 *
 * The 12 recommended-book links seeded in 0007_seed_exams.sql each hard-code
 * `tag=sarkaarinaukari-21`. A tracking tag baked into seed data is bad for three
 * reasons: rotating it means editing the database, it leaks into any export or
 * dump, and — the one that actually matters — it silently applies affiliate
 * attribution even on a deployment that should not be monetised (a staging
 * build, or the site before the Associates account is approved).
 *
 * So the tag moves to the environment:
 *
 *   AMAZON_AFFILIATE_TAG=sarkaarinaukari-21   # set in Vercel to monetise
 *   (unset)                                   # no tag, and links are hidden
 *
 * This module is SERVER-ONLY. `AMAZON_AFFILIATE_TAG` is deliberately not
 * NEXT_PUBLIC: it is not a secret, but it has no business being shipped to the
 * client, and keeping it server-side means the disclosure and the links are
 * decided once at render.
 */

/** The tag to apply, or null when monetisation is off. */
export const AMAZON_AFFILIATE_TAG: string | null =
  (process.env.AMAZON_AFFILIATE_TAG ?? "").trim() || null;

/** True when we may show affiliate book links at all. */
export const AFFILIATE_ENABLED: boolean = AMAZON_AFFILIATE_TAG !== null;

/**
 * The Associates disclosure that must appear wherever an affiliate link is
 * shown (both Amazon's Operating Agreement and US FTC guidance require it, and
 * it is simply honest). Kept as a constant so every call site prints the same
 * wording.
 */
export const AFFILIATE_DISCLOSURE =
  "As an Amazon Associate we earn from qualifying purchases. Book links on this page are affiliate links and may earn us a small commission at no extra cost to you.";

/**
 * Rewrite an Amazon URL to carry OUR env tag, and only ours.
 *
 * Any `tag` already on the URL (the one baked into the seed data) is removed
 * first, so the database value can never assert attribution. Returns null when
 * monetisation is off, which is the signal to the caller to not render the link
 * at all.
 */
export function affiliateUrl(rawUrl: string | null | undefined): string | null {
  if (!AFFILIATE_ENABLED) return null;
  const url = (rawUrl ?? "").trim();
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Only touch Amazon hosts; never rewrite an arbitrary third-party link.
  if (!/(^|\.)amazon\.[a-z.]+$/i.test(parsed.hostname)) return null;

  parsed.searchParams.set("tag", AMAZON_AFFILIATE_TAG as string);
  return parsed.toString();
}
