/**
 * W5.5 + 2026-10 audit — where the "Apply" cell and the detail-page button point.
 *
 * One function decides, so the table and the detail page cannot disagree (the
 * same principle as src/lib/indexable.ts driving both the robots meta and the
 * sitemap).
 *
 * Decision order:
 *   1. closed   - applications have ended. Show a "Closed" label, never a link.
 *   2. apply    - ONLY when a human/automated check marked the dedicated
 *                 `official_apply_url` verified, the link is not flagged, and it
 *                 is a real page (not a homepage or a PDF). This is the only case
 *                 that earns the word "Apply".
 *   3. website  - no verified apply destination, but we know the official site.
 *                 Label it "Official Website"; never imply it is an application.
 *   4. details  - nothing safe to send the visitor to. Go to our own page.
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
  official_apply_url?: string | null;
  official_site_url?: string | null;
  official_link?: string | null;
  apply_link_verified?: boolean | null;
  link_flagged?: boolean | null;
  status?: string | null;
  application_end?: string | null;
};

function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** `https://host/path` -> `https://host` (empty on invalid/non-http input). */
function siteRoot(url: string | null | undefined): string {
  if (!url || !isHttpUrl(url)) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

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

  const applyUrl = (job.official_apply_url ?? "").trim();
  if (
    job.apply_link_verified === true &&
    applyUrl.length > 0 &&
    isHttpUrl(applyUrl) &&
    !job.link_flagged &&
    !isHomepageUrl(applyUrl) &&
    !isPdfUrl(applyUrl)
  ) {
    return { kind: "apply", href: applyUrl, external: true };
  }

  // Fallback is a website, never an unverified application form. Prefer the
  // dedicated site URL; otherwise use the origin of a not-flagged apply/link.
  const explicitSite = (job.official_site_url ?? "").trim();
  const fallbackSource = (job.official_apply_url ?? job.official_link ?? "").trim();
  const website =
    explicitSite ||
    (!job.link_flagged ? siteRoot(fallbackSource) : "");

  if (website) {
    return { kind: "website", href: website, external: true };
  }

  return details;
}
