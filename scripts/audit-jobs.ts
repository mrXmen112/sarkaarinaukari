#!/usr/bin/env node
/**
 * 2026-10 audit — read-only jobs data health report.
 *
 * Flags the rows whose vacancy/salary figures cannot be trusted without a
 * human check. The same rules live in src/lib/jobAudit.ts, which the job page
 * and listing table use, so the report and the public UI cannot disagree.
 *
 * Usage:
 *   npm run audit:jobs
 *
 * Writes reports/jobs-audit.json. Never writes to the database.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { auditJob, type JobAuditFlag } from "../src/lib/jobAudit.ts";

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
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
const url = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).replace(/\/$/, "");
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  env.SUPABASE_SERVICE_ROLE_KEY ??
  "";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COLUMNS = [
  "slug",
  "title",
  "type",
  "status",
  "is_published",
  "vacancy_total",
  "vacancy_breakdown",
  "pay_scale",
  "source_verified",
  "official_link",
  "source_url",
  "official_notification_url",
  "last_verified_at",
  "published_at",
  "updated_at",
  "application_start",
  "application_end",
  "link_flagged",
  "verification_status",
].join(",");

const { data, error } = await db
  .from("jobs")
  .select(COLUMNS)
  .eq("is_published", true)
  .eq("type", "job")
  .order("slug", { ascending: true });

if (error) {
  console.error("query failed:", error.message);
  process.exit(1);
}

type Row = Parameters<typeof auditJob>[0] & {
  slug: string;
  title: string;
  status: string;
  link_flagged: boolean;
  verification_status: string;
};

const rows = (data ?? []) as unknown as Row[];
const report = rows.map((row) => {
  const audit = auditJob(row);
  return {
    slug: row.slug,
    title: row.title,
    status: row.status,
    link_flagged: row.link_flagged,
    verification_status: row.verification_status,
    vacancy_total: row.vacancy_total ?? null,
    pay_scale: row.pay_scale ?? null,
    ...audit,
  };
});

const failing = report.filter((r) => r.failsAudit);
const flagCounts = new Map<JobAuditFlag, number>();
for (const row of report) {
  for (const flag of row.blocking) {
    flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
  }
  for (const flag of row.warnings) {
    flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "reports");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "jobs-audit.json");
fs.writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      rows: report.length,
      failing: failing.length,
      flagCounts: Object.fromEntries(
        [...flagCounts.entries()].sort((a, b) => b[1] - a[1]),
      ),
      failingRows: failing,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Audited ${report.length} published job row(s).`);
console.log(`Failing audit (figures withheld): ${failing.length}`);
console.log("Flag counts:");
for (const [flag, count] of [...flagCounts.entries()].sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`  ${flag.padEnd(28)} ${count}`);
}
console.log(`\nWrote ${path.relative(process.cwd(), outFile)}`);
