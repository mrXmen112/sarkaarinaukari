#!/usr/bin/env node
/**
 * Phase 8A.4 — export the unverified job backlog to CSV for manual checking.
 *
 * Produces reports/unverified-jobs.csv with one row per job that is NOT yet
 * verified, including the fields needed to check it by hand plus the link
 * validator's verdict, so the review can be done against official sites
 * without opening the admin panel.
 *
 * Reads only. Run it AFTER migration 0017 has been applied.
 *
 * Usage:
 *   node scripts/export-unverified.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const out = {};
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const raw = fs.readFileSync(path.join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.trimStart().startsWith("#")) {
        out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
  } catch {
    /* fall back to process.env */
  }
  return out;
}

const env = loadEnvLocal();
const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(URL_BASE, KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Prefer the SQL view from migration 0017. Fall back to a direct read so the
 * script still produces something useful if the view has not been created yet.
 *
 * If the `verification_status` column itself is missing (migration 0017 not
 * applied yet) we fall back to treating EVERY published job as unverified.
 * That is not a guess: the live data has no provenance column and every row
 * was bulk-seeded, so "not yet verified" is the honest answer for all of them.
 */
const JOB_COLS =
  "slug,title,department,state,vacancy_total,application_end,official_link," +
  "source_url,link_flagged,link_http_status,link_last_checked_at," +
  "verification_status,status,created_at";

/** Same list minus verification_status, for the pre-migration fallback. */
const JOB_COLS_PRE_0017 =
  "slug,title,department,state,vacancy_total,application_end,official_link," +
  "source_url,link_flagged,link_http_status,link_last_checked_at," +
  "status,created_at";

const toReportRow = (j) => ({
  ...j,
  claimed_vacancy: j.vacancy_total,
  claimed_last_date: j.application_end ? String(j.application_end).slice(0, 10) : "",
  link_status: j.link_flagged
    ? "flagged_dead"
    : j.link_last_checked_at
      ? `http_${j.link_http_status ?? "null"}`
      : "never_checked",
});

let rows = [];
let source = "";

const { data: viewRows, error: viewErr } = await db
  .from("unverified_jobs_report")
  .select("*")
  .limit(5000);

if (!viewErr && viewRows?.length) {
  rows = viewRows;
  source = "unverified_jobs_report view";
} else {
  const { data, error } = await db
    .from("jobs")
    .select(JOB_COLS)
    .eq("is_published", true)
    .neq("verification_status", "verified")
    .limit(5000);

  if (!error && data) {
    rows = data.map(toReportRow);
    source = "direct jobs read (view missing)";
  } else {
    // Column not present -> migration 0017 has not run. Everything is pending.
    const alt = await db
      .from("jobs")
      .select(JOB_COLS_PRE_0017)
      .eq("is_published", true)
      .limit(5000);
    if (alt.error) {
      console.error("query failed:", alt.error.message);
      process.exit(1);
    }
    rows = (alt.data ?? []).map((j) =>
      toReportRow({ ...j, verification_status: "unverified" }),
    );
    source =
      "FALLBACK: all published jobs (migration 0017 not applied yet, so nothing is verified)";
  }
}

if (!rows.length) {
  console.log("No unverified jobs — nothing to export.");
  process.exit(0);
}

const HEADERS = [
  "slug",
  "title",
  "department",
  "state",
  "claimed_last_date",
  "claimed_vacancy",
  "official_link",
  "source_url",
  "link_status",
  "verification_status",
  "status",
  "created_at",
];

/** RFC 4180 escaping: quote when the value contains a comma, quote or newline. */
function cell(v) {
  if (v === null || v === undefined) return '""';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const lines = [HEADERS.join(",")];
for (const r of rows) lines.push(HEADERS.map((h) => cell(r[h])).join(","));

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "reports");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "unverified-jobs.csv");
fs.writeFileSync(outFile, `${lines.join("\r\n")}\r\n`, "utf8");

console.log(`Wrote ${rows.length} row(s) to reports/unverified-jobs.csv`);
console.log(`  source: ${source}`);

const byStatus = {};
for (const r of rows) {
  const k = r.verification_status ?? "unknown";
  byStatus[k] = (byStatus[k] ?? 0) + 1;
}
console.log("  by verification_status:");
for (const [k, n] of Object.entries(byStatus)) console.log(`    ${k}: ${n}`);

const byLink = {};
for (const r of rows) {
  const k = r.link_status ?? "unknown";
  byLink[k] = (byLink[k] ?? 0) + 1;
}
console.log("  by link_status:");
for (const [k, n] of Object.entries(byLink).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k}: ${n}`);
}
