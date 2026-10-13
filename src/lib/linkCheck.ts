import { createAdminClient } from "@/lib/supabase/server";

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
};

async function checkOneUrl(url: string): Promise<UrlCheckResult> {
  let lastResult: UrlCheckResult = { url, ok: false, status: null, reason: "unchecked" };
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
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      lastResult = {
        url,
        ok: false,
        status: null,
        reason: aborted ? `timeout after ${TIMEOUT_MS}ms` : "network error",
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
  flagged: {
    slug: string;
    title: string;
    url: string;
    status: number | null;
    reason: string;
  }[];
};

/**
 * Validate links for the published jobs whose check is oldest (nulls first).
 * Bounded batch so one cron invocation always finishes inside the function
 * duration limit; repeated invocations sweep the whole table over time.
 */
export async function runLinkCheck({
  limit = 25,
  onlyFlagged = false,
}: {
  limit?: number;
  onlyFlagged?: boolean;
} = {}): Promise<LinkCheckReport> {
  const supabase = createAdminClient();

  let query = supabase
    .from("jobs")
    .select("id, slug, title, official_link, notification_pdf_link")
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
  }[];

  const report: LinkCheckReport = { processed: 0, checked: 0, flagged: [] };

  for (const job of rows) {
    report.processed += 1;
    const links = [job.official_link, job.notification_pdf_link].filter(
      (u): u is string => !!u && u.trim().length > 0,
    );

    let worst: UrlCheckResult | null = null;
    let provablyDead: string | null = null;
    for (const url of links) {
      const result = await checkOneUrl(url);
      report.checked += 1;
      if (result.ok) continue;
      if (DEAD_STATUSES.has(result.status ?? 0)) {
        worst = result;
        provablyDead = url;
        continue;
      }
      if (!(await domainIsNxdomain(url))) {
        // Unprovable (timeout, block, TLS error) — store, never flag.
        if (!worst) worst = result;
        continue;
      }
      worst = { url, ok: false, status: null, reason: "domain does not resolve" };
      provablyDead = url;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        link_last_checked_at: new Date().toISOString(),
        link_http_status: worst ? (worst.status ?? 0) : 200,
        link_flagged: provablyDead !== null,
      })
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
