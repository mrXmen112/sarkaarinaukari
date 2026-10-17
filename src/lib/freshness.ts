/**
 * W5.1 — UPDATED / NEW freshness badges.
 *
 * The rule, verbatim:
 *
 *   UPDATED  only within 48h of `content_changed_at`
 *   NEW      only within 48h of `published_at`
 *
 * These two columns exist precisely so this file never has to touch
 * `updated_at`. `updated_at` is clobbered by the link checker and by every bulk
 * migration (measured: 85 of 124 jobs share one identical `updated_at` second),
 * so a badge drawn from it said "Updated" on the whole catalogue at once. If you
 * are ever tempted to "fall back to updated_at when content_changed_at is null",
 * don't — that reintroduces the bug this column was added to fix. A missing
 * signal means no badge, not a wrong badge.
 */

const HOURS_48 = 48 * 60 * 60 * 1000;

export type Freshness = "new" | "updated" | null;

type FreshnessInput = {
  published_at?: string | null;
  content_changed_at?: string | null;
};

function ageMs(timestamp: string | null | undefined, now: number): number | null {
  if (!timestamp) return null;
  const t = new Date(timestamp).getTime();
  if (!Number.isFinite(t)) return null;
  const age = now - t;
  // A future timestamp means a clock skew or bad data. Treat it as "just now"
  // rather than as a negative age that silently fails the `<=` comparison.
  return age < 0 ? 0 : age;
}

/**
 * `now` is injectable so the badge can be unit-tested without freezing the
 * system clock.
 *
 * Precedence: an edit is more recent news than a first publish, so UPDATED wins
 * when both fall inside their window (only possible if the row was edited within
 * 48h of being created).
 */
export function freshnessOf(job: FreshnessInput, now: number = Date.now()): Freshness {
  const changedAge = ageMs(job.content_changed_at, now);
  if (changedAge !== null && changedAge <= HOURS_48) return "updated";

  const publishedAge = ageMs(job.published_at, now);
  if (publishedAge !== null && publishedAge <= HOURS_48) return "new";

  return null;
}
