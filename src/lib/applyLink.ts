/**
 * W5.5 — where the "Apply" cell and the detail-page button point.
 *
 * One function decides, so the table and the detail page cannot disagree (the
 * same principle as src/lib/indexable.ts driving both the robots meta and the
 * sitemap).
 *
 * Decision order:
 *   1. closed  - applications have ended. Show a "Closed" label, never a link.
 *   2. details - the official URL is missing or the link checker flagged it
 *                dead, so we cannot send anyone to it. Go to our own page.
 *   3. website - the official URL resolves but is only the commission's
 *                HOMEPAGE. Linking "Apply" to a homepage is misleading: there is
 *                no application form there. Label it "Official Website".
 *   4. apply   - a real, unflagged, non-homepage official URL. This is the only
 *                case that earns an "Apply" button.
 *
 * Everything outbound is noopener/noreferrer/nofollow at the call site: no
 * user or ranking signal should be attributed to us for someone else's form.
 */

export type ApplyLinkKind = "apply" | "website" | "details" | "closed";

export type ApplyLink = {
  kind: ApplyLinkKind;
  /** `/jobs/<slug>` for details/closed, the official URL for apply/website. */
  href: string;
  /** True when href leaves the site (drives target/rel, and nofollow). */
  external: boolean;
};

/** Shapes the classifier needs; keeps it usable from any caller's row type. */
export type ApplyLinkJob = {
  slug: string;
  official_link?: string | null;
  link_flagged?: boolean | null;
  status?: string | null;
  application_end?: string | null;
};

/**
 * A URL that lands on a site root rather than a specific page. Covers `""`,
 * `"/"`, and the usual default-document names a commission portal serves at the
 * root (`index.php`, `index.html`, …). A query string on a root path still
 * counts as a homepage: `p=1` is not an application form.
 */
export function isHomepageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
  if (path === "") return true;
  return /^\/(index|default|home)\.(php|html?|aspx?|jsp)$/.test(path);
}

function isClosed(job: ApplyLinkJob, now: number): boolean {
  if (job.status === "closed") return true;
  if (!job.application_end) return false;
  const end = new Date(job.application_end).getTime();
  if (!Number.isFinite(end)) return false;
  // Compare against end-of-day: a job closing "today" is still open today.
  return end + 24 * 60 * 60 * 1000 < now;
}

export function classifyApplyLink(
  job: ApplyLinkJob,
  now: number = Date.now(),
): ApplyLink {
  const details: ApplyLink = {
    kind: "details",
    href: `/jobs/${job.slug}`,
    external: false,
  };

  if (isClosed(job, now)) {
    return { kind: "closed", href: `/jobs/${job.slug}`, external: false };
  }

  const url = (job.official_link ?? "").trim();
  if (!url || job.link_flagged) return details;

  if (isHomepageUrl(url)) {
    return { kind: "website", href: url, external: true };
  }

  return { kind: "apply", href: url, external: true };
}
