#!/usr/bin/env node
/**
 * One-time link audit + cleanup for seeded job links (Phase 1).
 *
 * Checks every published job's official_link and notification_pdf_link with
 * the same classifier as the site (HEAD, GET+Range fallback, 2 tries).
 * Classification:
 *   - blocked (403/405/429/501/505) -> unverifiable, kept as-is
 *   - timeout -> unverifiable, kept as-is
 *   - HTTP 404/410 or DNS failure  -> dead
 *
 * --dry-run (default) prints the plan and writes last-report.json.
 * --apply additionally NULLs dead notification_pdf_link values (the seeded
 * data contains many invented PDF paths). Dead official_link can't be nulled
 * (column is NOT NULL) — those jobs are listed for manual fixing.
 *
 * Usage: node scripts/link-audit/run.mjs [--apply]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USER_AGENT =
  "SarkaariNaukriBot/1.0 (+https://www.sarkaarinaukri.online/contact; link-audit)";
const TIMEOUT_MS = 8000;
const RETRIES = 2;
const BLOCKED = new Set([403, 405, 429, 501, 505]);

function loadEnvLocal() {
  const out = {};
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(here, "..", "..");
    const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.trimStart().startsWith("#")) {
        out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
  } catch {
    // fall through to process.env
  }
  return out;
}

const env = loadEnvLocal();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

/** Authoritative DNS check via DNS-over-HTTPS: returns "nxdomain" | "ok" | "unknown". */
async function dnsVerdict(url) {
  try {
    const host = new URL(url).hostname;
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return "unknown";
    const body = await res.json();
    if (body.Status === 3) return "nxdomain"; // NXDOMAIN — domain does not exist
    if (body.Status === 0) return body.Answer?.some((a) => a.type === 1) ? "ok" : "ok";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function checkOne(url) {
  // 1) Authoritative DNS first — a non-existent domain is dead everywhere.
  const dns = await dnsVerdict(url);
  if (dns === "nxdomain") {
    return { verdict: "dead", status: null, reason: "domain does not resolve (DNS NXDOMAIN)" };
  }

  // 2) HTTP check.
  let last = { status: null, reason: "unchecked" };
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: { "User-Agent": USER_AGENT, Range: "bytes=0-0" },
        });
      }
      if (BLOCKED.has(res.status)) {
        return { verdict: "unverifiable", status: res.status, reason: `blocked HTTP ${res.status}` };
      }
      if (res.status < 400) return { verdict: "ok", status: res.status, reason: "ok" };
      return { verdict: "dead", status: res.status, reason: `HTTP ${res.status}` };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      last = { status: null, reason: aborted ? "timeout" : "network error" };
      if (attempt < RETRIES) await new Promise((r) => setTimeout(r, 1000));
    } finally {
      clearTimeout(timer);
    }
  }
  return { verdict: "unverifiable", ...last };
}

const base = SUPABASE_URL.replace(/\/$/, "");
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function fetchJobs() {
  const res = await fetch(
    `${base}/rest/v1/jobs?select=id,slug,title,official_link,notification_pdf_link&is_published=eq.true&order=created_at.desc`,
    { headers },
  );
  if (!res.ok) throw new Error(`fetch jobs failed: ${res.status}`);
  return res.json();
}

const APPLY = process.argv.includes("--apply");
const jobs = await fetchJobs();
console.log(`Auditing ${jobs.length} published jobs (${APPLY ? "APPLY" : "DRY RUN"})...`);

const urlCache = new Map();
async function checkCached(url) {
  if (!urlCache.has(url)) urlCache.set(url, await checkOne(url));
  return urlCache.get(url);
}

const report = {
  at: new Date().toISOString(),
  applied: APPLY,
  total: jobs.length,
  deadPdfLinks: [],
  deadOfficialLinks: [],
  unverifiable: [],
  ok: 0,
};

for (const job of jobs) {
  const links = [
    { field: "official_link", url: job.official_link },
    { field: "notification_pdf_link", url: job.notification_pdf_link },
  ].filter((l) => l.url && l.url.trim());

  for (const link of links) {
    const result = await checkCached(link.url);
    if (result.verdict === "ok") {
      report.ok += 1;
    } else if (result.verdict === "dead") {
      if (link.field === "notification_pdf_link") {
        report.deadPdfLinks.push({ slug: job.slug, title: job.title, url: link.url, reason: result.reason });
      } else {
        report.deadOfficialLinks.push({ slug: job.slug, title: job.title, url: link.url, reason: result.reason });
      }
    } else {
      report.unverifiable.push({ slug: job.slug, field: link.field, url: link.url, reason: result.reason });
    }
  }
}

console.log(
  `Result: ok=${report.ok} deadPdf=${report.deadPdfLinks.length} deadOfficial=${report.deadOfficialLinks.length} unverifiable=${report.unverifiable.length}`,
);

if (APPLY) {
  for (const item of report.deadPdfLinks) {
    const res = await fetch(
      `${base}/rest/v1/jobs?slug=eq.${encodeURIComponent(item.slug)}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ notification_pdf_link: null }),
      },
    );
    if (!res.ok) {
      console.error(`  FAILED to clear ${item.slug}: HTTP ${res.status}`);
    } else {
      console.log(`  cleared dead PDF link: ${item.slug}`);
    }
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(
  path.join(here, "last-report.json"),
  JSON.stringify(report, null, 2),
);
console.log(`Report written to scripts/link-audit/last-report.json`);
