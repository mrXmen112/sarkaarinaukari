import { createAdminClient } from "@/lib/supabase/server";
import { isHomepageUrl } from "@/lib/applyLink";

/**
 * HTTP link validation for published jobs (Phase 1).
 *
 * Checks each job's official apply URL and notification PDF URL. HEAD first,
 * GET with a 1-byte Range fallback (many gov servers reject HEAD with 405).
 * Results are stored on the job row so the public site can show a "verify"
 * badge and the admin report can list failures. Nothing here ever hides a
 * page — a dead link only flags the Apply button.
 */

const TIMEOUT_MS = 8000;
const RETRIES = 2;
const USER_AGENT_VALUE =
  "SarkaariNaukriBot/1.0 (+https://www.sarkaarinaukri.online/contact; link-check for public job listings)";

/**
 * Statuses that mean "can't prove dead": UPSC and friends block bots with 403
 * while the page is fine for humans. These are stored but never flag a job.
 */
const BLOCKED_STATUSES = new Set([403, 405, 429, 501, 505]);

/** HTTP statuses that prove the link is dead. */
const DEAD_STATUSES = new Set([404, 410]);

/**
 * Authoritative DNS check via DNS-over-HTTPS. Returns true only on NXDOMAIN
 * (the domain does not exist anywhere) — that, with HTTP 404/410, is the only
 * thing allowed to flag a job. Timeouts and other network errors are stored
 * but never hide the Apply button.
 */
async function domainIsNxdomain(url: string): Promise<boolean> {
  try {
    const host = new URL(url).hostname;
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
      { headers: { "User-Agent": USER_AGENT_VALUE } },
    );
    if (!res.ok) return false;
    const body = (await res.json()) as { Status?: number };
    return body.Status === 3;
  } catch {
    return false;
  }
}

export type UrlCheckResult = {
  url: string;
  ok: boolean;
  status: number | null;
  reason: string;
  contentType: string | null;
};

/**
 * Validate one URL under the same rules the sweep uses, but in a single call.
 *
 * Only a provable death (HTTP 404/410, or an NXDOMAIN domain) returns ok:false.
 * A timeout, bot-block (403) or TLS error is stored but treated as passable —
 * the same "never flag on an unprovable failure" rule as runLinkCheck, so a
 * gov server blocking our bot can't stop a legitimate publish.
 */
export async function validateOfficialUrl(url: string): Promise<UrlCheckResult> {
  const result = await checkOneUrl(url);
  if (result.ok) return result;
  if (DEAD_STATUSES.has(result.status ?? 0)) return result;
  if (await domainIsNxdomain(url)) {
    return {
      url,
      ok: false,
      status: null,
      reason: "domain does not resolve",
      contentType: null,
    };
  }
  return { ...result, ok: true, reason: `unverified (${result.reason})` };
}

async function checkOneUrl(url: string): Promise<UrlCheckResult> {
  let lastResult: UrlCheckResult = {
    url,
    ok: false,
    status: null,
    reason: "unchecked",
    contentType: null,
  };
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT_VALUE },
      });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: { "User-Agent": USER_AGENT_VALUE, Range: "bytes=0-0" },
        });
      }
      const blocked = BLOCKED_STATUSES.has(res.status);
      return {
        url,
        // Blocked is treated as OK (unprovable) — never flag on a 403.
        ok: res.status < 400 || blocked,
        status: res.status,
        reason: res.status < 400 ? "ok" : blocked ? `blocked (HTTP ${res.status})` : `HTTP ${res.status}`,
        contentType: res.headers.get("content-type"),
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      lastResult = {
        url,
        ok: false,
        status: null,
        reason: aborted ? `timeout after ${TIMEOUT_MS}ms` : "network error",
        contentType: null,
      };
      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return lastResult;
}

export type LinkCheckReport = {
  processed: number;
  checked: number;
  verifiedApply: number;
  flagged: {
    slug: string;
    title: string;
    url: string;
    status: number | null;
    reason: string;
  }[];
};

/** A PDF is a notification, not an application page. */
function isPdfDestination(url: string, contentType: string | null): boolean {
  if (contentType?.toLowerCase().includes("application/pdf")) return true;
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

/**
 * Validate links for the published jobs whose check is oldest (nulls first).
 * Bounded batch so one cron invocation always finishes inside the function
 * duration limit; repeated invocations sweep the whole table over time.
 *
 * `verifyApply` (default on) marks `apply_link_verified` only when the apply
 * URL resolves 2xx/3xx and is a real HTML page - never a PDF, a homepage, a
 * bot-block (403) or an unprovable timeout. A provable death (404/410/NXDOMAIN)
 * clears it.
 */
export async function runLinkCheck({
  limit = 25,
  onlyFlagged = false,
  verifyApply = true,
}: {
  limit?: number;
  onlyFlagged?: boolean;
  verifyApply?: boolean;
} = {}): Promise<LinkCheckReport> {
  const supabase = createAdminClient();

  let query = supabase
    .from("jobs")
    .select(
      "id, slug, title, official_link, notification_pdf_link, official_apply_url, official_notification_url, apply_link_verified, last_verified_at",
    )
    .eq("is_published", true);
  if (onlyFlagged) query = query.eq("link_flagged", true);
  const { data: jobs } = await query
    .order("link_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  const rows = (jobs ?? []) as {
    id: string;
    slug: string;
    title: string;
    official_link: string;
    notification_pdf_link: string | null;
    official_apply_url: string | null;
    official_notification_url: string | null;
    apply_link_verified: boolean;
    last_verified_at: string | null;
  }[];

  const report: LinkCheckReport = {
    processed: 0,
    checked: 0,
    verifiedApply: 0,
    flagged: [],
  };

  for (const job of rows) {
    report.processed += 1;

    const applyUrl = job.official_apply_url?.trim() || job.official_link;
    const notificationUrl =
      job.official_notification_url?.trim() || job.notification_pdf_link;

    const links: { url: string; kind: "apply" | "notification" }[] = [];
    if (applyUrl?.trim()) links.push({ url: applyUrl, kind: "apply" });
    if (notificationUrl?.trim() && notificationUrl !== applyUrl) {
      links.push({ url: notificationUrl, kind: "notification" });
    }

    let worst: UrlCheckResult | null = null;
    let provablyDead: string | null = null;
    let applyResult: UrlCheckResult | null = null;
    let applyDead = false;

    for (const link of links) {
      const result = await checkOneUrl(link.url);
      report.checked += 1;
      if (link.kind === "apply") applyResult = result;

      if (result.ok) continue;
      if (DEAD_STATUSES.has(result.status ?? 0)) {
        worst = result;
        provablyDead = link.url;
        if (link.kind === "apply") applyDead = true;
        continue;
      }
      if (!(await domainIsNxdomain(link.url))) {
        // Unprovable (timeout, block, TLS error) — store, never flag.
        if (!worst) worst = result;
        continue;
      }
      const deadResult: UrlCheckResult = {
        url: link.url,
        ok: false,
        status: null,
        reason: "domain does not resolve",
        contentType: null,
      };
      worst = deadResult;
      provablyDead = link.url;
      if (link.kind === "apply") {
        applyResult = deadResult;
        applyDead = true;
      }
    }

    const now = new Date().toISOString();
    const applyUsable =
      applyResult !== null &&
      applyResult.status !== null &&
      applyResult.status >= 200 &&
      applyResult.status < 400 &&
      !isPdfDestination(applyUrl, applyResult.contentType) &&
      !isHomepageUrl(applyUrl);

    const update: {
      link_last_checked_at: string;
      link_http_status: number;
      link_flagged: boolean;
      apply_link_verified?: boolean;
      last_verified_at?: string;
    } = {
      link_last_checked_at: now,
      link_http_status: worst ? (worst.status ?? 0) : 200,
      link_flagged: provablyDead !== null,
    };

    if (verifyApply && applyResult) {
      if (applyUsable) {
        update.apply_link_verified = true;
        update.last_verified_at = now;
        report.verifiedApply += 1;
      } else if (applyDead) {
        // A provable death is the only automatic downgrade. Blocks/timeouts
        // keep whatever a human previously established.
        update.apply_link_verified = false;
      }
    }

    const { error } = await supabase
      .from("jobs")
      .update(update)
      .eq("id", job.id);

    if (error) {
      console.error("[linkcheck] update failed:", error.message);
      continue;
    }
    if (provablyDead && worst) {
      report.flagged.push({
        slug: job.slug,
        title: job.title,
        url: provablyDead,
        status: worst.status,
        reason: worst.reason,
      });
    }
  }

  return report;
}

export type FlaggedJob = {
  id: string;
  slug: string;
  title: string;
  official_link: string;
  notification_pdf_link: string | null;
  link_http_status: number | null;
  link_last_checked_at: string | null;
};

/** Published jobs whose apply/notification link failed its last check. */
export async function listFlaggedJobs(limit = 100): Promise<FlaggedJob[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, official_link, notification_pdf_link, link_http_status, link_last_checked_at",
    )
    .eq("is_published", true)
    .eq("link_flagged", true)
    .order("link_last_checked_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as FlaggedJob[];
}
